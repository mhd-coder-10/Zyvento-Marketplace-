import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import {
    FiStar,
    FiHeart,
    FiShoppingCart,
    FiTruck,
    FiRefreshCw,
    FiShield,
    FiMinus,
    FiPlus,
    FiCheck,
    FiShare2,
    FiX,
    FiArrowLeft,
    FiShoppingBag,
    FiPackage,
    FiCheckCircle,
    FiInfo,
    FiTag,
    FiZap,
    FiMapPin,
    FiAward,
    FiClock,
    FiChevronRight,
    FiMaximize2,
    FiMessageSquare,
    FiSliders,
    FiThumbsUp,
    FiAlertCircle,
    FiEdit2,
    FiTrash2,
    FiCamera,
    FiVideo,
    FiUploadCloud,
    FiPlay,
    FiFilm,
    FiEyeOff
} from 'react-icons/fi';
import ApiService from '../../../api/ApiService';
import ProductCard from '../../../components/public/product/ProductCard';
import UserAvatar from '../../../components/common/UserAvatar';

const getUserIdString = (u) => {
    if (!u) return null;
    if (typeof u === 'string') return u.trim();
    if (typeof u === 'object') {
        const val = u._id || u.id;
        return val ? String(val).trim() : null;
    }
    return null;
};

