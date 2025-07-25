import React from 'react';

import { useNavigate, useParams } from '@tanstack/react-router';

import Image, { ImagePreviewType } from 'rc-image';

import { useWorkflowInstanceByArtifactUrl } from '@/apis/workflow/artifact';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { cn, getI18nContent } from '@/utils';

import { useUniImagePreview } from './context';

export const UniImagePreviewDialog: React.FC = () => {
  const { open, imageUrl, closePreview } = useUniImagePreview();

  const navigate = useNavigate();

  const { teamId } = useParams({ from: '/$teamId/' });

  const { data: instance, isLoading } = useWorkflowInstanceByArtifactUrl(imageUrl);

  if (!imageUrl) return null;

  const outputResult = (instance?.output ?? []).filter(({ type }) => ['text'].includes(type));

  const inputReference = (instance?.input ?? []).filter(({ flag, type }) => flag && ['text'].includes(type));

  const inputImagesReference = (instance?.input ?? []).filter(({ flag, type }) => flag && ['image'].includes(type));

  const preview: ImagePreviewType = {
    toolbarRender: (originalNode, info) => {
      // console.log(info);

      // return (
      //   <div className="flex gap-global-1/2 rounded-lg bg-background p-global">
      //     <Button
      //       variant="ghost"
      //       size="icon"
      //       onClick={() => {}}
      //       icon={<FlipHorizontal2 />}
      //     />
      //     <Button variant="ghost" size="icon" onClick={() => {}} icon={<FlipVertical2 />} />
      //     <Button variant="ghost" size="icon" onClick={() => {}} icon={<RotateCcw />} />
      //     <Button variant="ghost" size="icon" onClick={() => {}} icon={<RotateCw />} />
      //     <Button variant="ghost" size="icon" onClick={() => {}} icon={<ZoomIn />} />
      //     <Button variant="ghost" size="icon" onClick={() => {}} icon={<ZoomOut />} />
      //   </div>
      // );
      return <></>;
    },
    // closeIcon: <Button variant="ghost" size="icon" onClick={() => {}} icon={<X />} />,
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && closePreview()}>
      <DialogContent
        className={cn(
          'overflow-hidden transition-all',
          imageUrl && !isLoading && instance
            ? 'max-h-[600px] max-w-[1000px]'
            : 'max-h-[calc(500px+(var(--global-spacing)*3))] max-w-[calc(275px+(var(--global-spacing)*3))]',
        )}
      >
        <div className="flex flex-col gap-global">
          <div className="flex size-full gap-global">
            <div>
              <Image
                src={imageUrl}
                alt="Preview"
                className="max-h-[500px] max-w-[275px] rounded-lg object-contain"
                preview={preview}
              />
            </div>
            {!isLoading && instance && (
              <div className="flex w-full flex-col gap-global">
                <span className="text-sm text-muted-foreground">Instance ID: {instance?.instanceId}</span>
                <div className="flex w-full flex-col gap-global">
                  <div className="flex justify-between gap-global">
                    <div className="flex flex-col gap-global-1/2">
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
                    </div>
                    <div className="flex gap-global-1/2">
                      {inputImagesReference.length > 0 &&
                        inputImagesReference.map(({ data, id }) => {
                          return (
                            <Image
                              key={id}
                              src={data as string}
                              alt="Preview"
                              className="max-h-[150px] rounded-lg object-contain"
                              preview={preview}
                            />
                          );
                        })}
                    </div>
                  </div>
                  <hr className="w-full" />
                  <div className="flex flex-col gap-global-1/2">
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
            <Button
              variant="solid"
              onClick={async () => {
                closePreview();
                navigate({
                  to: '/$teamId',
                  params: {
                    teamId,
                  },
                  search: {
                    activePageFromWorkflowInstanceId: instance.instanceId,
                  },
                });
              }}
            >
              Remix in Studio
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
