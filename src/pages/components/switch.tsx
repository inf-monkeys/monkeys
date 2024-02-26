import React, { useState } from 'react';

import { createFileRoute } from '@tanstack/react-router';

import { TempComponentDemoWrapper } from '@/components/layout-wrapper/demo';
import { Label } from '@/components/ui/label.tsx';
import { Switch } from '@/components/ui/switch';

export const SwitchPage: React.FC = () => {
  const [checked, setChecked] = useState(false);
  const [loading, setLoading] = useState(false);
  return (
    <div className="flex gap-4">
      <div className="flex gap-3 p-4">
        <TempComponentDemoWrapper title="switch">
          <div className="flex items-center gap-2">
            <Switch id="default" />
            <Label htmlFor="default">default</Label>
          </div>
          <div className="flex items-center gap-2">
            <Switch id="disabled" disabled />
            <Label htmlFor="disabled">disabled</Label>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              id="loading"
              loading={loading}
              onCheckedChange={(v) => {
                setLoading(v);
                setTimeout(() => {
                  setLoading(!v);
                }, 5000);
              }}
            />
            <Label htmlFor="loading">loading</Label>
          </div>
          <div className="flex items-center gap-2">
            <Switch id="state" checked={checked} />
            <Label htmlFor="state">state</Label>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              id="onChange"
              onCheckedChange={(v) => {
                setChecked(v);
              }}
            />
            <Label htmlFor="onChange">onChange</Label>
          </div>
          <div className="flex items-center gap-2">
            <Switch id="defaultChecked" defaultChecked />
            <Label htmlFor="defaultChecked">defaultChecked</Label>
          </div>
        </TempComponentDemoWrapper>
        <TempComponentDemoWrapper title="size">
          <div className="flex items-center gap-2">
            <Switch id="size-default" />
            <Label htmlFor="size-default">default</Label>
          </div>
          <div className="flex items-center gap-2">
            <Switch id="size-large" size="large" />
            <Label htmlFor="size-large">large</Label>
          </div>
          <div className="flex items-center gap-2">
            <Switch id="size-small" size="small" />
            <Label htmlFor="size-small">small</Label>
          </div>
        </TempComponentDemoWrapper>
      </div>
      <div className="dark flex gap-3 bg-black p-4">
        <TempComponentDemoWrapper title="size">
          <div className="flex items-center gap-2">
            <Switch id="size-default" />
            <Label htmlFor="size-default">default</Label>
          </div>
          <div className="flex items-center gap-2">
            <Switch id="size-large" size="large" />
            <Label htmlFor="size-large">large</Label>
          </div>
          <div className="flex items-center gap-2">
            <Switch id="size-small" size="small" />
            <Label htmlFor="size-small">small</Label>
          </div>
        </TempComponentDemoWrapper>
      </div>
    </div>
  );
};

export const Route = createFileRoute('/components/switch')({
  component: SwitchPage,
});
