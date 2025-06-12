import React, { useRef, useState } from 'react';
import { cn } from '@/utils';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { Card } from '@/components/ui/card';
import { IVinesExecutionResultItem } from '@/utils/execution';
import { usePageStore } from '@/store/usePageStore';

interface HistoryResultProps {
  loading: boolean;
  imageItems: IVinesExecutionResultItem[];
  isMiniFrame?: boolean;
  className?: string;
}

export const HistoryResult: React.FC<HistoryResultProps> = ({ loading, imageItems, isMiniFrame, className }) => {
  const [draggedItem, setDraggedItem] = useState<IVinesExecutionResultItem | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const carouselRef = useRef<HTMLDivElement>(null);

  const handleDragStart = (e: React.DragEvent, item: IVinesExecutionResultItem) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', item.render.key);
    setDraggedItem(item);
    setIsDragging(true);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
    setDragOverIndex(null);
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    const draggedKey = e.dataTransfer.getData('text/plain');
    if (draggedKey && dragOverIndex !== null) {
      const newItems = [...imageItems];
      const draggedIndex = newItems.findIndex((item) => item.render.key === draggedKey);
      if (draggedIndex !== -1) {
        const [removed] = newItems.splice(draggedIndex, 1);
        newItems.splice(targetIndex, 0, removed);
        // TODO: Add callback to update parent state
      }
    }
    handleDragEnd();
  };
  return (
    <div
      className={cn(
        ' relative col-span-5 mt-4 overflow-hidden rounded-xl border border-slate-200 bg-slate-1 px-12 py-6 shadow-sm',
        isMiniFrame && 'mt-2',
        className,
      )}
      style={{
        width: window.innerWidth * 0.765,
      }}
    >
      <Carousel
        opts={{
          align: 'start',
          loop: true,
          skipSnaps: false,
          dragFree: false,
          containScroll: 'trimSnaps',
          inViewThreshold: 0.7,
          watchDrag: !isDragging,
        }}
        className="w-full px-4"
        ref={carouselRef}
      >
        <CarouselContent className=" overflow-hidden space-x-0">
          {loading ? (
            <div className="flex w-full items-center justify-center">
              <span>Loading...</span>
            </div>
          ) : imageItems.length > 0 ? (
            imageItems.map((item, index) => (
              <CarouselItem key={item.render.key} className={cn('basis-auto', dragOverIndex === index && '')}>
                <Card
                  className={cn(
                    'h-[90px] w-[90px] cursor-move overflow-hidden',
                    draggedItem?.render.key === item.render.key && 'opacity-50',
                  )}
                  draggable
                  onDragStart={(e) => handleDragStart(e, item)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragEnd={handleDragEnd}
                  onDrop={(e) => handleDrop(e, index)}
                >
                  {item.render.type === 'image' && (
                    <img
                      src={item.render.data as string}
                      alt={typeof item.render.alt === 'string' ? item.render.alt : `Image ${index + 1}`}
                      className="h-full w-full select-none object-cover"
                    />
                  )}
                </Card>
              </CarouselItem>
            ))
          ) : (
            <div className="flex w-full items-center justify-center">
              <span>No images available</span>
            </div>
          )}
        </CarouselContent>
        <CarouselPrevious className="h-8.5 absolute -left-8 top-1/2 w-9.5 -translate-y-1/2 rounded-md border border-slate-300 bg-white px-2.5 " />
        <CarouselNext className="h-8.5 absolute -right-8 top-1/2 w-9.5 -translate-y-1/2 rounded-md border border-slate-300 bg-white px-2.5 " />
      </Carousel>
    </div>
  );
};
