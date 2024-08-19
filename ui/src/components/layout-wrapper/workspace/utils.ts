import { useEffect, useRef } from 'react';

import { useNavigate, useParams } from '@tanstack/react-router';

import { useMemoizedFn } from 'ahooks';
import { differenceWith, isEqual, omit, set } from 'lodash';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { updateWorkspacePages, useWorkspacePagesWithWorkflowId } from '@/apis/pages';
import { IPageType } from '@/apis/pages/typings.ts';
import { useGetWorkflow } from '@/apis/workflow';
import { Route } from '@/pages/$teamId/workspace/$workflowId/$pageId';
import { useFlowStore } from '@/store/useFlowStore';
import { usePageStore } from '@/store/usePageStore';
import { cloneDeep } from '@/utils';
import { stringify } from '@/utils/fast-stable-stringify.ts';

export const useVinesPage = () => {
  const { t } = useTranslation();

  const navigate = useNavigate({ from: Route.fullPath });
  const {
    workflowId: routeWorkflowId,
    pageId: routePageId,
    teamId,
  } = useParams({ from: '/$teamId/workspace/$workflowId/$pageId/' });

  const storeWorkflowId = useFlowStore((s) => s.workflowId);
  const workflowId = routeWorkflowId ?? storeWorkflowId;

  const page = usePageStore((s) => s.page);
  const pageId = routePageId ?? page?.id ?? '';

  const { data: pages, mutate: pagesMutate } = useWorkspacePagesWithWorkflowId(workflowId);

  const setPage = usePageStore((s) => s.setPage);

  const { data: workflow, mutate: mutateWorkflow } = useGetWorkflow(workflowId);

  const originPagesRef = useRef<IPageType[] | null>(null);
  const isUpdatePageLocker = useRef(false);
  const setPages = useMemoizedFn(async (pages: IPageType[]) => {
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
  });

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

  const updatePageData = useMemoizedFn(async (key: string, value: unknown) => {
    if (!page) return;
    const pageIndex = pages?.findIndex((it) => it.id === page.id) ?? -1;
    if (pageIndex === -1) return;
    const newPages = cloneDeep(pages);
    if (!newPages?.[pageIndex]) return;
    set(newPages[pageIndex], key, value);
    return setPages(newPages);
  });

  const setCustomOptions = useMemoizedFn(async (options: Record<string, any>) => {
    if (!pages) return;
    const currentPage = pages.findIndex(({ id }) => id === pageId);
    if (currentPage === -1) return;

    const newPages = cloneDeep(pages);

    const prevOptions = newPages[currentPage]?.customOptions;
    newPages[currentPage].customOptions = {
      ...prevOptions,
      ...options,
    };

    toast.promise(setPages(newPages), {
      loading: t('common.save.loading'),
      success: t('common.save.success'),
      error: t('common.save.error'),
    });
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
    updatePageData,
    pageId,
    teamId,
    navigateTo,
    setCustomOptions,
  };
};

export const useVinesOriginWorkflow = (initialWorkflowId?: string) => {
  const { workflowId, teamId, pageId } = useParams({ from: '/$teamId/workspace/$workflowId/$pageId/' });
  const { data, mutate } = useGetWorkflow(initialWorkflowId ?? workflowId);

  return {
    workflowId,
    workflow: data,
    mutateWorkflow: mutate,

    teamId,
    pageId,
  };
};
