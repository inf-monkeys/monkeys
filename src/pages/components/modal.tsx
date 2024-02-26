import React, { useState } from 'react';

import { createFileRoute } from '@tanstack/react-router';

import { TempComponentDemoWrapper } from '@/components/devtools/temp-component-demo-wrapper';
import { Button } from '@/components/ui/button';
import {
  Modal,
  ModalContent,
  ModalDescription,
  ModalFooter,
  ModalHeader,
  ModalTitle,
  ModalTrigger,
} from '@/components/ui/modal';

export const ModalPage: React.FC = () => {
  const [modalOpen, setModalOpen] = useState(false);
  return (
    <div className="flex flex-col gap-4">
      <a href="https://www.radix-ui.com/primitives/docs/components/dialog#api-reference">API</a>
      <div className="flex gap-3 p-4">
        <TempComponentDemoWrapper title="props type & content type">
          <Modal>
            <ModalTrigger asChild>
              <Button>default</Button>
            </ModalTrigger>
            <ModalContent className="sm:max-w-[425px]">
              <ModalHeader>
                <ModalTitle>Edit profile</ModalTitle>
                <ModalDescription>Make changes to your profile here. Click save when you're done.</ModalDescription>
              </ModalHeader>
              <div className="grid gap-4 py-4">111</div>
              <ModalFooter>
                <Button type="submit">Save changes</Button>
              </ModalFooter>
            </ModalContent>
          </Modal>
          <Modal open={modalOpen} onClose={() => setModalOpen(false)}>
            <ModalContent className="sm:max-w-[425px]">
              <div className="grid gap-4 py-4">111</div>
            </ModalContent>
          </Modal>
          <Button onClick={() => setModalOpen(!modalOpen)}>state</Button>
        </TempComponentDemoWrapper>
      </div>
    </div>
  );
};

export const Route = createFileRoute('/components/modal')({
  component: ModalPage,
});
