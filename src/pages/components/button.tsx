import React, { useState } from 'react';

import { createFileRoute } from '@tanstack/react-router';

import { AlarmClock } from 'lucide-react';

import { TempComponentDemoWrapper } from '@/components/layout-wrapper/demo';
import { Button } from '@/components/ui/button';
import { SpinnerType } from '@/components/ui/spinner';

const ButtonPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [loadResult, setLoadResult] = useState<SpinnerType>();

  const toggle = () => {
    setLoadResult(undefined);
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setLoadResult('success');
    }, 2000);
  };

  return (
    <div className="flex gap-4">
      <div className="flex gap-3 p-4">
        <TempComponentDemoWrapper title="theme - default">
          <Button theme="primary">primary</Button>
          <Button theme="secondary">secondary</Button>
          <Button theme="tertiary">tertiary</Button>
          <Button theme="warning">warning</Button>
          <Button theme="danger">danger</Button>
        </TempComponentDemoWrapper>
        <TempComponentDemoWrapper title="theme - solid">
          <Button variant="solid" theme="primary">
            primary
          </Button>
          <Button variant="solid" theme="secondary">
            secondary
          </Button>
          <Button variant="solid" theme="tertiary">
            tertiary
          </Button>
          <Button variant="solid" theme="warning">
            warning
          </Button>
          <Button variant="solid" theme="danger">
            danger
          </Button>
        </TempComponentDemoWrapper>
        <TempComponentDemoWrapper title="variant">
          <Button>default</Button>
          <Button variant="solid">solid</Button>
        </TempComponentDemoWrapper>
        <TempComponentDemoWrapper title="disabled">
          <Button disabled>default</Button>
          <Button disabled variant="solid">
            solid
          </Button>
        </TempComponentDemoWrapper>
        <TempComponentDemoWrapper title="loading">
          <Button onClick={() => toggle()} loading={loading} loadResult={loadResult}>
            default
          </Button>
          <Button onClick={() => toggle()} loading={loading} loadResult={loadResult} variant="solid">
            solid
          </Button>
        </TempComponentDemoWrapper>
        <TempComponentDemoWrapper title="icon">
          <Button icon={<AlarmClock />}>icon with text</Button>
          <Button icon={<AlarmClock />} />
        </TempComponentDemoWrapper>
        <TempComponentDemoWrapper title="size">
          <Button>default</Button>
          <Button size="small">small</Button>
          <Button size="large">large</Button>
        </TempComponentDemoWrapper>
      </div>
      <div className="dark flex gap-3 bg-black p-4">
        <TempComponentDemoWrapper title="theme - default">
          <Button theme="primary">primary</Button>
          <Button theme="secondary">secondary</Button>
          <Button theme="tertiary">tertiary</Button>
          <Button theme="warning">warning</Button>
          <Button theme="danger">danger</Button>
        </TempComponentDemoWrapper>
        <TempComponentDemoWrapper title="theme - solid">
          <Button variant="solid" theme="primary">
            primary
          </Button>
          <Button variant="solid" theme="secondary">
            secondary
          </Button>
          <Button variant="solid" theme="tertiary">
            tertiary
          </Button>
          <Button variant="solid" theme="warning">
            warning
          </Button>
          <Button variant="solid" theme="danger">
            danger
          </Button>
        </TempComponentDemoWrapper>
      </div>
    </div>
  );
};
export const Route = createFileRoute('/components/button')({
  component: ButtonPage,
});
