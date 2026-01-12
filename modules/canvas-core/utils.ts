import { CanvasNode, NodeType } from './document';
import { nodeFromItem, imageToNode } from './adapters';

export function convertLegacySnapshot(elements: Record<string, any>): Record<string, CanvasNode> {
    const nodes: Record<string, CanvasNode> = {};

    Object.values(elements).forEach(e => {
        let node: CanvasNode;
        // Logic from page.tsx snapshot hydration
        if (['image', 'video', 'text', 'model3d'].includes(e.type)) {
            // Map to ImageUpload-like structure then to Node
            const source = e.meta || e.props || {};
            const imgLike = {
                type: e.type,
                url: source.url || source.mediaId || '',
                x: e.x, y: e.y,
                width: e.bounds?.width || e.width || 400,
                height: e.bounds?.height || e.height || 400,
                rotation: source.rotation || e.rotation || 0,
                elementId: e.id,
                ...source
            };
            node = imageToNode(imgLike as any);
        } else if (e.type === 'connector') {
            const source = e.meta || e.props || {};
            node = nodeFromItem({
                id: e.id,
                x: 0, y: 0,
                from: source.from,
                to: source.to,
                color: source.color,
                fromAnchor: source.fromAnchor,
                toAnchor: source.toAnchor,
                ...source
            }, 'connector');
        } else {
            // General mapper
            // Generator types often store meta in 'meta' field which is different from current 'props'
            // We need to flatten 'meta' into props?
            // Existing 'loadSnapshot' implementation:
            // setVideoGenerators(els.filter(...).map(e => ({ id: e.id, x: e.x, y: e.y, ...e.meta })));

            const exploded = {
                id: e.id,
                x: e.x,
                y: e.y,
                width: e.width || e.bounds?.width,
                height: e.height || e.bounds?.height,
                rotation: e.rotation,
                zIndex: e.zIndex,
                ...(e.meta || e.props || {})
            };

            const mappedType: NodeType = (e.type === 'video-editor-trigger')
                ? 'video-editor-plugin'
                : (e.type === 'image-editor-trigger')
                    ? 'image-editor-plugin'
                    : (e.type as NodeType);

            node = nodeFromItem(exploded, mappedType);
        }

        if (node) {
            nodes[node.id] = node;
        }
    });

    return nodes;
}
