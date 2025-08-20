import { type HitTestResult, type Point, type Shape } from '../types';
import { dist2, normalizeRect, pointToCubicDist2, pointToSegDist2, rotatePoint, getShapeCenter, getShapeBounds } from './shapeHelpers';

const hitTest = (
    imgPt: Point,
    tol: number,
    shapes: Shape[]
): HitTestResult => {
    // Prioritize handles first
    const byZ = [...shapes]; // simple order
    for (const s of byZ.slice().reverse()) {
        if (s.type === "rect") {
            const r = normalizeRect(s);
            const center = { x: r.x + r.w / 2, y: r.y + r.h / 2 };
            const pt = rotatePoint(imgPt, center, -(s.rotation ?? 0));
            const rotHandle = { x: center.x, y: r.y - 20 };
            if (dist2(pt, rotHandle) <= tol * tol) {
                return { shape: s, kind: "rotate" };
            }
            const corners: [Point, string][] = [
                [{ x: r.x, y: r.y }, "left top"],
                [{ x: r.x + r.w, y: r.y }, "right top"],
                [{ x: r.x, y: r.y + r.h }, "left bottom"],
                [{ x: r.x + r.w, y: r.y + r.h }, "right bottom"],
            ];
            for (const [c, label] of corners) {
                if (dist2(pt, c) <= tol * tol) {
                    return { shape: s, kind: "rect-corner", edge: label };
                }
            }
            const edges: [Point, Point, string][] = [
                [{ x: r.x, y: r.y }, { x: r.x + r.w, y: r.y }, "top"],
                [{ x: r.x, y: r.y + r.h }, { x: r.x + r.w, y: r.y + r.h }, "bottom"],
                [{ x: r.x, y: r.y }, { x: r.x, y: r.y + r.h }, "left"],
                [{ x: r.x + r.w, y: r.y }, { x: r.x + r.w, y: r.y + r.h }, "right"],
            ];
            for (const [a, b, edge] of edges) {
                if (pointToSegDist2(pt, a, b) <= tol * tol) {
                    return { shape: s, kind: "rect-edge", edge };
                }
            }
            if (pt.x >= r.x && pt.x <= r.x + r.w && pt.y >= r.y && pt.y <= r.y + r.h) {
                return { shape: s, kind: "move-shape" };
            }
        } else if (s.type === "polyline") {
            const center = getShapeCenter(s);
            const pt = rotatePoint(imgPt, center, -(s.rotation ?? 0));
            const bounds = getShapeBounds(s);
            const rotHandle = { x: center.x, y: bounds.y - 20 };
            if (dist2(pt, rotHandle) <= tol * tol) {
                return { shape: s, kind: "rotate" };
            }
            for (let i = 0; i < s.points.length; i++) {
                if (dist2(pt, s.points[i]) <= tol * tol) {
                    return { shape: s, kind: "poly-vertex", index: i };
                }
            }
            for (let i = 0; i < s.points.length - 1; i++) {
                if (pointToSegDist2(pt, s.points[i], s.points[i + 1]) <= tol * tol) {
                    return { shape: s, kind: "move-shape" };
                }
            }
        } else if (s.type === "bezier") {
            const center = getShapeCenter(s);
            const pt = rotatePoint(imgPt, center, -(s.rotation ?? 0));
            const bounds = getShapeBounds(s);
            const rotHandle = { x: center.x, y: bounds.y - 20 };
            if (dist2(pt, rotHandle) <= tol * tol) {
                return { shape: s, kind: "rotate" };
            }
            for (let i = 0; i < s.nodes.length; i++) {
                const n = s.nodes[i];
                if (dist2(pt, n.p) <= tol * tol) {
                    return { shape: s, kind: "bezier-anchor", index: i };
                }
                if (n.h1 && dist2(pt, n.h1) <= tol * tol) {
                    return { shape: s, kind: "bezier-h1", index: i };
                }
                if (n.h2 && dist2(pt, n.h2) <= tol * tol) {
                    return { shape: s, kind: "bezier-h2", index: i };
                }
            }
            for (let i = 0; i < s.nodes.length - 1; i++) {
                const a = s.nodes[i];
                const b = s.nodes[i + 1];
                if (pointToCubicDist2(pt, a.p, a.h2 ?? a.p, b.h1 ?? b.p, b.p) <= tol * tol) {
                    return { shape: s, kind: "move-shape" };
                }
            }
        } else if (s.type === "point") {
            if (dist2(imgPt, s.p) <= (tol * 1.5) * (tol * 1.5)) {
                return { shape: s, kind: "move-shape" };
            }
        }
    }
    return null;
};

export default hitTest;
