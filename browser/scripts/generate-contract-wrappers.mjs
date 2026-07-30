#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const browserRoot = process.cwd();

async function loadTypescript() {
  const candidates = [
    path.join(browserRoot, 'node_modules/typescript/lib/typescript.js'),
    path.join(browserRoot, 'frontend/node_modules/typescript/lib/typescript.js'),
    path.join(browserRoot, '../engine-wasm/host-sample/node_modules/typescript/lib/typescript.js')
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      const mod = await import(pathToFileURL(candidate).href);
      return mod.default ?? mod;
    }
  }
  throw new Error('Unable to load TypeScript runtime for contract wrapper codegen');
}

const ts = await loadTypescript();
const factory = ts.factory;

function readSourceFile(filePath) {
  const text = fs.readFileSync(filePath, 'utf8');
  return ts.createSourceFile(filePath, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
}

function hasExportModifier(node) {
  return Boolean(node.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword));
}

function collectExportedTypeNames(filePath) {
  const source = readSourceFile(filePath);
  const exported = [];
  for (const stmt of source.statements) {
    if (!hasExportModifier(stmt)) {
      continue;
    }
    if (
      ts.isTypeAliasDeclaration(stmt) ||
      ts.isInterfaceDeclaration(stmt) ||
      ts.isEnumDeclaration(stmt)
    ) {
      exported.push(stmt.name.text);
    }
  }
  return exported.sort();
}

function collectExportedValueNames(filePath) {
  const source = readSourceFile(filePath);
  const exported = [];
  for (const stmt of source.statements) {
    if (!hasExportModifier(stmt) || !ts.isVariableStatement(stmt)) {
      continue;
    }
    for (const declaration of stmt.declarationList.declarations) {
      if (ts.isIdentifier(declaration.name)) {
        exported.push(declaration.name.text);
      }
    }
  }
  return exported.sort();
}

function ensureRequired(name, values, required) {
  const missing = required.filter((item) => !values.includes(item));
  if (missing.length) {
    throw new Error(`${name} missing required exports: ${missing.join(', ')}`);
  }
}

function loadCommandContract(filePath) {
  const contract = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  if (contract.schemaVersion !== 1 || !Array.isArray(contract.commands)) {
    throw new Error('tauri-command-contract.json has an unsupported schema');
  }

  const commandNames = new Set();
  const clientMethods = new Set();
  const facadeMethods = new Set();
  const validSources = new Set(['primitive', 'applicationState', 'engine', 'transport']);
  for (const command of contract.commands) {
    if (!command.command || !command.clientMethod || !command.response) {
      throw new Error('tauri-command-contract.json contains an incomplete command');
    }
    if (commandNames.has(command.command)) {
      throw new Error(`duplicate Tauri command: ${command.command}`);
    }
    if (clientMethods.has(command.clientMethod)) {
      throw new Error(`duplicate Tauri client method: ${command.clientMethod}`);
    }
    if (!validSources.has(command.response.source)) {
      throw new Error(`unsupported response type source: ${command.response.source}`);
    }
    if (command.parameter && !validSources.has(command.parameter.type?.source)) {
      throw new Error(`unsupported parameter type source for ${command.command}`);
    }
    if (command.facadeMethod) {
      const facadeKey = `${command.facadeMethod.facade}:${command.facadeMethod.method}`;
      if (!['engine', 'transport'].includes(command.facadeMethod.facade)) {
        throw new Error(`unsupported facade for ${command.command}`);
      }
      if (facadeMethods.has(facadeKey)) {
        throw new Error(`duplicate facade method: ${facadeKey}`);
      }
      facadeMethods.add(facadeKey);
    }
    commandNames.add(command.command);
    clientMethods.add(command.clientMethod);
  }
  return contract.commands;
}

function commandMethodSpec(command, methodName = command.clientMethod) {
  return {
    name: methodName,
    command: command.command,
    returns: command.response.name,
    param: command.parameter
      ? { name: command.parameter.name, type: command.parameter.type.name }
      : undefined
  };
}

function typeImportsFor(commands, source) {
  const imports = new Set();
  for (const command of commands) {
    if (command.response.source === source) {
      imports.add(command.response.name);
    }
    if (command.parameter?.type.source === source) {
      imports.add(command.parameter.type.name);
    }
  }
  return [...imports].sort();
}

function writeIfChanged(filePath, content) {
  const current = fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf8') : '';
  if (current !== content) {
    fs.writeFileSync(filePath, content);
    console.log(`generated ${path.relative(browserRoot, filePath)}`);
  }
}

