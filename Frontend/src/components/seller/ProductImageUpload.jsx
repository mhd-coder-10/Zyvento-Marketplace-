import React, { useState, useRef } from 'react';
import { toast } from 'react-toastify';
import {
    FiUploadCloud,
    FiImage,
    FiX,
    FiTrash2,
    FiStar,
    FiEye,
    FiPlus,
    FiCheckCircle,
    FiAlertCircle,
    FiRefreshCw,
} from 'react-icons/fi';
import ApiService from '../../api/ApiService';

const MAX_IMAGES = 10;
const MAX_FILE_SIZE_MB = 10;

const ProductImageUpload = ({ images = [], onChange, maxImages = MAX_IMAGES }) => {
    const [uploading, setUploading] = useState(false);
    const [dragActive, setDragActive] = useState(false);
    const [previewUrl, setPreviewUrl] = useState(null);
    const fileInputRef = useRef(null);

    // Normalize images: ensure array of objects { url, is_primary, public_id }
    const normalizedImages = (images || []).map((img, idx) => {
        if (typeof img === 'string') {
            return { url: img, is_primary: idx === 0 };
        }
        return {
            url: img.url || '',
            is_primary: img.is_primary !== undefined ? img.is_primary : idx === 0,
            public_id: img.public_id,
        };
    }).filter((img) => Boolean(img.url));

    const currentCount = normalizedImages.length;
    const remainingSlots = Math.max(0, maxImages - currentCount);

    const handleFileSelection = async (selectedFiles) => {
        if (!selectedFiles || selectedFiles.length === 0) return;

        // Check if already reached max
        if (remainingSlots <= 0) {
            toast.error(`Maximum limit of ${maxImages} photos already reached. Please delete a photo before adding more.`);
            return;
        }

        const rawFiles = Array.from(selectedFiles);
        // Filter only valid images
        const imageFiles = rawFiles.filter((file) => file.type.startsWith('image/'));

        if (imageFiles.length === 0) {
            toast.error('Please select valid image files (JPG, PNG, WEBP, GIF).');
            return;
        }

        // Check file size
        const oversized = imageFiles.some((f) => f.size > MAX_FILE_SIZE_MB * 1024 * 1024);
        if (oversized) {
            toast.error(`One or more files exceed the ${MAX_FILE_SIZE_MB}MB size limit.`);
            return;
        }

        // Limit to remaining slots
        let filesToUpload = imageFiles;
        if (imageFiles.length > remainingSlots) {
            toast.warning(`Only ${remainingSlots} more photo(s) allowed. The first ${remainingSlots} will be uploaded.`);
            filesToUpload = imageFiles.slice(0, remainingSlots);
        }

        const formData = new FormData();
        filesToUpload.forEach((file) => {
            formData.append('images', file);
        });

        setUploading(true);
        try {
            const res = await ApiService.uploadSellerProductImages(formData);
            if (res?.data?.success && res.data.data?.images) {
                const uploadedList = res.data.data.images;
                const newItems = uploadedList.map((item, idx) => ({
                    url: item.url,
                    public_id: item.public_id,
                    is_primary: currentCount === 0 && idx === 0,
                }));

                onChange([...normalizedImages, ...newItems]);
                toast.success(`${newItems.length} photo(s) uploaded to Cloudinary successfully!`);

                if (res.data.data.errors && res.data.data.errors.length) {
                    toast.warning(`${res.data.data.errors.length} file(s) could not be uploaded.`);
                }
            } else {
                toast.error(res?.data?.message || 'Failed to upload images');
            }
        } catch (err) {
            console.error('Image upload error:', err);
            const msg = err.response?.data?.message || 'Cloudinary upload failed. Please try again.';
            toast.error(msg);
        } finally {
            setUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    // Drag & drop handlers
    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleFileSelection(e.dataTransfer.files);
        }
    };

    // Remove photo
    const handleRemoveImage = (indexToRemove) => {
        const updated = normalizedImages.filter((_, idx) => idx !== indexToRemove);
        // If removed image was primary and others exist, set first as primary
        if (normalizedImages[indexToRemove]?.is_primary && updated.length > 0) {
            updated[0].is_primary = true;
        }
        onChange(updated);
        toast.info('Photo removed');
    };

    // Set as Cover / Primary
    const handleSetPrimary = (indexToPrimary) => {
        const target = normalizedImages[indexToPrimary];
        const rest = normalizedImages.filter((_, idx) => idx !== indexToPrimary);
        const updated = [
            { ...target, is_primary: true },
            ...rest.map((img) => ({ ...img, is_primary: false })),
        ];
        onChange(updated);
        toast.success('Cover photo set successfully!');
    };

    return (
        <div className="space-y-4">
            {/* Header & Status Counter */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center font-bold">
                        <FiImage className="w-4 h-4" />
                    </div>
                    <div>
                        <h4 className="text-sm font-bold text-slate-900">Product Images</h4>
                        <p className="text-[11px] text-slate-400">
                            Upload high-quality photos. First image is the cover photo.
                        </p>
                    </div>
                </div>

                {/* Counter Pill */}
                <div className="flex items-center gap-2">
                    <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold transition-all ${
                            currentCount >= maxImages
                                ? 'bg-amber-100 text-amber-800'
                                : currentCount > 0
                                ? 'bg-sky-100 text-sky-700'
                                : 'bg-slate-100 text-slate-600'
                        }`}
                    >
                        {currentCount} / {maxImages} Photos
                    </span>
                </div>
            </div>

            {/* Hidden File Input */}
            <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
                onChange={(e) => handleFileSelection(e.target.files)}
                className="hidden"
                disabled={uploading || remainingSlots <= 0}
            />

            {/* Upload Area / Dropzone */}
            {remainingSlots > 0 ? (
                <div
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    onClick={() => !uploading && fileInputRef.current?.click()}
                    className={`relative cursor-pointer rounded-2xl border-2 border-dashed p-6 text-center transition-all ${
                        dragActive
                            ? 'border-sky-500 bg-sky-50/70 scale-[0.99]'
                            : 'border-slate-200 hover:border-sky-400 bg-slate-50/50 hover:bg-sky-50/30'
                    } ${uploading ? 'opacity-70 pointer-events-none' : ''}`}
                >
                    <div className="flex flex-col items-center justify-center gap-2">
                        <div className="w-12 h-12 rounded-2xl bg-white shadow-sm border border-slate-100 flex items-center justify-center text-sky-600">
                            {uploading ? (
                                <FiRefreshCw className="w-6 h-6 animate-spin text-sky-600" />
                            ) : (
                                <FiUploadCloud className="w-6 h-6" />
                            )}
                        </div>

                        {uploading ? (
                            <div>
                                <p className="text-xs font-bold text-sky-700">Uploading to Cloudinary...</p>
                                <p className="text-[11px] text-slate-400">Please wait while images are being processed</p>
                            </div>
                        ) : (
                            <div>
                                <p className="text-xs font-bold text-slate-800">
                                    <span className="text-sky-600 hover:underline">Click to upload</span> or drag and drop photos here
                                </p>
                                <p className="text-[11px] text-slate-400 mt-0.5">
                                    JPG, PNG, WEBP, GIF • Up to {MAX_FILE_SIZE_MB}MB each • Max {remainingSlots} more {remainingSlots === 1 ? 'photo' : 'photos'}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-4 text-center">
                    <p className="text-xs font-bold text-amber-800 flex items-center justify-center gap-1.5">
                        <FiCheckCircle className="w-4 h-4 text-amber-600" />
                        Maximum Limit Reached (10 / 10 Photos Uploaded)
                    </p>
                    <p className="text-[11px] text-amber-700 mt-0.5">
                        To add new photos, please remove an existing photo first.
                    </p>
                </div>
            )}

            {/* Gallery Thumbnail Grid */}
            {normalizedImages.length > 0 && (
                <div className="space-y-2 pt-2">
                    <div className="flex items-center justify-between text-xs text-slate-500 font-semibold px-1">
                        <span>Attached Photos ({normalizedImages.length})</span>
                        <span className="text-[11px] text-slate-400">Hover photo for options</span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                        {normalizedImages.map((img, index) => {
                            const isCover = index === 0 || img.is_primary;
                            return (
                                <div
                                    key={index}
                                    className={`group relative aspect-square rounded-2xl overflow-hidden border-2 bg-slate-100 shadow-xs transition-all ${
                                        isCover ? 'border-sky-500 ring-2 ring-sky-200' : 'border-slate-200 hover:border-slate-400'
                                    }`}
                                >
                                    {/* Image */}
                                    <img
                                        src={img.url}
                                        alt={`Product ${index + 1}`}
                                        className="w-full h-full object-cover transition duration-300 group-hover:scale-105"
                                        onError={(e) => {
                                            e.currentTarget.src = 'https://placehold.co/400x400?text=Invalid+Image';
                                        }}
                                    />

                                    {/* Cover Badge */}
                                    {isCover && (
                                        <div className="absolute top-2 left-2 z-10 inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-sky-600 text-white text-[10px] font-bold shadow-md shadow-sky-600/30">
                                            <FiStar className="w-3 h-3 fill-current text-amber-300" />
                                            <span>Cover</span>
                                        </div>
                                    )}

                                    {/* Index Badge */}
                                    {!isCover && (
                                        <div className="absolute top-2 left-2 z-10 inline-flex items-center justify-center w-5 h-5 rounded-full bg-slate-900/60 backdrop-blur-xs text-white text-[10px] font-bold">
                                            {index + 1}
                                        </div>
                                    )}

                                    {/* Hover Actions Overlay */}
                                    <div className="absolute inset-0 z-20 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2">
                                        <div className="flex justify-end gap-1">
                                            {/* Preview Zoom */}
                                            <button
                                                type="button"
                                                onClick={() => setPreviewUrl(img.url)}
                                                title="View full size"
                                                className="p-1.5 rounded-lg bg-white/20 hover:bg-white/40 text-white transition backdrop-blur-xs"
                                            >
                                                <FiEye className="w-3.5 h-3.5" />
                                            </button>

                                            {/* Delete */}
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveImage(index)}
                                                title="Remove photo"
                                                className="p-1.5 rounded-lg bg-rose-500/80 hover:bg-rose-600 text-white transition shadow-sm"
                                            >
                                                <FiTrash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>

                                        {/* Set as Cover button */}
                                        {!isCover && (
                                            <button
                                                type="button"
                                                onClick={() => handleSetPrimary(index)}
                                                className="w-full inline-flex items-center justify-center gap-1 py-1 rounded-lg bg-white/90 hover:bg-white text-slate-800 text-[10px] font-bold transition shadow-xs"
                                            >
                                                <FiStar className="w-3 h-3 text-amber-500" />
                                                <span>Set as Cover</span>
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}

                        {/* Add More Tile (if not full) */}
                        {remainingSlots > 0 && (
                            <button
                                type="button"
                                onClick={() => !uploading && fileInputRef.current?.click()}
                                disabled={uploading}
                                className="aspect-square rounded-2xl border-2 border-dashed border-slate-300 hover:border-sky-500 bg-slate-50 hover:bg-sky-50/50 flex flex-col items-center justify-center gap-1.5 text-slate-500 hover:text-sky-600 transition group disabled:opacity-50"
                            >
                                <div className="w-8 h-8 rounded-xl bg-white shadow-xs border border-slate-200 group-hover:border-sky-300 flex items-center justify-center text-slate-600 group-hover:text-sky-600 transition">
                                    <FiPlus className="w-4 h-4" />
                                </div>
                                <span className="text-[11px] font-bold">Add Photo</span>
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* Lightbox / Preview Modal */}
            {previewUrl && (
                <div
                    onClick={() => setPreviewUrl(null)}
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-200"
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        className="relative max-w-3xl max-h-[90vh] bg-white rounded-3xl overflow-hidden shadow-2xl p-2"
                    >
                        <button
                            type="button"
                            onClick={() => setPreviewUrl(null)}
                            className="absolute top-4 right-4 z-10 p-2 rounded-full bg-slate-900/60 hover:bg-slate-900 text-white backdrop-blur-xs transition"
                        >
                            <FiX className="w-5 h-5" />
                        </button>
                        <img
                            src={previewUrl}
                            alt="Preview"
                            className="w-full h-auto max-h-[85vh] object-contain rounded-2xl"
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProductImageUpload;
