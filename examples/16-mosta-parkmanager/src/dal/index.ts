// DAL - Data Access Layer
// Powered by @mostajs/orm — Hibernate-inspired multi-dialect ORM
// Author: Dr Hamid MADANI drmdh@msn.com

// ============================================================
// Core (re-exported from @mostajs/orm)
// ============================================================

// Types
export type {
  FieldType,
  FieldDef,
  EmbeddedSchemaDef,
  RelationType,
  RelationDef,
  IndexType,
  IndexDef,
  EntitySchema,
  FilterOperator,
  FilterValue,
  FilterQuery,
  SortDirection,
  QueryOptions,
  PaginatedResult,
  AggregateStage,
  AggregateGroupStage,
  AggregateMatchStage,
  AggregateSortStage,
  AggregateLimitStage,
  AggregateAccumulator,
  DialectType,
  SchemaStrategy,
  ConnectionConfig,
  IDialect,
  IRepository,
  IPlugin,
  HookContext,
  NormalizedDoc,
} from '@mostajs/orm';

// Config
export {
  DIALECT_CONFIGS,
  getSupportedDialects,
  getDialectConfig,
} from '@mostajs/orm';
export type { DialectConfig } from '@mostajs/orm';

// Factory (SessionFactory)
export {
  getDialect,
  getConfigFromEnv,
  getCurrentDialectType,
  disconnectDialect,
  testConnection,
  createConnection,
} from '@mostajs/orm';

// Registry
export {
  registerSchema,
  registerSchemas,
  getSchema,
  getSchemaByCollection,
  getAllSchemas,
  getEntityNames,
  hasSchema,
  validateSchemas,
  clearRegistry,
} from '@mostajs/orm';

// Base Repository
export { BaseRepository } from '@mostajs/orm';

// ============================================================
// App-specific (MostaParkManager)
// ============================================================

// Schemas (16 entity definitions)
export * from './schemas';

// Repositories (15 typed repos)
export * from './repositories';

// Service (repository factory functions)
export * from './service';
