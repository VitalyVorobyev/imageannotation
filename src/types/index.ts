export type Tool = "select" | "pan" | "rect" | "poly" | "bezier" | "point";

export type Point = { x: number; y: number };

export type BaseShape = {
    id: string;
    name?: string;
    stroke?: string;
    fill?: string;
    visible?: boolean;
};

export type RectShape = BaseShape & {
    type: "rect";
    x: number;
    y: number;
    w: number;
    h: number;
    r?: number; // border radius (optional)
    rotation?: number; // radians
};

export type PolylineShape = BaseShape & {
    type: "polyline";
    points: Point[];
    closed?: boolean;
    rotation?: number; // radians
};

// Cubic bezier path defined by anchors with optional handles
// Each node has p (anchor), and optional h1/h2 control handles.
// Adjacent nodes form segments: node[i].p --C(node[i].h2, node[i+1].h1)--> node[i+1].p
// If a handle is missing, it defaults to the anchor (straight line to next).
export type BezierNode = { p: Point; h1?: Point; h2?: Point };

export type BezierShape = BaseShape & {
    type: "bezier";
    nodes: BezierNode[]; // at least 2 anchors
    closed?: boolean;
    rotation?: number; // radians
};

export type PointShape = BaseShape & {
    type: "point";
    p: Point;
};

export type Shape = RectShape | PolylineShape | BezierShape | PointShape;

// JSON Bundle Schema
export type AnnotationBundle = {
    version: number;
    image?: {
        name?: string;
        width?: number;
        height?: number;
        dataUrl?: string; // embedded base64 image (optional)
    };
    shapes: Shape[];
};

export type DragState =
    | null
    | {
        kind:
            | "move-shape"
            | "rect-corner"
            | "rect-edge"
            | "poly-vertex"
            | "bezier-anchor"
            | "bezier-h1"
            | "bezier-h2"
            | "rotate";
        shapeId: string;
        index?: number; // vertex/node index
        edge?: string; // identifies which rect edge or corner is dragged
        startMouseImg: Point;
        startShape: Shape;
    };

export type HitTestResult =
    | null
    | {
        shape: Shape;
        kind:
            | "move-shape"
            | "rect-corner"
            | "rect-edge"
            | "poly-vertex"
            | "bezier-anchor"
            | "bezier-h1"
            | "bezier-h2"
            | "rotate";
        index?: number;
        edge?: string;
    };
