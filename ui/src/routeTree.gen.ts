/* prettier-ignore-start */

/* eslint-disable */

// @ts-nocheck

// noinspection JSUnusedGlobalSymbols

// This file is auto-generated by TanStack Router

import { createFileRoute } from '@tanstack/react-router'

// Import Routes

import { Route as rootRoute } from './pages/__root'
import { Route as TeamIdEvaluationsIndexImport } from './pages/$teamId/evaluations/index'
import { Route as TeamIdEvaluationsDetailImport } from './pages/$teamId/evaluations/detail'

// Create Virtual Routes

const IndexLazyImport = createFileRoute('/')()
const LoginIndexLazyImport = createFileRoute('/login/')()
const TeamIdIndexLazyImport = createFileRoute('/$teamId/')()
const LoginOauthLazyImport = createFileRoute('/login/oauth')()
const LoginCallbackLazyImport = createFileRoute('/login/callback')()
const TeamIdWorkspaceIndexLazyImport = createFileRoute('/$teamId/workspace/')()
const TeamIdWorkflowsIndexLazyImport = createFileRoute('/$teamId/workflows/')()
const TeamIdWorkbenchIndexLazyImport = createFileRoute('/$teamId/workbench/')()
const TeamIdToolsIndexLazyImport = createFileRoute('/$teamId/tools/')()
const TeamIdTextModelsIndexLazyImport = createFileRoute(
  '/$teamId/text-models/',
)()
const TeamIdTextModelStoreIndexLazyImport = createFileRoute(
  '/$teamId/text-model-store/',
)()
const TeamIdTextDataIndexLazyImport = createFileRoute('/$teamId/text-data/')()
const TeamIdTextDataStoreIndexLazyImport = createFileRoute(
  '/$teamId/text-data-store/',
)()
const TeamIdTableDataIndexLazyImport = createFileRoute('/$teamId/table-data/')()
const TeamIdStoreIndexLazyImport = createFileRoute('/$teamId/store/')()
const TeamIdSettingsIndexLazyImport = createFileRoute('/$teamId/settings/')()
const TeamIdRenderToolsIndexLazyImport = createFileRoute(
  '/$teamId/render-tools/',
)()
const TeamIdMediaDataIndexLazyImport = createFileRoute('/$teamId/media-data/')()
const TeamIdJoinTeamIndexLazyImport = createFileRoute('/$teamId/join-team/')()
const TeamIdImageModelsIndexLazyImport = createFileRoute(
  '/$teamId/image-models/',
)()
const TeamIdImageModelStoreIndexLazyImport = createFileRoute(
  '/$teamId/image-model-store/',
)()
const TeamIdDesignsIndexLazyImport = createFileRoute('/$teamId/designs/')()
const TeamIdComfyuiIndexLazyImport = createFileRoute('/$teamId/comfyui/')()
const TeamIdComfyuiStoreIndexLazyImport = createFileRoute(
  '/$teamId/comfyui-store/',
)()
const TeamIdApplicationStoreIndexLazyImport = createFileRoute(
  '/$teamId/application-store/',
)()
const TeamIdAgentsIndexLazyImport = createFileRoute('/$teamId/agents/')()
const TeamIdAgentIndexLazyImport = createFileRoute('/$teamId/agent/')()
const TeamIdActionToolsIndexLazyImport = createFileRoute(
  '/$teamId/action-tools/',
)()
const TeamIdWorkspaceWorkflowIdIndexLazyImport = createFileRoute(
  '/$teamId/workspace/$workflowId/',
)()
const TeamIdTextModelsLlmModelIdIndexLazyImport = createFileRoute(
  '/$teamId/text-models/$llmModelId/',
)()
const TeamIdTextDataTextIdIndexLazyImport = createFileRoute(
  '/$teamId/text-data/$textId/',
)()
const TeamIdTableDataDatabaseIdIndexLazyImport = createFileRoute(
  '/$teamId/table-data/$databaseId/',
)()
const TeamIdImageModelsImageModelIdIndexLazyImport = createFileRoute(
  '/$teamId/image-models/$imageModelId/',
)()
const TeamIdEvaluationsModuleIdIndexLazyImport = createFileRoute(
  '/$teamId/evaluations/$moduleId/',
)()
const TeamIdDesignDesignProjectIdIndexLazyImport = createFileRoute(
  '/$teamId/design/$designProjectId/',
)()
const TeamIdComfyuiComfyuiWorkflowIdIndexLazyImport = createFileRoute(
  '/$teamId/comfyui/$comfyuiWorkflowId/',
)()
const TeamIdAgentAgentIdIndexLazyImport = createFileRoute(
  '/$teamId/agent/$agentId/',
)()
const TeamIdActionToolsActionToolNameIndexLazyImport = createFileRoute(
  '/$teamId/action-tools/$actionToolName/',
)()
const TeamIdWorkspaceWorkflowIdImageDetailIndexLazyImport = createFileRoute(
  '/$teamId/workspace/$workflowId/image-detail/',
)()
const TeamIdWorkspaceWorkflowIdPageIdIndexLazyImport = createFileRoute(
  '/$teamId/workspace/$workflowId/$pageId/',
)()
const TeamIdEvaluationsModuleIdTabIndexLazyImport = createFileRoute(
  '/$teamId/evaluations/$moduleId/$tab/',
)()
const TeamIdDesignDesignProjectIdDesignBoardIdIndexLazyImport = createFileRoute(
  '/$teamId/design/$designProjectId/$designBoardId/',
)()
const TeamIdWorkspaceWorkflowIdPageIdViewIframeLazyImport = createFileRoute(
  '/$teamId/workspace/$workflowId/$pageId/view-iframe',
)()

