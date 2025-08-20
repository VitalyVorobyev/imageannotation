import styles from './StatusBar.module.css';

interface StatusBarProps {
    image: HTMLImageElement | null;
    imageName?: string;
}

const StatusBar = ({ image, imageName }: StatusBarProps) => {
    return (
        <div className={styles.statusBar}>
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
