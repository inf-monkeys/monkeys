import { ConversationApps } from '@/pages/$teamId/agents/index.lazy';
import { ApplicationStore } from '@/pages/$teamId/application-store/index.lazy';
import { DesignSoftwareEvaluations } from '@/pages/$teamId/design-software-evaluations/index.lazy';
import { Designs } from '@/pages/$teamId/designs/index.lazy';
import { DesignTemplates } from '@/pages/$teamId/design-templates/index.lazy';
import { EvaluationModules } from '@/pages/$teamId/evaluations';
import { ImageModels } from '@/pages/$teamId/image-models/index.lazy';
import { MediaData } from '@/pages/$teamId/media-data/index.lazy';
import { ModelTraining } from '@/pages/$teamId/model-training';
import { NeuralModels } from '@/pages/$teamId/neural-models/index.lazy';
import { TextModels } from '@/pages/$teamId/text-models/index.lazy';
import { Tools } from '@/pages/$teamId/tools/index.lazy';
import { VREvaluations } from '@/pages/$teamId/vr-evaluations/index.lazy';
import { Workflows } from '@/pages/$teamId/workflows/index.lazy';

export type INavListSubModuleMap = Record<string, React.FC | Record<string, React.FC>>;

export const CUSTOM_NAV_SUB_MODULE_MAP: INavListSubModuleMap = {
  'concept-design:design-templates-and-innovation-approaches': {
    'design-project': Workflows,
    'design-template': DesignTemplates,
    'innovation-method': Tools,
  },
  'concept-design:design-assets': MediaData,
  'concept-design:design-models': {
    'llm-model': TextModels,
    'visual-generation-model': ImageModels,
    'model-training': ModelTraining,
    'neural-models': NeuralModels,
  },
  'concept-design:design-evaluations': {
    'ai-evaluation': EvaluationModules,
    'vr-evaluation': VREvaluations,
    'design-software-evaluation': DesignSoftwareEvaluations,
  },
  designs: Designs,
  'designs-templates': DesignTemplates,
  'artist:asset-library': MediaData,
  'ai-sessions': ConversationApps,
};
