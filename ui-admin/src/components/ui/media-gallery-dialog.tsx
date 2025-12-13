import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface MediaGalleryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  images: string[];
  initialIndex?: number;
  title?: string;
}

export function MediaGalleryDialog({
  open,
  onOpenChange,
  images,
  initialIndex = 0,
  title = '图片预览',
}: MediaGalleryDialogProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
  };

  const handleThumbnailClick = (index: number) => {
    setCurrentIndex(index);
  };

  // 当 dialog 打开时，重置到初始索引
  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      setCurrentIndex(initialIndex);
    }
    onOpenChange(newOpen);
  };

  if (images.length === 0) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-5xl h-[90vh] p-0">
        <DialogHeader className="px-6 pt-6 pb-4">
          <DialogTitle className="flex items-center justify-between">
            <span>{title}</span>
            <span className="text-sm font-normal text-muted-foreground">
              {currentIndex + 1} / {images.length}
            </span>
          </DialogTitle>
        </DialogHeader>

        {/* 主图区域 */}
        <div className="relative flex-1 flex items-center justify-center bg-muted/30 px-6">
          <div className="relative w-full h-[60vh] flex items-center justify-center">
            <img
              src={images[currentIndex]}
              alt={`Image ${currentIndex + 1}`}
              className="max-w-full max-h-full object-contain"
            />

            {/* 左右切换按钮 */}
            {images.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-2 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-background/80 hover:bg-background shadow-lg"
                  onClick={handlePrevious}
                >
                  <ChevronLeft className="h-6 w-6" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-background/80 hover:bg-background shadow-lg"
                  onClick={handleNext}
                >
                  <ChevronRight className="h-6 w-6" />
                </Button>
              </>
            )}
          </div>
        </div>

        {/* 缩略图区域 */}
        {images.length > 1 && (
          <div className="px-6 pb-6">
            <div className="flex gap-2 overflow-x-auto py-2">
              {images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => handleThumbnailClick(index)}
                  className={cn(
                    'flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all',
                    currentIndex === index
                      ? 'border-primary ring-2 ring-primary/20'
                      : 'border-transparent hover:border-muted-foreground/30'
                  )}
                >
                  <img
                    src={image}
                    alt={`Thumbnail ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
