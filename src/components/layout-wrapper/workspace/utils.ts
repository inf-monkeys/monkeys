import { useEffect, useRef } from 'react';

import { useNavigate, useParams } from '@tanstack/react-router';

import stringify from 'fast-json-stable-stringify';
import { differenceWith, isEqual, omit } from 'lodash';

import { updateWorkspacePages, useListWorkspacePages } from '@/apis/pages';
import { IPageType } from '@/apis/pages/typings.ts';
import { useGetWorkflow } from '@/apis/workflow';
import { Route } from '@/pages/$teamId/workspace/$workflowId/$pageId';
import { usePageStore } from '@/store/usePageStore';
import { useLocalStorage } from '@/utils';

export const useVinesPage = () => {
  const navigate = useNavigate({ from: Route.fullPath });
  const { workflowId, pageId, teamId } = useParams({ from: '/$teamId/workspace/$workflowId/$pageId' });
  const { data: pages, mutate: pagesMutate } = useListWorkspacePages(workflowId);
  const [apikey, setApikey] = useLocalStorage('vines-apikey', '', false);

  const { page, setPage } = usePageStore();

  const { data: workflow, mutate: mutateWorkflow } = useGetWorkflow(workflowId, apikey);

  const originPagesRef = useRef<IPageType[] | null>(null);
  const isUpdatePageLocker = useRef(false);
  const setPages = async (pages: IPageType[]) => {
    await pagesMutate(pages, {
      revalidate: false,
    });

    if (isUpdatePageLocker.current) return;
    if (!originPagesRef.current) {
      originPagesRef.current = JSON.parse(stringify(pages));
      return;
    }
    isUpdatePageLocker.current = true;
    const diffPages = differenceWith(pages, originPagesRef.current, isEqual);
    const omitKeys: { [key: string]: string[] } = {};
    diffPages.forEach((page) => {
      const originPage = originPagesRef.current?.find((it) => it._id === page._id);
      if (originPage) {
        Object.entries(page).forEach(([key, value]) => {
          if (isEqual(value, originPage[key as keyof IPageType])) {
            if (!omitKeys[page._id]) {
              omitKeys[page._id] = ['updatedTimestamp', key];
            } else {
              omitKeys[page._id].push(key);
            }
          }
        });
      }
    });

    const finalPages = diffPages
      .map((it) => ({ pageId: it._id, ...omit(it, omitKeys[it._id]) }))
      .filter((it) => Object.keys(it).length > 1);
    originPagesRef.current = JSON.parse(stringify(pages));

    if (!finalPages.length) {
      setTimeout(() => (isUpdatePageLocker.current = false), 100);
      return;
    }

    const newPages = await updateWorkspacePages(apikey, workflowId, finalPages);
    setTimeout(() => (isUpdatePageLocker.current = false), 100);
    await pagesMutate(newPages, {
      revalidate: false,
    });

    setTimeout(() => (isUpdatePageLocker.current = false), 100);
  };

  useEffect(() => {
    if (!pages) return;
    if (originPagesRef.current === null) {
      originPagesRef.current = JSON.parse(stringify(pages));
    }
  }, [pages]);

  const navigateTo = (pageId: string) =>
    navigate({
      to: '/$teamId/workspace/$workflowId/$pageId',
      params: {
        teamId,
        workflowId,
        pageId: pageId,
      },
    });

  return {
    workflow,
    mutateWorkflow,
    workflowId,
    pages,
    setPages,
    pagesMutate,
    page,
    setPage,
    pageId,
    teamId,
    apikey,
    setApikey,
    navigateTo,
  };
};
