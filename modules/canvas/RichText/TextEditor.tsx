import React, { useEffect, useRef, useState } from 'react';
import { Html } from 'react-konva-utils';
import { RichTextToolbar } from './RichTextToolbar';

interface TextEditorProps {
    initialText: string;
    x: number;
    y: number;
    width: number;
    fontSize: number;
    fontFamily: string;
    fontWeight?: string;
    fontStyle?: string;
    textDecoration?: string;
    fill: string;
    align: string;
    backgroundColor?: string;
    rotation: number;
    onChange: (newText: string) => void;
    onUpdate: (updates: any) => void;
    onClose: () => void;
}

export const TextEditor: React.FC<TextEditorProps> = ({
    initialText,
    x,
    y,
    width,
    fontSize,
    fontFamily,
    fontWeight = 'normal',
    fontStyle = 'normal',
    textDecoration = 'none',
    fill,
    align,
    backgroundColor = 'transparent',
    rotation,
    onChange,
    onUpdate,
    onClose,
}) => {
    const divRef = useRef<HTMLDivElement>(null);
    const [text, setText] = useState(initialText);

    // Initial focus and cursor placement
    useEffect(() => {
        if (divRef.current) {
            divRef.current.focus();
            // Move cursor to end
            const range = document.createRange();
            const selection = window.getSelection();
            range.selectNodeContents(divRef.current);
            range.collapse(false);
            selection?.removeAllRanges();
            selection?.addRange(range);
        }

        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                onClose();
            }
        };

        window.addEventListener('keydown', handleEscape);
        return () => window.removeEventListener('keydown', handleEscape);
    }, [onClose]);

    return (
        <Html
            groupProps={{
                x: x,
                y: y,
                rotation: rotation
            }}
            divProps={{
                style: {
                    pointerEvents: 'none',
                }
            }}
        >
            <div className="relative">
                <RichTextToolbar
                    fontFamily={fontFamily}
                    fontSize={fontSize}
                    fontWeight={fontWeight}
                    fontStyle={fontStyle}
                    textDecoration={textDecoration}
                    fill={fill}
                    align={align}
                    backgroundColor={backgroundColor}
                    onChange={onUpdate}
                    position={{ x: width / 2, y: -20 }} // Position relative to the editor div
                />
                <div
                    ref={divRef}
                    contentEditable
                    suppressContentEditableWarning
                    onBlur={onClose}
                    onInput={(e) => {
                        const newText = e.currentTarget.innerText;
                        setText(newText);
                        onChange(newText);
                    }}
                    style={{
                        position: 'absolute',
                        top: `0px`,
                        left: `0px`,
                        width: `${width}px`,
                        minHeight: `${fontSize * 1.2}px`,
                        fontSize: `${fontSize}px`,
                        fontFamily: fontFamily,
                        fontWeight: fontWeight,
                        fontStyle: fontStyle,
                        textDecoration: textDecoration,
                        color: fill,
                        textAlign: align as any,
                        lineHeight: '1.2',
                        background: backgroundColor || 'transparent',
                        borderRadius: '4px',
                        outline: 'none',
                        border: 'none',
                        padding: '0px',
                        margin: '0px',
                        whiteSpace: 'pre-wrap',
                        overflowWrap: 'break-word',
                        pointerEvents: 'auto',
                        transformOrigin: 'top left',
                    }}
                >
                    {text}
                </div>
            </div>
        </Html>
    );
};
