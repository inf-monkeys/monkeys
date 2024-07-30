import { useEffect, useRef } from 'react';

import { useNavigate, useParams } from '@tanstack/react-router';

import { differenceWith, isEqual, omit, set } from 'lodash';

import { updateWorkspacePages, useWorkspacePagesWithWorkflowId } from '@/apis/pages';
import { IPageType } from '@/apis/pages/typings.ts';
import { useGetWorkflow } from '@/apis/workflow';
import { Route } from '@/pages/$teamId/workspace/$workflowId/$pageId';
import { usePageStore } from '@/store/usePageStore';
import { cloneDeep } from '@/utils';
import { stringify } from '@/utils/fast-stable-stringify.ts';

export const useVinesPage = () => {
  const navigate = useNavigate({ from: Route.fullPath });
  const { workflowId, pageId, teamId } = useParams({ from: '/$teamId/workspace/$workflowId/$pageId/' });
  const { data: pages, mutate: pagesMutate } = useWorkspacePagesWithWorkflowId(workflowId);

  const page = usePageStore((s) => s.page);
  const setPage = usePageStore((s) => s.setPage);

  const { data: workflow, mutate: mutateWorkflow } = useGetWorkflow(workflowId);

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
      const originPage = originPagesRef.current?.find((it) => it.id === page.id);
      if (originPage) {
        Object.entries(page).forEach(([key, value]) => {
          if (isEqual(value, originPage[key as keyof IPageType])) {
            if (!omitKeys[page.id]) {
              omitKeys[page.id] = ['updatedTimestamp', key];
            } else {
              omitKeys[page.id].push(key);
            }
          }
        });
      }
    });

    const finalPages = diffPages
      .map((it) => ({ pageId: it.id, ...omit(it, omitKeys[it.id]) }))
      .filter((it) => Object.keys(it).length > 1);
    originPagesRef.current = JSON.parse(stringify(pages));

    if (!finalPages.length) {
      setTimeout(() => (isUpdatePageLocker.current = false), 100);
      return;
    }

    const newPages = await updateWorkspacePages(workflowId, finalPages);
    setTimeout(() => (isUpdatePageLocker.current = false), 100);
    if (newPages) {
      await pagesMutate(newPages, {
        revalidate: false,
      });
    }

    setTimeout(() => (isUpdatePageLocker.current = false), 100);
  };

  useEffect(() => {
    if (!pages) return;
    if (originPagesRef.current === null) {
      originPagesRef.current = JSON.parse(stringify(pages));
    }
    setPage(pages.find((it) => it.id === pageId) ?? null);
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

  const updatePageData = async (key: string, value: unknown) => {
    if (!page) return;
    const pageIndex = pages?.findIndex((it) => it.id === page.id) ?? -1;
    if (pageIndex === -1) return;
    const newPages = cloneDeep(pages);
    if (!newPages?.[pageIndex]) return;
    set(newPages[pageIndex], key, value);
    return setPages(newPages);
  };

  return {
    workflow,
    mutateWorkflow,
    workflowId,
    pages,
    setPages,
    pagesMutate,
    page,
    setPage,
    updatePageData,
    pageId,
    teamId,
    navigateTo,
  };
};

export const useVinesOriginWorkflow = () => {
  const { workflowId, teamId, pageId } = useParams({ from: '/$teamId/workspace/$workflowId/$pageId/' });
  const { data, mutate } = useGetWorkflow(workflowId);

  return {
    workflowId,
    workflow: data,
    mutateWorkflow: mutate,

    teamId,
    pageId,
  };
};
