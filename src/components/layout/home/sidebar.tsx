import React from 'react';

import { ScrollShadow } from '@nextui-org/scroll-shadow';
import { Calculator, FileBox, GalleryVerticalEnd, Rocket, Server, ShoppingCart } from 'lucide-react';

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { AppLogo } from '@/components/ui/logo';

interface NavListItem {
  name: string;
  label: string;
  icon?: React.ReactNode;
  items?: NavListItem[];
}

const list: NavListItem[] = [
  {
    name: 'workspace',
    label: '工作台',
    icon: <Rocket />,
  },
  {
    name: 'app',
    label: '应用',
    icon: <Server />,
    items: [
      {
        name: 'workflow-app',
        label: '工作流',
      },
      {
        name: 'canvas-app',
        label: '无限画板',
      },
    ],
  },
  {
    name: 'tool',
    label: '工具',
    icon: <Calculator />,
    items: [
      {
        name: 'execute-tool',
        label: '执行类工具',
      },
      {
        name: 'interpret-tool',
        label: '渲染类工具',
      },
    ],
  },
  {
    name: 'model',
    label: '模型',
    icon: <FileBox />,
    items: [
      {
        name: 'language-model',
        label: '语言模型',
      },
      {
        name: 'image-model',
        label: '图像模型',
      },
    ],
  },
  {
    name: 'data',
    label: '数据',
    icon: <GalleryVerticalEnd />,
    items: [
      {
        name: 'text-data',
        label: '文本数据',
      },
      {
        name: 'sheet-data',
        label: '表格数据',
      },
      {
        name: 'media-data',
        label: '富媒体数据',
      },
    ],
  },
  {
    name: 'market',
    label: '市场',
    icon: <ShoppingCart />,
    items: [
      {
        name: 'app-market',
        label: '应用市场',
      },
      {
        name: 'tool-market',
        label: '工具市场',
      },
      {
        name: 'model-market',
        label: '模型市场',
      },
      {
        name: 'data-market',
        label: '数据市场',
      },
    ],
  },
];

interface NavButtonProps {
  children: React.ReactNode;
  icon?: React.ReactNode;
  onClick?: () => void;
}

const NavButton: React.FC<NavButtonProps> = ({ children, icon, onClick }) => {
  return (
    <div className="flex w-full cursor-pointer items-center gap-2 rounded-lg p-2 text-xs hover:bg-whiteA-10 hover:bg-opacity-10">
      <div className="w-[20px] [&>*]:h-[16px] [&>*]:w-[16px]">{icon ?? <></>}</div>
      <span>{children}</span>
    </div>
  );
};

const NavList: React.FC = () => {
  return (
    <Accordion type="multiple" className="flex w-full flex-col gap-1 text-xs text-slateA-8 text-opacity-70">
      {list.map((item, index) => (
        <AccordionItem key={index} value={index.toString()}>
          {item.items ? (
            <>
              <AccordionTrigger>
                <NavButton key={index} icon={item.icon}>
                  {item.label}
                </NavButton>
              </AccordionTrigger>
              <AccordionContent className="flex flex-col gap-1 first:mt-1">
                {item.items.map((subItem, index) => (
                  <NavButton key={index}>{subItem.label}</NavButton>
                ))}
              </AccordionContent>
            </>
          ) : (
            <NavButton key={index} icon={item.icon}>
              {item.label}
            </NavButton>
          )}
        </AccordionItem>
      ))}
    </Accordion>
  );
};

export const Nav: React.FC = () => {
  return (
    <div className="flex h-screen w-[220px] flex-col justify-between p-5">
      <div className="flex h-[calc(100vh-2.5rem-160px)] flex-col gap-4 overflow-y-hidden">
        <div className="flex flex-col items-center">
          <AppLogo />
        </div>
        <ScrollShadow hideScrollBar visibility="both" className="h-[calc(100vh-2.5rem-160px-100px)] overflow-y-scroll">
          <NavList />
        </ScrollShadow>
      </div>
      <div className="h-[160px] rounded-xl bg-white p-2">user info placeholder</div>
    </div>
  );
};
