'use client';

import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { ImageUploadModal } from '@/modules/generators/ImageUploadModal/ImageUploadModal';

// Wrapper to adapt standard NodeProps to what ImageUploadModal expects
export const ImageNode = memo(({ data, selected }: NodeProps) => {
    // data contains all the props we pass from the overlay layer
    const { modalProps } = data as { modalProps: any };

    return (
        <div style={{ position: 'relative', width: '100%', height: '100%' }}>
            {/* 
        We use ImageUploadModal but override position/drag props because 
        React Flow handles the positioning and dragging now. 
      */}
            <ImageUploadModal
                {...modalProps}
                // Important: React Flow handles positioning, so we force x/y to 0 relative to this node container
                x={0}
                y={0}
                // Disable internal dragging since React Flow handles it
                draggable={false}
                // Pass selection state from React Flow
                isSelected={selected}
            />

            {/* 
         invisible handles 
         We position them effectively to cover the sides or specific points 
      */}
            <Handle
                type="target"
                position={Position.Left}
                id="left"
                style={{ left: 0, width: 1, height: 1, background: 'transparent', border: 'none' }}
            />
            <Handle
                type="source"
                position={Position.Right}
                id="right"
                style={{ right: 0, width: 1, height: 1, background: 'transparent', border: 'none' }}
            />
            <Handle
                type="target"
                position={Position.Top}
                id="top" // Fixed typo from 'tcop'
                style={{ top: 0, height: 1, width: 1, background: 'transparent', border: 'none' }}
            />
            <Handle
                type="source"
                position={Position.Bottom}
                id="bottom"
                style={{ bottom: 0, height: 1, width: 1, background: 'transparent', border: 'none' }}
            />
        </div>
    );
});

ImageNode.displayName = 'ImageNode';