// Create/Update Routes

const IndexLazyRoute = IndexLazyImport.update({
  path: '/',
  getParentRoute: () => rootRoute,
} as any).lazy(() => import('./pages/index.lazy').then((d) => d.Route))

const LoginIndexLazyRoute = LoginIndexLazyImport.update({
  path: '/login/',
  getParentRoute: () => rootRoute,
} as any).lazy(() => import('./pages/login/index.lazy').then((d) => d.Route))

const TeamIdIndexLazyRoute = TeamIdIndexLazyImport.update({
  path: '/$teamId/',
  getParentRoute: () => rootRoute,
} as any).lazy(() => import('./pages/$teamId/index.lazy').then((d) => d.Route))

const LoginOauthLazyRoute = LoginOauthLazyImport.update({
  path: '/login/oauth',
  getParentRoute: () => rootRoute,
} as any).lazy(() => import('./pages/login/oauth.lazy').then((d) => d.Route))

const LoginCallbackLazyRoute = LoginCallbackLazyImport.update({
  path: '/login/callback',
  getParentRoute: () => rootRoute,
} as any).lazy(() => import('./pages/login/callback.lazy').then((d) => d.Route))

const TeamIdWorkspaceIndexLazyRoute = TeamIdWorkspaceIndexLazyImport.update({
  path: '/$teamId/workspace/',
  getParentRoute: () => rootRoute,
} as any).lazy(() =>
  import('./pages/$teamId/workspace/index.lazy').then((d) => d.Route),
)

const TeamIdWorkflowsIndexLazyRoute = TeamIdWorkflowsIndexLazyImport.update({
  path: '/$teamId/workflows/',
  getParentRoute: () => rootRoute,
} as any).lazy(() =>
  import('./pages/$teamId/workflows/index.lazy').then((d) => d.Route),
)

const TeamIdWorkbenchIndexLazyRoute = TeamIdWorkbenchIndexLazyImport.update({
  path: '/$teamId/workbench/',
  getParentRoute: () => rootRoute,
} as any).lazy(() =>
  import('./pages/$teamId/workbench/index.lazy').then((d) => d.Route),
)

