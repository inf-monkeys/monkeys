import React, { useEffect, useState } from 'react';

import { AnimatePresence, motion } from 'framer-motion';
import { isEmpty, isString } from 'lodash';
import { Repeat2, Send, StopCircle, Trash2, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { useCreateWorkflowChatSession, useWorkflowChatSessions } from '@/apis/workflow/chat';
import { CleanMessages } from '@/components/layout/workspace/vines-view/chat/chat-bot/input/clean-messages.tsx';
import { ImageUploadButton } from '@/components/layout/workspace/vines-view/chat/chat-bot/input/image-upload-button';
import {
  IVinesMessage,
  IVinesMessageContent,
  IVinesMessageContentItem,
} from '@/components/layout/workspace/vines-view/chat/chat-bot/use-chat.ts';
import { AutosizeTextarea } from '@/components/ui/autosize-textarea.tsx';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { useSubmitHandler } from '@/hooks/use-submit-handler.ts';

interface IVinesChatInputProps {
  id: string;
  multipleChat?: boolean;
  autoCreateSession?: boolean;
  setChatId?: (chatId: string) => void;

  messages: IVinesMessage[];
  setMessages: (messages: IVinesMessage[]) => void;
  input: IVinesMessageContent;
  setInput: React.Dispatch<React.SetStateAction<IVinesMessageContent>>;
  handleEnterPress: () => void;
  isLoading: boolean;
  stop: () => void;
  reload: () => Promise<null | undefined>;
}

export const VinesChatInput: React.FC<IVinesChatInputProps> = ({
  id,
  multipleChat = true,
  autoCreateSession = false,
  setChatId,

  messages,
  setMessages,
  input,
  setInput,
  handleEnterPress,
  isLoading,
  stop,
  reload,
}) => {
  const { t } = useTranslation();
  const [attachedImages, setAttachedImages] = useState<string[]>([]);

  const { mutate } = useWorkflowChatSessions(id);
  const { trigger } = useCreateWorkflowChatSession();
  const [chatSessions, setChatSessions] = useLocalStorage<Record<string, string>>('vines-ui-chat-session', {});

  const [textInput, setTextInput] = useState<string>('');

  const handleSend = () => {
    if (autoCreateSession) {
      toast.promise(trigger({ displayName: t('workspace.chat-view.sidebar.create.def-label'), workflowId: id }), {
        loading: t('workspace.chat-view.sidebar.create.loading'),
        success: (session) => {
          if (session) {
            const sessionId = session.id;
            setChatSessions({
              ...chatSessions,
              [id]: sessionId,
            });

            setChatId?.(sessionId);
          }

          setTimeout(() => {
            handleEnterPress();
          }, 80);

          return t('workspace.chat-view.sidebar.create.success');
        },
        error: t('workspace.chat-view.sidebar.create.error'),
        finally: () => void mutate(),
      });
    } else {
      handleEnterPress();
    }
    setTextInput('');
    setAttachedImages([]);
  };

  useEffect(() => {
    setInput(
      attachedImages.length > 0
        ? [
            {
              type: 'text',
              text: textInput,
            },
            ...attachedImages.map(
              (imageUrl) =>
                ({
                  type: 'image_url',
                  image_url: {
                    url: imageUrl,
                  },
                }) as IVinesMessageContentItem,
            ),
          ]
        : textInput,
    );
  }, [textInput, attachedImages]);

  const handleImagesSelected = (imageUrls: string[]) => {
    setAttachedImages((prev) => [...prev, ...imageUrls]);
  };

  const removeImage = (index: number) => {
    setAttachedImages((prev) => prev.filter((_, i) => i !== index));
  };

  const { submitKey } = useSubmitHandler();

  const [shouldDisableButton, setShouldDisableButton] = useState(true);
  const hasMessages = messages?.length > 0;
  useEffect(() => {
    // 数组为空或者字符串trim后为空时禁用按钮
    setShouldDisableButton(isEmpty(input) || (isString(input) && isEmpty(input.trim())));
  }, [input]);
  return (
    <div className="space-y-1.5 pb-1 pt-2">
      <div className="flex items-center gap-2">
        {hasMessages && (
          <>
            {multipleChat && (
              <CleanMessages setMessages={setMessages}>
                <Button className="!p-1.5 [&>div>svg]:size-3" variant="outline" icon={<Trash2 size={10} />} />
              </CleanMessages>
            )}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  className="!p-1.5 [&>div>svg]:size-3"
                  variant="outline"
                  icon={<Repeat2 size={10} />}
                  onClick={reload}
                />
              </TooltipTrigger>
              <TooltipContent>{t('workspace.chat-view.chat-bot.resend-latest-message')}</TooltipContent>
            </Tooltip>
          </>
        )}
      </div>

      {/* 显示已选择的图片 */}
      {attachedImages.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-2">
          {attachedImages.map((url, index) => (
            <div key={index} className="relative h-16 w-16 overflow-hidden rounded border">
              <img src={url} alt="附件" className="h-full w-full object-cover" />
              <button
                className="absolute right-0 top-0 flex h-5 w-5 items-center justify-center rounded-bl bg-background/80"
                onClick={() => removeImage(index)}
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="relative overflow-hidden">
        <AutosizeTextarea
          onSubmit={handleSend}
          placeholder={t('workspace.chat-view.chat-bot.chat.placeholder')}
          maxHeight={150}
          minHeight={80}
          value={textInput}
          onChange={(val) => setTextInput(val.target.value)}
        />
        <div className="absolute bottom-2 right-2 flex items-center gap-2">
          {/* 图片上传按钮 */}
          <ImageUploadButton onImagesSelected={handleImagesSelected} />

          <span className="pointer-events-none z-0 select-none text-xs text-opacity-50">
            {t('workspace.chat-view.chat-bot.chat.tips', { submitKey })}
          </span>
          <AnimatePresence mode="popLayout">
            {isLoading ? (
              <motion.div
                key="vines-chat-mode-stop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <Button
                  size="small"
                  variant="outline"
                  className="text-red-10 [&_svg]:stroke-red-10"
                  icon={<StopCircle />}
                  onClick={stop}
                >
                  {t('workspace.chat-view.chat-bot.chat.stop')}
                </Button>
              </motion.div>
            ) : (
              <motion.div
                key="vines-chat-mode-send"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <Button
                  variant="outline"
                  size="small"
                  icon={<Send />}
                  loading={isLoading}
                  disabled={shouldDisableButton}
                  onClick={handleSend}
                >
                  {t('workspace.chat-view.chat-bot.chat.send')}
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
