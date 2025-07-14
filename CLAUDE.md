# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build and Development Commands

- **Build**: `yarn build` - Compiles TypeScript to JavaScript
- **Development**: `yarn start:dev` - Runs server with hot reload
- **Production**: `yarn start:prod` - Starts production server
- **Lint**: `yarn lint` - Runs ESLint with auto-fix
- **Format**: `yarn format` - Formats code with Prettier
- **Tests**: `yarn test` - Runs Jest test suite
- **Test Watch**: `yarn test:watch` - Runs tests in watch mode
- **Test Coverage**: `yarn test:cov` - Generates test coverage report

## Database Commands

- **Migration Generate**: `yarn migration:generate` - Creates new migration file
- **Migration Run**: `yarn migration:run` - Executes pending migrations
- **Migration Create**: `yarn migration:create` - Creates empty migration file

## Architecture Overview

Monkeys is a workflow-centric AI application platform built with NestJS and TypeScript. The architecture follows these key patterns:

### Core Components

1. **Conductor Integration**: Uses Netflix Conductor as the workflow orchestration engine
   - Client at `@/common/conductor`
   - Workflows are defined as JSON and executed via Conductor API
   - All workflow executions are tracked and managed through Conductor

2. **Multi-Tenancy**: Team-based architecture where users belong to teams
   - Teams own workflows, assets, and executions
   - Team isolation enforced at service layer
   - Team context passed via `__context` in workflow inputs

3. **Workflow System**: Central abstraction for AI workflows
   - **Workflow Definition** (`WorkflowMetadataEntity`): Template/blueprint
   - **Workflow Execution** (`WorkflowExecutionEntity`): Runtime instance
   - **Tasks**: Individual steps in workflows (tools, AI models, etc.)

4. **Tools Architecture**: Extensible system for workflow tasks
   - System tools: Built-in tasks (LLM, media processing, etc.)
   - External tools: HTTP services following Monkeys tool standards
   - Tool registry manages discovery and health checking

### Key Module Structure

- **`/modules/workflow/`**: Core workflow management
  - `workflow.execution.service.ts`: Execution lifecycle management
  - `conductor/conductor.service.ts`: Conductor integration layer
  
- **`/modules/tenant/`**: Cross-team data access and statistics
  - `tenant.service.ts`: Provides unified interfaces for execution data

- **`/modules/tools/`**: Tool system implementation
  - Individual tool modules (LLM, ComfyUI, media, etc.)
  - Tool registration and forwarding services

- **`/modules/assets/`**: Asset management (models, knowledge bases, etc.)
  - Supports multiple asset types with common CRUD operations

### Data Architecture

1. **Database Layer**: TypeORM with PostgreSQL/SQLite support
   - Entities in `/database/entities/`
   - Repositories in `/database/repositories/`
   - Migrations in `/database/migrations/`

2. **Dual Storage Pattern**: 
   - **Local DB**: Metadata, user data, team data
   - **Conductor**: Workflow definitions and execution data
   - Synchronization between both systems

3. **Data Processing**:
   - Input/Output formatting for UI display
   - `extraMetadata` encoding/decoding (Base64 + JSON)
   - Searchable text generation for full-text search

### Important Patterns

1. **Base64 Metadata Encoding**: `extraMetadata` fields are Base64-encoded JSON
   ```typescript
   // Decode pattern used throughout codebase
   if (typeof extraMetadata === 'string' && extraMetadata !== '') {
     try {
       extraMetadata = JSON.parse(Buffer.from(extraMetadata, 'base64').toString('utf-8'));
     } catch (e) {
       // Handle decode failure
     }
   }
   ```

2. **Workflow Context Injection**: All workflow inputs include `__context`
   ```typescript
   inputData = {
     ...inputData,
     __context: { userId, teamId, appId }
   };
   ```

3. **Performance Optimization**: Mapping patterns for efficient lookups
   - Use `Map<string, Entity>` for O(1) lookups instead of array.find()
   - Batch database queries to avoid N+1 problems

4. **Data Formatting**: Two-tier output format
   - `rawInput`/`rawOutput`: Original data
   - `input`/`output`: Formatted arrays with display metadata

## Configuration

- **Config**: Uses YAML configuration (`config.yaml`)
- **Database**: Supports SQLite (dev) and PostgreSQL (production)
- **Environment**: TypeScript path mapping with `@/*` alias pointing to `src/*`

## Key Services

- **WorkflowExecutionService**: Primary workflow lifecycle management
- **TenantService**: Cross-team data aggregation and analytics
- **ConductorService**: Netflix Conductor integration wrapper
- **ToolsRegistryService**: Tool discovery and health monitoring

## Testing

- **Framework**: Jest with TypeScript support
- **Coverage**: Configured for full codebase coverage
- **Debugging**: VS Code compatible test debugging setup