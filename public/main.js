// NASA APOD Viewer - Client-side JavaScript

// ========== UTILITY FUNCTIONS ==========

function debounce(func, delay) {
    let timeoutId;
    return function(...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
}

function parseDate(dateString) {
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day);
}

function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function addDays(dateString, days) {
    const date = parseDate(dateString);
    date.setDate(date.getDate() + days);
    return formatDate(date);
}

function isValidApodDate(dateString) {
    const minDate = new Date(1995, 5, 16);
    const maxDate = new Date();
    const checkDate = parseDate(dateString);
    return checkDate >= minDate && checkDate <= maxDate;
}

// ========== STATE MANAGEMENT ==========

const state = {
    selectedDate: null,
    isLoading: false,
    isModalOpen: false,
    isFocusMode: false,
    error: null,
    currentApod: null
};

function setState(updates) {
    Object.assign(state, updates);
    updateUI();
}

// ========== DOM ELEMENTS ==========

const elements = {
    calendarBtn: document.getElementById('calendar-btn'),
    modal: document.getElementById('date-modal'),
    modalCloseBtn: document.getElementById('modal-close-btn'),
    modalCancelBtn: document.getElementById('modal-cancel-btn'),
    modalSelectBtn: document.getElementById('modal-select-btn'),
    dateInput: document.getElementById('date-input'),
    loadingSpinner: document.getElementById('loading-spinner'),
    mediaContainer: document.getElementById('media-container'),
    apodTitle: document.getElementById('apod-title'),
    apodDate: document.getElementById('apod-date'),
    apodExplanation: document.getElementById('apod-explanation')
};

// ========== MODAL FUNCTIONS ==========

function openModal() {
    setState({ isModalOpen: true });
    if (!elements.dateInput.value) {
        elements.dateInput.value = new Date().toISOString().split('T')[0];
    }
}

function closeModal() {
    setState({ isModalOpen: false });
}

function openFavoritesModal() {
    const modal = document.getElementById('favorites-modal');
    if (modal) {
        modal.classList.remove('hidden');
        renderFavorites();
    }
}

function closeFavoritesModal() {
    const modal = document.getElementById('favorites-modal');
    if (modal) modal.classList.add('hidden');
}

function renderFavorites() {
    const favorites = getFavorites();
    const favoritesArray = Object.values(favorites);
    const grid = document.getElementById('favorites-grid');
    const empty = document.getElementById('favorites-empty');
    const count = document.getElementById('favorites-count');
    
    if (!grid || !empty || !count) return;
    
    const favCount = favoritesArray.length;
    count.textContent = `${favCount} favorite${favCount !== 1 ? 's' : ''} saved`;
    
    if (favCount === 0) {
        grid.classList.add('hidden');
        empty.classList.remove('hidden', 'flex');
        empty.classList.add('flex');
        return;
    }
    
    empty.classList.add('hidden');
    empty.classList.remove('flex');
    grid.classList.remove('hidden');
    
    favoritesArray.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    grid.innerHTML = favoritesArray
        .filter(apod => apod && typeof apod === 'object' && apod.date && apod.title && apod.url)
        .map(apod => {
            const isVideo = apod.media_type === 'video';
            const thumbnailUrl = isVideo ? `https://img.youtube.com/vi/${getYouTubeId(apod.url)}/maxresdefault.jpg` : apod.url;
            
            return `
                <div class="relative group cursor-pointer rounded-lg overflow-hidden bg-white/5 hover:bg-white/10 transition-all border border-white/10 hover:border-primary/50"
                     data-apod-date="${apod.date}">
                    <!-- Thumbnail -->
                    <div class="aspect-video relative overflow-hidden">
                        <img src="${thumbnailUrl}" 
                             alt="${apod.title}"
                             class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                             loading="lazy"
                             onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 400 300%22%3E%3Crect fill=%22%231a1a1a%22 width=%22400%22 height=%22300%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 dominant-baseline=%22middle%22 text-anchor=%22middle%22 fill=%22%23666%22 font-size=%2220%22%3ENo Image%3C/text%3E%3C/svg%3E'">
                        
                        ${isVideo ? `
                            <div class="absolute inset-0 flex items-center justify-center bg-black/30">
                                <span class="material-symbols-outlined text-white" style="font-size: 3rem;">play_circle</span>
                            </div>
                        ` : ''}
                    </div>
                    
                    <!-- Info -->
                    <div class="p-3">
                        <h3 class="font-bold text-white text-sm line-clamp-2 mb-1">${apod.title}</h3>
                        <p class="text-xs text-white/60">${apod.date}</p>
                    </div>
                    
                    <!-- Remove button -->
                    <button 
                        class="favorite-remove-btn absolute top-2 right-2 flex h-8 w-8 items-center justify-center rounded-full bg-red-500/80 hover:bg-red-500 transition-colors opacity-0 group-hover:opacity-100"
                        data-remove-date="${apod.date}"
                        aria-label="Remove from favorites">
                        <span class="material-symbols-outlined text-white text-sm">delete</span>
                    </button>
                </div>
            `;
        }).join('');
    
    grid.querySelectorAll('[data-apod-date]').forEach(item => {
        item.addEventListener('click', (e) => {
            if (!e.target.closest('.favorite-remove-btn')) {
                loadFavoriteApod(item.getAttribute('data-apod-date'));
            }
        });
    });
    
    grid.querySelectorAll('.favorite-remove-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            removeFavorite(btn.getAttribute('data-remove-date'));
        });
    });
}

