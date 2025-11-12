'use client';

import { Rect, Group } from 'react-konva';
import Konva from 'konva';
import { ImageUpload } from '@/types/canvas';

interface SelectionBoxProps {
  selectionBox: { startX: number; startY: number; currentX: number; currentY: number } | null;
  selectionTightRect: { x: number; y: number; width: number; height: number } | null;
  isSelecting: boolean;
  isDragSelection: boolean;
  selectedImageIndices: number[];
  selectedImageModalIds: string[];
  selectedVideoModalIds: string[];
  selectedMusicModalIds: string[];
  selectedTextInputIds: string[];
  images: ImageUpload[];
  selectionDragOriginRef: React.MutableRefObject<{ x: number; y: number } | null>;
  setPendingGroupItems: (items: {
    imageIndices: number[];
    textIds: string[];
    imageModalIds: string[];
    videoModalIds: string[];
    musicModalIds: string[];
  }) => void;
  setIsGroupNameModalOpen: (open: boolean) => void;
  setSelectionTightRect: (rect: { x: number; y: number; width: number; height: number } | null) => void;
  handleImageUpdateWithGroup: (index: number, updates: Partial<ImageUpload>) => void;
}

export const SelectionBox: React.FC<SelectionBoxProps> = ({
  selectionBox,
  selectionTightRect,
  isSelecting,
  isDragSelection,
  selectedImageIndices,
  selectedImageModalIds,
  selectedVideoModalIds,
  selectedMusicModalIds,
  selectedTextInputIds,
  images,
  selectionDragOriginRef,
  setPendingGroupItems,
  setIsGroupNameModalOpen,
  setSelectionTightRect,
  handleImageUpdateWithGroup,
}) => {
  // Calculate total number of selected items
  const totalSelected = selectedImageIndices.length + 
                       selectedImageModalIds.length + 
                       selectedVideoModalIds.length + 
                       selectedMusicModalIds.length + 
                       selectedTextInputIds.length;

  // Only show icons if there are 2 or more components selected
  if (selectionTightRect && isDragSelection && totalSelected >= 2) {
    // After selection completes, show tight rect with toolbar and allow dragging to move all
    return (
      <Group
        x={selectionTightRect.x}
        y={selectionTightRect.y}
        draggable
        onDragStart={(e) => {
          selectionDragOriginRef.current = { x: selectionTightRect.x, y: selectionTightRect.y };
        }}
        onDragEnd={(e) => {
          const origin = selectionDragOriginRef.current;
          const node = e.target as Konva.Group;
          if (!origin || !node) return;
          const newX = node.x();
          const newY = node.y();
          const deltaX = newX - origin.x;
          const deltaY = newY - origin.y;
          // Move all selected images by delta
          selectedImageIndices.forEach(idx => {
            const it = images[idx];
            if (!it) return;
            const ox = it.x || 0;
            const oy = it.y || 0;
            handleImageUpdateWithGroup(idx, { x: ox + deltaX, y: oy + deltaY });
          });
          // Update tight rect to new position and reset node back to (0,0) under new rect
          if (selectionTightRect) {
            setSelectionTightRect({ ...selectionTightRect, x: selectionTightRect.x + deltaX, y: selectionTightRect.y + deltaY });
          }
          node.position({ x: (selectionTightRect?.x || 0) + deltaX, y: (selectionTightRect?.y || 0) + deltaY });
          selectionDragOriginRef.current = { x: (selectionTightRect?.x || 0) + deltaX, y: (selectionTightRect?.y || 0) + deltaY };
        }}
      >
        <Rect
          x={0}
          y={0}
          width={selectionTightRect.width}
          height={selectionTightRect.height}
          fill="rgba(147, 197, 253, 0.18)"
          stroke="#60A5FA"
          strokeWidth={4}
          dash={[5, 5]}
          listening={true}
          cornerRadius={0}
        />
        {/* Toolbar buttons at top center, outside selection area */}
        <Group
          x={selectionTightRect.width / 2 - 42} // Center the buttons (total width is 84px: 36 + 12 + 36)
          y={-40}
        >
          {/* Group button */}
          <Group
            onClick={(e) => {
              e.cancelBubble = true;
              // Use the selected items from selection arrays
              setPendingGroupItems({
                imageIndices: [...selectedImageIndices],
                textIds: [...selectedTextInputIds],
                imageModalIds: [...selectedImageModalIds],
                videoModalIds: [...selectedVideoModalIds],
                musicModalIds: [...selectedMusicModalIds],
              });
              setIsGroupNameModalOpen(true);
            }}
            onMouseEnter={(e) => {
              const stage = e.target.getStage();
              if (stage) {
                stage.container().style.cursor = 'pointer';
              }
            }}
            onMouseLeave={(e) => {
              const stage = e.target.getStage();
              if (stage) {
                stage.container().style.cursor = 'default';
              }
            }}
          >
            <Rect
              x={0}
              y={0}
              width={36}
              height={36}
              fill="#111827"
              stroke="#374151"
              strokeWidth={1}
              cornerRadius={8}
              shadowColor="rgba(0, 0, 0, 0.3)"
              shadowBlur={4}
              shadowOffset={{ x: 0, y: 2 }}
            />
            {/* Group icon - layers/stack icon */}
            <Group x={8} y={8}>
              <Rect x={0} y={0} width={20} height={4} fill="#60a5fa" cornerRadius={1} />
              <Rect x={2} y={6} width={20} height={4} fill="#60a5fa" cornerRadius={1} />
              <Rect x={4} y={12} width={20} height={4} fill="#60a5fa" cornerRadius={1} />
            </Group>
          </Group>
          {/* Arrange button */}
          <Group
            x={48}
            onClick={(e) => {
              e.cancelBubble = true;
              const rect = selectionTightRect;
              if (!rect) return;
              const sel = [...selectedImageIndices];
              if (sel.length === 0) return;
              // Simple grid layout inside rect preserving item sizes; top-left flow
              const padding = 12;
              const cols = Math.max(1, Math.round(Math.sqrt(sel.length)));
              let col = 0;
              let row = 0;
              let currentY = rect.y + padding;
              let maxRowHeight = 0;
              let currentX = rect.x + padding;
              sel.forEach((idx, i) => {
                const it = images[idx];
                if (!it) return;
                const iw = it.width || 100;
                const ih = it.height || 100;
                if (col >= cols || (currentX + iw + padding) > (rect.x + rect.width)) {
                  // next row
                  row += 1;
                  col = 0;
                  currentX = rect.x + padding;
                  currentY += maxRowHeight + padding;
                  maxRowHeight = 0;
                }
                handleImageUpdateWithGroup(idx, { x: currentX, y: currentY });
                currentX += iw + padding;
                maxRowHeight = Math.max(maxRowHeight, ih);
                col += 1;
              });
              // Update tight rect after arrange
              // Recompute bounds of selected items
              let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
              sel.forEach(idx => {
                const it = images[idx];
                if (!it) return;
                const ix = it.x || 0;
                const iy = it.y || 0;
                const iw = it.width || 0;
                const ih = it.height || 0;
                minX = Math.min(minX, ix);
                minY = Math.min(minY, iy);
                maxX = Math.max(maxX, ix + iw);
                maxY = Math.max(maxY, iy + ih);
              });
              if (isFinite(minX) && isFinite(minY) && isFinite(maxX) && isFinite(maxY)) {
                setSelectionTightRect({
                  x: minX,
                  y: minY,
                  width: Math.max(1, maxX - minX),
                  height: Math.max(1, maxY - minY),
                });
              }
            }}
            onMouseEnter={(e) => {
              const stage = e.target.getStage();
              if (stage) {
                stage.container().style.cursor = 'pointer';
              }
            }}
            onMouseLeave={(e) => {
              const stage = e.target.getStage();
              if (stage) {
                stage.container().style.cursor = 'default';
              }
            }}
          >
            <Rect
              x={0}
              y={0}
              width={36}
              height={36}
              fill="#111827"
              stroke="#374151"
              strokeWidth={1}
              cornerRadius={8}
              shadowColor="rgba(0, 0, 0, 0.3)"
              shadowBlur={4}
              shadowOffset={{ x: 0, y: 2 }}
            />
            {/* Arrange icon - grid/layout icon */}
            <Group x={8} y={8}>
              <Rect x={0} y={0} width={8} height={8} fill="#60a5fa" cornerRadius={1} />
              <Rect x={12} y={0} width={8} height={8} fill="#60a5fa" cornerRadius={1} />
              <Rect x={0} y={12} width={8} height={8} fill="#60a5fa" cornerRadius={1} />
              <Rect x={12} y={12} width={8} height={8} fill="#60a5fa" cornerRadius={1} />
            </Group>
          </Group>
        </Group>
      </Group>
    );
  }

  if (isSelecting && selectionBox) {
    // While dragging, show live marquee box
    return (
      <Rect
        x={Math.min(selectionBox.startX, selectionBox.currentX)}
        y={Math.min(selectionBox.startY, selectionBox.currentY)}
        width={Math.max(1, Math.abs(selectionBox.currentX - selectionBox.startX))}
        height={Math.max(1, Math.abs(selectionBox.currentY - selectionBox.startY))}
        fill="rgba(147, 197, 253, 0.3)"
        stroke="#60A5FA"
        strokeWidth={4}
        dash={[5, 5]}
        listening={false}
        globalCompositeOperation="source-over"
        cornerRadius={0}
      />
    );
  }

  if (selectionBox && !isSelecting) {
    // After drag completes but before tight rect is calculated, show the selection box with buttons
    return (
      <Group
        x={Math.min(selectionBox.startX, selectionBox.currentX)}
        y={Math.min(selectionBox.startY, selectionBox.currentY)}
      >
        <Rect
          x={0}
          y={0}
          width={Math.max(1, Math.abs(selectionBox.currentX - selectionBox.startX))}
          height={Math.max(1, Math.abs(selectionBox.currentY - selectionBox.startY))}
          fill="rgba(147, 197, 253, 0.3)"
          stroke="#60A5FA"
          strokeWidth={4}
          dash={[5, 5]}
          listening={false}
          globalCompositeOperation="source-over"
          cornerRadius={0}
        />
        {/* Toolbar buttons at top center, outside selection area - only show if 2+ items selected */}
        {totalSelected >= 2 && (
          <Group
            x={Math.max(1, Math.abs(selectionBox.currentX - selectionBox.startX)) / 2 - 42}
            y={-40}
          >
            {/* Group button */}
            <Group
              onClick={(e) => {
                e.cancelBubble = true;
                setPendingGroupItems({
                  imageIndices: [...selectedImageIndices],
                  textIds: [...selectedTextInputIds],
                  imageModalIds: [...selectedImageModalIds],
                  videoModalIds: [...selectedVideoModalIds],
                  musicModalIds: [...selectedMusicModalIds],
                });
                setIsGroupNameModalOpen(true);
              }}
              onMouseEnter={(e) => {
                const stage = e.target.getStage();
                if (stage) {
                  stage.container().style.cursor = 'pointer';
                }
              }}
              onMouseLeave={(e) => {
                const stage = e.target.getStage();
                if (stage) {
                  stage.container().style.cursor = 'default';
                }
              }}
            >
              <Rect
                x={0}
                y={0}
                width={36}
                height={36}
                fill="#111827"
                stroke="#374151"
                strokeWidth={1}
                cornerRadius={8}
                shadowColor="rgba(0, 0, 0, 0.3)"
                shadowBlur={4}
                shadowOffset={{ x: 0, y: 2 }}
              />
              <Group x={8} y={8}>
                <Rect x={0} y={0} width={20} height={4} fill="#60a5fa" cornerRadius={1} />
                <Rect x={2} y={6} width={20} height={4} fill="#60a5fa" cornerRadius={1} />
                <Rect x={4} y={12} width={20} height={4} fill="#60a5fa" cornerRadius={1} />
              </Group>
            </Group>
            {/* Arrange button */}
            <Group
              x={48}
              onClick={(e) => {
                e.cancelBubble = true;
                const sel = [...selectedImageIndices];
                if (sel.length === 0) return;
                const boxWidth = Math.abs(selectionBox.currentX - selectionBox.startX);
                const boxHeight = Math.abs(selectionBox.currentY - selectionBox.startY);
                const boxX = Math.min(selectionBox.startX, selectionBox.currentX);
                const boxY = Math.min(selectionBox.startY, selectionBox.currentY);
                const padding = 12;
                const cols = Math.max(1, Math.round(Math.sqrt(sel.length)));
                let col = 0;
                let currentY = boxY + padding;
                let maxRowHeight = 0;
                let currentX = boxX + padding;
                sel.forEach((idx) => {
                  const it = images[idx];
                  if (!it) return;
                  const iw = it.width || 100;
                  const ih = it.height || 100;
                  if (col >= cols || (currentX + iw + padding) > (boxX + boxWidth)) {
                    col = 0;
                    currentX = boxX + padding;
                    currentY += maxRowHeight + padding;
                    maxRowHeight = 0;
                  }
                  handleImageUpdateWithGroup(idx, { x: currentX, y: currentY });
                  currentX += iw + padding;
                  maxRowHeight = Math.max(maxRowHeight, ih);
                  col += 1;
                });
              }}
              onMouseEnter={(e) => {
                const stage = e.target.getStage();
                if (stage) {
                  stage.container().style.cursor = 'pointer';
                }
              }}
              onMouseLeave={(e) => {
                const stage = e.target.getStage();
                if (stage) {
                  stage.container().style.cursor = 'default';
                }
              }}
            >
              <Rect
                x={0}
                y={0}
                width={36}
                height={36}
                fill="#111827"
                stroke="#374151"
                strokeWidth={1}
                cornerRadius={8}
                shadowColor="rgba(0, 0, 0, 0.3)"
                shadowBlur={4}
                shadowOffset={{ x: 0, y: 2 }}
              />
              <Group x={8} y={8}>
                <Rect x={0} y={0} width={8} height={8} fill="#60a5fa" cornerRadius={1} />
                <Rect x={12} y={0} width={8} height={8} fill="#60a5fa" cornerRadius={1} />
                <Rect x={0} y={12} width={8} height={8} fill="#60a5fa" cornerRadius={1} />
                <Rect x={12} y={12} width={8} height={8} fill="#60a5fa" cornerRadius={1} />
              </Group>
            </Group>
          </Group>
        )}
      </Group>
    );
  }

  return null;
};

