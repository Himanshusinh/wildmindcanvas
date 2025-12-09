// =================================================================================================
// Export Modal - Professional Video Export UI
// Original design inspired by Filmora concepts but with unique styling
// =================================================================================================

import React, { useState, useEffect, useMemo } from 'react';
import { X, Download, Upload, Settings, Cpu, Zap, HardDrive, Clock, Server, Globe } from 'lucide-react';
import type { Track, CanvasDimension } from '../types';
import {
    exportEngine,
    deviceDetector,
    type ExportSettings,
    type ExportProgress,
    type DeviceCapabilities,
    RESOLUTION_PRESETS,
    BITRATE_CONFIGS,
    DEFAULT_EXPORT_SETTINGS,
} from '../core';
import { serverExportService } from '../core/export/ServerExportService';

interface ExportModalProps {
    isOpen: boolean;
    onClose: () => void;
    tracks: Track[];
    duration: number; // seconds
    dimension: CanvasDimension;
    projectName: string;
}

const ExportModal: React.FC<ExportModalProps> = ({
    isOpen,
    onClose,
    tracks,
    duration,
    dimension,
    projectName,
}) => {
    // State
    const [settings, setSettings] = useState<ExportSettings>({
        ...DEFAULT_EXPORT_SETTINGS,
        projectName,
        resolution: { width: dimension.width, height: dimension.height, label: `${dimension.height}p` },
    });
    const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
    const [deviceCapabilities, setDeviceCapabilities] = useState<DeviceCapabilities | null>(null);
    const [showRecommendations, setShowRecommendations] = useState(true);
    const [isExporting, setIsExporting] = useState(false);
    const [progress, setProgress] = useState<ExportProgress>({ phase: 'preparing', progress: 0 });
    const [useServerExport, setUseServerExport] = useState(false);
    const [serverAvailable, setServerAvailable] = useState(false);

    // Load device capabilities on mount
    useEffect(() => {
        if (isOpen) {
            deviceDetector.getDeviceCapabilities().then(setDeviceCapabilities);
            // Check if server export is available
            serverExportService.isAvailable().then(available => {
                setServerAvailable(available);
                if (available) setUseServerExport(true); // Default to server if available
            });
        }
    }, [isOpen]);

    // Handle thumbnail upload
    const handleThumbnailUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = () => {
                setThumbnailPreview(reader.result as string);
                setSettings({ ...settings, thumbnailFile: file });
            };
            reader.readAsDataURL(file);
        }
    };

    // Calculate summary info
    const summaryInfo = useMemo(() => {
        const fps = settings.fps;
        const bitrateConfig = BITRATE_CONFIGS[settings.resolution.label] || BITRATE_CONFIGS['1080p'];
        const bitrate = bitrateConfig[settings.quality];
        const colorSpace = 'SDR-Rec.709';

        return { fps, bitrate, colorSpace };
    }, [settings.fps, settings.resolution.label, settings.quality]);

    // Calculate estimated file size
    const estimatedSize = useMemo(() => {
        const bitrate = summaryInfo.bitrate;
        const sizeBytes = (bitrate * 1000 * duration) / 8; // Convert kbps to bytes
        const sizeMB = sizeBytes / (1024 * 1024);
        return sizeMB;
    }, [summaryInfo.bitrate, duration]);

    // Handle export
    const handleExport = async () => {
        setIsExporting(true);

        try {
            let blob: Blob;

            if (useServerExport && serverAvailable) {
                // Use server-side FFmpeg (faster)
                console.log('[ExportModal] Using server-side export');
                blob = await serverExportService.export({
                    tracks,
                    duration,
                    dimension,
                    settings,
                    onProgress: setProgress
                });
            } else {
                // Use client-side FFmpeg.wasm
                console.log('[ExportModal] Using client-side export');
                blob = await exportEngine.export(tracks, duration, dimension, settings, setProgress);
            }

            // Trigger download
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            const extension = settings.format === 'mp4' ? 'mp4' : 'webm';
            a.download = `${settings.projectName}.${extension}`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            // Close modal after successful export
            setTimeout(() => {
                setIsExporting(false);
                onClose();
            }, 1500);
        } catch (error) {
            console.error('[ExportModal] Export failed:', error);
            setIsExporting(false);
        }
    };

    // Check if option is recommended
    const isRecommended = (type: 'resolution' | 'format' | 'encoder', value: string): boolean => {
        if (!showRecommendations || !deviceCapabilities) return true;

        switch (type) {
            case 'resolution':
                return deviceCapabilities.recommendedResolutions.includes(value);
            case 'format':
                return deviceCapabilities.recommendedFormats.includes(value);
            case 'encoder':
                return deviceCapabilities.recommendedEncoders.includes(value);
            default:
                return true;
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm" style={{ zIndex: 50000 }}>
            <div className="relative w-full max-w-2xl bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl shadow-2xl border border-gray-700/50 overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700/50 bg-gradient-to-r from-purple-900/20 to-blue-900/20">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-purple-500/20">
                            <Download className="w-5 h-5 text-purple-400" />
                        </div>
                        <h2 className="text-xl font-bold text-white">Export Video</h2>
                    </div>
                    <button
                        onClick={onClose}
                        disabled={isExporting}
                        className="p-2 rounded-lg hover:bg-white/10 transition-colors disabled:opacity-50"
                    >
                        <X className="w-5 h-5 text-gray-400" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                    {/* Top Section: Thumbnail + Name + Save To */}
                    <div className="grid grid-cols-4 gap-4">
                        {/* Thumbnail */}
                        <div className="col-span-1">
                            <label className="block text-sm font-medium text-gray-300 mb-2">Thumbnail</label>
                            <label className="relative block w-full aspect-video rounded-lg border-2 border-dashed border-gray-600 hover:border-purple-500 transition-colors cursor-pointer overflow-hidden group">
                                {thumbnailPreview ? (
                                    <img src={thumbnailPreview} alt="Thumbnail" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-full bg-gray-800/50 group-hover:bg-gray-800/70 transition-colors">
                                        <Upload className="w-6 h-6 text-gray-500 mb-1" />
                                        <span className="text-xs text-gray-500">Add</span>
                                    </div>
                                )}
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleThumbnailUpload}
                                    className="hidden"
                                    disabled={isExporting}
                                />
                            </label>
                        </div>

                        {/* Name + Save To */}
                        <div className="col-span-3 space-y-4">
                            {/* Project Name */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Project Name</label>
                                <input
                                    type="text"
                                    value={settings.projectName}
                                    onChange={(e) => setSettings({ ...settings, projectName: e.target.value })}
                                    disabled={isExporting}
                                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
                                    placeholder="Enter project name..."
                                />
                            </div>

                            {/* Save To */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Save To</label>
                                <div className="flex items-center gap-2 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg">
                                    <HardDrive className="w-4 h-4 text-gray-500" />
                                    <span className="text-sm text-gray-400 flex-1">Downloads folder</span>
                                    <span className="text-xs text-purple-400">Auto</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Settings Grid */}
                    <div className="grid grid-cols-2 gap-4">
                        {/* Format */}
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Format</label>
                            <select
                                value={settings.format}
                                onChange={(e) => setSettings({ ...settings, format: e.target.value as 'mp4' | 'webm' })}
                                disabled={isExporting}
                                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
                            >
                                <option value="webm" style={{ opacity: isRecommended('format', 'webm') ? 1 : 0.5 }}>
                                    WebM {!isRecommended('format', 'webm') && showRecommendations && '(Not Recommended)'}
                                </option>
                                <option value="mp4" style={{ opacity: isRecommended('format', 'mp4') ? 1 : 0.5 }}>
                                    MP4 {!isRecommended('format', 'mp4') && showRecommendations && '(Not Recommended)'}
                                </option>
                            </select>
                        </div>

                        {/* Resolution */}
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Resolution</label>
                            <select
                                value={settings.resolution.label}
                                onChange={(e) => {
                                    const preset = RESOLUTION_PRESETS.find(r => r.label === e.target.value);
                                    if (preset) {
                                        setSettings({ ...settings, resolution: { ...preset } });
                                    }
                                }}
                                disabled={isExporting}
                                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
                            >
                                {RESOLUTION_PRESETS.map((preset) => (
                                    <option
                                        key={preset.label}
                                        value={preset.label}
                                        style={{ opacity: isRecommended('resolution', preset.label) ? 1 : 0.5 }}
                                    >
                                        {preset.width}×{preset.height} ({preset.label})
                                        {!isRecommended('resolution', preset.label) && showRecommendations && ' (Not Recommended)'}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Encoder */}
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Encoder</label>
                            <select
                                value={settings.encoder}
                                onChange={(e) => setSettings({ ...settings, encoder: e.target.value as any })}
                                disabled={isExporting}
                                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
                            >
                                <option value="auto">Auto (Best for device)</option>
                                <option value="vp9" style={{ opacity: isRecommended('encoder', 'vp9') ? 1 : 0.5 }}>
                                    VP9 {!isRecommended('encoder', 'vp9') && showRecommendations && '(Not Recommended)'}
                                </option>
                                <option value="vp8" style={{ opacity: isRecommended('encoder', 'vp8') ? 1 : 0.5 }}>
                                    VP8 {!isRecommended('encoder', 'vp8') && showRecommendations && '(Not Recommended)'}
                                </option>
                                <option value="h264" style={{ opacity: isRecommended('encoder', 'h264') ? 1 : 0.5 }}>
                                    H.264 {!isRecommended('encoder', 'h264') && showRecommendations && '(Not Recommended)'}
                                </option>
                            </select>
                        </div>

                        {/* Quality */}
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Quality</label>
                            <div className="flex items-center gap-2 p-1 bg-gray-800 border border-gray-700 rounded-lg">
                                {(['low', 'medium', 'high'] as const).map((quality) => (
                                    <button
                                        key={quality}
                                        onClick={() => setSettings({ ...settings, quality })}
                                        disabled={isExporting}
                                        className={`flex-1 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${settings.quality === quality
                                            ? 'bg-purple-500 text-white'
                                            : 'text-gray-400 hover:text-white hover:bg-gray-700'
                                            } disabled:opacity-50`}
                                    >
                                        {quality.charAt(0).toUpperCase() + quality.slice(1)}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Dynamic Summary */}
                    <div className="flex items-center justify-center gap-4 px-4 py-3 bg-gray-800/50 rounded-lg border border-gray-700/50">
                        <div className="flex items-center gap-2 text-sm">
                            <Settings className="w-4 h-4 text-purple-400" />
                            <span className="text-gray-300">{summaryInfo.fps} fps</span>
                        </div>
                        <div className="w-px h-4 bg-gray-600" />
                        <div className="flex items-center gap-2 text-sm">
                            <Cpu className="w-4 h-4 text-blue-400" />
                            <span className="text-gray-300">{summaryInfo.bitrate.toLocaleString()} kbps</span>
                        </div>
                        <div className="w-px h-4 bg-gray-600" />
                        <div className="flex items-center gap-2 text-sm">
                            <span className="text-gray-300">{summaryInfo.colorSpace}</span>
                        </div>
                    </div>

                    {/* GPU Acceleration + Recommendations */}
                    <div className="space-y-3">
                        {/* GPU Acceleration Toggle */}
                        <div className="flex items-center justify-between px-4 py-3 bg-gray-800/50 rounded-lg border border-gray-700/50">
                            <div className="flex items-center gap-3">
                                <Zap className="w-5 h-5 text-yellow-400" />
                                <div>
                                    <div className="text-sm font-medium text-white">Use GPU Acceleration</div>
                                    <div className="text-xs text-gray-400">
                                        {deviceCapabilities?.isDedicatedGPU
                                            ? `${deviceCapabilities.gpuVendor.toUpperCase()} GPU detected`
                                            : 'Integrated GPU'}
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={() => setSettings({ ...settings, useGPU: !settings.useGPU })}
                                disabled={isExporting}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors disabled:opacity-50 ${settings.useGPU ? 'bg-purple-500' : 'bg-gray-600'
                                    }`}
                            >
                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.useGPU ? 'translate-x-6' : 'translate-x-1'
                                    }`} />
                            </button>
                        </div>

                        {/* Server Export Toggle */}
                        <div className={`flex items-center justify-between px-4 py-3 rounded-lg border ${serverAvailable ? 'bg-gradient-to-r from-green-900/30 to-emerald-900/30 border-green-700/50' : 'bg-gray-800/50 border-gray-700/50'}`}>
                            <div className="flex items-center gap-3">
                                <Server className={`w-5 h-5 ${serverAvailable ? 'text-green-400' : 'text-gray-500'}`} />
                                <div>
                                    <div className="text-sm font-medium text-white flex items-center gap-2">
                                        Server-side Export
                                        {serverAvailable && <span className="text-xs bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded">10-50x Faster</span>}
                                    </div>
                                    <div className="text-xs text-gray-400">
                                        {serverAvailable
                                            ? 'Uses native FFmpeg with hardware acceleration'
                                            : 'Server not available - using browser export'}
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={() => setUseServerExport(!useServerExport)}
                                disabled={isExporting || !serverAvailable}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors disabled:opacity-50 ${useServerExport && serverAvailable ? 'bg-green-500' : 'bg-gray-600'
                                    }`}
                            >
                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${useServerExport && serverAvailable ? 'translate-x-6' : 'translate-x-1'
                                    }`} />
                            </button>
                        </div>

                        {/* Recommend to Device Toggle */}
                        <div className="flex items-center justify-between px-4 py-3 bg-gray-800/50 rounded-lg border border-gray-700/50">
                            <div className="flex items-center gap-3">
                                <Cpu className="w-5 h-5 text-blue-400" />
                                <div>
                                    <div className="text-sm font-medium text-white">Show Recommended Settings</div>
                                    <div className="text-xs text-gray-400">Highlight best options for your device</div>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowRecommendations(!showRecommendations)}
                                disabled={isExporting}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors disabled:opacity-50 ${showRecommendations ? 'bg-purple-500' : 'bg-gray-600'
                                    }`}
                            >
                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${showRecommendations ? 'translate-x-6' : 'translate-x-1'
                                    }`} />
                            </button>
                        </div>
                    </div>

                    {/* Duration + Size + Export Button */}
                    <div className="flex items-center justify-between pt-4 border-t border-gray-700/50">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2 text-sm text-gray-400">
                                <Clock className="w-4 h-4" />
                                <span>Duration: {Math.floor(duration / 60)}:{(duration % 60).toFixed(0).padStart(2, '0')}</span>
                            </div>
                            <div className="text-sm text-gray-400">
                                Estimated size: <span className="text-white font-medium">{estimatedSize.toFixed(1)} MB</span>
                            </div>
                        </div>

                        <button
                            onClick={handleExport}
                            disabled={isExporting || !settings.projectName}
                            className="px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {isExporting ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    <span>Exporting...</span>
                                </>
                            ) : (
                                <>
                                    <Download className="w-5 h-5" />
                                    <span>Export Video</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Progress Overlay */}
                {isExporting && (
                    <div className="absolute inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-10">
                        <div className="bg-gray-800 rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl border border-gray-700">
                            <div className="text-center space-y-6">
                                {/* Phase */}
                                <div>
                                    <div className="text-xl font-bold text-white mb-2">
                                        {progress.phase === 'preparing' && 'Preparing...'}
                                        {progress.phase === 'rendering' && 'Rendering Frames...'}
                                        {progress.phase === 'encoding' && 'Encoding Video...'}
                                        {progress.phase === 'finalizing' && 'Finalizing...'}
                                        {progress.phase === 'complete' && '✓ Complete!'}
                                        {progress.phase === 'error' && '✗ Error'}
                                    </div>
                                    {progress.error && (
                                        <div className="text-sm text-red-400">{progress.error}</div>
                                    )}
                                </div>

                                {/* Progress Bar */}
                                <div className="space-y-2">
                                    <div className="h-2 bg-gray-900 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all duration-300"
                                            style={{ width: `${progress.progress}%` }}
                                        />
                                    </div>
                                    <div className="text-sm text-gray-400">{progress.progress.toFixed(0)}%</div>
                                </div>

                                {/* Frame Counter */}
                                {progress.currentFrame && progress.totalFrames && (
                                    <div className="text-sm text-gray-400">
                                        Frame {progress.currentFrame} / {progress.totalFrames}
                                    </div>
                                )}

                                {/* Time Remaining */}
                                {progress.estimatedTimeRemaining && (
                                    <div className="text-sm text-gray-400">
                                        Estimated time remaining: {progress.estimatedTimeRemaining}s
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ExportModal;
