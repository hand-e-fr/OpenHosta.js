/**
 * TypeScript Transformer for OpenHosta
 *
 * This transformer enables Python-like syntax by:
 * 1. Auto-injecting setHostaSignature() for functions that call emulate()
 * 2. Auto-injecting arguments into emulate() calls
 *
 * BEFORE:
 * ```typescript
 * function translate(text: string, language: string): string {
 *   return emulate();
 * }
 * ```
 *
 * AFTER:
 * ```typescript
 * function translate(text: string, language: string): string {
 *   return emulate({ args: { text, language } });
 * }
 * setHostaSignature(translate, {
 *   doc: "Translates text...",
 *   args: [{ name: "text", type: "string" }, { name: "language", type: "string" }],
 *   type: "string"
 * });
 * ```
 */

import * as ts from 'typescript';

interface TransformerConfig {
  /** Generate .hosta.json metadata files */
  generateMetadata?: boolean;

  /** Auto-inject arguments into emulate() calls */
  injectArguments?: boolean;

  /** Auto-inject setHostaSignature() calls */
  injectSignatures?: boolean;

  /** Verbose logging */
  verbose?: boolean;
}

const DEFAULT_CONFIG: TransformerConfig = {
  generateMetadata: false,
  injectArguments: true,
  injectSignatures: true,
  verbose: false
};

/**
 * Extract JSDoc comment from a function
 */
function extractJSDoc(node: ts.FunctionDeclaration | ts.MethodDeclaration): string | undefined {
  const jsDocTags = ts.getJSDocCommentsAndTags(node);
  if (jsDocTags.length === 0) return undefined;

  const firstComment = jsDocTags[0];
  if (ts.isJSDoc(firstComment)) {
    const comment = firstComment.comment;
    if (typeof comment === 'string') {
      return comment;
    } else if (comment) {
      // Handle JSDocComment array
      return comment.map(part => part.text).join('');
    }
  }

  return undefined;
}

/**
 * Extract parameter information from function
 */
function extractParameters(node: ts.FunctionDeclaration | ts.MethodDeclaration): Array<{
  name: string;
  type: string;
}> {
  return node.parameters.map(param => {
    const name = param.name.getText();
    const type = param.type?.getText() || 'unknown';
    return { name, type };
  });
}

/**
 * Extract return type from function
 */
function extractReturnType(node: ts.FunctionDeclaration | ts.MethodDeclaration): string {
  if (node.type) {
    return node.type.getText();
  }
  return 'unknown';
}

/**
 * Check if a function body contains a call to emulate()
 */
function containsEmulateCall(node: ts.FunctionDeclaration | ts.MethodDeclaration): boolean {
  if (!node.body) return false;

  let hasEmulateCall = false;

  function visit(n: ts.Node) {
    if (ts.isCallExpression(n)) {
      const expression = n.expression;
      if (ts.isIdentifier(expression) && expression.text === 'emulate') {
        hasEmulateCall = true;
      }
    }
    ts.forEachChild(n, visit);
  }

  visit(node.body);
  return hasEmulateCall;
}

/**
 * Find emulate() call expressions in function body
 */
function findEmulateCalls(body: ts.Block): ts.CallExpression[] {
  const calls: ts.CallExpression[] = [];

  function visit(node: ts.Node) {
    if (ts.isCallExpression(node)) {
      const expression = node.expression;
      if (ts.isIdentifier(expression) && expression.text === 'emulate') {
        calls.push(node);
      }
    }
    ts.forEachChild(node, visit);
  }

  visit(body);
  return calls;
}

/**
 * Create setHostaSignature() call statement
 */
function createSetHostaSignatureCall(
  factory: ts.NodeFactory,
  functionName: string,
  doc: string | undefined,
  args: Array<{ name: string; type: string }>,
  returnType: string
): ts.ExpressionStatement {
  // Build args array
  const argsArray = factory.createArrayLiteralExpression(
    args.map(arg =>
      factory.createObjectLiteralExpression([
        factory.createPropertyAssignment(
          factory.createIdentifier('name'),
          factory.createStringLiteral(arg.name)
        ),
        factory.createPropertyAssignment(
          factory.createIdentifier('type'),
          factory.createStringLiteral(arg.type)
        )
      ], true)
    ),
    true
  );

  // Build signature object
  const properties: ts.ObjectLiteralElementLike[] = [];

  if (doc) {
    properties.push(
      factory.createPropertyAssignment(
        factory.createIdentifier('doc'),
        factory.createStringLiteral(doc)
      )
    );
  }

  properties.push(
    factory.createPropertyAssignment(
      factory.createIdentifier('args'),
      argsArray
    )
  );

  properties.push(
    factory.createPropertyAssignment(
      factory.createIdentifier('type'),
      factory.createStringLiteral(returnType)
    )
  );

  const signatureObject = factory.createObjectLiteralExpression(properties, true);

  // Create call: setHostaSignature(functionName, { ... })
  const callExpression = factory.createCallExpression(
    factory.createIdentifier('setHostaSignature'),
    undefined,
    [
      factory.createIdentifier(functionName),
      signatureObject
    ]
  );

  return factory.createExpressionStatement(callExpression);
}

