import React from 'react';

import { useWorkflowInstanceByArtifactUrl } from '@/apis/workflow/artifact';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { cn, getI18nContent } from '@/utils';

import { useUniImagePreview } from './context';

export const UniImagePreviewDialog: React.FC = () => {
  const { open, imageUrl, closePreview } = useUniImagePreview();

  const { data: instance, isLoading } = useWorkflowInstanceByArtifactUrl(imageUrl);

  if (!imageUrl) return null;

  const outputResult = (instance?.output ?? []).filter(({ type }) => ['text'].includes(type));

  const inputReference = (instance?.input ?? []).filter(({ flag, type }) => flag && ['text'].includes(type));

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && closePreview()}>
      <DialogContent
        className={cn(
          'overflow-hidden transition-all',
          !isLoading && instance
            ? 'max-h-[600px] max-w-[1000px]'
            : 'max-h-[calc(500px+(var(--global-spacing)*3))] max-w-[calc(275px+(var(--global-spacing)*3))]',
        )}
      >
        <div className="flex flex-col gap-global">
          <div className="flex size-full gap-global">
            <img src={imageUrl} alt="Preview" className="max-h-[500px] max-w-[275px] rounded-lg object-contain" />
            {!isLoading && instance && (
              <div className="flex w-full flex-col gap-global">
                <span className="text-sm text-muted-foreground">Instance ID: {instance?.instanceId}</span>
                <div className="flex w-full flex-col gap-global">
                  <span className="font-bold">Input Reference</span>
                  <div className="flex flex-col gap-global-1/2">
                    {inputReference.length > 0 ? (
                      inputReference.map(({ displayName, data, id, type }) => {
                        switch (type) {
                          case 'text':
                            return (
                              <span className="text-sm" key={id}>
                                {getI18nContent(displayName)}: {data as string}
                              </span>
                            );

                          default:
                            return null;
                        }
                      })
                    ) : (
                      <span className="text-sm">No input reference can display.</span>
                    )}
                  </div>
                  <hr className="w-full" />
                  <span className="font-bold">Output Result</span>
                  <div className="flex flex-col gap-global-1/2">
                    {outputResult.length > 0 ? (
                      outputResult?.map(({ data, key }) => {
                        return (
                          <span className="text-sm" key={key}>
                            {data as string}
                          </span>
                        );
                      })
                    ) : (
                      <span className="text-sm">No text output can display.</span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        {!isLoading && instance && (
          <div className="flex justify-between gap-global">
            <Button
              variant="outline"
              onClick={() => {
                closePreview();
              }}
            >
              Cancel
            </Button>
            <Button variant="solid">Remix in Studio</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
