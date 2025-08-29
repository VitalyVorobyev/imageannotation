import React, { useState } from 'react';
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
    const [hover, setHover] = useState(false);
    const [showCoords, setShowCoords] = useState(false);

    const tooltipText = showCoords
        ? (shape.world
            ? `${shape.world.x.toFixed(2)}, ${shape.world.y.toFixed(2)}, ${shape.world.z.toFixed(2)}`
            : `${shape.p.x.toFixed(2)}, ${shape.p.y.toFixed(2)}`)
        : `ID: ${shape.interestId}`;

    const padding = 4;
    const width = tooltipText.length * 6 + padding * 2;
    const height = 16;
    const tooltipX = screenPoint.x + 6;
    const tooltipY = screenPoint.y - height - 6;

    return (
        <g
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => { setHover(false); setShowCoords(false); }}
            onClick={() => setShowCoords(prev => !prev)}
            style={{ cursor: 'pointer' }}
        >
            <circle
                cx={screenPoint.x}
                cy={screenPoint.y}
                r={4}
                fill={shape.fill || "#f43f5e"}
                stroke={shape.stroke || "#ffffff"}
                strokeWidth={2}
            />
            {hover && (
                <g transform={`translate(${tooltipX}, ${tooltipY})`}>
                    <rect
                        width={width}
                        height={height}
                        rx={4}
                        fill="#ffffff"
                        stroke="#333333"
                    />
                    <text
                        x={padding}
                        y={height / 2}
                        fontSize={12}
                        fill="#111111"
                        alignmentBaseline="middle"
                    >
                        {tooltipText}
                    </text>
                </g>
            )}
        </g>
    );
};

export default PointRenderer;
