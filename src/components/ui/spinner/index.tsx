import * as React from 'react';

import styled from 'styled-components';

import { CheckmarkIcon } from '@/components/ui/spinner/icon/checkmark.tsx';
import { ErrorIcon } from '@/components/ui/spinner/icon/error.tsx';
import { LoaderIcon } from '@/components/ui/spinner/icon/loader.tsx';

export type SpinnerType = undefined | 'success' | 'error';

interface SpinnerProps {
  loading?: boolean;
  type?: SpinnerType;
  className?: string;
}

const StatusWrapper = styled('div')`
  position: absolute;
`;

const IndicatorWrapper = styled('div')`
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  min-width: 20px;
  min-height: 20px;
`;

/**
 * Spinner
 * @param loading 是否在加载，默认为 `true`
 * @param type 加载结果类型，默认为 `undefined`，当 `loading` 为 `false` 时，默认展示 `success`
 * @param className
 * @constructor
 */
const Spinner: React.FC<SpinnerProps> = ({ loading = true, type, className }) => {
  return (
    <IndicatorWrapper className={className}>
      <LoaderIcon />
      {!loading && <StatusWrapper>{type === 'error' ? <ErrorIcon /> : <CheckmarkIcon />}</StatusWrapper>}
    </IndicatorWrapper>
  );
};

Spinner.displayName = 'Spinner';

export { Spinner };