const ProductDetail = () => {
    const { productId } = useParams();
    const navigate = useNavigate();
    const { isAuthenticated, user } = useSelector((state) => state.auth);

    const [product, setProduct] = useState(null);
    const [relatedProducts, setRelatedProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [quantity, setQuantity] = useState(1);
    const [selectedImage, setSelectedImage] = useState(0);
    const [activeTab, setActiveTab] = useState('description');
    const [addingToCart, setAddingToCart] = useState(false);
    const [buyingNow, setBuyingNow] = useState(false);
    const [wishlistLoading, setWishlistLoading] = useState(false);
    const [inWishlist, setInWishlist] = useState(false);

    // Interactive variant selections
    const [selectedColor, setSelectedColor] = useState('');
    const [selectedSize, setSelectedSize] = useState('');
    const [selectedStorage, setSelectedStorage] = useState('');

    // Delivery pincode checker
    const [pincode, setPincode] = useState('');
    const [deliveryInfo, setDeliveryInfo] = useState(null);
    const [checkingPincode, setCheckingPincode] = useState(false);

    // Image zoom & modal
    const [isZoomed, setIsZoomed] = useState(false);
    const [zoomPos, setZoomPos] = useState({ x: 0, y: 0 });
    const [isLightboxOpen, setIsLightboxOpen] = useState(false);
    const imageContainerRef = useRef(null);

    // ============ REVIEWS SYSTEM STATE ============
    const [reviews, setReviews] = useState([]);
    const [reviewsLoading, setReviewsLoading] = useState(false);
    const [userReview, setUserReview] = useState(null);
    const [reviewStats, setReviewStats] = useState({
        avgRating: 0,
        totalReviews: 0,
        breakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
    });
    const [reviewModalOpen, setReviewModalOpen] = useState(false);
    const [isEditingReview, setIsEditingReview] = useState(false);
    const [submittingReview, setSubmittingReview] = useState(false);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [deletingReview, setDeletingReview] = useState(false);
    const [activeMediaModal, setActiveMediaModal] = useState(null); // { url, type }
    const [reviewToDelete, setReviewToDelete] = useState(null);

    // Review form state
    const [reviewForm, setReviewForm] = useState({
        rating: 5,
        title: '',
        comment: '',
        existingImages: [],
        existingVideos: []
    });
    const [selectedMediaFiles, setSelectedMediaFiles] = useState([]); // [{ file, previewUrl, type, duration }]
    const [hoverStar, setHoverStar] = useState(0);

    useEffect(() => {
        if (productId) {
            loadProduct();
            loadProductReviews(productId);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }, [productId, isAuthenticated]);

    const loadProduct = async () => {
        setLoading(true);
        try {
            const response = await ApiService.getProductById(productId);

            if (response.data?.success) {
                const prod = response.data.data?.product || response.data.data;
                setProduct(prod);

                // Set default variant options if available
                if (prod.attributes?.color) setSelectedColor(prod.attributes.color);
                if (prod.attributes?.size) setSelectedSize(prod.attributes.size);
                if (prod.attributes?.storage) setSelectedStorage(prod.attributes.storage);

                // Load related products
                const categoryId = prod.category_id?._id || prod.category_id;
                loadRelated(categoryId);

                if (isAuthenticated) {
                    checkWishlist(prod._id || prod.id);
                }
            } else {
                toast.error('Product not found');
                navigate('/products');
            }
        } catch (error) {
            console.error('Failed to load product:', error);
            toast.error(error.response?.data?.message || 'Failed to load product details');
            navigate('/products');
        } finally {
            setLoading(false);
        }
    };

    const loadProductReviews = async (id) => {
        setReviewsLoading(true);
        try {
            const res = await ApiService.getProductReviews(id, { page: 1, limit: 30 });
            if (res.data?.success) {
                const list = res.data.data?.reviews || (Array.isArray(res.data.data) ? res.data.data : []);

                const localUser = (() => {
                    try { return JSON.parse(localStorage.getItem('user') || '{}'); } catch (_) { return {}; }
                })();
                const currentUserId = getUserIdString(user) || getUserIdString(localUser);

                let foundUserReview = null;
                if (isAuthenticated && currentUserId) {
                    if (res.data.data?.userReview) {
                        const uRevAuthor = getUserIdString(res.data.data.userReview.user_id);
                        if (uRevAuthor && uRevAuthor === currentUserId) {
                            foundUserReview = res.data.data.userReview;
                        }
                    }
                    if (!foundUserReview) {
                        foundUserReview = list.find(r => {
                            const rAuthor = getUserIdString(r.user_id);
                            return Boolean(rAuthor && rAuthor === currentUserId);
                        }) || null;
                    }
                }

                setUserReview(foundUserReview || null);

                // Place user's own review at the very TOP (index 0) and filter out duplicates only if published
                let organizedList = [...list];
                if (foundUserReview && (foundUserReview.status === 'published' || !foundUserReview.status)) {
                    const userRevId = getUserIdString(foundUserReview);
                    const others = organizedList.filter(r => {
                        const rId = getUserIdString(r);
                        const rAuthor = getUserIdString(r.user_id);
                        if (userRevId && rId === userRevId) return false;
                        if (currentUserId && rAuthor && rAuthor === currentUserId) return false;
                        return true;
                    });
                    organizedList = [foundUserReview, ...others];
                }
                setReviews(organizedList);

                const dist = res.data.data?.ratingDistribution || {};
                const total = res.data.data?.totalReviews !== undefined ? res.data.data.totalReviews : list.length;
                const avg = res.data.data?.averageRating !== undefined ? res.data.data.averageRating : (total > 0 ? (list.reduce((acc, r) => acc + (Number(r.rating) || 0), 0) / total).toFixed(1) : 0);

                const breakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
                if (dist && Object.keys(dist).length > 0) {
                    [1, 2, 3, 4, 5].forEach(star => {
                        breakdown[star] = dist[star] || 0;
                    });
                } else {
                    list.forEach(r => {
                        const star = Math.round(Number(r.rating) || 0);
                        if (breakdown[star] !== undefined) breakdown[star]++;
                    });
                }

                setReviewStats({
                    avgRating: Number(avg),
                    totalReviews: total,
                    breakdown
                });
            }
        } catch (err) {
            console.error('Error loading product reviews:', err);
        } finally {
            setReviewsLoading(false);
        }
    };

    const handleWriteReviewClick = () => {
        if (!isAuthenticated) {
            toast.info('Please log in to review this product');
            navigate('/login', { state: { from: `/product/${productId}` } });
            return;
        }

        if (userReview) {
            if (userReview.is_edited) {
                toast.info('You have already edited your review once. Each review can only be edited once.');
                return;
            }
            setIsEditingReview(true);
            setReviewForm({
                rating: userReview.rating || 5,
                title: userReview.title || '',
                comment: userReview.comment || '',
                existingImages: userReview.images || [],
                existingVideos: userReview.videos || []
            });
            setSelectedMediaFiles([]);
            setReviewModalOpen(true);
        } else {
            setIsEditingReview(false);
            setReviewForm({
                rating: 5,
                title: '',
                comment: '',
                existingImages: [],
                existingVideos: []
            });
            setSelectedMediaFiles([]);
            setReviewModalOpen(true);
        }
    };

    const handleMediaSelect = (e) => {
        const files = Array.from(e.target.files || []);
        if (!files.length) return;

        const currentTotal = (reviewForm.existingImages?.length || 0) +
                             (reviewForm.existingVideos?.length || 0) +
                             selectedMediaFiles.length;

        if (currentTotal + files.length > 3) {
            toast.error(`You can attach maximum 3 files in total (images or videos). Currently you have ${currentTotal}.`);
            e.target.value = '';
            return;
        }

        files.forEach(file => {
            const isImg = file.type.startsWith('image/');
            const isVid = file.type.startsWith('video/');

            if (!isImg && !isVid) {
                toast.error(`"${file.name}" is not supported. Please select image or video files.`);
                return;
            }

            if (isImg) {
                // Image max 1 MB limit
                if (file.size > 1 * 1024 * 1024) {
                    toast.error(`Image "${file.name}" exceeds 1 MB limit (${(file.size / (1024 * 1024)).toFixed(2)} MB). Max 1 MB allowed.`);
                    return;
                }
                const previewUrl = URL.createObjectURL(file);
                setSelectedMediaFiles(prev => [...prev, { file, previewUrl, type: 'image' }]);
            } else if (isVid) {
                // Video duration max 1 minute (60 seconds)
                const videoEl = document.createElement('video');
                videoEl.preload = 'metadata';
                videoEl.onloadedmetadata = () => {
                    window.URL.revokeObjectURL(videoEl.src);
                    if (videoEl.duration > 60) {
                        toast.error(`Video "${file.name}" is ${Math.round(videoEl.duration)}s. Maximum allowed video length is 1 minute (60s).`);
                    } else {
                        const previewUrl = URL.createObjectURL(file);
                        setSelectedMediaFiles(prev => [...prev, { file, previewUrl, type: 'video', duration: Math.round(videoEl.duration) }]);
                    }
                };
                videoEl.src = URL.createObjectURL(file);
            }
        });

        e.target.value = '';
    };

    const handleRemoveNewMedia = (index) => {
        setSelectedMediaFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleRemoveExistingMedia = (type, url) => {
        if (type === 'image') {
            setReviewForm(prev => ({
                ...prev,
                existingImages: (prev.existingImages || []).filter(item => item !== url)
            }));
        } else {
            setReviewForm(prev => ({
                ...prev,
                existingVideos: (prev.existingVideos || []).filter(item => item !== url)
            }));
        }
    };

    const handleSubmitReview = async (e) => {
        e.preventDefault();
        if (!reviewForm.comment || reviewForm.comment.trim().length < 2) {
            toast.warning('Please write a review comment (at least 2 characters)');
            return;
        }

        setSubmittingReview(true);
        try {
            let newUploadedImages = [];
            let newUploadedVideos = [];

            if (selectedMediaFiles.length > 0) {
                const formData = new FormData();
                selectedMediaFiles.forEach(item => {
                    formData.append('media', item.file);
                });
                const uploadRes = await ApiService.uploadReviewMedia(formData);
                if (uploadRes.data?.success) {
                    const uploaded = uploadRes.data.data || [];
                    uploaded.forEach(m => {
                        if (m.type === 'video') newUploadedVideos.push(m.url);
                        else newUploadedImages.push(m.url);
                    });
                }
            }

            const finalImages = [...(reviewForm.existingImages || []), ...newUploadedImages];
            const finalVideos = [...(reviewForm.existingVideos || []), ...newUploadedVideos];

            if (isEditingReview && userReview) {
                await ApiService.updateReview(userReview._id, {
                    rating: Number(reviewForm.rating),
                    title: reviewForm.title.trim(),
                    comment: reviewForm.comment.trim(),
                    images: finalImages,
                    videos: finalVideos
                });
                toast.success('Your review was updated successfully!');
            } else {
                await ApiService.createReview({
                    product_id: product._id || product.id,
                    rating: Number(reviewForm.rating),
                    title: reviewForm.title.trim(),
                    comment: reviewForm.comment.trim(),
                    images: finalImages,
                    videos: finalVideos
                });
                toast.success('Thank you! Your review has been published.');
            }

            setReviewModalOpen(false);
            loadProductReviews(productId);
            loadProduct();
        } catch (err) {
            console.error('Submit review error:', err);
            toast.error(err.response?.data?.message || 'Failed to submit review');
        } finally {
            setSubmittingReview(false);
        }
    };

    const handleDeleteReview = async () => {
        const targetReview = reviewToDelete || userReview;
        if (!targetReview) return;
        setDeletingReview(true);
        try {
            const targetId = (targetReview._id || targetReview.id)?.toString();
            await ApiService.deleteOwnReview(targetId);
            toast.success('Your review has been permanently removed.');
            setDeleteConfirmOpen(false);
            setReviewToDelete(null);
            setUserReview(null);
            setIsEditingReview(false);
            setReviewForm({
                rating: 5,
                title: '',
                comment: '',
                existingImages: [],
                existingVideos: []
            });
            setSelectedMediaFiles([]);
            loadProductReviews(productId);
            loadProduct();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to delete review');
        } finally {
            setDeletingReview(false);
        }
    };

    const loadRelated = async (categoryId) => {
        try {
            const res = await ApiService.getAllProducts({
                category: categoryId || undefined,
                limit: 8
            });
            if (res.data?.success) {
                const list = Array.isArray(res.data.data)
                    ? res.data.data
                    : (res.data.data?.products || res.data.data || []);
                setRelatedProducts(list.filter(p => (p._id || p.id) !== productId).slice(0, 4));
            }
        } catch (_) { }
    };

    const checkWishlist = async (id) => {
        try {
            const response = await ApiService.checkWishlist(id);
            if (response.data?.success) {
                setInWishlist(Boolean(response.data.data?.inWishlist));
            }
        } catch (_) { }
    };

    const toggleWishlist = async () => {
        if (!isAuthenticated) {
            toast.info('Please sign in to save items to your wishlist');
            navigate('/login', { state: { from: `/products/${productId}` } });
            return;
        }

        setWishlistLoading(true);
        try {
            const id = product._id || product.id;
            if (inWishlist) {
                await ApiService.removeFromWishlist(id);
                setInWishlist(false);
                toast.success('Removed from wishlist');
            } else {
                await ApiService.addToWishlist({ productId: id });
                setInWishlist(true);
                toast.success('Added to your wishlist!');
            }
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to update wishlist');
        } finally {
            setWishlistLoading(false);
        }
    };

    const handleAddToCart = async () => {
        if (product?.status === 'suspended') {
            toast.warning('This product is temporarily suspended and cannot be ordered');
            return;
        }

        if (!isAuthenticated) {
            toast.info('Please sign in to add items to your cart');
            navigate('/login', { state: { from: `/products/${productId}` } });
            return;
        }

        if (!inStock) {
            toast.warning('This item is currently out of stock');
            return;
        }

        setAddingToCart(true);
        try {
            const id = product._id || product.id;
            const res = await ApiService.addToCart({
                productId: id,
                quantity,
                selectedColor,
                selectedSize,
                selectedStorage
            });
            if (res?.data?.success) {
                toast.success(`Added ${quantity} item(s) to Cart!`);
            } else {
                toast.error(res?.data?.message || 'Failed to add to cart');
            }
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to add to cart');
        } finally {
            setAddingToCart(false);
        }
    };

    const handleBuyNow = async () => {
        if (product?.status === 'suspended') {
            toast.warning('This product is temporarily suspended and cannot be ordered');
            return;
        }

        if (!isAuthenticated) {
            toast.info('Please sign in to complete your purchase');
            navigate('/login', { state: { from: `/products/${productId}` } });
            return;
        }

        if (!inStock) {
            toast.warning('This item is currently out of stock');
            return;
        }

        setBuyingNow(true);
        try {
            const id = product._id || product.id;
            await ApiService.addToCart({
                productId: id,
                quantity,
                selectedColor,
                selectedSize,
                selectedStorage
            });
            navigate('/checkout');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Could not initiate checkout');
        } finally {
            setBuyingNow(false);
        }
    };

    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: name,
                    text: `Check out ${name} on Zyvento Marketplace!`,
                    url: window.location.href,
                });
            } catch (_) { }
        } else {
            navigator.clipboard.writeText(window.location.href);
            toast.success('Product link copied to clipboard!');
        }
    };

    const handleCheckPincode = (e) => {
        e.preventDefault();
        const code = pincode.trim();
        if (!/^\d{6}$/.test(code)) {
            toast.error('Please enter a valid 6-digit PIN code');
            return;
        }

        setCheckingPincode(true);
        setTimeout(() => {
            setCheckingPincode(false);
            const deliveryDays = 2 + (parseInt(code.slice(-1)) % 3);
            const date = new Date();
            date.setDate(date.getDate() + deliveryDays);
            const options = { weekday: 'short', month: 'short', day: 'numeric' };
            setDeliveryInfo({
                pincode: code,
                date: date.toLocaleDateString('en-IN', options),
                free: true
            });
            toast.success(`Delivery available for ${code}!`);
        }, 500);
    };

    // Zoom handlers
    const handleMouseMove = (e) => {
        if (!imageContainerRef.current) return;
        const { left, top, width, height } = imageContainerRef.current.getBoundingClientRect();
        const x = ((e.clientX - left) / width) * 100;
        const y = ((e.clientY - top) / height) * 100;
        setZoomPos({ x, y });
    };

    // Extract product fields safely
    const name = product?.product_name || product?.name || 'Product Details';
    const mrp = Number(product?.mrp || product?.price || 0);
    const finalPrice = Number(product?.final_price || product?.finalPrice || product?.price || 0);
    const discount = Number(product?.discount_percent || product?.discount || (mrp > finalPrice ? Math.round(((mrp - finalPrice) / mrp) * 100) : 0));
    const savings = mrp > finalPrice ? mrp - finalPrice : 0;
    const stock = Number(product?.stock_quantity ?? product?.stock ?? 0);
    const inStock = stock > 0;
    const brand = product?.brand || '';
    const rating = Number(product?.ratings || product?.rating || 0);
    const reviewsCount = Number(product?.num_reviews || product?.totalReviews || 0);
    const description = product?.description || '';
    const attributes = product?.attributes || {};
    const seller = product?.seller_id || null;

    // Extract images safely
    let imageList = [];
    if (Array.isArray(product?.images) && product.images.length > 0) {
        imageList = product.images.map(img => (typeof img === 'string' ? img : img.url || img.secure_url || '')).filter(Boolean);
    } else if (product?.image) {
        imageList = [product.image];
    }
    if (imageList.length === 0) {
        imageList = ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80'];
    }

    const renderStars = (val = 4.5) => {
        const fullStars = Math.floor(val);
        const hasHalfStar = val % 1 >= 0.5;

        return (
            <div className="flex items-center gap-0.5">
                {[...Array(5)].map((_, i) => (
                    <FiStar
                        key={i}
                        className={`w-4 h-4 ${
                            i < fullStars
                                ? 'fill-amber-400 text-amber-400'
                                : i === fullStars && hasHalfStar
                                ? 'fill-amber-400 text-amber-400 opacity-60'
                                : 'text-slate-200'
                        }`}
                    />
                ))}
            </div>
        );
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50/50 py-8 px-4 sm:px-6 lg:px-8 xl:px-10">
                <div className="w-full max-w-[1600px] mx-auto animate-pulse space-y-8">
                    <div className="h-6 bg-slate-200 rounded-xl w-72" />
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                        <div className="lg:col-span-6 bg-slate-200 aspect-[4/3] rounded-3xl" />
                        <div className="lg:col-span-6 space-y-5">
                            <div className="h-10 bg-slate-200 rounded-2xl w-4/5" />
                            <div className="h-6 bg-slate-200 rounded-xl w-1/3" />
                            <div className="h-16 bg-slate-200 rounded-3xl w-full" />
                            <div className="h-36 bg-slate-200 rounded-3xl w-full" />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!product) {
        return (
            <div className="min-h-screen bg-slate-50/50 py-20 px-4 text-center flex flex-col items-center justify-center space-y-4">
                <div className="w-20 h-20 bg-rose-50 text-rose-600 rounded-3xl flex items-center justify-center text-3xl font-bold shadow-lg shadow-rose-500/10">
                    <FiShoppingBag />
                </div>
                <h2 className="text-2xl font-black text-slate-900">Product Not Found</h2>
                <p className="text-sm text-slate-500">The product you're looking for may be unavailable or moved.</p>
                <Link
                    to="/products"
                    className="inline-flex items-center gap-2 px-6 py-3.5 bg-blue-600 text-white font-bold text-xs rounded-2xl shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all"
                >
                    <FiArrowLeft /> Browse Marketplace
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50/50 py-6 sm:py-8 px-4 sm:px-6 lg:px-8 xl:px-10 pb-24 lg:pb-16">
            <div className="w-full max-w-[1600px] mx-auto space-y-8">

                {/* ============ BREADCRUMB NAVIGATION ============ */}
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 overflow-x-auto py-1 scrollbar-none">
                        <Link to="/" className="hover:text-blue-600 transition-colors whitespace-nowrap">Home</Link>
                        <span>/</span>
                        <Link to="/products" className="hover:text-blue-600 transition-colors whitespace-nowrap">Catalog</Link>
                        <span>/</span>
                        {product.category_id?.category_name && (
                            <>
                                <Link
                                    to={`/products?category=${encodeURIComponent(product.category_id._id || product.category_id.category_name)}`}
                                    className="hover:text-blue-600 transition-colors whitespace-nowrap"
                                >
                                    {product.category_id.category_name}
                                </Link>
                                <span>/</span>
                            </>
                        )}
                        <span className="text-slate-800 font-bold truncate max-w-[200px] sm:max-w-md">{name}</span>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                            onClick={handleShare}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-sm hover:border-sky-300 transition-all active:scale-95"
                            title="Share product link"
                        >
                            <FiShare2 className="w-3.5 h-3.5 text-blue-600" />
                            <span className="hidden sm:inline">Share</span>
                        </button>
                    </div>
                </div>

                {/* ============ MAIN PRODUCT SHOWCASE CONTAINER ============ */}
                <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 sm:p-8 lg:p-10">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">

                        {/* ============================================================
                            LEFT: INTERACTIVE MULTI-ANGLE MEDIA GALLERY (5 cols)
                            ============================================================ */}
                        <div className="lg:col-span-5 space-y-4">
                            {/* Main Stage Image with Zoom */}
                            <div
                                ref={imageContainerRef}
                                onMouseEnter={() => setIsZoomed(true)}
                                onMouseLeave={() => setIsZoomed(false)}
                                onMouseMove={handleMouseMove}
                                onClick={() => setIsLightboxOpen(true)}
                                className="relative aspect-square rounded-3xl overflow-hidden bg-slate-50 border border-slate-100 flex items-center justify-center cursor-zoom-in group shadow-inner"
                            >
                                <img
                                    src={imageList[selectedImage]}
                                    alt={name}
                                    style={isZoomed ? {
                                        transformOrigin: `${zoomPos.x}% ${zoomPos.y}%`,
                                        transform: 'scale(1.75)'
                                    } : {}}
                                    className="w-full h-full object-contain p-6 transition-transform duration-150 ease-out select-none"
                                />

                                {/* Badges */}
                                <div className="absolute top-4 left-4 flex flex-col gap-2 pointer-events-none">
                                    {discount > 0 && (
                                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-rose-500 text-white text-xs font-black rounded-full shadow-lg shadow-rose-500/30 uppercase tracking-wider">
                                            <FiTag className="w-3 h-3" /> {discount}% OFF
                                        </span>
                                    )}
                                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-slate-900/80 backdrop-blur-md text-white text-[11px] font-bold rounded-full shadow">
                                        <FiShield className="w-3 h-3 text-sky-400" /> 100% Genuine
                                    </span>
                                </div>

                                {/* Top Right Quick Actions */}
                                <div className="absolute top-4 right-4 flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setIsLightboxOpen(true);
                                        }}
                                        className="p-2.5 bg-white/90 backdrop-blur-md rounded-2xl shadow-md hover:bg-white text-slate-500 hover:text-blue-600 transition-all active:scale-95"
                                        title="View Fullscreen"
                                    >
                                        <FiMaximize2 className="w-4 h-4" />
                                    </button>

                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            toggleWishlist();
                                        }}
                                        disabled={wishlistLoading}
                                        className="p-2.5 bg-white/90 backdrop-blur-md rounded-2xl shadow-md hover:bg-white text-slate-400 hover:text-rose-500 transition-all active:scale-95"
                                        title={inWishlist ? 'Remove from wishlist' : 'Save to wishlist'}
                                    >
                                        <FiHeart className={`w-4 h-4 ${inWishlist ? 'fill-rose-500 text-rose-500' : ''}`} />
                                    </button>
                                </div>

                                {/* Hover Prompt */}
                                <div className="absolute bottom-3 inset-x-0 flex justify-center pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                                    <span className="px-3 py-1 rounded-full bg-slate-900/75 backdrop-blur-md text-[11px] font-semibold text-white shadow-md">
                                        🔍 Hover to Zoom • Click to Expand
                                    </span>
                                </div>
                            </div>

                            {/* Thumbnail Selector Reel */}
                            {imageList.length > 1 && (
                                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
                                    {imageList.map((img, idx) => (
                                        <button
                                            key={idx}
                                            type="button"
                                            onClick={() => setSelectedImage(idx)}
                                            className={`relative w-20 h-20 rounded-2xl overflow-hidden border-2 flex-shrink-0 p-1.5 bg-slate-50 transition-all ${
                                                selectedImage === idx
                                                    ? 'border-blue-600 shadow-md shadow-blue-600/20 scale-105 ring-2 ring-blue-100'
                                                    : 'border-slate-200/80 hover:border-slate-400 opacity-70 hover:opacity-100'
                                            }`}
                                        >
                                            <img src={img} alt={`Angle ${idx + 1}`} className="w-full h-full object-contain" />
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* Trust Highlight Pill Bar */}
                            <div className="grid grid-cols-2 gap-3 pt-2">
                                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-3">
                                    <div className="h-9 w-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
                                        <FiTruck className="w-5 h-5" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-xs font-bold text-slate-800">Free 48h Delivery</p>
                                        <p className="text-[10px] text-slate-500 truncate">On prepaid orders</p>
                                    </div>
                                </div>

                                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-3">
                                    <div className="h-9 w-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
                                        <FiRefreshCw className="w-5 h-5" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-xs font-bold text-slate-800">7-Day Replacement</p>
                                        <p className="text-[10px] text-slate-500 truncate">Hassle-free return</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ============================================================
                            RIGHT: PRODUCT INFORMATION, VARIANTS & ACTIONS (7 cols)
                            ============================================================ */}
                        <div className="lg:col-span-7 space-y-6">

                            {/* Brand, SKU & Title */}
                            <div className="space-y-2.5">
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-extrabold uppercase tracking-wider border border-blue-200/70">
                                        {brand}
                                    </span>
                                    {product.product_code && (
                                        <span className="text-xs text-slate-400 font-mono bg-slate-100 px-2.5 py-0.5 rounded-md">
                                            ITEM #{product.product_code}
                                        </span>
                                    )}
                                    <span className="inline-flex items-center gap-1 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200/70 px-2.5 py-0.5 rounded-full font-bold">
                                        <FiAward className="w-3.5 h-3.5 text-emerald-600" /> Zyvento Verified
                                    </span>
                                </div>

                                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-slate-900 leading-tight">
                                    {name}
                                </h1>

                                {/* Rating summary block */}
                                <div className="flex flex-wrap items-center gap-3 pt-1">
                                    <div className="flex items-center gap-1.5 bg-amber-50 px-3 py-1 rounded-xl border border-amber-200">
                                        <span className="font-black text-amber-800 text-sm">{rating.toFixed(1)}</span>
                                        {renderStars(rating)}
                                    </div>
                                    <span className="text-xs font-semibold text-slate-500">
                                        {reviewsCount} Customer Reviews
                                    </span>
                                    <span className="hidden sm:inline text-slate-300">•</span>
                                    <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                                        <FiThumbsUp className="w-3 h-3" /> 98% Recommended
                                    </span>
                                </div>
                            </div>

                            {/* Dynamic Price Display Card */}
                            <div className="p-6 rounded-3xl bg-gradient-to-br from-slate-50 to-blue-50/40 border border-slate-200/90 space-y-2 shadow-sm">
                                <div className="flex flex-wrap items-baseline gap-3.5">
                                    <span className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight">
                                        ₹{finalPrice.toLocaleString('en-IN')}
                                    </span>
                                    {mrp > finalPrice && (
                                        <span className="text-lg sm:text-xl text-slate-400 line-through font-semibold">
                                            ₹{mrp.toLocaleString('en-IN')}
                                        </span>
                                    )}
                                    {discount > 0 && (
                                        <span className="px-3 py-1 rounded-xl bg-emerald-500 text-white text-xs font-black shadow-md shadow-emerald-500/20">
                                            Save ₹{savings.toLocaleString('en-IN')} ({discount}% OFF)
                                        </span>
                                    )}
                                </div>

                                <p className="text-xs font-medium text-slate-500 flex items-center gap-2">
                                    <FiCheck className="text-emerald-500" /> Inclusive of all taxes and import fees
                                    <span className="text-slate-300">•</span>
                                    <span className="text-blue-600 font-bold">Free Shipping on orders above ₹499</span>
                                </p>
                            </div>

                            {/* Color Selector (if present in attributes or demo) */}
                            {(attributes.color || attributes.colors) && (
                                <div className="space-y-2.5">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                                            Color: <span className="text-blue-600 font-black">{selectedColor || attributes.color}</span>
                                        </span>
                                    </div>
                                    <div className="flex flex-wrap gap-2.5">
                                        {[selectedColor || attributes.color, 'Midnight Black', 'Starlight Silver'].filter(Boolean).slice(0, 3).map((col) => (
                                            <button
                                                key={col}
                                                type="button"
                                                onClick={() => setSelectedColor(col)}
                                                className={`px-4 py-2 rounded-2xl text-xs font-bold border transition-all ${
                                                    selectedColor === col
                                                        ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-sm ring-2 ring-blue-200'
                                                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                                                }`}
                                            >
                                                {col}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Storage / Size Selector (if present in attributes) */}
                            {(attributes.storage || attributes.size) && (
                                <div className="space-y-2.5">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                                            {attributes.storage ? 'Storage Capacity' : 'Select Size'}:
                                        </span>
                                    </div>
                                    <div className="flex flex-wrap gap-2.5">
                                        {(attributes.storage
                                            ? ['128GB', '256GB', '512GB']
                                            : (attributes.size || 'UK 8, UK 9, UK 10').split(',').map(s => s.trim())
                                        ).map((opt) => (
                                            <button
                                                key={opt}
                                                type="button"
                                                onClick={() => attributes.storage ? setSelectedStorage(opt) : setSelectedSize(opt)}
                                                className={`px-4 py-2.5 rounded-2xl text-xs font-bold border transition-all ${
                                                    (selectedStorage === opt || selectedSize === opt)
                                                        ? 'border-blue-600 bg-blue-600 text-white shadow-md shadow-blue-600/25 scale-105'
                                                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                                                }`}
                                            >
                                                {opt}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Quantity & Stock Availability */}
                            <div className="space-y-3 pt-1">
                                <div className="flex items-center gap-2">
                                    <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full ${
                                        inStock
                                            ? stock < 5
                                                ? 'bg-amber-100 text-amber-800'
                                                : 'bg-emerald-100 text-emerald-800'
                                            : 'bg-rose-100 text-rose-800'
                                    }`}>
                                        {inStock ? (
                                            <>
                                                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                                                {stock < 5 ? `Hurry, only ${stock} left in stock!` : `In Stock (${stock} units ready to ship)`}
                                            </>
                                        ) : (
                                            <>
                                                <FiX className="w-3.5 h-3.5" /> Currently Out of Stock
                                            </>
                                        )}
                                    </span>
                                </div>

                                {inStock && (
                                    <div className="flex items-center gap-4">
                                        <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                                            Quantity:
                                        </span>
                                        <div className="inline-flex items-center bg-slate-100 border border-slate-200 rounded-2xl p-1 shadow-inner">
                                            <button
                                                type="button"
                                                onClick={() => setQuantity(q => Math.max(1, q - 1))}
                                                disabled={quantity <= 1}
                                                className="p-2.5 rounded-xl bg-white text-slate-700 hover:text-blue-600 shadow-sm disabled:opacity-40 transition-all active:scale-95"
                                            >
                                                <FiMinus className="w-3.5 h-3.5" />
                                            </button>
                                            <span className="w-12 text-center font-black text-sm text-slate-900">
                                                {quantity}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => setQuantity(q => Math.min(stock, q + 1))}
                                                disabled={quantity >= stock}
                                                className="p-2.5 rounded-xl bg-white text-slate-700 hover:text-blue-600 shadow-sm disabled:opacity-40 transition-all active:scale-95"
                                            >
                                                <FiPlus className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Suspended Product Notice */}
                            {product?.status === 'suspended' && (
                                <div className="p-4 rounded-2xl bg-orange-50 border border-orange-200 text-orange-950 flex items-start gap-3">
                                    <FiAlertCircle className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
                                    <div className="text-xs leading-relaxed">
                                        <p className="font-bold text-orange-900">Product Temporarily Suspended</p>
                                        <p className="text-orange-800 mt-0.5">
                                            This product is currently under administrative hold and cannot be ordered at this time.
                                            {product.suspension_reason ? ` Reason: ${product.suspension_reason}` : ''}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Purchase CTA Buttons */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                                <button
                                    type="button"
                                    onClick={handleAddToCart}
                                    disabled={addingToCart || !inStock || product?.status === 'suspended'}
                                    className="inline-flex items-center justify-center gap-2.5 px-7 py-4 rounded-2xl bg-blue-600 text-white font-extrabold text-sm sm:text-base shadow-xl shadow-blue-600/30 hover:bg-blue-700 hover:shadow-2xl active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none"
                                >
                                    <FiShoppingCart className="w-5 h-5" />
                                    {addingToCart ? 'Adding to Cart…' : 'Add to Cart'}
                                </button>

                                <button
                                    type="button"
                                    onClick={handleBuyNow}
                                    disabled={buyingNow || !inStock || product?.status === 'suspended'}
                                    className="inline-flex items-center justify-center gap-2.5 px-7 py-4 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 text-white font-extrabold text-sm sm:text-base shadow-xl shadow-orange-500/30 hover:from-amber-600 hover:to-rose-600 hover:shadow-2xl active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none"
                                >
                                    <FiZap className="w-5 h-5" />
                                    {buyingNow ? 'Processing…' : 'Buy Now'}
                                </button>
                            </div>

                            {/* Pincode Delivery Estimator */}
                            <div className="p-4 sm:p-5 rounded-3xl bg-slate-50 border border-slate-200/80 space-y-3">
                                <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                                    <FiMapPin className="text-blue-600 w-4 h-4" />
                                    <span>Check Delivery Availability & Estimated Date</span>
                                </div>
                                <form onSubmit={handleCheckPincode} className="flex gap-2">
                                    <input
                                        type="text"
                                        maxLength={6}
                                        value={pincode}
                                        onChange={(e) => setPincode(e.target.value)}
                                        placeholder="Enter 6-digit PIN code (e.g. 110001)"
                                        className="flex-1 px-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 shadow-sm"
                                    />
                                    <button
                                        type="submit"
                                        disabled={checkingPincode}
                                        className="px-5 py-2.5 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-2xl shadow-md transition-all active:scale-95 disabled:opacity-50"
                                    >
                                        {checkingPincode ? 'Checking…' : 'Check'}
                                    </button>
                                </form>
                                {deliveryInfo && (
                                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 font-semibold flex items-center gap-2">
                                        <FiCheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                                        <span>Delivery by <strong className="text-emerald-900">{deliveryInfo.date}</strong> | FREE Delivery to PIN {deliveryInfo.pincode}</span>
                                    </div>
                                )}
                            </div>

                            {/* Seller Store Badge Card */}
                            <div className="p-4 sm:p-5 rounded-3xl bg-white border border-slate-200/80 shadow-sm flex items-center justify-between gap-4">
                                <div className="flex items-center gap-3.5">
                                    {seller.logo ? (
                                        <img
                                            src={seller.logo}
                                            alt={seller.store_name || seller.business_name || 'Seller'}
                                            className="h-12 w-12 rounded-2xl object-cover border border-slate-200 shadow-md shadow-slate-200/50"
                                        />
                                    ) : (
                                        <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-black text-lg flex items-center justify-center shadow-md shadow-blue-600/20">
                                            {(seller.store_name || seller.business_name || 'Z')[0]}
                                        </div>
                                    )}
                                    <div>
                                        <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Sold by Authorized Partner</p>
                                        <p className="text-sm font-extrabold text-slate-900">{seller.store_name || seller.business_name || 'Zyvento Prime Store'}</p>
                                        {seller.tagline && (
                                            <p className="text-[11px] text-slate-500 font-medium truncate max-w-xs">{seller.tagline}</p>
                                        )}
                                        <div className="flex items-center gap-1.5 mt-0.5">
                                            <span className="px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200 text-amber-700 text-[10px] font-black">
                                                ★ {seller.rating || '4.9'}
                                            </span>
                                            <span className="text-[11px] text-slate-500 font-medium">Verified Merchant</span>
                                        </div>
                                    </div>
                                </div>
                                <Link
                                    to={seller?._id || seller?.id || seller?.seller_code
                                        ? `/products?seller=${encodeURIComponent(seller._id || seller.id || seller.seller_code)}&store=${encodeURIComponent(seller.store_name || seller.brand_name || seller.business_name || '')}`
                                        : '/products'}
                                    className="px-4 py-2 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-sky-50 text-xs font-bold text-blue-600 transition-all whitespace-nowrap"
                                >
                                    Visit Store
                                </Link>
                            </div>

                        </div>
                    </div>
                </div>

                {/* ============================================================
                    TABBED SPECIFICATIONS, REVIEWS & DETAILS MATRIX
                    ============================================================ */}
                <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
                    {/* Tab Navigation */}
                    <div className="flex border-b border-slate-200/80 bg-slate-50/70 overflow-x-auto scrollbar-none px-4 sm:px-6">
                        {[
                            { id: 'description', label: 'Product Description' },
                            { id: 'specs', label: 'Technical Specifications' },
                            { id: 'reviews', label: `Customer Reviews (${reviewsCount})` },
                            { id: 'shipping', label: 'Shipping & Returns Policy' }
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                type="button"
                                onClick={() => setActiveTab(tab.id)}
                                className={`px-5 py-4 text-xs sm:text-sm font-bold border-b-2 transition-all whitespace-nowrap ${
                                    activeTab === tab.id
                                        ? 'border-blue-600 text-blue-600 bg-white shadow-sm'
                                        : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
                                }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    <div className="p-6 sm:p-8 lg:p-10">
                        {/* TAB 1: DESCRIPTION */}
                        {activeTab === 'description' && (
                            <div className="space-y-6 max-w-4xl text-left">
                                <h3 className="text-lg font-black text-slate-900">About this product</h3>
                                <p className="text-sm sm:text-base leading-relaxed text-slate-600 whitespace-pre-line">
                                    {description}
                                </p>

                                <div className="space-y-3 pt-4">
                                    <h4 className="text-sm font-extrabold text-slate-800 uppercase tracking-wide">Key Highlights:</h4>
                                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm text-slate-600">
                                        <li className="flex items-center gap-2">
                                            <FiCheckCircle className="text-emerald-500 w-4 h-4 flex-shrink-0" />
                                            <span>Engineered with certified high-grade components</span>
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <FiCheckCircle className="text-emerald-500 w-4 h-4 flex-shrink-0" />
                                            <span>Official 1-Year Pan-India Brand Warranty</span>
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <FiCheckCircle className="text-emerald-500 w-4 h-4 flex-shrink-0" />
                                            <span>Designed for maximum durability and premium aesthetics</span>
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <FiCheckCircle className="text-emerald-500 w-4 h-4 flex-shrink-0" />
                                            <span>Compliant with all international safety & quality benchmarks</span>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        )}

                        {/* TAB 2: SPECIFICATIONS */}
                        {activeTab === 'specs' && (
                            <div className="space-y-6 max-w-4xl text-left">
                                <h3 className="text-lg font-black text-slate-900">Technical Details</h3>
                                <div className="border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-100">
                                    <div className="grid grid-cols-1 sm:grid-cols-3 p-4 bg-slate-50 text-xs font-semibold">
                                        <span className="text-slate-500">Brand</span>
                                        <span className="sm:col-span-2 text-slate-900 font-bold">{brand}</span>
                                    </div>
                                    {product.product_code && (
                                        <div className="grid grid-cols-1 sm:grid-cols-3 p-4 text-xs font-semibold">
                                            <span className="text-slate-500">Model / SKU Code</span>
                                            <span className="sm:col-span-2 text-slate-900 font-mono">{product.sku || product.product_code}</span>
                                        </div>
                                    )}
                                    {Object.entries(attributes).map(([k, v]) => (
                                        <div key={k} className="grid grid-cols-1 sm:grid-cols-3 p-4 text-xs font-semibold even:bg-slate-50">
                                            <span className="text-slate-500 capitalize">{k.replace(/_/g, ' ')}</span>
                                            <span className="sm:col-span-2 text-slate-900 font-medium">{String(v)}</span>
                                        </div>
                                    ))}
                                    <div className="grid grid-cols-1 sm:grid-cols-3 p-4 text-xs font-semibold even:bg-slate-50">
                                        <span className="text-slate-500">Country of Origin</span>
                                        <span className="sm:col-span-2 text-slate-900 font-medium">India</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* TAB 3: REVIEWS */}
                        {activeTab === 'reviews' && (
                            <div className="space-y-8 max-w-4xl text-left">
                                {/* Rating Overview Card */}
                                <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 p-6 rounded-3xl bg-slate-50 border border-slate-200/80 items-center">
                                    <div className="sm:col-span-4 text-center sm:border-r border-slate-200 sm:pr-6">
                                        <p className="text-5xl font-black text-slate-900">{reviewStats.avgRating ? reviewStats.avgRating.toFixed(1) : '0.0'}</p>
                                        <div className="flex justify-center mt-2">{renderStars(reviewStats.avgRating || 0)}</div>
                                        <p className="text-xs text-slate-500 mt-1 font-semibold">{reviewStats.totalReviews} Verified Reviews</p>
                                        
                                        <button
                                            type="button"
                                            onClick={handleWriteReviewClick}
                                            className="mt-4 w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-md shadow-slate-900/10 transition-all hover:scale-[1.02]"
                                        >
                                            {userReview ? (
                                                userReview.is_edited ? (
                                                    <>
                                                        <FiCheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                                                        <span>Reviewed</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <FiEdit2 className="w-3.5 h-3.5" />
                                                        <span>Edit Your Review (1/1)</span>
                                                    </>
                                                )
                                            ) : (
                                                <>
                                                    <FiStar className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                                                    <span>Write a Review</span>
                                                </>
                                            )}
                                        </button>

                                        {userReview?.status === 'hidden' && (
                                            <div className="mt-2.5 p-2 rounded-xl bg-slate-100 text-slate-700 text-[11px] font-medium flex items-center justify-center gap-1.5 border border-slate-200">
                                                <FiEyeOff className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                                                <span>Your review is currently hidden by administration moderation</span>
                                            </div>
                                        )}
                                        {userReview?.status === 'rejected' && (
                                            <div className="mt-2.5 p-2 rounded-xl bg-rose-50 text-rose-700 text-[11px] font-medium flex items-center justify-center gap-1.5 border border-rose-200">
                                                <FiAlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                                                <span>Your review was not approved by administration moderation</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Star Rating Breakdown Bars */}
                                    <div className="sm:col-span-8 space-y-2.5 text-xs">
                                        {[5, 4, 3, 2, 1].map((stars) => {
                                            const count = reviewStats.breakdown?.[stars] || 0;
                                            const total = reviewStats.totalReviews || 1;
                                            const pct = reviewStats.totalReviews > 0 ? Math.round((count / total) * 100) : 0;
                                            return (
                                                <div key={stars} className="flex items-center gap-3">
                                                    <span className="w-10 font-bold text-slate-600 flex items-center gap-1">
                                                        {stars} <FiStar className="w-3 h-3 fill-amber-400 text-amber-400 inline" />
                                                    </span>
                                                    <div className="flex-1 h-2.5 bg-slate-200 rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-amber-400 rounded-full transition-all duration-500"
                                                            style={{ width: `${pct}%` }}
                                                        />
                                                    </div>
                                                    <span className="w-12 text-right text-slate-500 font-semibold">{count} ({pct}%)</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Customer Feedbacks List - Responsive Grid */}
                                <div className="space-y-4 pt-2">
                                    <div className="flex items-center justify-between">
                                        <h4 className="text-sm font-black text-slate-900">
                                            Customer Feedbacks {reviewStats.totalReviews > 0 && `(${reviewStats.totalReviews})`}
                                        </h4>
                                        <button
                                            type="button"
                                            onClick={() => loadProductReviews(productId)}
                                            disabled={reviewsLoading}
                                            className="text-xs text-slate-500 hover:text-blue-600 flex items-center gap-1 font-semibold transition-colors"
                                        >
                                            <FiRefreshCw className={`w-3.5 h-3.5 ${reviewsLoading ? 'animate-spin text-blue-600' : ''}`} />
                                            <span>Refresh Feedbacks</span>
                                        </button>
                                    </div>

                                    {reviewsLoading ? (
                                        <div className="p-8 text-center rounded-2xl bg-slate-50 border border-slate-200/80">
                                            <FiRefreshCw className="w-6 h-6 animate-spin mx-auto text-blue-600 mb-2" />
                                            <p className="text-xs font-semibold text-slate-500">Loading reviews...</p>
                                        </div>
                                    ) : reviews.length === 0 ? (
                                        <div className="p-10 text-center rounded-3xl bg-slate-50 border border-slate-200/80 space-y-3">
                                            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto shadow-xs">
                                                <FiStar className="w-6 h-6 fill-amber-400" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-slate-800">No reviews yet for this product</p>
                                                <p className="text-xs text-slate-400 mt-1">Purchased or used this item? Be the first to share your experience!</p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={handleWriteReviewClick}
                                                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-md"
                                            >
                                                <FiStar className="w-4 h-4 fill-amber-400 text-amber-400" />
                                                <span>Write First Review</span>
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                                            {reviews.map((rev) => {
                                                const revUser = rev.user_id;
                                                const userName = typeof revUser === 'object' && revUser
                                                    ? (revUser.username || `${revUser.first_name || ''} ${revUser.last_name || ''}`.trim() || 'Customer')
                                                    : 'Verified Customer';

                                                const localUser = (() => {
                                                    try { return JSON.parse(localStorage.getItem('user') || '{}'); } catch (_) { return {}; }
                                                })();
                                                const loggedInUserId = (getUserIdString(user) || getUserIdString(localUser));
                                                const reviewAuthorId = getUserIdString(rev.user_id);
                                                const isCurrentUsersReview = Boolean(
                                                    isAuthenticated &&
                                                    loggedInUserId &&
                                                    reviewAuthorId &&
                                                    loggedInUserId === reviewAuthorId
                                                );

                                                return (
                                                    <div
                                                        key={rev._id || rev.review_code}
                                                        className={`p-5 rounded-2xl flex flex-col justify-between transition-all duration-200 border shadow-xs hover:shadow-md ${
                                                            isCurrentUsersReview
                                                                ? 'bg-gradient-to-br from-blue-50/70 via-sky-50/30 to-white border-blue-300 ring-2 ring-blue-100/80 shadow-blue-100/50'
                                                                : 'bg-white border-slate-200/90 hover:border-slate-300'
                                                        }`}
                                                    >
                                                        <div className="space-y-3">
                                                            {/* TOP 1 ROW: [Left: Profile Pic / Avatar] [Center: Username + Date + (Your Review if author)] [Right: Star Rating] */}
                                                            <div className="flex items-center justify-between gap-3 pb-2.5 border-b border-slate-100">
                                                                <div className="flex items-center gap-2.5 min-w-0">
                                                                    {/* Left: Profile Picture or First Alphabet Avatar */}
                                                                    <UserAvatar
                                                                        src={typeof revUser === 'object' ? revUser?.profile_image : null}
                                                                        name={userName}
                                                                        size="md"
                                                                        className="w-10 h-10 shrink-0"
                                                                    />

                                                                    {/* Center: Username & Details */}
                                                                    <div className="min-w-0">
                                                                        <div className="flex items-center gap-1.5 flex-wrap">
                                                                            <span className="font-bold text-slate-900 text-xs sm:text-sm truncate">
                                                                                {userName}
                                                                            </span>
                                                                            {isCurrentUsersReview && (
                                                                                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700 border border-blue-200 shrink-0">
                                                                                    Your Review
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                        <p className="text-[11px] text-slate-400 mt-0.5">
                                                                            {rev.is_edited
                                                                                ? `Updated ${new Date(rev.updated_at || rev.updatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`
                                                                                : `Reviewed ${new Date(rev.created_at || rev.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`
                                                                            }
                                                                        </p>
                                                                    </div>
                                                                </div>

                                                                {/* Right: Review Star Rating */}
                                                                <div className="shrink-0 flex items-center gap-0.5">
                                                                    {renderStars(rev.rating)}
                                                                </div>
                                                            </div>

                                                            {/* Review Title */}
                                                            {rev.title && (
                                                                <h5 className="font-bold text-slate-900 text-xs sm:text-sm leading-snug">
                                                                    "{rev.title}"
                                                                </h5>
                                                            )}

                                                            {/* Review Comment Text */}
                                                            <p className="text-slate-700 text-xs sm:text-sm leading-relaxed break-words">
                                                                {rev.comment}
                                                            </p>

                                                            {/* Attached Images and Videos */}
                                                            {((rev.images && rev.images.length > 0) || (rev.videos && rev.videos.length > 0)) && (
                                                                <div className="pt-1 flex flex-wrap gap-2">
                                                                    {rev.images?.map((img, idx) => (
                                                                        <button
                                                                            key={`rev-img-${idx}`}
                                                                            type="button"
                                                                            onClick={() => setActiveMediaModal({ url: img, type: 'image' })}
                                                                            className="group relative w-14 h-14 rounded-xl overflow-hidden border border-slate-200 shadow-2xs hover:ring-2 hover:ring-blue-500 transition-all shrink-0"
                                                                        >
                                                                            <img src={img} alt="Customer attachment" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                                                                        </button>
                                                                    ))}
                                                                    {rev.videos?.map((vid, idx) => (
                                                                        <button
                                                                            key={`rev-vid-${idx}`}
                                                                            type="button"
                                                                            onClick={() => setActiveMediaModal({ url: vid, type: 'video' })}
                                                                            className="group relative w-14 h-14 rounded-xl overflow-hidden border border-slate-200 shadow-2xs bg-slate-900 hover:ring-2 hover:ring-blue-500 transition-all flex items-center justify-center text-white shrink-0"
                                                                        >
                                                                            <video src={vid} className="w-full h-full object-cover opacity-60" />
                                                                            <div className="absolute inset-0 flex items-center justify-center">
                                                                                <FiPlay className="w-4 h-4 fill-white text-white drop-shadow" />
                                                                            </div>
                                                                        </button>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Footer: ONLY visible to logged-in user on their OWN review */}
                                                        {isCurrentUsersReview && (
                                                            <div className="mt-4 pt-3 border-t border-blue-100 flex items-center justify-between gap-2">
                                                                <div>
                                                                    {rev.is_edited ? (
                                                                        <span className="text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                                                                            <FiCheckCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                                                                            <span>Edited (1/1 max)</span>
                                                                        </span>
                                                                    ) : (
                                                                        <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                                                                            1 edit allowed
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <div className="flex items-center gap-1.5">
                                                                    <button
                                                                        type="button"
                                                                        onClick={handleWriteReviewClick}
                                                                        disabled={rev.is_edited}
                                                                        title={rev.is_edited ? 'You have already edited this review once (1/1 limit reached)' : 'Edit your review'}
                                                                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs font-bold transition-all shadow-xs ${
                                                                            rev.is_edited
                                                                                ? 'border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed opacity-60'
                                                                                : 'border-blue-200 bg-white hover:bg-blue-50 text-blue-700'
                                                                        }`}
                                                                    >
                                                                        <FiEdit2 className="w-3 h-3" />
                                                                        <span>Edit</span>
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => {
                                                                            setReviewToDelete(rev);
                                                                            setDeleteConfirmOpen(true);
                                                                        }}
                                                                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-rose-200 bg-white hover:bg-rose-50 text-rose-600 text-xs font-bold transition-all shadow-xs"
                                                                    >
                                                                        <FiTrash2 className="w-3 h-3" />
                                                                        <span>Delete</span>
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* TAB 4: SHIPPING & RETURNS */}
                        {activeTab === 'shipping' && (
                            <div className="space-y-4 max-w-4xl text-left text-xs sm:text-sm text-slate-600 leading-relaxed">
                                <h3 className="text-lg font-black text-slate-900">Shipping & Returns Information</h3>
                                <p>
                                    All orders placed on Zyvento are dispatched through verified tier-1 logistics partners (BlueDart, Delhivery, Xpressbees) ensuring insured doorstep delivery across 19,000+ pin codes in India.
                                </p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                                        <p className="font-bold text-slate-900">⚡ Dispatch Time</p>
                                        <p className="text-xs text-slate-500">Orders placed before 2:00 PM are processed and dispatched on the very same day.</p>
                                    </div>
                                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                                        <p className="font-bold text-slate-900">🔄 7-Day Replacement</p>
                                        <p className="text-xs text-slate-500">In the rare event of physical defect or mismatch, an instant doorstep exchange is scheduled.</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* ============================================================
                    RELATED & RECOMMENDED PRODUCTS
                    ============================================================ */}
                {relatedProducts.length > 0 && (
                    <div className="space-y-6 pt-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                                    You might also love
                                </h2>
                                <p className="text-xs sm:text-sm text-slate-500">Handpicked alternatives from the same department</p>
                            </div>
                            <Link
                                to="/products"
                                className="inline-flex items-center gap-1 text-xs sm:text-sm font-bold text-blue-600 hover:text-blue-800 transition"
                            >
                                <span>View Full Catalog</span>
                                <FiChevronRight className="h-4 w-4" />
                            </Link>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                            {relatedProducts.map((p) => (
                                <ProductCard
                                    key={p._id || p.id}
                                    product={p}
                                    viewMode="grid"
                                />
                            ))}
                        </div>
                    </div>
                )}

            </div>

            {/* ============================================================
                STICKY MOBILE CONVERSION BAR (Mobile only)
                ============================================================ */}
            <div className="lg:hidden fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t border-slate-200 p-3.5 z-40 shadow-2xl flex items-center justify-between gap-3">
                <div className="min-w-0">
                    <p className="text-[10px] text-slate-400 font-bold uppercase truncate">{name}</p>
                    <p className="text-lg font-black text-slate-900 leading-tight">₹{finalPrice.toLocaleString('en-IN')}</p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={handleAddToCart}
                        disabled={addingToCart || !inStock}
                        className="px-4 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-xs shadow-md active:scale-95 disabled:opacity-50"
                    >
                        {addingToCart ? 'Adding…' : 'Add to Cart'}
                    </button>
                    <button
                        type="button"
                        onClick={handleBuyNow}
                        disabled={buyingNow || !inStock}
                        className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold text-xs shadow-md active:scale-95 disabled:opacity-50"
                    >
                        Buy Now
                    </button>
                </div>
            </div>

            {/* ============================================================
                FULLSCREEN IMAGE LIGHTBOX MODAL
                ============================================================ */}
            {isLightboxOpen && (
                <div
                    className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4"
                    onClick={() => setIsLightboxOpen(false)}
                >
                    <button
                        type="button"
                        onClick={() => setIsLightboxOpen(false)}
                        className="absolute top-6 right-6 p-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all"
                    >
                        <FiX className="w-6 h-6" />
                    </button>
                    <img
                        src={imageList[selectedImage]}
                        alt="Expanded preview"
                        className="max-h-[85vh] max-w-[90vw] object-contain rounded-2xl shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            )}

            {/* ============================================================
                WRITE / EDIT REVIEW MODAL (ENHANCED DESKTOP & RESPONSIVE UI)
                ============================================================ */}
            {reviewModalOpen && (
                <div 
                    className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
                    onClick={() => setReviewModalOpen(false)}
                >
                    <div 
                        className="bg-white rounded-3xl w-full max-w-xl md:max-w-2xl max-h-[92vh] flex flex-col shadow-2xl border border-slate-100 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200 text-left"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="px-6 sm:px-8 py-5 border-b border-slate-100 flex items-center justify-between gap-4 shrink-0 bg-white">
                            <div className="min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                                        isEditingReview 
                                            ? 'bg-amber-50 text-amber-700 border border-amber-200' 
                                            : 'bg-blue-50 text-blue-700 border border-blue-200'
                                    }`}>
                                        {isEditingReview ? '✏️ Edit Review (1/1 Limit)' : '⭐ New Product Review'}
                                    </span>
                                </div>
                                <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight truncate">
                                    {isEditingReview ? 'Edit Your Review' : 'Write a Product Review'}
                                </h3>
                                <div className="flex items-center gap-2 mt-1">
                                    {imageList[0] && (
                                        <img 
                                            src={imageList[0]} 
                                            alt={name} 
                                            className="w-5 h-5 rounded-md object-cover border border-slate-200 shrink-0" 
                                        />
                                    )}
                                    <p className="text-xs text-slate-500 truncate font-medium">
                                        Reviewing <span className="font-bold text-slate-700">{name}</span>
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setReviewModalOpen(false)}
                                className="p-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition-colors shrink-0"
                                title="Close"
                            >
                                <FiX className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Modal Body & Form */}
                        <form onSubmit={handleSubmitReview} className="flex flex-col flex-1 min-h-0">
                            <div className="p-6 sm:p-8 space-y-6 overflow-y-auto flex-1">
                                
                                {/* Overall Star Rating Section */}
                                <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-50/80 via-orange-50/30 to-amber-50/40 border border-amber-200/70 space-y-2.5">
                                    <div className="flex items-center justify-between">
                                        <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                                            Overall Rating <span className="text-rose-500">*</span>
                                        </label>
                                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold border transition-colors ${
                                            reviewForm.rating === 5 ? 'bg-emerald-100 text-emerald-800 border-emerald-200' :
                                            reviewForm.rating === 4 ? 'bg-teal-100 text-teal-800 border-teal-200' :
                                            reviewForm.rating === 3 ? 'bg-amber-100 text-amber-800 border-amber-200' :
                                            reviewForm.rating === 2 ? 'bg-orange-100 text-orange-800 border-orange-200' :
                                            'bg-rose-100 text-rose-800 border-rose-200'
                                        }`}>
                                            {reviewForm.rating === 5 && 'Outstanding! (5★)'}
                                            {reviewForm.rating === 4 && 'Very Good (4★)'}
                                            {reviewForm.rating === 3 && 'Average (3★)'}
                                            {reviewForm.rating === 2 && 'Poor (2★)'}
                                            {reviewForm.rating === 1 && 'Terrible (1★)'}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-1.5 pt-1">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <button
                                                key={star}
                                                type="button"
                                                onClick={() => setReviewForm(prev => ({ ...prev, rating: star }))}
                                                className="p-1 hover:scale-125 active:scale-95 transition-transform"
                                                title={`Rate ${star} star${star > 1 ? 's' : ''}`}
                                            >
                                                <FiStar
                                                    className={`w-8 h-8 sm:w-9 sm:h-9 transition-colors ${
                                                        star <= reviewForm.rating
                                                            ? 'fill-amber-400 text-amber-400 drop-shadow-xs'
                                                            : 'text-slate-200 hover:text-amber-200'
                                                    }`}
                                                />
                                            </button>
                                        ))}
                                        <span className="text-sm font-black text-slate-800 ml-3">
                                            {reviewForm.rating}.0 / 5.0
                                        </span>
                                    </div>
                                </div>

                                {/* Headline / Title Input */}
                                <div className="space-y-1.5">
                                    <div className="flex items-center justify-between">
                                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                                            Headline / Title <span className="text-slate-400 font-normal">(Optional)</span>
                                        </label>
                                        <span className="text-[11px] text-slate-400">
                                            {reviewForm.title?.length || 0} / 100
                                        </span>
                                    </div>
                                    <input
                                        type="text"
                                        value={reviewForm.title}
                                        onChange={(e) => setReviewForm(prev => ({ ...prev, title: e.target.value }))}
                                        placeholder="e.g. Excellent build quality, worth every penny!"
                                        maxLength={100}
                                        className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all placeholder:text-slate-400 shadow-2xs"
                                    />
                                </div>

                                {/* Feedback / Comment Textarea */}
                                <div className="space-y-1.5">
                                    <div className="flex items-center justify-between">
                                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                                            Your Feedback <span className="text-rose-500">*</span>
                                        </label>
                                        <span className="text-[11px] text-slate-400">
                                            {reviewForm.comment?.length || 0} / 2000
                                        </span>
                                    </div>
                                    <textarea
                                        rows={4}
                                        value={reviewForm.comment}
                                        onChange={(e) => setReviewForm(prev => ({ ...prev, comment: e.target.value }))}
                                        placeholder="What did you like or dislike about this product? How is the performance, material quality, and fit?"
                                        maxLength={2000}
                                        required
                                        className="w-full px-4 py-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all placeholder:text-slate-400 resize-none leading-relaxed shadow-2xs"
                                    />
                                    <p className="text-[11px] text-slate-400">
                                        Detailed reviews help other shoppers make confident purchase decisions.
                                    </p>
                                </div>

                                {/* Media Attachments Section (Photos & Videos) */}
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                                            Attach Photos / Videos
                                        </label>
                                        <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                                            {(reviewForm.existingImages?.length || 0) + (reviewForm.existingVideos?.length || 0) + selectedMediaFiles.length} / 3 files
                                        </span>
                                    </div>

                                    <div className="p-4 sm:p-5 bg-slate-50/90 rounded-2xl border border-slate-200 space-y-4">
                                        <div className="flex items-start gap-2.5 text-xs text-slate-600">
                                            <FiInfo className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                                            <span>
                                                Attach up to <strong>3 files total</strong> (Images or Videos). Images must be ≤ <strong>1 MB</strong>. Videos must be ≤ <strong>1 minute (60s)</strong>.
                                            </span>
                                        </div>

                                        {/* Existing Attachments Previews */}
                                        {((reviewForm.existingImages && reviewForm.existingImages.length > 0) || (reviewForm.existingVideos && reviewForm.existingVideos.length > 0)) && (
                                            <div className="space-y-2">
                                                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Existing attachments:</p>
                                                <div className="flex flex-wrap gap-3">
                                                    {reviewForm.existingImages?.map((url, i) => (
                                                        <div key={`existing-img-${i}`} className="relative w-20 h-20 rounded-xl overflow-hidden border border-slate-200 shadow-2xs group">
                                                            <img src={url} alt="Review attachment" className="w-full h-full object-cover" />
                                                            <button
                                                                type="button"
                                                                onClick={() => handleRemoveExistingMedia('image', url)}
                                                                className="absolute top-1.5 right-1.5 p-1 rounded-full bg-rose-600 text-white shadow-sm hover:bg-rose-700 transition"
                                                                title="Remove image"
                                                            >
                                                                <FiX className="w-3.5 h-3.5" />
                                                            </button>
                                                        </div>
                                                    ))}
                                                    {reviewForm.existingVideos?.map((url, i) => (
                                                        <div key={`existing-vid-${i}`} className="relative w-20 h-20 rounded-xl overflow-hidden border border-slate-200 bg-slate-900 shadow-2xs group flex items-center justify-center">
                                                            <video src={url} className="w-full h-full object-cover opacity-60" />
                                                            <FiPlay className="w-5 h-5 fill-white text-white absolute" />
                                                            <button
                                                                type="button"
                                                                onClick={() => handleRemoveExistingMedia('video', url)}
                                                                className="absolute top-1.5 right-1.5 p-1 rounded-full bg-rose-600 text-white shadow-sm hover:bg-rose-700 transition"
                                                                title="Remove video"
                                                            >
                                                                <FiX className="w-3.5 h-3.5" />
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Newly Selected Media Previews */}
                                        {selectedMediaFiles.length > 0 && (
                                            <div className="space-y-2">
                                                <p className="text-[11px] font-bold text-blue-600 uppercase tracking-wider">Ready to upload:</p>
                                                <div className="flex flex-wrap gap-3">
                                                    {selectedMediaFiles.map((item, idx) => (
                                                        <div key={`new-media-${idx}`} className="relative w-20 h-20 rounded-xl overflow-hidden border border-blue-300 bg-slate-100 shadow-2xs group">
                                                            {item.type === 'image' ? (
                                                                <img src={item.previewUrl} alt="Selected preview" className="w-full h-full object-cover" />
                                                            ) : (
                                                                <div className="w-full h-full bg-slate-900 flex items-center justify-center">
                                                                    <video src={item.previewUrl} className="w-full h-full object-cover opacity-60" />
                                                                    <span className="absolute bottom-1 right-1 bg-black/75 text-white text-[9px] px-1 rounded font-bold">
                                                                        {item.duration ? `${item.duration}s` : 'vid'}
                                                                    </span>
                                                                </div>
                                                            )}
                                                            <button
                                                                type="button"
                                                                onClick={() => handleRemoveNewMedia(idx)}
                                                                className="absolute top-1.5 right-1.5 p-1 rounded-full bg-rose-600 text-white shadow-sm hover:bg-rose-700 transition"
                                                                title="Remove file"
                                                            >
                                                                <FiX className="w-3.5 h-3.5" />
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Upload Trigger Dropzone */}
                                        {((reviewForm.existingImages?.length || 0) + (reviewForm.existingVideos?.length || 0) + selectedMediaFiles.length) < 3 && (
                                            <div>
                                                <label className="flex flex-col sm:flex-row items-center justify-center gap-2.5 px-5 py-3.5 rounded-2xl border-2 border-dashed border-blue-300 bg-white hover:bg-blue-50/60 hover:border-blue-500 text-blue-700 text-xs font-bold cursor-pointer transition shadow-2xs group">
                                                    <FiUploadCloud className="w-5 h-5 text-blue-600 group-hover:scale-110 transition-transform" />
                                                    <span>Click to choose Image (≤1MB) or Video (≤60s)</span>
                                                    <input
                                                        type="file"
                                                        accept="image/*,video/*"
                                                        multiple
                                                        onChange={handleMediaSelect}
                                                        className="hidden"
                                                    />
                                                </label>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Modal Footer - Fixed */}
                            <div className="px-6 sm:px-8 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between sm:justify-end gap-3 shrink-0">
                                <button
                                    type="button"
                                    onClick={() => setReviewModalOpen(false)}
                                    disabled={submittingReview}
                                    className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 font-bold text-xs transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submittingReview}
                                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs shadow-lg shadow-blue-600/25 active:scale-95 transition disabled:opacity-60 flex items-center gap-2"
                                >
                                    {submittingReview ? (
                                        <>
                                            <FiRefreshCw className="w-4 h-4 animate-spin" />
                                            <span>Submitting…</span>
                                        </>
                                    ) : (
                                        <span>{isEditingReview ? 'Update Review' : 'Submit Review'}</span>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ============================================================
                CONFIRM DELETE REVIEW MODAL
                ============================================================ */}
            {deleteConfirmOpen && (
                <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 text-center space-y-4 animate-in fade-in zoom-in-95 duration-200">
                        <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center text-2xl font-bold">
                            <FiTrash2 />
                        </div>
                        <div>
                            <h4 className="text-lg font-black text-slate-900">Delete Your Review?</h4>
                            <p className="text-xs text-slate-500 mt-1">
                                This will permanently remove your review and attached media from the product. You will be able to submit a fresh review anytime.
                            </p>
                        </div>
                        <div className="flex items-center gap-3 pt-2">
                            <button
                                type="button"
                                onClick={() => setDeleteConfirmOpen(false)}
                                disabled={deletingReview}
                                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 transition"
                            >
                                Keep Review
                            </button>
                            <button
                                type="button"
                                onClick={handleDeleteReview}
                                disabled={deletingReview}
                                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md shadow-rose-600/20 transition flex items-center justify-center gap-1.5"
                            >
                                {deletingReview ? (
                                    <>
                                        <FiRefreshCw className="w-3.5 h-3.5 animate-spin" />
                                        <span>Deleting…</span>
                                    </>
                                ) : (
                                    <span>Delete</span>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ============================================================
                MEDIA LIGHTBOX (FOR REVIEW PHOTOS & VIDEOS)
                ============================================================ */}
            {activeMediaModal && (
                <div
                    className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4"
                    onClick={() => setActiveMediaModal(null)}
                >
                    <button
                        type="button"
                        onClick={() => setActiveMediaModal(null)}
                        className="absolute top-6 right-6 p-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all z-10"
                    >
                        <FiX className="w-6 h-6" />
                    </button>
                    <div className="max-h-[85vh] max-w-[90vw] flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
                        {activeMediaModal.type === 'video' ? (
                            <video
                                src={activeMediaModal.url}
                                controls
                                autoPlay
                                className="max-h-[80vh] max-w-[85vw] rounded-2xl shadow-2xl bg-black"
                            />
                        ) : (
                            <img
                                src={activeMediaModal.url}
                                alt="Customer review media"
                                className="max-h-[85vh] max-w-[90vw] object-contain rounded-2xl shadow-2xl"
                            />
                        )}
                    </div>
                </div>
            )}

        </div>
    );
};

export default ProductDetail;
