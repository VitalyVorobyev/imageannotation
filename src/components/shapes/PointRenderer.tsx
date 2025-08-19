import React from 'react';
import { type PointShape, type Point } from '../../types';

interface PointRendererProps {
    shape: PointShape;
    imageToScreen: (p: Point) => Point;
};

const PointRenderer: React.FC<PointRendererProps> = ({
    shape,
    imageToScreen
}) => {
    const screenPoint = imageToScreen(shape.p);

    return (
        <circle
            cx={screenPoint.x}
            cy={screenPoint.y}
            r={4}
            fill={shape.fill || "#f43f5e"}
            stroke={shape.stroke || "#ffffff"}
            strokeWidth={2}
        />
    );
};

export default PointRenderer;
