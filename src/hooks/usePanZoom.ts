import { useRef, useState, useCallback } from 'react';
import { type Point } from '../types';
import { clamp, screenToImage } from '../utils/coordinates';

interface UsePanZoomProps {
    initialZoom?: number;
    minZoom?: number;
    maxZoom?: number;
};

const usePanZoom = ({
    initialZoom = 1,
    minZoom = 0.1,
    maxZoom = 20
}: UsePanZoomProps = {}) => {
    const [zoom, setZoom] = useState(initialZoom);
    const [pan, setPan] = useState<Point>({ x: 0, y: 0 });
    const panStart = useRef<Point | null>(null);
    const [isPanning, setIsPanning] = useState(false);

    const startPan = (e: React.PointerEvent) => {
        const bounds = (e.currentTarget as Element).getBoundingClientRect();
        const mouse = {
            x: e.clientX - bounds.left,
            y: e.clientY - bounds.top,
        };
        panStart.current = { x: mouse.x - pan.x, y: mouse.y - pan.y };
        setIsPanning(true);
    };

    const updatePan = (e: React.PointerEvent) => {
        if (!panStart.current) return;
        const bounds = (e.currentTarget as Element).getBoundingClientRect();
        const mouse = {
            x: e.clientX - bounds.left,
            y: e.clientY - bounds.top,
        };
        setPan({
            x: mouse.x - panStart.current.x,
            y: mouse.y - panStart.current.y,
        });
    };

    const endPan = () => {
        panStart.current = null;
        setIsPanning(false);
    };

    const onWheel = useCallback((e: React.WheelEvent<HTMLDivElement>) => {
        e.preventDefault();
        const container = e.currentTarget;
        const bounds = container.getBoundingClientRect();
        const mouse = {
            x: e.clientX - bounds.left,
            y: e.clientY - bounds.top
        };

        // Keep cursor position fixed in image space
        const imgPt = screenToImage(mouse, zoom, pan);
        const dz = e.deltaY > 0 ? 0.9 : 1.1;
        const newZoom = clamp(zoom * dz, minZoom, maxZoom);

        // Adjust pan to keep mouse position fixed in image space
        const newPan = {
            x: mouse.x - imgPt.x * newZoom,
            y: mouse.y - imgPt.y * newZoom,
        };

        setZoom(newZoom);
        setPan(newPan);
    }, [zoom, pan, minZoom, maxZoom]);

    const zoomToFit = useCallback((imageWidth: number, imageHeight: number, containerWidth: number, containerHeight: number) => {
        if (!imageWidth || !imageHeight) return;

        const k = Math.min(containerWidth / imageWidth, containerHeight / imageHeight);
        const z = clamp(k, minZoom, maxZoom);

        setZoom(z);
        setPan({
            x: (containerWidth - imageWidth * z) / 2,
            y: (containerHeight - imageHeight * z) / 2
        });
    }, [minZoom, maxZoom]);

    const zoomIn = () => {
        setZoom(z => clamp(z * 1.2, minZoom, maxZoom));
    };

    const zoomOut = () => {
        setZoom(z => clamp(z / 1.2, minZoom, maxZoom));
    };

    return {
        zoom,
        setZoom,
        pan,
        setPan,
        isPanning,
        startPan,
        updatePan,
        endPan,
        onWheel,
        zoomToFit,
        zoomIn,
        zoomOut
    };
};

export default usePanZoom;
