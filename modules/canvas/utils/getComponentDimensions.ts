
import { CanvasItemsData } from '../types';

export function getComponentDimensions(
    type: string,
    id: string | number,
    data: CanvasItemsData
): { width: number; height: number } {
    const {
        images,
        canvasTextStates,
        textInputStates,
        imageModalStates,
        videoModalStates,
        musicModalStates,
        upscaleModalStates,
        multiangleCameraModalStates,
        removeBgModalStates,
        eraseModalStates,
        expandModalStates,
        vectorizeModalStates,
        nextSceneModalStates,
        compareModalStates,
        storyboardModalStates,
        scriptFrameModalStates,
        sceneFrameModalStates,
        videoEditorModalStates
    } = data;

    switch (type) {
        case 'image': {
            const index = typeof id === 'string' ? parseInt(id, 10) : id;
            const img = images?.[index];
            if (!img) return { width: 0, height: 0 };
            // Fallback dimensions if element dimensions aren't available
            const w = 512;
            const h = 512;
            // Note: In Canvas.tsx `getImageDimensions` helper effectively does this or uses natural width
            // Since we don't have that helper here easily, we assume standard or specific properties if available.
            // But actually, the original code looked up `(img as any).width` or similar? 
            // Let's check original code logic.
            // Original: 
            // const img = images[index];
            // if (!img) return { width: 0, height: 0 };
            // return { width: (img as any).width || 512, height: (img as any).height || 512 };

            // We will blindly copy the logic structure, adjusting for types
            return { width: (img as any).width || 512, height: (img as any).height || 512 };
        }

        case 'input': {
            // Find within textInputStates
            const input = textInputStates.find(t => t.id === id);
            if (!input) return { width: 0, height: 0 };
            // Estimate width based on content
            const estimatedWidth = input.value ? Math.max(200, input.value.length * 10) : 200;
            return { width: estimatedWidth, height: 50 }; // approx
        }

        case 'imageModal':
        case 'image-modal': {
            const modal = imageModalStates.find(m => m.id === id);
            return modal ? { width: modal.frameWidth || 512, height: modal.frameHeight || 512 } : { width: 0, height: 0 };
        }

        case 'videoModal':
        case 'video-modal': {
            const modal = videoModalStates.find(m => m.id === id);
            return modal ? { width: modal.frameWidth || 512, height: modal.frameHeight || 512 } : { width: 0, height: 0 };
        }

        case 'videoEditorModal':
        case 'video-editor-modal': {
            const modal = videoEditorModalStates.find(m => m.id === id);
            // Video editor typically has a fixed or default size if not found
            if ((modal as any)?.isExpanded) return { width: 1000, height: 600 };
            return { width: 100, height: 130 }; // Collapsed icon size
        }

        case 'musicModal':
        case 'music-modal': {
            const modal = musicModalStates.find(m => m.id === id);
            return modal ? { width: modal.frameWidth || 340, height: modal.frameHeight || 480 } : { width: 0, height: 0 };
        }

        case 'upscaleModal':
        case 'upscale-modal': {
            const modal = upscaleModalStates.find(m => m.id === id);
            if ((modal as any)?.isExpanded) return { width: modal?.frameWidth || 400, height: modal?.frameHeight || 350 };
            return { width: 100, height: 130 };
        }

        case 'multiangleCameraModal':
        case 'multiangle-camera-modal': {
            const modal = multiangleCameraModalStates.find(m => m.id === id);
            // Base circle is 100x100. If expanded, it has a 400px wide control panel below.
            // Adjust height as needed, for now assuming a reasonable height for controls.
            if ((modal as any)?.isExpanded) return { width: 400, height: 500 };
            return { width: 100, height: 130 };
        }

        case 'removeBgModal':
        case 'remove-bg-modal': {
            const modal = removeBgModalStates.find(m => m.id === id);
            if ((modal as any)?.isExpanded) return { width: 400, height: 400 };
            return { width: 100, height: 130 };
        }

        case 'eraseModal':
        case 'erase-modal': {
            const modal = eraseModalStates.find(m => m.id === id);
            if ((modal as any)?.isExpanded) return { width: 400, height: 400 };
            return { width: 100, height: 130 };
        }

        case 'expandModal':
        case 'expand-modal': {
            const modal = expandModalStates.find(m => m.id === id);
            if ((modal as any)?.isExpanded) return { width: 400, height: 500 };
            return { width: 100, height: 130 };
        }

        case 'vectorizeModal':
        case 'vectorize-modal': {
            const modal = vectorizeModalStates.find(m => m.id === id);
            if ((modal as any)?.isExpanded) return { width: 400, height: 500 };
            return { width: 100, height: 130 };
        }

        case 'nextSceneModal':
        case 'next-scene-modal': {
            const modal = nextSceneModalStates.find(m => m.id === id);
            // Default circle size is usually smaller than the full modal frameFrameWidth
            if ((modal as any)?.isExpanded) return { width: 400, height: 500 };
            return { width: 100, height: 130 };
        }

        case 'compareModal':
        case 'compare-modal': {
            const modal = compareModalStates.find(m => m.id === id);
            if ((modal as any)?.isExpanded) return { width: modal?.width || 800, height: modal?.height || 600 };
            return { width: 100, height: 130 };
        }

        case 'storyboardModal':
        case 'storyboard-modal': {
            const modal = storyboardModalStates.find(m => m.id === id);
            return modal ? { width: modal.frameWidth || 1000, height: modal.frameHeight || 300 } : { width: 100, height: 130 };
        }

        case 'scriptFrameModal':
        case 'script-frame-modal': {
            const modal = scriptFrameModalStates.find(m => m.id === id);
            return modal ? { width: modal.frameWidth || 360, height: modal.frameHeight || 260 } : { width: 0, height: 0 };
        }

        case 'sceneFrameModal':
        case 'scene-frame-modal': {
            const modal = sceneFrameModalStates.find(m => m.id === id);
            return modal ? { width: modal.frameWidth || 300, height: modal.frameHeight || 400 } : { width: 0, height: 0 };
        }

        case 'text': {
            const textState = canvasTextStates.find(t => t.id === id);
            if (!textState) return { width: 0, height: 0 };

            const estimatedWidth = textState.width ?? (textState.text ? textState.text.length * (textState.fontSize || 16) * 0.6 : 200);
            const height = textState.height || (textState.fontSize || 16) * 1.2;

            return { width: estimatedWidth, height };
        }

        default:
            return { width: 0, height: 0 };
    }
}
