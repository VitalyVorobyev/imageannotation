import React from 'react';
import { type Shape, type Point } from '../../types';
import RectRenderer from './RectRenderer';
import PolylineRenderer from './PolylineRenderer';
import BezierRenderer from './BezierRenderer';
import PointRenderer from './PointRenderer';

interface ShapeRendererProps {
    shape: Shape;
    zoom: number;
    pan: Point;
    selected: boolean;
    imageToScreen: (p: Point) => Point;
};

const ShapeRenderer: React.FC<ShapeRendererProps> = ({
    shape,
    zoom,
    pan,
    selected,
    imageToScreen
}) => {
    // Skip rendering if shape is explicitly set to not visible
    if (shape.visible === false) return null;

    // Render the appropriate component based on shape type
    switch (shape.type) {
    case "rect":
        return (
            <RectRenderer
                shape={shape}
                zoom={zoom}
                selected={selected}
                imageToScreen={imageToScreen}
            />
        );

    case "polyline":
        return (
            <PolylineRenderer
                shape={shape}
                selected={selected}
                imageToScreen={imageToScreen}
            />
        );

    case "bezier":
      return (
            <BezierRenderer
                shape={shape}
                zoom={zoom}
                pan={pan}
                selected={selected}
                imageToScreen={imageToScreen}
            />
        );

    case "point":
        return (
            <PointRenderer
                shape={shape}
                imageToScreen={imageToScreen}
            />
        );

    default:
        return null;
    }
};

export default ShapeRenderer;
