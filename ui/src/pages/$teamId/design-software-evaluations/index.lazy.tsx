import { useEffect } from 'react';

import { createLazyFileRoute, useNavigate } from '@tanstack/react-router';

import {
  useSetMediaDataFilter,
  useSetMediaDataPagination,
  useSetMediaDataSearch,
  useSetMediaDataSelectedRuleId,
} from '@/store/useMediaDataStore';

const TARGET_KEYWORD = '测试自定义参数化建模';

export const DesignSoftwareEvaluations: React.FC = () => {
  const navigate = useNavigate();
  const { teamId } = Route.useParams();

  const setSearch = useSetMediaDataSearch();
  const setPagination = useSetMediaDataPagination();
  const setFilter = useSetMediaDataFilter();
  const setSelectedRuleId = useSetMediaDataSelectedRuleId();

  useEffect(() => {
    setSearch(TARGET_KEYWORD);
    setPagination({ pageIndex: 0 });
    setFilter({});
    setSelectedRuleId(undefined);

    navigate({
      to: '/$teamId/nav/concept-design:design-templates-and-innovation-approaches/design-project',
      params: { teamId },
      replace: true,
    });
  }, [navigate, setFilter, setPagination, setSearch, setSelectedRuleId, teamId]);

  return null;
};

export const Route = createLazyFileRoute('/$teamId/design-software-evaluations/')({
  component: DesignSoftwareEvaluations,
});
