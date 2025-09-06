import React from 'react';
import { type BezierShape, type Point, type PolylineShape, type RectShape, type Shape, type PointShape } from '../../types';
import ShapeRenderer from '../shapes/ShapeRenderer';
import DraftShapeRenderer from '../shapes/DraftShapeRenderer';
import PointRenderer from '../shapes/PointRenderer';
import styles from './AnnotationOverlay.module.css';

interface AnnotationOverlayProps {
    shapes: Shape[];
    detections: PointShape[];
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
    detections,
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
            className={styles.overlay}
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

            {/* Detected features (non-interactive) */}
            {detections.length > 0 && (
                <g style={{ pointerEvents: 'none' }}>
                    {detections.map(pt => (
                        <PointRenderer key={pt.id} shape={pt} imageToScreen={imageToScreen} readOnly />
                    ))}
                </g>
            )}

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
