import React from 'react';
import styles from './ToolButton.module.css';

interface ToolButtonProps {
    label?: string;
    active?: boolean;
    onClick?: () => void;
    title?: string;
    children?: React.ReactNode;
    disabled?: boolean;
};

const ToolButton = ({
    label,
    active,
    onClick,
    title,
    children,
    disabled
}: ToolButtonProps) => {
    const className = [styles.button, active ? styles.active : ""].filter(Boolean).join(" ");
    return (
        <button
            className={className}
            onClick={onClick}
            title={title || label}
            disabled={disabled}
        >
            {children || label}
        </button>
    );
};

export default ToolButton;
