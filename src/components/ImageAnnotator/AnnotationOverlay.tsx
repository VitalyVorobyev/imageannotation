import React, { useMemo } from 'react';
import { type Point, type RectShape, type Shape } from '../../types';
import { imageToScreen } from '../../utils/coordinates';
import { normalizeRect, pathToScreen, toPathD } from '../../utils/shapeHelpers';

interface AnnotationOverlayProps {
    shapes: Shape[];
    selectedId: string | null;
    draftRect: RectShape | null;
    draftPoly: any;
    draftBezier: any;
    hover: any;
    zoom: number;
    pan: Point;
    width: number;
    height: number;
    onPointerDown: (e: React.PointerEvent) => void;
    onPointerMove: (e: React.PointerEvent) => void;
    onPointerUp: (e: React.PointerEvent) => void;
};

export function AnnotationOverlay({
    shapes,
    selectedId,
    draftRect,
    draftPoly,
    draftBezier,
    hover,
    zoom,
    pan,
    width,
    height,
    onPointerDown,
    onPointerMove,
    onPointerUp
}: AnnotationOverlayProps) {
  // Helper to convert image coords to screen coords
  const imgToScreen = (p: Point): Point => imageToScreen(p, zoom, pan);

  // SVG overlay elements
  const svgElements = useMemo(() => {
    const elems: JSX.Element[] = [];
    const handleSize = 6; // in screen px

    const drawHandle = (pImg: Point, key: string, cls = "") => {
      const p = imgToScreen(pImg);
      return (
        <rect
          key={key}
          x={p.x - handleSize}
          y={p.y - handleSize}
          width={handleSize * 2}
          height={handleSize * 2}
          className={`fill-white stroke-2 ${cls}`}
          style={{ stroke: "#0ea5e9" }}
          rx={2}
        />
      );
    };

    const drawCircleHandle = (pImg: Point, key: string, cls = "") => {
      const p = imgToScreen(pImg);
      return (
        <circle 
          key={key} 
          cx={p.x} 
          cy={p.y} 
          r={handleSize} 
          className={`${cls}`} 
          strokeWidth={2} 
          stroke="#0ea5e9" 
          fill="#ffffff" 
        />
      );
    };

    // Draft previews first
    if (draftRect) {
      const r = normalizeRect(draftRect);
      const a = imgToScreen({ x: r.x, y: r.y });
      elems.push(
        <rect 
          key="draft-rect" 
          x={a.x} 
          y={a.y} 
          width={r.w * zoom} 
          height={r.h * zoom} 
          fill="rgba(56,189,248,0.12)" 
          stroke="#38bdf8" 
          strokeWidth={2} 
        />
      );
    }
    
    if (draftPoly) {
      const pts = [...draftPoly.points];
      // Live cursor preview
      const pathPts = pts.map(imgToScreen);
      elems.push(
        <polyline 
          key="draft-poly" 
          points={pathPts.map((p) => `${p.x},${p.y}`).join(" ")} 
          fill="none" 
          stroke={draftPoly.stroke || "#22c55e"} 
          strokeWidth={2} 
        />
      );
      // vertices
      pts.forEach((p, i) => elems.push(drawHandle(p, `draft-poly-v-${i}`)));
    }
    
    if (draftBezier) {
      const d = toPathD(draftBezier.nodes, draftBezier.closed);
      const path = pathToScreen(d, zoom, pan);
      elems.push(
        <path 
          key="draft-bezier" 
          d={path} 
          fill={draftBezier.fill || "transparent"} 
          stroke={draftBezier.stroke || "#eab308"} 
          strokeWidth={2} 
        />
      );
      // anchors/handles
      draftBezier.nodes.forEach((n, i) => {
        if (n.h1) elems.push(drawCircleHandle(n.h1, `draft-bz-h1-${i}`, ""));
        if (n.h2) elems.push(drawCircleHandle(n.h2, `draft-bz-h2-${i}`, ""));
        elems.push(drawCircleHandle(n.p, `draft-bz-a-${i}`, ""));
      });
    }

    // Committed shapes
    for (const s of shapes) {
      if (s.visible === false) continue;
      if (s.type === "rect") {
        const r = normalizeRect(s);
        const a = imgToScreen({ x: r.x, y: r.y });
        elems.push(
          <rect 
            key={s.id} 
            x={a.x} 
            y={a.y} 
            width={r.w * zoom} 
            height={r.h * zoom} 
            fill={s.fill || "rgba(59,130,246,0.08)"} 
            stroke={s.stroke || "#3b82f6"} 
            strokeWidth={2} 
          />
        );
        if (s.id === selectedId) {
          const corners: Point[] = [
            { x: r.x, y: r.y },
            { x: r.x + r.w, y: r.y },
            { x: r.x, y: r.y + r.h },
            { x: r.x + r.w, y: r.y + r.h },
          ];
          corners.forEach((c, i) => elems.push(drawHandle(c, `${s.id}-c-${i}`, "")));
        }
      } else if (s.type === "polyline") {
        const pts = s.points.map(imgToScreen);
        elems.push(
          <polyline 
            key={s.id} 
            points={pts.map((p) => `${p.x},${p.y}`).join(" ")} 
            fill="none" 
            stroke={s.stroke || "#22c55e"} 
            strokeWidth={2} 
          />
        );
        if (s.id === selectedId) s.points.forEach((p, i) => elems.push(drawHandle(p, `${s.id}-v-${i}`)));
      } else if (s.type === "bezier") {
        const path = pathToScreen(toPathD(s.nodes, s.closed), zoom, pan);
        elems.push(
          <path 
            key={s.id} 
            d={path} 
            fill={s.fill || "transparent"} 
            stroke={s.stroke || "#eab308"} 
            strokeWidth={2} 
          />
        );
        if (s.id === selectedId) {
          s.nodes.forEach((n, i) => {
            if (n.h1) elems.push(drawCircleHandle(n.h1, `${s.id}-h1-${i}`));
            if (n.h2) elems.push(drawCircleHandle(n.h2, `${s.id}-h2-${i}`));
            elems.push(drawCircleHandle(n.p, `${s.id}-a-${i}`));
          });
        }
      } else if (s.type === "point") {
        const p = imgToScreen(s.p);
        elems.push(
          <circle 
            key={s.id} 
            cx={p.x} 
            cy={p.y} 
            r={4} 
            fill={s.fill || "#f43f5e"} 
            stroke={s.stroke || "#ffffff"} 
            strokeWidth={2} 
          />
        );
      }
    }

    return elems;
  }, [shapes, draftRect, draftPoly, draftBezier, selectedId, zoom, pan]);

  return (
    <svg
      className="absolute inset-0 pointer-events-auto"
      width={width}
      height={height}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
    >
      {svgElements}
    </svg>
  );
};
