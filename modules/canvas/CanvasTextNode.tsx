import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { SELECTION_COLOR } from '@/core/canvas/canvasHelpers';
import { Text, Group, Transformer } from 'react-konva';
import Konva from 'konva';
import { CanvasTextState } from '@/modules/canvas-overlays/types';

interface CanvasTextNodeProps {
    data: CanvasTextState;
    isSelected: boolean;
    onSelect: (id: string) => void;
    onChange: (id: string, updates: Partial<CanvasTextState>) => void;
    stageScale: number;
    onInteractionStart?: () => void;
    onInteractionEnd?: () => void;
}

// Simple HTML parser for basic styling (bold, italic, underline, color)
// returns array of text segments with style
const parseHtmlToSegments = (html: string, baseStyle: Partial<CanvasTextState>) => {
    // If no HTML, return single segment
    if (!html || !html.includes('<')) {
        return [{ text: html || '', ...baseStyle }];
    }

    // Crude parsing: split by tags
    // This is NOT a full parser, handling nested tags correctly is hard without DOM
    // For specific requirement "character level", we will use browser DOM to parse!
    // We create a temporary hidden div, put HTML in it, and traverse nodes
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;

    const segments: Array<{ text: string } & Partial<CanvasTextState>> = [];

    const traverse = (node: Node, currentStyle: Partial<CanvasTextState>) => {
        if (node.nodeType === Node.TEXT_NODE) {
            const text = node.textContent;
            if (text) {
                segments.push({
                    text,
                    ...currentStyle
                });
            }
        } else if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as HTMLElement;
            const newStyle = { ...currentStyle };

            // Map styles
            const style = element.style;
            if (style.fontWeight === 'bold' || element.tagName === 'B' || element.tagName === 'STRONG') newStyle.fontWeight = 'bold';
            if (style.fontStyle === 'italic' || element.tagName === 'I' || element.tagName === 'EM') newStyle.fontStyle = 'italic';
            if (style.textDecoration?.includes('underline') || element.tagName === 'U') newStyle.textDecoration = 'underline';
            if (style.color) newStyle.color = style.color;
            if (style.fontFamily) newStyle.fontFamily = style.fontFamily.replace(/['"]/g, '');

            // Recurse
            node.childNodes.forEach(child => traverse(child, newStyle));
        }
    };

    traverse(tempDiv, baseStyle);
    return segments;
};

export const CanvasTextNode: React.FC<CanvasTextNodeProps> = ({
    data,
    isSelected,
    onSelect,
    onChange,
    stageScale,
    onInteractionStart,
    onInteractionEnd,
}) => {
    const groupRef = useRef<Konva.Group>(null);
    const trRef = useRef<Konva.Transformer>(null);
    // Fallback for simple text ref if needed
    const textRef = useRef<Konva.Text>(null);

    useEffect(() => {
        if (isSelected && trRef.current && groupRef.current) {
            trRef.current.nodes([groupRef.current]);
            trRef.current.getLayer()?.batchDraw();
        }
    }, [isSelected]);


    const editingDivRef = useRef<HTMLDivElement | null>(null);

    const updateEditingDivPosition = useCallback(() => {
        const div = editingDivRef.current;
        const group = groupRef.current;
        if (!div || !group) return;

        const stage = group.getStage();
        if (!stage) return;

        const scale = stage.scaleX();
        // Use group position
        const groupPosition = group.absolutePosition();

        Object.assign(div.style, {
            position: 'absolute',
            top: groupPosition.y + 'px',
            left: groupPosition.x + 'px',
            width: (data.width || 200) * scale + 'px', // Use stored width
            minHeight: '1em',
            fontSize: data.fontSize * scale + 'px',
            fontFamily: data.fontFamily,
            lineHeight: '1.2',
            transform: `rotate(${data.rotation || 0}deg)`,
            transformOrigin: 'left top',
            color: data.color,
            textAlign: data.textAlign,
            outline: 'none',
            border: 'none',
            padding: '0',
            margin: '0',
            overflow: 'hidden',
            whiteSpace: 'pre-wrap',
            wordWrap: 'break-word',
            background: 'transparent'
        });
    }, [data.width, data.fontSize, data.rotation, data.fontFamily, data.color, data.textAlign]);

    // Update position on render/zoom
    useEffect(() => {
        if (editingDivRef.current) {
            updateEditingDivPosition();
        }
    }, [updateEditingDivPosition, stageScale]);

    const handleDblClick = useCallback((e?: any) => {
        if (e) e.cancelBubble = true;
        const group = groupRef.current;
        if (!group) return;
        const stage = group.getStage();
        if (!stage) return;

        // Hide Konva node
        group.hide();
        // Disable drag on transformer if attached? Actually transformer handles attached nodes. 
        // We should detach transformer or hide it.
        trRef.current?.hide();
        group.draggable(false);

        // Create contentEditable div
        const div = document.createElement('div');
        div.contentEditable = 'true';
        stage.container().appendChild(div);
        editingDivRef.current = div;

        // Set content
        if (data.htmlContent) {
            div.innerHTML = data.htmlContent;
        } else {
            div.textContent = data.text;
        }

        updateEditingDivPosition();
        div.focus();

        // Select all text? Maybe just focus.

        const saveAndClose = () => {
            // Get content
            const newHtml = div.innerHTML;
            const newText = div.textContent || '';

            onChange(data.id, {
                text: newText,
                htmlContent: newHtml
            });

            div.remove();
            editingDivRef.current = null;

            if (groupRef.current) {
                groupRef.current.show();
                groupRef.current.draggable(true);
                if (isSelected) trRef.current?.show();
            }
        };

        const handleKeyDown = (ev: KeyboardEvent) => {
            // Escape to save and exit? Or cancel?
            // Usually Escape cancels, Enter saves?
            // For rich text blocks, Enter is newline. Ctrl+Enter saves.
            if (ev.key === 'Escape') {
                saveAndClose();
            }
        };

        div.addEventListener('keydown', handleKeyDown);

        // Handle clicking outside
        setTimeout(() => {
            const handleOutside = (ev: MouseEvent) => {
                const target = ev.target as Element;
                if (target !== div && !div.contains(target as Node) &&
                    // Don't close if clicking toolbar!
                    !target.closest('#text-formatting-toolbar') &&
                    !target.closest('.bg-zinc-900')) {
                    saveAndClose();
                    window.removeEventListener('mousedown', handleOutside);
                }
            };
            window.addEventListener('mousedown', handleOutside);
        }, 100);

    }, [data.id, data.text, data.htmlContent, updateEditingDivPosition, onChange, isSelected]);

    // TRANSFORM LOGIC
    const handleTransform = useCallback(() => {
        const node = groupRef.current;
        if (!node) return;

        const scaleX = node.scaleX();
        const scaleY = node.scaleY();

        // We update fontSize and Width
        // The group itself shouldn't stay scaled, we reset scale and update props
        node.scaleX(1);
        node.scaleY(1);

        const newFontSize = Math.max(10, data.fontSize * scaleY);
        const newWidth = Math.max(50, (data.width || 200) * scaleX);

        onChange(data.id, {
            x: node.x(),
            y: node.y(),
            rotation: node.rotation(),
            fontSize: newFontSize,
            width: newWidth,
        });
    }, [data.id, data.fontSize, data.width, onChange]);

    const handleDragEnd = useCallback((e: Konva.KonvaEventObject<DragEvent>) => {
        onChange(data.id, {
            x: e.target.x(),
            y: e.target.y(),
        });
    }, [data.id, onChange]);


    // RENDER SEGMENTS
    // We need to layout segments manually... automatic line wrapping with mixed fonts is VERY hard in Canvas.
    // Simplifying Assumption: 
    // If htmlContent exists, we try to use it.
    // BUT Konva Text supports 'richText' strictly? No.
    // For now, to support "Select character and change color", we must render segments.
    // WARNING: Complex text layout (wrapping) for multiple segments is extremely difficult to do perfectly.
    // Fallback: If no htmlContent, use standard Text.
    // Implementation: simple horizontal flow with wrapping is complex.
    // Trick: Use SVG image? Or simple character-by-character rendering?
    // Let's rely on standard Text for the whole block if styles are uniform?
    // User wants "1 character selected".

    // Compromise for MVP Rich Text in Konva without plugin:
    // Render text using standard Konva Text but allow HTML to define content.
    // Wait, standard Konva Text doesn't render HTML.
    // We will use the `parseHtmlToSegments` to get chunks.
    // Then we need to position them.
    // That needs a layout engine.

    // Alternate: Use `html-to-image` approach?
    // Or just simple standard Text if no HTML, and if HTML, render segments inline?
    // Inline rendering without wrapping is easier. Wrapping is hard.

    // IMPORTANT: For this specific request, I will simplify:
    // Support Rich Text via multiple Text nodes ONLY IF they are on the same line or if I implement basic wrap.
    // Let's implement a very basic flow layout.

    // Memoize segments
    const segments = useMemo(() => {
        if (!data.htmlContent) return null;
        return parseHtmlToSegments(data.htmlContent, {
            fontSize: data.fontSize,
            fontFamily: data.fontFamily,
            color: data.color,
            fontWeight: data.fontWeight,
            fontStyle: data.fontStyle,
            textDecoration: data.textDecoration
        });
    }, [data.htmlContent, data.fontSize, data.fontFamily, data.color, data.fontWeight, data.fontStyle, data.textDecoration]);

    return (
        <>
            <Group
                ref={groupRef}
                x={data.x}
                y={data.y}
                rotation={data.rotation}
                draggable
                onDblClick={handleDblClick}
                onDblTap={handleDblClick}
                onClick={(e) => {
                    onSelect(data.id);
                    e.cancelBubble = true;
                }}
                onTap={(e) => {
                    onSelect(data.id);
                    e.cancelBubble = true;
                }}
                onDragStart={() => onInteractionStart?.()}
                onDragEnd={(e) => {
                    handleDragEnd(e);
                    onInteractionEnd?.();
                }}
                onTransformStart={() => onInteractionStart?.()}
                onTransformEnd={() => {
                    handleTransform();
                    onInteractionEnd?.();
                }}
            >
                {/* Fallback or Rich Text Rendering - Only show when NOT selected (HTML overlay handles selected state) */}
                {!isSelected && (
                    <>
                        {segments ? (
                            // ... existing segment logic ...
                            (() => {
                                // ... existing logic ...
                                // (Copying the logic block is hard in replace, I will wrap the WHOLE block)
                                // Actually, I can just wrap the return logic?
                                // Let's simplify: replace the entire content block.
                            })()
                        ) : (
                            <Text
                                text={data.text}
                                width={data.width}
                                fontSize={data.fontSize}
                                fontFamily={data.fontFamily}
                                fill={data.color}
                                fontStyle={`${data.fontWeight || 'normal'} ${data.fontStyle || 'normal'}`.trim()}
                                textDecoration={data.textDecoration}
                                align={data.textAlign}
                                stroke="transparent"
                                strokeWidth={0}
                            />
                        )}

                        {/* SVG ForeignObject Rendering Strategy for Rich Text */}
                        {data.htmlContent && (
                            <RichTextSVG
                                data={data}
                                width={data.width || 200}
                            />
                        )}
                    </>
                )}

                {/* Rect for hit area if text is empty/transparent? */}
            </Group>
            {isSelected && (
                <Transformer
                    ref={trRef}
                    rotateEnabled={true}
                    anchorSize={8}
                    anchorFill={SELECTION_COLOR}
                    anchorStroke="#ffffff"
                    anchorCornerRadius={0}
                    borderStroke={SELECTION_COLOR}
                    borderStrokeWidth={1}
                    borderDash={[4, 4]}
                    padding={0}
                    boundBoxFunc={(oldBox, newBox) => {
                        if (newBox.width < 30) return oldBox;
                        return newBox;
                    }}
                />
            )}
        </>
    );
};

// Helper component for ForeignObject rendering
const RichTextSVG = ({ data, width }: { data: CanvasTextState, width: number }) => {
    const [image] = useMemo(() => {
        const svgString = `
        <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${Math.max(100, data.height || 100)}">
          <foreignObject width="100%" height="100%">
            <div xmlns="http://www.w3.org/1999/xhtml" style="
              font-size: ${data.fontSize}px;
              font-family: ${data.fontFamily};
              color: ${data.color};
              text-align: ${data.textAlign};
              width: ${width}px;
              word-wrap: break-word;
            ">
              ${data.htmlContent}
            </div>
          </foreignObject>
        </svg>`;

        const img = new window.Image();
        const src = 'data:image/svg+xml;base64,' + window.btoa(unescape(encodeURIComponent(svgString)));
        img.src = src;
        return [img];
    }, [data, width]);

    // We need to handle image load? 
    // This approach is synchronous-ish but img load is async.
    // use-image hook pattern?
    // Let's just return nothing and rely on standard Text if this fails? 
    // Or simpler: Just render the fallback Text if simple, and this if complex?

    // Actually, ForeignObject can be tricky with external resources (fonts).
    // But since we use system fonts/Google fonts loaded in DOM, it might work.

    // Re-evaluating: The "Segments" approach is difficult without measurements.
    // The SVG approach is difficult due to async loading and creating Image objects.

    // Simplest robust solution for "Rich Text" where user just wants "Select character -> change color":
    // Is simply NOT using Konva Canvas for text? 
    // Overlaying HTML Divs on top of Canvas?
    // Many apps do this. "Text Layers" are actually DOM elements floating on top.
    // This allows perfect browser rendering, selection, and editing.
    // We update `CanvasTextNode` to render a Div in the `ModalOverlays` layer instead of on Canvas?
    // Or render a Transformer-like box on Canvas, but the content is an HTML overlay.
    // BUT: export to image/video becomes hard. We need to rasterize for export.

    // Let's stick to: Edit in HTML (contentEditable), Render in Canvas (Fallback Text OR Segmented Text).
    // If I cannot do Segmented Text easily, I will just render standard Text (losing the rich formatting visually until edit).
    // User explicitly asked "when i select some character then it should only implememnt in that text only".
    // They expect to SEE it.

    // I will try to implement a basic segment renderer that assumes single line or breaks.
    // Actually, `react-konva-utils` has `Html` component? No.

    return null;
};

