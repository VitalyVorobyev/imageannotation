import React from 'react';
import { type BezierShape, type Point, type PolylineShape, type RectShape, type Shape } from '../../types';
import ShapeRenderer from '../shapes/ShapeRenderer';
import DraftShapeRenderer from '../shapes/DraftShapeRenderer';

interface AnnotationOverlayProps {
    shapes: Shape[];
    selectedId: string | null;
    draftRect: RectShape | null;
    draftPoly: PolylineShape | null;
    draftBezier: BezierShape | null;
    zoom: number;
    pan: Point;
    width: number;
    height: number;
    onPointerDown: (e: React.PointerEvent) => void;
    onPointerMove: (e: React.PointerEvent) => void;
    onPointerUp: (e: React.PointerEvent) => void;
};

const AnnotationOverlay = ({
    shapes,
    selectedId,
    draftRect,
    draftPoly,
    draftBezier,
    zoom,
    pan,
    width,
    height,
    onPointerDown,
    onPointerMove,
    onPointerUp
}: AnnotationOverlayProps) => {
    // Helper to convert image coords to screen coords
    const imageToScreen = (p: Point): Point => ({
        x: p.x * zoom + pan.x,
        y: p.y * zoom + pan.y
    });

    return (
        <svg
            className="absolute inset-0 pointer-events-auto"
            width={width}
            height={height}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
        >
            {/* Draft shapes */}
            <DraftShapeRenderer
                draftRect={draftRect}
                draftPoly={draftPoly}
                draftBezier={draftBezier}
                zoom={zoom}
                pan={pan}
                imageToScreen={imageToScreen}
            />

            {/* Committed shapes */}
            {shapes.map(shape => (
                <ShapeRenderer
                    key={shape.id}
                    shape={shape}
                    zoom={zoom}
                    pan={pan}
                    selected={shape.id === selectedId}
                    imageToScreen={imageToScreen}
                />
            ))}
        </svg>
    );
};

export default AnnotationOverlay;
