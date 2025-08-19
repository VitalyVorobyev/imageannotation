// Main container that manages shared state and composes the application
import { useState } from 'react';
import { Toolbar } from './Toolbar';
import { Canvas } from './Canvas';
import { StatusBar } from './StatusBar';
import { useHistory } from '../../hooks/useHistory';
import { useImageLoader } from '../../hooks/useImageLoader';
import { useShapeManipulation } from '../../hooks/useShapeManipulation';
// ...

const ImageAnnotator = () => {
  // Core shared state remains here
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState<Point>({ x: 0, y: 0 });

  const [tool, setTool] = useState<Tool>("select");
  const [shapes, setShapes] = useState<Shape[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  // ...

  // Use custom hooks to encapsulate functionality
  const { image, imageName, loadImage, importBundle } = useImageLoader();
  const { shapes, selectedId, setSelectedId, beginOp, endOp, /* ... */ } = useShapeManipulation();
  const { undo, redo, canUndo, canRedo } = useHistory(shapes, setShapes);



  return (
    <div className="w-full h-full flex flex-col">
      <Toolbar 
        tool={tool} 
        setTool={setToolAndFinalize}
        onUndo={undo}
        onRedo={redo}
        canUndo={canUndo}
        canRedo={canRedo}
        /* ... */
      />
      <Canvas 
        image={image}
        zoom={zoom}
        pan={pan}
        shapes={shapes}
        selectedId={selectedId}
        /* ... */
      />
      <StatusBar
        image={image}
        imageName={imageName}
        zoom={zoom}
      />
    </div>
  );
}

export default ImageAnnotator;
