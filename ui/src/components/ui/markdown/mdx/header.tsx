import React from 'react';

interface IMdxCurlHeaderProps {
  url: string;
  method: 'PUT' | 'DELETE' | 'GET' | 'POST';
  title: string;
  name: string;
}

export const MdxCurlHeader: React.FC<IMdxCurlHeaderProps> = ({ url, method, title, name }) => {
  return (
    <>
      <div className="mt-2 flex items-center gap-x-3">
        <span className="rounded-md border border-input px-1.5 font-mono text-xs font-semibold leading-6">
          {method}
        </span>
        <span className="font-mono text-xs text-zinc-400">{url}</span>
      </div>
      <h2 className="mt-2 scroll-mt-32">
        <a href={name} className="group text-inherit no-underline hover:text-inherit">
          {title}
        </a>
      </h2>
    </>
  );
};
