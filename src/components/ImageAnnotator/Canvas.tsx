import React, { useRef, useEffect } from 'react';
import { type BezierShape, type Point, type PolylineShape, type RectShape, type Shape, type PointShape } from '../../types';
import AnnotationOverlay from './AnnotationOverlay';
import styles from './Canvas.module.css';

interface CanvasProps {
    image: HTMLImageElement | null;
    zoom: number;
    pan: Point;
    shapes: Shape[];
    selectedId: string | null;
    draftRect: RectShape | null;
    draftPoly: PolylineShape | null;
    draftBezier: BezierShape | null;
    detections: PointShape[];
    width: number;
    height: number;
    onPointerDown: (e: React.PointerEvent) => void;
    onPointerMove: (e: React.PointerEvent) => void;
    onPointerUp: (e: React.PointerEvent) => void;
    onWheel: (e: React.WheelEvent) => void;
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
    detections,
    width,
    height,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onWheel
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
        ctx.imageSmoothingEnabled = zoom < 1;
        ctx.imageSmoothingQuality = zoom < 1 ? "high" : "low";
        ctx.drawImage(image, 0, 0, iw, ih, x, y, w, h);
    }, [image, zoom, pan, width, height]);

    return (
        <div
            ref={containerRef}
            className={styles.container}
            onWheel={onWheel}
        >
            <canvas ref={canvasRef} className={styles.canvas} />
            <AnnotationOverlay
                shapes={shapes}
                detections={detections}
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
            <div className={styles.hint}>
                <span>Space: pan</span>
                <span>Wheel: zoom</span>
                <span>Enter: finish</span>
                <span>Del: delete</span>
                <span>Shift+Arrows: fast nudge</span>
            </div>
        </div>
    );
};

export default Canvas;
