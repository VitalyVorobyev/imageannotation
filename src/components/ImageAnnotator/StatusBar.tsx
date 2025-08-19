interface StatusBarProps {
    image: HTMLImageElement | null;
    imageName?: string;
}

const StatusBar = ({ image, imageName }: StatusBarProps) => {
    return (
        <div className="px-3 py-1 border-t bg-gray-50/70 text-sm text-gray-600">
            {image ? (
                <span>
                    Image: {imageName || 'unnamed'} ({image.naturalWidth}×{image.naturalHeight})
                </span>
            ) : (
                <span>No image loaded. Drop an image or use Load Image button.</span>
            )}
        </div>
    );
};

export default StatusBar;
