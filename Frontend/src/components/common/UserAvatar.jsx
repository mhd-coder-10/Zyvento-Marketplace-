import React, { useState } from 'react';

/**
 * Resolves full URL for an image path.
 * Handles Cloudinary URLs, absolute http/https URLs, blob/data URLs,
 * and relative /uploads/... URLs from the backend.
 */
export const getFullImageUrl = (path) => {
    if (!path || typeof path !== 'string') return '';
    const trimmed = path.trim();
    if (!trimmed) return '';

    // Already full URL or blob/data
    if (
        trimmed.startsWith('http://') ||
        trimmed.startsWith('https://') ||
        trimmed.startsWith('blob:') ||
        trimmed.startsWith('data:')
    ) {
        return trimmed;
    }

    // Try VITE_HOST_API_URL or window.location hostname with port 5001
    let baseUrl = '';
    if (typeof window !== 'undefined' && window.location?.hostname) {
        baseUrl = `${window.location.protocol}//${window.location.hostname}:5001`;
    } else if (import.meta.env.VITE_HOST_API_URL) {
        try {
            const parsed = new URL(import.meta.env.VITE_HOST_API_URL);
            baseUrl = `${parsed.protocol}//${parsed.host}`;
        } catch { }
    }

    const cleanPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
    return baseUrl ? `${baseUrl}${cleanPath}` : cleanPath;
};

/**
 * Extracts 1-2 letters initials from a name or email.
 */
export const getInitials = (name = '', fallback = 'U') => {
    if (!name || typeof name !== 'string') return fallback;
    const clean = name.trim();
    if (!clean) return fallback;

    const parts = clean.split(/\s+/).filter(Boolean);
    if (parts.length === 1) {
        return parts[0].slice(0, 2).toUpperCase();
    }
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

/**
 * Robust UserAvatar component:
 * - Shows image when valid
 * - Falls back to vibrant gradient avatar with initials on load error or missing image
 * - Never shows broken image icon
 */
const UserAvatar = ({
    src,
    name = '',
    alt = '',
    size = 'md',
    shape = 'circle',
    className = '',
    textClassName = '',
    isDeleted = false,
}) => {
    const [imgError, setImgError] = useState(false);

    const fullSrc = !imgError && src ? getFullImageUrl(src) : null;
    const initials = getInitials(name);

    // Preset sizing
    const sizeMap = {
        xs: 'w-6 h-6 text-[10px]',
        sm: 'w-8 h-8 text-xs',
        md: 'w-10 h-10 text-xs',
        lg: 'w-11 h-11 text-sm',
        xl: 'w-14 h-14 text-base',
        '2xl': 'w-24 h-24 text-2xl',
        '3xl': 'w-28 h-28 text-3xl',
    };

    const sizeClass = sizeMap[size] || size;
    const shapeClass = shape === 'circle' ? 'rounded-full' : (shape === 'rounded-2xl' || shape === '2xl') ? 'rounded-2xl' : 'rounded-xl';

    const bgGradient = isDeleted
        ? 'from-slate-400 to-slate-600'
        : 'from-blue-600 via-indigo-600 to-sky-500';

    if (fullSrc) {
        return (
            <div className={`relative inline-flex shrink-0 items-center justify-center overflow-hidden border border-slate-200/80 bg-slate-100 shadow-sm ${sizeClass} ${shapeClass} ${className}`}>
                <img
                    src={fullSrc}
                    alt={alt || name || 'User avatar'}
                    onError={() => setImgError(true)}
                    className={`h-full w-full object-cover ${shapeClass}`}
                    loading="lazy"
                />
            </div>
        );
    }

    return (
        <div
            className={`inline-flex shrink-0 items-center justify-center font-bold text-white shadow-sm bg-gradient-to-tr ${bgGradient} ${sizeClass} ${shapeClass} ${className}`}
            title={name || alt}
            aria-label={name || alt}
        >
            <span className={textClassName}>{initials}</span>
        </div>
    );
};

export default UserAvatar;
