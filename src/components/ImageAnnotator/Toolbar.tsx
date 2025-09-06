import React from 'react';
import { type Tool } from '../../types';
import ToolButton from '../ToolButton';
import styles from './Toolbar.module.css';

interface ToolbarProps {
    tool: Tool;
    setTool: (tool: Tool) => void;
    onUndo: () => void;
    onRedo: () => void;
    canUndo: boolean;
    canRedo: boolean;
    onZoomToFit: () => void;
    onZoomIn: () => void;
    onZoomOut: () => void;
    zoom: number;
    onLoadImage: (ev: React.ChangeEvent<HTMLInputElement>) => void;
    onImportJson: (ev: React.ChangeEvent<HTMLInputElement>) => void;
    onExportJson: () => void;
    onExportBundle: () => void;
    pattern: string;
    onPatternChange: (val: string) => void;
    onDetectFeatures: () => void;
    onToggleParams: () => void;
    canDetect: boolean;
};

const Toolbar = ({
    tool,
    setTool,
    onUndo,
    onRedo,
    canUndo,
    canRedo,
    onZoomToFit,
    onZoomIn,
    onZoomOut,
    zoom,
    onLoadImage,
    onImportJson,
    onExportJson,
    onExportBundle,
    pattern,
    onPatternChange,
    onDetectFeatures,
    onToggleParams,
    canDetect
}: ToolbarProps) => {
    return (
        <div className={styles.toolbar}>
            <div className={styles.group}>
                <ToolButton active={tool === "select"} onClick={() => setTool("select")} title="Select (V)">Select</ToolButton>
                <ToolButton active={tool === "pan"} onClick={() => setTool("pan")} title="Pan (Space)">Pan</ToolButton>
                <div className={styles.divider} />
                <ToolButton onClick={onUndo} title="Undo (Ctrl/Cmd+Z)" disabled={!canUndo}>↺ Undo</ToolButton>
                <ToolButton onClick={onRedo} title="Redo (Ctrl+Y or Ctrl+Shift+Z)" disabled={!canRedo}>↻ Redo</ToolButton>
                <div className={styles.divider} />
                <ToolButton active={tool === "rect"} onClick={() => setTool("rect")} title="Rectangle (R)">Rect</ToolButton>
                <ToolButton active={tool === "poly"} onClick={() => setTool("poly")} title="Polyline (P)">Polyline</ToolButton>
                <ToolButton active={tool === "bezier"} onClick={() => setTool("bezier")} title="Bezier (B)">Bezier</ToolButton>
                <ToolButton active={tool === "point"} onClick={() => setTool("point")} title="Point (O)">Point</ToolButton>
                <div className={styles.divider} />
                <ToolButton onClick={onZoomToFit} title="Zoom to Fit">⛶</ToolButton>
                <ToolButton onClick={onZoomIn} title="Zoom In">🔍➕</ToolButton>
                <ToolButton onClick={onZoomOut} title="Zoom Out">🔍➖</ToolButton>
            </div>
            <div className={styles.spacer} />
            <div className={styles.group}>
                <label className={styles.uploadLabel} title="Load image file">
                    🖼️
                    <input type="file" accept="image/*" style={{ display: 'none' }} onChange={onLoadImage} />
                </label>
                <label className={styles.uploadLabel} title="Import annotation JSON">
                    📥
                    <input type="file" accept="application/json" style={{ display: 'none' }} onChange={onImportJson} />
                </label>
                <ToolButton onClick={onExportJson} title="Export annotations as JSON">💾</ToolButton>
                <ToolButton onClick={onExportBundle} title="Export image and JSON bundle">📦</ToolButton>
                <select
                    className={styles.featureInput}
                    value={pattern}
                    onChange={(e) => onPatternChange(e.target.value)}
                    title="Detection pattern"
                >
                    <option value="chessboard">Chessboard</option>
                    <option value="charuco">ChArUco</option>
                    <option value="circle_grid">Circle Grid</option>
                    <option value="apriltag">AprilTag</option>
                </select>
                <ToolButton onClick={onToggleParams} title="Pattern parameters">⚙️</ToolButton>
                <ToolButton onClick={onDetectFeatures} disabled={!canDetect} title="Detect pattern features">🔍 Detect</ToolButton>
                <div className={styles.zoomInfo}>Zoom: {(zoom * 100).toFixed(0)}%</div>
            </div>
        </div>
    );
};

export default Toolbar;