const TeamIdToolsIndexLazyRoute = TeamIdToolsIndexLazyImport.update({
  path: '/$teamId/tools/',
  getParentRoute: () => rootRoute,
} as any).lazy(() =>
  import('./pages/$teamId/tools/index.lazy').then((d) => d.Route),
)

const TeamIdTextModelsIndexLazyRoute = TeamIdTextModelsIndexLazyImport.update({
  path: '/$teamId/text-models/',
  getParentRoute: () => rootRoute,
} as any).lazy(() =>
  import('./pages/$teamId/text-models/index.lazy').then((d) => d.Route),
)

const TeamIdTextModelStoreIndexLazyRoute =
  TeamIdTextModelStoreIndexLazyImport.update({
    path: '/$teamId/text-model-store/',
    getParentRoute: () => rootRoute,
  } as any).lazy(() =>
    import('./pages/$teamId/text-model-store/index.lazy').then((d) => d.Route),
  )

const TeamIdTextDataIndexLazyRoute = TeamIdTextDataIndexLazyImport.update({
  path: '/$teamId/text-data/',
  getParentRoute: () => rootRoute,
} as any).lazy(() =>
  import('./pages/$teamId/text-data/index.lazy').then((d) => d.Route),
)

const TeamIdTextDataStoreIndexLazyRoute =
  TeamIdTextDataStoreIndexLazyImport.update({
    path: '/$teamId/text-data-store/',
    getParentRoute: () => rootRoute,
  } as any).lazy(() =>
    import('./pages/$teamId/text-data-store/index.lazy').then((d) => d.Route),
  )

const TeamIdTableDataIndexLazyRoute = TeamIdTableDataIndexLazyImport.update({
  path: '/$teamId/table-data/',
  getParentRoute: () => rootRoute,
} as any).lazy(() =>
  import('./pages/$teamId/table-data/index.lazy').then((d) => d.Route),
)

const TeamIdStoreIndexLazyRoute = TeamIdStoreIndexLazyImport.update({
  path: '/$teamId/store/',
  getParentRoute: () => rootRoute,
} as any).lazy(() =>
  import('./pages/$teamId/store/index.lazy').then((d) => d.Route),
)

const TeamIdSettingsIndexLazyRoute = TeamIdSettingsIndexLazyImport.update({
  path: '/$teamId/settings/',
  getParentRoute: () => rootRoute,
} as any).lazy(() =>
  import('./pages/$teamId/settings/index.lazy').then((d) => d.Route),
)

const TeamIdRenderToolsIndexLazyRoute = TeamIdRenderToolsIndexLazyImport.update(
  {
    path: '/$teamId/render-tools/',
    getParentRoute: () => rootRoute,
  } as any,
).lazy(() =>
  import('./pages/$teamId/render-tools/index.lazy').then((d) => d.Route),
)

const TeamIdMediaDataIndexLazyRoute = TeamIdMediaDataIndexLazyImport.update({
  path: '/$teamId/media-data/',
  getParentRoute: () => rootRoute,
} as any).lazy(() =>
  import('./pages/$teamId/media-data/index.lazy').then((d) => d.Route),
)

const TeamIdJoinTeamIndexLazyRoute = TeamIdJoinTeamIndexLazyImport.update({
  path: '/$teamId/join-team/',
  getParentRoute: () => rootRoute,
} as any).lazy(() =>
  import('./pages/$teamId/join-team/index.lazy').then((d) => d.Route),
)

const TeamIdImageModelsIndexLazyRoute = TeamIdImageModelsIndexLazyImport.update(
  {
    path: '/$teamId/image-models/',
    getParentRoute: () => rootRoute,
  } as any,
).lazy(() =>
  import('./pages/$teamId/image-models/index.lazy').then((d) => d.Route),
)

const TeamIdImageModelStoreIndexLazyRoute =
  TeamIdImageModelStoreIndexLazyImport.update({
    path: '/$teamId/image-model-store/',
    getParentRoute: () => rootRoute,
  } as any).lazy(() =>
    import('./pages/$teamId/image-model-store/index.lazy').then((d) => d.Route),
  )

