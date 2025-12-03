'use client';

import { useState, useEffect, useCallback } from 'react';

export default function CosmicCalendarClient({ initialApod }) {
    // ========== STATE MANAGEMENT ==========
    const [currentApod, setCurrentApod] = useState(initialApod);
    const [isLoading, setIsLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isFavoritesModalOpen, setIsFavoritesModalOpen] = useState(false);
    const [isFocusMode, setIsFocusMode] = useState(false);
    const [error, setError] = useState(null);
    const [favorites, setFavorites] = useState({});
    const [selectedDate, setSelectedDate] = useState('');

    // ========== UTILITY FUNCTIONS ==========
    const parseDate = (dateString) => {
        const [year, month, day] = dateString.split('-').map(Number);
        return new Date(year, month - 1, day);
    };

    const formatDate = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const addDays = (dateString, days) => {
        const date = parseDate(dateString);
        date.setDate(date.getDate() + days);
        return formatDate(date);
    };

    const isValidApodDate = (dateString) => {
        const minDate = new Date(1995, 5, 16);
        const maxDate = new Date();
        const checkDate = parseDate(dateString);
        return checkDate >= minDate && checkDate <= maxDate;
    };

    const getYouTubeId = (url) => {
        const match = url.match(/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/);
        return (match && match[2].length === 11) ? match[2] : '';
    };

    // ========== LOCALSTORAGE EFFECTS ==========
    useEffect(() => {
        const storedFavorites = localStorage.getItem('apod-favorites');
        if (storedFavorites) {
            const parsed = JSON.parse(storedFavorites);
            if (!Array.isArray(parsed)) {
                setFavorites(parsed);
            }
        }
    }, []);

    const saveFavorites = useCallback((newFavorites) => {
        localStorage.setItem('apod-favorites', JSON.stringify(newFavorites));
        setFavorites(newFavorites);
    }, []);

    // ========== MODAL FUNCTIONS ==========
    const openModal = () => {
        setIsModalOpen(true);
        if (!selectedDate) {
            setSelectedDate(new Date().toISOString().split('T')[0]);
        }
    };

    const closeModal = () => {
        setIsModalOpen(false);
    };

    const openFavoritesModal = () => {
        setIsFavoritesModalOpen(true);
    };

    const closeFavoritesModal = () => {
        setIsFavoritesModalOpen(false);
    };

    // ========== APOD FETCHING ==========
    const fetchAPOD = async (date) => {
        setIsLoading(true);
        setError(null);

        try {
            const url = date ? `/api/apod?date=${date}` : '/api/apod';
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const apodData = await response.json();
            setCurrentApod(apodData);
            setIsLoading(false);
            closeModal();
        } catch (error) {
            console.error('Error fetching APOD:', error);

            const errorMessage = error.message || 'Failed to fetch APOD data.';
            setError(errorMessage);
            setIsLoading(false);
            alert(errorMessage);
        }
    };

    // ========== FEATURE FUNCTIONS ==========
    const shareAPOD = async () => {
        if (!currentApod) {
            alert('No APOD data available to share');
            return;
        }

        const shareData = {
            title: `Cosmic Calendar: ${currentApod.title}`,
            text: `Check out this amazing astronomy picture from ${currentApod.date}!`,
            url: window.location.href
        };

        try {
            if (navigator.share) {
                await navigator.share(shareData);
            } else {
                await navigator.clipboard.writeText(`${shareData.title}\n${shareData.text}\n${shareData.url}`);
                alert('Link copied to clipboard!');
            }
        } catch (error) {
            if (error.name !== 'AbortError') {
                console.error('Error sharing:', error);
                alert('Failed to share. Please try again.');
            }
        }
    };

    const downloadAPOD = () => {
        if (!currentApod) {
            alert('No APOD data available to download');
            return;
        }

        if (currentApod.media_type === 'video') {
            window.open(currentApod.url, '_blank');
            return;
        }

        try {
            const link = document.createElement('a');
            link.href = currentApod.url;
            link.download = `cosmic-calendar-${currentApod.date}.jpg`;
            link.target = '_blank';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
            console.error('Error downloading:', error);
            alert('Failed to download. Opening in new tab instead.');
            window.open(currentApod.url, '_blank');
        }
    };

    const toggleFavorite = () => {
        if (!currentApod) {
            alert('No APOD data available to favorite');
            return;
        }

        const date = currentApod.date;
        const newFavorites = { ...favorites };

        if (newFavorites[date]) {
            delete newFavorites[date];
        } else {
            newFavorites[date] = {
                title: currentApod.title,
                date: currentApod.date,
                url: currentApod.url,
                media_type: currentApod.media_type,
                explanation: currentApod.explanation,
                copyright: currentApod.copyright || null
            };
        }

        saveFavorites(newFavorites);
    };

    const removeFavorite = (date) => {
        const newFavorites = { ...favorites };
        delete newFavorites[date];
        saveFavorites(newFavorites);
    };

    const loadFavoriteApod = (date) => {
        if (!date) {
            alert('Error: No date specified');
            return;
        }
        closeFavoritesModal();
        fetchAPOD(date);
    };

    const navigateAPOD = (direction) => {
        if (!currentApod) {
            alert('No APOD data available');
            return;
        }

        const newDate = addDays(currentApod.date, direction);

        if (isValidApodDate(newDate)) {
            fetchAPOD(newDate);
        } else {
            alert(direction > 0 ? 'No APOD available for future dates' : 'No APOD available before June 16, 1995');
        }
    };

    // ========== KEYBOARD SHORTCUTS ==========
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && isModalOpen) {
                closeModal();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isModalOpen]);

    // ========== RENDER HELPERS ==========
    const isFavorite = currentApod ? favorites.hasOwnProperty(currentApod.date) : false;

    const favoritesArray = Object.values(favorites).sort((a, b) => 
        new Date(b.date) - new Date(a.date)
    );

    const handleForegroundClick = (e) => {
        if (isModalOpen) return;
        const isInteractive = e.target.closest('button, a, input, textarea, select, #content-card, #date-modal, #favorites-modal');
        if (!isInteractive) {
            setIsFocusMode(!isFocusMode);
        }
    };

    const handleModalBackdropClick = (e) => {
        if (e.target.id === 'date-modal') {
            closeModal();
        }
    };

    const handleFavoritesBackdropClick = (e) => {
        if (e.target.id === 'favorites-modal') {
            closeFavoritesModal();
        }
    };

    const handleDateInputKeyPress = (e) => {
        if (e.key === 'Enter') {
            fetchAPOD(selectedDate);
        }
    };

    // ========== JSX RETURN ==========
    return (
        <div className="relative flex h-auto min-h-screen w-full flex-col bg-background-light dark:bg-background-dark group/design-root overflow-hidden">
            {/* Background media layer */}
            <div id="media-container" className="absolute inset-0 z-0 transition-opacity duration-300">
                {currentApod && currentApod.media_type === 'image' && (
                    <div
                        className="absolute inset-0 bg-center bg-no-repeat bg-cover"
                        data-alt={currentApod.title}
                        style={{ backgroundImage: `url("${currentApod.url}")` }}>
                    </div>
                )}
                {currentApod && currentApod.media_type === 'video' && (
                    <div className="absolute inset-0 overflow-hidden">
                        <iframe
                            className="absolute top-1/2 left-1/2 w-[177.77vh] h-[56.25vw] min-h-screen min-w-full -translate-x-1/2 -translate-y-1/2"
                            src={currentApod.url}
                            title={currentApod.title}
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen>
                        </iframe>
                    </div>
                )}
            </div>

            {/* Foreground content layer */}
            <div 
                id="foreground-layer" 
                className="relative z-10 flex h-full grow flex-col"
                onClick={handleForegroundClick}>

                {/* Header */}
                <header 
                    id="header" 
                    className="flex items-center justify-between p-6 md:p-10 transition-opacity duration-300"
                    style={{
                        opacity: isFocusMode ? 0 : 1,
                        pointerEvents: isFocusMode ? 'none' : '',
                        visibility: isFocusMode ? 'hidden' : 'visible'
                    }}>
                    <div className="flex flex-col">
                        <span className="font-heading text-lg font-bold text-white">Cosmic Calendar</span>
                        <span className="text-xs text-white/60">Astronomy Picture of the Day</span>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={(e) => { e.stopPropagation(); navigateAPOD(-1); }}
                            aria-label="View previous APOD"
                            className="flex h-10 min-w-10 w-10 cursor-pointer items-center justify-center overflow-hidden rounded-lg bg-primary/20 text-primary transition-colors hover:bg-primary/30">
                            <span className="material-symbols-outlined" aria-hidden="true">chevron_left</span>
                        </button>

                        <button
                            onClick={(e) => { e.stopPropagation(); openModal(); }}
                            aria-label="Open date picker calendar"
                            className="flex h-10 min-w-10 w-10 cursor-pointer items-center justify-center overflow-hidden rounded-lg bg-primary/20 text-primary transition-colors hover:bg-primary/30">
                            <span className="material-symbols-outlined" aria-hidden="true">calendar_today</span>
                        </button>

                        <button
                            onClick={(e) => { e.stopPropagation(); openFavoritesModal(); }}
                            aria-label="View bookmarked favorites"
                            className="flex h-10 min-w-10 w-10 cursor-pointer items-center justify-center overflow-hidden rounded-lg bg-primary/20 text-primary transition-colors hover:bg-primary/30">
                            <span className="material-symbols-outlined" aria-hidden="true">bookmarks</span>
                        </button>

                        <button
                            onClick={(e) => { e.stopPropagation(); navigateAPOD(1); }}
                            aria-label="View next APOD"
                            className="flex h-10 min-w-10 w-10 cursor-pointer items-center justify-center overflow-hidden rounded-lg bg-primary/20 text-primary transition-colors hover:bg-primary/30">
                            <span className="material-symbols-outlined" aria-hidden="true">chevron_right</span>
                        </button>
                    </div>
                </header>

                {/* Main content */}
                <main className="flex-1 flex items-end justify-center p-6 md:p-10">
                    <div 
                        id="content-card" 
                        className="w-full max-w-4xl p-4 sm:p-6 md:p-8 rounded-xl backdrop-blur-lg bg-background-dark/70 text-white border border-white/10 transition-opacity duration-300"
                        style={{
                            opacity: isFocusMode ? 0 : 1,
                            pointerEvents: isFocusMode ? 'none' : '',
                            visibility: isFocusMode ? 'hidden' : 'visible'
                        }}>

                        {/* Skeleton Loading */}
                        {isLoading && (
                            <div id="skeleton-loading" className="animate-pulse">
                                <div className="h-10 bg-white/20 rounded-lg w-3/4 mb-4"></div>
                                <div className="h-6 bg-white/20 rounded-lg w-1/4 mb-6"></div>
                                <div className="border-t border-white/10 my-6"></div>
                                <div className="space-y-3">
                                    <div className="h-4 bg-white/20 rounded w-full"></div>
                                    <div className="h-4 bg-white/20 rounded w-full"></div>
                                    <div className="h-4 bg-white/20 rounded w-5/6"></div>
                                    <div className="h-4 bg-white/20 rounded w-full"></div>
                                    <div className="h-4 bg-white/20 rounded w-4/5"></div>
                                </div>
                            </div>
                        )}

                        {/* Actual Content */}
                        {!isLoading && currentApod && (
                            <div id="apod-content">
                                <div className="flex flex-col md:flex-row items-start justify-between gap-6">
                                    <div className="flex flex-col gap-2">
                                        <h1 id="apod-title" className="text-2xl sm:text-3xl md:text-4xl font-bold font-heading text-white">
                                            {currentApod.title}
                                        </h1>
                                        <h2 id="apod-date" className="text-base sm:text-lg font-heading text-white/80">
                                            {currentApod.date}
                                        </h2>
                                    </div>

                                    <div className="flex gap-2">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); shareAPOD(); }}
                                            aria-label="Share this APOD"
                                            className="flex h-10 min-w-10 w-10 cursor-pointer items-center justify-center overflow-hidden rounded-lg bg-primary/20 text-primary transition-colors hover:bg-primary/30">
                                            <span className="material-symbols-outlined" aria-hidden="true">share</span>
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); downloadAPOD(); }}
                                            aria-label="Download this image"
                                            className="flex h-10 min-w-10 w-10 cursor-pointer items-center justify-center overflow-hidden rounded-lg bg-primary/20 text-primary transition-colors hover:bg-primary/30">
                                            <span className="material-symbols-outlined" aria-hidden="true">download</span>
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); toggleFavorite(); }}
                                            aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                                            className="flex h-10 min-w-10 w-10 cursor-pointer items-center justify-center overflow-hidden rounded-lg bg-primary/20 text-primary transition-colors hover:bg-primary/30">
                                            <span 
                                                id="favorite-icon" 
                                                className="material-symbols-outlined" 
                                                aria-hidden="true"
                                                style={{ fontVariationSettings: isFavorite ? "'FILL' 1" : "'FILL' 0" }}>
                                                star
                                            </span>
                                        </button>
                                    </div>
                                </div>

                                <div className="mt-6 border-t border-white/10 pt-6">
                                    <p id="apod-explanation" className="text-sm sm:text-base leading-relaxed text-white/90 font-display">
                                        {currentApod.explanation}
                                    </p>

                                    <div className="mt-4 pt-4 border-t border-white/5">
                                        {currentApod.copyright ? (
                                            <p className="text-xs text-white/60">
                                                Image Credit: © {currentApod.copyright}
                                            </p>
                                        ) : (
                                            <p className="text-xs text-white/60">
                                                Image Credit: NASA
                                            </p>
                                        )}
                                        <p className="text-xs text-white/40 mt-1">
                                            Source: NASA Astronomy Picture of the Day (APOD)
                                        </p>
                                        <p className="text-xs text-white/30 mt-2 italic">
                                            This is an independent viewer using NASA's public API. Not affiliated with NASA.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Error Message */}
                        {!isLoading && !currentApod && (
                            <div className="flex flex-col gap-4">
                                <div className="flex items-center gap-3">
                                    <span className="material-symbols-outlined text-red-400 text-2xl sm:text-3xl">error</span>
                                    <h1 className="text-xl sm:text-2xl md:text-3xl font-bold font-heading text-white">Unable to Load APOD</h1>
                                </div>

                                <div className="mt-4 border-t border-red-400/20 pt-4">
                                    <p className="text-sm sm:text-base leading-relaxed text-white/90 font-display mb-4">
                                        {error || "We couldn't retrieve the Astronomy Picture of the Day. This could be due to a network issue or a problem with the NASA API."}
                                    </p>

                                    <button
                                        onClick={() => window.location.reload()}
                                        aria-label="Reload page to try again"
                                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/20 text-primary transition-colors hover:bg-primary/30 cursor-pointer">
                                        <span className="material-symbols-outlined" aria-hidden="true">refresh</span>
                                        <span>Try Again</span>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </main>
            </div>

            {/* Date Picker Modal */}
            <div 
                id="date-modal"
                className={`${isModalOpen ? '' : 'hidden'} fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm`}
                onClick={handleModalBackdropClick}>
                <div className="relative w-full max-w-md p-8 mx-4 rounded-xl bg-background-dark border border-white/10">
                    <button
                        onClick={closeModal}
                        aria-label="Close date picker modal"
                        className="absolute top-4 right-4 flex h-10 w-10 items-center justify-center rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors">
                        <span className="material-symbols-outlined" aria-hidden="true">close</span>
                    </button>

                    <h2 className="text-xl sm:text-2xl font-bold font-heading text-white mb-6">Select a Date</h2>

                    <div className="space-y-4">
                        <label htmlFor="date-input" className="block text-sm font-medium text-white/80">
                            Choose any date from June 16, 1995 to today
                        </label>
                        <input
                            type="date"
                            id="date-input"
                            min="1995-06-16"
                            max={new Date().toISOString().split('T')[0]}
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            onKeyPress={handleDateInputKeyPress}
                            className="w-full px-4 py-3 rounded-lg bg-background-light/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-primary"
                        />

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={closeModal}
                                className="flex-1 px-4 py-3 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors">
                                Cancel
                            </button>
                            <button
                                onClick={() => fetchAPOD(selectedDate)}
                                className="flex-1 px-4 py-3 rounded-lg bg-primary text-white hover:bg-primary/80 transition-colors font-medium">
                                View APOD
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Favorites Modal */}
            <div 
                id="favorites-modal"
                className={`${isFavoritesModalOpen ? '' : 'hidden'} fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4`}
                onClick={handleFavoritesBackdropClick}>
                <div className="relative w-full max-w-6xl h-[90vh] max-h-[90vh] p-6 md:p-8 rounded-xl bg-background-dark border border-white/10 overflow-hidden flex flex-col">
                    <button
                        onClick={closeFavoritesModal}
                        aria-label="Close favorites modal"
                        className="absolute top-4 right-4 flex h-10 w-10 items-center justify-center rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors z-10">
                        <span className="material-symbols-outlined" aria-hidden="true">close</span>
                    </button>

                    <div className="mb-6 flex-shrink-0">
                        <h2 className="text-2xl md:text-3xl font-bold font-heading text-white flex items-center gap-3">
                            <span className="material-symbols-outlined text-primary" style={{ fontSize: '2rem' }}>bookmarks</span>
                            Your Favorite APODs
                        </h2>
                        <p id="favorites-count" className="text-white/60 mt-2">
                            {favoritesArray.length} favorite{favoritesArray.length !== 1 ? 's' : ''} saved
                        </p>
                    </div>

                    {favoritesArray.length === 0 ? (
                        <div id="favorites-empty" className="flex-1 flex flex-col items-center justify-center text-center py-12">
                            <span className="material-symbols-outlined text-white/20" style={{ fontSize: '5rem' }}>bookmark_border</span>
                            <h3 className="text-xl font-bold text-white mt-4">No Favorites Yet</h3>
                            <p className="text-white/60 mt-2 max-w-md">Start exploring APODs and click the star button to save your favorites!</p>
                        </div>
                    ) : (
                        <div 
                            id="favorites-grid" 
                            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto flex-1 min-h-0 pr-2"
                            style={{
                                scrollbarWidth: 'thin',
                                scrollbarColor: 'rgba(32, 138, 243, 0.5) rgba(255, 255, 255, 0.1)'
                            }}>
                            {favoritesArray.map((apod) => {
                                const isVideo = apod.media_type === 'video';
                                const thumbnailUrl = isVideo ? `https://img.youtube.com/vi/${getYouTubeId(apod.url)}/maxresdefault.jpg` : apod.url;

                                return (
                                    <div
                                        key={apod.date}
                                        className="relative group cursor-pointer rounded-lg overflow-hidden bg-white/5 hover:bg-white/10 transition-all border border-white/10 hover:border-primary/50"
                                        onClick={() => loadFavoriteApod(apod.date)}>
                                        <div className="aspect-video relative overflow-hidden">
                                            <img
                                                src={thumbnailUrl}
                                                alt={apod.title}
                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                                loading="lazy"
                                                onError={(e) => {
                                                    e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 300'%3E%3Crect fill='%231a1a1a' width='400' height='300'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%23666' font-size='20'%3ENo Image%3C/text%3E%3C/svg%3E";
                                                }}
                                            />

                                            {isVideo && (
                                                <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                                                    <span className="material-symbols-outlined text-white" style={{ fontSize: '3rem' }}>play_circle</span>
                                                </div>
                                            )}
                                        </div>

                                        <div className="p-3">
                                            <h3 className="font-bold text-white text-sm line-clamp-2 mb-1">{apod.title}</h3>
                                            <p className="text-xs text-white/60">{apod.date}</p>
                                        </div>

                                        <button
                                            onClick={(e) => { e.stopPropagation(); removeFavorite(apod.date); }}
                                            className="absolute top-2 right-2 flex h-8 w-8 items-center justify-center rounded-full bg-red-500/80 hover:bg-red-500 transition-colors opacity-0 group-hover:opacity-100"
                            aria-label="Remove from favorites">
                                            <span className="material-symbols-outlined text-white text-sm">delete</span>
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Custom scrollbar styles */}
            <style jsx>{`
                #favorites-grid::-webkit-scrollbar {
                    width: 8px;
                }
                
                #favorites-grid::-webkit-scrollbar-track {
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: 4px;
                }
                
                #favorites-grid::-webkit-scrollbar-thumb {
                    background: rgba(32, 138, 243, 0.5);
                    border-radius: 4px;
                }
                
                #favorites-grid::-webkit-scrollbar-thumb:hover {
                    background: rgba(32, 138, 243, 0.7);
                }
            `}</style>
        </div>
    );
}
