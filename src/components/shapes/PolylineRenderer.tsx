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
            <polyline
                points={pointsStr}
                fill={shape.closed ? (shape.fill || "rgba(34,197,94,0.08)") : "none"}
                stroke={shape.stroke || "#22c55e"}
                strokeWidth={2}
                strokeLinejoin="round"
                strokeLinecap="round"
                className={shape.closed ? 'closed' : ''}
            />

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
