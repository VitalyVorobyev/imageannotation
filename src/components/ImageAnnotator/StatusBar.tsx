import styles from './StatusBar.module.css';

interface StatusBarProps {
    image: HTMLImageElement | null;
    imageName?: string;
    imageId?: string | null;
}

const StatusBar = ({ image, imageName, imageId }: StatusBarProps) => {
    return (
        <div className={styles.statusBar}>
            {image ? (
                <span>
                    Image: {imageName || 'unnamed'} ({image.naturalWidth}×{image.naturalHeight}) [ID: {imageId}]
                </span>
            ) : (
                <span>No image loaded. Drop an image or use Load Image button.</span>
            )}
        </div>
    );
};

export default StatusBar;
