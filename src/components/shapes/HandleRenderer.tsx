import React from 'react';
import { type Point } from '../../types';

interface HandleRendererProps {
    point: Point;
    imageToScreen: (p: Point) => Point;
    type: "rect" | "poly" | "bezier-anchor" | "bezier-h1" | "bezier-h2" | "rotate";
    label?: string;
    index?: number;
    smaller?: boolean;
};

const HandleRenderer: React.FC<HandleRendererProps> = ({
    point,
    imageToScreen,
    type,
    label,
    index,
    smaller = false
}) => {
    const screenPoint = imageToScreen(point);
    const handleSize = smaller ? 4 : 6;

    // Different handle styles based on the type
    switch (type) {
        case "bezier-anchor":
            return (
                <circle
                    cx={screenPoint.x}
                    cy={screenPoint.y}
                    r={handleSize}
                    fill="#ffffff"
                    stroke="#0ea5e9"
                    strokeWidth={2}
                    data-handle-type={type}
                    data-index={index}
                />
            );

        case "bezier-h1":
        case "bezier-h2":
            return (
                <circle
                    cx={screenPoint.x}
                    cy={screenPoint.y}
                    r={handleSize}
                    fill="#ffffff"
                    stroke="#a855f7"
                    strokeWidth={2}
                    data-handle-type={type}
                    data-index={index}
                />
            );

        case "rotate":
            return (
                <circle
                    cx={screenPoint.x}
                    cy={screenPoint.y}
                    r={handleSize + 2}
                    fill="#ffffff"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    data-handle-type={type}
                />
            );
        case "rect":
        case "poly":
        default:
            return (
                <rect
                    x={screenPoint.x - handleSize}
                    y={screenPoint.y - handleSize}
                    width={handleSize * 2}
                    height={handleSize * 2}
                    fill="#ffffff"
                    stroke="#0ea5e9"
                    strokeWidth={2}
                    rx={2}
                    data-handle-type={type}
                    data-label={label}
                    data-index={index}
                />
            );
    }
};

export default HandleRenderer;
