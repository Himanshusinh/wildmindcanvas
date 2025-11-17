'use client';

import { Group, Rect, Text } from 'react-konva';
import Konva from 'konva';
import { ImageUpload } from '@/types/canvas';

interface GroupLabelProps {
  group: { id: string; name?: string; itemIndices: number[]; textIds?: string[]; imageModalIds?: string[]; videoModalIds?: string[]; musicModalIds?: string[] };
  images: ImageUpload[];
  handleImageUpdateWithGroup: (index: number, updates: Partial<ImageUpload>) => void;
  onGroupMove?: (groupId: string, deltaX: number, deltaY: number) => void;
}

export const GroupLabel: React.FC<GroupLabelProps> = ({ group, images, handleImageUpdateWithGroup, onGroupMove }) => {
  // Compute group bounding box from image indices and other members
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

  group.itemIndices.forEach(idx => {
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

  if (group.imageModalIds) {
    group.imageModalIds.forEach(() => {
      // modals are approximately 600x400
      // we cannot compute exact positions here without parent state; assume they are within images bounds
    });
  }

  if (!isFinite(minX) || !isFinite(minY) || !isFinite(maxX) || !isFinite(maxY)) {
    return null;
  }

  const labelX = minX - 6;
  const labelY = Math.min(minY - 28, minY - 6);
  const name = group.name || 'Group';
  const labelWidth = Math.max(60, name.length * 8 + 20);

  return (
    <Group
      key={group.id}
      x={labelX}
      y={labelY}
      draggable
      onDragEnd={(e) => {
        const node = e.target as Konva.Group;
        const newX = node.x();
        const newY = node.y();
        const deltaX = newX - labelX;
        const deltaY = newY - labelY;

        // Move all items in the group
        group.itemIndices.forEach(idx => {
          const it = images[idx];
          if (!it) return;
          const ox = it.x || 0;
          const oy = it.y || 0;
          handleImageUpdateWithGroup(idx, { x: ox + deltaX, y: oy + deltaY });
        });

        // Notify parent to persist a single grouped move operation
        if (onGroupMove) {
          try { onGroupMove(group.id, deltaX, deltaY); } catch (e) { /* ignore */ }
        }

        // Reset visual label position (items moved instead)
        node.position({ x: labelX, y: labelY });
      }}
    >
      <Rect
        x={0}
        y={0}
        width={labelWidth}
        height={22}
        fill="#111827"
        stroke="#374151"
        strokeWidth={1}
        cornerRadius={6}
      />
      <Text
        x={10}
        y={4}
        text={name}
        fontSize={12}
        fontFamily="Arial"
        fill="#ffffff"
      />
    </Group>
  );
};

