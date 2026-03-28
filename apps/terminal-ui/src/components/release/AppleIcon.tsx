import React from 'react';

export const AppleIcon = ({
    size = 28,
    color = "currentColor",
    className,
}: {
    size?: number
    color?: string
    className?: string
}) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
    >
        <path
            d="M17.05 20.28C16.07 21.23 15.06 21.08 14.1 20.67C13.09 20.25 12.16 20.24 11.11 20.67C9.79 21.23 9.06 21.08 8.19 20.28C2.79 14.73 3.55 6.53 9.59 6.24C11.03 6.32 12 7.11 12.94 7.17C14.32 6.93 15.66 6.12 17.12 6.22C18.87 6.35 20.18 7.06 21.03 8.36C17.15 10.68 18.03 15.84 21.66 17.27C20.96 19.04 20.05 20.8 17.04 20.29L17.05 20.28ZM12.83 6.17C12.67 3.95 14.37 2.14 16.46 2C16.75 4.58 14.07 6.5 12.83 6.17Z"
            fill={color}
        />
    </svg>
);
