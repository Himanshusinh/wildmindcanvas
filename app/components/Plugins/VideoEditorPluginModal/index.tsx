import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import ResourcePanel from './components/ResourcePanel';
import Canvas from './components/Canvas';
import Timeline from './components/Timeline';
import RightSidebar from './components/RightSidebar';
import EditPanel from './components/EditPanel';
import TransitionPanel from './components/TransitionPanel';
import ProjectDrawer from './components/ProjectDrawer';
import { TimelineItem, Track, Transition, CanvasDimension, RESIZE_OPTIONS } from './types';

interface VideoEditorPluginModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const VideoEditorPluginModal: React.FC<VideoEditorPluginModalProps> = ({ isOpen, onClose }) => {
    // --- STATE ---
    const [activeTab, setActiveTab] = useState<'tools' | 'text' | 'images' | 'videos' | 'audio' | 'uploads' | 'projects'>('videos');
    const [tracks, setTracks] = useState<Track[]>([
        { id: 't1', type: 'video', name: 'Video Track', items: [] },
        { id: 't2', type: 'audio', name: 'Audio Track', items: [] },
        { id: 't3', type: 'overlay', name: 'Overlay Track', items: [] },
    ]);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(30); // Default 30s
    const [isPlaying, setIsPlaying] = useState(false);
    const [scalePercent, setScalePercent] = useState(50); // Timeline zoom
    const [canvasDimension, setCanvasDimension] = useState<CanvasDimension>(RESIZE_OPTIONS[0]); // Instagram Story default

    // Selection & Panels
    const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
    const [isEditPanelOpen, setIsEditPanelOpen] = useState(false);
    const [editPanelView, setEditPanelView] = useState<'main' | 'adjust' | 'eraser' | 'color' | 'animate' | 'text-effects' | 'font'>('main');
    const [isTransitionPanelOpen, setIsTransitionPanelOpen] = useState(false);
    const [isProjectDrawerOpen, setIsProjectDrawerOpen] = useState(false);
    const [interactionMode, setInteractionMode] = useState<'none' | 'crop' | 'erase'>('none');
    const [eraserSettings, setEraserSettings] = useState({ size: 20, type: 'erase' as 'erase' | 'restore', showOriginal: false });

    // Previews
    const [previewTransition, setPreviewTransition] = useState<Transition | null>(null);
    const [previewTargetId, setPreviewTargetId] = useState<string | null>(null);

