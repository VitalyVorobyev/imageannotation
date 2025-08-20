import ImageAnnotator from "./components/ImageAnnotator";
import styles from "./App.module.css";

export default function App() {
    return (
        <div className={styles.app}>
            <ImageAnnotator />
        </div>
    );
};
