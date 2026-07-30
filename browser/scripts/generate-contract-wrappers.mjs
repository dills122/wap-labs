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

function collectTypeDeclarations(filePaths) {
  const declarations = new Map();
  for (const filePath of filePaths) {
    const source = readSourceFile(filePath);
    for (const stmt of source.statements) {
      if (
        hasExportModifier(stmt) &&
        (ts.isTypeAliasDeclaration(stmt) || ts.isInterfaceDeclaration(stmt))
      ) {
        declarations.set(stmt.name.text, stmt);
      }
    }
  }
  return declarations;
}

function ensureRequired(name, values, required) {
  const missing = required.filter((item) => !values.includes(item));
  if (missing.length) {
    throw new Error(`${name} missing required exports: ${missing.join(', ')}`);
  }
}

function loadCommandContract(filePath) {
  const contract = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  if (contract.schemaVersion !== 2 || !contract.error || !Array.isArray(contract.commands)) {
    throw new Error('tauri-command-contract.json has an unsupported schema');
  }

  const commandNames = new Set();
  const clientMethods = new Set();
  const facadeMethods = new Set();
  const validSources = new Set(['primitive', 'applicationState', 'engine', 'host', 'transport']);
  if (!validSources.has(contract.error.source) || contract.error.source !== 'host') {
    throw new Error('tauri-command-contract.json has an unsupported error type source');
  }
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
  return { commands: contract.commands, error: contract.error };
}

function propertyNameText(name) {
  if (ts.isIdentifier(name) || ts.isStringLiteral(name) || ts.isNumericLiteral(name)) {
    return name.text;
  }
  throw new Error(`unsupported runtime contract property name: ${name.getText()}`);
}

function runtimeSchemaForTypeNode(node, referenced) {
  if (ts.isParenthesizedTypeNode(node)) {
    return runtimeSchemaForTypeNode(node.type, referenced);
  }
  switch (node.kind) {
    case ts.SyntaxKind.StringKeyword:
      return { kind: 'string' };
    case ts.SyntaxKind.NumberKeyword:
      return { kind: 'number' };
    case ts.SyntaxKind.BooleanKeyword:
      return { kind: 'boolean' };
    case ts.SyntaxKind.UnknownKeyword:
    case ts.SyntaxKind.AnyKeyword:
      return { kind: 'unknown' };
    case ts.SyntaxKind.NullKeyword:
      return { kind: 'literal', value: null };
    default:
      break;
  }
  if (ts.isLiteralTypeNode(node)) {
    if (node.literal.kind === ts.SyntaxKind.TrueKeyword) {
      return { kind: 'literal', value: true };
    }
    if (node.literal.kind === ts.SyntaxKind.FalseKeyword) {
      return { kind: 'literal', value: false };
    }
    if (ts.isStringLiteral(node.literal)) {
      return { kind: 'literal', value: node.literal.text };
    }
    if (ts.isNumericLiteral(node.literal)) {
      return { kind: 'literal', value: Number(node.literal.text) };
    }
  }
  if (ts.isArrayTypeNode(node)) {
    return { kind: 'array', item: runtimeSchemaForTypeNode(node.elementType, referenced) };
  }
  if (ts.isUnionTypeNode(node)) {
    return {
      kind: 'union',
      anyOf: node.types.map((member) => runtimeSchemaForTypeNode(member, referenced))
    };
  }
  if (ts.isTypeReferenceNode(node)) {
    const name = node.typeName.getText();
    if (name === 'Array' || name === 'ReadonlyArray') {
      if (node.typeArguments?.length !== 1) {
        throw new Error(`${name} runtime contract requires one type argument`);
      }
      return { kind: 'array', item: runtimeSchemaForTypeNode(node.typeArguments[0], referenced) };
    }
    if (name === 'Record') {
      if (node.typeArguments?.length !== 2) {
        throw new Error('Record runtime contract requires two type arguments');
      }
      return { kind: 'record', value: runtimeSchemaForTypeNode(node.typeArguments[1], referenced) };
    }
    referenced.add(name);
    return { kind: 'ref', name };
  }
  if (ts.isTypeLiteralNode(node)) {
    const properties = {};
    const required = [];
    for (const member of node.members) {
      if (!ts.isPropertySignature(member) || !member.type || !member.name) {
        throw new Error(`unsupported runtime contract member: ${member.getText()}`);
      }
      const name = propertyNameText(member.name);
      properties[name] = runtimeSchemaForTypeNode(member.type, referenced);
      if (!member.questionToken) {
        required.push(name);
      }
    }
    return { kind: 'object', required, properties };
  }
  throw new Error(`unsupported runtime contract type: ${node.getText()}`);
}

