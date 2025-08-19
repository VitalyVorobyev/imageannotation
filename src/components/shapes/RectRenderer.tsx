import React from 'react';

import { type RectShape, type Point } from '../../types';
import { normalizeRect } from '../../utils/shapeHelpers';
import HandleRenderer from './HandleRenderer';

interface RectRendererProps {
  shape: RectShape;
  zoom: number;
  selected: boolean;
  imageToScreen: (p: Point) => Point;
}

const RectRenderer: React.FC<RectRendererProps> = ({
    shape,
    zoom,
    selected,
    imageToScreen
}) => {
    const r = normalizeRect(shape);
    const a = imageToScreen({ x: r.x, y: r.y });

    // Generate corner points in image space
    const corners: Point[] = [
        { x: r.x, y: r.y },               // top-left
        { x: r.x + r.w, y: r.y },         // top-right
        { x: r.x, y: r.y + r.h },         // bottom-left
        { x: r.x + r.w, y: r.y + r.h }    // bottom-right
    ];

    // Labels for corner handles (used to identify which corner is being dragged)
    const cornerLabels = ["left top", "right top", "left bottom", "right bottom"];

    return (
        <>
            <rect
                x={a.x}
                y={a.y}
                width={r.w * zoom}
                height={r.h * zoom}
                fill={shape.fill || "rgba(59,130,246,0.08)"}
                stroke={shape.stroke || "#3b82f6"}
                strokeWidth={2}
                rx={shape.r ? shape.r * zoom : 0}
            />

            {selected && (
            <>
                {corners.map((corner, i) => (
                    <HandleRenderer
                        key={`${shape.id}-corner-${i}`}
                        point={corner}
                        imageToScreen={imageToScreen}
                        type="rect"
                        label={cornerLabels[i]}
                    />
                ))}
            </>
            )}
        </>
    );
};

export default RectRenderer;