function getYouTubeId(url) {
    const match = url.match(/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/);
    return (match && match[2].length === 11) ? match[2] : '';
}

function loadFavoriteApod(date) {
    if (!date) {
        alert('Error: No date specified');
        return;
    }
    closeFavoritesModal();
    fetchAPOD(date);
}

function removeFavorite(date) {
    const favorites = getFavorites();
    delete favorites[date];
    saveFavorites(favorites);
    renderFavorites();
    updateFavoriteButton();
}

// ========== APOD FETCHING ==========

async function fetchAPODInternal(date) {
    setState({ isLoading: true, error: null });
    
    try {
        const url = date ? `/api/apod?date=${date}` : '/api/apod';
        const response = await axios.get(url);
        const apodData = response.data;
        
        setState({ 
            isLoading: false,
            currentApod: apodData,
            selectedDate: date
        });
        
        updateAPODContent(apodData);
        updateFavoriteButton();
        closeModal();
        
    } catch (error) {
        console.error('Error fetching APOD:', error);
        
        const errorMessage = error.response?.data?.error || 
                           error.response ? `Error: ${error.response.status}` :
                           error.request ? 'No response from server. Check your connection.' :
                           'Failed to fetch APOD data.';
        
        setState({ isLoading: false, error: errorMessage });
        alert(errorMessage);
    }
}

const fetchAPOD = debounce(fetchAPODInternal, 300);

// ========== UPDATE DOM ==========

function updateAPODContent(apod) {
    if (elements.apodTitle) elements.apodTitle.textContent = apod.title;
    if (elements.apodDate) elements.apodDate.textContent = apod.date;
    if (elements.apodExplanation) elements.apodExplanation.textContent = apod.explanation;
    
    if (elements.mediaContainer) {
        if (apod.media_type === 'image') {
            elements.mediaContainer.innerHTML = `
                <div class="absolute inset-0 bg-center bg-no-repeat bg-cover"
                     data-alt="${apod.title}"
                     style='background-image: url("${apod.url}");'>
                </div>`;
        } else if (apod.media_type === 'video') {
            elements.mediaContainer.innerHTML = `
                <div class="absolute inset-0 overflow-hidden">
                    <iframe
                        class="absolute top-1/2 left-1/2 w-[177.77vh] h-[56.25vw] min-h-screen min-w-full -translate-x-1/2 -translate-y-1/2"
                        src="${apod.url}"
                        title="${apod.title}"
                        frameborder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowfullscreen>
                    </iframe>
                </div>`;
        }
    }
    updateFavoriteButton();
}

function updateUI() {
    const toggleVisibility = (element, show) => {
        if (!element) return;
        element.classList.toggle('hidden', !show);
    };
    
    toggleVisibility(elements.modal, state.isModalOpen);
    toggleVisibility(elements.loadingSpinner, state.isLoading);
    
    const skeletonLoading = document.getElementById('skeleton-loading');
    const apodContent = document.getElementById('apod-content');
    toggleVisibility(skeletonLoading, state.isLoading);
    toggleVisibility(apodContent, !state.isLoading);
    
    const header = document.getElementById('header');
    const contentCard = document.getElementById('content-card');
    
    if (header && contentCard) {
        const setUIVisibility = (visible) => {
            [header, contentCard].forEach(el => {
                el.style.opacity = visible ? '1' : '0';
                el.style.pointerEvents = visible ? '' : 'none';
                el.style.visibility = visible ? 'visible' : 'hidden';
            });
        };
        
        if (state.isFocusMode) {
            setUIVisibility(false);
        } else {
            setTimeout(() => setUIVisibility(true), 10);
        }
    }
}

// ========== FEATURE FUNCTIONS ==========

