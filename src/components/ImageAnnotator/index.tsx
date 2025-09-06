import React, { useEffect, useRef, useState } from 'react';

import { type Tool, type PointShape } from '../../types';

import Toolbar from './Toolbar';
import Canvas from './Canvas';
import StatusBar from './StatusBar';
import PatternPanel from './PatternPanel';
import styles from './ImageAnnotator.module.css';
import useHistory from '../../hooks/useHistory';
import useImageLoader from '../../hooks/useImageLoader';
import useShapeManipulation from '../../hooks/useShapeManipulation';
import usePanZoom from '../../hooks/usePanZoom';
import hitTest from '../../utils/hitTesting';
import { requestFeatureDetection } from '../../utils/api';

import { getMousePoint, screenToImage } from '../../utils/coordinates';
import { exportJson } from '../../utils/fileHandlers';

const ImageAnnotator = () => {
    // Canvas & sizing
    const containerRef = useRef<HTMLDivElement | null>(null);
    const [size, setSize] = useState({ w: 900, h: 600 });

    // Tools state
    const [tool, setTool] = useState<Tool>("select");
    const [isPanning, setIsPanning] = useState(false);
    const [isRightPanning, setIsRightPanning] = useState(false);

    // Custom hooks for core functionality
    const {
        zoom, pan, onWheel, zoomToFit, zoomIn, zoomOut,
        startPan, updatePan, endPan
    } = usePanZoom();

    const {
        shapes, setShapes, selectedId, setSelectedId,
        draftRect, draftPoly, draftBezier,
        createRect, updateDraftRect, finalizeDraftRect,
        createPolyline, finalizeDraftPoly,
        createBezier, finalizeDraftBezier,
        createPoint, cancelDrafts,
        startDrag, updateDrag, endDrag,
        deleteSelected, moveSelectedByArrows
    } = useShapeManipulation();

    const {
        image, imageName, imageId,
        handleFileInput, handleDrop, handleDragOver, handleImportJson
    } = useImageLoader(() => {
        setShapes([]);
        setDetections([]);
    });

    const [pattern, setPattern] = useState('chessboard');
    const [patternParams, setPatternParams] = useState<Record<string, unknown>>({ rows: 7, cols: 7 });
    const [showParams, setShowParams] = useState(false);
    const [detections, setDetections] = useState<PointShape[]>([]);

    const handlePatternChange = (p: string) => {
        setPattern(p);
        switch (p) {
            case 'charuco':
                setPatternParams({ squares_x: 5, squares_y: 7, square_length: 1.0, marker_length: 0.5, dictionary: 'DICT_4X4_50' });
                break;
            case 'circle_grid':
                setPatternParams({ rows: 4, cols: 5, symmetric: true });
                break;
            case 'chessboard':
                setPatternParams({ rows: 7, cols: 7 });
                break;
            case 'apriltag':
                setPatternParams({ dictionary: 'DICT_APRILTAG_36h11' });
                break;
            default:
                setPatternParams({});
        }
    };

    const detectFeatures = async () => {
        if (!imageId) {
            alert('No image uploaded');
            return;
        }
        try {
            const result = await requestFeatureDetection(imageId, pattern, patternParams) as { points: Array<{ x: number; y: number; id?: number }> };
            const pts: PointShape[] = result.points.map((p, i) => ({
                id: `det-${i}`,
                type: 'point',
                p: { x: p.x, y: p.y },
                stroke: '#0ea5e9',
                fill: '#0ea5e9',
                interestId: p.id ?? i + 1
            }));
            setDetections(pts);
        } catch (err) {
            console.error('Feature detection failed', err);
            alert('Feature detection failed');
        }
    };

    const {
        beginOp, endOp, undo, redo, cancelOp, canUndo, canRedo
    } = useHistory(shapes, setShapes);

    // Resize observer to keep canvas matching container
    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;
        const ro = new ResizeObserver(() => {
            const rect = el.getBoundingClientRect();
            setSize({ w: Math.max(100, rect.width), h: Math.max(100, rect.height) });
        });
        ro.observe(el);
        return () => ro.disconnect();
    }, []);

    // Auto-fit whenever a new image loads or the container resizes
    useEffect(() => {
        if (image) {
            zoomToFit(image.naturalWidth, image.naturalHeight, size.w, size.h);
        }
    }, [image, size.w, size.h, zoomToFit]);

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
    }, [undo, redo]);

    // Keyboard ops: delete, arrows, enter, escape
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Delete" || e.key === "Backspace") {
                if (selectedId) {
                    beginOp();
                    deleteSelected();
                    endOp();
                }
            } else if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key)) {
                if (!selectedId) return;
                e.preventDefault();
                const delta = e.shiftKey ? 10 : 1;
                const dx = e.key === "ArrowLeft" ? -delta : e.key === "ArrowRight" ? delta : 0;
                const dy = e.key === "ArrowUp" ? -delta : e.key === "ArrowDown" ? delta : 0;
                beginOp();
                moveSelectedByArrows(dx / zoom, dy / zoom);
                endOp();
            } else if (e.key === "Enter") {
                if (draftPoly) {
                    finalizeDraftPoly();
                } else if (draftBezier) {
                    finalizeDraftBezier();
                }
            } else if (e.key === "Escape") {
                cancelDrafts();
                cancelOp();
            }
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [selectedId, draftPoly, draftBezier, zoom, beginOp, endOp, deleteSelected, moveSelectedByArrows, finalizeDraftPoly, finalizeDraftBezier, cancelDrafts, cancelOp]);

    // Space key for temporary pan tool
    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === " " && !e.repeat) {
                setIsPanning(true);
            }
        };
        const onKeyUp = (e: KeyboardEvent) => {
            if (e.key === " ") {
                setIsPanning(false);
            }
        };

        window.addEventListener("keydown", onKeyDown);
        window.addEventListener("keyup", onKeyUp);
        return () => {
            window.removeEventListener("keydown", onKeyDown);
            window.removeEventListener("keyup", onKeyUp);
        };
    }, []);

    // Set tool and finalize drafts if needed
    const setToolAndFinalize = (newTool: Tool) => {
        if (draftPoly) finalizeDraftPoly();
        if (draftBezier) finalizeDraftBezier();
        setTool(newTool);
    };

    // Pointer event handlers
    const onPointerDown = (e: React.PointerEvent) => {
        if (!image) return;
        (e.target as HTMLElement).setPointerCapture(e.pointerId);

        // Right button: switch to select and start panning
        if (e.button === 2) {
            setToolAndFinalize("select");
            setIsRightPanning(true);
            startPan(e);
            return;
        }

        // Panning (tool or spacebar)
        if (tool === "pan" || isPanning) {
            startPan(e);
            return;
        }

        const mouse = getMousePoint(e);
        const img = screenToImage(mouse, zoom, pan);

        // Start drawing tools
        if (tool === "rect") {
            beginOp();
            createRect(img);
            return;
        }

        if (tool === "poly") {
            if (!draftPoly) beginOp();
            createPolyline(img);
            return;
        }

        if (tool === "bezier") {
            if (!draftBezier) beginOp();
            createBezier(img);
            return;
        }

        if (tool === "point") {
            beginOp();
            createPoint(img);
            endOp();
            return;
        }

        // Selection / begin drag
        if (tool === "select") {
            const hit = hitTest(img, 8 / zoom, shapes);
            if (hit) {
                beginOp();
                setSelectedId(hit.shape.id);
                startDrag(img, 8 / zoom);
            } else {
                setSelectedId(null);
            }
        }
    };

    const onPointerMove = (e: React.PointerEvent) => {
        if (tool === "pan" || isPanning || isRightPanning) {
            updatePan(e);
            return;
        }
        if (!image) return;
        const mouse = getMousePoint(e);
        const img = screenToImage(mouse, zoom, pan);

        // Update drafts
        if (draftRect) {
            updateDraftRect(img);
            return;
        }

        // Dragging existing shape/handles
        if (updateDrag(img)) {
            return;
        }

        // Hover feedback removed
    };

    const onPointerUp = () => {
        if (tool === "pan" || isPanning || isRightPanning) {
            endPan();
            setIsRightPanning(false);
            return;
        }
        if (draftRect) {
            finalizeDraftRect();
            endOp();
            return;
        }
        endDrag();
        endOp();
    };

    // Custom wrapper for onWheel to match Canvas component's expected type
    const handleWheel = (e: React.WheelEvent) => {
        onWheel(e as React.WheelEvent<HTMLDivElement>);
    };

    return (
        <div
            ref={containerRef}
            className={styles.wrapper}
            onContextMenu={(e) => {
                e.preventDefault();
                setToolAndFinalize("select");
            }}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
        >
            <Toolbar
                tool={tool}
                setTool={setToolAndFinalize}
                onUndo={undo}
                onRedo={redo}
                canUndo={canUndo}
                canRedo={canRedo}
                onZoomToFit={() => image && zoomToFit(image.naturalWidth, image.naturalHeight, size.w, size.h)}
                onZoomIn={zoomIn}
                onZoomOut={zoomOut}
                zoom={zoom}
                onLoadImage={handleFileInput}
                onImportJson={(e) => handleImportJson(e, setShapes)}
                onExportJson={() => exportJson(shapes, image, imageName, false)}
                onExportBundle={() => exportJson(shapes, image, imageName, true)}
                pattern={pattern}
                onPatternChange={handlePatternChange}
                onDetectFeatures={detectFeatures}
                onToggleParams={() => setShowParams((v) => !v)}
                canDetect={Boolean(imageId)}
            />

            <div className={styles.content}>
                <Canvas
                    image={image}
                    zoom={zoom}
                    pan={pan}
                    shapes={shapes}
                    detections={detections}
                    selectedId={selectedId}
                    draftRect={draftRect}
                    draftPoly={draftPoly}
                    draftBezier={draftBezier}
                    width={size.w}
                    height={size.h}
                    onPointerDown={onPointerDown}
                    onPointerMove={onPointerMove}
                    onPointerUp={onPointerUp}
                    onWheel={handleWheel}
                />
                <PatternPanel
                    visible={showParams}
                    pattern={pattern}
                    params={patternParams}
                    onParamsChange={setPatternParams}
                    onClose={() => setShowParams(false)}
                />
            </div>

            <StatusBar
                image={image}
                imageName={imageName}
                imageId={imageId}
            />
        </div>
    );
};

export default ImageAnnotator;
