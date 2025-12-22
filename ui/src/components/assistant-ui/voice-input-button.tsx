import { MicIcon, Loader2Icon } from 'lucide-react';
import { FC, useCallback } from 'react';
import { useVoiceRecording } from '@/hooks/use-voice-recording';
import { TooltipIconButton } from './tooltip-icon-button';
import { cn } from '@/utils/index';

interface VoiceInputButtonProps {
  onTranscript: (text: string) => void;
}

export const VoiceInputButton: FC<VoiceInputButtonProps> = ({ onTranscript }) => {
  const { isRecording, isTranscribing, startRecording, stopRecording, error } = useVoiceRecording({
    onTranscript,
    onError: (err) => {
      console.error('Voice recording error:', err);
    },
  });

  const handleClick = useCallback(async () => {
    if (isRecording) {
      await stopRecording();
    } else {
      await startRecording();
    }
  }, [isRecording, startRecording, stopRecording]);

  // 如果正在转录，显示加载状态
  if (isTranscribing) {
    return (
      <TooltipIconButton
        tooltip="Transcribing..."
        side="bottom"
        variant="ghost"
        size="icon"
        className="aui-voice-input-button size-8"
        disabled
      >
        <Loader2Icon className="size-4 animate-spin" />
      </TooltipIconButton>
    );
  }

  return (
    <TooltipIconButton
      tooltip={isRecording ? 'Stop recording' : 'Voice input'}
      side="bottom"
      variant="ghost"
      size="icon"
      className={cn(
        'aui-voice-input-button size-8 transition-colors',
        isRecording && 'text-red-500 hover:text-red-600 animate-pulse'
      )}
      onClick={handleClick}
      aria-label={isRecording ? 'Stop recording' : 'Start voice input'}
    >
      <MicIcon className="size-4" />
    </TooltipIconButton>
  );
};
