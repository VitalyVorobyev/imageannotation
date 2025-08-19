import React from 'react';
import { type BezierShape, type Point } from '../../types';
import { toPathD, pathToScreen } from '../../utils/shapeHelpers';
import HandleRenderer from './HandleRenderer';

interface BezierRendererProps {
    shape: BezierShape;
    zoom: number;
    pan: Point;
    selected: boolean;
    imageToScreen: (p: Point) => Point;
};

const BezierRenderer: React.FC<BezierRendererProps> = ({
    shape,
    zoom,
    pan,
    selected,
    imageToScreen
}) => {
    // Generate SVG path string in image coordinates
    const pathInImageCoords = toPathD(shape.nodes, shape.closed);

    // Convert path to screen coordinates
    const pathInScreenCoords = pathToScreen(pathInImageCoords, zoom, pan);

    return (
        <>
            <path
                d={pathInScreenCoords}
                fill={shape.fill || "transparent"}
                stroke={shape.stroke || "#eab308"}
                strokeWidth={2}
                strokeLinejoin="round"
                strokeLinecap="round"
            />

            {selected && (
                <>
                {/* Draw lines between anchors and handles */}
                {shape.nodes.map((node, i) => (
                    <React.Fragment key={`${shape.id}-node-${i}`}>
                        {/* Handle lines */}
                        {node.h1 && (
                            <line
                                x1={imageToScreen(node.p).x}
                                y1={imageToScreen(node.p).y}
                                x2={imageToScreen(node.h1).x}
                                y2={imageToScreen(node.h1).y}
                                stroke="#9ca3af"
                                strokeWidth={1}
                                strokeDasharray="3,3"
                            />
                        )}
                        {node.h2 && (
                            <line
                                x1={imageToScreen(node.p).x}
                                y1={imageToScreen(node.p).y}
                                x2={imageToScreen(node.h2).x}
                                y2={imageToScreen(node.h2).y}
                                stroke="#9ca3af"
                                strokeWidth={1}
                                strokeDasharray="3,3"
                            />
                        )}
                        {/* Anchor point */}
                        <HandleRenderer
                            point={node.p}
                            imageToScreen={imageToScreen}
                            type="bezier-anchor"
                            index={i}
                        />
                        {/* Handle controls */}
                        {node.h1 && (
                            <HandleRenderer
                                point={node.h1}
                                imageToScreen={imageToScreen}
                                type="bezier-h1"
                                index={i}
                                smaller
                            />
                        )}
                        {node.h2 && (
                            <HandleRenderer
                                point={node.h2}
                                imageToScreen={imageToScreen}
                                type="bezier-h2"
                                index={i}
                                smaller
                            />
                        )}
                    </React.Fragment>
                ))}
                </>
            )}
        </>
    );
};

export default BezierRenderer;