const TeamIdDesignsIndexLazyRoute = TeamIdDesignsIndexLazyImport.update({
  path: '/$teamId/designs/',
  getParentRoute: () => rootRoute,
} as any).lazy(() =>
  import('./pages/$teamId/designs/index.lazy').then((d) => d.Route),
)

const TeamIdComfyuiIndexLazyRoute = TeamIdComfyuiIndexLazyImport.update({
  path: '/$teamId/comfyui/',
  getParentRoute: () => rootRoute,
} as any).lazy(() =>
  import('./pages/$teamId/comfyui/index.lazy').then((d) => d.Route),
)

const TeamIdComfyuiStoreIndexLazyRoute =
  TeamIdComfyuiStoreIndexLazyImport.update({
    path: '/$teamId/comfyui-store/',
    getParentRoute: () => rootRoute,
  } as any).lazy(() =>
    import('./pages/$teamId/comfyui-store/index.lazy').then((d) => d.Route),
  )

const TeamIdApplicationStoreIndexLazyRoute =
  TeamIdApplicationStoreIndexLazyImport.update({
    path: '/$teamId/application-store/',
    getParentRoute: () => rootRoute,
  } as any).lazy(() =>
    import('./pages/$teamId/application-store/index.lazy').then((d) => d.Route),
  )

const TeamIdAgentsIndexLazyRoute = TeamIdAgentsIndexLazyImport.update({
  path: '/$teamId/agents/',
  getParentRoute: () => rootRoute,
} as any).lazy(() =>
  import('./pages/$teamId/agents/index.lazy').then((d) => d.Route),
)

const TeamIdAgentIndexLazyRoute = TeamIdAgentIndexLazyImport.update({
  path: '/$teamId/agent/',
  getParentRoute: () => rootRoute,
} as any).lazy(() =>
  import('./pages/$teamId/agent/index.lazy').then((d) => d.Route),
)

const TeamIdActionToolsIndexLazyRoute = TeamIdActionToolsIndexLazyImport.update(
  {
    path: '/$teamId/action-tools/',
    getParentRoute: () => rootRoute,
  } as any,
).lazy(() =>
  import('./pages/$teamId/action-tools/index.lazy').then((d) => d.Route),
)

const TeamIdEvaluationsIndexRoute = TeamIdEvaluationsIndexImport.update({
  path: '/$teamId/evaluations/',
  getParentRoute: () => rootRoute,
} as any)

const TeamIdEvaluationsDetailRoute = TeamIdEvaluationsDetailImport.update({
  path: '/$teamId/evaluations/detail',
  getParentRoute: () => rootRoute,
} as any)

const TeamIdWorkspaceWorkflowIdIndexLazyRoute =
  TeamIdWorkspaceWorkflowIdIndexLazyImport.update({
    path: '/$teamId/workspace/$workflowId/',
    getParentRoute: () => rootRoute,
  } as any).lazy(() =>
    import('./pages/$teamId/workspace/$workflowId/index.lazy').then(
      (d) => d.Route,
    ),
  )

const TeamIdTextModelsLlmModelIdIndexLazyRoute =
  TeamIdTextModelsLlmModelIdIndexLazyImport.update({
    path: '/$teamId/text-models/$llmModelId/',
    getParentRoute: () => rootRoute,
  } as any).lazy(() =>
    import('./pages/$teamId/text-models/$llmModelId/index.lazy').then(
      (d) => d.Route,
    ),
  )

const TeamIdTextDataTextIdIndexLazyRoute =
  TeamIdTextDataTextIdIndexLazyImport.update({
    path: '/$teamId/text-data/$textId/',
    getParentRoute: () => rootRoute,
  } as any).lazy(() =>
    import('./pages/$teamId/text-data/$textId/index.lazy').then((d) => d.Route),
  )

