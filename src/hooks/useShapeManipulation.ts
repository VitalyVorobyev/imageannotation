import { useRef, useState } from 'react';
import {
    type BezierShape,
    type DragState,
    type Point,
    type PointShape,
    type PolylineShape,
    type RectShape,
    type Shape
} from '../types';
import { genId, moveShapeBy, normalizeRect } from '../utils/shapeHelpers';
import hitTest from '../utils/hitTesting';

const useShapeManipulation = () => {
    const [shapes, setShapes] = useState<Shape[]>([]);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [draftRect, setDraftRect] = useState<RectShape | null>(null);
    const [draftPoly, setDraftPoly] = useState<PolylineShape | null>(null);
    const [draftBezier, setDraftBezier] = useState<BezierShape | null>(null);
    const [hover, setHover] = useState<{ id: string | null; handle?: string } | null>(null);
    const dragRef = useRef<DragState>(null);

    // Shape creation methods
    const createRect = (imgPt: Point) => {
        const r: RectShape = {
            id: genId(),
            type: "rect",
            x: imgPt.x,
            y: imgPt.y,
            w: 0,
            h: 0,
            stroke: "#38bdf8",
            fill: "rgba(56,189,248,0.12)",
        };
        setDraftRect(r);
        setSelectedId(r.id);
        return r;
    };

    const updateDraftRect = (imgPt: Point) => {
        if (!draftRect) return;
        const w = imgPt.x - draftRect.x;
        const h = imgPt.y - draftRect.y;
        setDraftRect({ ...draftRect, w, h });
    };

    const finalizeDraftRect = () => {
        if (!draftRect) return null;
        const r = normalizeRect(draftRect);
        if (Math.abs(r.w) > 1 && Math.abs(r.h) > 1) {
            setShapes((prev) => [...prev, r]);
            setDraftRect(null);
            return r;
        }
        setDraftRect(null);
        return null;
    };

    const createPolyline = (imgPt: Point) => {
        if (!draftPoly) {
            const poly: PolylineShape = {
                id: genId(),
                type: "polyline",
                points: [imgPt],
                stroke: "#22c55e",
            };
            setDraftPoly(poly);
            setSelectedId(poly.id);
            return poly;
        } else {
            const updated = {...draftPoly, points: [...draftPoly.points, imgPt] };
            setDraftPoly(updated);
            return updated;
        }
    };

    const finalizeDraftPoly = () => {
        if (draftPoly && draftPoly.points.length >= 2) {
            setShapes((prev) => [...prev, draftPoly]);
            const result = draftPoly;
            setDraftPoly(null);
            return result;
        }
        setDraftPoly(null);
        return null;
    };

    const createBezier = (imgPt: Point) => {
        if (!draftBezier) {
            const bz: BezierShape = {
                id: genId(),
                type: "bezier",
                nodes: [{ p: imgPt }],
                stroke: "#eab308",
                fill: "transparent",
            };
            setDraftBezier(bz);
            setSelectedId(bz.id);
            return bz;
        } else {
            const nodes = [...draftBezier.nodes, { p: imgPt }];
            // Initialize simple auto handles for smooth join
            if (nodes.length >= 2) {
                const i = nodes.length - 2;
                const a = nodes[i].p;
                const b = nodes[i + 1].p;
                const mid: Point = {
                    x: (a.x + b.x) / 2,
                    y: (a.y + b.y) / 2
                };
                nodes[i] = { ...nodes[i], h2: mid };
                nodes[i + 1] = { ...nodes[i + 1], h1: mid };
            }
            const updated = { ...draftBezier, nodes };
            setDraftBezier(updated);
            return updated;
        }
    };

    const finalizeDraftBezier = () => {
        if (draftBezier && draftBezier.nodes.length >= 2) {
            setShapes((prev) => [...prev, draftBezier]);
            const result = draftBezier;
            setDraftBezier(null);
            return result;
        }
        setDraftBezier(null);
        return null;
    };

    const createPoint = (imgPt: Point) => {
        const pt: PointShape = {
            id: genId(),
            type: "point",
            p: imgPt,
            stroke: "#f43f5e",
            fill: "#f43f5e",
        };
        setShapes((prev) => [...prev, pt]);
        setSelectedId(pt.id);
        return pt;
    };

    const cancelDrafts = () => {
        setDraftRect(null);
        setDraftPoly(null);
        setDraftBezier(null);
    };

    const startDrag = (imgPt: Point, tolerance: number) => {
        const hit = hitTest(imgPt, tolerance, shapes);
        if (hit) {
            setSelectedId(hit.shape.id);
            dragRef.current = {
                kind: hit.kind,
                shapeId: hit.shape.id,
                index: hit.index,
                edge: hit.edge as any,
                startMouseImg: imgPt,
                startShape: JSON.parse(JSON.stringify(hit.shape)), // deep clone
            };
            return true;
        } else {
            setSelectedId(null);
            return false;
        }
    };

    const updateDrag = (imgPt: Point) => {
        if (!dragRef.current) return false;

        const d = dragRef.current;
        const dx = imgPt.x - d.startMouseImg.x;
        const dy = imgPt.y - d.startMouseImg.y;
        const start = d.startShape as Shape;

        let updated: Shape | null = null;
        if (d.kind === "move-shape") {
            updated = moveShapeBy(start, dx, dy);
        } else if (start.type === "rect") {
            if (d.kind === "rect-corner" || d.kind === "rect-edge") {
                const r = { ...start } as RectShape;
                if (d.edge === "left") {
                    const nx = r.x + dx;
                    const dw = r.x + r.w - nx;
                    r.x = nx;
                    r.w = dw;
                } else if (d.edge === "right") {
                    r.w = r.w + dx;
                } else if (d.edge === "top") {
                    const ny = r.y + dy;
                    const dh = r.y + r.h - ny;
                    r.y = ny;
                    r.h = dh;
                } else if (d.edge === "bottom") {
                    r.h = r.h + dy;
                }
                updated = r;
            }
        } else if (start.type === "polyline" && d.kind === "poly-vertex" && d.index != null) {
            const poly = JSON.parse(JSON.stringify(start)) as PolylineShape;
            poly.points[d.index] = {
                x: start.points[d.index].x + dx,
                y: start.points[d.index].y + dy
            };
            updated = poly;
        } else if (start.type === "bezier" && d.index != null) {
            const bz = JSON.parse(JSON.stringify(start)) as BezierShape;
            const node = bz.nodes[d.index];
            if (d.kind === "bezier-anchor") {
                node.p = { x: node.p.x + dx, y: node.p.y + dy };
                if (node.h1) node.h1 = { x: node.h1.x + dx, y: node.h1.y + dy };
                if (node.h2) node.h2 = { x: node.h2.x + dx, y: node.h2.y + dy };
            } else if (d.kind === "bezier-h1") {
                node.h1 = {
                    x: (node.h1?.x ?? node.p.x) + dx,
                    y: (node.h1?.y ?? node.p.y) + dy
                };
            } else if (d.kind === "bezier-h2") {
                node.h2 = {
                    x: (node.h2?.x ?? node.p.x) + dx,
                    y: (node.h2?.y ?? node.p.y) + dy
                };
            }
            updated = bz;
        }

        if (updated) {
            setShapes((prev) =>
                prev.map((s) => (s.id === updated!.id ? updated as Shape : s))
            );
            return true;
        }
        return false;
    };

    const endDrag = () => {
        dragRef.current = null;
    };

    const updateHover = (imgPt: Point, tolerance: number) => {
        const hit = hitTest(imgPt, tolerance, shapes);
        setHover(hit ? { id: hit.shape.id, handle: hit.kind } : { id: null });
        return hit;
    };

    const deleteSelected = () => {
        if (!selectedId) return false;
        setShapes((prev) => prev.filter((s) => s.id !== selectedId));
        setSelectedId(null);
        return true;
    };

    const moveSelectedByArrows = (dx: number, dy: number) => {
        if (!selectedId) return false;
        setShapes((prev) =>
            prev.map((s) => (s.id === selectedId ? moveShapeBy(s, dx, dy) : s))
        );
        return true;
    };

    return {
        shapes,
        setShapes,
        selectedId,
        setSelectedId,
        draftRect,
        draftPoly,
        draftBezier,
        hover,
        createRect,
        updateDraftRect,
        finalizeDraftRect,
        createPolyline,
        finalizeDraftPoly,
        createBezier,
        finalizeDraftBezier,
        createPoint,
        cancelDrafts,
        startDrag,
        updateDrag,
        endDrag,
        updateHover,
        deleteSelected,
        moveSelectedByArrows
    };
};

export default useShapeManipulation;
