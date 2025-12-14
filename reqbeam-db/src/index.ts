// Export Prisma client
export { 
  prisma, 
  initializePrisma,
  getVSCodeGlobalStoragePath,
  getVSCodeExtensionDbPath,
  getVSCodeExtensionDbUrl,
  vscodeExtensionDbExists,
  initializeVSCodeExtensionPrisma
} from './client';

// Export types
export * from './types';

// Export services
export {
  CollectionService,
  RequestService,
  EnvironmentService,
  WorkspaceService,
  HistoryService,
  UserService,
  MockServerService,
} from './services';

