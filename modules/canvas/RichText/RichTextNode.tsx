import React, { useRef, useEffect, useCallback } from 'react';
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
    isEditing?: boolean; // Global state property
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
    isEditing = false,
    isSelected,
    onSelect,
    onChange,
    draggable = true,
}) => {
    // Refs
    const textRef = useRef<Konva.Text>(null);
    const trRef = useRef<Konva.Transformer>(null);

    // Initial Selection Binding
    useEffect(() => {
        if (isSelected && !isEditing && trRef.current && textRef.current) {
            // Attach transformer
            trRef.current.nodes([textRef.current]);
            trRef.current.getLayer()?.batchDraw();
        }
    }, [isSelected, isEditing]);

    const handleTextDblClick = useCallback(() => {
        // Dispatch global state update
        onChange({ isEditing: true });
    }, [onChange]);

    const handleTextChange = useCallback((newText: string) => {
        onChange({
            text: newText,
        });
    }, [onChange]);

    const handleEditorClose = useCallback(() => {
        onChange({ isEditing: false });
    }, [onChange]);

    const handleTransformEnd = useCallback(() => {
        const node = textRef.current;
        if (node) {
            const scaleX = node.scaleX();
            // Reset scale and update width to prevent font stretching
            const newWidth = Math.max(30, node.width() * scaleX);

            node.scaleX(1);
            node.scaleY(1);

            onChange({
                width: newWidth,
                rotation: node.rotation(),
                x: node.x(),
                y: node.y(),
            });
        }
    }, [onChange]);

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
                draggable={draggable}
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
                visible={!isEditing}
            />

            {isEditing && textRef.current && (
                <TextEditor
                    initialText={text}
                    x={x}
                    y={y}
                    width={width}
                    fontSize={fontSize}
                    fontFamily={fontFamily}
                    fill={fill}
                    align={align}
                    rotation={textRef.current.rotation()}
                    onChange={handleTextChange}
                    onClose={handleEditorClose}
                />
            )}

            {isSelected && !isEditing && (
                <Transformer
                    ref={trRef}
                    rotateEnabled={false}
                    enabledAnchors={[
                        'top-left', 'top-right', 'bottom-left', 'bottom-right',
                        'middle-left', 'middle-right'
                    ]}
                    boundBoxFunc={(oldBox, newBox) => {
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