function compileRuntimeSchemas(commands, hostError, declarationPaths) {
  const declarations = collectTypeDeclarations(declarationPaths);
  const schemas = {};
  const pending = new Set([
    hostError.name,
    ...commands
      .filter((command) => command.response.source !== 'primitive')
      .map((command) => command.response.name)
  ]);
  while (pending.size > 0) {
    const [name] = pending;
    pending.delete(name);
    if (schemas[name]) {
      continue;
    }
    const declaration = declarations.get(name);
    if (!declaration) {
      throw new Error(`runtime contract declaration not found: ${name}`);
    }
    const referenced = new Set();
    const typeNode = ts.isTypeAliasDeclaration(declaration)
      ? declaration.type
      : factory.createTypeLiteralNode([...declaration.members]);
    schemas[name] = runtimeSchemaForTypeNode(typeNode, referenced);
    for (const reference of referenced) {
      if (!schemas[reference]) {
        pending.add(reference);
      }
    }
  }

  const primitiveSchemas = {
    string: { kind: 'string' },
    boolean: { kind: 'boolean' },
    number: { kind: 'number' }
  };
  const responseSchemas = Object.fromEntries(
    commands.map((command) => [
      command.command,
      command.response.source === 'primitive'
        ? primitiveSchemas[command.response.name]
        : { kind: 'ref', name: command.response.name }
    ])
  );
  if (Object.values(responseSchemas).some((schema) => !schema)) {
    throw new Error('runtime contract contains an unsupported primitive response');
  }
  return { schemas, responseSchemas };
}