const TeamIdTableDataDatabaseIdIndexLazyRoute =
  TeamIdTableDataDatabaseIdIndexLazyImport.update({
    path: '/$teamId/table-data/$databaseId/',
    getParentRoute: () => rootRoute,
  } as any).lazy(() =>
    import('./pages/$teamId/table-data/$databaseId/index.lazy').then(
      (d) => d.Route,
    ),
  )

const TeamIdImageModelsImageModelIdIndexLazyRoute =
  TeamIdImageModelsImageModelIdIndexLazyImport.update({
    path: '/$teamId/image-models/$imageModelId/',
    getParentRoute: () => rootRoute,
  } as any).lazy(() =>
    import('./pages/$teamId/image-models/$imageModelId/index.lazy').then(
      (d) => d.Route,
    ),
  )

const TeamIdEvaluationsModuleIdIndexLazyRoute =
  TeamIdEvaluationsModuleIdIndexLazyImport.update({
    path: '/$teamId/evaluations/$moduleId/',
    getParentRoute: () => rootRoute,
  } as any).lazy(() =>
    import('./pages/$teamId/evaluations/$moduleId/index.lazy').then(
      (d) => d.Route,
    ),
  )

const TeamIdDesignDesignProjectIdIndexLazyRoute =
  TeamIdDesignDesignProjectIdIndexLazyImport.update({
    path: '/$teamId/design/$designProjectId/',
    getParentRoute: () => rootRoute,
  } as any).lazy(() =>
    import('./pages/$teamId/design/$designProjectId/index.lazy').then(
      (d) => d.Route,
    ),
  )

const TeamIdComfyuiComfyuiWorkflowIdIndexLazyRoute =
  TeamIdComfyuiComfyuiWorkflowIdIndexLazyImport.update({
    path: '/$teamId/comfyui/$comfyuiWorkflowId/',
    getParentRoute: () => rootRoute,
  } as any).lazy(() =>
    import('./pages/$teamId/comfyui/$comfyuiWorkflowId/index.lazy').then(
      (d) => d.Route,
    ),
  )

const TeamIdAgentAgentIdIndexLazyRoute =
  TeamIdAgentAgentIdIndexLazyImport.update({
    path: '/$teamId/agent/$agentId/',
    getParentRoute: () => rootRoute,
  } as any).lazy(() =>
    import('./pages/$teamId/agent/$agentId/index.lazy').then((d) => d.Route),
  )

const TeamIdActionToolsActionToolNameIndexLazyRoute =
  TeamIdActionToolsActionToolNameIndexLazyImport.update({
    path: '/$teamId/action-tools/$actionToolName/',
    getParentRoute: () => rootRoute,
  } as any).lazy(() =>
    import('./pages/$teamId/action-tools/$actionToolName/index.lazy').then(
      (d) => d.Route,
    ),
  )

const TeamIdWorkspaceWorkflowIdImageDetailIndexLazyRoute =
  TeamIdWorkspaceWorkflowIdImageDetailIndexLazyImport.update({
    path: '/$teamId/workspace/$workflowId/image-detail/',
    getParentRoute: () => rootRoute,
  } as any).lazy(() =>
    import(
      './pages/$teamId/workspace/$workflowId/image-detail/index.lazy'
    ).then((d) => d.Route),
  )

const TeamIdWorkspaceWorkflowIdPageIdIndexLazyRoute =
  TeamIdWorkspaceWorkflowIdPageIdIndexLazyImport.update({
    path: '/$teamId/workspace/$workflowId/$pageId/',
    getParentRoute: () => rootRoute,
  } as any).lazy(() =>
    import('./pages/$teamId/workspace/$workflowId/$pageId/index.lazy').then(
      (d) => d.Route,
    ),
  )

const TeamIdEvaluationsModuleIdTabIndexLazyRoute =
  TeamIdEvaluationsModuleIdTabIndexLazyImport.update({
    path: '/$teamId/evaluations/$moduleId/$tab/',
    getParentRoute: () => rootRoute,
  } as any).lazy(() =>
    import('./pages/$teamId/evaluations/$moduleId/$tab/index.lazy').then(
      (d) => d.Route,
    ),
  )

