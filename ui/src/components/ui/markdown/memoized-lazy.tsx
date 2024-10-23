import { FC, memo } from 'react';

import ReactMarkdown, { Options } from 'react-markdown';

const MemoizedReactMarkdown: FC<Options> = memo(
  ReactMarkdown,
  (prevProps, nextProps) => prevProps.children === nextProps.children && prevProps.className === nextProps.className,
);

export default MemoizedReactMarkdown;
