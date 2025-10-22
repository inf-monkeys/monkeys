import { useEffect, useRef, useState } from 'react';

import { toast } from 'sonner';

import { vinesHeader } from '@/apis/utils';

interface StepThumbnailTask {
  mediaFileId: string;
  fileUrl: string;
  fileName: string;
}

/**
 * 检查文件是否是 STEP 或 GLB 格式
 */
export function isStepFile(filename: string): boolean {
  return /\.(step|stp|glb)$/i.test(filename);
}

/**
 * STEP 和 GLB 文件自动缩略图生成 Hook
 *
 * 在 STEP 或 GLB 文件上传成功后，自动使用 StepViewer 生成缩略图并更新
 */
export function useStepAutoThumbnail() {
  const [tasks, setTasks] = useState<StepThumbnailTask[]>([]);
  const [currentTask, setCurrentTask] = useState<StepThumbnailTask | null>(null);
  const processingRef = useRef(false);
  const onThumbnailUpdatedRef = useRef<((mediaFileId: string) => void) | null>(null);

  /**
   * 添加缩略图生成任务
   */
  const addTask = (mediaFileId: string, fileUrl: string, fileName: string) => {
    if (!isStepFile(fileName)) {
      return;
    }

    setTasks((prev) => [...prev, { mediaFileId, fileUrl, fileName }]);
  };

  /**
   * 上传截图到 OSS
   */
  const uploadScreenshot = async (blob: Blob, fileName: string): Promise<string | null> => {
    try {
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substr(2, 9);
      const thumbnailFileName = `step-thumbnails/${timestamp}_${randomId}_${fileName.replace(/\.(step|stp|glb)$/i, '')}.png`;

      const formData = new FormData();
      formData.append('file', blob, `${fileName.replace(/\.(step|stp|glb)$/i, '')}.png`);
      formData.append('key', thumbnailFileName);

      const headers = vinesHeader({});
      delete headers['Content-Type'];

      const response = await fetch('/api/medias/s3/file', {
        method: 'POST',
        headers,
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.status}`);
      }

      const data = await response.json();
      const thumbnailUrl = data.data;

      return thumbnailUrl;
    } catch (error) {
      console.error('❌ [StepAutoThumbnail] Failed to upload screenshot:', error);
      return null;
    }
  };

  /**
   * 更新媒体文件的缩略图
   */
  const updateMediaThumbnail = async (mediaFileId: string, thumbnailUrl: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/media-files/${mediaFileId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...vinesHeader({}),
        },
        body: JSON.stringify({
          iconUrl: thumbnailUrl,
        }),
      });

      if (!response.ok) {
        throw new Error(`Update failed: ${response.status}`);
      }

      return true;
    } catch (error) {
      console.error('❌ [StepAutoThumbnail] Failed to update media thumbnail:', error);
      return false;
    }
  };

  /**
   * 处理缩略图生成任务
   */
  const processTask = async (task: StepThumbnailTask, screenshotBlob: Blob) => {
    try {
      // 1. 上传截图到 OSS
      const thumbnailUrl = await uploadScreenshot(screenshotBlob, task.fileName);
      if (!thumbnailUrl) {
        throw new Error('Failed to upload screenshot');
      }

      // 2. 更新媒体文件记录
      const success = await updateMediaThumbnail(task.mediaFileId, thumbnailUrl);
      if (!success) {
        throw new Error('Failed to update media file');
      }

      // 显示成功提醒
      toast.success(`${task.fileName} 的缩略图已生成`, {
        description: '缩略图已更新到媒体文件',
        duration: 3000,
      });

      // 通知外部组件刷新数据
      if (onThumbnailUpdatedRef.current) {
        onThumbnailUpdatedRef.current(task.mediaFileId);
      }
    } catch (error) {
      console.error('❌ [StepAutoThumbnail] Task failed:', error);
    }
  };

  /**
   * 开始处理下一个任务
   */
  const startNextTask = () => {
    if (processingRef.current) {
      return;
    }

    setTasks((prevTasks) => {
      if (prevTasks.length === 0) {
        return prevTasks;
      }

      processingRef.current = true;
      const nextTask = prevTasks[0];
      setCurrentTask(nextTask);

      return prevTasks.slice(1);
    });
  };

  /**
   * 开始处理下一个任务
   */
  useEffect(() => {
    startNextTask();
  }, [tasks]);

  /**
   * 完成当前任务
   */
  const completeTask = (screenshotBlob: Blob | null) => {
    if (!currentTask) {
      return;
    }

    if (screenshotBlob) {
      processTask(currentTask, screenshotBlob).finally(() => {
        processingRef.current = false;
        setCurrentTask(null);
        // 任务完成后，触发下一个任务的处理
        setTimeout(() => {
          startNextTask();
        }, 100);
      });
    } else {
      processingRef.current = false;
      setCurrentTask(null);
      // 即使失败也要处理下一个任务
      setTimeout(() => {
        startNextTask();
      }, 100);
    }
  };

  return {
    addTask,
    currentTask,
    completeTask,
    onThumbnailUpdated: (callback: (mediaFileId: string) => void) => {
      onThumbnailUpdatedRef.current = callback;
    },
  };
}
