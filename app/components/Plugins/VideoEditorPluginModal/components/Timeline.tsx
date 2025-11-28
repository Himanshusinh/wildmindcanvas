import React, { useRef, useEffect, useState } from 'react';
import {
    Play, Pause, SkipBack, SkipForward, ZoomIn, ZoomOut,
    Split, Trash2, Copy, Lock, Layers, MoreHorizontal,
    ChevronRight, GripVertical, Clock, Scissors
} from 'lucide-react';
import { TimelineItem, Track } from '../types';

interface TimelineProps {
    tracks: Track[];
    currentTime: number;
    duration: number;
    isPlaying: boolean;
    onSeek: (time: number) => void;
    onTogglePlay: () => void;
    onUpdateClip: (trackId: string, item: TimelineItem) => void;
    onSelectClip: (trackId: string, itemId: string | null) => void;
    selectedItemId: string | null;
    scalePercent: number; // Pixels per second
    setScalePercent: (scale: number) => void;
    onSplitClip: () => void;
    onDeleteClip: (trackId: string, itemId: string) => void;
    onDuplicate: (trackId: string, itemId: string) => void;
    onLock: (trackId: string, itemId: string) => void;
    onDetach: (trackId: string, itemId: string) => void;
    onAddTransition: (trackId: string, itemId: string) => void;
}

