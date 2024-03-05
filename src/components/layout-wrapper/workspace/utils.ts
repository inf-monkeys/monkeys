import { useParams } from '@tanstack/react-router';

import { useListWorkspacePages } from '@/apis/pages';
import { useGetWorkflow } from '@/apis/workflow';
import { usePageStore } from '@/store/usePageStore';
import { useLocalStorage } from '@/utils';

export const useVinesPage = () => {
  const { workflowId, pageId, teamId } = useParams({ from: '/$teamId/workspace/$workflowId/$pageId' });
  const { data: pages, mutate: pagesMutate } = useListWorkspacePages(workflowId);
  const [apikey, setApikey] = useLocalStorage('vines-apikey', '', false);

  const { page, setPage } = usePageStore();

  const { data: workflow } = useGetWorkflow(apikey, workflowId);

  return {
    workflow,
    workflowId,
    pages,
    setPages: pagesMutate,
    page,
    setPage,
    pageId,
    teamId,
    apikey,
    setApikey,
  };
};
