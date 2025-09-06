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
    params: Record<string, unknown>;
    onPatternChange: (val: string) => void;
    onParamsChange: (params: Record<string, unknown>) => void;
    onDetectFeatures: () => void;
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
    params,
    onPatternChange,
    onParamsChange,
    onDetectFeatures,
    canDetect
}: ToolbarProps) => {
    const updateParam = (key: string, value: unknown) => {
        onParamsChange({ ...params, [key]: value });
    };

    const renderParamInputs = () => {
        switch (pattern) {
            case 'charuco':
                return (
                    <>
                        <input
                            className={styles.paramInput}
                            type="number"
                            value={(params.squares_x as number) ?? ''}
                            onChange={(e) => updateParam('squares_x', parseInt(e.target.value, 10))}
                            placeholder="Squares X"
                        />
                        <input
                            className={styles.paramInput}
                            type="number"
                            value={(params.squares_y as number) ?? ''}
                            onChange={(e) => updateParam('squares_y', parseInt(e.target.value, 10))}
                            placeholder="Squares Y"
                        />
                        <input
                            className={styles.paramInput}
                            type="number"
                            value={(params.square_length as number) ?? ''}
                            onChange={(e) => updateParam('square_length', parseFloat(e.target.value))}
                            placeholder="Square Len"
                        />
                        <input
                            className={styles.paramInput}
                            type="number"
                            value={(params.marker_length as number) ?? ''}
                            onChange={(e) => updateParam('marker_length', parseFloat(e.target.value))}
                            placeholder="Marker Len"
                        />
                        <input
                            className={styles.paramInput}
                            type="text"
                            value={(params.dictionary as string) ?? ''}
                            onChange={(e) => updateParam('dictionary', e.target.value)}
                            placeholder="Dictionary"
                        />
                    </>
                );
            case 'circle_grid':
                return (
                    <>
                        <input
                            className={styles.paramInput}
                            type="number"
                            value={(params.rows as number) ?? ''}
                            onChange={(e) => updateParam('rows', parseInt(e.target.value, 10))}
                            placeholder="Rows"
                        />
                        <input
                            className={styles.paramInput}
                            type="number"
                            value={(params.cols as number) ?? ''}
                            onChange={(e) => updateParam('cols', parseInt(e.target.value, 10))}
                            placeholder="Cols"
                        />
                        <label className={styles.checkboxLabel}>
                            Symmetric
                            <input
                                type="checkbox"
                                checked={Boolean(params.symmetric)}
                                onChange={(e) => updateParam('symmetric', e.target.checked)}
                            />
                        </label>
                    </>
                );
            case 'chessboard':
                return (
                    <>
                        <input
                            className={styles.paramInput}
                            type="number"
                            value={(params.rows as number) ?? ''}
                            onChange={(e) => updateParam('rows', parseInt(e.target.value, 10))}
                            placeholder="Rows"
                        />
                        <input
                            className={styles.paramInput}
                            type="number"
                            value={(params.cols as number) ?? ''}
                            onChange={(e) => updateParam('cols', parseInt(e.target.value, 10))}
                            placeholder="Cols"
                        />
                    </>
                );
            case 'apriltag':
                return (
                    <input
                        className={styles.paramInput}
                        type="text"
                        value={(params.dictionary as string) ?? ''}
                        onChange={(e) => updateParam('dictionary', e.target.value)}
                        placeholder="Dictionary"
                    />
                );
            default:
                return null;
        }
    };

    return (
        <div className={styles.toolbar}>
            <div className={styles.group}>
                <ToolButton active={tool === "select"} onClick={() => setTool("select")} title="Select (V)">Select</ToolButton>
                <ToolButton active={tool === "pan"} onClick={() => setTool("pan")} title="Pan (Space)">Pan</ToolButton>
                <div className={styles.divider} />
                <ToolButton onClick={onUndo} title="Undo (Ctrl/Cmd+Z)" disabled={!canUndo}>Undo</ToolButton>
                <ToolButton onClick={onRedo} title="Redo (Ctrl+Y or Ctrl+Shift+Z)" disabled={!canRedo}>Redo</ToolButton>
                <div className={styles.divider} />
                <ToolButton active={tool === "rect"} onClick={() => setTool("rect")} title="Rectangle (R)">Rect</ToolButton>
                <ToolButton active={tool === "poly"} onClick={() => setTool("poly")} title="Polyline (P)">Polyline</ToolButton>
                <ToolButton active={tool === "bezier"} onClick={() => setTool("bezier")} title="Bezier (B)">Bezier</ToolButton>
                <ToolButton active={tool === "point"} onClick={() => setTool("point")} title="Point (O)">Point</ToolButton>
                <div className={styles.divider} />
                <ToolButton onClick={onZoomToFit} title="Zoom to Fit">Fit</ToolButton>
                <ToolButton onClick={onZoomIn} title="Zoom In">＋</ToolButton>
                <ToolButton onClick={onZoomOut} title="Zoom Out">－</ToolButton>
            </div>
            <div className={styles.spacer} />
            <div className={styles.group}>
                <label className={styles.uploadLabel}>
                    Load Image
                    <input type="file" accept="image/*" style={{ display: 'none' }} onChange={onLoadImage} />
                </label>
                <label className={styles.uploadLabel}>
                    Import JSON
                    <input type="file" accept="application/json" style={{ display: 'none' }} onChange={onImportJson} />
                </label>
                <ToolButton onClick={onExportJson}>Export JSON</ToolButton>
                <ToolButton onClick={onExportBundle}>Export Bundle</ToolButton>
                <select
                    className={styles.featureInput}
                    value={pattern}
                    onChange={(e) => onPatternChange(e.target.value)}
                >
                    <option value="chessboard">Chessboard</option>
                    <option value="charuco">ChArUco</option>
                    <option value="circle_grid">Circle Grid</option>
                    <option value="apriltag">AprilTag</option>
                </select>
                {renderParamInputs()}
                <ToolButton onClick={onDetectFeatures} disabled={!canDetect}>Detect</ToolButton>
                <div className={styles.zoomInfo}>Zoom: {(zoom * 100).toFixed(0)}%</div>
            </div>
        </div>
    );
};

export default Toolbar;
