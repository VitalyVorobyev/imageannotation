import { type Point } from '../types';

export const screenToImage = (p: Point, zoom: number, pan: Point): Point => {
    return {
        x: (p.x - pan.x) / zoom,
        y: (p.y - pan.y) / zoom
    };
};

export const imageToScreen = (p: Point, zoom: number, pan: Point): Point => {
    return {
        x: p.x * zoom + pan.x,
        y: p.y * zoom + pan.y
    };
};

export const getMousePoint = (
    e: React.PointerEvent | PointerEvent
): Point => {
    const bounds = (e.currentTarget as Element).getBoundingClientRect();
    return {
        x: e.clientX - bounds.left,
        y: e.clientY - bounds.top,
    };
};

export const clamp = (v: number, a: number, b: number): number => {
    return Math.min(Math.max(v, a), b);
};

export const lerp = (a: number, b: number, t: number): number => {
    return a + (b - a) * t;
};