function printStatements(statements) {
  const sourceFile = ts.createSourceFile(
    'generated.ts',
    '',
    ts.ScriptTarget.Latest,
    false,
    ts.ScriptKind.TS
  );
  const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed });
  const generated = factory.createSourceFile(
    statements,
    factory.createToken(ts.SyntaxKind.EndOfFileToken),
    ts.NodeFlags.None
  );
  return printer.printFile(generated, sourceFile);
}

function withHeader(body, generator) {
  return `// AUTO-GENERATED FILE. DO NOT EDIT.\n// Generated by: ${generator}\n\n${body}`;
}

function id(name) {
  return factory.createIdentifier(name);
}

function keyword(kind) {
  return factory.createKeywordTypeNode(kind);
}

function typeRef(name, typeArgs) {
  return factory.createTypeReferenceNode(id(name), typeArgs);
}

function promiseOf(typeNode) {
  return typeRef('Promise', [typeNode]);
}

function typeParam(name, constraint) {
  return factory.createTypeParameterDeclaration(undefined, id(name), constraint);
}

function methodSignature(spec) {
  const parameters = spec.param
    ? [
        factory.createParameterDeclaration(
          undefined,
          undefined,
          id(spec.param.name),
          undefined,
          typeRef(spec.param.type),
          undefined
        )
      ]
    : [];
  return factory.createMethodSignature(
    undefined,
    id(spec.name),
    undefined,
    undefined,
    parameters,
    promiseOf(typeRef(spec.returns))
  );
}

function makeInterface(name, methods) {
  return factory.createInterfaceDeclaration(
    [factory.createModifier(ts.SyntaxKind.ExportKeyword)],
    id(name),
    undefined,
    undefined,
    methods.map(methodSignature)
  );
}

function exportTypeFrom(names, modulePath) {
  return factory.createExportDeclaration(
    undefined,
    true,
    factory.createNamedExports(
      names.map((name) => factory.createExportSpecifier(false, undefined, id(name)))
    ),
    factory.createStringLiteral(modulePath),
    undefined
  );
}

function exportValueFrom(names, modulePath) {
  return factory.createExportDeclaration(
    undefined,
    false,
    factory.createNamedExports(
      names.map((name) => factory.createExportSpecifier(false, undefined, id(name)))
    ),
    factory.createStringLiteral(modulePath),
    undefined
  );
}

function importType(modulePath, typeName) {
  return factory.createImportTypeNode(
    factory.createLiteralTypeNode(factory.createStringLiteral(modulePath)),
    undefined,
    id(typeName),
    undefined
  );
}

function appendInterfaces(filePath, interfaces) {
  let current = fs.readFileSync(filePath, 'utf8');
  const interfaceNames = interfaces.map((iface) => iface.name.text);
  for (const interfaceName of interfaceNames) {
    const pattern = new RegExp(`\\nexport interface ${interfaceName} \\{[\\s\\S]*?\\n\\}\\n?`, 'g');
    current = current.replace(pattern, '\n');
  }
  current = current.trimEnd();
  const interfaceBlock = printStatements(interfaces).trim();
  writeIfChanged(filePath, `${current}\n\n${interfaceBlock}\n`);
}

function createInvokeMethodProperty(spec) {
  const parameters = spec.param
    ? [
        factory.createParameterDeclaration(
          undefined,
          undefined,
          id(spec.param.name),
          undefined,
          undefined,
          undefined
        )
      ]
    : [];
  const invokeArgs = [factory.createStringLiteral(spec.command)];
  if (spec.param) {
    invokeArgs.push(
      factory.createObjectLiteralExpression(
        [factory.createShorthandPropertyAssignment(id(spec.param.name), undefined)],
        false
      )
    );
  }
  return factory.createPropertyAssignment(
    id(spec.name),
    factory.createArrowFunction(
      undefined,
      undefined,
      parameters,
      undefined,
      factory.createToken(ts.SyntaxKind.EqualsGreaterThanToken),
      factory.createCallExpression(id('invokeFn'), [typeRef(spec.returns)], invokeArgs)
    )
  );
}

function createTypeOnlyImport(names, modulePath) {
  return factory.createImportDeclaration(
    undefined,
    factory.createImportClause(
      false,
      undefined,
      factory.createNamedImports(
        names.map((name) => factory.createImportSpecifier(true, undefined, id(name)))
      )
    ),
    factory.createStringLiteral(modulePath),
    undefined
  );
}