/**
 * Transform emulate() call to include arguments
 */
function transformEmulateCall(
  factory: ts.NodeFactory,
  call: ts.CallExpression,
  params: Array<{ name: string; type: string }>
): ts.CallExpression {
  // Check if already has arguments
  if (call.arguments.length > 0) {
    // Already has arguments, don't transform
    return call;
  }

  // Create args object: { text, language }
  const argsProperties = params.map(param =>
    factory.createShorthandPropertyAssignment(
      factory.createIdentifier(param.name),
      undefined
    )
  );

  const argsObject = factory.createObjectLiteralExpression(argsProperties, false);

  // Create config object: { args: { text, language } }
  const configObject = factory.createObjectLiteralExpression([
    factory.createPropertyAssignment(
      factory.createIdentifier('args'),
      argsObject
    )
  ], false);

  // Create new call: emulate({ args: { text, language } })
  return factory.updateCallExpression(
    call,
    call.expression,
    call.typeArguments,
    [configObject]
  );
}

/**
 * Main transformer function
 */
export default function createHostaTransformer(
  program: ts.Program,
  config: TransformerConfig = DEFAULT_CONFIG
): ts.TransformerFactory<ts.SourceFile> {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };

  return (context: ts.TransformationContext) => {
    const factory = context.factory;

    return (sourceFile: ts.SourceFile) => {
      const statementsToAdd: ts.Statement[] = [];

      function visitor(node: ts.Node): ts.Node {
        // Process function declarations
        if (ts.isFunctionDeclaration(node) && node.name) {
          const functionName = node.name.text;

          // Check if function contains emulate() call
          if (containsEmulateCall(node)) {
            if (mergedConfig.verbose) {
              console.log(`[HostaTransformer] Found emulatable function: ${functionName}`);
            }

            // Extract metadata
            const doc = extractJSDoc(node);
            const params = extractParameters(node);
            const returnType = extractReturnType(node);

            // Transform emulate() calls in body
            let transformedNode = node;
            if (mergedConfig.injectArguments && node.body) {
              const emulateCalls = findEmulateCalls(node.body);

              if (emulateCalls.length > 0) {
                const transformBody = (n: ts.Node): ts.Node => {
                  if (ts.isCallExpression(n) && emulateCalls.includes(n)) {
                    return transformEmulateCall(factory, n, params);
                  }
                  return ts.visitEachChild(n, transformBody, context);
                };

                const newBody = ts.visitNode(node.body, transformBody) as ts.Block;
                transformedNode = factory.updateFunctionDeclaration(
                  node,
                  node.modifiers,
                  node.asteriskToken,
                  node.name,
                  node.typeParameters,
                  node.parameters,
                  node.type,
                  newBody
                );
              }
            }

            // Add setHostaSignature() call after function
            if (mergedConfig.injectSignatures) {
              statementsToAdd.push(
                createSetHostaSignatureCall(factory, functionName, doc, params, returnType)
              );
            }

            return transformedNode;
          }
        }

        return ts.visitEachChild(node, visitor, context);
      }

      // Visit all nodes
      const visitedFile = ts.visitNode(sourceFile, visitor) as ts.SourceFile;

      // Add setHostaSignature() calls at the end
      if (statementsToAdd.length > 0) {
        return factory.updateSourceFile(
          visitedFile,
          [...visitedFile.statements, ...statementsToAdd],
          visitedFile.isDeclarationFile,
          visitedFile.referencedFiles,
          visitedFile.typeReferenceDirectives,
          visitedFile.hasNoDefaultLib,
          visitedFile.libReferenceDirectives
        );
      }

      return visitedFile;
    };
  };
}

/**
 * Factory function for use with ts-patch or ttypescript
 */
export function factory(program: ts.Program, config?: TransformerConfig) {
  return createHostaTransformer(program, config);
}
