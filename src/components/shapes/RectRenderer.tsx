import React from 'react';

import { type RectShape, type Point } from '../../types';
import { normalizeRect, getShapeCenter } from '../../utils/shapeHelpers';
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
    const center = getShapeCenter(r);
    const centerScreen = imageToScreen(center);
    const rotation = shape.rotation ?? 0;
    const deg = (rotation * 180) / Math.PI;
    const a = imageToScreen({ x: r.x, y: r.y });
    const topCenter = { x: center.x, y: r.y };
    const rotHandle = { x: center.x, y: r.y - 20 };
    const topCenterScreen = imageToScreen(topCenter);
    const rotHandleScreen = imageToScreen(rotHandle);

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
        <g transform={`rotate(${deg} ${centerScreen.x} ${centerScreen.y})`}>
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
                <line
                    x1={topCenterScreen.x}
                    y1={topCenterScreen.y}
                    x2={rotHandleScreen.x}
                    y2={rotHandleScreen.y}
                    stroke="#0ea5e9"
                    strokeWidth={2}
                />
                <HandleRenderer
                    point={rotHandle}
                    imageToScreen={imageToScreen}
                    type="rotate"
                />
            </>
            )}
        </g>
    );
};

export default RectRenderer;
