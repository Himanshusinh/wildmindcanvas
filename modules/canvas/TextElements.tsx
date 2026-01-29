'use client';

import { Group, Text } from 'react-konva';
import { ImageUpload } from '@/core/types/canvas';
import { SELECTION_COLOR } from '@/core/canvas/canvasHelpers';

interface TextElementsProps {
  images: ImageUpload[];
  selectedImageIndex: number | null;
  clearAllSelections: () => void;
  setSelectedImageIndex: (index: number | null) => void;
  setSelectedImageIndices: (indices: number[]) => void;
  setContextMenuImageIndex: (index: number | null) => void;
  setContextMenuOpen: (open: boolean) => void;
  handleImageUpdateWithGroup: (index: number, updates: Partial<ImageUpload>) => void;
  isComponentDraggable?: (id: string) => boolean;
  onSelectText?: (id: string | number, e?: { ctrlKey?: boolean; metaKey?: boolean; shiftKey?: boolean }) => void;
}

export const TextElements: React.FC<TextElementsProps> = ({
  images,
  selectedImageIndex,
  clearAllSelections,
  setSelectedImageIndex,
  setSelectedImageIndices,
  setContextMenuImageIndex,
  setContextMenuOpen,
  handleImageUpdateWithGroup,
  isComponentDraggable,
  onSelectText,
}) => {
  return (
    <>
      {images
        .filter((img) => img.type === 'text')
        .map((textData, index) => {
          const actualIndex = images.findIndex(img => img === textData);
          const isSelected = selectedImageIndex === actualIndex;
          const textX = textData.x || 0;
          const textY = textData.y || 0;
          const fontSize = textData.fontSize || 24;
          // Estimate text width (approximate)
          const textWidth = (textData.text || '').length * fontSize * 0.6;
          const textHeight = fontSize * 1.2;
          return (
            <Group key={`text-${actualIndex}`}>
              <Text
                x={textX}
                y={textY}
                data-type="text"
                text={textData.text || ''}
                fontSize={fontSize}
                fontFamily={textData.fontFamily || 'Arial'}
                fill={textData.fill || '#000000'}
                draggable={isComponentDraggable ? isComponentDraggable(textData.elementId || `text-${actualIndex}`) : true}
                onDragEnd={(e) => {
                  const node = e.target;
                  handleImageUpdateWithGroup(actualIndex, {
                    x: node.x(),
                    y: node.y(),
                  });
                }}
                onClick={(e) => {
                  e.cancelBubble = true;
                  if (onSelectText) {
                    onSelectText(actualIndex, {
                      ctrlKey: e.evt.ctrlKey,
                      metaKey: e.evt.metaKey,
                      shiftKey: e.evt.shiftKey,
                    });
                  } else {
                    // Fallback to legacy behavior if prop not provided
                    clearAllSelections();
                    setSelectedImageIndex(actualIndex);
                    setSelectedImageIndices([actualIndex]);
                  }
                  // Show context menu when text is clicked
                  setContextMenuImageIndex(actualIndex);
                  setContextMenuOpen(true);
                }}
                stroke={isSelected ? SELECTION_COLOR : undefined}
                strokeWidth={isSelected ? 4 : 0}
              />
              {/* Delete button removed - now handled by context menu in header */}
            </Group>
          );
        })}
    </>
  );
};

