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
    const canvasImage = images.find((img) => {
      const imgId = img.elementId || (img as any).id;
      return imgId === conn.from;
    });
    if (canvasImage?.url) {
      return normalizeCanvasMediaUrl(canvasImage.url);
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
      const canvasImage = images.find((img) => {
        const imgId = img.elementId || (img as any).id;
        return imgId === c.from;
      });
      if (canvasImage?.url) {
        const u = normalizeCanvasMediaUrl(canvasImage.url);
        if (u) out.push(u);
      }
    }
    return out;
  }, [id, connections, imageModalStates, images, toAnchor]);
}

