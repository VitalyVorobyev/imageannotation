import React from 'react';

import { type PolylineShape, type Point } from '../../types';
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
    const screenPoints = shape.points.map(imageToScreen);
    const pointsStr = screenPoints.map(p => `${p.x},${p.y}`).join(' ');

    return (
        <>
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

            {selected && shape.points.map((point, i) => (
                <HandleRenderer
                    key={`${shape.id}-vertex-${i}`}
                    point={point}
                    imageToScreen={imageToScreen}
                    type="poly"
                    index={i}
                />
            ))}
        </>
    );
};

export default PolylineRenderer;
