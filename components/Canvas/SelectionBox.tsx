'use client';

import React from 'react';
import { Rect, Group, Text, Transformer } from 'react-konva';
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
  setTextInputStates: React.Dispatch<React.SetStateAction<Array<{ id: string; x: number; y: number }>>>;
  setImageModalStates: React.Dispatch<React.SetStateAction<Array<{ id: string; x: number; y: number; generatedImageUrl?: string | null }>>>;
  setVideoModalStates: React.Dispatch<React.SetStateAction<Array<{ id: string; x: number; y: number; generatedVideoUrl?: string | null }>>>;
  setMusicModalStates: React.Dispatch<React.SetStateAction<Array<{ id: string; x: number; y: number; generatedMusicUrl?: string | null }>>>;
  textInputStates: Array<{ id: string; x: number; y: number }>;
  imageModalStates: Array<{ id: string; x: number; y: number; generatedImageUrl?: string | null }>;
  videoModalStates: Array<{ id: string; x: number; y: number; generatedVideoUrl?: string | null }>;
  musicModalStates: Array<{ id: string; x: number; y: number; generatedMusicUrl?: string | null }>;
  groups: Map<string, { id: string; name?: string; itemIndices: number[]; textIds?: string[]; imageModalIds?: string[]; videoModalIds?: string[]; musicModalIds?: string[] }>;
  setGroups: React.Dispatch<React.SetStateAction<Map<string, { id: string; name?: string; itemIndices: number[]; textIds?: string[]; imageModalIds?: string[]; videoModalIds?: string[]; musicModalIds?: string[] }>>>;
  setSelectedImageIndices: React.Dispatch<React.SetStateAction<number[]>>;
  setSelectedTextInputIds: React.Dispatch<React.SetStateAction<string[]>>;
  setSelectedImageModalIds: React.Dispatch<React.SetStateAction<string[]>>;
  setSelectedVideoModalIds: React.Dispatch<React.SetStateAction<string[]>>;
  setSelectedMusicModalIds: React.Dispatch<React.SetStateAction<string[]>>;
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
  setTextInputStates,
  setImageModalStates,
  setVideoModalStates,
  setMusicModalStates,
  textInputStates,
  imageModalStates,
  videoModalStates,
  musicModalStates,
  groups,
  setGroups,
  setSelectedImageIndices,
  setSelectedTextInputIds,
  setSelectedImageModalIds,
  setSelectedVideoModalIds,
  setSelectedMusicModalIds,
}) => {
  // Store original positions of all components when drag starts
  const originalPositionsRef = React.useRef<{
    images: Map<number, { x: number; y: number }>;
    textInputs: Map<string, { x: number; y: number }>;
    imageModals: Map<string, { x: number; y: number }>;
    videoModals: Map<string, { x: number; y: number }>;
    musicModals: Map<string, { x: number; y: number }>;
  } | null>(null);
  
  // Store original tight rect position
  const originalTightRectRef = React.useRef<{ x: number; y: number } | null>(null);
  
  // Ref for the selection box group (for Transformer)
  const selectionGroupRef = React.useRef<Konva.Group>(null);
  const transformerRef = React.useRef<Konva.Transformer>(null);
  

  // Calculate total number of selected items
  const totalSelected = selectedImageIndices.length + 
                       selectedImageModalIds.length + 
                       selectedVideoModalIds.length + 
                       selectedMusicModalIds.length + 
                       selectedTextInputIds.length;

  // Check if selected items form a group
  // A group matches if the selected items exactly match a group's items
  let currentGroup: { id: string; name?: string } | null = null;
  
  // Check all groups to see if any group matches the current selection
  for (const group of groups.values()) {
    // Check if selected images match group's itemIndices
    const selectedImagesSet = new Set(selectedImageIndices);
    const groupImagesSet = new Set(group.itemIndices || []);
    const imagesMatch = selectedImagesSet.size === groupImagesSet.size &&
                       Array.from(selectedImagesSet).every(idx => groupImagesSet.has(idx));
    
    // Check if selected text inputs match group's textIds
    const selectedTextsSet = new Set(selectedTextInputIds);
    const groupTextsSet = new Set(group.textIds || []);
    const textsMatch = selectedTextsSet.size === groupTextsSet.size &&
                      Array.from(selectedTextsSet).every(id => groupTextsSet.has(id));
    
    // Check if selected image modals match group's imageModalIds
    const selectedImageModalsSet = new Set(selectedImageModalIds);
    const groupImageModalsSet = new Set(group.imageModalIds || []);
    const imageModalsMatch = selectedImageModalsSet.size === groupImageModalsSet.size &&
                            Array.from(selectedImageModalsSet).every(id => groupImageModalsSet.has(id));
    
    // Check if selected video modals match group's videoModalIds
    const selectedVideoModalsSet = new Set(selectedVideoModalIds);
    const groupVideoModalsSet = new Set(group.videoModalIds || []);
    const videoModalsMatch = selectedVideoModalsSet.size === groupVideoModalsSet.size &&
                            Array.from(selectedVideoModalsSet).every(id => groupVideoModalsSet.has(id));
    
    // Check if selected music modals match group's musicModalIds
    const selectedMusicModalsSet = new Set(selectedMusicModalIds);
    const groupMusicModalsSet = new Set(group.musicModalIds || []);
    const musicModalsMatch = selectedMusicModalsSet.size === groupMusicModalsSet.size &&
                            Array.from(selectedMusicModalsSet).every(id => groupMusicModalsSet.has(id));
    
    // If all selected items match this group exactly, this is the current group
    if (imagesMatch && textsMatch && imageModalsMatch && videoModalsMatch && musicModalsMatch &&
        (selectedImagesSet.size > 0 || selectedTextsSet.size > 0 || selectedImageModalsSet.size > 0 || 
         selectedVideoModalsSet.size > 0 || selectedMusicModalsSet.size > 0)) {
      currentGroup = { id: group.id, name: group.name };
      break;
    }
  }


  // Only show icons if there are 2 or more components selected
  if (selectionTightRect && isDragSelection && totalSelected >= 2) {
    // After selection completes, show tight rect with toolbar and allow dragging to move all
    return (
      <>
      <Group
          ref={selectionGroupRef}
        x={selectionTightRect.x}
        y={selectionTightRect.y}
        draggable
        onDragStart={(e) => {
          selectionDragOriginRef.current = { x: selectionTightRect.x, y: selectionTightRect.y };
          originalTightRectRef.current = { x: selectionTightRect.x, y: selectionTightRect.y };
          
          // Store original positions of all components
          const originalPositions = {
            images: new Map<number, { x: number; y: number }>(),
            textInputs: new Map<string, { x: number; y: number }>(),
            imageModals: new Map<string, { x: number; y: number }>(),
            videoModals: new Map<string, { x: number; y: number }>(),
            musicModals: new Map<string, { x: number; y: number }>(),
          };
          
          // Store original image positions
          selectedImageIndices.forEach(idx => {
            const it = images[idx];
            if (it) {
              originalPositions.images.set(idx, { x: it.x || 0, y: it.y || 0 });
            }
          });
          
          // Store original text input positions
          selectedTextInputIds.forEach(textId => {
            const textState = textInputStates.find(t => t.id === textId);
            if (textState) {
              originalPositions.textInputs.set(textId, { x: textState.x, y: textState.y });
            }
          });
          
          // Store original image modal positions
          selectedImageModalIds.forEach(modalId => {
            const modalState = imageModalStates.find(m => m.id === modalId);
            if (modalState) {
              originalPositions.imageModals.set(modalId, { x: modalState.x, y: modalState.y });
            }
          });
          
          // Store original video modal positions
          selectedVideoModalIds.forEach(modalId => {
            const modalState = videoModalStates.find(m => m.id === modalId);
            if (modalState) {
              originalPositions.videoModals.set(modalId, { x: modalState.x, y: modalState.y });
            }
          });
          
          // Store original music modal positions
          selectedMusicModalIds.forEach(modalId => {
            const modalState = musicModalStates.find(m => m.id === modalId);
            if (modalState) {
              originalPositions.musicModals.set(modalId, { x: modalState.x, y: modalState.y });
            }
          });
          
          originalPositionsRef.current = originalPositions;
        }}
        onDragMove={(e) => {
          const origin = selectionDragOriginRef.current;
          const originalPositions = originalPositionsRef.current;
          const node = e.target as Konva.Group;
          if (!origin || !node || !originalPositions) return;
          
          const newX = node.x();
          const newY = node.y();
          const deltaX = newX - origin.x;
          const deltaY = newY - origin.y;
          
          // Move all selected images by delta in real-time (from original positions)
          selectedImageIndices.forEach(idx => {
            const originalPos = originalPositions.images.get(idx);
            if (originalPos) {
              handleImageUpdateWithGroup(idx, { x: originalPos.x + deltaX, y: originalPos.y + deltaY });
            }
          });
          
          // Move all selected text inputs by delta in real-time (from original positions)
          selectedTextInputIds.forEach(textId => {
            const originalPos = originalPositions.textInputs.get(textId);
            if (originalPos) {
              setTextInputStates((prev) =>
                prev.map((textState) =>
                  textState.id === textId
                    ? { ...textState, x: originalPos.x + deltaX, y: originalPos.y + deltaY }
                    : textState
                )
              );
            }
          });
          
          // Move all selected image modals by delta in real-time (from original positions)
          selectedImageModalIds.forEach(modalId => {
            const originalPos = originalPositions.imageModals.get(modalId);
            if (originalPos) {
              setImageModalStates((prev) =>
                prev.map((modalState) =>
                  modalState.id === modalId
                    ? { ...modalState, x: originalPos.x + deltaX, y: originalPos.y + deltaY }
                    : modalState
                )
              );
            }
          });
          
          // Move all selected video modals by delta in real-time (from original positions)
          selectedVideoModalIds.forEach(modalId => {
            const originalPos = originalPositions.videoModals.get(modalId);
            if (originalPos) {
              setVideoModalStates((prev) =>
                prev.map((modalState) =>
                  modalState.id === modalId
                    ? { ...modalState, x: originalPos.x + deltaX, y: originalPos.y + deltaY }
                    : modalState
                )
              );
            }
          });
          
          // Move all selected music modals by delta in real-time (from original positions)
          selectedMusicModalIds.forEach(modalId => {
            const originalPos = originalPositions.musicModals.get(modalId);
            if (originalPos) {
              setMusicModalStates((prev) =>
                prev.map((modalState) =>
                  modalState.id === modalId
                    ? { ...modalState, x: originalPos.x + deltaX, y: originalPos.y + deltaY }
                    : modalState
                )
              );
            }
          });
          
          // Update tight rect position during drag so selection box moves with components
          // Calculate from original tight rect position to avoid accumulation errors
          const originalTightRect = originalTightRectRef.current;
          if (selectionTightRect && originalTightRect) {
            const newRectX = originalTightRect.x + deltaX;
            const newRectY = originalTightRect.y + deltaY;
            setSelectionTightRect({ ...selectionTightRect, x: newRectX, y: newRectY });
            // Don't update origin - keep it at the original position for consistent delta calculation
          }
        }}
        onDragEnd={(e) => {
          const origin = selectionDragOriginRef.current;
          const originalPositions = originalPositionsRef.current;
          const originalTightRect = originalTightRectRef.current;
          const node = e.target as Konva.Group;
          if (!origin || !node || !originalPositions || !originalTightRect) return;
          
          const newX = node.x();
          const newY = node.y();
          const deltaX = newX - origin.x;
          const deltaY = newY - origin.y;
          
          // Components have already been moved during drag, so we just need to ensure final positions are correct
          // and sync the tight rect with the node position
          if (selectionTightRect) {
            // The tight rect should already be at the correct position from onDragMove
            // Just ensure the node position matches the tight rect
            node.position({ x: selectionTightRect.x, y: selectionTightRect.y });
            selectionDragOriginRef.current = { x: selectionTightRect.x, y: selectionTightRect.y };
          }
          
          // Clear original positions
          originalPositionsRef.current = null;
          originalTightRectRef.current = null;
        }}
      >
        {/* Group name label at top left corner, outside the box */}
        {currentGroup && currentGroup.name && (
          <Group x={-6} y={-28}>
            <Rect
              x={0}
              y={0}
              width={Math.max(60, (currentGroup.name.length * 8) + 20)}
              height={22}
              fill="#111827"
              stroke="#374151"
              strokeWidth={1}
              cornerRadius={6}
            />
            <Text
              x={10}
              y={4}
              text={currentGroup.name}
              fontSize={12}
              fontFamily="Arial"
              fill="#ffffff"
            />
          </Group>
        )}
        <Rect
          x={0}
          y={0}
          width={selectionTightRect.width}
          height={selectionTightRect.height}
          fill={currentGroup ? "rgba(147, 197, 253, 0.35)" : "rgba(147, 197, 253, 0.18)"}
          stroke="#60A5FA"
          strokeWidth={4}
          dash={currentGroup ? undefined : [5, 5]}
          listening={true}
          cornerRadius={0}
        />
        {/* Toolbar buttons at top center, outside selection area */}
        <Group
          x={selectionTightRect.width / 2 - 42} // Center the buttons (total width is 84px: 36 + 12 + 36)
          y={-40}
        >
          {/* Group/Ungroup button */}
          {currentGroup ? (
            // Ungroup button
            <Group
              onClick={(e) => {
                e.cancelBubble = true;
                const groupToUngroup = currentGroup;
                if (!groupToUngroup) return;
                
                // Remove the group
                setGroups(prev => {
                  const newGroups = new Map(prev);
                  newGroups.delete(groupToUngroup.id);
                  return newGroups;
                });
                
                // Remove groupId from all images in the group
                const group = groups.get(groupToUngroup.id);
                if (group) {
                  // Remove groupId from all images
                  group.itemIndices.forEach(index => {
                    const img = images[index];
                    if (img && img.groupId) {
                      handleImageUpdateWithGroup(index, { groupId: undefined });
                    }
                  });
                }
                
                // Clear selection
                setSelectedImageIndices([]);
                setSelectedTextInputIds([]);
                setSelectedImageModalIds([]);
                setSelectedVideoModalIds([]);
                setSelectedMusicModalIds([]);
                setSelectionTightRect(null);
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
              {/* Ungroup icon - split/layers icon */}
              <Group x={8} y={8}>
                <Rect x={0} y={0} width={8} height={4} fill="#ef4444" cornerRadius={1} />
                <Rect x={12} y={0} width={8} height={4} fill="#ef4444" cornerRadius={1} />
                <Rect x={2} y={6} width={8} height={4} fill="#ef4444" cornerRadius={1} />
                <Rect x={12} y={6} width={8} height={4} fill="#ef4444" cornerRadius={1} />
                <Rect x={4} y={12} width={8} height={4} fill="#ef4444" cornerRadius={1} />
                <Rect x={12} y={12} width={8} height={4} fill="#ef4444" cornerRadius={1} />
              </Group>
            </Group>
          ) : (
            // Group button
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
          )}
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
        {/* Transformer removed - using 4 corner dots for resize instead */}
      </Group>
      </>
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