function renderRuntimeValidators(commands, hostError, declarationPaths) {
  const { schemas, responseSchemas } = compileRuntimeSchemas(
    commands,
    hostError,
    declarationPaths
  );
  return `type RuntimeSchema =
    | { kind: "string" | "number" | "boolean" | "unknown" }
    | { kind: "literal"; value: string | number | boolean | null }
    | { kind: "array"; item: RuntimeSchema }
    | { kind: "record"; value: RuntimeSchema }
    | { kind: "union"; anyOf: RuntimeSchema[] }
    | { kind: "object"; required: string[]; properties: Record<string, RuntimeSchema> }
    | { kind: "ref"; name: string };

const RUNTIME_SCHEMAS: Record<string, RuntimeSchema> = ${JSON.stringify(schemas, null, 2)};
const TAURI_RESPONSE_SCHEMAS: Record<string, RuntimeSchema> = ${JSON.stringify(responseSchemas, null, 2)};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const matchesRuntimeSchema = (schema: RuntimeSchema, value: unknown, depth = 0): boolean => {
  if (depth > 64) return false;
  switch (schema.kind) {
    case "unknown": return true;
    case "string": return typeof value === "string";
    case "number": return typeof value === "number" && Number.isFinite(value);
    case "boolean": return typeof value === "boolean";
    case "literal": return value === schema.value;
    case "array": return Array.isArray(value) && value.every((item) => matchesRuntimeSchema(schema.item, item, depth + 1));
    case "record": return isRecord(value) && Object.values(value).every((item) => matchesRuntimeSchema(schema.value, item, depth + 1));
    case "union": return schema.anyOf.some((candidate) => matchesRuntimeSchema(candidate, value, depth + 1));
    case "ref": {
      const referenced = RUNTIME_SCHEMAS[schema.name];
      return referenced !== undefined && matchesRuntimeSchema(referenced, value, depth + 1);
    }
    case "object":
      return isRecord(value)
        && schema.required.every((key) => Object.hasOwn(value, key))
        && Object.entries(schema.properties).every(([key, propertySchema]) =>
          !Object.hasOwn(value, key) || matchesRuntimeSchema(propertySchema, value[key], depth + 1));
  }
};

export const isHostCommandError = (value: unknown): value is HostCommandError =>
  matchesRuntimeSchema({ kind: "ref", name: ${JSON.stringify(hostError.name)} }, value);

export const validateTauriCommandResponse = (command: string, value: unknown): boolean => {
  const schema = TAURI_RESPONSE_SCHEMAS[command];
  return schema !== undefined && matchesRuntimeSchema(schema, value);
};
`;
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

function generateTauriClient(filePath, commands, hostError, declarationPaths) {
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
    createTypeOnlyImport([hostError.name], './host'),
    tauriInvoke,
    tauriHostClient,
    createClient
  ];

  writeIfChanged(
    filePath,
    withHeader(
      `${printStatements(statements)}\n${renderRuntimeValidators(commands, hostError, declarationPaths)}`,
      'node ./scripts/generate-contract-wrappers.mjs'
    )
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

function generateHostWrapper(filePath, exportedTypes, exportedValues) {
  const statements = [
    exportValueFrom(exportedValues, './generated/host'),
    exportTypeFrom(exportedTypes, './generated/host')
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

function generateTransportWrapper(filePath, transportExportedTypes, transportExportedValues) {
  const statements = [
    exportValueFrom(transportExportedValues, './generated/transport-host'),
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
const hostGeneratedPath = path.join(generatedDir, 'host.ts');
const tauriClientPath = path.join(generatedDir, 'tauri-host-client.ts');
const tauriCommandContractPath = path.join(generatedDir, 'tauri-command-contract.json');
const applicationStateWrapperPath = path.join(contractsDir, 'application-state.ts');
const engineWrapperPath = path.join(contractsDir, 'engine.ts');
const transportWrapperPath = path.join(contractsDir, 'transport.ts');
const hostWrapperPath = path.join(contractsDir, 'host.ts');

const applicationStateExportedTypes = collectExportedTypeNames(applicationStateGeneratedPath);
const applicationStateExportedValues = collectExportedValueNames(applicationStateGeneratedPath);
const engineExportedTypes = collectExportedTypeNames(engineGeneratedPath);
const engineExportedValues = collectExportedValueNames(engineGeneratedPath);
const transportExportedTypes = collectExportedTypeNames(transportGeneratedPath);
const transportExportedValues = collectExportedValueNames(transportGeneratedPath);
const hostExportedTypes = collectExportedTypeNames(hostGeneratedPath);
const hostExportedValues = collectExportedValueNames(hostGeneratedPath);
const { commands, error: hostError } = loadCommandContract(tauriCommandContractPath);
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
ensureRequired('transport-host.ts values', transportExportedValues, [
  'FETCH_REQUEST_INGRESS_LIMITS'
]);
ensureRequired('host.ts', hostExportedTypes, ['HostCommandError', 'HostCommandErrorCode']);
ensureRequired('host.ts values', hostExportedValues, ['HOST_INGRESS_LIMITS']);
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

generateTauriClient(tauriClientPath, commands, hostError, [
  applicationStateGeneratedPath,
  engineGeneratedPath,
  transportGeneratedPath,
  hostGeneratedPath
]);
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
generateTransportWrapper(
  transportWrapperPath,
  transportExportedTypesWithInterfaces,
  transportExportedValues
);
generateHostWrapper(hostWrapperPath, hostExportedTypes, hostExportedValues);
