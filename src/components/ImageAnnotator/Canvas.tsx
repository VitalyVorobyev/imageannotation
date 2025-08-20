import React, { useRef, useEffect } from 'react';
import { type BezierShape, type Point, type PolylineShape, type RectShape, type Shape } from '../../types';
import AnnotationOverlay from './AnnotationOverlay';

interface CanvasProps {
    image: HTMLImageElement | null;
    zoom: number;
    pan: Point;
    shapes: Shape[];
    selectedId: string | null;
    draftRect: RectShape | null;
    draftPoly: PolylineShape | null;
    draftBezier: BezierShape | null;
    hover: { id: string | null; handle?: string} | null;
    width: number;
    height: number;
    onPointerDown: (e: React.PointerEvent) => void;
    onPointerMove: (e: React.PointerEvent) => void;
    onPointerUp: (e: React.PointerEvent) => void;
    onWheel: (e: React.WheelEvent) => void;
    onDragOver: (e: React.DragEvent) => void;
    onDrop: (e: React.DragEvent) => void;
};

const Canvas = ({
    image,
    zoom,
    pan,
    shapes,
    selectedId,
    draftRect,
    draftPoly,
    draftBezier,
    width,
    height,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onWheel,
    onDragOver,
    onDrop
}: CanvasProps) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // Draw image on canvas each frame (image, zoom, pan, size)
    useEffect(() => {
        const cvs = canvasRef.current;
        if (!cvs) return;
        const ctx = cvs.getContext("2d");
        if (!ctx) return;

        const dpr = window.devicePixelRatio || 1;
        cvs.width = width * dpr;
        cvs.height = height * dpr;
        cvs.style.width = `${width}px`;
        cvs.style.height = `${height}px`;
        ctx.scale(dpr, dpr);

        ctx.clearRect(0, 0, width, height);
        if (!image) return;

        const iw = image.naturalWidth;
        const ih = image.naturalHeight;
        // Map image -> screen: screen = image * zoom + pan
        const x = pan.x;
        const y = pan.y;
        const w = iw * zoom;
        const h = ih * zoom;
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(image, 0, 0, iw, ih, x, y, w, h);
    }, [image, zoom, pan, width, height]);

    return (
        <div
            ref={containerRef}
            className="relative flex-1 bg-neutral-900 overflow-hidden"
            onWheel={onWheel}
            onDragOver={onDragOver}
            onDrop={onDrop}
        >
            <canvas ref={canvasRef} className="absolute inset-0" />
            <AnnotationOverlay
                shapes={shapes}
                selectedId={selectedId}
                draftRect={draftRect}
                draftPoly={draftPoly}
                draftBezier={draftBezier}
                zoom={zoom}
                pan={pan}
                width={width}
                height={height}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
            />

            {/* Hint overlay */}
            <div className="absolute bottom-2 left-2 text-xs text-white/80 bg-black/40 rounded-md px-2 py-1">
                <span className="mr-3">Space: pan</span>
                <span className="mr-3">Wheel: zoom</span>
                <span className="mr-3">Enter: finish</span>
                <span className="mr-3">Del: delete</span>
                <span>Shift+Arrows: fast nudge</span>
            </div>
        </div>
    );
};

export default Canvas;