function generateTauriClient(filePath, commands) {
  const applicationStateImports = typeImportsFor(commands, 'applicationState');
  const engineImports = typeImportsFor(commands, 'engine');
  const transportImports = typeImportsFor(commands, 'transport');
  const methods = commands.map((command) => commandMethodSpec(command));

  const tauriInvoke = factory.createTypeAliasDeclaration(
    [factory.createModifier(ts.SyntaxKind.ExportKeyword)],
    id('TauriInvoke'),
    undefined,
    factory.createFunctionTypeNode(
      [typeParam('T')],
      [
        factory.createParameterDeclaration(
          undefined,
          undefined,
          id('command'),
          undefined,
          keyword(ts.SyntaxKind.StringKeyword),
          undefined
        ),
        factory.createParameterDeclaration(
          undefined,
          undefined,
          id('args'),
          factory.createToken(ts.SyntaxKind.QuestionToken),
          typeRef('Record', [
            keyword(ts.SyntaxKind.StringKeyword),
            keyword(ts.SyntaxKind.UnknownKeyword)
          ]),
          undefined
        )
      ],
      promiseOf(typeRef('T'))
    )
  );

  const tauriHostClient = makeInterface(
    'TauriHostClient',
    methods.map((method) => ({
      name: method.name,
      returns: method.returns,
      param: method.param
    }))
  );

  const createClient = factory.createVariableStatement(
    [factory.createModifier(ts.SyntaxKind.ExportKeyword)],
    factory.createVariableDeclarationList(
      [
        factory.createVariableDeclaration(
          id('createTauriHostClient'),
          undefined,
          undefined,
          factory.createArrowFunction(
            undefined,
            undefined,
            [
              factory.createParameterDeclaration(
                undefined,
                undefined,
                id('invokeFn'),
                undefined,
                typeRef('TauriInvoke'),
                undefined
              )
            ],
            typeRef('TauriHostClient'),
            factory.createToken(ts.SyntaxKind.EqualsGreaterThanToken),
            factory.createObjectLiteralExpression(methods.map(createInvokeMethodProperty), true)
          )
        )
      ],
      ts.NodeFlags.Const
    )
  );

  const statements = [
    createTypeOnlyImport(applicationStateImports, './application-state-host'),
    createTypeOnlyImport(engineImports, './engine-host'),
    createTypeOnlyImport(transportImports, './transport-host'),
    tauriInvoke,
    tauriHostClient,
    createClient
  ];

  writeIfChanged(
    filePath,
    withHeader(printStatements(statements), 'node ./scripts/generate-contract-wrappers.mjs')
  );
}

function generateApplicationStateWrapper(filePath, exportedTypes, exportedValues) {
  const statements = [
    exportValueFrom(exportedValues, './generated/application-state-host'),
    exportTypeFrom(exportedTypes, './generated/application-state-host')
  ];

  writeIfChanged(
    filePath,
    withHeader(printStatements(statements), 'node ./scripts/generate-contract-wrappers.mjs')
  );
}

function generateEngineWrapper(filePath, engineExportedTypes, engineExportedValues) {
  const statements = [
    exportValueFrom(engineExportedValues, './generated/engine-host'),
    exportTypeFrom(engineExportedTypes, './generated/engine-host'),
    factory.createTypeAliasDeclaration(
      [factory.createModifier(ts.SyntaxKind.ExportKeyword)],
      id('WmlDeckInput'),
      undefined,
      importType('./generated/engine-host', 'LoadDeckContextRequest')
    ),
    factory.createTypeAliasDeclaration(
      [factory.createModifier(ts.SyntaxKind.ExportKeyword)],
      id('ScriptDialogRequest'),
      undefined,
      importType('./generated/engine-host', 'ScriptDialogRequestSnapshot')
    ),
    factory.createTypeAliasDeclaration(
      [factory.createModifier(ts.SyntaxKind.ExportKeyword)],
      id('ScriptTimerRequest'),
      undefined,
      importType('./generated/engine-host', 'ScriptTimerRequestSnapshot')
    )
  ];

  writeIfChanged(
    filePath,
    withHeader(printStatements(statements), 'node ./scripts/generate-contract-wrappers.mjs')
  );
}

function generateTransportWrapper(filePath, transportExportedTypes) {
  const statements = [
    exportTypeFrom(transportExportedTypes, './generated/transport-host'),
    factory.createTypeAliasDeclaration(
      [factory.createModifier(ts.SyntaxKind.ExportKeyword)],
      id('FetchRequest'),
      undefined,
      importType('./generated/transport-host', 'FetchDeckRequest')
    ),
    exportTypeFrom(
      [
        'EngineDeckInput',
        'FetchResponse',
        'HostHistoryEntry',
        'HostHistoryRequestIdentity',
        'HostNavigationSource',
        'HostSessionState',
        'RawPayload',
        'RunMode',
        'TimingMs',
        'TransportErrorInfo'
      ],
      './transport-app'
    )
  ];

  writeIfChanged(
    filePath,
    withHeader(printStatements(statements), 'node ./scripts/generate-contract-wrappers.mjs')
  );
}

