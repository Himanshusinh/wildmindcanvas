import React, { useState, useRef, useEffect } from 'react';
import { GitCompare, Trash2, X, Check } from 'lucide-react';
import { SELECTION_COLOR } from '@/core/canvas/canvasHelpers';
import { useIsDarkTheme } from '@/core/hooks/useIsDarkTheme';
import { buildProxyResourceUrl } from '@/core/api/proxyUtils';
import { generateImageForCanvas } from '@/core/api/api';
import { useCanvasModalDrag } from '../PluginComponents/useCanvasModalDrag';
import { usePersistedPopupState } from '../PluginComponents';
import { PluginNodeShell } from '../PluginComponents';
import { PluginConnectionNodes } from '../PluginComponents';

interface ComparePluginModalProps {
    id: string;
    x: number;
    y: number;
    width?: number;
    height?: number;
    isOpen: boolean;
    isExpanded?: boolean;
    onClose: () => void;
    onSelect: () => void;
    onDelete: () => void;
    isSelected?: boolean;
    stageRef?: any;
    scale?: number;
    position?: { x: number; y: number };
    onPositionChange: (x: number, y: number) => void;
    onPositionCommit: (x: number, y: number) => void;
    // Persistence props
    // Persistence props
    onUpdateModalState?: (id: string, updates: Partial<any>) => void;
    onPersistImageModalCreate?: (modal: any) => void | Promise<void>;
    onPersistConnectorCreate?: (connector: any) => void | Promise<void>;
    onUpdateImageModalState?: (id: string, updates: any) => void;
    initialPrompt?: string;
    initialModel?: string;
    projectId?: string | null;
    onContextMenu?: (e: React.MouseEvent) => void;
}

