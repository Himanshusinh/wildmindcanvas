import React from 'react';
import {
    PlayCircle, Eraser, Crop, FlipHorizontal,
    Type, AlignLeft, AlignCenter, AlignRight, Bold, Italic, Underline,
    Lock, Copy, Trash2, Split, Layers, MoreHorizontal
} from 'lucide-react';
import { TimelineItem } from '../types';

interface RightSidebarProps {
    selectedItemId: string | null;
    tracks: any[];
    onUpdate: (item: TimelineItem) => void;
    onDelete: (trackId: string, itemId: string) => void;
    onDuplicate: (trackId: string, itemId: string) => void;
    onLock: (trackId: string, itemId: string) => void;
    onDetach: (trackId: string, itemId: string) => void;
    onSplit: () => void;
    onOpenEditPanel: (view?: 'main' | 'adjust' | 'eraser' | 'color' | 'animate' | 'text-effects' | 'font') => void;
    setInteractionMode: (mode: 'none' | 'crop' | 'erase') => void;
}

const RightSidebar: React.FC<RightSidebarProps> = ({
    selectedItemId, tracks, onUpdate, onDelete, onDuplicate, onLock, onDetach, onSplit, onOpenEditPanel, setInteractionMode
}) => {
    const item = tracks.find(t => t.items.some((i: TimelineItem) => i.id === selectedItemId))?.items.find((i: TimelineItem) => i.id === selectedItemId);

    if (!item) return null;

    return (
        <div className="absolute top-20 right-4 flex flex-col gap-2 z-40">
            {/* Contextual Floating Toolbar */}
            <div className="bg-white rounded-xl shadow-xl border border-gray-100 p-2 flex flex-col gap-2 animate-in fade-in slide-in-from-right-4 duration-200">

                {/* Primary Actions */}
                <div className="grid grid-cols-2 gap-2">
                    <button
                        onClick={() => onOpenEditPanel('animate')}
                        className="flex flex-col items-center justify-center p-2 rounded-lg hover:bg-gray-50 text-gray-700 transition-colors"
                        title="Animate"
                    >
                        <PlayCircle size={18} className="mb-1 text-violet-600" />
                        <span className="text-[9px] font-bold">Animate</span>
                    </button>

                    {item.type !== 'text' && (
                        <button
                            onClick={() => { onOpenEditPanel('eraser'); setInteractionMode('erase'); }}
                            className="flex flex-col items-center justify-center p-2 rounded-lg hover:bg-gray-50 text-gray-700 transition-colors"
                            title="Magic Eraser"
                        >
                            <Eraser size={18} className="mb-1 text-pink-500" />
                            <span className="text-[9px] font-bold">Eraser</span>
                        </button>
                    )}
                </div>

                <div className="h-px bg-gray-100 w-full"></div>

                {/* Secondary Actions */}
                <div className="flex flex-col gap-1">
                    {item.type !== 'text' && (
                        <button onClick={() => setInteractionMode('crop')} className="flex items-center gap-3 px-2 py-1.5 rounded-lg hover:bg-gray-50 text-gray-700 text-xs font-medium transition-colors">
                            <Crop size={14} /> Crop
                        </button>
                    )}
                    <button onClick={() => onUpdate({ ...item, rotation: (item.rotation || 0) + 90 })} className="flex items-center gap-3 px-2 py-1.5 rounded-lg hover:bg-gray-50 text-gray-700 text-xs font-medium transition-colors">
                        <FlipHorizontal size={14} /> Rotate
                    </button>
                    <button onClick={() => onOpenEditPanel('adjust')} className="flex items-center gap-3 px-2 py-1.5 rounded-lg hover:bg-gray-50 text-gray-700 text-xs font-medium transition-colors">
                        <MoreHorizontal size={14} /> Adjust
                    </button>
                </div>

                <div className="h-px bg-gray-100 w-full"></div>

                {/* Item Actions */}
                <div className="flex flex-col gap-1">
                    <button onClick={() => onDuplicate(item.trackId, item.id)} className="flex items-center gap-3 px-2 py-1.5 rounded-lg hover:bg-gray-50 text-gray-700 text-xs font-medium transition-colors">
                        <Copy size={14} /> Duplicate
                    </button>
                    <button onClick={() => onLock(item.trackId, item.id)} className="flex items-center gap-3 px-2 py-1.5 rounded-lg hover:bg-gray-50 text-gray-700 text-xs font-medium transition-colors">
                        <Lock size={14} /> Lock
                    </button>
                    {item.type === 'video' && (
                        <button onClick={() => onDetach(item.trackId, item.id)} className="flex items-center gap-3 px-2 py-1.5 rounded-lg hover:bg-gray-50 text-gray-700 text-xs font-medium transition-colors">
                            <Layers size={14} /> Detach Audio
                        </button>
                    )}
                    <button onClick={onSplit} className="flex items-center gap-3 px-2 py-1.5 rounded-lg hover:bg-gray-50 text-gray-700 text-xs font-medium transition-colors">
                        <Split size={14} /> Split
                    </button>
                    <button onClick={() => onDelete(item.trackId, item.id)} className="flex items-center gap-3 px-2 py-1.5 rounded-lg hover:bg-red-50 text-red-600 text-xs font-medium transition-colors">
                        <Trash2 size={14} /> Delete
                    </button>
                </div>

            </div>
        </div>
    );
};

export default RightSidebar;
