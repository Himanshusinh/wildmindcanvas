import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Text, Transformer } from 'react-konva';
import { TextEditor } from './TextEditor';
import Konva from 'konva';

interface RichTextNodeProps {
    id: string;
    text: string;
    x: number;
    y: number;
    width?: number;
    fontSize?: number;
    fontFamily?: string;
    fill?: string;
    align?: string;
    isSelected: boolean;
    onSelect: () => void;
    onChange: (newAttrs: any) => void;
    draggable?: boolean;
}

export const RichTextNode: React.FC<RichTextNodeProps> = ({
    id,
    text,
    x,
    y,
    width = 200,
    fontSize = 20,
    fontFamily = 'Arial',
    fill = 'white',
    align = 'left',
    isSelected,
    onSelect,
    onChange,
    draggable = true,
}) => {
    const [isEditing, setIsEditing] = useState(false);
    // We keep local state for rapid updates during drag/transform, but sync with parent via onChange
    // Actually better to just rely on props if performance allows, or use optimistic updates.
    // The user's example used local state (setText, setTextWidth).
    // I will use props for source of truth to play nice with the canvas store.

    const textRef = useRef<Konva.Text>(null);
    const trRef = useRef<Konva.Transformer>(null);

    useEffect(() => {
        if (isSelected && trRef.current && textRef.current) {
            // Attach transformer
            trRef.current.nodes([textRef.current]);
            trRef.current.getLayer()?.batchDraw();
        }
    }, [isSelected, isEditing]);

    const handleTextDblClick = useCallback(() => {
        setIsEditing(true);
    }, []);

    const handleTextChange = useCallback((newText: string) => {
        onChange({
            text: newText,
        });
        // setIsEditing(false); // Handled by onClose
    }, [onChange]);

    const handleTransformEnd = useCallback(() => {
        const node = textRef.current;
        if (node) {
            const scaleX = node.scaleX();
            const scaleY = node.scaleY(); // Should be 1 if only resizing width?

            // Reset scale and update width
            // Text usually only scales width with Transformer if not keeping ratio?
            // User asked: "remove the rotate options just 4 corner resize and left and right resize"
            // If we resize corners on Text, it usually scales font size unless we handle it differently (boundBoxFunc or using correct enabledAnchors with resizing logic provided by Konva Text).
            // Konva Text behavior:
            // If we drag 'middle-right', it scales X.
            // We want to change WIDTH, not SCALE.
            // So we update width = width * scaleX, and reset scaleX = 1.

            const newWidth = Math.max(30, node.width() * scaleX);

            // For corners, it might scale both X and Y.
            // If we want to change Font Size on corner resize, we do: fontSize = fontSize * scaleY.
            // Or if we just want to resize the box (wrapping text), we ignore Y scale?
            // Usually "Rich Text" implies a text box where width wraps text.
            // Corner resize usually scales the whole thing (font size too) OR just changes the box bounds.
            // Default Konva Transformer behavior scales the node.

            // User code example:
            /*
            const handleTransform = useCallback((e) => {
              const node = textRef.current;
              const scaleX = node.scaleX();
              const newWidth = node.width() * scaleX;
              setTextWidth(newWidth);
              node.setAttrs({
                width: newWidth,
                scaleX: 1,
              });
            }, []);
            */
            // The user code only handled X scale (width).
            // But they asked for "4 corner resize".
            // If I drag a corner, both X and Y change.
            // If I only update Width, Y scale changes might distort text if I don't reset them?
            // Text nodes don't really have a "Height" that is independent of content unless we crop?
            // Konva Text height is auto-calculated based on content and width.

            // Let's replicate the user's logic which primarily cared about Width.
            // But also make sure we reset scaleY to avoid distortion.

            node.scaleX(1);
            node.scaleY(1);

            onChange({
                width: newWidth,
                rotation: node.rotation(), // Should be 0 if disabled
                x: node.x(),
                y: node.y(),
            });
        }
    }, [onChange]);

    // Handle initial selection binding
    useEffect(() => {
        if (isSelected && !isEditing) {
            // ensure transformer is attached
        }
    }, [isSelected, isEditing]);

    return (
        <>
            <Text
                id={id}
                ref={textRef}
                text={text}
                x={x}
                y={y}
                width={width}
                fontSize={fontSize}
                fontFamily={fontFamily}
                fill={fill}
                align={align}
                draggable={draggable && !isEditing}
                visible={!isEditing}
                opacity={isEditing ? 0 : 1}
                onDblClick={handleTextDblClick}
                onDblTap={handleTextDblClick}
                onClick={onSelect}
                onTap={onSelect}
                onDragEnd={(e) => {
                    onChange({
                        x: e.target.x(),
                        y: e.target.y(),
                    });
                }}
                onTransformEnd={handleTransformEnd}
            />

            {isEditing && textRef.current && (
                <TextEditor
                    textNode={textRef.current}
                    onChange={handleTextChange}
                    onClose={() => setIsEditing(false)}
                />
            )}

            {isSelected && !isEditing && (
                <Transformer
                    ref={trRef}
                    // "remove the rotate options just 4 corner resize and left and right resize"
                    rotateEnabled={false}
                    enabledAnchors={[
                        'top-left', 'top-right', 'bottom-left', 'bottom-right',
                        'middle-left', 'middle-right' // User said "left and right resize"
                    ]}
                    boundBoxFunc={(oldBox, newBox) => {
                        // Min width check
                        if (newBox.width < 30) {
                            return oldBox;
                        }
                        return newBox;
                    }}
                />
            )}
        </>
    );
};
