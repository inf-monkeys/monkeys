import React from 'react';

interface IImageDetailLayoutProps {
  children: React.ReactNode;
  rightSidebar?: React.ReactNode;
}

const ImageDetailLayout: React.FC<IImageDetailLayoutProps> = ({ children, rightSidebar }) => {
  return (
    <div className="flex h-full min-h-screen w-full flex-col bg-slate-3">
      <div className="flex flex-1">
        {/* 主内容区域 */}
        <div className="flex flex-1">{children}</div>

        {/* 右侧边栏 */}
        {rightSidebar && rightSidebar}
      </div>
    </div>
  );
};

export default ImageDetailLayout;
