import { useState, useRef, useCallback } from 'react';

export interface UseVoiceRecordingOptions {
  onTranscript?: (text: string) => void;
  onError?: (error: Error) => void;
}

export interface UseVoiceRecordingReturn {
  isRecording: boolean;
  isTranscribing: boolean;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<void>;
  error: Error | null;
}

export function useVoiceRecording({
  onTranscript,
  onError,
}: UseVoiceRecordingOptions = {}): UseVoiceRecordingReturn {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const startRecording = useCallback(async () => {
    try {
      setError(null);

      // 请求麦克风权限
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // 创建 MediaRecorder
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      // 收集音频数据
      mediaRecorder.addEventListener('dataavailable', (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      });

      // 录音结束时处理
      mediaRecorder.addEventListener('stop', async () => {
        try {
          setIsTranscribing(true);

          // 合并音频数据
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });

          // 调用 STT API
          const formData = new FormData();
          formData.append('file', audioBlob, 'recording.webm');

          const response = await fetch('/api/STT', {
            method: 'POST',
            body: formData,
          });

          if (!response.ok) {
            throw new Error('STT API request failed');
          }

          const result = await response.json();
          const text = result.text || '';

          if (text && onTranscript) {
            onTranscript(text);
          }
        } catch (err) {
          const error = err instanceof Error ? err : new Error('Unknown error');
          setError(error);
          onError?.(error);
        } finally {
          setIsTranscribing(false);

          // 停止所有音轨
          stream.getTracks().forEach(track => track.stop());
        }
      });

      // 开始录音
      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to start recording');
      setError(error);
      onError?.(error);
    }
  }, [onTranscript, onError]);

  const stopRecording = useCallback(async () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  }, [isRecording]);

  return {
    isRecording,
    isTranscribing,
    startRecording,
    stopRecording,
    error,
  };
}
