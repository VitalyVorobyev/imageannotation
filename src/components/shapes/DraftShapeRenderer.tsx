import React from 'react';
import { type RectShape, type PolylineShape, type BezierShape, type Point } from '../../types';
import RectRenderer from './RectRenderer';
import PolylineRenderer from './PolylineRenderer';
import BezierRenderer from './BezierRenderer';

interface DraftShapeRendererProps {
    draftRect: RectShape | null;
    draftPoly: PolylineShape | null;
    draftBezier: BezierShape | null;
    zoom: number;
    pan: Point;
    imageToScreen: (p: Point) => Point;
};

const DraftShapeRenderer: React.FC<DraftShapeRendererProps> = ({
    draftRect,
    draftPoly,
    draftBezier,
    zoom,
    pan,
    imageToScreen
}) => {
    return (
        <>
            {draftRect && (
                <RectRenderer
                    shape={draftRect}
                    zoom={zoom}
                    selected={true}
                    imageToScreen={imageToScreen}
                />
            )}

            {draftPoly && (
                <PolylineRenderer
                    shape={draftPoly}
                    selected={true}
                    imageToScreen={imageToScreen}
                />
            )}

            {draftBezier && (
                <BezierRenderer
                    shape={draftBezier}
                    zoom={zoom}
                    pan={pan}
                    selected={true}
                    imageToScreen={imageToScreen}
                />
            )}
        </>
    );
};

export default DraftShapeRenderer;
