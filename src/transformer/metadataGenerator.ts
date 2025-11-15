/**
 * Metadata Generator for OpenHosta
 *
 * Generates .hosta.json files alongside source files containing
 * function metadata (docs, types, parameters) for runtime use.
 */

import * as ts from 'typescript';
import * as fs from 'fs';
import * as path from 'path';

interface FunctionMetadata {
  name: string;
  doc?: string;
  args: Array<{ name: string; type: string }>;
  returnType: string;
}

interface FileMetadata {
  [functionName: string]: Omit<FunctionMetadata, 'name'>;
}

/**
 * Extract JSDoc comment from a node
 */
function extractJSDoc(node: ts.Node): string | undefined {
  const jsDocTags = ts.getJSDocCommentsAndTags(node);
  if (jsDocTags.length === 0) return undefined;

  const firstComment = jsDocTags[0];
  if (ts.isJSDoc(firstComment)) {
    const comment = firstComment.comment;
    if (typeof comment === 'string') {
      return comment;
    } else if (comment) {
      return comment.map(part => part.text).join('');
    }
  }

  return undefined;
}

/**
 * Check if function contains emulate() call
 */
function containsEmulateCall(node: ts.FunctionDeclaration | ts.MethodDeclaration): boolean {
  if (!node.body) return false;

  let hasEmulate = false;

  function visit(n: ts.Node) {
    if (ts.isCallExpression(n)) {
      const expr = n.expression;
      if (ts.isIdentifier(expr) && expr.text === 'emulate') {
        hasEmulate = true;
      }
    }
    ts.forEachChild(n, visit);
  }

  visit(node.body);
  return hasEmulate;
}

/**
 * Extract metadata from a function
 */
function extractFunctionMetadata(node: ts.FunctionDeclaration): FunctionMetadata | null {
  if (!node.name) return null;

  // Only process functions that call emulate()
  if (!containsEmulateCall(node)) return null;

  const name = node.name.text;
  const doc = extractJSDoc(node);

  const args = node.parameters.map(param => ({
    name: param.name.getText(),
    type: param.type?.getText() || 'unknown'
  }));

  const returnType = node.type?.getText() || 'unknown';

  return { name, doc, args, returnType };
}

/**
 * Generate metadata for a source file
 */
export function generateFileMetadata(sourceFile: ts.SourceFile): FileMetadata {
  const metadata: FileMetadata = {};

  function visit(node: ts.Node) {
    if (ts.isFunctionDeclaration(node)) {
      const fnMeta = extractFunctionMetadata(node);
      if (fnMeta) {
        const { name, ...rest } = fnMeta;
        metadata[name] = rest;
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return metadata;
}

/**
 * Generate .hosta.json file for a source file
 */
export function generateMetadataFile(
  sourceFilePath: string,
  outputDir?: string
): void {
  // Read source file
  const program = ts.createProgram([sourceFilePath], {
    target: ts.ScriptTarget.ES2020,
    module: ts.ModuleKind.ESNext
  });

  const sourceFile = program.getSourceFile(sourceFilePath);
  if (!sourceFile) {
    console.error(`Could not read source file: ${sourceFilePath}`);
    return;
  }

  // Generate metadata
  const metadata = generateFileMetadata(sourceFile);

  // Skip if no metadata
  if (Object.keys(metadata).length === 0) {
    return;
  }

  // Determine output path
  const dir = outputDir || path.dirname(sourceFilePath);
  const basename = path.basename(sourceFilePath, path.extname(sourceFilePath));
  const outputPath = path.join(dir, `${basename}.hosta.json`);

  // Write file
  fs.writeFileSync(outputPath, JSON.stringify(metadata, null, 2), 'utf8');
  console.log(`Generated metadata: ${outputPath}`);
}

/**
 * Generate metadata for all TypeScript files in a directory
 */
export function generateMetadataForDirectory(
  dirPath: string,
  outputDir?: string,
  recursive: boolean = true
): void {
  const files = fs.readdirSync(dirPath);

  for (const file of files) {
    const filePath = path.join(dirPath, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory() && recursive) {
      generateMetadataForDirectory(filePath, outputDir, recursive);
    } else if (file.endsWith('.ts') && !file.endsWith('.d.ts')) {
      generateMetadataFile(filePath, outputDir);
    }
  }
}

/**
 * CLI entry point
 */
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log(`
Usage:
  node metadataGenerator.js <file-or-directory> [output-dir]

Examples:
  node metadataGenerator.js src/myFile.ts
  node metadataGenerator.js src/ dist/
    `);
    process.exit(1);
  }

  const inputPath = args[0];
  const outputDir = args[1];

  const stat = fs.statSync(inputPath);
  if (stat.isDirectory()) {
    generateMetadataForDirectory(inputPath, outputDir);
  } else {
    generateMetadataFile(inputPath, outputDir);
  }
}
