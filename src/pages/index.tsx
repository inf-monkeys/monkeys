import React, { useState } from 'react';

import { createFileRoute } from '@tanstack/react-router';

import { AlarmClock } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Spinner, SpinnerType } from '@/components/ui/spinner';

const App: React.FC = () => {
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
    <div className="flex flex-col">
      <div className="flex items-center justify-center gap-4 text-white">
        <div className="flex flex-col gap-2">
          <span>theme - default</span>
          <div className="flex flex-col gap-2">
            <Button theme="primary">primary</Button>
            <Button theme="secondary">secondary</Button>
            <Button theme="tertiary">tertiary</Button>
            <Button theme="warning">warning</Button>
            <Button theme="danger">danger</Button>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <span>theme - solid</span>
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
        </div>
        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <div className="flex flex-col gap-2">
              <span>variant</span>
              <Button>default</Button>
              <Button variant="solid">solid</Button>
            </div>
            <div className="flex flex-col gap-2">
              <span>disabled</span>
              <Button disabled>default</Button>
              <Button disabled variant="solid">
                solid
              </Button>
            </div>
            <div className="flex flex-col gap-2">
              <span>loading</span>
              <Spinner loading={loading} type={loadResult} />
              <Button onClick={() => toggle()} loading={loading} loadResult={loadResult}>
                default
              </Button>
              <Button onClick={() => toggle()} loading={loading} loadResult={loadResult} variant="solid">
                solid
              </Button>
            </div>
          </div>
          <div className="flex-2 flex gap-2">
            <div className="flex flex-col gap-2">
              <span>icon</span>
              <div className="flex gap-2">
                <Button icon={<AlarmClock />}>icon with text</Button>
                <Button icon={<AlarmClock />} />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <span>size</span>
              <div className="flex gap-2">
                <Button>default</Button>
                <Button size="small">small</Button>
                <Button size="large">large</Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export const Route = createFileRoute('/')({
  component: App,
});
