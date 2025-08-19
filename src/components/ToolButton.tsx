import React from 'react';

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
    return (
        <button
            className={`px-3 py-2 rounded-2xl border text-sm font-medium shadow-sm transition active:scale-[.98] select-none ${
            active ? "bg-sky-600 text-white border-sky-700" : "bg-white/90 hover:bg-white border-gray-200"}`}
            onClick={onClick}
            title={title || label}
            disabled={disabled}
        >
            {children || label}
        </button>
    );
};

export default ToolButton;
