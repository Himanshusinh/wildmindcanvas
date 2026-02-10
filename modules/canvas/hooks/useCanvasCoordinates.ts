
import { useCallback } from 'react';

interface Point {
    x: number;
    y: number;
}

interface UseCanvasCoordinatesProps {
    position: Point;
    scale: number;
}

export const useCanvasCoordinates = ({ position, scale }: UseCanvasCoordinatesProps) => {
    /**
     * Converts a screen coordinate (e.g. e.clientX, e.clientY) to a canvas coordinate.
     * This accounts for the canvas pan (position) and zoom (scale).
     */
    const screenToCanvas = useCallback(
        (screenPoint: Point): Point => {
            return {
                x: (screenPoint.x - position.x) / scale,
                y: (screenPoint.y - position.y) / scale,
            };
        },
        [position, scale]
    );

    /**
     * Converts a canvas coordinate to a screen coordinate.
     */
    const canvasToScreen = useCallback(
        (canvasPoint: Point): Point => {
            return {
                x: canvasPoint.x * scale + position.x,
                y: canvasPoint.y * scale + position.y,
            };
        },
        [position, scale]
    );

    /**
     * Helper to get screen pointer position from an event.
     * Handles MouseEvent and TouchEvent.
     * If element is provided, returns position relative to that element.
     */
    const getPointerPosition = useCallback(
        (
            evt: MouseEvent | TouchEvent | React.MouseEvent | React.TouchEvent | React.DragEvent,
            relativeToElement?: HTMLElement
        ): Point => {
            let clientX: number;
            let clientY: number;

            if ('touches' in evt && (evt as any).touches.length > 0) {
                clientX = (evt as any).touches[0].clientX;
                clientY = (evt as any).touches[0].clientY;
            } else if ('changedTouches' in evt && (evt as any).changedTouches.length > 0) {
                // For touchend
                clientX = (evt as any).changedTouches[0].clientX;
                clientY = (evt as any).changedTouches[0].clientY;
            } else if ('clientX' in evt) {
                clientX = (evt as MouseEvent).clientX;
                clientY = (evt as MouseEvent).clientY;
            } else {
                return { x: 0, y: 0 };
            }

            if (relativeToElement) {
                const rect = relativeToElement.getBoundingClientRect();
                return {
                    x: clientX - rect.left,
                    y: clientY - rect.top,
                };
            }

            return { x: clientX, y: clientY };
        },
        []
    );

    /**
     * Combined helper: Get event pointer -> Screen Coords -> Canvas Coords
     * Commonly used for drag-and-drop or clicking on canvas.
     * 
     * @param evt The mouse or touch event
     * @param relativeToElement Optional: if the "screen" coordinates should be relative to a container 
     *                          (e.g. the canvas container div) before converting. 
     *                          Usually for main canvas, we use absolute clientX/Y relative to window, 
     *                          so we might subtract a sidebar offset if the canvas isn't full screen.
     *                          But usually 'position' accounts for panning within the container.
     *                          If 'position' is (0,0) at top-left of specific div, we need relative pos.
     *                          If 'position' is global, we use global.
     *                          
     *                          Standard logic in this app seems to be:
     *                          (clientX - rect.left - position.x) / scale
     *                          So we MUST provide the rect (element) to get correct results.
     */
    const getCanvasPointFromEvent = useCallback(
        (
            evt: MouseEvent | TouchEvent | React.MouseEvent | React.TouchEvent | React.DragEvent,
            relativeToElement: HTMLElement
        ): Point => {
            const screenRel = getPointerPosition(evt, relativeToElement);
            return screenToCanvas(screenRel);
        },
        [getPointerPosition, screenToCanvas]
    );

    return {
        screenToCanvas,
        canvasToScreen,
        getPointerPosition,
        getCanvasPointFromEvent
    };
};
