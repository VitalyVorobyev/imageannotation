import { type AnnotationBundle, type Shape } from "../types";

export const canvasToDataURL = (imgEl: HTMLImageElement): string => {
    const c = document.createElement("canvas");
    c.width = imgEl.naturalWidth;
    c.height = imgEl.naturalHeight;
    const ctx = c.getContext("2d")!;
    ctx.drawImage(imgEl, 0, 0);
    return c.toDataURL("image/png");
};

export const exportJson = async (
    shapes: Shape[],
    image: HTMLImageElement | null,
    imageName: string | undefined,
    includeImage: boolean
) => {
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
};
