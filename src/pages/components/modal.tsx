import React, { useState } from 'react';

import { createFileRoute } from '@tanstack/react-router';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from 'src/components/ui/dialog';

import { TempComponentDemoWrapper } from '@/components/layout-wrapper/demo';
import { Button } from '@/components/ui/button';

export const ModalPage: React.FC = () => {
  const [modalOpen, setModalOpen] = useState(false);
  return (
    <div className="flex flex-col gap-4">
      <a href="https://www.radix-ui.com/primitives/docs/components/dialog#api-reference">API</a>
      <div className="flex gap-3 p-4">
        <TempComponentDemoWrapper title="props type & content type">
          <Dialog>
            <DialogTrigger asChild>
              <Button>default</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Edit profile</DialogTitle>
                <DialogDescription>Make changes to your profile here. Click save when you're done.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">111</div>
              <DialogFooter>
                <Button type="submit">Save changes</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Dialog open={modalOpen} onClose={() => setModalOpen(false)}>
            <DialogContent className="sm:max-w-[425px]">
              <div className="grid gap-4 py-4">111</div>
            </DialogContent>
          </Dialog>
          <Button onClick={() => setModalOpen(!modalOpen)}>state</Button>
        </TempComponentDemoWrapper>
      </div>
    </div>
  );
};

export const Route = createFileRoute('/components/modal')({
  component: ModalPage,
});
