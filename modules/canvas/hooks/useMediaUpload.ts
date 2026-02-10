import { useCallback } from 'react';
import { ImageUpload } from '@/core/types/canvas';
import { saveUploadedMedia } from '@/core/api/api';
import { useNotificationStore } from '@/modules/stores/notificationStore';

interface UseMediaUploadProps {
    projectId: string | null;
    viewportCenterCallback: () => { x: number; y: number; scale: number };
    setImages: React.Dispatch<React.SetStateAction<ImageUpload[]>>;
    setImageGenerators: React.Dispatch<React.SetStateAction<any[]>>; // Replace 'any' with correct type if available
    setVideoGenerators: React.Dispatch<React.SetStateAction<any[]>>; // Replace 'any' with correct type if available
}

export const useMediaUpload = ({
    projectId,
    viewportCenterCallback,
    setImages,
    setImageGenerators,
    setVideoGenerators,
}: UseMediaUploadProps) => {
    const addToast = useNotificationStore(state => state.addToast);

    const processMediaFile = useCallback(async (file: File, offsetIndex: number = 0) => {
        const fileType = file.type.toLowerCase();
        const fileName = file.name.toLowerCase();

        // 1. Generate deterministic IDs safely
        const baseId = Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
        const modalId = fileType.startsWith('video/') ? `video-${baseId}` : `image-${baseId}`;
        const elementId = `element-${baseId}`;

        // 2. Create local blob URL for immediate display
        const blobUrl = URL.createObjectURL(file);

        // 3. Define background upload logic
        const uploadInBackground = async () => {
            if (!projectId) return;

            try {
                const convertFileToDataUri = (file: File): Promise<string> => {
                    return new Promise((resolve, reject) => {
                        const reader = new FileReader();
                        reader.onload = () => resolve(reader.result as string);
                        reader.onerror = reject;
                        reader.readAsDataURL(file);
                    });
                };

                const isImage = fileType.startsWith('image/');
                const isVideoFile = fileType.startsWith('video/') ||
                    ['.mp4', '.webm', '.ogg', '.mov', '.avi', '.mkv', '.flv', '.wmv', '.m4v', '.3gp']
                        .some(ext => fileName.endsWith(ext));

                if (isImage || isVideoFile) {
                    const dataUri = await convertFileToDataUri(file);
                    // dynamically import to avoid circular dependencies if any, though standard import is likely fine here
                    // keeping it consistent with original code
                    const result = await saveUploadedMedia(dataUri, isImage ? 'image' : 'video', projectId);

                    if (result.success && result.url) {
                        // 4. On success, update the existing node with the real URL
                        if (isImage) {
                            setImageGenerators(prev => prev.map(g => g.id === modalId ? { ...g, generatedImageUrl: result.url } : g));
                        } else {
                            setVideoGenerators(prev => prev.map(g => g.id === modalId ? { ...g, generatedVideoUrl: result.url } : g));
                        }

                        // Trigger library refresh
                        setTimeout(() => {
                            window.dispatchEvent(new CustomEvent('library-refresh'));
                        }, 1000);
                        addToast('Media uploaded successfully', 'success');
                    } else {
                        throw new Error(result.error || 'Upload failed');
                    }
                }
            } catch (err) {
                console.warn('[processMediaFile] Background upload failed, keeping local blob:', err);
                addToast('Failed to upload media to server. Your changes are saved locally only.', 'error');
            }
        };

        // Trigger upload but don't await it
        uploadInBackground();

        // 4. Render UI immediately using blobUrl
        const isModel3D = ['.obj', '.gltf', '.glb', '.fbx', '.mb', '.ma'].some(ext => fileName.endsWith(ext));
        const isVideo = fileType.startsWith('video/') || ['.mp4', '.webm', '.ogg', '.mov', '.avi', '.mkv', '.flv', '.wmv', '.m4v', '.3gp'].some(ext => fileName.endsWith(ext));

        // Calculate position
        const center = viewportCenterCallback();
        const offsetX = (offsetIndex % 3) * 50;
        const offsetY = Math.floor(offsetIndex / 3) * 50;

        if (isModel3D) {
            const modelX = center.x - 200 + offsetX;
            const modelY = center.y - 200 + offsetY;
            setImages(prev => [...prev, {
                type: 'model3d',
                url: blobUrl,
                x: modelX, y: modelY, width: 400, height: 400,
                zoom: 1, rotationX: 0, rotationY: 0,
                elementId,
                relatedFiles: new Map(), // Initialize empty map for simple model upload
            }]);

        } else if (isVideo) {
            const video = document.createElement('video');
            video.src = blobUrl;
            video.preload = 'metadata';
            video.onloadedmetadata = () => {
                const naturalWidth = video.videoWidth || 800;
                const naturalHeight = video.videoHeight || 600;
                const maxFrameWidth = 600;
                const aspectRatio = naturalWidth / naturalHeight;
                const frameWidth = maxFrameWidth;
                let frameHeight = Math.max(400, Math.round(maxFrameWidth / aspectRatio));
                if (naturalHeight > naturalWidth) {
                    frameHeight = Math.max(400, Math.round(maxFrameWidth * aspectRatio));
                }

                const modalX = center.x - frameWidth / 2 + offsetX;
                const modalY = center.y - frameHeight / 2 + offsetY;

                setVideoGenerators(prev => [...prev, {
                    id: modalId,
                    x: modalX, y: modalY,
                    frameWidth, frameHeight,
                    model: 'Uploaded Video',
                    frame: 'Frame',
                    aspectRatio: `${Math.round(aspectRatio * 10) / 10}: 1`,
                    prompt: '',
                    duration: video.duration || 5,
                    resolution: '720p',
                    generatedVideoUrl: blobUrl
                }]);
            };
        } else {
            // Image logic
            const img = new Image();
            img.onload = () => {
                const naturalWidth = img.naturalWidth || 800;
                const naturalHeight = img.naturalHeight || 600;
                const maxFrameWidth = 600;
                const aspectRatio = naturalWidth / naturalHeight;
                const frameWidth = maxFrameWidth;
                let frameHeight = Math.max(400, Math.round(maxFrameWidth / aspectRatio));
                if (naturalHeight > naturalWidth) {
                    frameHeight = Math.max(400, Math.round(maxFrameWidth * aspectRatio));
                }

                const modalX = center.x - frameWidth / 2 + offsetX;
                const modalY = center.y - frameHeight / 2 + offsetY;

                setImageGenerators(prev => [...prev, {
                    id: modalId,
                    x: modalX, y: modalY,
                    frameWidth, frameHeight,
                    model: 'Uploaded Image',
                    frame: 'Frame',
                    aspectRatio: `${Math.round(aspectRatio * 10) / 10}: 1`,
                    prompt: '',
                    generatedImageUrl: blobUrl
                }]);
            };
            img.src = blobUrl;
        }
    }, [projectId, viewportCenterCallback, setImages, setImageGenerators, setVideoGenerators]);

    const handleMultipleFilesUpload = useCallback((files: File[]) => {
        // Find the main GLTF file
        const gltfFile = files.find(f => f.name.toLowerCase().endsWith('.gltf'));
        if (!gltfFile) {
            // If no GLTF file, process files individually
            files.forEach((file, index) => {
                processMediaFile(file, index);
            });
            return;
        }

        // Create a map of related files (bin, textures, etc.)
        const relatedFiles = new Map<string, { file: File; url: string }>();
        files.forEach(file => {
            if (file !== gltfFile) {
                const fileName = file.name;
                const url = URL.createObjectURL(file);
                const fileInfo = { file, url };

                // Store with multiple keys for flexible lookup
                // 1. Full filename
                relatedFiles.set(fileName, fileInfo);

                // 2. Just the filename (without path)
                const pathParts = fileName.split(/[/\\]/);
                const justFileName = pathParts[pathParts.length - 1];
                if (justFileName !== fileName) {
                    relatedFiles.set(justFileName, fileInfo);
                }

                // 3. Filename with common texture paths
                // GLTF files often reference textures like "textures/image.png"
                const normalizedPath = fileName.replace(/\\/g, '/');
                relatedFiles.set(normalizedPath, fileInfo);

                // 4. Just the base name (without extension) for partial matching
                const baseName = justFileName.split('.').slice(0, -1).join('.');
                if (baseName) {
                    relatedFiles.set(baseName, fileInfo);
                }
            }
        });

        // Process the GLTF file with related files
        const url = URL.createObjectURL(gltfFile);
        const center = viewportCenterCallback();
        const offsetX = (files.length % 3) * 50; // simple offset based on total files
        const offsetY = Math.floor(files.length / 3) * 50;
        const modelX = center.x - 400 / 2 + offsetX;
        const modelY = center.y - 400 / 2 + offsetY;

        const elementId = `element-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const newImage: ImageUpload = {
            file: gltfFile,
            url,
            type: 'model3d',
            x: modelX,
            y: modelY,
            width: 400,
            height: 400,
            rotationX: 0,
            rotationY: 0,
            zoom: 1,
            elementId,
            relatedFiles,
        };

        // Create Element in local state (optimistic + save implicit via autosave)
        setImages(prev => [...prev, newImage]);
    }, [processMediaFile, setImages, viewportCenterCallback]);

    return {
        processMediaFile,
        handleMultipleFilesUpload
    };
};
