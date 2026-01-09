import React, { useEffect, useRef } from 'react';
import { Html } from 'react-konva-utils';

interface TextEditorProps {
    textNode: any; // Konva.Text
    onClose: () => void;
    onChange: (newText: string) => void;
}

export const TextEditor: React.FC<TextEditorProps> = ({ textNode, onClose, onChange }) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        if (!textareaRef.current || !textNode) return;

        const textarea = textareaRef.current;
        const stage = textNode.getStage();
        const textPosition = textNode.absolutePosition();
        // const stageBox = stage.container().getBoundingClientRect(); // Not strictly needed if we rely on absolute positioning within Html

        // Match styles with the text node
        textarea.value = textNode.text();
        textarea.style.position = 'absolute';
        // Position adjustments might be needed depending on stage scale/position, 
        // but react-konva-utils Html usually handles the DOM placement relative to the stage/canvas.
        // However, we want it to overlay exactly.
        // The Html component from react-konva-utils places the div at the node's position if `groupProps` or `divProps` aren't messing it up.
        // But here we are customizing the textarea style directly.

        // Let's copy the logic provided by the user which seems to handle style matching manually.
        // Note: The user code calculated `areaPosition` from `textNode.position()`.
        // If wrapping in `Html`, `Html` typically positions itself. 
        // The user's code:
        /*
          const areaPosition = {
            x: textPosition.x,
            y: textPosition.y,
          };
          textarea.style.top = `${areaPosition.y}px`;
          textarea.style.left = `${areaPosition.x}px`;
        */
        // If we use <Html> without props, it defaults to rendering at the Konva node's position?
        // Actually <Html> renders a div on top of the canvas. 
        // If we put it INSIDE the Text's parent, it might move with it? 
        // The user's example had `<Html><TextArea /></Html>` inside a functional component `TextEditor`.
        // And `EditableText` rendered `{isEditing && <TextEditor ... />}` inside `Layer`.
        // So `Html` is inside `Layer`. `Html` component needs to know where to position.
        // Passing `groupProps={{ x: ..., y: ... }}` to Html or relying on Konva's transform context if it supports it (it usually resets transform).

        // The safe bet is to use the logic provided:
        // Match exact absolute position
        const stageBox = stage.container().getBoundingClientRect();
        const areaPosition = {
            x: stageBox.left + textPosition.x,
            y: stageBox.top + textPosition.y,
        };

        // If we use Html, it is usually relative to the stage container (or the group it is in).
        // The Html component puts a div in the DOM.
        // If we use explicit top/left on the textarea, we should ensure the parent Html div is at 0,0 or we offset correctly.
        // But simpler: just position the textarea absolute RELATIVE TO THE STAGE CONTAINER if we were just appending to body.
        // React-konva-utils `Html` component is designed to follow the canvas node.
        // It applies transform: translate(...) to the wrapper div.
        // So we should NOT add stageBox offset if Html handles it?
        // Wait, Html handles the transforms relative to the canvas element.
        // So we just need `textPosition` (relative to the Stage).

        // Actually, let's look at `RichTextNode`: we render `<RichTextNode>` -> `<Html>`.
        // `RichTextNode` is inside `Layer`.
        // So `Html` will be placed at the position of the `RichTextNode` context in the layer.
        // BUT, `RichTextNode` sets `x` and `y` on the `Text` node, it doesn't wrap lines 132-185 in a Group.
        // So `RichTextNode` itself doesn't have an (x,y).
        // The `Text` has `x,y`. The `Transformer` has ref.
        // The `Html` component is a sibling to `Text` inside the Fragment.
        // So `Html` is at (0,0) of the Layer (if Layer is parent).
        // So we MUST use absolute position of the Text node relative to the Stage (or Layer).

        textarea.style.top = `${textPosition.y}px`;
        textarea.style.left = `${textPosition.x}px`;
        // Wait, the user's code sets top/left based on textNode position.
        // If `Html` handles the position (wrapping in a div that is absolutely positioned by react-konva-utils),
        // then setting top/left on textarea might be relative to that wrapper.

        // User's provided code uses `textNode.position()` which is relative to parent.
        // If we assume `TextEditor` is a sibling to `Text` (or replaced it), we need to be careful.
        // In the user's snippet:
        /*
          <Text ... visible={!isEditing} />
          {isEditing && <TextEditor ... />}
        */
        // So `TextEditor` is at Layer level. `textNode.position()` is relative to Layer (or Group).

        // Width/Height/Styles
        const updateStyle = () => {
            if (!textarea || !textNode) return;
            textarea.style.width = `${textNode.width() - textNode.padding() * 2}px`;
            textarea.style.height = `${textNode.height() - textNode.padding() * 2 + 5}px`;
            textarea.style.fontSize = `${textNode.fontSize()}px`;
            textarea.style.border = 'none';
            textarea.style.padding = '0px';
            textarea.style.margin = '0px';
            textarea.style.overflow = 'hidden';
            textarea.style.background = 'none';
            textarea.style.outline = 'none';
            textarea.style.resize = 'none';
            textarea.style.lineHeight = textNode.lineHeight();
            textarea.style.fontFamily = textNode.fontFamily();
            textarea.style.transformOrigin = 'left top';
            textarea.style.textAlign = textNode.align();
            textarea.style.color = textNode.fill();

            // Rotation
            const rotation = textNode.rotation();
            let transform = '';
            if (rotation) {
                transform += `rotateZ(${rotation}deg)`;
            }
            textarea.style.transform = transform;

            // Auto-height
            textarea.style.height = 'auto';
            textarea.style.height = `${textarea.scrollHeight + 3}px`;
        }

        updateStyle();
        textarea.focus();

        const handleOutsideClick = (e: MouseEvent) => {
            if (e.target !== textarea) {
                onChange(textarea.value);
                onClose();
            }
        };

        const handleKeyDown = (e: KeyboardEvent) => {
            // Allow Shift+Enter for new line, but Enter finishes edit? 
            // User code: if (e.key === "Enter" && !e.shiftKey) { finish }
            // This mimics typical input behavior, but for a textarea implies we want multiline?
            // Usually rich text / textarea allows Enter for new line.
            // The user code explicitly says "Enter && !ShiftKey -> Close".
            // Meaning Enter = Submit. Shift+Enter = New Line.
            // I will follow the user's code.
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                onChange(textarea.value);
                onClose();
            }
            if (e.key === 'Escape') {
                onClose();
            }
        };

        const handleInput = () => {
            const scale = textNode.getAbsoluteScale().x;
            textarea.style.width = `${textNode.width() * scale}px`;
            textarea.style.height = 'auto';
            textarea.style.height = `${textarea.scrollHeight + textNode.fontSize()}px`;
        };

        textarea.addEventListener('keydown', handleKeyDown);
        textarea.addEventListener('input', handleInput);
        setTimeout(() => {
            window.addEventListener('click', handleOutsideClick);
        });

        return () => {
            textarea.removeEventListener('keydown', handleKeyDown);
            textarea.removeEventListener('input', handleInput);
            window.removeEventListener('click', handleOutsideClick);
        };
    }, [textNode, onChange, onClose]);

    // Using Html from react-konva-utils
    // It automatically handles stage transformations if we pass the right props or let it inherit.
    // By default, it puts a div at the position of the Konva node it replaces or is placed at.
    // If we pass `groupProps` or `divProps` we can control it.
    // Since we are matching `textNode` position manually in the effect (Wait, the user code did `textarea.style.top = ...`),
    // we might be fighting `Html`'s positioning if we are not careful.

    // The user's code:
    /*
      const areaPosition = { x: textPosition.x, y: textPosition.y }; 
      textarea.style.top = `${areaPosition.y}px`;
      textarea.style.left = `${areaPosition.x}px`;
    */
    // This implies `Html` was rendering a container at (0,0) of the stage or something?
    // Actually `Html` by default renders a generic div overlay.
    // Let's use `groupProps` to position the Html wrapper at the text node's position?
    // OR rely on the user's manual positioning logic but realize it might be relative to the Html container.

    // To be safe and follow the user's requested implementation exactly:
    // The user's implementation used absolute positioning on the textarea itself.
    // I will retain that.

    // Also, for `Html`, we need to ensure it doesn't transform itself if we are manually transforming the textarea?
    // The user code applies rotation to textarea.

    return (
        <Html
            groupProps={{
                x: 0,
                y: 0,
                listening: false // we don't want the container to block events, but textarea should
            }}
            divProps={{
                style: {
                    opacity: 1,
                    pointerEvents: 'none' // The container shouldn't block, but textarea should have events
                }
            }}
        >
            <textarea
                ref={textareaRef}
                style={{
                    position: 'absolute', // User logic uses absolute
                    minHeight: '1em',
                    pointerEvents: 'auto', // Re-enable events
                    zIndex: 100 // Ensure on top
                }}
            />
        </Html >
    );
};
