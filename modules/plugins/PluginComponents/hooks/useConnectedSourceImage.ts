'use client';

import { useMemo } from 'react';
import { normalizeCanvasMediaUrl } from '../utils/mediaUrl';

type Connection = {
  from: string;
  to: string;
  toAnchor?: string;
};

type ImageModalState = {
  id: string;
  generatedImageUrl?: string | null;
};

type CanvasImage = {
  elementId?: string;
  id?: string;
  url?: string | null;
  originalUrl?: string | null;  // Original format URL for processing
};

export function useConnectedSourceImage(args: {
  id?: string;
  connections?: Connection[];
  imageModalStates?: ImageModalState[];
  images?: CanvasImage[];
  toAnchor?: string;
}) {
  const { id, connections = [], imageModalStates = [], images = [], toAnchor } = args;

  return useMemo(() => {
    if (!id) return null;

    const conn = connections.find((c) => c.to === id && c.from && (toAnchor ? c.toAnchor === toAnchor : true));
    if (!conn) return null;

    // From image generator modal
    const sourceModal = imageModalStates.find((m) => m.id === conn.from);
    if (sourceModal?.generatedImageUrl) {
      return normalizeCanvasMediaUrl(sourceModal.generatedImageUrl);
    }

    // From canvas image
    const canvasImage = images.find((img, idx) => {
      const imgId = img.elementId || (img as any).id;
      return imgId === conn.from || `canvas-image-${idx}` === conn.from;
    });
    if (canvasImage?.url || canvasImage?.originalUrl) {
      // Use originalUrl for processing (original format), fallback to url (AVIF)
      const imageUrl = canvasImage.originalUrl || canvasImage.url;
      return normalizeCanvasMediaUrl(imageUrl!);
    }

    return null;
  }, [id, connections, imageModalStates, images, toAnchor]);
}

export function useConnectedSourceImages(args: {
  id?: string;
  connections?: Connection[];
  imageModalStates?: ImageModalState[];
  images?: CanvasImage[];
  toAnchor?: string;
}) {
  const { id, connections = [], imageModalStates = [], images = [], toAnchor } = args;

  return useMemo(() => {
    if (!id) return [] as string[];
    const conns = connections.filter((c) => c.to === id && c.from && (toAnchor ? c.toAnchor === toAnchor : true));
    const out: string[] = [];
    for (const c of conns) {
      const sourceModal = imageModalStates.find((m) => m.id === c.from);
      if (sourceModal?.generatedImageUrl) {
        const u = normalizeCanvasMediaUrl(sourceModal.generatedImageUrl);
        if (u) out.push(u);
        continue;
      }
      const canvasImage = images.find((img, idx) => {
        const imgId = img.elementId || (img as any).id;
        return imgId === c.from || `canvas-image-${idx}` === c.from;
      });
      if (canvasImage?.url || canvasImage?.originalUrl) {
        // Use originalUrl for processing (original format), fallback to url (AVIF)
        const imageUrl = canvasImage.originalUrl || canvasImage.url;
        const u = normalizeCanvasMediaUrl(imageUrl!);
        if (u) out.push(u);
      }
    }
    return out;
  }, [id, connections, imageModalStates, images, toAnchor]);
}