const Timeline: React.FC<TimelineProps> = ({
    tracks, currentTime, duration, isPlaying, onSeek, onTogglePlay,
    onUpdateClip, onSelectClip, selectedItemId, scalePercent, setScalePercent,
    onSplitClip, onDeleteClip, onDuplicate, onLock, onDetach, onAddTransition
}) => {
    const timelineRef = useRef<HTMLDivElement>(null);
    const [isDraggingHeader, setIsDraggingHeader] = useState(false);
    const [draggingItemId, setDraggingItemId] = useState<string | null>(null);
    const [dragStartX, setDragStartX] = useState(0);
    const [dragOriginalStart, setDragOriginalStart] = useState(0);
    const [resizingItemId, setResizingItemId] = useState<string | null>(null);
    const [resizeEdge, setResizeEdge] = useState<'start' | 'end' | null>(null);
    const [contextMenu, setContextMenu] = useState<{ x: number, y: number, trackId: string, itemId: string } | null>(null);

    // Close context menu on click outside
    useEffect(() => {
        const handleClick = () => setContextMenu(null);
        document.addEventListener('click', handleClick);
        return () => document.removeEventListener('click', handleClick);
    }, []);

    // Handle timeline scrolling to keep playhead in view during playback
    useEffect(() => {
        if (isPlaying && timelineRef.current) {
            const playheadPos = currentTime * scalePercent;
            const scrollLeft = timelineRef.current.scrollLeft;
            const width = timelineRef.current.clientWidth;

            if (playheadPos > scrollLeft + width * 0.8) {
                timelineRef.current.scrollLeft = playheadPos - width * 0.2;
            }
        }
    }, [currentTime, isPlaying, scalePercent]);

    const handleTimelineClick = (e: React.MouseEvent) => {
        if (timelineRef.current) {
            const rect = timelineRef.current.getBoundingClientRect();
            const x = e.clientX - rect.left + timelineRef.current.scrollLeft;
            const time = Math.max(0, x / scalePercent);
            onSeek(time);
        }
    };

    const handleHeaderDragStart = (e: React.MouseEvent) => {
        setIsDraggingHeader(true);
        handleTimelineClick(e);
    };

    const handleHeaderDragMove = (e: MouseEvent) => {
        if (isDraggingHeader && timelineRef.current) {
            const rect = timelineRef.current.getBoundingClientRect();
            const x = e.clientX - rect.left + timelineRef.current.scrollLeft;
            const time = Math.max(0, x / scalePercent);
            onSeek(time);
        }
    };

    const handleHeaderDragEnd = () => {
        setIsDraggingHeader(false);
    };

    useEffect(() => {
        if (isDraggingHeader) {
            window.addEventListener('mousemove', handleHeaderDragMove);
            window.addEventListener('mouseup', handleHeaderDragEnd);
            return () => {
                window.removeEventListener('mousemove', handleHeaderDragMove);
                window.removeEventListener('mouseup', handleHeaderDragEnd);
            };
        }
    }, [isDraggingHeader]);

    // Item Dragging Logic
    const handleItemDragStart = (e: React.MouseEvent, item: TimelineItem) => {
        e.stopPropagation();
        if (item.isLocked) return;
        setDraggingItemId(item.id);
        setDragStartX(e.clientX);
        setDragOriginalStart(item.start);
        onSelectClip(item.trackId, item.id);
    };

    const handleItemDragMove = (e: MouseEvent) => {
        if (draggingItemId) {
            const deltaX = e.clientX - dragStartX;
            const deltaTime = deltaX / scalePercent;
            const newStart = Math.max(0, dragOriginalStart + deltaTime);

            // Find the item and track
            let foundItem: TimelineItem | undefined;
            let foundTrack: Track | undefined;

            tracks.forEach(t => {
                const i = t.items.find(it => it.id === draggingItemId);
                if (i) {
                    foundItem = i;
                    foundTrack = t;
                }
            });

            if (foundItem && foundTrack) {
                // Simple collision detection (prevent overlap)
                // In a real app, you might want to allow swapping or pushing
                // For now, we just clamp to previous/next items
                const sortedItems = [...foundTrack.items].sort((a, b) => a.start - b.start);
                const currentIndex = sortedItems.findIndex(i => i.id === draggingItemId);

                let minStart = 0;
                let maxStart = Infinity;

                if (currentIndex > 0) {
                    const prev = sortedItems[currentIndex - 1];
                    minStart = prev.start + prev.duration;
                }
                if (currentIndex < sortedItems.length - 1) {
                    const next = sortedItems[currentIndex + 1];
                    maxStart = next.start - foundItem.duration;
                }

                const clampedStart = Math.max(minStart, Math.min(newStart, maxStart));

                if (Math.abs(clampedStart - foundItem.start) > 0.01) {
                    onUpdateClip(foundTrack.id, { ...foundItem, start: clampedStart });
                }
            }
        }
    };

    const handleItemDragEnd = () => {
        setDraggingItemId(null);
    };

    // Item Resizing Logic
    const handleResizeStart = (e: React.MouseEvent, item: TimelineItem, edge: 'start' | 'end') => {
        e.stopPropagation();
        if (item.isLocked) return;
        setResizingItemId(item.id);
        setResizeEdge(edge);
        setDragStartX(e.clientX);
        setDragOriginalStart(edge === 'start' ? item.start : item.duration);
        onSelectClip(item.trackId, item.id);
    };

    const handleResizeMove = (e: MouseEvent) => {
        if (resizingItemId && resizeEdge) {
            const deltaX = e.clientX - dragStartX;
            const deltaTime = deltaX / scalePercent;

            // Find item
            let foundItem: TimelineItem | undefined;
            let foundTrack: Track | undefined;
            tracks.forEach(t => {
                const i = t.items.find(it => it.id === resizingItemId);
                if (i) {
                    foundItem = i;
                    foundTrack = t;
                }
            });

            if (foundItem && foundTrack) {
                const sortedItems = [...foundTrack.items].sort((a, b) => a.start - b.start);
                const currentIndex = sortedItems.findIndex(i => i.id === resizingItemId);

                if (resizeEdge === 'start') {
                    // Changing start time and duration
                    // Max start is current end time (min duration 0.1s)
                    // Min start is previous item end
                    let minStart = 0;
                    if (currentIndex > 0) {
                        const prev = sortedItems[currentIndex - 1];
                        minStart = prev.start + prev.duration;
                    }

                    const maxStart = foundItem.start + foundItem.duration - 0.5; // Min duration 0.5s
                    const newStart = Math.min(maxStart, Math.max(minStart, dragOriginalStart + deltaTime));
                    const newDuration = foundItem.duration + (foundItem.start - newStart);

                    onUpdateClip(foundTrack.id, { ...foundItem, start: newStart, duration: newDuration });

                } else {
                    // Changing duration only
                    // Min duration 0.5s
                    // Max duration limited by next item
                    let maxDuration = Infinity;
                    if (currentIndex < sortedItems.length - 1) {
                        const next = sortedItems[currentIndex + 1];
                        maxDuration = next.start - foundItem.start;
                    }

                    const newDuration = Math.min(maxDuration, Math.max(0.5, dragOriginalStart + deltaTime));
                    onUpdateClip(foundTrack.id, { ...foundItem, duration: newDuration });
                }
            }
        }
    };

    const handleResizeEnd = () => {
        setResizingItemId(null);
        setResizeEdge(null);
    };

    useEffect(() => {
        if (draggingItemId) {
            window.addEventListener('mousemove', handleItemDragMove);
            window.addEventListener('mouseup', handleItemDragEnd);
            return () => {
                window.removeEventListener('mousemove', handleItemDragMove);
                window.removeEventListener('mouseup', handleItemDragEnd);
            };
        }
    }, [draggingItemId]);

    useEffect(() => {
        if (resizingItemId) {
            window.addEventListener('mousemove', handleResizeMove);
            window.addEventListener('mouseup', handleResizeEnd);
            return () => {
                window.removeEventListener('mousemove', handleResizeMove);
                window.removeEventListener('mouseup', handleResizeEnd);
            };
        }
    }, [resizingItemId]);


    const handleContextMenu = (e: React.MouseEvent, trackId: string, itemId: string) => {
        e.preventDefault();
        setContextMenu({ x: e.clientX, y: e.clientY, trackId, itemId });
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        const ms = Math.floor((seconds % 1) * 10);
        return `${mins}:${secs.toString().padStart(2, '0')}.${ms}`;
    };

    const renderRuler = () => {
        const totalWidth = Math.max(duration + 10, 300) * scalePercent; // Ensure min width
        const majorStep = 5; // Seconds
        const minorStep = 1; // Seconds

        const markers = [];
        for (let t = 0; t <= duration + 10; t += minorStep) {
            const isMajor = t % majorStep === 0;
            markers.push(
                <div
                    key={t}
                    className={`absolute bottom-0 border-l border-gray-400 ${isMajor ? 'h-3' : 'h-1.5'}`}
                    style={{ left: t * scalePercent }}
                >
                    {isMajor && (
                        <span className="absolute top-[-14px] left-1 text-[9px] text-gray-500 font-medium">
                            {formatTime(t)}
                        </span>
                    )}
                </div>
            );
        }

        return (
            <div
                className="h-6 bg-gray-50 border-b border-gray-200 relative cursor-pointer select-none sticky top-0 z-20"
                onMouseDown={handleHeaderDragStart}
            >
                {markers}
                {/* Playhead Handle */}
                <div
                    className="absolute top-0 w-3 h-full -ml-1.5 z-30 cursor-ew-resize group"
                    style={{ left: currentTime * scalePercent }}
                >
                    <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-red-500 mx-auto"></div>
                </div>
            </div>
        );
    };

    return (
        <div className="h-full flex flex-col bg-white select-none">
            {/* Timeline Controls */}
            <div className="h-10 border-b border-gray-200 flex items-center justify-between px-4 bg-white z-20 shrink-0">
                <div className="flex items-center gap-2">
                    <button onClick={() => onSeek(0)} className="p-1.5 hover:bg-gray-100 rounded text-gray-600">
                        <SkipBack size={16} />
                    </button>
                    <button onClick={onTogglePlay} className="p-1.5 hover:bg-gray-100 rounded text-gray-800">
                        {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
                    </button>
                    <button onClick={() => onSeek(duration)} className="p-1.5 hover:bg-gray-100 rounded text-gray-600">
                        <SkipForward size={16} />
                    </button>
                    <span className="text-xs font-mono text-gray-500 ml-2">
                        {formatTime(currentTime)} / {formatTime(duration)}
                    </span>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
                        <button onClick={() => setScalePercent(Math.max(10, scalePercent - 10))} className="p-1 hover:bg-white rounded shadow-sm transition-all text-gray-600">
                            <ZoomOut size={14} />
                        </button>
                        <span className="text-[10px] font-medium text-gray-500 w-8 text-center">{Math.round(scalePercent)}%</span>
                        <button onClick={() => setScalePercent(Math.min(200, scalePercent + 10))} className="p-1 hover:bg-white rounded shadow-sm transition-all text-gray-600">
                            <ZoomIn size={14} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Tracks Area */}
            <div className="flex-1 overflow-hidden flex relative">
                {/* Track Headers (Left Sidebar) */}
                <div className="w-40 bg-gray-50 border-r border-gray-200 flex flex-col shrink-0 z-30 shadow-[4px_0_10px_-4px_rgba(0,0,0,0.05)]">
                    <div className="h-6 border-b border-gray-200 bg-gray-50"></div> {/* Ruler spacer */}
                    <div className="flex-1 overflow-y-hidden"> {/* Synced scroll would go here */}
                        {tracks.map((track) => (
                            <div key={track.id} className="h-24 border-b border-gray-200 px-3 flex flex-col justify-center group hover:bg-gray-100 transition-colors relative">
                                <div className="flex items-center gap-2 mb-1">
                                    <div className={`p-1.5 rounded-md ${track.type === 'video' ? 'bg-violet-100 text-violet-600' : track.type === 'audio' ? 'bg-blue-100 text-blue-600' : 'bg-orange-100 text-orange-600'}`}>
                                        {track.type === 'video' && <Layers size={14} />}
                                        {track.type === 'audio' && <Clock size={14} />}
                                        {track.type === 'overlay' && <Layers size={14} />}
                                    </div>
                                    <span className="text-xs font-bold text-gray-700 capitalize">{track.name}</span>
                                </div>
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button className="p-1 hover:bg-gray-200 rounded text-gray-500" title="Mute/Hide">
                                        {/* Icon would toggle */}
                                    </button>
                                    <button className="p-1 hover:bg-gray-200 rounded text-gray-500" title="Lock Track">
                                        <Lock size={12} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Timeline Content */}
                <div className="flex-1 overflow-auto relative custom-scrollbar" ref={timelineRef}>
                    <div style={{ width: Math.max(duration + 10, 300) * scalePercent, minHeight: '100%' }}>
                        {renderRuler()}

                        {/* Playhead Line */}
                        <div
                            className="absolute top-0 bottom-0 w-px bg-red-500 z-10 pointer-events-none"
                            style={{ left: currentTime * scalePercent }}
                        ></div>

                        {/* Tracks */}
                        <div className="relative">
                            {tracks.map((track) => (
                                <div key={track.id} className="h-24 border-b border-gray-100 relative bg-white/50">
                                    {track.items.map((item) => (
                                        <div
                                            key={item.id}
                                            className={`absolute top-2 bottom-2 rounded-lg border overflow-hidden group cursor-pointer transition-shadow
                                                ${selectedItemId === item.id ? 'ring-2 ring-violet-500 ring-offset-1 shadow-md z-10' : 'hover:shadow-sm'}
                                                ${item.isLocked ? 'opacity-75' : ''}
                                            `}
                                            style={{
                                                left: item.start * scalePercent,
                                                width: item.duration * scalePercent,
                                                backgroundColor: item.type === 'video' ? '#f5f3ff' : item.type === 'audio' ? '#eff6ff' : '#fff7ed',
                                                borderColor: item.type === 'video' ? '#ddd6fe' : item.type === 'audio' ? '#bfdbfe' : '#fed7aa',
                                            }}
                                            onMouseDown={(e) => handleItemDragStart(e, item)}
                                            onContextMenu={(e) => handleContextMenu(e, track.id, item.id)}
                                        >
                                            {/* Clip Content Preview */}
                                            <div className="w-full h-full flex items-center px-2 gap-2 overflow-hidden">
                                                {item.type === 'video' || item.type === 'image' ? (
                                                    <>
                                                        {/* Thumbnails strip - simplified */}
                                                        <div className="absolute inset-0 flex opacity-20 pointer-events-none">
                                                            {Array.from({ length: Math.ceil(item.duration) }).map((_, i) => (
                                                                <div key={i} className="flex-1 border-r border-gray-400/20 bg-cover bg-center" style={{ backgroundImage: `url(${item.thumbnail || item.src})` }}></div>
                                                            ))}
                                                        </div>
                                                        <div className="relative z-10 flex items-center gap-2">
                                                            <div className="w-8 h-8 rounded bg-gray-200 shrink-0 bg-cover bg-center border border-black/10" style={{ backgroundImage: `url(${item.thumbnail || item.src})` }}></div>
                                                            <span className="text-[10px] font-bold text-gray-700 truncate">{item.name}</span>
                                                        </div>
                                                    </>
                                                ) : item.type === 'text' ? (
                                                    <div className="w-full h-full flex items-center justify-center bg-orange-50/50">
                                                        <span className="text-xs font-bold text-orange-800 truncate px-2" style={{ fontFamily: item.fontFamily }}>{item.name}</span>
                                                    </div>
                                                ) : (
                                                    <div className="w-full h-full flex items-center gap-2">
                                                        <div className="w-full h-8 bg-blue-200/50 rounded flex items-center justify-center overflow-hidden">
                                                            {/* Waveform visualization placeholder */}
                                                            <div className="flex items-end gap-0.5 h-4 opacity-50">
                                                                {Array.from({ length: 20 }).map((_, i) => (
                                                                    <div key={i} className="w-1 bg-blue-500" style={{ height: `${Math.random() * 100}%` }}></div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Resize Handles */}
                                            {!item.isLocked && selectedItemId === item.id && (
                                                <>
                                                    <div
                                                        className="absolute top-0 bottom-0 left-0 w-3 cursor-w-resize hover:bg-black/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20"
                                                        onMouseDown={(e) => handleResizeStart(e, item, 'start')}
                                                    >
                                                        <GripVertical size={10} className="text-gray-500" />
                                                    </div>
                                                    <div
                                                        className="absolute top-0 bottom-0 right-0 w-3 cursor-e-resize hover:bg-black/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20"
                                                        onMouseDown={(e) => handleResizeStart(e, item, 'end')}
                                                    >
                                                        <GripVertical size={10} className="text-gray-500" />
                                                    </div>
                                                </>
                                            )}

                                            {/* Transition Indicators */}
                                            {item.transition && item.transition.type !== 'none' && (
                                                <div className="absolute top-0 bottom-0 right-0 bg-violet-500/20 border-l border-violet-500 flex items-center justify-center" style={{ width: item.transition.duration * scalePercent }}>
                                                    <div className="w-4 h-4 bg-white rounded-full shadow-sm flex items-center justify-center">
                                                        <ChevronRight size={10} className="text-violet-600" />
                                                    </div>
                                                </div>
                                            )}

                                            {item.isLocked && (
                                                <div className="absolute top-1 right-1 bg-black/50 p-0.5 rounded text-white">
                                                    <Lock size={8} />
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Context Menu */}
            {contextMenu && (
                <div
                    className="fixed bg-white rounded-lg shadow-xl border border-gray-100 py-1 z-50 min-w-[160px] animate-in fade-in zoom-in-95 duration-100"
                    style={{ top: contextMenu.y, left: contextMenu.x }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <button onClick={() => { onDuplicate(contextMenu.trackId, contextMenu.itemId); setContextMenu(null); }} className="w-full text-left px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                        <Copy size={14} /> Duplicate
                    </button>
                    <button onClick={() => { onSplitClip(); setContextMenu(null); }} className="w-full text-left px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                        <Scissors size={14} /> Split at Playhead
                    </button>
                    <button onClick={() => { onAddTransition(contextMenu.trackId, contextMenu.itemId); setContextMenu(null); }} className="w-full text-left px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                        <ChevronRight size={14} /> Add Transition
                    </button>
                    <div className="h-px bg-gray-100 my-1"></div>
                    <button onClick={() => { onLock(contextMenu.trackId, contextMenu.itemId); setContextMenu(null); }} className="w-full text-left px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                        <Lock size={14} /> Lock/Unlock
                    </button>
                    <button onClick={() => { onDetach(contextMenu.trackId, contextMenu.itemId); setContextMenu(null); }} className="w-full text-left px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                        <Layers size={14} /> Detach Audio
                    </button>
                    <div className="h-px bg-gray-100 my-1"></div>
                    <button onClick={() => { onDeleteClip(contextMenu.trackId, contextMenu.itemId); setContextMenu(null); }} className="w-full text-left px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 flex items-center gap-2">
                        <Trash2 size={14} /> Delete
                    </button>
                </div>
            )}
        </div>
    );
};

export default Timeline;
