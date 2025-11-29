import React, { useState, useRef } from 'react';
import { Search, Type, Upload, Image as ImageIcon, Video, Music, LayoutTemplate, Plus, Play, Pause, Trash2 } from 'lucide-react';
import { TimelineItem } from '../types';

interface ResourcePanelProps {
    activeTab: string;
    onAddItem: (item: Omit<TimelineItem, 'id' | 'trackId' | 'start'>) => void;
}

const ResourcePanel: React.FC<ResourcePanelProps> = ({ activeTab, onAddItem }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [previewAudioId, setPreviewAudioId] = useState<string | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // Mock Data
    const MOCK_IMAGES = [
        'https://images.unsplash.com/photo-1707343843437-caacff5cfa74?w=300&h=200&fit=crop',
        'https://images.unsplash.com/photo-1707345512638-997d31a10eaa?w=300&h=200&fit=crop',
        'https://images.unsplash.com/photo-1707343844152-6d33a0bb32c3?w=300&h=200&fit=crop',
        'https://images.unsplash.com/photo-1682687220742-aba13b6e50ba?w=300&h=200&fit=crop',
        'https://images.unsplash.com/photo-1682687221038-404670f01d03?w=300&h=200&fit=crop',
        'https://images.unsplash.com/photo-1682687220063-4742bd7fd538?w=300&h=200&fit=crop',
    ];

    const MOCK_VIDEOS = [
        { id: 'v1', src: 'https://assets.mixkit.co/videos/preview/mixkit-tree-branches-in-the-breeze-1188-large.mp4', thumb: 'https://images.unsplash.com/photo-1518173946687-a4c8892bbd9f?w=300&h=200&fit=crop' },
        { id: 'v2', src: 'https://assets.mixkit.co/videos/preview/mixkit-waves-in-the-water-1164-large.mp4', thumb: 'https://images.unsplash.com/photo-1505118380757-91f5f5632de0?w=300&h=200&fit=crop' },
        { id: 'v3', src: 'https://assets.mixkit.co/videos/preview/mixkit-forest-stream-in-the-sunlight-529-large.mp4', thumb: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=300&h=200&fit=crop' },
    ];

    const MOCK_AUDIO = [
        { id: 'a1', name: 'Upbeat Pop', duration: '2:30', src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' },
        { id: 'a2', name: 'Cinematic Ambient', duration: '3:45', src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3' },
        { id: 'a3', name: 'Corporate Happy', duration: '1:50', src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3' },
    ];

    const MOCK_TEXT_STYLES = [
        { id: 't1', name: 'Heading', fontSize: 60, fontWeight: 'bold', preview: 'Add a heading' },
        { id: 't2', name: 'Subheading', fontSize: 40, fontWeight: 'semibold', preview: 'Add a subheading' },
        { id: 't3', name: 'Body', fontSize: 24, fontWeight: 'normal', preview: 'Add a little bit of body text' },
    ];

    const handlePlayAudio = (src: string, id: string) => {
        if (previewAudioId === id) {
            audioRef.current?.pause();
            setPreviewAudioId(null);
        } else {
            if (audioRef.current) {
                audioRef.current.src = src;
                audioRef.current.play();
                setPreviewAudioId(id);
            }
        }
    };

    const handleDragStart = (e: React.DragEvent, type: string, src: string, extra?: any) => {
        e.dataTransfer.setData('application/json', JSON.stringify({ type, src, ...extra }));
        e.dataTransfer.effectAllowed = 'copy';
    };

    const renderToolsTab = () => (
        <div className="p-4 grid grid-cols-2 gap-3">
            <button className="flex flex-col items-center gap-2 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors border border-gray-100">
                <div className="w-10 h-10 bg-violet-100 text-violet-600 rounded-full flex items-center justify-center">
                    <Type size={20} />
                </div>
                <span className="text-xs font-bold text-gray-700">Text to Video</span>
            </button>
            <button className="flex flex-col items-center gap-2 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors border border-gray-100">
                <div className="w-10 h-10 bg-pink-100 text-pink-600 rounded-full flex items-center justify-center">
                    <ImageIcon size={20} />
                </div>
                <span className="text-xs font-bold text-gray-700">Image Gen</span>
            </button>
        </div>
    );

    const renderTextTab = () => (
        <div className="p-4 space-y-4">
            <button
                onClick={() => onAddItem({ type: 'text', name: 'Add a heading', src: '', duration: 5, width: 80, height: 20, fontSize: 60, fontWeight: 'bold', color: '#000000' })}
                className="w-full bg-violet-600 text-white py-3 rounded-lg font-bold hover:bg-violet-700 transition-colors shadow-sm"
            >
                Add a text box
            </button>

            <div className="space-y-3">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Default Styles</h3>
                {MOCK_TEXT_STYLES.map(style => (
                    <div
                        key={style.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, 'text', '', { name: style.preview, fontSize: style.fontSize, fontWeight: style.fontWeight })}
                        onClick={() => onAddItem({ type: 'text', name: style.preview, src: '', duration: 5, width: 60, height: 15, fontSize: style.fontSize, fontWeight: style.fontWeight as any, color: '#000000' })}
                        className="p-3 bg-gray-50 hover:bg-gray-100 rounded-lg cursor-pointer border border-transparent hover:border-gray-200 transition-all"
                    >
                        <p style={{ fontSize: Math.max(12, style.fontSize / 3), fontWeight: style.fontWeight as any }} className="text-gray-800 truncate">
                            {style.preview}
                        </p>
                    </div>
                ))}
            </div>
        </div>
    );

    const renderUploadsTab = () => (
        <div className="p-4">
            <button className="w-full bg-gray-100 text-gray-700 py-3 rounded-lg font-bold hover:bg-gray-200 transition-colors flex items-center justify-center gap-2 mb-6 border border-gray-200 border-dashed">
                <Upload size={18} /> Upload files
            </button>
            <div className="text-center text-gray-400 text-sm mt-10">
                <p>No uploads yet</p>
                <p className="text-xs mt-1">Upload media to use in your project</p>
            </div>
        </div>
    );

    const renderImagesTab = () => (
        <div className="p-4">
            <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input
                    type="text"
                    placeholder="Search photos..."
                    className="w-full pl-9 pr-4 py-2 bg-gray-100 rounded-lg text-sm focus:ring-2 focus:ring-violet-500 outline-none transition-all"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>
            <div className="grid grid-cols-2 gap-2">
                {MOCK_IMAGES.map((src, i) => (
                    <div
                        key={i}
                        draggable
                        onDragStart={(e) => handleDragStart(e, 'image', src)}
                        onClick={() => onAddItem({ type: 'image', name: `Image ${i + 1}`, src, duration: 5, width: 50, height: 50 })}
                        className="aspect-square rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition-opacity relative group"
                    >
                        <img src={src} className="w-full h-full object-cover" loading="lazy" />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                            <Plus className="text-white opacity-0 group-hover:opacity-100 transform scale-75 group-hover:scale-100 transition-all" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    const renderVideosTab = () => (
        <div className="p-4">
            <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input
                    type="text"
                    placeholder="Search videos..."
                    className="w-full pl-9 pr-4 py-2 bg-gray-100 rounded-lg text-sm focus:ring-2 focus:ring-violet-500 outline-none transition-all"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>
            <div className="grid grid-cols-2 gap-2">
                {MOCK_VIDEOS.map((video) => (
                    <div
                        key={video.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, 'video', video.src)}
                        onClick={() => onAddItem({ type: 'video', name: 'Video Clip', src: video.src, duration: 10, width: 100, height: 100 })}
                        className="aspect-video rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition-opacity relative group bg-gray-100"
                    >
                        <img src={video.thumb} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-8 h-8 bg-black/30 rounded-full flex items-center justify-center backdrop-blur-sm group-hover:bg-black/50 transition-colors">
                                <Play size={12} className="text-white ml-0.5" />
                            </div>
                        </div>
                        <span className="absolute bottom-1 right-1 text-[10px] font-bold text-white bg-black/50 px-1 rounded">0:15</span>
                    </div>
                ))}
            </div>
        </div>
    );

    const renderAudioTab = () => (
        <div className="p-4">
            <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input
                    type="text"
                    placeholder="Search audio..."
                    className="w-full pl-9 pr-4 py-2 bg-gray-100 rounded-lg text-sm focus:ring-2 focus:ring-violet-500 outline-none transition-all"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>
            <div className="space-y-2">
                {MOCK_AUDIO.map((audio) => (
                    <div
                        key={audio.id}
                        className="flex items-center gap-3 p-3 bg-gray-50 hover:bg-gray-100 rounded-lg group transition-colors border border-transparent hover:border-gray-200"
                    >
                        <button
                            onClick={() => handlePlayAudio(audio.src, audio.id)}
                            className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center text-violet-600 hover:bg-violet-50 transition-colors shadow-sm"
                        >
                            {previewAudioId === audio.id ? <Pause size={14} /> : <Play size={14} className="ml-0.5" />}
                        </button>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-gray-800 truncate">{audio.name}</p>
                            <p className="text-xs text-gray-500">{audio.duration}</p>
                        </div>
                        <button
                            onClick={() => onAddItem({ type: 'audio', name: audio.name, src: audio.src, duration: 15 })}
                            className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-violet-100 text-violet-600 rounded transition-all"
                        >
                            <Plus size={16} />
                        </button>
                    </div>
                ))}
            </div>
            <audio ref={audioRef} onEnded={() => setPreviewAudioId(null)} className="hidden" />
        </div>
    );

    const renderContent = () => {
        switch (activeTab) {
            case 'tools': return renderToolsTab();
            case 'text': return renderTextTab();
            case 'uploads': return renderUploadsTab();
            case 'images': return renderImagesTab();
            case 'videos': return renderVideosTab();
            case 'audio': return renderAudioTab();
            case 'projects': return <div className="p-4 text-center text-gray-500 text-sm">Projects list here</div>;
            default: return null;
        }
    };

    return (
        <div className="w-80 bg-white border-r border-gray-200 flex flex-col h-full z-20 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
            <div className="h-14 border-b border-gray-100 flex items-center px-5 shrink-0">
                <h2 className="font-bold text-gray-800 capitalize text-lg tracking-tight">{activeTab}</h2>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                {renderContent()}
            </div>
        </div>
    );
};

export default ResourcePanel;
