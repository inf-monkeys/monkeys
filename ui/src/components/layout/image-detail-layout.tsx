import React from 'react';

interface IImageDetailLayoutProps {
  children: React.ReactNode;
}

const ImageDetailLayout: React.FC<IImageDetailLayoutProps> = ({ children }) => {
  return (
    <div className="flex h-full min-h-screen w-full flex-col bg-background">
      {/* 顶部 header，只包含 WorkflowInfoCard */}
      {/* <SpaceHeader> */}
      {/* <WorkflowInfoCard /> */}
      {/* </SpaceHeader> */}
      {/* 主体内容区域 */}
      <div className="flex flex-1 flex-col">{children}</div>
    </div>
  );
};

export default ImageDetailLayout;