const generatedDir = path.join(browserRoot, 'contracts', 'generated');
const contractsDir = path.join(browserRoot, 'contracts');
fs.mkdirSync(contractsDir, { recursive: true });

const applicationStateGeneratedPath = path.join(generatedDir, 'application-state-host.ts');
const engineGeneratedPath = path.join(generatedDir, 'engine-host.ts');
const transportGeneratedPath = path.join(generatedDir, 'transport-host.ts');
const tauriClientPath = path.join(generatedDir, 'tauri-host-client.ts');
const tauriCommandContractPath = path.join(generatedDir, 'tauri-command-contract.json');
const applicationStateWrapperPath = path.join(contractsDir, 'application-state.ts');
const engineWrapperPath = path.join(contractsDir, 'engine.ts');
const transportWrapperPath = path.join(contractsDir, 'transport.ts');

const applicationStateExportedTypes = collectExportedTypeNames(applicationStateGeneratedPath);
const applicationStateExportedValues = collectExportedValueNames(applicationStateGeneratedPath);
const engineExportedTypes = collectExportedTypeNames(engineGeneratedPath);
const engineExportedValues = collectExportedValueNames(engineGeneratedPath);
const transportExportedTypes = collectExportedTypeNames(transportGeneratedPath);
const commands = loadCommandContract(tauriCommandContractPath);
const commandApplicationStateTypes = typeImportsFor(commands, 'applicationState');
const commandEngineTypes = typeImportsFor(commands, 'engine');
const commandTransportTypes = typeImportsFor(commands, 'transport');

ensureRequired('application-state-host.ts', applicationStateExportedTypes, [
  'ApplicationStateLoadResult',
  'ApplicationStateV1',
  'ClearApplicationStateComponentRequest',
  'SaveApplicationStateRequest'
]);
ensureRequired('application-state-host.ts values', applicationStateExportedValues, [
  'APPLICATION_STATE_ALLOWED_NETWORK_SCHEMES',
  'APPLICATION_STATE_SAFE_KEYS',
  'APPLICATION_STATE_SCHEMA_VERSION',
  'APPLICATION_STATE_SENSITIVE_QUERY_KEYS',
  'DEFAULT_APPLICATION_STATE_V1'
]);
ensureRequired('engine-host.ts', engineExportedTypes, [
  'EngineDebugConnector',
  'EngineDebugEvent',
  'EngineDebugSnapshot',
  'EngineDebugOpenSessionOutcome',
  'EngineFrame',
  'LoadDeckContextRequest',
  'ScriptDialogRequestSnapshot',
  'ScriptTimerRequestSnapshot'
]);
ensureRequired('engine-host.ts values', engineExportedValues, [
  'ENGINE_DEBUG_CONTRACT_BASELINE',
  'SCRIPT_ERROR_CATEGORY_LABELS'
]);
ensureRequired('transport-host.ts', transportExportedTypes, ['FetchDeckRequest']);
ensureRequired(
  'application-state-host.ts command types',
  applicationStateExportedTypes,
  commandApplicationStateTypes
);
ensureRequired('engine-host.ts command types', engineExportedTypes, commandEngineTypes);
ensureRequired('transport-host.ts command types', transportExportedTypes, commandTransportTypes);

appendInterfaces(engineGeneratedPath, [
  makeInterface(
    'EngineHostClient',
    commands
      .filter((command) => command.facadeMethod?.facade === 'engine')
      .map((command) => commandMethodSpec(command, command.facadeMethod.method))
  )
]);

appendInterfaces(transportGeneratedPath, [
  makeInterface(
    'TransportClient',
    commands
      .filter((command) => command.facadeMethod?.facade === 'transport')
      .map((command) => commandMethodSpec(command, command.facadeMethod.method))
  )
]);

const engineExportedTypesWithInterfaces = collectExportedTypeNames(engineGeneratedPath);
const engineExportedValuesWithInterfaces = collectExportedValueNames(engineGeneratedPath);
const transportExportedTypesWithInterfaces = collectExportedTypeNames(transportGeneratedPath);

generateTauriClient(tauriClientPath, commands);
generateApplicationStateWrapper(
  applicationStateWrapperPath,
  applicationStateExportedTypes,
  applicationStateExportedValues
);
generateEngineWrapper(
  engineWrapperPath,
  engineExportedTypesWithInterfaces,
  engineExportedValuesWithInterfaces
);
generateTransportWrapper(transportWrapperPath, transportExportedTypesWithInterfaces);
