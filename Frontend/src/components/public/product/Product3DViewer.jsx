import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
    FiRotateCw,
    FiRotateCcw,
    FiMaximize2,
    FiHeart,
    FiShare2,
    FiTag,
    FiShield,
    FiEye,
    FiEyeOff,
    FiCrosshair,
    FiPlay,
    FiPause,
    FiZoomIn,
    FiLayers,
    FiX,
    FiChevronLeft,
    FiChevronRight
} from 'react-icons/fi';

const FALLBACK_PRODUCT_IMAGE =
    'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=1000&auto=format&fit=crop&q=85';

/**
 * 3D / 360° Product Studio Viewer Architecture
 * Features:
 *  1. 3D Perspective Tilt with dynamic cursor tracking & ambient specular sheen
 *  2. 360° Turntable Rotation mode with drag-to-spin, angle slider & auto-rotation tour
 *  3. Precision Magnifier Loupe with cursor-following detail view
 *  4. Interactive 3D Feature Hotspots / Radar Pins with popover details
 *  5. Fullscreen Studio Lightbox with full 360° controls
 *  6. Ultra-clean thumbnail carousel with generous padding (zero border cut-offs on all devices)
 */
const Product3DViewer = ({
    product,
    imageList = [],
    selectedImage = 0,
    setSelectedImage,
    discount = 0,
    inWishlist = false,
    wishlistLoading = false,
    toggleWishlist,
    handleShare,
    brand = '',
    name = ''
}) => {
    // Viewer Modes: '3d' (Spatial Tilt), '360' (Turntable Rotation), 'zoom' (Deep Loupe)
    const [viewerMode, setViewerMode] = useState('3d');

    // 3D Spatial Tilt state
    const [tilt, setTilt] = useState({ x: 0, y: 0 });
    const [sheen, setSheen] = useState({ x: 50, y: 50, opacity: 0 });
    const [isHovered, setIsHovered] = useState(false);

    // 360 Turntable state
    const [isAutoRotating, setIsAutoRotating] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [dragStartX, setDragStartX] = useState(0);

    // Deep Loupe state
    const [loupePos, setLoupePos] = useState({ x: 50, y: 50 });

    // Interactive Hotspots state
    const [showHotspots, setShowHotspots] = useState(true);
    const [activeHotspot, setActiveHotspot] = useState(null);

    // Fullscreen Studio Lightbox
    const [isLightboxOpen, setIsLightboxOpen] = useState(false);
    const [lightboxZoom, setLightboxZoom] = useState(1);

    const containerRef = useRef(null);
    const autoRotateTimerRef = useRef(null);

    const totalAngles = Math.max(imageList.length, 1);

    // Safe images
    const safeImages = imageList.length > 0 ? imageList : [FALLBACK_PRODUCT_IMAGE];
    const currentImg = safeImages[selectedImage] || safeImages[0] || FALLBACK_PRODUCT_IMAGE;

    // Angle degrees calculation (e.g. 0°, 90°, 180°, 270°)
    const angleStep = 360 / totalAngles;
    const currentDegree = Math.round(selectedImage * angleStep);

    // Angle labels
    const getAngleLabel = (idx) => {
        if (totalAngles === 1) return '0° Front View';
        const deg = Math.round(idx * angleStep);
        if (deg === 0) return '0° Front';
        if (deg > 0 && deg < 90) return `${deg}° Quarter`;
        if (deg === 90) return '90° Right Side';
        if (deg > 90 && deg < 180) return `${deg}° Perspective`;
        if (deg === 180) return '180° Rear';
        if (deg > 180 && deg < 270) return `${deg}° Angle`;
        if (deg === 270) return '270° Left Side';
        return `${deg}° Angle`;
    };

    // Auto-Rotate 360° Tour effect
    useEffect(() => {
        if (isAutoRotating && safeImages.length > 1) {
            autoRotateTimerRef.current = setInterval(() => {
                setSelectedImage((prev) => (prev + 1) % safeImages.length);
            }, 1400);
        } else {
            if (autoRotateTimerRef.current) clearInterval(autoRotateTimerRef.current);
        }
        return () => {
            if (autoRotateTimerRef.current) clearInterval(autoRotateTimerRef.current);
        };
    }, [isAutoRotating, safeImages.length, setSelectedImage]);

    // Handle 3D Tilt & Mouse movement
    const handleMouseMove = (e) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const clientX = e.clientX - rect.left;
        const clientY = e.clientY - rect.top;

        const xPct = Math.max(0, Math.min(100, (clientX / rect.width) * 100));
        const yPct = Math.max(0, Math.min(100, (clientY / rect.height) * 100));

        if (viewerMode === '3d') {
            // Calculate tilt: -14 to +14 deg
            const maxTilt = 14;
            const tiltY = ((clientX / rect.width) - 0.5) * (maxTilt * 2);
            const tiltX = -((clientY / rect.height) - 0.5) * (maxTilt * 2);
            setTilt({ x: tiltX, y: tiltY });
            setSheen({ x: xPct, y: yPct, opacity: 0.35 });
        } else if (viewerMode === 'zoom') {
            setLoupePos({ x: xPct, y: yPct });
        } else if (viewerMode === '360' && isDragging) {
            const deltaX = e.clientX - dragStartX;
            if (Math.abs(deltaX) > 40) {
                if (deltaX > 0) {
                    // Rotate counter-clockwise / prev
                    setSelectedImage((prev) => (prev - 1 + safeImages.length) % safeImages.length);
                } else {
                    // Rotate clockwise / next
                    setSelectedImage((prev) => (prev + 1) % safeImages.length);
                }
                setDragStartX(e.clientX);
            }
        }
    };

    const handleMouseEnter = () => {
        setIsHovered(true);
        if (viewerMode === '3d') {
            setSheen((prev) => ({ ...prev, opacity: 0.35 }));
        }
    };

    const handleMouseLeave = () => {
        setIsHovered(false);
        setIsDragging(false);
        setTilt({ x: 0, y: 0 });
        setSheen((prev) => ({ ...prev, opacity: 0 }));
    };

    // 360 Drag start/end
    const handleMouseDown = (e) => {
        if (viewerMode === '360') {
            setIsDragging(true);
            setDragStartX(e.clientX);
        }
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    // Mobile touch interaction handlers
    const handleTouchStart = (e) => {
        if (e.touches && e.touches.length > 0) {
            setIsHovered(true);
            if (viewerMode === '360') {
                setIsDragging(true);
                setDragStartX(e.touches[0].clientX);
            }
        }
    };

    const handleTouchMove = (e) => {
        if (!e.touches || e.touches.length === 0 || !containerRef.current) return;
        const touch = e.touches[0];
        const rect = containerRef.current.getBoundingClientRect();
        const clientX = touch.clientX - rect.left;
        const clientY = touch.clientY - rect.top;

        const xPct = Math.max(0, Math.min(100, (clientX / rect.width) * 100));
        const yPct = Math.max(0, Math.min(100, (clientY / rect.height) * 100));

        if (viewerMode === '3d') {
            const maxTilt = 14;
            const tiltY = ((clientX / rect.width) - 0.5) * (maxTilt * 2);
            const tiltX = -((clientY / rect.height) - 0.5) * (maxTilt * 2);
            setTilt({ x: tiltX, y: tiltY });
            setSheen({ x: xPct, y: yPct, opacity: 0.35 });
        } else if (viewerMode === 'zoom') {
            setLoupePos({ x: xPct, y: yPct });
        } else if (viewerMode === '360' && isDragging) {
            const deltaX = touch.clientX - dragStartX;
            if (Math.abs(deltaX) > 25) {
                if (deltaX > 0) {
                    setSelectedImage((prev) => (prev - 1 + safeImages.length) % safeImages.length);
                } else {
                    setSelectedImage((prev) => (prev + 1) % safeImages.length);
                }
                setDragStartX(touch.clientX);
            }
        }
    };

    const handleTouchEnd = () => {
        setIsDragging(false);
        setIsHovered(false);
        setTilt({ x: 0, y: 0 });
        setSheen((prev) => ({ ...prev, opacity: 0 }));
    };

    // Angle Navigation Buttons
    const handleNextAngle = useCallback(() => {
        setSelectedImage((prev) => (prev + 1) % safeImages.length);
    }, [safeImages.length, setSelectedImage]);

    const handlePrevAngle = useCallback(() => {
        setSelectedImage((prev) => (prev - 1 + safeImages.length) % safeImages.length);
    }, [safeImages.length, setSelectedImage]);

    // Product hotspots derived from product attributes or high-value defaults
    const hotspots = [
        {
            id: 'craft',
            x: 28,
            y: 35,
            title: 'Premium Craftsmanship',
            desc: product?.attributes?.material
                ? `Crafted with authentic ${product.attributes.material} for high longevity.`
                : 'Engineered with certified materials and rigorous quality finishing.'
        },
        {
            id: 'ergonomics',
            x: 72,
            y: 50,
            title: 'Precision Ergonomics',
            desc: 'Thoughtfully designed contouring for effortless daily performance and comfort.'
        },
        {
            id: 'authentic',
            x: 45,
            y: 80,
            title: 'Zyvento Verified 100%',
            desc: 'Inspected and certified genuine directly from authorized verified seller.'
        }
    ];

    return (
        <div className="space-y-4 select-none">
            {/* ============================================================
                STUDIO CONTROL BAR (MODE SELECTOR + QUICK ACTIONS)
                ============================================================ */}
            <div className="flex flex-wrap items-center justify-between gap-2.5 p-2 bg-slate-100/80 backdrop-blur-md rounded-2xl border border-slate-200/90 shadow-2xs">
                {/* 3D Mode Pills */}
                <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200/80 shadow-2xs">
                    <button
                        type="button"
                        onClick={() => {
                            setViewerMode('3d');
                            setIsAutoRotating(false);
                        }}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                            viewerMode === '3d'
                                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xs'
                                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                        }`}
                        title="3D Spatial Perspective & Specular Tilt"
                    >
                        <FiLayers className="w-3.5 h-3.5" />
                        <span>3D Spatial</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setViewerMode('360')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                            viewerMode === '360'
                                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xs'
                                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                        }`}
                        title="360° Turntable Inspection Mode"
                    >
                        <FiRotateCw className="w-3.5 h-3.5" />
                        <span>360° Turntable</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => {
                            setViewerMode('zoom');
                            setIsAutoRotating(false);
                        }}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                            viewerMode === 'zoom'
                                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xs'
                                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                        }`}
                        title="Deep Precision Magnifier Loupe"
                    >
                        <FiZoomIn className="w-3.5 h-3.5" />
                        <span>Magnifier</span>
                    </button>
                </div>

                {/* Hotspot & Fullscreen Controls */}
                <div className="flex items-center gap-1.5">
                    {/* Toggle Hotspots */}
                    <button
                        type="button"
                        onClick={() => setShowHotspots((prev) => !prev)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold transition border ${
                            showHotspots
                                ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                                : 'bg-white border-slate-200 text-slate-500 hover:text-slate-800'
                        }`}
                        title="Toggle 3D Feature Hotspots"
                    >
                        {showHotspots ? <FiCrosshair className="w-3.5 h-3.5 text-indigo-600" /> : <FiEyeOff className="w-3.5 h-3.5" />}
                        <span className="hidden sm:inline">Pins</span>
                    </button>

                    {/* Expand Fullscreen Studio */}
                    <button
                        type="button"
                        onClick={() => setIsLightboxOpen(true)}
                        className="p-2 bg-white hover:bg-slate-50 text-slate-600 hover:text-blue-600 border border-slate-200/90 rounded-xl shadow-2xs transition active:scale-95 cursor-pointer"
                        title="Open Fullscreen 3D Studio"
                    >
                        <FiMaximize2 className="w-4 h-4" />
                    </button>

                    {/* Wishlist */}
                    {toggleWishlist && (
                        <button
                            type="button"
                            onClick={toggleWishlist}
                            disabled={wishlistLoading}
                            className={`p-2 rounded-xl border transition shadow-2xs active:scale-95 cursor-pointer ${
                                inWishlist
                                    ? 'bg-rose-50 border-rose-200 text-rose-600 ring-2 ring-rose-100'
                                    : 'bg-white border-slate-200/90 text-slate-500 hover:text-rose-600'
                            }`}
                            title={inWishlist ? 'Remove from Wishlist' : 'Add to Wishlist'}
                        >
                            <FiHeart className={`w-4 h-4 ${inWishlist ? 'fill-rose-500 text-rose-500' : ''}`} />
                        </button>
                    )}
                </div>
            </div>

            {/* ============================================================
                MAIN 3D INTERACTIVE STAGE & STUDIO CANVAS
                ============================================================ */}
            <div
                ref={containerRef}
                onMouseMove={handleMouseMove}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                onMouseDown={handleMouseDown}
                onMouseUp={handleMouseUp}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                className="relative aspect-square w-full rounded-3xl overflow-hidden bg-gradient-to-b from-slate-50 via-slate-100/60 to-slate-200/40 border border-slate-200 shadow-inner flex items-center justify-center p-6 sm:p-8 cursor-grab active:cursor-grabbing group transition-all touch-none select-none"
                style={{ perspective: '1200px' }}
            >
                {/* Studio Ambient Circular Pedestal Background */}
                <div className="absolute inset-8 rounded-full bg-radial from-white via-slate-100/30 to-transparent pointer-events-none opacity-80" />

                {/* Studio Grid Lines for depth feel */}
                <div
                    className="absolute inset-0 opacity-[0.03] pointer-events-none"
                    style={{
                        backgroundImage:
                            'radial-gradient(circle at center, #000 1px, transparent 1px)',
                        backgroundSize: '24px 24px'
                    }}
                />

                {/* 3D Depth Floor Drop Shadow */}
                <div
                    className="absolute bottom-6 w-3/5 h-8 rounded-full bg-slate-950/20 blur-xl transition-all duration-200 pointer-events-none"
                    style={{
                        transform: `translateX(${-tilt.y * 1.5}px) scaleX(${
                            isHovered ? 1.08 : 1
                        }) scaleY(${isHovered ? 0.85 : 1})`,
                        opacity: isHovered ? 0.35 : 0.22
                    }}
                />

                {/* 3D Transform Object Layer */}
                <div
                    className="relative w-full h-full flex items-center justify-center transition-transform duration-150 ease-out will-change-transform"
                    style={{
                        transform:
                            viewerMode === '3d'
                                ? `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) scale(${
                                      isHovered ? 1.04 : 1
                                  })`
                                : viewerMode === 'zoom'
                                ? 'scale(1)'
                                : `scale(${isDragging ? 0.98 : 1})`,
                        transformStyle: 'preserve-3d'
                    }}
                >
                    {/* The Primary Product Image */}
                    <img
                        src={currentImg}
                        alt={name}
                        onError={(e) => {
                            if (e.currentTarget.src !== FALLBACK_PRODUCT_IMAGE) {
                                e.currentTarget.src = FALLBACK_PRODUCT_IMAGE;
                            }
                        }}
                        className="max-h-full max-w-full object-contain drop-shadow-md select-none pointer-events-none transition-transform duration-300"
                        style={{
                            filter: isHovered ? 'drop-shadow(0 20px 25px rgba(0,0,0,0.12))' : 'drop-shadow(0 10px 15px rgba(0,0,0,0.08))'
                        }}
                    />

                    {/* Specular Ambient Light Reflection Sheen (glides across product in 3D mode) */}
                    {viewerMode === '3d' && (
                        <div
                            className="absolute inset-0 rounded-2xl pointer-events-none transition-opacity duration-200"
                            style={{
                                background: `radial-gradient(circle 280px at ${sheen.x}% ${sheen.y}%, rgba(255,255,255,${sheen.opacity}) 0%, rgba(255,255,255,0) 70%)`
                            }}
                        />
                    )}

                    {/* Interactive 3D Feature Hotspots / Radar Pins */}
                    {showHotspots &&
                        viewerMode !== 'zoom' &&
                        hotspots.map((spot) => {
                            const isActive = activeHotspot?.id === spot.id;
                            return (
                                <div
                                    key={spot.id}
                                    className="absolute transition-all z-20"
                                    style={{
                                        left: `${spot.x}%`,
                                        top: `${spot.y}%`,
                                        transform: 'translate(-50%, -50%) translateZ(30px)'
                                    }}
                                >
                                    {/* Radar Ping Animation */}
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setActiveHotspot(isActive ? null : spot);
                                        }}
                                        className={`relative group/pin p-1 cursor-pointer focus:outline-hidden transition-transform duration-200 ${
                                            isActive ? 'scale-125' : 'hover:scale-110'
                                        }`}
                                        title={spot.title}
                                    >
                                        <span className={`absolute inset-0 rounded-full animate-ping ${isActive ? 'bg-sky-400 opacity-90' : 'bg-blue-500 opacity-60'}`} />
                                        <span className={`relative flex items-center justify-center w-6 h-6 rounded-full text-white text-[11px] font-black shadow-lg border-2 border-white transition-colors ${
                                            isActive ? 'bg-sky-500 shadow-sky-500/50' : 'bg-blue-600 shadow-blue-500/40'
                                        }`}>
                                            {isActive ? '✓' : '+'}
                                        </span>
                                    </button>
                                </div>
                            );
                        })}
                </div>

                {/* Deep Loupe Lens Magnifier View */}
                {viewerMode === 'zoom' && isHovered && (
                    <div
                        className="absolute w-44 h-44 rounded-full border-4 border-white shadow-2xl overflow-hidden pointer-events-none z-30 ring-4 ring-blue-500/30 bg-white"
                        style={{
                            left: `${loupePos.x}%`,
                            top: `${loupePos.y}%`,
                            transform: 'translate(-50%, -50%)',
                            backgroundImage: `url(${currentImg})`,
                            backgroundRepeat: 'no-repeat',
                            backgroundSize: '320%',
                            backgroundPosition: `${loupePos.x}% ${loupePos.y}%`
                        }}
                    >
                        <div className="absolute inset-0 bg-radial from-transparent to-black/10" />
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full border border-sky-400/80 pointer-events-none" />
                    </div>
                )}

                {/* Top-Left Trust & Discount Badges */}
                <div className="absolute top-4 left-4 flex flex-col gap-1.5 pointer-events-none z-10">
                    {discount > 0 && (
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-rose-500 to-red-600 text-white text-xs font-extrabold rounded-full shadow-lg shadow-rose-500/30 uppercase tracking-wider">
                            <FiTag className="w-3 h-3" /> {discount}% OFF
                        </span>
                    )}
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-slate-900/85 backdrop-blur-md text-white text-[11px] font-bold rounded-full shadow-md">
                        <FiShield className="w-3 h-3 text-sky-400" /> Zyvento Verified
                    </span>
                </div>

                {/* Active Hotspot Info Card - Fixed inside Stage Bounds (Never cut off on any device) */}
                {showHotspots && activeHotspot && (
                    <div
                        className="absolute inset-x-3 bottom-12 sm:bottom-14 p-3.5 sm:p-4 bg-slate-900/95 backdrop-blur-md text-white rounded-2xl shadow-2xl border border-slate-700/70 z-30 flex items-start justify-between gap-3 animate-in fade-in slide-in-from-bottom-2 duration-200"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="min-w-0 flex-1 text-left">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse shrink-0" />
                                <h5 className="text-xs sm:text-sm font-bold text-sky-300 truncate">
                                    {activeHotspot.title}
                                </h5>
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-sky-500/20 text-sky-300 border border-sky-500/30 shrink-0">
                                    3D Feature
                                </span>
                            </div>
                            <p className="text-[11px] sm:text-xs text-slate-200 leading-relaxed break-words">
                                {activeHotspot.desc}
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                setActiveHotspot(null);
                            }}
                            className="text-slate-400 hover:text-white p-1 rounded-full hover:bg-white/10 shrink-0 transition cursor-pointer"
                            title="Close"
                        >
                            <FiX className="w-4 h-4" />
                        </button>
                    </div>
                )}

                {/* Bottom Center Mode Status / Instructions Pill */}
                <div className="absolute bottom-2.5 inset-x-0 flex justify-center pointer-events-none z-10 px-2">
                    <span className="px-3 py-1 rounded-full bg-slate-900/80 backdrop-blur-md text-[10px] sm:text-[11px] font-semibold text-white shadow-lg flex items-center gap-1.5 max-w-full truncate">
                        {viewerMode === '3d' && (
                            <>
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                                <span className="truncate">Touch or move to inspect 3D tilt & sheen</span>
                            </>
                        )}
                        {viewerMode === '360' && (
                            <>
                                <span className="w-1.5 h-1.5 rounded-full bg-sky-400 shrink-0" />
                                <span className="truncate">Drag left/right to spin • {getAngleLabel(selectedImage)}</span>
                            </>
                        )}
                        {viewerMode === 'zoom' && (
                            <>
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                                <span className="truncate">2.5x Loupe • Drag to inspect texture</span>
                            </>
                        )}
                    </span>
                </div>
            </div>

            {/* ============================================================
                360° TURNTABLE CONTROLS BAR (SHOWN IN 360 MODE OR WITH MULTI-ANGLES)
                ============================================================ */}
            {viewerMode === '360' && (
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3">
                    <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                                <FiRotateCw className="w-3.5 h-3.5 text-blue-600" />
                                <span>360° Inspection</span>
                            </span>
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
                                {currentDegree}°
                            </span>
                        </div>

                        {/* Auto-Spin Tour Button */}
                        {safeImages.length > 1 && (
                            <button
                                type="button"
                                onClick={() => setIsAutoRotating((prev) => !prev)}
                                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition shadow-2xs cursor-pointer ${
                                    isAutoRotating
                                        ? 'bg-rose-600 text-white shadow-rose-600/30'
                                        : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                                }`}
                            >
                                {isAutoRotating ? (
                                    <>
                                        <FiPause className="w-3.5 h-3.5" />
                                        <span>Pause Tour</span>
                                    </>
                                ) : (
                                    <>
                                        <FiPlay className="w-3.5 h-3.5" />
                                        <span>Auto 360° Tour</span>
                                    </>
                                )}
                            </button>
                        )}
                    </div>

                    {/* 360 Rotation Slider & Step Buttons */}
                    {safeImages.length > 1 && (
                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                onClick={handlePrevAngle}
                                className="p-2 bg-white rounded-xl border border-slate-200 text-slate-600 hover:text-blue-600 hover:bg-slate-100 transition shadow-2xs active:scale-95 cursor-pointer"
                                title="Previous Angle"
                            >
                                <FiRotateCcw className="w-4 h-4" />
                            </button>

                            <input
                                type="range"
                                min={0}
                                max={safeImages.length - 1}
                                step={1}
                                value={selectedImage}
                                onChange={(e) => setSelectedImage(Number(e.target.value))}
                                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                            />

                            <button
                                type="button"
                                onClick={handleNextAngle}
                                className="p-2 bg-white rounded-xl border border-slate-200 text-slate-600 hover:text-blue-600 hover:bg-slate-100 transition shadow-2xs active:scale-95 cursor-pointer"
                                title="Next Angle"
                            >
                                <FiRotateCw className="w-4 h-4" />
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* ============================================================
                THUMBNAIL SELECTOR REEL (FIXED CONTAINER: ZERO BORDER CLIPPING!)
                With generous padding (py-2.5 px-2.5), crisp rings & safe dimensions
                ============================================================ */}
            {safeImages.length > 1 && (
                <div className="w-full">
                    <div className="flex items-center justify-between mb-1.5 px-1">
                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                            Available Perspectives ({safeImages.length})
                        </span>
                        <span className="text-[11px] font-semibold text-blue-600">
                            {getAngleLabel(selectedImage)}
                        </span>
                    </div>

                    {/* Container with clearance for ring, shadow and border so NOTHING is clipped on any screen */}
                    <div className="p-2.5 bg-slate-50/80 rounded-2xl border border-slate-200/80">
                        <div className="flex gap-3 overflow-x-auto p-1.5 scrollbar-none">
                            {safeImages.map((img, idx) => {
                                const isSelected = selectedImage === idx;
                                return (
                                    <button
                                        key={idx}
                                        type="button"
                                        onClick={() => {
                                            setSelectedImage(idx);
                                            setIsAutoRotating(false);
                                        }}
                                        className={`group relative w-20 h-20 min-w-[5rem] min-h-[5rem] rounded-2xl p-1.5 bg-white flex-shrink-0 transition-all cursor-pointer ${
                                            isSelected
                                                ? 'border-2 border-blue-600 ring-4 ring-blue-500/25 shadow-md shadow-blue-500/15'
                                                : 'border-2 border-slate-200/90 hover:border-slate-400 opacity-75 hover:opacity-100'
                                        }`}
                                    >
                                        <div className="w-full h-full rounded-xl overflow-hidden flex items-center justify-center bg-slate-50">
                                            <img
                                                src={img}
                                                alt={`Angle ${idx + 1}`}
                                                onError={(e) => {
                                                    if (e.currentTarget.src !== FALLBACK_PRODUCT_IMAGE) {
                                                        e.currentTarget.src = FALLBACK_PRODUCT_IMAGE;
                                                    }
                                                }}
                                                className="w-full h-full object-contain"
                                            />
                                        </div>
                                        <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-slate-900/80 text-white">
                                            #{idx + 1}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            {/* ============================================================
                FULLSCREEN 3D STUDIO LIGHTBOX MODAL
                ============================================================ */}
            {isLightboxOpen && (
                <div
                    className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-xl flex flex-col p-4 sm:p-6 text-white"
                    onClick={() => setIsLightboxOpen(false)}
                >
                    {/* Header */}
                    <div
                        className="flex items-center justify-between gap-4 pb-4 border-b border-white/10 shrink-0"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div>
                            <span className="text-xs font-bold uppercase tracking-wider text-sky-400">
                                {brand || 'Zyvento 3D Studio'}
                            </span>
                            <h3 className="text-lg sm:text-xl font-bold truncate max-w-xl text-white">
                                {name}
                            </h3>
                        </div>

                        <div className="flex items-center gap-3">
                            {/* Zoom In / Out Buttons */}
                            <div className="flex items-center gap-1 bg-white/10 p-1 rounded-xl">
                                <button
                                    type="button"
                                    onClick={() => setLightboxZoom((prev) => Math.max(0.7, prev - 0.25))}
                                    className="p-2 hover:bg-white/20 rounded-lg text-white"
                                    title="Zoom Out"
                                >
                                    -
                                </button>
                                <span className="px-2 text-xs font-bold font-mono">
                                    {Math.round(lightboxZoom * 100)}%
                                </span>
                                <button
                                    type="button"
                                    onClick={() => setLightboxZoom((prev) => Math.min(2.5, prev + 0.25))}
                                    className="p-2 hover:bg-white/20 rounded-lg text-white"
                                    title="Zoom In"
                                >
                                    +
                                </button>
                            </div>

                            <button
                                type="button"
                                onClick={() => setIsLightboxOpen(false)}
                                className="p-2.5 rounded-full bg-white/10 hover:bg-white/25 text-white transition-all cursor-pointer"
                                title="Close Studio"
                            >
                                <FiX className="w-6 h-6" />
                            </button>
                        </div>
                    </div>

                    {/* Stage */}
                    <div
                        className="flex-1 flex items-center justify-center p-4 relative overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {safeImages.length > 1 && (
                            <>
                                <button
                                    type="button"
                                    onClick={handlePrevAngle}
                                    className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/25 text-white transition shadow-xl cursor-pointer"
                                    title="Previous Angle"
                                >
                                    <FiChevronLeft className="w-6 h-6" />
                                </button>
                                <button
                                    type="button"
                                    onClick={handleNextAngle}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/25 text-white transition shadow-xl cursor-pointer"
                                    title="Next Angle"
                                >
                                    <FiChevronRight className="w-6 h-6" />
                                </button>
                            </>
                        )}

                        <img
                            src={currentImg}
                            alt={name}
                            onError={(e) => {
                                if (e.currentTarget.src !== FALLBACK_PRODUCT_IMAGE) {
                                    e.currentTarget.src = FALLBACK_PRODUCT_IMAGE;
                                }
                            }}
                            style={{ transform: `scale(${lightboxZoom})` }}
                            className="max-h-[75vh] max-w-[85vw] object-contain drop-shadow-2xl transition-transform duration-200"
                        />
                    </div>

                    {/* Bottom Lightbox Angle Reel */}
                    {safeImages.length > 1 && (
                        <div
                            className="pt-4 border-t border-white/10 flex items-center justify-center gap-3 overflow-x-auto shrink-0 pb-2"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {safeImages.map((img, idx) => (
                                <button
                                    key={`lb-${idx}`}
                                    type="button"
                                    onClick={() => setSelectedImage(idx)}
                                    className={`relative w-16 h-16 rounded-xl overflow-hidden border-2 p-1 bg-white/5 transition-all cursor-pointer ${
                                        selectedImage === idx
                                            ? 'border-sky-400 ring-2 ring-sky-400/50 scale-105'
                                            : 'border-white/20 hover:border-white/50 opacity-60 hover:opacity-100'
                                    }`}
                                >
                                    <img src={img} alt={`Angle ${idx + 1}`} className="w-full h-full object-contain" />
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default Product3DViewer;
