import React from 'react';

import { type PolylineShape, type Point } from '../../types';
import { getShapeBounds, getShapeCenter } from '../../utils/shapeHelpers';
import HandleRenderer from './HandleRenderer';

interface PolylineRendererProps {
    shape: PolylineShape;
    selected: boolean;
    imageToScreen: (p: Point) => Point;
};

const PolylineRenderer: React.FC<PolylineRendererProps> = ({
    shape,
    selected,
    imageToScreen
}) => {
    const bounds = getShapeBounds(shape);
    const center = getShapeCenter(shape);
    const centerScreen = imageToScreen(center);
    const rotation = shape.rotation ?? 0;
    const deg = (rotation * 180) / Math.PI;
    const screenPoints = shape.points.map(imageToScreen);
    const pointsStr = screenPoints.map(p => `${p.x},${p.y}`).join(' ');
    const topCenter = { x: center.x, y: bounds.y };
    const rotHandle = { x: center.x, y: bounds.y - 20 };
    const topCenterScreen = imageToScreen(topCenter);
    const rotHandleScreen = imageToScreen(rotHandle);

    return (
        <g transform={`rotate(${deg} ${centerScreen.x} ${centerScreen.y})`}>
            {shape.closed ? (
                <polygon
                    points={pointsStr}
                    fill={shape.fill || "rgba(34,197,94,0.08)"}
                    stroke={shape.stroke || "#22c55e"}
                    strokeWidth={2}
                    strokeLinejoin="round"
                    strokeLinecap="round"
                    className="closed"
                />
            ) : (
                <polyline
                    points={pointsStr}
                    fill="none"
                    stroke={shape.stroke || "#22c55e"}
                    strokeWidth={2}
                    strokeLinejoin="round"
                    strokeLinecap="round"
                />
            )}

            {selected && (
                <>
                    {shape.points.map((point, i) => (
                        <HandleRenderer
                            key={`${shape.id}-vertex-${i}`}
                            point={point}
                            imageToScreen={imageToScreen}
                            type="poly"
                            index={i}
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

export default PolylineRenderer;