const TeamIdDesignDesignProjectIdDesignBoardIdIndexLazyRoute =
  TeamIdDesignDesignProjectIdDesignBoardIdIndexLazyImport.update({
    path: '/$teamId/design/$designProjectId/$designBoardId/',
    getParentRoute: () => rootRoute,
  } as any).lazy(() =>
    import(
      './pages/$teamId/design/$designProjectId/$designBoardId/index.lazy'
    ).then((d) => d.Route),
  )

const TeamIdWorkspaceWorkflowIdPageIdViewIframeLazyRoute =
  TeamIdWorkspaceWorkflowIdPageIdViewIframeLazyImport.update({
    path: '/$teamId/workspace/$workflowId/$pageId/view-iframe',
    getParentRoute: () => rootRoute,
  } as any).lazy(() =>
    import(
      './pages/$teamId/workspace/$workflowId/$pageId/view-iframe.lazy'
    ).then((d) => d.Route),
  )

// Populate the FileRoutesByPath interface

declare module '@tanstack/react-router' {
  interface FileRoutesByPath {
    '/': {
      preLoaderRoute: typeof IndexLazyImport
      parentRoute: typeof rootRoute
    }
    '/login/callback': {
      preLoaderRoute: typeof LoginCallbackLazyImport
      parentRoute: typeof rootRoute
    }
    '/login/oauth': {
      preLoaderRoute: typeof LoginOauthLazyImport
      parentRoute: typeof rootRoute
    }
    '/$teamId/': {
      preLoaderRoute: typeof TeamIdIndexLazyImport
      parentRoute: typeof rootRoute
    }
    '/login/': {
      preLoaderRoute: typeof LoginIndexLazyImport
      parentRoute: typeof rootRoute
    }
    '/$teamId/evaluations/detail': {
      preLoaderRoute: typeof TeamIdEvaluationsDetailImport
      parentRoute: typeof rootRoute
    }
    '/$teamId/evaluations/': {
      preLoaderRoute: typeof TeamIdEvaluationsIndexImport
      parentRoute: typeof rootRoute
    }
    '/$teamId/action-tools/': {
      preLoaderRoute: typeof TeamIdActionToolsIndexLazyImport
      parentRoute: typeof rootRoute
    }
    '/$teamId/agent/': {
      preLoaderRoute: typeof TeamIdAgentIndexLazyImport
      parentRoute: typeof rootRoute
    }
    '/$teamId/agents/': {
      preLoaderRoute: typeof TeamIdAgentsIndexLazyImport
      parentRoute: typeof rootRoute
    }
    '/$teamId/application-store/': {
      preLoaderRoute: typeof TeamIdApplicationStoreIndexLazyImport
      parentRoute: typeof rootRoute
    }
    '/$teamId/comfyui-store/': {
      preLoaderRoute: typeof TeamIdComfyuiStoreIndexLazyImport
      parentRoute: typeof rootRoute
    }
    '/$teamId/comfyui/': {
      preLoaderRoute: typeof TeamIdComfyuiIndexLazyImport
      parentRoute: typeof rootRoute
    }
    '/$teamId/designs/': {
      preLoaderRoute: typeof TeamIdDesignsIndexLazyImport
      parentRoute: typeof rootRoute
    }
    '/$teamId/image-model-store/': {
      preLoaderRoute: typeof TeamIdImageModelStoreIndexLazyImport
      parentRoute: typeof rootRoute
    }
    '/$teamId/image-models/': {
      preLoaderRoute: typeof TeamIdImageModelsIndexLazyImport
      parentRoute: typeof rootRoute
    }
    '/$teamId/join-team/': {
      preLoaderRoute: typeof TeamIdJoinTeamIndexLazyImport
      parentRoute: typeof rootRoute
    }
    '/$teamId/media-data/': {
      preLoaderRoute: typeof TeamIdMediaDataIndexLazyImport
      parentRoute: typeof rootRoute
    }
    '/$teamId/render-tools/': {
      preLoaderRoute: typeof TeamIdRenderToolsIndexLazyImport
      parentRoute: typeof rootRoute
    }
    '/$teamId/settings/': {
      preLoaderRoute: typeof TeamIdSettingsIndexLazyImport
      parentRoute: typeof rootRoute
    }
    '/$teamId/store/': {
      preLoaderRoute: typeof TeamIdStoreIndexLazyImport
      parentRoute: typeof rootRoute
    }
    '/$teamId/table-data/': {
      preLoaderRoute: typeof TeamIdTableDataIndexLazyImport
      parentRoute: typeof rootRoute
    }
    '/$teamId/text-data-store/': {
      preLoaderRoute: typeof TeamIdTextDataStoreIndexLazyImport
      parentRoute: typeof rootRoute
    }
    '/$teamId/text-data/': {
      preLoaderRoute: typeof TeamIdTextDataIndexLazyImport
      parentRoute: typeof rootRoute
    }
    '/$teamId/text-model-store/': {
      preLoaderRoute: typeof TeamIdTextModelStoreIndexLazyImport
      parentRoute: typeof rootRoute
    }
    '/$teamId/text-models/': {
      preLoaderRoute: typeof TeamIdTextModelsIndexLazyImport
      parentRoute: typeof rootRoute
    }
    '/$teamId/tools/': {
      preLoaderRoute: typeof TeamIdToolsIndexLazyImport
      parentRoute: typeof rootRoute
    }
    '/$teamId/workbench/': {
      preLoaderRoute: typeof TeamIdWorkbenchIndexLazyImport
      parentRoute: typeof rootRoute
    }
    '/$teamId/workflows/': {
      preLoaderRoute: typeof TeamIdWorkflowsIndexLazyImport
      parentRoute: typeof rootRoute
    }
    '/$teamId/workspace/': {
      preLoaderRoute: typeof TeamIdWorkspaceIndexLazyImport
      parentRoute: typeof rootRoute
    }
    '/$teamId/action-tools/$actionToolName/': {
      preLoaderRoute: typeof TeamIdActionToolsActionToolNameIndexLazyImport
      parentRoute: typeof rootRoute
    }
    '/$teamId/agent/$agentId/': {
      preLoaderRoute: typeof TeamIdAgentAgentIdIndexLazyImport
      parentRoute: typeof rootRoute
    }
    '/$teamId/comfyui/$comfyuiWorkflowId/': {
      preLoaderRoute: typeof TeamIdComfyuiComfyuiWorkflowIdIndexLazyImport
      parentRoute: typeof rootRoute
    }
    '/$teamId/design/$designProjectId/': {
      preLoaderRoute: typeof TeamIdDesignDesignProjectIdIndexLazyImport
      parentRoute: typeof rootRoute
    }
    '/$teamId/evaluations/$moduleId/': {
      preLoaderRoute: typeof TeamIdEvaluationsModuleIdIndexLazyImport
      parentRoute: typeof rootRoute
    }
    '/$teamId/image-models/$imageModelId/': {
      preLoaderRoute: typeof TeamIdImageModelsImageModelIdIndexLazyImport
      parentRoute: typeof rootRoute
    }
    '/$teamId/table-data/$databaseId/': {
      preLoaderRoute: typeof TeamIdTableDataDatabaseIdIndexLazyImport
      parentRoute: typeof rootRoute
    }
    '/$teamId/text-data/$textId/': {
      preLoaderRoute: typeof TeamIdTextDataTextIdIndexLazyImport
      parentRoute: typeof rootRoute
    }
    '/$teamId/text-models/$llmModelId/': {
      preLoaderRoute: typeof TeamIdTextModelsLlmModelIdIndexLazyImport
      parentRoute: typeof rootRoute
    }
    '/$teamId/workspace/$workflowId/': {
      preLoaderRoute: typeof TeamIdWorkspaceWorkflowIdIndexLazyImport
      parentRoute: typeof rootRoute
    }
    '/$teamId/workspace/$workflowId/$pageId/view-iframe': {
      preLoaderRoute: typeof TeamIdWorkspaceWorkflowIdPageIdViewIframeLazyImport
      parentRoute: typeof rootRoute
    }
    '/$teamId/design/$designProjectId/$designBoardId/': {
      preLoaderRoute: typeof TeamIdDesignDesignProjectIdDesignBoardIdIndexLazyImport
      parentRoute: typeof rootRoute
    }
    '/$teamId/evaluations/$moduleId/$tab/': {
      preLoaderRoute: typeof TeamIdEvaluationsModuleIdTabIndexLazyImport
      parentRoute: typeof rootRoute
    }
    '/$teamId/workspace/$workflowId/$pageId/': {
      preLoaderRoute: typeof TeamIdWorkspaceWorkflowIdPageIdIndexLazyImport
      parentRoute: typeof rootRoute
    }
    '/$teamId/workspace/$workflowId/image-detail/': {
      preLoaderRoute: typeof TeamIdWorkspaceWorkflowIdImageDetailIndexLazyImport
      parentRoute: typeof rootRoute
    }
  }
}

