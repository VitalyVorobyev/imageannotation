import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

// ------------------------------------------------------------
// Image Annotation Canvas (single-file React component)
// - Loads an image and displays it on an HTMLCanvas element
// - Renders vector annotations on an SVG overlay (rect, polyline, bezier, points)
// - Zoom & pan the image while keeping vector strokes/handles constant-size
// - Create, select, move, resize/edit shapes with mouse & some keyboard shortcuts
// - Import/export JSON annotations (with or without embedded image)
// ------------------------------------------------------------

// ---- Types ----
type Tool = "select" | "pan" | "rect" | "poly" | "bezier" | "point";

type Point = { x: number; y: number };

type BaseShape = {
  id: string;
  name?: string;
  stroke?: string;
  fill?: string;
  visible?: boolean;
};

type RectShape = BaseShape & {
  type: "rect";
  x: number;
  y: number;
  w: number;
  h: number;
  r?: number; // border radius (optional)
};

type PolylineShape = BaseShape & {
  type: "polyline";
  points: Point[];
  closed?: boolean;
};

// Cubic bezier path defined by anchors with optional handles
// Each node has p (anchor), and optional h1/h2 control handles.
// Adjacent nodes form segments: node[i].p --C(node[i].h2, node[i+1].h1)--> node[i+1].p
// If a handle is missing, it defaults to the anchor (straight line to next).
type BezierNode = { p: Point; h1?: Point; h2?: Point };

type BezierShape = BaseShape & {
  type: "bezier";
  nodes: BezierNode[]; // at least 2 anchors
  closed?: boolean;
};

type PointShape = BaseShape & {
  type: "point";
  p: Point;
};

type Shape = RectShape | PolylineShape | BezierShape | PointShape;

// ---- JSON Bundle Schema ----
type AnnotationBundle = {
  version: number;
  image?: {
    name?: string;
    width?: number;
    height?: number;
    dataUrl?: string; // embedded base64 image (optional)
  };
  shapes: Shape[];
};

// ---- Utilities ----
const genId = () => Math.random().toString(36).slice(2, 10);
const clamp = (v: number, a: number, b: number) => Math.min(Math.max(v, a), b);

function dist2(a: Point, b: Point) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return dx * dx + dy * dy;
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function toPathD(nodes: BezierShape["nodes"], closed?: boolean) {
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
}

// Hit test distance from point to segment
function pointToSegDist2(p: Point, a: Point, b: Point) {
  const l2 = dist2(a, b);
  if (l2 === 0) return dist2(p, a);
  let t = ((p.x - a.x) * (b.x - a.x) + (p.y - a.y) * (b.y - a.y)) / l2;
  t = clamp(t, 0, 1);
  const proj = { x: a.x + t * (b.x - a.x), y: a.y + t * (b.y - a.y) };
  return dist2(p, proj);
}

// Approximate distance from point to cubic bezier by sampling
function pointToCubicDist2(p: Point, p0: Point, c1: Point, c2: Point, p1: Point) {
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
}

