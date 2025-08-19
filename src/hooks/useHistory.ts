import { useRef, useState } from 'react';
import { type Shape } from '../types';

const useHistory = (
    shapes: Shape[],
    setShapes: React.Dispatch<React.SetStateAction<Shape[]>>
) => {
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
        setHistoryFlags();
    };

    const redo = () => {
        if (redoStack.current.length === 0) return;
        undoStack.current.push(deepCloneShapes(shapes));
        const next = redoStack.current.pop()!;
        setShapes(next);
        setHistoryFlags();
    };

    const cancelOp = () => {
        opStarted.current = false;
    };

    return { beginOp, endOp, undo, redo, cancelOp, canUndo, canRedo };
};

export default useHistory;
