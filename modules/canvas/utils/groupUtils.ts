
import { CanvasItemsData } from '../types';

export function getItemBounds(
    itemId: string,
    data: CanvasItemsData,
    additionalStates: {
        removeBgModalStates?: any[];
        eraseModalStates?: any[];
        expandModalStates?: any[];
    } = {}
): { x: number; y: number; width: number; height: number } | null {
    const {
        images,
        textInputStates,
        imageModalStates,
        videoModalStates,
        musicModalStates,
        upscaleModalStates,
        // REMOVED: removeBgModalStates
        // REMOVED: eraseModalStates
        // REMOVED: expandModalStates
        vectorizeModalStates,
        nextSceneModalStates,
        compareModalStates,
        storyboardModalStates,
        scriptFrameModalStates,
        sceneFrameModalStates,
        videoEditorModalStates
    } = data;

    const removeBgModalStates = additionalStates.removeBgModalStates || [];
    const eraseModalStates = additionalStates.eraseModalStates || [];
    const expandModalStates = additionalStates.expandModalStates || [];

    // Check images
    const image = images.find(img => img.elementId === itemId);
    if (image) {
        return { x: image.x || 0, y: image.y || 0, width: image.width || 300, height: image.height || 300 };
    }

    // Check image modals
    const imageModal = imageModalStates.find(m => m.id === itemId);
    if (imageModal) {
        return { x: imageModal.x, y: imageModal.y, width: imageModal.frameWidth || 300, height: imageModal.frameHeight || 300 };
    }

    // Check text inputs
    const textInput = textInputStates.find(t => t.id === itemId);
    if (textInput) return { x: textInput.x, y: textInput.y, width: 400, height: 60 };

    // Check storyboards
    const storyboard = storyboardModalStates.find(s => s.id === itemId);
    if (storyboard) return { x: storyboard.x, y: storyboard.y, width: storyboard.frameWidth || 400, height: storyboard.frameHeight || 500 };

    // Check scenes
    const scene = sceneFrameModalStates.find(s => s.id === itemId);
    if (scene) return { x: scene.x, y: scene.y, width: scene.frameWidth || 350, height: scene.frameHeight || 300 };

    // Check videos
    const video = videoModalStates.find(v => v.id === itemId);
    if (video) {
        return { x: video.x, y: video.y, width: video.frameWidth || 300, height: video.frameHeight || 300 };
    }

    // Check script frames
    const scriptFrame = scriptFrameModalStates.find(s => s.id === itemId);
    if (scriptFrame) return { x: scriptFrame.x, y: scriptFrame.y, width: scriptFrame.frameWidth || 400, height: scriptFrame.frameHeight || 500 };

    // Check music modals
    const music = musicModalStates.find(m => m.id === itemId);
    if (music) return { x: music.x, y: music.y, width: 100, height: 120 };

    // Check upscale modals
    const upscale = upscaleModalStates.find(u => u.id === itemId);
    if (upscale) return { x: upscale.x, y: upscale.y, width: upscale.frameWidth || 300, height: upscale.frameHeight || 300 };

    // Check removeBg modals
    const removeBg = removeBgModalStates.find(r => r.id === itemId);
    if (removeBg) return { x: removeBg.x, y: removeBg.y, width: removeBg.frameWidth || 300, height: removeBg.frameHeight || 300 };

    // Check erase modals
    const erase = eraseModalStates.find(e => e.id === itemId);
    if (erase) return { x: erase.x, y: erase.y, width: erase.frameWidth || 300, height: erase.frameHeight || 300 };

    // Check expand modals
    const expand = expandModalStates.find(e => e.id === itemId);
    if (expand) return { x: expand.x, y: expand.y, width: expand.frameWidth || 300, height: expand.frameHeight || 300 };

    // Check vectorize modals
    const vectorize = vectorizeModalStates.find(v => v.id === itemId);
    if (vectorize) return { x: vectorize.x, y: vectorize.y, width: vectorize.frameWidth || 300, height: vectorize.frameHeight || 300 };

    // Check next scene modals
    const nextScene = nextSceneModalStates.find(n => n.id === itemId);
    if (nextScene) return { x: nextScene.x, y: nextScene.y, width: nextScene.frameWidth || 300, height: nextScene.frameHeight || 300 };

    // Check video editor modals
    const videoEditor = videoEditorModalStates.find(v => v.id === itemId);
    if (videoEditor) return { x: videoEditor.x, y: videoEditor.y, width: 1000, height: 600 };

    // Check comparison modals
    const compare = compareModalStates.find(c => c.id === itemId);
    if (compare) return { x: compare.x, y: compare.y, width: compare.width || 800, height: compare.height || 600 };

    return null;
}

export function calculateGroupBounds(
    itemIds: string[],
    data: CanvasItemsData,
    additionalStates: {
        removeBgModalStates?: any[];
        eraseModalStates?: any[];
        expandModalStates?: any[];
    } = {}
): { x: number; y: number; width: number; height: number } | null {
    if (itemIds.length === 0) return null;

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    itemIds.forEach(id => {
        const bounds = getItemBounds(id, data, additionalStates);
        if (bounds) {
            minX = Math.min(minX, bounds.x);
            minY = Math.min(minY, bounds.y);
            maxX = Math.max(maxX, bounds.x + bounds.width);
            maxY = Math.max(maxY, bounds.y + bounds.height);
        }
    });

    if (minX === Infinity) return null;

    const padding = 20;
    return {
        x: minX - padding,
        y: minY - padding,
        width: (maxX - minX) + (padding * 2),
        height: (maxY - minY) + (padding * 2),
    };
}
