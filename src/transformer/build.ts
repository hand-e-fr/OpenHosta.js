/**
 * Build script with transformer
 *
 * This script programmatically applies the Hosta transformer during compilation.
 * Use this if you don't want to set up ts-patch or ttypescript.
 */

import * as ts from 'typescript';
import * as path from 'path';
import * as fs from 'fs';
import createHostaTransformer from './hostaTransformer.js';

interface BuildConfig {
  projectPath?: string;
  verbose?: boolean;
  generateMetadata?: boolean;
}

/**
 * Build TypeScript project with Hosta transformer
 */
export function buildWithTransformer(config: BuildConfig = {}) {
  const {
    projectPath = './tsconfig.json',
    verbose = false,
    generateMetadata = false
  } = config;

  // Read tsconfig
  const configPath = ts.findConfigFile(
    path.dirname(projectPath),
    ts.sys.fileExists,
    path.basename(projectPath)
  );

  if (!configPath) {
    throw new Error(`Could not find tsconfig.json at ${projectPath}`);
  }

  // Parse tsconfig
  const configFile = ts.readConfigFile(configPath, ts.sys.readFile);
  const parsedConfig = ts.parseJsonConfigFileContent(
    configFile.config,
    ts.sys,
    path.dirname(configPath)
  );

  // Create program
  const program = ts.createProgram({
    rootNames: parsedConfig.fileNames,
    options: parsedConfig.options
  });

  // Get transformer
  const transformer = createHostaTransformer(program, {
    verbose,
    generateMetadata,
    injectArguments: true,
    injectSignatures: true
  });

  // Emit with transformer
  const emitResult = program.emit(
    undefined,
    undefined,
    undefined,
    undefined,
    {
      before: [transformer]
    }
  );

  // Collect diagnostics
  const allDiagnostics = ts
    .getPreEmitDiagnostics(program)
    .concat(emitResult.diagnostics);

  // Print diagnostics
  allDiagnostics.forEach(diagnostic => {
    if (diagnostic.file) {
      const { line, character } = ts.getLineAndCharacterOfPosition(
        diagnostic.file,
        diagnostic.start!
      );
      const message = ts.flattenDiagnosticMessageText(
        diagnostic.messageText,
        '\n'
      );
      console.log(
        `${diagnostic.file.fileName} (${line + 1},${character + 1}): ${message}`
      );
    } else {
      console.log(
        ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n')
      );
    }
  });

  const exitCode = emitResult.emitSkipped ? 1 : 0;

  if (exitCode === 0) {
    console.log('✅ Build successful with Hosta transformer!');
  } else {
    console.log('❌ Build failed');
  }

  return exitCode;
}

/**
 * CLI entry point
 */
if (require.main === module) {
  const args = process.argv.slice(2);
  const verbose = args.includes('--verbose') || args.includes('-v');
  const generateMetadata = args.includes('--metadata') || args.includes('-m');

  const projectPath = args.find(arg => !arg.startsWith('-')) || './tsconfig.json';

  console.log('🔨 Building with Hosta transformer...');
  console.log(`   Project: ${projectPath}`);
  console.log(`   Verbose: ${verbose}`);
  console.log(`   Generate metadata: ${generateMetadata}`);
  console.log('');

  const exitCode = buildWithTransformer({
    projectPath,
    verbose,
    generateMetadata
  });

  process.exit(exitCode);
}
