import { ApplicationStore } from '@/pages/$teamId/application-store/index.lazy';
import { Designs } from '@/pages/$teamId/designs/index.lazy';
import { EvaluationModules } from '@/pages/$teamId/evaluations';
import { ImageModels } from '@/pages/$teamId/image-models/index.lazy';
import { MediaData } from '@/pages/$teamId/media-data/index.lazy';
import { TextModels } from '@/pages/$teamId/text-models/index.lazy';
import { Tools } from '@/pages/$teamId/tools/index.lazy';

import { NewDesignProject } from '../design-project/new';

export type INavListSubModuleMap = Record<string, React.FC | Record<string, React.FC>>;

export const CUSTOM_NAV_SUB_MODULE_MAP: INavListSubModuleMap = {
  'concept-design:design-templates-and-innovation-approaches': {
    'design-project': Designs,
    'design-template': ApplicationStore,
    'innovation-method': Tools,
  },
  'concept-design:design-assets': MediaData,
  'concept-design:design-models': {
    'llm-model': TextModels,
    'visual-generation-model': ImageModels,
  },
  'concept-design:design-evaluations': {
    'ai-evaluation': EvaluationModules,
  },
  designs: NewDesignProject,
  'artist:asset-library': MediaData,
};