// Create and export the route tree

export const routeTree = rootRoute.addChildren([
  IndexLazyRoute,
  LoginCallbackLazyRoute,
  LoginOauthLazyRoute,
  TeamIdIndexLazyRoute,
  LoginIndexLazyRoute,
  TeamIdEvaluationsDetailRoute,
  TeamIdEvaluationsIndexRoute,
  TeamIdActionToolsIndexLazyRoute,
  TeamIdAgentIndexLazyRoute,
  TeamIdAgentsIndexLazyRoute,
  TeamIdApplicationStoreIndexLazyRoute,
  TeamIdComfyuiStoreIndexLazyRoute,
  TeamIdComfyuiIndexLazyRoute,
  TeamIdDesignsIndexLazyRoute,
  TeamIdImageModelStoreIndexLazyRoute,
  TeamIdImageModelsIndexLazyRoute,
  TeamIdJoinTeamIndexLazyRoute,
  TeamIdMediaDataIndexLazyRoute,
  TeamIdRenderToolsIndexLazyRoute,
  TeamIdSettingsIndexLazyRoute,
  TeamIdStoreIndexLazyRoute,
  TeamIdTableDataIndexLazyRoute,
  TeamIdTextDataStoreIndexLazyRoute,
  TeamIdTextDataIndexLazyRoute,
  TeamIdTextModelStoreIndexLazyRoute,
  TeamIdTextModelsIndexLazyRoute,
  TeamIdToolsIndexLazyRoute,
  TeamIdWorkbenchIndexLazyRoute,
  TeamIdWorkflowsIndexLazyRoute,
  TeamIdWorkspaceIndexLazyRoute,
  TeamIdActionToolsActionToolNameIndexLazyRoute,
  TeamIdAgentAgentIdIndexLazyRoute,
  TeamIdComfyuiComfyuiWorkflowIdIndexLazyRoute,
  TeamIdDesignDesignProjectIdIndexLazyRoute,
  TeamIdEvaluationsModuleIdIndexLazyRoute,
  TeamIdImageModelsImageModelIdIndexLazyRoute,
  TeamIdTableDataDatabaseIdIndexLazyRoute,
  TeamIdTextDataTextIdIndexLazyRoute,
  TeamIdTextModelsLlmModelIdIndexLazyRoute,
  TeamIdWorkspaceWorkflowIdIndexLazyRoute,
  TeamIdWorkspaceWorkflowIdPageIdViewIframeLazyRoute,
  TeamIdDesignDesignProjectIdDesignBoardIdIndexLazyRoute,
  TeamIdEvaluationsModuleIdTabIndexLazyRoute,
  TeamIdWorkspaceWorkflowIdPageIdIndexLazyRoute,
  TeamIdWorkspaceWorkflowIdImageDetailIndexLazyRoute,
])

/* prettier-ignore-end */
