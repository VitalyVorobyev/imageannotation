import { useState, useRef } from 'react';
import { type AnnotationBundle, type Shape } from '../types';
import { uploadImage } from '../utils/api';

const useImageLoader = (onReset?: () => void) => {
    const [image, setImage] = useState<HTMLImageElement | null>(null);
    const [imageName, setImageName] = useState<string | undefined>(undefined);
    const [imageId, setImageId] = useState<string | null>(null);

    // Track the current upload to prevent stale updates
    const currentUploadRef = useRef<string | null>(null);

    const loadImageFromFile = (file: File) => {
        if (!file || !file.type.startsWith('image/')) return;

        // Generate a unique token for this upload
        const uploadToken = Math.random().toString(36);
        currentUploadRef.current = uploadToken;

        setImageId(null);
        const img = new Image();

        img.onload = () => {
            if (currentUploadRef.current === uploadToken) {
                setImage(img);
                setImageName(file.name);
                onReset?.();
            }
            URL.revokeObjectURL(img.src);
        };

        img.onerror = () => {
            if (currentUploadRef.current === uploadToken) {
                alert("Failed to load image. Please try a different file.");
            }
            URL.revokeObjectURL(img.src);
        };

        // Start reading the image immediately via object URL
        img.src = URL.createObjectURL(file);

        // Upload in the background
        uploadImage(file)
            .then((id) => {
                if (currentUploadRef.current === uploadToken) {
                    setImageId(id);
                }
            })
            .catch((err) => {
                console.error('Failed to upload image', err);
                if (currentUploadRef.current === uploadToken) {
                    // Error handling for current upload only
                }
            });
    };

    const loadImageFromDataUrl = (dataUrl: string, name?: string) => {
        // Clear any pending uploads since we're loading from data URL
        currentUploadRef.current = null;

        const img = new Image();
        img.onload = () => {
            setImage(img);
            setImageName(name);
            setImageId(null);
            onReset?.();
        };
        img.src = dataUrl;
    };

    const handleFileInput = (ev: React.ChangeEvent<HTMLInputElement>) => {
        const input = ev.currentTarget;
        const file = input.files?.[0];
        if (file) {
            loadImageFromFile(file);
        }
        // Allow selecting the same file again later
        input.value = "";
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        const file = e.dataTransfer?.files?.[0];
        if (file) {
            loadImageFromFile(file);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy';
    };

    const importBundle = (bundle: AnnotationBundle, onShapesLoaded: (shapes: Shape[]) => void) => {
        if (bundle.image?.dataUrl) {
            loadImageFromDataUrl(bundle.image.dataUrl, bundle.image.name);
        }
        if (bundle.shapes) {
            onShapesLoaded(bundle.shapes);
        }
    };

    const handleImportJson = (ev: React.ChangeEvent<HTMLInputElement>, onShapesLoaded: (shapes: Shape[]) => void) => {
        const file = ev.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = () => {
            try {
                const data = JSON.parse(String(reader.result)) as AnnotationBundle;
                importBundle(data, onShapesLoaded);
            } catch (err) {
                alert("Invalid annotation JSON: " + err);
            }
        };
        reader.readAsText(file);

        // Reset input
        ev.target.value = "";
    };

    return {
        image,
        imageName,
        imageId,
        loadImageFromFile,
        loadImageFromDataUrl,
        handleFileInput,
        handleDrop,
        handleDragOver,
        importBundle,
        handleImportJson
    };
};

export default useImageLoader;