export const ComparePluginModal: React.FC<ComparePluginModalProps> = ({
    id,
    x,
    y,
    isOpen,
    isExpanded,
    onSelect,
    onDelete,
    isSelected,
    scale = 1,
    position = { x: 0, y: 0 },
    onPositionChange,
    onPositionCommit,
    // Add new props for state persistence
    onUpdateModalState,
    onPersistImageModalCreate,
    onPersistConnectorCreate,
    onUpdateImageModalState,
    initialPrompt,
    initialModel,
    projectId,
    onContextMenu,
}) => {
    const isDark = useIsDarkTheme();
    const [isHovered, setIsHovered] = useState(false);
    const { isPopupOpen, setIsPopupOpen, togglePopup } = usePersistedPopupState({ isExpanded, id, onUpdateModalState, defaultOpen: false });
    const containerRef = useRef<HTMLDivElement>(null);
    const { onMouseDown: handleMouseDown, onPointerDown: handlePointerDown } = useCanvasModalDrag({
        enabled: isOpen,
        x,
        y,
        scale,
        position,
        containerRef,
        onPositionChange,
        onPositionCommit,
        onSelect,
        onTap: () => togglePopup(),
    });

    // New state for UI
    const [prompt, setPrompt] = useState(initialPrompt || '');
    const [selectedModel, setSelectedModel] = useState(initialModel || 'Google Nano Banana'); // Default model match ImageUploadModal
    const [isGlobalGenerating, setIsGlobalGenerating] = useState(false);

    // Update local state if props change (e.g. from persistence)
    useEffect(() => {
        if (initialPrompt !== undefined) setPrompt(initialPrompt);
        if (initialModel !== undefined) setSelectedModel(initialModel);
    }, [initialPrompt, initialModel]);

    const screenX = x * scale + position.x;
    const screenY = y * scale + position.y;
    // #region agent log - Removed
    // #endregion
    const circleDiameter = 100 * scale;

    // Drag/select handled by shared canvas modal hook

    const handlePromptChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;
        setPrompt(newValue);
        if (onUpdateModalState) {
            onUpdateModalState(id, { prompt: newValue });
        }
    };

    const ALL_MODELS = [
        'Google Nano Banana',
        'Google nano banana pro',
        'Flux 2 pro',
        'Seedream v4',
        'Imagen 4 Ultra',
        'Imagen 4',
        'Imagen 4 Fast',
        'Flux Kontext Max',
        'Flux Kontext Pro',
        'Flux Pro 1.1 Ultra',
        'Flux Pro 1.1',
        'Seedream v4 4K',
        'Runway Gen4 Image',
        'Runway Gen4 Image Turbo',
        'Z Image Turbo',
        'P-Image'
    ];

    // Helper to map display names to backend IDs
    const getModelId = (displayName: string) => {
        const lower = displayName.toLowerCase();

        // Known mappings
        if (displayName === 'Runway Gen4 Image Turbo') return 'runway-gen4-turbo';
        if (displayName === 'Runway Gen4 Image') return 'runway-gen4-image';

        // Z Image Turbo and P-Image - map to their canonical names (backend handles these)
        if (lower.includes('z image turbo') || lower.includes('z-image-turbo')) {
            return 'Z Image Turbo';
        }
        if (lower.includes('p-image') && !lower.includes('p-image-edit')) {
            return 'P-Image';
        }

        // Match ImageModalControls behavior: append default resolution (2K) for models that require it
        // This ensures backend receives the expected format (e.g. "Flux 2 Pro 2K")
        if (lower.includes('flux 2 pro')) return `${displayName} 2K`;
        if (lower.includes('flux pro 1.1')) return `${displayName} 2K`;
        if (lower.includes('seedream') && !lower.includes('4k')) return `${displayName} 2K`; // Seedream v4 requires resolution? ImageModalControls appends it.
        if (lower.includes('imagen')) return `${displayName} 2K`;
        if (lower.includes('google nano banana pro')) return `${displayName} 2K`;

        // Backend likely handles others (Google Nano Banana, etc.) via its own mapping
        return displayName;
    };

    const handleCompare = async () => {
        if (!prompt || !selectedModel || !projectId || !onPersistImageModalCreate) return;

        const models = selectedModel.split(',').filter(Boolean);
        if (models.length === 0) return;

        setIsGlobalGenerating(true);
        // Close popup after starting generation to clear the canvas view
        setIsPopupOpen(false);

        // Calculate positions for new nodes relative to current node
        const startX = x + 300; // Right of the compare node
        const spacingY = 650; // Spacing between nodes
        const startY = y;

        try {
            console.log('[ComparePlugin] Starting parallel generation for models:', models);

            // 1. Prepare and Spawn All Nodes & Connections first
            // We do this sequentially or in parallel, but we want them to appear immediately
            const processingTasks = models.map(async (model, i) => {
                // Determine layout position
                const offsetY = (i - (models.length - 1) / 2) * spacingY;
                const targetX = startX;
                const targetY = startY + offsetY;
                const newModalId = `image-compare-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

                // Create the Node Payload
                const newModal = {
                    id: newModalId,
                    x: targetX,
                    y: targetY,
                    generatedImageUrl: null as string | null,
                    frameWidth: 600,
                    frameHeight: 600,
                    model: model,
                    frame: 'Compare', // Custom frame type for compare results
                    aspectRatio: '1:1',
                    prompt: prompt,
                    isGenerating: true, // Show loading state immediately
                    imageCount: 1,
                };

                // Create Node
                await onPersistImageModalCreate!(newModal);

                // Create Connection
                if (onPersistConnectorCreate) {
                    const newConnector = {
                        from: id,
                        to: newModalId,
                        color: SELECTION_COLOR,
                        fromX: x + 100, // Right edge of circular node approx
                        fromY: y + 50, // Center Y
                        toX: targetX,
                        toY: targetY + 300, // Center Y of 600px height frame
                        fromAnchor: 'send',
                        toAnchor: 'receive',
                    };
                    await onPersistConnectorCreate(newConnector);
                }

                return { newModalId, model };
            });

            // Wait for all nodes to be created visually
            const nodes = await Promise.all(processingTasks);

            // 2. Trigger All Image Generations in Parallel
            const generationPromises = nodes.map(async ({ newModalId, model }) => {
                const modelId = getModelId(model);
                try {
                    console.log(`[ComparePlugin] Generating for model: ${model}`);
                    const result = await generateImageForCanvas(
                        prompt,
                        modelId,
                        '1:1',
                        projectId,
                        1024,
                        1024,
                        1,
                        undefined
                    );

                    const url = result?.images?.[0]?.url || result?.url;

                    if (url && onUpdateImageModalState) {
                        onUpdateImageModalState(newModalId, {
                            generatedImageUrl: url,
                            isGenerating: false,
                            model: model
                        });
                    } else if (onUpdateImageModalState) {
                        onUpdateImageModalState(newModalId, {
                            isGenerating: false,
                            generatedImageUrl: null,
                            frame: 'Compare',
                        });
                    }
                } catch (error) {
                    console.error(`Failed to generate for model ${model}:`, error);
                    if (onUpdateImageModalState) {
                        onUpdateImageModalState(newModalId, {
                            isGenerating: false,
                            frame: 'Compare'
                        });
                    }
                }
            });

            // Wait for all generations to finish
            await Promise.all(generationPromises);

        } catch (error) {
            console.error('Error during comparison generation:', error);
        } finally {
            setIsGlobalGenerating(false);
        }
    };

    // Correction: I need to add onUpdateImageModalState to props.
    // I'll assume the user will inject `onUpdateImageModalState` because I added it to `CompareModalOverlays` in step 2.
    // I need to add it to the interface and destructuring here.

    // Compact Popover UI
    const controlsWidthStr = `${500 * scale}px`; // Widened to 500
    const basePadding = 16 * scale;
    const overlapRatio = 0.3;
    const popupOverlap = Math.max(0, (circleDiameter * overlapRatio) - (8 * scale));
    const frameBorderColor = isDark ? '#3a3a3a' : '#a0a0a0';
    const frameBorderWidth = 1.5;

    if (!isOpen) return null;

    return (
        <PluginNodeShell
            modalKey="compare"
            id={id}
            containerRef={containerRef as any}
            screenX={screenX}
            screenY={screenY}
            isHovered={isHovered}
            isSelected={Boolean(isSelected)}
            onMouseDown={handleMouseDown}
            onPointerDown={handlePointerDown}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onContextMenu={onContextMenu}
            className="flex flex-col items-center"
            style={{
                zIndex: isSelected || isPopupOpen ? 100 : 10,
                pointerEvents: 'none',
            }}
        >
            {/* Plugin Node (Clickable) */}
            <div
                onMouseDown={handleMouseDown}
                onPointerDown={handlePointerDown}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                style={{
                    position: 'relative',
                    pointerEvents: 'auto', // Re-enable pointer events for the node
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    zIndex: 20,
                }}
            >
                {/* Label */}
                <div
                    style={{
                        marginBottom: `${8 * scale}px`,
                        fontSize: `${12 * scale}px`,
                        fontWeight: 500,
                        color: isDark ? '#ffffff' : '#1a1a1a',
                        textAlign: 'center',
                        userSelect: 'none',
                        transition: 'color 0.3s ease',
                        letterSpacing: '0.2px',
                    }}
                >
                    Compare
                </div>

                {/* Circular Node */}
                <div
                    style={{
                        width: `${circleDiameter}px`,
                        height: `${circleDiameter}px`,
                        backgroundColor: isDark ? '#2d2d2d' : '#e5e5e5',
                        borderRadius: '50%',
                        border: `${1.5 * scale}px solid ${isSelected ? SELECTION_COLOR : (isDark ? '#3a3a3a' : '#a0a0a0')}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'background-color 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease',
                        boxShadow: isDark
                            ? (isHovered || isSelected ? `0 ${2 * scale}px ${8 * scale}px rgba(0, 0, 0, 0.5)` : `0 ${1 * scale}px ${3 * scale}px rgba(0, 0, 0, 0.3)`)
                            : (isHovered || isSelected ? `0 ${2 * scale}px ${8 * scale}px rgba(0, 0, 0, 0.2)` : `0 ${1 * scale}px ${3 * scale}px rgba(0, 0, 0, 0.1)`),
                        transform: (isHovered || isSelected) ? `scale(1.03)` : 'scale(1)',
                        position: 'relative', // Ensure relative positioning for absolute children
                    }}
                >
                    <GitCompare
                        size={40 * scale}
                        color={isDark ? '#ffffff' : '#000000'}
                        strokeWidth={1.5}
                    />

                    {/* Add Connection Nodes for visual anchors */}
                    <PluginConnectionNodes
                        id={id}
                        scale={scale}
                        isHovered={isHovered}
                        isSelected={isSelected || false}
                    />
                </div>
            </div>

            {/* Popover Content (Rendered below) */}
            {isPopupOpen && (
                <div
                    style={{
                        position: 'absolute',
                        top: '100%',
                        // Position the origin of the popover relative to the node.
                        // Overlap logic: Node is diameter 100*scale. 
                        // Overlap is ~22*scale. Spacing ~20*scale.
                        // Total offset up: ~42 * scale.
                        marginTop: `${-42 * scale}px`,

                        // Internal fixed dimensions, scaled visually
                        width: '500px',
                        transform: `scale(${scale})`,
                        transformOrigin: 'top center',

                        backgroundColor: isDark ? 'rgba(18, 18, 18, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                        backdropFilter: 'blur(20px)',
                        WebkitBackdropFilter: 'blur(20px)',
                        borderRadius: '16px',
                        border: `1.5px solid ${frameBorderColor}`,
                        boxShadow: isDark ? '0 8px 32px rgba(0, 0, 0, 0.6)' : '0 8px 32px rgba(0, 0, 0, 0.3)',

                        // Padding: Top includes overlap (22px) + base (16px) = 38px
                        padding: '16px',
                        paddingTop: '38px',

                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px',
                        zIndex: 15,
                        pointerEvents: 'auto',
                        maxHeight: '80vh',
                        overflowY: 'auto',
                    }}
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Main Controls Container - No Header */}
                    <div className="flex flex-col gap-3">
                        {/* Prompt Input & Compare Button Group */}
                        <div className="flex gap-2 items-center w-full">
                            <input
                                type="text"
                                value={prompt}
                                onChange={handlePromptChange}
                                placeholder="Describe comparison..."
                                className={`flex-1 px-3 py-2 rounded-[8px] text-xs border focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-colors ${isDark
                                    ? 'bg-zinc-800 border-zinc-700 text-white placeholder-zinc-500 hover:border-zinc-600'
                                    : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400 hover:border-gray-300'
                                    }`}
                                style={{ height: '36px' }}
                            />
                            {/* Run Button - Matches UpscaleButton style (Rounded Rectangle) */}
                            <button
                                onClick={handleCompare}
                                disabled={isGlobalGenerating || !prompt || !selectedModel}
                                className={`flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${isDark
                                    ? 'bg-[#4C83FF] hover:bg-[#3d6edb] text-white shadow-blue-900/20'
                                    : 'bg-[#4C83FF] hover:bg-[#3d6edb] text-white shadow-blue-500/20'
                                    }`}
                                style={{
                                    width: '36px',
                                    height: '36px',
                                    padding: '0 12px',
                                    borderRadius: '8px',
                                }}
                                title="Run Comparison"
                            >
                                {isGlobalGenerating ? (
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M5 12h14" />
                                        <path d="m12 5 7 7-7 7" />
                                    </svg>
                                )}
                            </button>
                        </div>

                        {/* Model Multi-Select (Compact & Scrollable) */}
                        <div className="flex flex-col gap-1.5">
                            <div className="flex items-center justify-between">
                                <label className={`text-[10px] uppercase tracking-wider font-bold ${isDark ? 'text-zinc-500' : 'text-gray-400'}`}>Active Models</label>
                                <span className={`text-[9px] ${isDark ? 'text-zinc-600' : 'text-gray-400'}`}>{selectedModel.split(',').filter(Boolean).length} selected</span>
                            </div>

                            {/* Increased max-height to show all models, smaller chips */}
                            <div className="flex flex-wrap gap-1.5 max-h-[300px] overflow-y-auto custom-scrollbar content-start">
                                {ALL_MODELS.map(model => {
                                    const currentModels = selectedModel.split(',').filter(Boolean);
                                    const isSel = currentModels.includes(model);
                                    return (
                                        <button
                                            key={model}
                                            onClick={() => {
                                                let newModels;
                                                if (isSel) newModels = currentModels.filter(m => m !== model);
                                                else newModels = [...currentModels, model];
                                                const newValue = newModels.join(',');
                                                setSelectedModel(newValue);
                                                if (onUpdateModalState) onUpdateModalState(id, { model: newValue });
                                            }}
                                            className={`px-2 py-1 rounded-full text-[9px] font-medium transition-colors flex items-center gap-1 border hover:scale-105 active:scale-95 ${isSel
                                                ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                                                : isDark
                                                    ? 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-zinc-300'
                                                    : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:text-gray-800'
                                                }`}
                                        >
                                            {model.replace('Google ', '').replace('Image ', '')}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                    {/* No Results Grid */}
                </div>
            )}
        </PluginNodeShell>
    );
};