    // --- PLAYBACK LOOP ---
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isPlaying) {
            interval = setInterval(() => {
                setCurrentTime(prev => {
                    if (prev >= duration) {
                        setIsPlaying(false);
                        return 0;
                    }
                    return prev + 0.1; // 100ms update
                });
            }, 100);
        }
        return () => clearInterval(interval);
    }, [isPlaying, duration]);

    // --- ACTIONS ---

    const handleAddItem = (item: Omit<TimelineItem, 'start' | 'id' | 'trackId'>) => {
        const newItem: TimelineItem = {
            ...item,
            id: Math.random().toString(36).substr(2, 9),
            start: currentTime,
            trackId: '', // Assigned below
            offset: 0,
            layer: 0
        };

        let targetTrackId = '';
        if (item.type === 'video') targetTrackId = tracks.find(t => t.type === 'video')?.id || '';
        else if (item.type === 'audio') targetTrackId = tracks.find(t => t.type === 'audio')?.id || '';
        else targetTrackId = tracks.find(t => t.type === 'overlay')?.id || '';

        if (targetTrackId) {
            setTracks(prev => prev.map(t => {
                if (t.id === targetTrackId) {
                    // Simple collision avoidance: place after last item if overlapping
                    // For now, just append or place at currentTime
                    // In a real app, you'd check for overlaps
                    return { ...t, items: [...t.items, { ...newItem, trackId: targetTrackId }] };
                }
                return t;
            }));
            setSelectedItemId(newItem.id);
        }
    };

    const handleUpdateClip = (trackId: string, updatedItem: TimelineItem) => {
        setTracks(prev => prev.map(t => {
            if (t.id === trackId) {
                return { ...t, items: t.items.map(i => i.id === updatedItem.id ? updatedItem : i) };
            }
            return t;
        }));
    };

    const handleDeleteClip = (trackId: string, itemId: string) => {
        setTracks(prev => prev.map(t => {
            if (t.id === trackId) {
                return { ...t, items: t.items.filter(i => i.id !== itemId) };
            }
            return t;
        }));
        if (selectedItemId === itemId) {
            setSelectedItemId(null);
            setIsEditPanelOpen(false);
        }
    };

    const handleSplitClip = () => {
        if (!selectedItemId) return;
        // Find item
        let item: TimelineItem | undefined;
        let track: Track | undefined;
        tracks.forEach(t => {
            const i = t.items.find(it => it.id === selectedItemId);
            if (i) { item = i; track = t; }
        });

        if (item && track && currentTime > item.start && currentTime < item.start + item.duration) {
            const splitPoint = currentTime - item.start;
            const firstPartDuration = splitPoint;
            const secondPartDuration = item.duration - splitPoint;

            const firstPart = { ...item, duration: firstPartDuration };
            const secondPart = {
                ...item,
                id: Math.random().toString(36).substr(2, 9),
                start: currentTime,
                duration: secondPartDuration,
                offset: (item.offset || 0) + splitPoint
            };

            setTracks(prev => prev.map(t => {
                if (t.id === track?.id) {
                    return {
                        ...t,
                        items: t.items.map(i => i.id === item?.id ? firstPart : i).concat(secondPart)
                    };
                }
                return t;
            }));
            setSelectedItemId(secondPart.id);
        }
    };

    const handleDuplicate = (trackId: string, itemId: string) => {
        const track = tracks.find(t => t.id === trackId);
        const item = track?.items.find(i => i.id === itemId);
        if (item && track) {
            const newItem = {
                ...item,
                id: Math.random().toString(36).substr(2, 9),
                start: item.start + item.duration, // Place after
            };
            setTracks(prev => prev.map(t => {
                if (t.id === trackId) {
                    return { ...t, items: [...t.items, newItem] };
                }
                return t;
            }));
        }
    };

    const handleLock = (trackId: string, itemId: string) => {
        setTracks(prev => prev.map(t => {
            if (t.id === trackId) {
                return { ...t, items: t.items.map(i => i.id === itemId ? { ...i, isLocked: !i.isLocked } : i) };
            }
            return t;
        }));
    };

    const handleDetach = (trackId: string, itemId: string) => {
        // Detach audio from video
        const track = tracks.find(t => t.id === trackId);
        const item = track?.items.find(i => i.id === itemId);
        if (item && item.type === 'video') {
            const audioItem: TimelineItem = {
                ...item,
                id: Math.random().toString(36).substr(2, 9),
                type: 'audio',
                trackId: tracks.find(t => t.type === 'audio')?.id || '',
                name: `Audio - ${item.name}`,
                layer: 0
            };

            // Add to audio track
            const audioTrackId = tracks.find(t => t.type === 'audio')?.id;
            if (audioTrackId) {
                setTracks(prev => prev.map(t => {
                    if (t.id === audioTrackId) {
                        return { ...t, items: [...t.items, audioItem] };
                    }
                    return t;
                }));
            }
        }
    };

    const handleAddTransition = (trackId: string, itemId: string) => {
        setSelectedItemId(itemId);
        setIsTransitionPanelOpen(true);
    };

    const handleApplyTransition = (transition: Transition) => {
        if (selectedItemId) {
            setTracks(prev => prev.map(t => {
                return {
                    ...t,
                    items: t.items.map(i => i.id === selectedItemId ? { ...i, transition } : i)
                };
            }));
        }
    };

    const handleApplyTransitionToAll = (transition: Transition) => {
        setTracks(prev => prev.map(t => {
            if (t.type === 'video' || t.type === 'overlay') { // Apply to visual tracks
                return {
                    ...t,
                    items: t.items.map(i => ({ ...i, transition }))
                };
            }
            return t;
        }));
    };

    const handleOpenEditPanel = (view: 'main' | 'adjust' | 'eraser' | 'color' | 'animate' | 'text-effects' | 'font' = 'main') => {
        setEditPanelView(view);
        setIsEditPanelOpen(true);
        setIsTransitionPanelOpen(false);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm" style={{ zIndex: 20000 }}>
            <div className="bg-white w-[95vw] h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden relative" style={{ zIndex: 20001 }}>

                {/* HEADER */}
                <Header
                    projectName="Untitled Project"
                    setProjectName={() => { }}
                    onSave={() => { }}
                    onUndo={() => { }}
                    onRedo={() => { }}
                    canUndo={false}
                    canRedo={false}
                    scalePercent={scalePercent / 100}
                    setScalePercent={(s) => setScalePercent(s * 100)}
                    dimension={canvasDimension}
                    setDimension={setCanvasDimension}
                    onLoad={() => { }}
                    onNew={() => { }}
                    onExport={() => { }}
                />

                <div className="flex-1 flex overflow-hidden relative">
                    {/* LEFT SIDEBARS */}
                    <Sidebar activeTab={activeTab} setActiveTab={(t) => setActiveTab(t as any)} />
                    <ResourcePanel
                        activeTab={activeTab}
                        onAddItem={handleAddItem}
                    />

                    {/* MAIN CANVAS AREA */}
                    <div className="flex-1 flex flex-col relative bg-gray-100">
                        <div className="flex-1 flex items-center justify-center overflow-hidden p-8 relative" onClick={() => { setSelectedItemId(null); setIsEditPanelOpen(false); setIsTransitionPanelOpen(false); }}>
                            <Canvas
                                dimension={canvasDimension}
                                tracks={tracks}
                                currentTime={currentTime}
                                isPlaying={isPlaying}
                                selectedItemId={selectedItemId}
                                interactionMode={interactionMode}
                                setInteractionMode={setInteractionMode}
                                eraserSettings={eraserSettings}
                                onSelectClip={(tid: string, iid: string | null) => { setSelectedItemId(iid); if (iid) setIsEditPanelOpen(true); }}
                                onUpdateClip={handleUpdateClip}
                                onDeleteClip={handleDeleteClip}
                                onSplitClip={handleSplitClip}
                                onOpenEditPanel={handleOpenEditPanel}
                                onOpenColorPanel={() => handleOpenEditPanel('color')}
                                onCopy={() => { }}
                                onPaste={() => { }}
                                onDuplicate={handleDuplicate}
                                onLock={handleLock}
                                onDetach={handleDetach}
                                onAlign={() => { }}
                                scalePercent={scalePercent}
                                setScalePercent={setScalePercent}
                                previewTransition={previewTransition}
                                previewTargetId={previewTargetId}
                            />

                            {/* Floating Right Sidebar for Quick Actions */}
                            {selectedItemId && (
                                <RightSidebar
                                    selectedItemId={selectedItemId}
                                    tracks={tracks}
                                    onUpdate={(item) => handleUpdateClip(item.trackId, item)}
                                    onDelete={handleDeleteClip}
                                    onDuplicate={handleDuplicate}
                                    onLock={handleLock}
                                    onDetach={handleDetach}
                                    onSplit={handleSplitClip}
                                    onOpenEditPanel={handleOpenEditPanel}
                                    setInteractionMode={setInteractionMode}
                                />
                            )}
                        </div>

                        {/* TIMELINE */}
                        <div className="h-72 border-t border-gray-200 bg-white shrink-0">
                            <Timeline
                                tracks={tracks}
                                currentTime={currentTime}
                                duration={duration}
                                isPlaying={isPlaying}
                                onSeek={setCurrentTime}
                                onTogglePlay={() => setIsPlaying(!isPlaying)}
                                onUpdateClip={handleUpdateClip}
                                onSelectClip={(tid, iid) => { setSelectedItemId(iid); if (iid) setIsEditPanelOpen(true); }}
                                selectedItemId={selectedItemId}
                                scalePercent={scalePercent}
                                setScalePercent={setScalePercent}
                                onSplitClip={handleSplitClip}
                                onDeleteClip={handleDeleteClip}
                                onDuplicate={handleDuplicate}
                                onLock={handleLock}
                                onDetach={handleDetach}
                                onAddTransition={handleAddTransition}
                            />
                        </div>
                    </div>

                    {/* RIGHT PANELS */}
                    <EditPanel
                        isOpen={isEditPanelOpen}
                        onClose={() => setIsEditPanelOpen(false)}
                        selectedItemId={selectedItemId}
                        tracks={tracks}
                        onUpdate={(item: TimelineItem) => handleUpdateClip(item.trackId, item)}
                        setInteractionMode={setInteractionMode}
                        eraserSettings={eraserSettings}
                        setEraserSettings={setEraserSettings}
                    />

                    <TransitionPanel
                        isOpen={isTransitionPanelOpen}
                        onClose={() => setIsTransitionPanelOpen(false)}
                        onSelect={handleApplyTransition}
                        onApplyToAll={handleApplyTransitionToAll}
                        selectedTransition={tracks.flatMap(t => t.items).find(i => i.id === selectedItemId)?.transition}
                        onPreview={(t) => { setPreviewTransition(t); setPreviewTargetId(selectedItemId); }}
                    />

                    {/* PROJECT DRAWER OVERLAY */}
                    <ProjectDrawer
                        isOpen={isProjectDrawerOpen}
                        onClose={() => setIsProjectDrawerOpen(false)}
                    />

                </div>

                {/* Close Modal Button (Top Right) */}
                <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-white rounded-full shadow-md hover:bg-gray-100 z-50">
                    <X size={20} className="text-gray-600" />
                </button>
            </div>
        </div>
    );
};

export default VideoEditorPluginModal;