// ---- Component ----
export default function ImageAnnotationCanvasApp() {
  // Canvas & sizing
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [size, setSize] = useState({ w: 900, h: 600 });

  // Image
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [imageName, setImageName] = useState<string | undefined>(undefined);

  // View transform
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState<Point>({ x: 0, y: 0 });

  // Tools & shapes
  const [tool, setTool] = useState<Tool>("select");
  const [shapes, setShapes] = useState<Shape[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // ---- History (Undo/Redo) ----
  const undoStack = useRef<Shape[][]>([]);
  const redoStack = useRef<Shape[][]>([]);
  const opStarted = useRef<boolean>(false);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const deepCloneShapes = (arr: Shape[]) => JSON.parse(JSON.stringify(arr)) as Shape[];
  const setHistoryFlags = () => {
    setCanUndo(undoStack.current.length > 0);
    setCanRedo(redoStack.current.length > 0);
  };
  const beginOp = () => {
    if (opStarted.current) return;
    undoStack.current.push(deepCloneShapes(shapes));
    redoStack.current = [];
    opStarted.current = true;
    setHistoryFlags();
  };
  const endOp = () => {
    if (!opStarted.current) return;
    opStarted.current = false;
    setHistoryFlags();
  };
  const undo = () => {
    if (undoStack.current.length === 0) return;
    const prev = undoStack.current.pop()!;
    redoStack.current.push(deepCloneShapes(shapes));
    setShapes(prev);
    setSelectedId(null);
    setHistoryFlags();
  };
  const redo = () => {
    if (redoStack.current.length === 0) return;
    undoStack.current.push(deepCloneShapes(shapes));
    const next = redoStack.current.pop()!;
    setShapes(next);
    setSelectedId(null);
    setHistoryFlags();
  };

  // Drawing state
  const [isPanning, setIsPanning] = useState(false);
  const panStart = useRef<Point | null>(null);
  const [draftRect, setDraftRect] = useState<RectShape | null>(null);
  const [draftPoly, setDraftPoly] = useState<PolylineShape | null>(null);
  const [draftBezier, setDraftBezier] = useState<BezierShape | null>(null);
  const [hover, setHover] = useState<{ id: string | null; handle?: string } | null>(null);

  // Dragging handles / shape move
  const dragRef = useRef<
    | null
    | {
        kind:
          | "move-shape"
          | "rect-corner"
          | "rect-edge"
          | "poly-vertex"
          | "bezier-anchor"
          | "bezier-h1"
          | "bezier-h2";
        shapeId: string;
        index?: number; // vertex/node index
        edge?: "left" | "right" | "top" | "bottom"; // for rect edges
        startMouseImg: Point;
        startShape: Shape;
      }
  >(null);

  // Resize observer to keep canvas matching container
  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      const rect = el.getBoundingClientRect();
      setSize({ w: Math.max(100, rect.width), h: Math.max(100, rect.height) });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Global shortcuts: Undo/Redo
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const ctrl = e.ctrlKey || e.metaKey;
      if (!ctrl) return;
      const k = e.key.toLowerCase();
      if (k === "z") {
        e.preventDefault();
        if (e.shiftKey) redo(); else undo();
      } else if (k === "y") {
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Keyboard ops: delete, arrows, enter, escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Delete" || e.key === "Backspace") {
        if (selectedId) {
          beginOp();
          setShapes((prev) => prev.filter((s) => s.id !== selectedId));
          setSelectedId(null);
          endOp();
        }
      } else if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key)) {
        if (!selectedId) return;
        e.preventDefault();
        const delta = e.shiftKey ? 10 : 1;
        const dx = e.key === "ArrowLeft" ? -delta : e.key === "ArrowRight" ? delta : 0;
        const dy = e.key === "ArrowUp" ? -delta : e.key === "ArrowDown" ? delta : 0;
        beginOp();
        setShapes((prev) =>
          prev.map((s) => (s.id === selectedId ? moveShapeBy(s, dx / zoom, dy / zoom) : s))
        );
        endOp();
      } else if (e.key === "Enter") {
        if (draftPoly) {
          finalizeDraftPoly();
        } else if (draftBezier) {
          finalizeDraftBezier();
        }
      } else if (e.key === "Escape") {
        cancelDrafts();
        opStarted.current = false; // cancel pending op if any
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedId, draftPoly, draftBezier, zoom]);

  // Draw image on canvas each frame (image, zoom, pan, size)
  useEffect(() => {
    const cvs = canvasRef.current;
    if (!cvs) return;
    cvs.width = size.w;
    cvs.height = size.h;
    const ctx = cvs.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, size.w, size.h);
    if (!image) return;

    const iw = image.naturalWidth;
    const ih = image.naturalHeight;
    // Map image -> screen: screen = image * zoom + pan
    const x = pan.x;
    const y = pan.y;
    const w = iw * zoom;
    const h = ih * zoom;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(image, 0, 0, iw, ih, x, y, w, h);
  }, [image, zoom, pan, size]);

  // Auto-fit whenever a new image loads or the container resizes
  useEffect(() => {
    if (image) {
      zoomToFit();
    }
  }, [image, size.w, size.h]);

  function cancelDrafts() {
    setDraftRect(null);
    setDraftPoly(null);
    setDraftBezier(null);
    opStarted.current = false;
  }

  // Move helpers
  function moveShapeBy(s: Shape, dx: number, dy: number): Shape {
    switch (s.type) {
      case "rect":
        return { ...s, x: s.x + dx, y: s.y + dy };
      case "polyline":
        return { ...s, points: s.points.map((p) => ({ x: p.x + dx, y: p.y + dy })) };
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
  }

  // Pointer handlers on overlay
  const onPointerDown = (e: React.PointerEvent) => {
    if (!image) return;
    const mouse = getMousePoint(e);
    const img = screenToImage(mouse);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);

    // Panning (tool or spacebar)
    if (tool === "pan" || isPanning) {
      panStart.current = { x: mouse.x - pan.x, y: mouse.y - pan.y };
      return;
    }

    // Start drawing tools
    if (tool === "rect") {
      const r: RectShape = {
        id: genId(),
        type: "rect",
        x: img.x,
        y: img.y,
        w: 0,
        h: 0,
        stroke: "#38bdf8",
        fill: "rgba(56,189,248,0.12)",
      };
      beginOp();
      setDraftRect(r);
      setSelectedId(r.id);
      return;
    }

    if (tool === "poly") {
      setDraftPoly((prev) => {
        if (!prev) {
          const poly: PolylineShape = {
            id: genId(),
            type: "polyline",
            points: [img],
            stroke: "#22c55e",
          };
          setSelectedId(poly.id);
          beginOp();
          setSelectedId(poly.id);
          return poly;
        } else {
          return { ...prev, points: [...prev.points, img] };
        }
      });
      return;
    }

    if (tool === "bezier") {
      setDraftBezier((prev) => {
        if (!prev) {
          const bz: BezierShape = {
            id: genId(),
            type: "bezier",
            nodes: [{ p: img }],
            stroke: "#eab308",
            fill: "transparent",
          };
          beginOp();
          setSelectedId(bz.id);
          return bz;
        } else {
          const nodes = [...prev.nodes, { p: img }];
          // Initialize simple auto handles for smooth join
          if (nodes.length >= 2) {
            const i = nodes.length - 2;
            const a = nodes[i].p;
            const b = nodes[i + 1].p;
            const mid: Point = { x: lerp(a.x, b.x, 0.5), y: lerp(a.y, b.y, 0.5) };
            nodes[i] = { ...nodes[i], h2: mid };
            nodes[i + 1] = { ...nodes[i + 1], h1: mid };
          }
          return { ...prev, nodes };
        }
      });
      return;
    }

    if (tool === "point") {
      const pt: PointShape = {
        id: genId(),
        type: "point",
        p: img,
        stroke: "#f43f5e",
        fill: "#f43f5e",
      };
      beginOp();
      setShapes((prev) => [...prev, pt]);
      setSelectedId(pt.id);
      endOp();
      return;
    }

    // Selection / begin drag
    if (tool === "select") {
      const hit = hitTest(img, 8 / zoom);
      if (hit) {
        beginOp();
        setSelectedId(hit.shape.id);
        // Start drag according to handle
        dragRef.current = {
          kind: hit.kind,
          shapeId: hit.shape.id,
          index: hit.index,
          edge: hit.edge as any,
          startMouseImg: img,
          startShape: JSON.parse(JSON.stringify(hit.shape)), // deep clone
        };
      } else {
        setSelectedId(null);
      }
    }
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!image) return;
    const mouse = getMousePoint(e);
    const img = screenToImage(mouse);

    // Panning
    if (panStart.current && (tool === "pan" || isPanning)) {
      setPan({ x: mouse.x - panStart.current.x, y: mouse.y - panStart.current.y });
      return;
    }

    // Update drafts
    if (draftRect) {
      const w = img.x - draftRect.x;
      const h = img.y - draftRect.y;
      setDraftRect({ ...draftRect, w, h });
      return;
    }
    if (draftPoly) {
      // live preview handled in render via last mouse position
      // Nothing to do here
      return;
    }
    if (draftBezier) {
      return; // handled visually during render
    }

    // Dragging existing shape/handles
    if (dragRef.current) {
      const d = dragRef.current;
      const dx = img.x - d.startMouseImg.x;
      const dy = img.y - d.startMouseImg.y;
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
        poly.points[d.index] = { x: start.points[d.index].x + dx, y: start.points[d.index].y + dy };
        updated = poly;
      } else if (start.type === "bezier" && d.index != null) {
        const bz = JSON.parse(JSON.stringify(start)) as BezierShape;
        const node = bz.nodes[d.index];
        if (d.kind === "bezier-anchor") {
          node.p = { x: node.p.x + dx, y: node.p.y + dy };
          if (node.h1) node.h1 = { x: node.h1.x + dx, y: node.h1.y + dy };
          if (node.h2) node.h2 = { x: node.h2.x + dx, y: node.h2.y + dy };
        } else if (d.kind === "bezier-h1") {
          node.h1 = { x: (node.h1?.x ?? node.p.x) + dx, y: (node.h1?.y ?? node.p.y) + dy };
        } else if (d.kind === "bezier-h2") {
          node.h2 = { x: (node.h2?.x ?? node.p.x) + dx, y: (node.h2?.y ?? node.p.y) + dy };
        }
        updated = bz;
      }

      if (updated) {
        setShapes((prev) => prev.map((s) => (s.id === updated!.id ? (updated as Shape) : s)));
      }
      return;
    }

    // Hover feedback in select mode
    if (tool === "select") {
      const hit = hitTest(img, 8 / zoom);
      setHover(hit ? { id: hit.shape.id, handle: hit.kind } : { id: null });
    }
  };

  const onPointerUp = (e: React.PointerEvent) => {
    panStart.current = null;
    if (draftRect) {
      const r = normalizeRect(draftRect);
      if (Math.abs(r.w) > 1 && Math.abs(r.h) > 1) {
        setShapes((prev) => [...prev, r]);
      }
      setDraftRect(null);
      endOp();
      return;
    }
    if (dragRef.current) {
      dragRef.current = null;
      endOp();
    }
  };

  // Finish poly/bezier with Enter or toolbar click on Select/Pan
  function finalizeDraftPoly() {
    if (draftPoly && draftPoly.points.length >= 2) {
      setShapes((prev) => [...prev, draftPoly]);
      endOp();
    }
    setDraftPoly(null);
  }
  function finalizeDraftBezier() {
    if (draftBezier && draftBezier.nodes.length >= 2) {
      setShapes((prev) => [...prev, draftBezier]);
      endOp();
    }
    setDraftBezier(null);
  }

  // Hit testing in image space (tolerance in image units)
  function hitTest(imgPt: Point, tol: number):
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
          | "bezier-h2";
        index?: number;
        edge?: string;
      } {
    // Prioritize handles first
    const byZ = [...shapes]; // simple order
    for (let s of byZ.slice().reverse()) {
      if (s.type === "rect") {
        const r = normalizeRect(s);
        // corners
        const corners: [Point, string][] = [
          [{ x: r.x, y: r.y }, "left top"],
          [{ x: r.x + r.w, y: r.y }, "right top"],
          [{ x: r.x, y: r.y + r.h }, "left bottom"],
          [{ x: r.x + r.w, y: r.y + r.h }, "right bottom"],
        ];
        for (const [c, label] of corners) {
          if (dist2(imgPt, c) <= tol * tol) {
            const edge = label.includes("left") ? "left" : "right";
            // corner drag uses both axes (edge signals which side changes)
            return { shape: s, kind: "rect-corner", edge };
          }
        }
        // edges
        const edges: [Point, Point, string][] = [
          [{ x: r.x, y: r.y }, { x: r.x + r.w, y: r.y }, "top"],
          [{ x: r.x, y: r.y + r.h }, { x: r.x + r.w, y: r.y + r.h }, "bottom"],
          [{ x: r.x, y: r.y }, { x: r.x, y: r.y + r.h }, "left"],
          [{ x: r.x + r.w, y: r.y }, { x: r.x + r.w, y: r.y + r.h }, "right"],
        ];
        for (const [a, b, edge] of edges) {
          if (pointToSegDist2(imgPt, a, b) <= tol * tol) return { shape: s, kind: "rect-edge", edge };
        }
        // inside
        if (imgPt.x >= r.x && imgPt.x <= r.x + r.w && imgPt.y >= r.y && imgPt.y <= r.y + r.h) {
          return { shape: s, kind: "move-shape" };
        }
      } else if (s.type === "polyline") {
        // vertices
        for (let i = 0; i < s.points.length; i++) {
          if (dist2(imgPt, s.points[i]) <= tol * tol) return { shape: s, kind: "poly-vertex", index: i };
        }
        // near segments
        for (let i = 0; i < s.points.length - 1; i++) {
          if (pointToSegDist2(imgPt, s.points[i], s.points[i + 1]) <= tol * tol) return { shape: s, kind: "move-shape" };
        }
      } else if (s.type === "bezier") {
        for (let i = 0; i < s.nodes.length; i++) {
          const n = s.nodes[i];
          if (dist2(imgPt, n.p) <= tol * tol) return { shape: s, kind: "bezier-anchor", index: i };
          if (n.h1 && dist2(imgPt, n.h1) <= tol * tol) return { shape: s, kind: "bezier-h1", index: i };
          if (n.h2 && dist2(imgPt, n.h2) <= tol * tol) return { shape: s, kind: "bezier-h2", index: i };
        }
        // near curve
        for (let i = 0; i < s.nodes.length - 1; i++) {
          const a = s.nodes[i];
          const b = s.nodes[i + 1];
          if (pointToCubicDist2(imgPt, a.p, a.h2 ?? a.p, b.h1 ?? b.p, b.p) <= tol * tol) return { shape: s, kind: "move-shape" };
        }
      } else if (s.type === "point") {
        if (dist2(imgPt, s.p) <= (tol * 1.5) * (tol * 1.5)) return { shape: s, kind: "move-shape" };
      }
    }
    return null;
  }

  // Normalize rect to have positive w,h
  function normalizeRect(r: RectShape): RectShape {
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
  }

  // Toolbar actions
  function setToolAndFinalize(next: Tool) {
    if (draftPoly) finalizeDraftPoly();
    if (draftBezier) finalizeDraftBezier();
    setTool(next);
  }

  function zoomToFit() {
    if (!image) return;
    const iw = image.naturalWidth;
    const ih = image.naturalHeight;
    const k = Math.min(size.w / iw, size.h / ih);
    const z = clamp(k, 0.05, 20);
    setZoom(z);
    setPan({ x: (size.w - iw * z) / 2, y: (size.h - ih * z) / 2 });
  }

  // Screen <-> Image coordinate transforms
  const screenToImage = (p: Point): Point => ({ x: (p.x - pan.x) / zoom, y: (p.y - pan.y) / zoom });
  const imageToScreen = (p: Point): Point => ({ x: p.x * zoom + pan.x, y: p.y * zoom + pan.y });

  // Mouse helpers
  const getMousePoint = (e: React.PointerEvent | PointerEvent): Point => {
    const bounds = containerRef.current!.getBoundingClientRect();
    return { x: e.clientX - bounds.left, y: e.clientY - bounds.top };
  };

  // Zoom handling: keep cursor fixed in image space
  const onWheel = (e: React.WheelEvent) => {
    if (!image) return;
    e.preventDefault();
    const mouse = getMousePoint(e);
    const imgPt = screenToImage(mouse);
    const dz = e.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = clamp(zoom * dz, 0.1, 20);
    const newPan = {
      x: mouse.x - imgPt.x * newZoom,
      y: mouse.y - imgPt.y * newZoom,
    };
    setZoom(newZoom);
    setPan(newPan);
  };

  // Drag & Drop support
  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy';
  };
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer?.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    const img = new Image();
    img.onload = () => {
      setImage(img);
      setImageName(file.name);
    };
    img.onerror = () => alert('Failed to load dropped image.');
    const reader = new FileReader();
    reader.onload = () => { img.src = String(reader.result); };
    reader.readAsDataURL(file);
  };

  function onFileImage(ev: React.ChangeEvent<HTMLInputElement>) {
    const input = ev.currentTarget;
    const file = input.files?.[0];
    if (!file) return;

    const img = new Image();
    img.onload = () => {
      setImage(img);
      setImageName(file.name);
      setZoom(1);
      setPan({ x: 0, y: 0 });
      
    };
    img.onerror = () => {
      alert("Failed to load image. Please try a different file.");
    };

    // Use FileReader to support environments where object URLs are restricted
    const reader = new FileReader();
    reader.onload = () => {
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);

    // Allow selecting the same file again later
    input.value = "";
  }

  // Export JSON (no image) & Bundle (with embedded image)
  async function exportJson(includeImage: boolean) {
    const bundle: AnnotationBundle = {
      version: 1,
      image: includeImage
        ? {
            name: imageName,
            width: image?.naturalWidth,
            height: image?.naturalHeight,
            dataUrl: image ? canvasToDataURL(image) : undefined,
          }
        : { name: imageName, width: image?.naturalWidth, height: image?.naturalHeight },
      shapes,
    };
    const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = includeImage ? "annotation_bundle.json" : "annotation.json";
    a.click();
  }

  function canvasToDataURL(imgEl: HTMLImageElement): string {
    const c = document.createElement("canvas");
    c.width = imgEl.naturalWidth;
    c.height = imgEl.naturalHeight;
    const ctx = c.getContext("2d")!;
    ctx.drawImage(imgEl, 0, 0);
    return c.toDataURL("image/png");
  }

  function onImportJson(ev: React.ChangeEvent<HTMLInputElement>) {
    const file = ev.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(String(reader.result)) as AnnotationBundle;
        if (data.image?.dataUrl) {
          const img = new Image();
          img.onload = () => {
            setImage(img);
            setImageName(data.image?.name);
            beginOp();
            setShapes(data.shapes || []);
            endOp();
            
          };
          img.src = data.image.dataUrl;
        } else {
          beginOp();
            setShapes(data.shapes || []);
            endOp();
        }
      } catch (err) {
        alert("Invalid annotation JSON");
      }
    };
    reader.readAsText(file);
  }

  // SVG overlay elements
  const svgElements = useMemo(() => {
    const elems: JSX.Element[] = [];
    const handleSize = 6; // in screen px

    const drawHandle = (pImg: Point, key: string, cls = "") => {
      const p = imageToScreen(pImg);
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
      const p = imageToScreen(pImg);
      return <circle key={key} cx={p.x} cy={p.y} r={handleSize} className={`${cls}`} strokeWidth={2} stroke="#0ea5e9" fill="#ffffff" />;
    };

    // Draft previews first
    if (draftRect) {
      const r = normalizeRect(draftRect);
      const a = imageToScreen({ x: r.x, y: r.y });
      elems.push(
        <rect key="draft-rect" x={a.x} y={a.y} width={r.w * zoom} height={r.h * zoom} fill="rgba(56,189,248,0.12)" stroke="#38bdf8" strokeWidth={2} />
      );
    }
    if (draftPoly) {
      const pts = [...draftPoly.points];
      if (hover?.id === draftPoly.id) {
        // noop
      }
      // Live cursor preview
      // NOTE: For simplicity, preview segment to current mouse is not drawn here since we don't track cursor img point continuously in state.
      const pathPts = pts.map(imageToScreen);
      elems.push(
        <polyline key="draft-poly" points={pathPts.map((p) => `${p.x},${p.y}`).join(" ")} fill="none" stroke={draftPoly.stroke || "#22c55e"} strokeWidth={2} />
      );
      // vertices
      pts.forEach((p, i) => elems.push(drawHandle(p, `draft-poly-v-${i}`)));
    }
    if (draftBezier) {
      const d = toPathD(draftBezier.nodes, draftBezier.closed);
      const path = pathToScreen(d);
      elems.push(
        <path key="draft-bezier" d={path} fill={draftBezier.fill || "transparent"} stroke={draftBezier.stroke || "#eab308"} strokeWidth={2} />
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
        const a = imageToScreen({ x: r.x, y: r.y });
        elems.push(
          <rect key={s.id} x={a.x} y={a.y} width={r.w * zoom} height={r.h * zoom} fill={s.fill || "rgba(59,130,246,0.08)"} stroke={s.stroke || "#3b82f6"} strokeWidth={2} />
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
        const pts = s.points.map(imageToScreen);
        elems.push(
          <polyline key={s.id} points={pts.map((p) => `${p.x},${p.y}`).join(" ")} fill="none" stroke={s.stroke || "#22c55e"} strokeWidth={2} />
        );
        if (s.id === selectedId) s.points.forEach((p, i) => elems.push(drawHandle(p, `${s.id}-v-${i}`)));
      } else if (s.type === "bezier") {
        const path = pathToScreen(toPathD(s.nodes, s.closed));
        elems.push(
          <path key={s.id} d={path} fill={s.fill || "transparent"} stroke={s.stroke || "#eab308"} strokeWidth={2} />
        );
        if (s.id === selectedId) {
          s.nodes.forEach((n, i) => {
            if (n.h1) elems.push(drawCircleHandle(n.h1, `${s.id}-h1-${i}`));
            if (n.h2) elems.push(drawCircleHandle(n.h2, `${s.id}-h2-${i}`));
            elems.push(drawCircleHandle(n.p, `${s.id}-a-${i}`));
          });
        }
      } else if (s.type === "point") {
        const p = imageToScreen(s.p);
        elems.push(<circle key={s.id} cx={p.x} cy={p.y} r={4} fill={s.fill || "#f43f5e"} stroke={s.stroke || "#ffffff"} strokeWidth={2} />);
      }
    }

    return elems;
  }, [shapes, draftRect, draftPoly, draftBezier, selectedId, zoom, pan]);

  // Convert an SVG path in image coords to a path in screen coords
  function pathToScreen(dImg: string) {
    // Very small parser: convert all numbers (sequence of floats) pair-wise applying transform.
    // Safer approach: use a temporary Path2D? But here we replace coordinate numbers after commands that expect pairs.
    // We'll parse tokens and rebuild.
    const tokens = dImg.match(/[a-zA-Z]|-?\d*\.?\d+(?:e[-+]?\d+)?/g) || [];
    const out: string[] = [];
    let i = 0;
    let mode: string | null = null;
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
  }

  // Toolbar button component
  function TButton({ label, active, onClick, title, children }: { label?: string; active?: boolean; onClick?: () => void; title?: string; children?: React.ReactNode }) {
    return (
      <button
        className={`px-3 py-2 rounded-2xl border text-sm font-medium shadow-sm transition active:scale-[.98] select-none ${
          active ? "bg-sky-600 text-white border-sky-700" : "bg-white/90 hover:bg-white border-gray-200"
        }`}
        onClick={onClick}
        title={title || label}
      >
        {children || label}
      </button>
    );
  }

  return (
    <div className="w-full h-full flex flex-col">
      {/* Top toolbar */}
      <div className="flex items-center gap-2 p-2 border-b bg-gray-50/70 backdrop-blur sticky top-0 z-10">
        <div className="flex items-center gap-1">
          <TButton active={tool === "select"} onClick={() => setToolAndFinalize("select")} title="Select (V)">Select</TButton>
          <TButton active={tool === "pan"} onClick={() => setToolAndFinalize("pan")} title="Pan (Space)">Pan</TButton>
          <div className="w-px h-6 bg-gray-200 mx-1" />
          <TButton onClick={undo} title="Undo (Ctrl/Cmd+Z)">Undo</TButton>
          <TButton onClick={redo} title="Redo (Ctrl+Y or Ctrl+Shift+Z)">Redo</TButton>
          <div className="w-px h-6 bg-gray-200 mx-1" />
          <TButton active={tool === "rect"} onClick={() => setToolAndFinalize("rect")} title="Rectangle (R)">Rect</TButton>
          <TButton active={tool === "poly"} onClick={() => setToolAndFinalize("poly")} title="Polyline (P)">Polyline</TButton>
          <TButton active={tool === "bezier"} onClick={() => setToolAndFinalize("bezier")} title="Bezier (B)">Bezier</TButton>
          <TButton active={tool === "point"} onClick={() => setToolAndFinalize("point")} title="Point (O)">Point</TButton>
          <div className="w-px h-6 bg-gray-200 mx-1" />
          <TButton onClick={() => zoomToFit()} title="Zoom to Fit">Fit</TButton>
          <TButton onClick={() => setZoom((z) => clamp(z * 1.2, 0.1, 20))} title="Zoom In">＋</TButton>
          <TButton onClick={() => setZoom((z) => clamp(z / 1.2, 0.1, 20))} title="Zoom Out">－</TButton>
        </div>
        <div className="grow" />
        <div className="flex items-center gap-2">
          <label className="px-3 py-2 rounded-2xl border bg-white cursor-pointer shadow-sm">
            Load Image
            <input type="file" accept="image/*" className="hidden" onChange={onFileImage} />
          </label>
          <label className="px-3 py-2 rounded-2xl border bg-white cursor-pointer shadow-sm">
            Import JSON
            <input type="file" accept="application/json" className="hidden" onChange={onImportJson} />
          </label>
          <TButton onClick={() => exportJson(false)}>Export JSON</TButton>
          <TButton onClick={() => exportJson(true)}>Export Bundle</TButton>
          <div className="text-xs text-gray-500 px-2">Zoom: {(zoom * 100).toFixed(0)}%</div>
        </div>
      </div>

      {/* Main stage */}
      <div ref={containerRef} className="relative flex-1 bg-neutral-900 overflow-hidden" onWheel={onWheel} onDragOver={onDragOver} onDrop={onDrop}>
        <canvas ref={canvasRef} className="absolute inset-0" />
        {/* Vector overlay (constant stroke sizes) */}
        <svg
          className="absolute inset-0 pointer-events-auto"
          width={size.w}
          height={size.h}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
        >
          {svgElements}
        </svg>

        {/* Hint overlay */}
        <div className="absolute bottom-2 left-2 text-xs text-white/80 bg-black/40 rounded-md px-2 py-1">
          <span className="mr-3">{image ? `Image: ${imageName || 'unnamed'} ${image.naturalWidth}×${image.naturalHeight}` : 'Drop image or use Load Image'}</span>
          <span className="mr-3">Space: pan</span>
          <span className="mr-3">Wheel: zoom</span>
          <span className="mr-3">Enter: finish</span>
          <span className="mr-3">Del: delete</span>
          <span>Shift+Arrows: fast nudge</span>
        </div>
      </div>
    </div>
  );
}
