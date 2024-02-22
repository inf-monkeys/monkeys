import React from 'react';

import { createFileRoute } from '@tanstack/react-router';

import { Accessibility, Cat, Dog } from 'lucide-react';

import { TempComponentDemoWrapper } from '@/components/devtools/temp-component-demo-wrapper';
import { Tag } from '@/components/ui/tag';
import { TagGroup } from '@/components/ui/tag/tag-group.tsx';

const list = [{ children: 'test1' }, { children: 'test2' }, { children: 'test3' }, { children: 'test4' }];

export const TagPage: React.FC = () => {
  return (
    <div className="flex gap-4">
      <div className="flex gap-3 p-4">
        <TempComponentDemoWrapper title="size">
          <Tag>small</Tag>
          <Tag size="large">large</Tag>
        </TempComponentDemoWrapper>
        <TempComponentDemoWrapper title="shape">
          <Tag>square</Tag>
          <Tag shape="circle">circle</Tag>
        </TempComponentDemoWrapper>
        <TempComponentDemoWrapper title="color">
          <Tag>tertiary</Tag>
          <Tag color="primary">primary</Tag>
          <Tag color="secondary">secondary</Tag>
          <Tag color="warning">warning</Tag>
          <Tag color="danger">danger</Tag>
        </TempComponentDemoWrapper>
        <TempComponentDemoWrapper title="closable">
          <Tag>default</Tag>
          <Tag closable>closable</Tag>
        </TempComponentDemoWrapper>
        <TempComponentDemoWrapper title="onClick">
          <Tag>default</Tag>
          <Tag onClick={() => alert('test')}>onClick</Tag>
        </TempComponentDemoWrapper>
        <TempComponentDemoWrapper title="icon">
          <Tag>default</Tag>
          <Tag prefixIcon={<Accessibility />}>prefix</Tag>
          <Tag suffixIcon={<Cat />}>suffix</Tag>
          <Tag suffixIcon={<Dog />} color="danger">
            color
          </Tag>
        </TempComponentDemoWrapper>
        <TempComponentDemoWrapper title="tag group">
          <TagGroup tagList={list} maxTagCount={3} />
        </TempComponentDemoWrapper>
      </div>
      <div className="dark flex gap-3 bg-black p-4">
        <TempComponentDemoWrapper title="color">
          <Tag>tertiary</Tag>
          <Tag color="primary">primary</Tag>
          <Tag color="secondary">secondary</Tag>
          <Tag color="warning">warning</Tag>
          <Tag color="danger">danger</Tag>
        </TempComponentDemoWrapper>
        <TempComponentDemoWrapper title="tag group">
          <TagGroup tagList={list} maxTagCount={3} />
        </TempComponentDemoWrapper>
      </div>
    </div>
  );
};

export const Route = createFileRoute('/components/tag')({
  component: TagPage,
});
