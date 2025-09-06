import React from 'react';
import styles from './PatternPanel.module.css';

interface PatternPanelProps {
    visible: boolean;
    pattern: string;
    params: Record<string, unknown>;
    onParamsChange: (p: Record<string, unknown>) => void;
    onClose: () => void;
}

const PatternPanel = ({ visible, pattern, params, onParamsChange, onClose }: PatternPanelProps) => {
    const update = (key: string, value: unknown) => {
        onParamsChange({ ...params, [key]: value });
    };

    const renderFields = () => {
        switch (pattern) {
            case 'charuco':
                return (
                    <>
                        <label className={styles.field}>
                            <span>Squares X</span>
                            <input
                                type="number"
                                value={(params.squares_x as number) ?? ''}
                                onChange={(e) => update('squares_x', parseInt(e.target.value, 10))}
                                title="Squares in X direction"
                            />
                        </label>
                        <label className={styles.field}>
                            <span>Squares Y</span>
                            <input
                                type="number"
                                value={(params.squares_y as number) ?? ''}
                                onChange={(e) => update('squares_y', parseInt(e.target.value, 10))}
                                title="Squares in Y direction"
                            />
                        </label>
                        <label className={styles.field}>
                            <span>Square Length</span>
                            <input
                                type="number"
                                value={(params.square_length as number) ?? ''}
                                onChange={(e) => update('square_length', parseFloat(e.target.value))}
                                title="Length of square"
                            />
                        </label>
                        <label className={styles.field}>
                            <span>Marker Length</span>
                            <input
                                type="number"
                                value={(params.marker_length as number) ?? ''}
                                onChange={(e) => update('marker_length', parseFloat(e.target.value))}
                                title="Length of marker"
                            />
                        </label>
                        <label className={styles.field}>
                            <span>Dictionary</span>
                            <input
                                type="text"
                                value={(params.dictionary as string) ?? ''}
                                onChange={(e) => update('dictionary', e.target.value)}
                                title="Aruco dictionary"
                            />
                        </label>
                    </>
                );
            case 'circle_grid':
                return (
                    <>
                        <label className={styles.field}>
                            <span>Rows</span>
                            <input
                                type="number"
                                value={(params.rows as number) ?? ''}
                                onChange={(e) => update('rows', parseInt(e.target.value, 10))}
                                title="Number of rows"
                            />
                        </label>
                        <label className={styles.field}>
                            <span>Cols</span>
                            <input
                                type="number"
                                value={(params.cols as number) ?? ''}
                                onChange={(e) => update('cols', parseInt(e.target.value, 10))}
                                title="Number of columns"
                            />
                        </label>
                        <label className={styles.checkboxField}>
                            <input
                                type="checkbox"
                                checked={Boolean(params.symmetric)}
                                onChange={(e) => update('symmetric', e.target.checked)}
                                title="Symmetric grid"
                            />
                            <span>Symmetric</span>
                        </label>
                    </>
                );
            case 'chessboard':
                return (
                    <>
                        <label className={styles.field}>
                            <span>Rows</span>
                            <input
                                type="number"
                                value={(params.rows as number) ?? ''}
                                onChange={(e) => update('rows', parseInt(e.target.value, 10))}
                                title="Number of rows"
                            />
                        </label>
                        <label className={styles.field}>
                            <span>Cols</span>
                            <input
                                type="number"
                                value={(params.cols as number) ?? ''}
                                onChange={(e) => update('cols', parseInt(e.target.value, 10))}
                                title="Number of columns"
                            />
                        </label>
                    </>
                );
            case 'apriltag':
                return (
                    <label className={styles.field}>
                        <span>Dictionary</span>
                        <input
                            type="text"
                            value={(params.dictionary as string) ?? ''}
                            onChange={(e) => update('dictionary', e.target.value)}
                            title="AprilTag dictionary"
                        />
                    </label>
                );
            default:
                return null;
        }
    };

    return (
        <div className={`${styles.panel} ${visible ? styles.visible : ''}`}>
            <div className={styles.header}>
                <span className={styles.title}>Pattern Params</span>
                <button className={styles.closeBtn} onClick={onClose} title="Close">✖</button>
            </div>
            <div className={styles.content}>
                {renderFields()}
            </div>
        </div>
    );
};

export default PatternPanel;
