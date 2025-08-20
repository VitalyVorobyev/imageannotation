import { type BezierShape, type Point, type RectShape, type Shape } from '../types';

export const genId = (): string => {
    return Math.random().toString(36).slice(2, 10);
};

export const dist2 = (a: Point, b: Point): number => {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    return dx * dx + dy * dy;
};

export const rotatePoint = (p: Point, center: Point, angle: number): Point => {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const dx = p.x - center.x;
    const dy = p.y - center.y;
    return {
        x: center.x + dx * cos - dy * sin,
        y: center.y + dx * sin + dy * cos,
    };
};

export const pointToSegDist2 = (p: Point, a: Point, b: Point): number => {
    const l2 = dist2(a, b);
    if (l2 === 0) return dist2(p, a);
    let t = ((p.x - a.x) * (b.x - a.x) + (p.y - a.y) * (b.y - a.y)) / l2;
    t = clamp(t, 0, 1);
    const proj = { x: a.x + t * (b.x - a.x), y: a.y + t * (b.y - a.y) };
    return dist2(p, proj);
}

// Approximate distance from point to cubic bezier by sampling
export const pointToCubicDist2 = (p: Point, p0: Point, c1: Point, c2: Point, p1: Point): number => {
    const SAMPLES = 24;
    let minD2 = Infinity;
    let prev = p0;
    for (let i = 1; i <= SAMPLES; i++) {
        const t = i / SAMPLES;
        const mt = 1 - t;
        const x =
            mt * mt * mt * p0.x +
            3 * mt * mt * t * c1.x +
            3 * mt * t * t * c2.x +
            t * t * t * p1.x;
        const y =
            mt * mt * mt * p0.y +
            3 * mt * mt * t * c1.y +
            3 * mt * t * t * c2.y +
            t * t * t * p1.y;
        const cur = { x, y };
        const d2 = pointToSegDist2(p, prev, cur);
        if (d2 < minD2) minD2 = d2;
        prev = cur;
    }
    return minD2;
};

export const toPathD = (nodes: BezierShape["nodes"], closed?: boolean): string => {
    if (!nodes.length) return "";
    const [first, ...rest] = nodes;
    let d = `M ${first.p.x} ${first.p.y}`;
    for (let i = 0; i < rest.length; i++) {
        const prev = nodes[i];
        const cur = nodes[i + 1];
        const c1 = prev.h2 ?? prev.p;
        const c2 = cur.h1 ?? cur.p;
        d += ` C ${c1.x} ${c1.y} ${c2.x} ${c2.y} ${cur.p.x} ${cur.p.y}`;
    }
    if (closed && nodes.length > 2) {
        const last = nodes[nodes.length - 1];
        const c1 = last.h2 ?? last.p;
        const c2 = first.h1 ?? first.p;
        d += ` C ${c1.x} ${c1.y} ${c2.x} ${c2.y} ${first.p.x} ${first.p.y} Z`;
    }
    return d;
};

export const normalizeRect = (r: RectShape): RectShape => {
    let { x, y, w, h } = r;
    if (w < 0) {
        x = x + w;
        w = -w;
    }
    if (h < 0) {
        y = y + h;
        h = -h;
    }
    return { ...r, x, y, w, h };
};

export const moveShapeBy = (s: Shape, dx: number, dy: number): Shape => {
    switch (s.type) {
    case "rect":
        return { ...s, x: s.x + dx, y: s.y + dy };
    case "polyline":
        return {
            ...s,
            points: s.points.map((p) => ({ x: p.x + dx, y: p.y + dy }))
        };
    case "bezier":
        return {
            ...s,
            nodes: s.nodes.map((n) => ({
                p: { x: n.p.x + dx, y: n.p.y + dy },
                h1: n.h1 ? { x: n.h1.x + dx, y: n.h1.y + dy } : undefined,
                h2: n.h2 ? { x: n.h2.x + dx, y: n.h2.y + dy } : undefined,
            })),
        };
    case "point":
        return { ...s, p: { x: s.p.x + dx, y: s.p.y + dy } };
    }
};

export const getShapeBounds = (s: Shape): RectShape => {
    switch (s.type) {
    case "rect":
        return normalizeRect(s);
    case "polyline": {
        const xs = s.points.map(p => p.x);
        const ys = s.points.map(p => p.y);
        const minX = Math.min(...xs);
        const minY = Math.min(...ys);
        const maxX = Math.max(...xs);
        const maxY = Math.max(...ys);
        return { type: "rect", id: "", x: minX, y: minY, w: maxX - minX, h: maxY - minY } as RectShape;
    }
    case "bezier": {
        const pts = s.nodes.map(n => n.p);
        const xs = pts.map(p => p.x);
        const ys = pts.map(p => p.y);
        const minX = Math.min(...xs);
        const minY = Math.min(...ys);
        const maxX = Math.max(...xs);
        const maxY = Math.max(...ys);
        return { type: "rect", id: "", x: minX, y: minY, w: maxX - minX, h: maxY - minY } as RectShape;
    }
    case "point":
        return { type: "rect", id: "", x: s.p.x, y: s.p.y, w: 0, h: 0 } as RectShape;
    }
};

export const getShapeCenter = (s: Shape): Point => {
    const b = getShapeBounds(s);
    return { x: b.x + b.w / 2, y: b.y + b.h / 2 };
};

// Convert an SVG path in image coords to a path in screen coords
export const pathToScreen = (dImg: string, zoom: number, pan: Point): string => {
    // Very small parser: convert all numbers (sequence of floats) pair-wise applying transform.
    const tokens = dImg.match(/[a-zA-Z]|-?\d*\.?\d+(?:e[-+]?\d+)?/g) || [];
    const out: string[] = [];
    let i = 0;
    let mode: string | null = null;

    const imageToScreen = (p: Point): Point => ({
        x: p.x * zoom + pan.x,
        y: p.y * zoom + pan.y
    });

    while (i < tokens.length) {
        const t = tokens[i++];
        if (/^[a-zA-Z]$/.test(t)) {
            mode = t;
            out.push(t);
        } else {
            // number: push it back one and read required pairs for current mode
            i--;
            const needsPairs = new Set(["M", "L", "C", "S", "Q", "T"]); // uppercase only since we output uppercase
            if (mode && needsPairs.has(mode)) {
                if (mode === "C") {
                    for (let k = 0; k < 3; k++) {
                        const x = parseFloat(tokens[i++]);
                        const y = parseFloat(tokens[i++]);
                        const s = imageToScreen({ x, y });
                        out.push(String(s.x), String(s.y));
                    }
                } else {
                    const x = parseFloat(tokens[i++]);
                    const y = parseFloat(tokens[i++]);
                    const s = imageToScreen({ x, y });
                    out.push(String(s.x), String(s.y));
                }
            } else {
                // Z or unknown: just copy
                out.push(t);
            }
        }
    }
    return out.join(" ");
};

export const clamp = (v: number, a: number, b: number): number => {
    return Math.min(Math.max(v, a), b);
};
