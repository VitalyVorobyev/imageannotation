import React from 'react';
import { type Tool } from '../../types';
import ToolButton from '../ToolButton';

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
    onExportBundle
}: ToolbarProps) => {
    return (
        <div className="flex items-center gap-2 p-2 border-b bg-gray-50/70 backdrop-blur sticky top-0 z-10">
            <div className="flex items-center gap-1">
                <ToolButton active={tool === "select"} onClick={() => setTool("select")} title="Select (V)">Select</ToolButton>
                <ToolButton active={tool === "pan"} onClick={() => setTool("pan")} title="Pan (Space)">Pan</ToolButton>
                <div className="w-px h-6 bg-gray-200 mx-1" />
                <ToolButton onClick={onUndo} title="Undo (Ctrl/Cmd+Z)" disabled={!canUndo}>Undo</ToolButton>
                <ToolButton onClick={onRedo} title="Redo (Ctrl+Y or Ctrl+Shift+Z)" disabled={!canRedo}>Redo</ToolButton>
                <div className="w-px h-6 bg-gray-200 mx-1" />
                <ToolButton active={tool === "rect"} onClick={() => setTool("rect")} title="Rectangle (R)">Rect</ToolButton>
                <ToolButton active={tool === "poly"} onClick={() => setTool("poly")} title="Polyline (P)">Polyline</ToolButton>
                <ToolButton active={tool === "bezier"} onClick={() => setTool("bezier")} title="Bezier (B)">Bezier</ToolButton>
                <ToolButton active={tool === "point"} onClick={() => setTool("point")} title="Point (O)">Point</ToolButton>
                <div className="w-px h-6 bg-gray-200 mx-1" />
                <ToolButton onClick={onZoomToFit} title="Zoom to Fit">Fit</ToolButton>
                <ToolButton onClick={onZoomIn} title="Zoom In">＋</ToolButton>
                <ToolButton onClick={onZoomOut} title="Zoom Out">－</ToolButton>
            </div>
            <div className="grow" />
            <div className="flex items-center gap-2">
                <label className="px-3 py-2 rounded-2xl border bg-white cursor-pointer shadow-sm">
                    Load Image
                    <input type="file" accept="image/*" className="hidden" onChange={onLoadImage} />
                </label>
                <label className="px-3 py-2 rounded-2xl border bg-white cursor-pointer shadow-sm">
                    Import JSON
                    <input type="file" accept="application/json" className="hidden" onChange={onImportJson} />
                </label>
                <ToolButton onClick={onExportJson}>Export JSON</ToolButton>
                <ToolButton onClick={onExportBundle}>Export Bundle</ToolButton>
                <div className="text-xs text-gray-500 px-2">Zoom: {(zoom * 100).toFixed(0)}%</div>
            </div>
        </div>
    );
};

export default Toolbar;