async function shareAPOD() {
    if (!state.currentApod) {
        alert('No APOD data available to share');
        return;
    }
    
    const shareData = {
        title: `NASA APOD: ${state.currentApod.title}`,
        text: `Check out this amazing astronomy picture from ${state.currentApod.date}!`,
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
}

function downloadAPOD() {
    if (!state.currentApod) {
        alert('No APOD data available to download');
        return;
    }
    
    if (state.currentApod.media_type === 'video') {
        window.open(state.currentApod.url, '_blank');
        return;
    }
    
    try {
        const link = document.createElement('a');
        link.href = state.currentApod.url;
        link.download = `nasa-apod-${state.currentApod.date}.jpg`;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    } catch (error) {
        console.error('Error downloading:', error);
        alert('Failed to download. Opening in new tab instead.');
        window.open(state.currentApod.url, '_blank');
    }
}

function getFavorites() {
    const favorites = localStorage.getItem('apod-favorites');
    if (!favorites) return {};
    
    const parsed = JSON.parse(favorites);
    if (Array.isArray(parsed)) {
        localStorage.removeItem('apod-favorites');
        return {};
    }
    return parsed;
}

function saveFavorites(favorites) {
    localStorage.setItem('apod-favorites', JSON.stringify(favorites));
}

function isFavorite(date) {
    return getFavorites().hasOwnProperty(date);
}

function toggleFavorite() {
    if (!state.currentApod) {
        alert('No APOD data available to favorite');
        return;
    }
    
    const date = state.currentApod.date;
    const favorites = getFavorites();
    
    if (favorites[date]) {
        delete favorites[date];
    } else {
        favorites[date] = {
            title: state.currentApod.title,
            date: state.currentApod.date,
            url: state.currentApod.url,
            media_type: state.currentApod.media_type,
            explanation: state.currentApod.explanation,
            copyright: state.currentApod.copyright || null
        };
    }
    
    saveFavorites(favorites);
    updateFavoriteButton();
}

function updateFavoriteButton() {
    if (!state.currentApod) return;
    
    const favoriteIcon = document.getElementById('favorite-icon');
    const favoriteBtn = document.getElementById('favorite-btn');
    
    if (!favoriteIcon || !favoriteBtn) return;
    
    const isFav = isFavorite(state.currentApod.date);
    favoriteIcon.style.fontVariationSettings = isFav ? "'FILL' 1" : "'FILL' 0";
    favoriteBtn.setAttribute('aria-label', isFav ? 'Remove from favorites' : 'Add to favorites');
}

function navigateAPOD(direction) {
    if (!state.currentApod) {
        alert('No APOD data available');
        return;
    }
    
    const newDate = addDays(state.currentApod.date, direction);
    
    if (isValidApodDate(newDate)) {
        fetchAPOD(newDate);
    } else {
        alert(direction > 0 ? 'No APOD available for future dates' : 'No APOD available before June 16, 1995');
    }
}

// ========== EVENT LISTENERS ==========

function initEventListeners() {
    const addClickHandler = (id, handler) => {
        const element = document.getElementById(id);
        if (element) element.addEventListener('click', handler);
    };
    
    addClickHandler('calendar-btn', openModal);
    addClickHandler('favorites-btn', openFavoritesModal);
    addClickHandler('favorites-modal-close-btn', closeFavoritesModal);
    addClickHandler('modal-close-btn', closeModal);
    addClickHandler('modal-cancel-btn', closeModal);
    
    const favoritesModal = document.getElementById('favorites-modal');
    if (favoritesModal) {
        favoritesModal.addEventListener('click', (e) => {
            if (e.target === favoritesModal) closeFavoritesModal();
        });
    }
    
    if (elements.modal) {
        elements.modal.addEventListener('click', (e) => {
            if (e.target === elements.modal) closeModal();
        });
    }
    
    if (elements.modalSelectBtn) {
        elements.modalSelectBtn.addEventListener('click', () => {
            const selectedDate = elements.dateInput.value;
            if (selectedDate) {
                fetchAPOD(selectedDate);
            } else {
                alert('Please select a date');
            }
        });
    }
    
    if (elements.dateInput) {
        elements.dateInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') elements.modalSelectBtn.click();
        });
    }
    
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && state.isModalOpen) closeModal();
    });
    
    const actionButtons = {
        'share-btn': shareAPOD,
        'download-btn': downloadAPOD,
        'favorite-btn': toggleFavorite,
        'prev-btn': () => navigateAPOD(-1),
        'next-btn': () => navigateAPOD(1)
    };
    
    Object.entries(actionButtons).forEach(([id, handler]) => {
        const btn = document.getElementById(id);
        if (btn) {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                handler();
            });
        }
    });
    
    const foregroundLayer = document.getElementById('foreground-layer');
    if (foregroundLayer) {
        foregroundLayer.addEventListener('click', (e) => {
            if (state.isModalOpen) return;
            const isInteractive = e.target.closest('button, a, input, textarea, select, #content-card, #date-modal, #favorites-modal');
            if (!isInteractive) setState({ isFocusMode: !state.isFocusMode });
        });
    }
}

function init() {
    if (window.initialApodData) {
        state.currentApod = window.initialApodData;
        state.selectedDate = window.initialApodData.date;
    }
    
    initEventListeners();
    setTimeout(() => updateFavoriteButton(), 100);
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
