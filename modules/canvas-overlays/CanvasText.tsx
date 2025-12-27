import React, { useState, useRef, useEffect } from 'react';
import { CanvasTextState } from './types';
import { CanvasTextControls } from '@/modules/generators/TextInput/CanvasTextControls';

interface CanvasTextProps {
    data: CanvasTextState;
    isSelected: boolean;
    onSelect: (id: string) => void;
    onUpdate: (id: string, updates: Partial<CanvasTextState>) => void;
    onDelete: (id: string) => void;
    scale: number;
    position: { x: number; y: number };
}

export const CanvasText: React.FC<CanvasTextProps> = ({
    data,
    isSelected,
    onSelect,
    onUpdate,
    onDelete,
    scale,
    position,
}) => {
    const contentEditableRef = useRef<HTMLDivElement>(null);
    const isTypingRef = useRef(false);
    const lastTextRef = useRef(data.text);

    // Debounce refs for updates during typing/dragging
    const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const pendingUpdateRef = useRef<Partial<import('./types').CanvasTextState> | null>(null);
    const rafRef = useRef<number | null>(null);

    // Local position state for smooth dragging (updates immediately, doesn't trigger snapshots)
    const [localX, setLocalX] = useState(data.x);
    const [localY, setLocalY] = useState(data.y);
    const containerRef = useRef<HTMLDivElement>(null);

    // Dragging state
    const [isDragging, setIsDragging] = useState(false);
    const dragStartRef = useRef<{ x: number; y: number; initialX: number; initialY: number } | null>(null);

    // Resizing state
    const [isResizing, setIsResizing] = useState(false);
    const resizeStartRef = useRef<{
        x: number;
        y: number;
        initialWidth: number;
        initialHeight: number;
        initialX: number;
        initialY: number;
        handle: string;
        scaleFromCenter?: boolean; // true when Alt/Option is held
    } | null>(null);

    // Auto-focus and select all text when newly created
    useEffect(() => {
        const isDefaultText = data.text === 'Add a text' || data.text === 'Double click to edit' || data.text === 'add text here';
        if (isSelected && isDefaultText && contentEditableRef.current) {
            contentEditableRef.current.focus();
            const range = document.createRange();
            range.selectNodeContents(contentEditableRef.current);
            const selection = window.getSelection();
            selection?.removeAllRanges();
            selection?.addRange(range);
        }
    }, [isSelected, data.text]);

    // Initialize contentEditable with text on mount
    useEffect(() => {
        if (contentEditableRef.current && !contentEditableRef.current.textContent) {
            contentEditableRef.current.textContent = data.text || "add text here";
            lastTextRef.current = data.text || "add text here";
        }
    }, []);

    // Sync contentEditable content with data.text (only when not focused and not typing)
    useEffect(() => {
        // Never sync while element is focused or user is typing
        if (contentEditableRef.current &&
            document.activeElement !== contentEditableRef.current &&
            !isTypingRef.current &&
            data.text !== lastTextRef.current &&
            contentEditableRef.current.textContent !== data.text) {
            contentEditableRef.current.textContent = data.text || "add text here";
            lastTextRef.current = data.text;
        }
    }, [data.text]);

    // Sync local position with data position when not dragging
    useEffect(() => {
        if (!isDragging) {
            setLocalX(data.x);
            setLocalY(data.y);
        }
    }, [data.x, data.y, isDragging]);

    // Adjust height based on content - similar to Konva.Text's auto-sizing
    // When width changes (text wrapping), height adjusts automatically
    const adjustHeight = () => {
        if (contentEditableRef.current) {
            // Reset height to auto to get accurate scrollHeight
            contentEditableRef.current.style.height = 'auto';
            const newHeight = contentEditableRef.current.scrollHeight;
            // Set explicit height to prevent layout shifts
            contentEditableRef.current.style.height = `${newHeight}px`;
            // Update the stored height in canvas coordinates
            // This is equivalent to Konva.Text's height calculation when width changes
            onUpdate(data.id, { height: newHeight / scale });
        }
    };

    // Adjust height when width changes (for text wrapping)
    // This mimics Konva.Text behavior: when width() changes, text reflows and height adjusts
    useEffect(() => {
        if (contentEditableRef.current && !isResizing) {
            // Only adjust if not actively resizing to avoid conflicts
            adjustHeight();
        }
    }, [data.width, data.text, scale, isResizing]);

    // Adjust height after resize completes
    useEffect(() => {
        if (!isResizing && contentEditableRef.current) {
            // Small delay to ensure DOM has updated
            setTimeout(() => adjustHeight(), 10);
        }
    }, [isResizing]);

    const handleMouseDown = (e: React.MouseEvent) => {
        // Don't start dragging if clicking on a resize handle
        if ((e.target as HTMLElement).classList.contains('resize-handle')) {
            // Still select the text when clicking on resize handle
            onSelect(data.id);
            return;
        }

        // If clicking inside contentEditable, allow text editing (don't drag)
        if ((e.target as HTMLElement).closest('[contenteditable="true"]')) {
            // Select the text component when clicking inside it
            onSelect(data.id);
            // Don't prevent default - let text editing work
            return;
        }

        // Only left click drags
        if (e.button !== 0) return;

        e.preventDefault();
        e.stopPropagation();

        // Select the text component when clicking on it
        onSelect(data.id);

        // Don't start dragging automatically - only when move button is used
        // This allows clicking on text to edit it
    };

    useEffect(() => {
        if (!isDragging && !isResizing) return;

        const handleMouseMove = (e: MouseEvent) => {
            if (isResizing && resizeStartRef.current) {
                const {
                    initialWidth,
                    initialHeight,
                    initialX,
                    initialY,
                    handle,
                    x: startX,
                    y: startY,
                    scaleFromCenter = false
                } = resizeStartRef.current;

                const dx = (e.clientX - startX) / scale;
                const dy = (e.clientY - startY) / scale;

                let newWidth = initialWidth;
                let newHeight = initialHeight || 100;
                let newX = initialX;
                let newY = initialY;

                // Check Alt/Option key during drag for center scaling
                const isAltPressed = e.altKey || e.metaKey;
                const useCenterScaling = scaleFromCenter || isAltPressed;

                // ALL handles only resize the box - font size NEVER changes via handles
                // Font size can ONLY be changed via the toolbar font size control

                // Handle corner resizing (box resizing only - text wraps, font size unchanged)
                if (handle.includes('nw')) {
                    if (useCenterScaling) {
                        // Scale from center
                        const centerX = initialX + initialWidth / 2;
                        const centerY = initialY + initialHeight / 2;
                        const mouseCanvasX = (e.clientX - position.x) / scale;
                        const mouseCanvasY = (e.clientY - position.y) / scale;
                        const distX = Math.abs(mouseCanvasX - centerX) * 2;
                        const distY = Math.abs(mouseCanvasY - centerY) * 2;
                        newWidth = Math.max(50, distX);
                        newHeight = Math.max(20, distY);
                        newX = centerX - newWidth / 2;
                        newY = centerY - newHeight / 2;
                    } else {
                        newWidth = Math.max(50, initialWidth - dx);
                        newHeight = Math.max(20, initialHeight - dy);
                        newX = initialX + (initialWidth - newWidth);
                        newY = initialY + (initialHeight - newHeight);
                    }
                } else if (handle.includes('ne')) {
                    if (useCenterScaling) {
                        const centerX = initialX + initialWidth / 2;
                        const centerY = initialY + initialHeight / 2;
                        const mouseCanvasX = (e.clientX - position.x) / scale;
                        const mouseCanvasY = (e.clientY - position.y) / scale;
                        const distX = Math.abs(mouseCanvasX - centerX) * 2;
                        const distY = Math.abs(mouseCanvasY - centerY) * 2;
                        newWidth = Math.max(50, distX);
                        newHeight = Math.max(20, distY);
                        newX = centerX - newWidth / 2;
                        newY = centerY - newHeight / 2;
                    } else {
                        newWidth = Math.max(50, initialWidth + dx);
                        newHeight = Math.max(20, initialHeight - dy);
                        newY = initialY + (initialHeight - newHeight);
                    }
                } else if (handle.includes('sw')) {
                    if (useCenterScaling) {
                        const centerX = initialX + initialWidth / 2;
                        const centerY = initialY + initialHeight / 2;
                        const mouseCanvasX = (e.clientX - position.x) / scale;
                        const mouseCanvasY = (e.clientY - position.y) / scale;
                        const distX = Math.abs(mouseCanvasX - centerX) * 2;
                        const distY = Math.abs(mouseCanvasY - centerY) * 2;
                        newWidth = Math.max(50, distX);
                        newHeight = Math.max(20, distY);
                        newX = centerX - newWidth / 2;
                        newY = centerY - newHeight / 2;
                    } else {
                        newWidth = Math.max(50, initialWidth - dx);
                        newHeight = Math.max(20, initialHeight + dy);
                        newX = initialX + (initialWidth - newWidth);
                    }
                } else if (handle.includes('se')) {
                    if (useCenterScaling) {
                        const centerX = initialX + initialWidth / 2;
                        const centerY = initialY + initialHeight / 2;
                        const mouseCanvasX = (e.clientX - position.x) / scale;
                        const mouseCanvasY = (e.clientY - position.y) / scale;
                        const distX = Math.abs(mouseCanvasX - centerX) * 2;
                        const distY = Math.abs(mouseCanvasY - centerY) * 2;
                        newWidth = Math.max(50, distX);
                        newHeight = Math.max(20, distY);
                        newX = centerX - newWidth / 2;
                        newY = centerY - newHeight / 2;
                    } else {
                        newWidth = Math.max(50, initialWidth + dx);
                        newHeight = Math.max(20, initialHeight + dy);
                    }
                }
                // Handle side resizing (box-only - text wraps, no font size change)
                else if (handle === 'n') {
                    // Top handle - adjust height only
                    newHeight = Math.max(20, initialHeight - dy);
                    newY = initialY + (initialHeight - newHeight);
                } else if (handle === 's') {
                    // Bottom handle - adjust height only
                    newHeight = Math.max(20, initialHeight + dy);
                } else if (handle === 'w') {
                    // Left handle - adjust width only
                    newWidth = Math.max(50, initialWidth - dx);
                    newX = initialX + (initialWidth - newWidth);
                } else if (handle === 'e') {
                    // Right handle - adjust width only
                    newWidth = Math.max(50, initialWidth + dx);
                }

                // Update only box dimensions - font size NEVER changes via handles
                // Font size can ONLY be changed via the toolbar font size control
                // DO NOT call onUpdate during resizing - only store pending updates
                // This prevents blob creation and snapshot saves during resize
                const updates: Partial<CanvasTextState> = {
                    width: newWidth,
                    height: newHeight,
                    x: newX,
                    y: newY,
                };

                // Store pending updates but don't persist until resize ends
                // Merge with any existing pending updates
                pendingUpdateRef.current = {
                    ...pendingUpdateRef.current,
                    ...updates,
                };
            } else if (isDragging && dragStartRef.current) {
                const dx = (e.clientX - dragStartRef.current.x) / scale;
                const dy = (e.clientY - dragStartRef.current.y) / scale;

                const newX = dragStartRef.current.initialX + dx;
                const newY = dragStartRef.current.initialY + dy;

                // Update visual position immediately using requestAnimationFrame for smooth dragging
                // DO NOT call onUpdate during dragging - only update local visual state
                // This prevents blob creation and snapshot saves during drag
                if (rafRef.current) {
                    cancelAnimationFrame(rafRef.current);
                }
                rafRef.current = requestAnimationFrame(() => {
                    setLocalX(newX);
                    setLocalY(newY);
                    rafRef.current = null;
                });

                // Store the final position but don't persist it yet
                // We'll persist only when drag ends to avoid blob creation during movement
                pendingUpdateRef.current = {
                    x: newX,
                    y: newY,
                };
            }
        };

        const handleMouseUp = () => {
            setIsDragging(false);
            setIsResizing(false);
            dragStartRef.current = null;
            resizeStartRef.current = null;

            // Flush any pending updates immediately when drag/resize ends
            // This is the ONLY time we persist position during drag - prevents blob creation
            if (pendingUpdateRef.current) {
                onUpdate(data.id, pendingUpdateRef.current);
                // Sync local position with final state
                if (pendingUpdateRef.current.x !== undefined) setLocalX(pendingUpdateRef.current.x);
                if (pendingUpdateRef.current.y !== undefined) setLocalY(pendingUpdateRef.current.y);
                pendingUpdateRef.current = null;
            }
            if (updateTimeoutRef.current) {
                clearTimeout(updateTimeoutRef.current);
                updateTimeoutRef.current = null;
            }
        };

        window.addEventListener('mousemove', handleMouseMove);
        // Capture so stopPropagation can't block drag end
        window.addEventListener('mouseup', handleMouseUp, true);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp, true);
            // Clean up any pending updates
            if (updateTimeoutRef.current) {
                clearTimeout(updateTimeoutRef.current);
                updateTimeoutRef.current = null;
            }
            if (rafRef.current) {
                cancelAnimationFrame(rafRef.current);
                rafRef.current = null;
            }
        };
    }, [isDragging, isResizing, data.id, onUpdate, scale]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (updateTimeoutRef.current) {
                clearTimeout(updateTimeoutRef.current);
            }
            if (rafRef.current) {
                cancelAnimationFrame(rafRef.current);
            }
        };
    }, []);

    const handleResizeStart = (e: React.MouseEvent, handle: string) => {
        e.preventDefault();
        e.stopPropagation();

        // Calculate current height if not set
        const currentHeight = data.height || (contentEditableRef.current?.scrollHeight ? contentEditableRef.current.scrollHeight / scale : 100);

        // Check if Alt/Option key is pressed for center scaling
        const scaleFromCenter = e.altKey || e.metaKey;

        setIsResizing(true);
        resizeStartRef.current = {
            x: e.clientX,
            y: e.clientY,
            initialWidth: data.width || 300,
            initialHeight: currentHeight,
            initialX: data.x,
            initialY: data.y,
            handle,
            scaleFromCenter,
        };
    };


    const getFontSize = () => data.fontSize * scale;

    // Theme-aware text color (black in light theme, white in dark theme)
    const [isDark, setIsDark] = useState(false);
    useEffect(() => {
        const checkTheme = () => {
            setIsDark(document.documentElement.classList.contains('dark'));
        };
        checkTheme();
        const observer = new MutationObserver(checkTheme);
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
        return () => observer.disconnect();
    }, []);
    const textColor = isDark ? '#ffffff' : '#000000';

    // Use local position during dragging for smooth movement, otherwise use data position
    const displayX = isDragging ? localX : data.x;
    const displayY = isDragging ? localY : data.y;
    const top = displayY * scale + position.y;
    const left = displayX * scale + position.x;

    return (
        <div
            data-canvas-text={data.id}
            style={{
                position: 'absolute',
                top: `${top}px`,
                left: `${left}px`,
                width: `${(data.width || 300) * scale}px`,
                height: data.height ? `${data.height * scale}px` : 'auto',
                zIndex: isSelected ? 10000 : 1000,
                pointerEvents: 'auto',
                userSelect: 'none',
                WebkitUserSelect: 'none',
                willChange: isResizing ? 'transform' : 'auto',
                cursor: isDragging ? 'grabbing' : 'default',
            }}
            onMouseDown={handleMouseDown}
        >
            {/* Controls when selected */}
            {isSelected && (
                <CanvasTextControls
                    fontSize={data.fontSize}
                    fontWeight={data.fontWeight}
                    fontStyle={data.fontStyle || 'normal'}
                    fontFamily={data.fontFamily || 'Inter, sans-serif'}
                    onFontSizeChange={(v) => onUpdate(data.id, { fontSize: v })}
                    onFontWeightChange={(v) => onUpdate(data.id, { fontWeight: v })}
                    onFontStyleChange={(v) => onUpdate(data.id, { fontStyle: v })}
                    onFontFamilyChange={(v) => onUpdate(data.id, { fontFamily: v })}
                    onMoveStart={(e) => {
                        // Start dragging when move button is clicked
                        e.preventDefault();
                        e.stopPropagation();
                        setIsDragging(true);
                        dragStartRef.current = {
                            x: e.clientX,
                            y: e.clientY,
                            initialX: data.x,
                            initialY: data.y,
                        };
                    }}
                    onDelete={() => onDelete(data.id)}
                    scale={scale}
                />
            )}

            {/* Editable text content */}
            <div
                ref={contentEditableRef}
                contentEditable
                suppressContentEditableWarning
                onInput={(e) => {
                    isTypingRef.current = true;
                    const newText = e.currentTarget.textContent || '';
                    lastTextRef.current = newText;
                    // Debounce text updates during typing to prevent excessive snapshot saves
                    if (newText !== data.text) {
                        pendingUpdateRef.current = { text: newText };
                        if (updateTimeoutRef.current) {
                            clearTimeout(updateTimeoutRef.current);
                        }
                        updateTimeoutRef.current = setTimeout(() => {
                            if (pendingUpdateRef.current) {
                                onUpdate(data.id, pendingUpdateRef.current);
                                pendingUpdateRef.current = null;
                            }
                        }, 500); // Update 500ms after typing stops
                    }
                    adjustHeight();
                    // Reset typing flag after a short delay
                    setTimeout(() => {
                        isTypingRef.current = false;
                    }, 100);
                }}
                onBlur={(e) => {
                    isTypingRef.current = false;
                    adjustHeight();
                    // Restore placeholder if empty
                    if (!e.currentTarget.textContent || e.currentTarget.textContent.trim() === '') {
                        e.currentTarget.textContent = "add text here";
                    }
                    // Flush any pending text updates immediately when blurring
                    if (pendingUpdateRef.current) {
                        onUpdate(data.id, pendingUpdateRef.current);
                        pendingUpdateRef.current = null;
                    }
                    if (updateTimeoutRef.current) {
                        clearTimeout(updateTimeoutRef.current);
                        updateTimeoutRef.current = null;
                    }
                }}
                onMouseDown={(e) => {
                    // Always allow text editing - stop propagation to prevent dragging
                    e.stopPropagation();
                    // Select the text component when clicking inside it
                    onSelect(data.id);
                }}
                onFocus={(e) => {
                    isTypingRef.current = true;
                    // Clear placeholder text when focused
                    if (e.currentTarget.textContent === "add text here") {
                        e.currentTarget.textContent = "";
                    }
                }}
                onKeyDown={(e) => {
                    // Mark as typing on any key press
                    isTypingRef.current = true;
                }}
                style={{
                    width: '100%',
                    fontSize: `${getFontSize()}px`,
                    fontWeight: data.fontWeight,
                    fontStyle: data.fontStyle || 'normal',
                    fontFamily: data.fontFamily || 'Inter, sans-serif',
                    color: (!data.text || data.text === "add text here")
                        ? (isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)')
                        : textColor,
                    lineHeight: '1.4',
                    padding: '8px',
                    whiteSpace: 'pre-wrap',
                    cursor: 'text',
                    border: isSelected ? '1px solid #437eb5' : 'none',
                    background: 'transparent',
                    borderRadius: '4px',
                    minHeight: '24px',
                    outline: 'none',
                    wordWrap: 'break-word',
                    overflowWrap: 'break-word',
                    overflow: 'hidden',
                    boxSizing: 'border-box',
                }}
            >
                {/* Don't set children - let contentEditable manage its own content */}
            </div>

            {/* Resize handles - only show when selected */}
            {isSelected && (
                <>
                    {/* Side handles - box-only resizing (text wraps, no font size change) */}
                    {/* Left handle */}
                    <div
                        className="resize-handle resize-handle-side"
                        style={{
                            position: 'absolute',
                            top: '50%',
                            left: '-6px',
                            transform: 'translateY(-50%)',
                            width: '12px',
                            height: '12px',
                            backgroundColor: '#60a5fa',
                            border: '2px solid #ffffff',
                            borderRadius: '2px',
                            cursor: 'ew-resize',
                            zIndex: 10001,
                            pointerEvents: 'auto',
                            userSelect: 'none',
                            WebkitUserSelect: 'none',
                        }}
                        onMouseDown={(e) => handleResizeStart(e, 'w')}
                        title="Drag to adjust box width (text wraps)"
                    />
                    {/* Right handle */}
                    <div
                        className="resize-handle resize-handle-side"
                        style={{
                            position: 'absolute',
                            top: '50%',
                            right: '-6px',
                            transform: 'translateY(-50%)',
                            width: '12px',
                            height: '12px',
                            backgroundColor: '#60a5fa',
                            border: '2px solid #ffffff',
                            borderRadius: '2px',
                            cursor: 'ew-resize',
                            zIndex: 10001,
                            pointerEvents: 'auto',
                            userSelect: 'none',
                            WebkitUserSelect: 'none',
                        }}
                        onMouseDown={(e) => handleResizeStart(e, 'e')}
                        title="Drag to adjust box width (text wraps)"
                    />
                </>
            )}
        </div>
    );
};
