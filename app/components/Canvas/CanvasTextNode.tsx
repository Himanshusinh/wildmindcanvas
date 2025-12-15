import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Text, Transformer } from 'react-konva';
import Konva from 'konva';
import { CanvasTextState } from '@/app/components/ModalOverlays/types';

interface CanvasTextNodeProps {
    data: CanvasTextState;
    isSelected: boolean;
    onSelect: (id: string) => void;
    onChange: (id: string, updates: Partial<CanvasTextState>) => void;
    stageScale: number;
}

export const CanvasTextNode: React.FC<CanvasTextNodeProps> = ({
    data,
    isSelected,
    onSelect,
    onChange,
    stageScale,
}) => {
    const textRef = useRef<Konva.Text>(null);
    const trRef = useRef<Konva.Transformer>(null);

    useEffect(() => {
        if (isSelected && trRef.current && textRef.current) {
            trRef.current.nodes([textRef.current]);
            trRef.current.getLayer()?.batchDraw();
        }
    }, [isSelected]);

    const editingTextareaRef = useRef<HTMLTextAreaElement | null>(null);

    const updateTextareaPosition = useCallback(() => {
        const textarea = editingTextareaRef.current;
        const textNode = textRef.current;
        if (!textarea || !textNode) return;

        const stage = textNode.getStage();
        if (!stage) return;

        const scale = stage.scaleX();

        const textPosition = textNode.getAbsolutePosition();

        // When appended to stage.container(), coordinate space matches getAbsolutePosition
        // absolutePosition creates coords relative to valid container top-left
        const areaPosition = {
            x: textPosition.x,
            y: textPosition.y,
        };

        Object.assign(textarea.style, {
            position: 'absolute',
            top: areaPosition.y + 'px',
            left: areaPosition.x + 'px',
            width: textNode.width() * scale + 'px',
            minHeight: textNode.height() * scale + 'px',
            fontSize: textNode.fontSize() * scale + 'px',
            lineHeight: String(textNode.lineHeight()),
            height: 'auto',
            transform: `rotate(${textNode.rotation()}deg)`,
            transformOrigin: 'left top',
        });

        textarea.style.height = textarea.scrollHeight + 'px';
    }, []);

    // Update position on every render (handles zoom/pan via props/state)
    useEffect(() => {
        if (editingTextareaRef.current) {
            updateTextareaPosition();
        }
    }, [updateTextareaPosition, stageScale]);

    // Also listen to dragmove if stage is dragging (pan) but no prop update yet
    useEffect(() => {
        const node = textRef.current;
        if (!node) return;
        const stage = node.getStage();
        if (!stage) return;

        const handleDrag = () => {
            if (editingTextareaRef.current) {
                updateTextareaPosition();
            }
        };

        stage.on('dragmove', handleDrag);
        return () => {
            stage.off('dragmove', handleDrag);
        };
    }, [updateTextareaPosition]);

    const handleTextDblClick = useCallback((e?: any) => {
        if (e) e.cancelBubble = true;

        const textNode = textRef.current;
        if (!textNode) return;

        const stage = textNode.getStage();
        if (!stage) return;

        // Hide node
        textNode.hide();
        textNode.draggable(false);
        trRef.current?.hide();

        const textarea = document.createElement('textarea');
        stage.container().appendChild(textarea);
        editingTextareaRef.current = textarea;

        textarea.value = textNode.text();

        Object.assign(textarea.style, {
            position: 'absolute',
            fontFamily: textNode.fontFamily(),
            color: textNode.fill(),
            padding: '0px',
            margin: '0px',
            overflow: 'hidden',
            resize: 'none',
            appearance: 'none',
            webkitAppearance: 'none',
            whiteSpace: 'pre-wrap',
            caretColor: textNode.fill(),
            zIndex: '999999',
            // Initial pos set by updateTextareaPosition below
        });

        // Force transparency with priority
        textarea.style.setProperty('background-color', 'transparent', 'important');
        textarea.style.setProperty('background', 'transparent', 'important');
        textarea.style.setProperty('border', 'none', 'important');
        textarea.style.setProperty('outline', 'none', 'important');
        textarea.style.setProperty('box-shadow', 'none', 'important');

        updateTextareaPosition();
        textarea.focus();

        const autoResize = () => {
            textarea.style.height = 'auto';
            textarea.style.height = textarea.scrollHeight + 'px';
        };

        textarea.addEventListener('input', autoResize);

        const removeTextarea = (save = true) => {
            if (save) {
                onChange(data.id, { text: textarea.value });
            }
            textarea.remove();
            editingTextareaRef.current = null;

            // Check if node still exists before showing
            if (textRef.current) {
                textNode.show();
                textNode.draggable(true);
                trRef.current?.show();
                textNode.getLayer()?.batchDraw();
            }
        };

        textarea.addEventListener('keydown', (ev) => {
            if (ev.key === 'Enter' && !ev.shiftKey) {
                ev.preventDefault();
                removeTextarea(true);
            }
            if (ev.key === 'Escape') {
                removeTextarea(false);
            }
        });

        setTimeout(() => {
            const handleOutside = (ev: MouseEvent) => {
                if (ev.target !== textarea) {
                    removeTextarea(true);
                    window.removeEventListener('mousedown', handleOutside);
                }
            };
            window.addEventListener('mousedown', handleOutside);
        }, 200);
    }, [data.id, onChange, updateTextareaPosition]);

    const handleTextChange = useCallback((newText: string) => {
        onChange(data.id, { text: newText });
    }, [data.id, onChange]);

    const handleTransform = useCallback(() => {
        const node = textRef.current;
        if (!node) return;

        const scaleX = node.scaleX();
        const scaleY = node.scaleY();

        // Calculate new values
        const newFontSize = Math.max(8, node.fontSize() * scaleY);
        const newWidth = Math.max(30, node.width() * scaleX);

        // Reset scale so text never stretches
        node.scaleX(1);
        node.scaleY(1);

        // Apply real values
        node.fontSize(newFontSize);
        node.width(newWidth);

        onChange(data.id, {
            x: node.x(),
            y: node.y(),
            rotation: node.rotation(),
            width: newWidth,
            fontSize: newFontSize,
        });
    }, [data.id, onChange]);

    const handleDragEnd = useCallback((e: Konva.KonvaEventObject<DragEvent>) => {
        onChange(data.id, {
            x: e.target.x(),
            y: e.target.y(),
        });
    }, [data.id, onChange]);

    return (
        <>
            <Text
                ref={textRef}
                text={data.text}
                x={data.x}
                y={data.y}
                rotation={data.rotation}
                fontSize={data.fontSize}
                fontFamily={data.fontFamily}
                fontStyle={data.fontStyle}
                fill={data.color}
                align={data.textAlign}
                width={data.width}
                draggable
                onDblClick={handleTextDblClick}
                onDblTap={handleTextDblClick}
                onClick={(e) => {
                    onSelect(data.id);
                    e.cancelBubble = true;
                }}
                onTap={(e) => {
                    onSelect(data.id);
                    e.cancelBubble = true;
                }}
                onTransformEnd={handleTransform}
                onDragEnd={handleDragEnd}
            />
            {isSelected && (
                <Transformer
                    ref={trRef}
                    rotateEnabled
                    enabledAnchors={[
                        'top-left',
                        'top-right',
                        'bottom-left',
                        'bottom-right',
                        'middle-left',
                        'middle-right',
                    ]}
                    boundBoxFunc={(oldBox, newBox) => {
                        if (newBox.width < 30 || newBox.height < 20) {
                            return oldBox;
                        }
                        return newBox;
                    }}
                />
            )}
        </>
    );
};
