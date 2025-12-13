import { ImageUpload } from '@/types/canvas';
import { CanvasAppState } from '../types';

export function buildSnapshotElements(
  state: CanvasAppState,
  connectorsOverride?: Array<any>
): Record<string, any> {
  const elements: Record<string, any> = {};

  // Build connection map keyed by source element id
  const connectionsBySource: Record<string, Array<any>> = {};
  const connectorsToUse = (connectorsOverride ?? state.connectors).filter(
    (c) => !(c?.from && c.from.startsWith('replace-')) && !(c?.to && c.to.startsWith('replace-'))
  );
  connectorsToUse.forEach((c) => {
    if (!c || !c.id) return;
    const src = c.from;
    if (!src) return;
    connectionsBySource[src] = connectionsBySource[src] || [];
    connectionsBySource[src].push({ id: c.id, to: c.to, color: c.color, fromAnchor: c.fromAnchor, toAnchor: c.toAnchor });
  });

  // Uploaded media and text/models
  state.images.forEach((img, idx) => {
    const id = (img as any).elementId || `element-${idx}`;
    if (!(img as any).elementId) {
      // Skip persisting items without stable id to avoid churn
      return;
    }
    const type = img.type === 'image' ? 'image' : img.type === 'video' ? 'video' : img.type === 'text' ? 'text' : img.type === 'model3d' ? 'model3d' : 'image';
    const meta: any = {};
    if (type === 'text') {
      if (img.text) meta.text = img.text;
      if (img.fontSize) meta.fontSize = img.fontSize;
      if (img.fontFamily) meta.fontFamily = img.fontFamily;
      if (img.fill) meta.fill = img.fill;
    } else if (img.url) {
      meta.url = img.url;
    }
    // Attach any connections originating from this element into its meta
    if (connectionsBySource[id] && connectionsBySource[id].length) {
      meta.connections = connectionsBySource[id];
    }
    elements[id] = { id, type, x: img.x || 0, y: img.y || 0, width: img.width, height: img.height, rotation: img.rotation || 0, meta };
  });

  // Generators (image/video/music)
  state.imageGenerators.forEach((g) => {
    const metaObj: any = {
      generatedImageUrl: g.generatedImageUrl || null,
      sourceImageUrl: (g as any).sourceImageUrl || null, // CRITICAL: Save sourceImageUrl to snapshot
      frameWidth: g.frameWidth,
      frameHeight: g.frameHeight,
      model: g.model,
      frame: g.frame,
      aspectRatio: g.aspectRatio,
      prompt: g.prompt
    };
    if (connectionsBySource[g.id] && connectionsBySource[g.id].length) metaObj.connections = connectionsBySource[g.id];
    elements[g.id] = { id: g.id, type: 'image-generator', x: g.x, y: g.y, meta: metaObj };
  });

  state.videoGenerators.forEach((g) => {
    const metaObj: any = { generatedVideoUrl: g.generatedVideoUrl || null, frameWidth: g.frameWidth, frameHeight: g.frameHeight, model: g.model, frame: g.frame, aspectRatio: g.aspectRatio, prompt: g.prompt, taskId: (g as any).taskId, generationId: (g as any).generationId, status: (g as any).status };
    if (connectionsBySource[g.id] && connectionsBySource[g.id].length) metaObj.connections = connectionsBySource[g.id];
    elements[g.id] = { id: g.id, type: 'video-generator', x: g.x, y: g.y, meta: metaObj };
  });

  state.videoEditorGenerators.forEach((g) => {
    const metaObj: any = {};
    if (connectionsBySource[g.id] && connectionsBySource[g.id].length) metaObj.connections = connectionsBySource[g.id];
    elements[g.id] = { id: g.id, type: 'video-editor-trigger', x: g.x, y: g.y, meta: metaObj };
  });

  state.musicGenerators.forEach((g) => {
    const metaObj: any = { generatedMusicUrl: g.generatedMusicUrl || null, frameWidth: g.frameWidth, frameHeight: g.frameHeight, model: g.model, frame: g.frame, aspectRatio: g.aspectRatio, prompt: g.prompt };
    if (connectionsBySource[g.id] && connectionsBySource[g.id].length) metaObj.connections = connectionsBySource[g.id];
    elements[g.id] = { id: g.id, type: 'music-generator', x: g.x, y: g.y, meta: metaObj };
  });

  // Upscale generators
  state.upscaleGenerators.forEach((modal) => {
    if (!modal || !modal.id) return;
    const metaObj: any = {
      upscaledImageUrl: modal.upscaledImageUrl || null,
      sourceImageUrl: modal.sourceImageUrl || null,
      localUpscaledImageUrl: modal.localUpscaledImageUrl || null,
      model: modal.model || 'Crystal Upscaler',
      scale: modal.scale || 2,
      frameWidth: modal.frameWidth || 400,
      frameHeight: modal.frameHeight || 500,
      isUpscaling: modal.isUpscaling || false,
    };
    // Attach any connections originating from this element into its meta
    if (connectionsBySource[modal.id] && connectionsBySource[modal.id].length) {
      metaObj.connections = connectionsBySource[modal.id];
    }
    elements[modal.id] = {
      id: modal.id,
      type: 'upscale-plugin',
      x: modal.x,
      y: modal.y,
      meta: metaObj,
    };
  });

  // Remove BG generators
  state.removeBgGenerators.forEach((modal) => {
    if (!modal || !modal.id) return;
    const metaObj: any = {
      removedBgImageUrl: modal.removedBgImageUrl || null,
      sourceImageUrl: modal.sourceImageUrl || null,
      localRemovedBgImageUrl: modal.localRemovedBgImageUrl || null,
      model: modal.model || '851-labs/background-remover',
      backgroundType: modal.backgroundType || 'rgba (transparent)',
      scaleValue: modal.scaleValue || 0.5,
      frameWidth: modal.frameWidth || 400,
      frameHeight: modal.frameHeight || 500,
      isRemovingBg: modal.isRemovingBg || false,
    };
    // Attach any connections originating from this element into its meta
    if (connectionsBySource[modal.id] && connectionsBySource[modal.id].length) {
      metaObj.connections = connectionsBySource[modal.id];
    }
    elements[modal.id] = {
      id: modal.id,
      type: 'removebg-plugin',
      x: modal.x,
      y: modal.y,
      meta: metaObj,
    };
  });

  // Erase generators
  state.eraseGenerators.forEach((modal) => {
    if (!modal || !modal.id) return;
    const metaObj: any = {
      erasedImageUrl: modal.erasedImageUrl || null,
      sourceImageUrl: modal.sourceImageUrl || null,
      localErasedImageUrl: modal.localErasedImageUrl || null,
      model: modal.model || 'bria/eraser',
      frameWidth: modal.frameWidth || 400,
      frameHeight: modal.frameHeight || 500,
      isErasing: modal.isErasing || false,
    };
    // Attach any connections originating from this element into its meta
    if (connectionsBySource[modal.id] && connectionsBySource[modal.id].length) {
      metaObj.connections = connectionsBySource[modal.id];
    }
    elements[modal.id] = {
      id: modal.id,
      type: 'erase-plugin',
      x: modal.x,
      y: modal.y,
      meta: metaObj,
    };
  });

  // Expand generators
  state.expandGenerators.forEach((modal) => {
    if (!modal || !modal.id) return;
    const metaObj: any = {
      expandedImageUrl: modal.expandedImageUrl || null,
      sourceImageUrl: modal.sourceImageUrl || null,
      localExpandedImageUrl: modal.localExpandedImageUrl || null,
      model: modal.model || 'expand/base',
      frameWidth: modal.frameWidth || 400,
      frameHeight: modal.frameHeight || 500,
      isExpanding: modal.isExpanding || false,
    };
    if (connectionsBySource[modal.id] && connectionsBySource[modal.id].length) {
      metaObj.connections = connectionsBySource[modal.id];
    }
    elements[modal.id] = {
      id: modal.id,
      type: 'expand-plugin',
      x: modal.x,
      y: modal.y,
      meta: metaObj,
    };
  });

  // Vectorize generators
  state.vectorizeGenerators.forEach((modal) => {
    if (!modal || !modal.id) return;
    const metaObj: any = {
      vectorizedImageUrl: modal.vectorizedImageUrl || null,
      sourceImageUrl: modal.sourceImageUrl || null,
      localVectorizedImageUrl: modal.localVectorizedImageUrl || null,
      mode: modal.mode || 'simple',
      frameWidth: modal.frameWidth || 400,
      frameHeight: modal.frameHeight || 500,
      isVectorizing: modal.isVectorizing || false,
    };
    // Attach any connections originating from this element into its meta
    if (connectionsBySource[modal.id] && connectionsBySource[modal.id].length) {
      metaObj.connections = connectionsBySource[modal.id];
    }
    elements[modal.id] = {
      id: modal.id,
      type: 'vectorize-plugin',
      x: modal.x,
      y: modal.y,
      meta: metaObj,
    };
  });

  // NextScene generators
  state.nextSceneGenerators.forEach((modal) => {
    if (!modal || !modal.id) return;
    const metaObj: any = {
      nextSceneImageUrl: modal.nextSceneImageUrl || null,
      sourceImageUrl: modal.sourceImageUrl || null,
      localNextSceneImageUrl: modal.localNextSceneImageUrl || null,
      mode: modal.mode || 'scene',
      frameWidth: modal.frameWidth || 400,
      frameHeight: modal.frameHeight || 500,
      isProcessing: modal.isProcessing || false,
    };
    // Attach any connections originating from this element into its meta
    if (connectionsBySource[modal.id] && connectionsBySource[modal.id].length) {
      metaObj.connections = connectionsBySource[modal.id];
    }
    elements[modal.id] = {
      id: modal.id,
      type: 'next-scene-plugin',
      x: modal.x,
      y: modal.y,
      meta: metaObj,
    };
  });

  // Multiangle generators
  state.multiangleGenerators.forEach((modal) => {
    if (!modal || !modal.id) return;
    const metaObj: any = {
      multiangleImageUrl: modal.multiangleImageUrl || null,
      sourceImageUrl: modal.sourceImageUrl || null,
      localMultiangleImageUrl: modal.localMultiangleImageUrl || null,
      frameWidth: modal.frameWidth || 400,
      frameHeight: modal.frameHeight || 500,
      isProcessing: modal.isProcessing || false,
    };
    if (connectionsBySource[modal.id] && connectionsBySource[modal.id].length) {
      metaObj.connections = connectionsBySource[modal.id];
    }
    elements[modal.id] = {
      id: modal.id,
      type: 'multiangle-plugin',
      x: modal.x,
      y: modal.y,
      meta: metaObj,
    };
  });

  // Storyboard generators
  state.storyboardGenerators.forEach((modal) => {
    if (!modal || !modal.id) return;
    const metaObj: any = {
      frameWidth: modal.frameWidth || 400,
      frameHeight: modal.frameHeight || 500,
      scriptText: modal.scriptText || null,
      characterNamesMap: (modal as any).characterNamesMap || {},
      propsNamesMap: (modal as any).propsNamesMap || {},
      backgroundNamesMap: (modal as any).backgroundNamesMap || {},
      stitchedImageUrl: (modal as any).stitchedImageUrl || undefined,
    };

    // Build namedImages object: name -> imageUrl mapping
    // This auto-updates whenever names maps or connections change
    const namedImages: {
      characters?: Record<string, string>;
      backgrounds?: Record<string, string>;
      props?: Record<string, string>;
    } = {};

    // Get connections for this storyboard
    // Images connect TO the storyboard, so we filter by c.to === modal.id
    const storyboardConnections = connectorsToUse.filter(c => c.to === modal.id);
    const characterConnections = storyboardConnections.filter(c => c.toAnchor === 'receive-character');
    const backgroundConnections = storyboardConnections.filter(c => c.toAnchor === 'receive-background');
    const propsConnections = storyboardConnections.filter(c => c.toAnchor === 'receive-props');

    console.log(`[buildSnapshotElements] Storyboard ${modal.id} connections:`, {
      totalConnections: storyboardConnections.length,
      characterConnections: characterConnections.length,
      backgroundConnections: backgroundConnections.length,
      propsConnections: propsConnections.length,
      characterConnectionsDetails: characterConnections.map(c => ({ from: c.from, to: c.to, toAnchor: c.toAnchor })),
    });

    // Build character name -> imageUrl map
    if ((modal as any).characterNamesMap) {
      const characterMap: Record<string, string> = {};
      Object.entries((modal as any).characterNamesMap).forEach(([indexStr, name]) => {
        const index = parseInt(indexStr, 10);
        if (name && characterConnections[index]) {
          // Connection is FROM image TO storyboard, so imageId is c.from
          const imageId = characterConnections[index].from;
          let imageUrl: string | undefined = undefined;

          // First, try to get URL from the elements we've already built (image generators are processed earlier)
          const imageElement = elements[imageId];
          if (imageElement && imageElement.type === 'image-generator') {
            imageUrl = imageElement.meta?.generatedImageUrl ||
              imageElement.meta?.sourceImageUrl ||
              imageElement.meta?.generatedImageUrls?.[0] ||
              imageElement.meta?.url;
          }

          // Fallback to state if not found in elements
          if (!imageUrl) {
            const imageGen = state.imageGenerators.find(img => img.id === imageId);
            if (imageGen) {
              imageUrl = imageGen.generatedImageUrl ||
                (imageGen as any)?.sourceImageUrl ||
                (imageGen as any)?.generatedImageUrls?.[0] ||
                (imageGen as any)?.url;
            }
          }

          // Also try images array (uploaded images also have Zata URLs)
          if (!imageUrl) {
            const image = state.images.find(img => (img as any).elementId === imageId);
            imageUrl = image?.url || (image as any)?.firebaseUrl;
          }

          // Also check if it's in the elements as a regular image
          if (!imageUrl && imageElement && imageElement.type === 'image') {
            imageUrl = imageElement.meta?.url;
          }

          if (imageUrl) {
            // Store the Zata URL (url field contains the Zata publicUrl)
            characterMap[name as string] = imageUrl;
            console.log(`[buildSnapshotElements] Mapped character "${name}" to image URL: ${imageUrl.substring(0, 80)}...`);
          } else {
            console.warn(`[buildSnapshotElements] ⚠️ No image URL found for character "${name}" (imageId: ${imageId})`);
          }
        }
      });
      if (Object.keys(characterMap).length > 0) {
        namedImages.characters = characterMap;
        console.log(`[buildSnapshotElements] Built character namedImages for ${modal.id}:`, characterMap);
      }
    }

    // Build background name -> imageUrl map
    if ((modal as any).backgroundNamesMap) {
      const backgroundMap: Record<string, string> = {};
      Object.entries((modal as any).backgroundNamesMap).forEach(([indexStr, name]) => {
        const index = parseInt(indexStr, 10);
        if (name && backgroundConnections[index]) {
          // Connection is FROM image TO storyboard, so imageId is c.from
          const imageId = backgroundConnections[index].from;
          let imageUrl: string | undefined = undefined;

          // First, try to get URL from the elements we've already built (image generators are processed earlier)
          const imageElement = elements[imageId];
          if (imageElement && imageElement.type === 'image-generator') {
            imageUrl = imageElement.meta?.generatedImageUrl ||
              imageElement.meta?.sourceImageUrl ||
              imageElement.meta?.generatedImageUrls?.[0] ||
              imageElement.meta?.url;
          }

          // Fallback to state if not found in elements
          if (!imageUrl) {
            const imageGen = state.imageGenerators.find(img => img.id === imageId);
            if (imageGen) {
              imageUrl = imageGen.generatedImageUrl ||
                (imageGen as any)?.sourceImageUrl ||
                (imageGen as any)?.generatedImageUrls?.[0] ||
                (imageGen as any)?.url;
            }
          }

          // Also try images array (uploaded images)
          if (!imageUrl) {
            const image = state.images.find(img => (img as any).elementId === imageId);
            imageUrl = image?.url || (image as any)?.firebaseUrl;
          }

          // Also check if it's in the elements as a regular image
          if (!imageUrl && imageElement && imageElement.type === 'image') {
            imageUrl = imageElement.meta?.url;
          }

          if (imageUrl) {
            backgroundMap[name as string] = imageUrl;
            console.log(`[buildSnapshotElements] Mapped background "${name}" to image URL: ${imageUrl.substring(0, 80)}...`);
          } else {
            console.warn(`[buildSnapshotElements] ⚠️ No image URL found for background "${name}" (imageId: ${imageId})`);
          }
        }
      });
      if (Object.keys(backgroundMap).length > 0) {
        namedImages.backgrounds = backgroundMap;
        console.log(`[buildSnapshotElements] Built background namedImages for ${modal.id}:`, backgroundMap);
      }
    }

    // Build props name -> imageUrl map
    if ((modal as any).propsNamesMap) {
      const propsMap: Record<string, string> = {};
      Object.entries((modal as any).propsNamesMap).forEach(([indexStr, name]) => {
        const index = parseInt(indexStr, 10);
        console.log(`[buildSnapshotElements] Processing prop index ${index}, name: "${name}"`);
        console.log(`[buildSnapshotElements] propsConnections[${index}]:`, propsConnections[index]);

        if (name && propsConnections[index]) {
          // Connection is FROM image TO storyboard, so imageId is c.from
          const imageId = propsConnections[index].from;
          console.log(`[buildSnapshotElements] Looking for image with ID: ${imageId}`);
          console.log(`[buildSnapshotElements] Available imageGenerators IDs:`, state.imageGenerators.map(g => g.id));
          console.log(`[buildSnapshotElements] Available elements keys:`, Object.keys(elements).filter(k => k.includes('image')));

          let imageUrl: string | undefined = undefined;

          // First, try to get URL from the elements we've already built (image generators are processed earlier)
          const imageElement = elements[imageId];
          if (imageElement) {
            console.log(`[buildSnapshotElements] Found imageElement in elements:`, {
              type: imageElement.type,
              hasMeta: !!imageElement.meta,
              generatedImageUrl: imageElement.meta?.generatedImageUrl ? `${imageElement.meta.generatedImageUrl.substring(0, 80)}...` : 'null',
            });
            if (imageElement.type === 'image-generator') {
              imageUrl = imageElement.meta?.generatedImageUrl ||
                imageElement.meta?.sourceImageUrl ||
                imageElement.meta?.generatedImageUrls?.[0] ||
                imageElement.meta?.url;
            } else if (imageElement.type === 'image') {
              imageUrl = imageElement.meta?.url;
            }
          }

          // Fallback to state if not found in elements
          if (!imageUrl) {
            const imageGen = state.imageGenerators.find(img => img.id === imageId);
            if (imageGen) {
              console.log(`[buildSnapshotElements] Found imageGen in state:`, {
                id: imageGen.id,
                generatedImageUrl: imageGen.generatedImageUrl ? `${imageGen.generatedImageUrl.substring(0, 80)}...` : 'null',
              });
              imageUrl = imageGen.generatedImageUrl ||
                (imageGen as any)?.sourceImageUrl ||
                (imageGen as any)?.generatedImageUrls?.[0] ||
                (imageGen as any)?.url;
            } else {
              console.warn(`[buildSnapshotElements] ImageGen not found in state.imageGenerators, trying state.images`);
            }
          }

          // Also try images array (uploaded images)
          if (!imageUrl) {
            const image = state.images.find(img => (img as any).elementId === imageId);
            if (image) {
              console.log(`[buildSnapshotElements] Found image in state.images:`, {
                elementId: (image as any).elementId,
                url: image.url ? `${image.url.substring(0, 80)}...` : 'null',
              });
            }
            imageUrl = image?.url || (image as any)?.firebaseUrl;
          }

          if (imageUrl) {
            propsMap[name as string] = imageUrl;
            console.log(`[buildSnapshotElements] ✅ Mapped prop "${name}" to image URL: ${imageUrl.substring(0, 80)}...`);
          } else {
            console.warn(`[buildSnapshotElements] ⚠️ No image URL found for prop "${name}" (imageId: ${imageId})`, {
              imageElementFound: !!imageElement,
              imageElementType: imageElement?.type,
              imageGenFound: !!state.imageGenerators.find(img => img.id === imageId),
              imageFound: !!state.images.find(img => (img as any).elementId === imageId),
              allImageGeneratorIds: state.imageGenerators.map(g => g.id),
            });
          }
        } else {
          console.warn(`[buildSnapshotElements] ⚠️ No connection found for prop index ${index} (name: "${name}")`, {
            hasName: !!name,
            hasConnection: !!propsConnections[index],
            propsConnectionsCount: propsConnections.length,
            propsConnections: propsConnections.map((c, i) => ({ index: i, from: c.from, to: c.to, toAnchor: c.toAnchor })),
          });
        }
      });
      if (Object.keys(propsMap).length > 0) {
        namedImages.props = propsMap;
        console.log(`[buildSnapshotElements] ✅ Built props namedImages for ${modal.id}:`, propsMap);
      } else {
        console.warn(`[buildSnapshotElements] ⚠️ No props mapped for ${modal.id}`, {
          propsNamesMap: (modal as any).propsNamesMap,
          propsConnectionsCount: propsConnections.length,
        });
      }
    }

    // Add namedImages to meta if it has any data
    if (Object.keys(namedImages).length > 0) {
      metaObj.namedImages = namedImages;
      console.log(`[buildSnapshotElements] ✅ Added namedImages to storyboard ${modal.id}:`, {
        characters: Object.keys(namedImages.characters || {}).length,
        backgrounds: Object.keys(namedImages.backgrounds || {}).length,
        props: Object.keys(namedImages.props || {}).length,
        fullObject: namedImages,
      });
    } else {
      console.warn(`[buildSnapshotElements] ⚠️ No namedImages built for storyboard ${modal.id}`, {
        hasCharacterNamesMap: !!(modal as any).characterNamesMap,
        hasBackgroundNamesMap: !!(modal as any).backgroundNamesMap,
        hasPropsNamesMap: !!(modal as any).propsNamesMap,
        characterConnectionsCount: characterConnections.length,
        backgroundConnectionsCount: backgroundConnections.length,
        propsConnectionsCount: propsConnections.length,
      });
    }

    // Attach any connections originating from this element into its meta
    if (connectionsBySource[modal.id] && connectionsBySource[modal.id].length) {
      metaObj.connections = connectionsBySource[modal.id];
    }
    elements[modal.id] = {
      id: modal.id,
      type: 'storyboard-plugin',
      x: modal.x,
      y: modal.y,
      meta: metaObj,
    };
  });

  // Script frame generators
  state.scriptFrameGenerators.forEach((modal) => {
    if (!modal || !modal.id) return;
    const metaObj: any = {
      pluginId: modal.pluginId,
      frameWidth: modal.frameWidth || 360,
      frameHeight: modal.frameHeight || 260,
      text: modal.text || '',
    };
    if (connectionsBySource[modal.id] && connectionsBySource[modal.id].length) {
      metaObj.connections = connectionsBySource[modal.id];
    }
    elements[modal.id] = {
      id: modal.id,
      type: 'script-frame',
      x: modal.x,
      y: modal.y,
      meta: metaObj,
    };
  });

  // Scene frame generators
  state.sceneFrameGenerators.forEach((modal) => {
    if (!modal || !modal.id) return;
    const metaObj: any = {
      scriptFrameId: modal.scriptFrameId,
      sceneNumber: modal.sceneNumber,
      frameWidth: modal.frameWidth || 350,
      frameHeight: modal.frameHeight || 300,
      content: modal.content || '',
      characterIds: (modal as any).characterIds || undefined,
      locationId: (modal as any).locationId || undefined,
      mood: (modal as any).mood || undefined,
      characterNames: (modal as any).characterNames || undefined,
      locationName: (modal as any).locationName || undefined,
    };
    if (connectionsBySource[modal.id] && connectionsBySource[modal.id].length) {
      metaObj.connections = connectionsBySource[modal.id];
    }
    elements[modal.id] = {
      id: modal.id,
      type: 'scene-frame',
      x: modal.x,
      y: modal.y,
      meta: metaObj,
    };
  });

  // Text input overlays (generators) - persist current value
  state.textGenerators.forEach((t) => {
    elements[t.id] = { id: t.id, type: 'text-generator', x: t.x, y: t.y, meta: { value: t.value || '' } };
  });

  // Canvas text (rich text) elements - persist all properties
  if (state.canvasTextStates) {
    state.canvasTextStates.forEach((text) => {
      const metaObj: any = {
        text: text.text || '',
        fontSize: text.fontSize || 24,
        fontWeight: text.fontWeight || 'normal',
        fontStyle: text.fontStyle || 'normal',
        fontFamily: text.fontFamily || 'Inter, sans-serif',
        styleType: text.styleType || 'paragraph',
        textAlign: text.textAlign || 'left',
        color: text.color || '#ffffff',
        width: text.width || 300,
        height: text.height || 100,
      };
      // Attach any connections originating from this element into its meta
      if (connectionsBySource[text.id] && connectionsBySource[text.id].length) {
        metaObj.connections = connectionsBySource[text.id];
      }
      elements[text.id] = {
        id: text.id,
        type: 'canvas-text',
        x: text.x,
        y: text.y,
        meta: metaObj,
      };
    });
  }

  // Note: connectors are stored inside the source element's meta.connections (see connectionsBySource)
  // Also include connector elements as top-level elements so snapshots contain explicit connector records
  const connectorsToUseFinal = connectorsOverride ?? state.connectors;
  connectorsToUseFinal.forEach(c => {
    if (!c || !c.id) return;
    elements[c.id] = { id: c.id, type: 'connector', from: c.from, to: c.to, meta: { color: c.color || '#437eb5', fromAnchor: c.fromAnchor, toAnchor: c.toAnchor } };
  });

  return elements;
}

