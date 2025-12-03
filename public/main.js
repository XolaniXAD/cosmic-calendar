// NASA APOD Viewer - Client-side JavaScript
// Version 3.0 - With Favorites Feature

// ========== UTILITY FUNCTIONS ==========
// Debounce prevents a function from being called too frequently
// Useful for rate limiting API calls during rapid user interactions
function debounce(func, delay) {
    let timeoutId;
    return function(...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
}

// Date utility functions for navigation
function parseDate(dateString) {
    // Parse YYYY-MM-DD string to Date object
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day);
}

function formatDate(date) {
    // Format Date object to YYYY-MM-DD string
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function addDays(dateString, days) {
    // Add/subtract days from a date string
    const date = parseDate(dateString);
    date.setDate(date.getDate() + days);
    return formatDate(date);
}

function isValidApodDate(dateString) {
    // Check if date is within valid APOD range
    const minDate = new Date(1995, 5, 16); // June 16, 1995
    const maxDate = new Date(); // Today
    const checkDate = parseDate(dateString);
    return checkDate >= minDate && checkDate <= maxDate;
}

// ========== STATE MANAGEMENT ==========
// This is the single source of truth for our app's UI state
// Similar to React's state management, but using vanilla JavaScript

const state = {
    selectedDate: null,      // Stores the currently selected date (YYYY-MM-DD format)
    isLoading: false,        // True when fetching data from API
    isModalOpen: false,      // True when date picker modal is visible
    isFocusMode: false,      // True when UI is hidden for immersive viewing
    error: null,             // Stores error messages if something goes wrong
    currentApod: null        // Stores the currently displayed APOD data object
};

// setState is our central function for updating state
// It takes an object of updates, merges them into state, and triggers a UI update
// This ensures UI always reflects the current state
function setState(updates) {
    Object.assign(state, updates);  // Merge updates into existing state
    updateUI();                      // Re-render UI based on new state
}

// ========== DOM ELEMENTS ==========
// Cache all DOM elements we'll need to manipulate
// This is more efficient than calling getElementById repeatedly
// Also makes our code more maintainable - all selectors in one place

const elements = {
    // Calendar functionality
    calendarBtn: document.getElementById('calendar-btn'),           // Button that opens date picker
    modal: document.getElementById('date-modal'),                   // The modal overlay
    modalCloseBtn: document.getElementById('modal-close-btn'),      // X button in modal
    modalCancelBtn: document.getElementById('modal-cancel-btn'),    // Cancel button in modal
    modalSelectBtn: document.getElementById('modal-select-btn'),    // "View APOD" button
    dateInput: document.getElementById('date-input'),               // Date input field
    
    // UI feedback
    loadingSpinner: document.getElementById('loading-spinner'),     // Loading animation
    
    // APOD content elements that we'll update dynamically
    mediaContainer: document.getElementById('media-container'),     // Container for image/video
    apodTitle: document.getElementById('apod-title'),               // APOD title heading
    apodDate: document.getElementById('apod-date'),                 // APOD date heading
    apodExplanation: document.getElementById('apod-explanation'),   // APOD description paragraph
    
    // Action buttons
    shareBtn: document.getElementById('share-btn'),                 // Share button
    downloadBtn: document.getElementById('download-btn'),           // Download button
    favoriteBtn: document.getElementById('favorite-btn'),           // Favorite button
    favoriteIcon: document.getElementById('favorite-icon'),         // Favorite icon (star)
    
    // Navigation buttons
    prevBtn: document.getElementById('prev-btn'),                   // Previous APOD button
    nextBtn: document.getElementById('next-btn')                    // Next APOD button
};

// ========== MODAL FUNCTIONS ==========
// These functions control the date picker modal visibility

function openModal() {
    // Update state to show the modal
    setState({ isModalOpen: true });
    
    // Set default date to today if user hasn't selected anything yet
    // toISOString() gives us "2025-12-03T12:34:56.789Z"
    // split('T')[0] extracts just "2025-12-03" which is what date input needs
    if (!elements.dateInput.value) {
        elements.dateInput.value = new Date().toISOString().split('T')[0];
    }
}

function closeModal() {
    // Update state to hide the modal
    // setState will automatically trigger updateUI() which hides the modal
    setState({ isModalOpen: false });
}

// ========== FAVORITES MODAL FUNCTIONS ==========

function openFavoritesModal() {
    const modal = document.getElementById('favorites-modal');
    if (modal) {
        modal.classList.remove('hidden');
        renderFavorites();
    }
}

function closeFavoritesModal() {
    const modal = document.getElementById('favorites-modal');
    if (modal) {
        modal.classList.add('hidden');
    }
}

function renderFavorites() {
    const favorites = getFavorites();
    const favoritesArray = Object.values(favorites);
    const grid = document.getElementById('favorites-grid');
    const empty = document.getElementById('favorites-empty');
    const count = document.getElementById('favorites-count');
    
    if (!grid || !empty || !count) return;
    
    // Update count
    const favCount = favoritesArray.length;
    count.textContent = `${favCount} favorite${favCount !== 1 ? 's' : ''} saved`;
    
    // Show empty state or grid
    if (favCount === 0) {
        grid.classList.add('hidden');
        empty.classList.remove('hidden');
        empty.classList.add('flex');
        return;
    }
    
    empty.classList.add('hidden');
    empty.classList.remove('flex');
    grid.classList.remove('hidden');
    
    // Sort by date (newest first)
    favoritesArray.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // Render favorites
    grid.innerHTML = favoritesArray.map(apod => {
        const isVideo = apod.media_type === 'video';
        const thumbnailUrl = isVideo ? `https://img.youtube.com/vi/${getYouTubeId(apod.url)}/maxresdefault.jpg` : apod.url;
        
        return `
            <div class="relative group cursor-pointer rounded-lg overflow-hidden bg-white/5 hover:bg-white/10 transition-all border border-white/10 hover:border-primary/50"
                 onclick="loadFavoriteApod('${apod.date}')">
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
                    onclick="event.stopPropagation(); removeFavorite('${apod.date}')"
                    class="absolute top-2 right-2 flex h-8 w-8 items-center justify-center rounded-full bg-red-500/80 hover:bg-red-500 transition-colors opacity-0 group-hover:opacity-100"
                    aria-label="Remove from favorites">
                    <span class="material-symbols-outlined text-white text-sm">delete</span>
                </button>
            </div>
        `;
    }).join('');
}

function getYouTubeId(url) {
    // Extract YouTube video ID from URL
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : '';
}

function loadFavoriteApod(date) {
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
// This is the core function that fetches APOD data from our API
// It's async because we're making a network request
// Note: This is the internal function - wrapped in debounce below

async function fetchAPODInternal(date) {
    // Show loading spinner and clear any previous errors
    setState({ isLoading: true, error: null });
    
    try {
        // Build the API URL
        // If date is provided: /api/apod?date=2024-12-01
        // If no date: /api/apod (gets today's APOD)
        const url = date ? `/api/apod?date=${date}` : '/api/apod';
        
        // Make GET request to our Express API using Axios
        // Axios returns a promise, so we use 'await' to wait for the response
        const response = await axios.get(url);
        const apodData = response.data;  // Extract the JSON data from response
        
        // Success! Update state with the new data
        setState({ 
            isLoading: false,        // Hide loading spinner
            currentApod: apodData,   // Store the APOD data
            selectedDate: date       // Remember which date we're showing
        });
        
        // Update the DOM with the new APOD content
        updateAPODContent(apodData);
        
        // Close the date picker modal
        closeModal();
        
    } catch (error) {
        // Something went wrong - log it for debugging
        console.error('Error fetching APOD:', error);
        
        // Create a user-friendly error message
        let errorMessage = 'Failed to fetch APOD data.';
        
        // Check what type of error occurred
        if (error.response) {
            // Server responded with an error status (4xx or 5xx)
            // Try to get error message from server, or show status code
            errorMessage = error.response.data?.error || `Error: ${error.response.status}`;
        } else if (error.request) {
            // Request was made but no response received (network issue)
            errorMessage = 'No response from server. Check your connection.';
        }
        // else: Error in setting up the request (rare)
        
        // Update state with error and hide loading spinner
        setState({ 
            isLoading: false, 
            error: errorMessage 
        });
        
        // Show error to user
        alert(errorMessage);
    }
}

// Create debounced version to prevent rapid API calls (300ms delay)
const fetchAPOD = debounce(fetchAPODInternal, 300);

// ========== UPDATE DOM ==========
// These functions handle updating the visual elements on the page

function updateAPODContent(apod) {
    // This function updates all APOD-related content in the DOM
    // It's called after successfully fetching new APOD data
    
    // Update text content - using textContent (not innerHTML) for security
    // textContent automatically escapes HTML, preventing XSS attacks
    if (elements.apodTitle) {
        elements.apodTitle.textContent = apod.title;
    }
    if (elements.apodDate) {
        elements.apodDate.textContent = apod.date;
    }
    if (elements.apodExplanation) {
        elements.apodExplanation.textContent = apod.explanation;
    }
    
    // Update media (background image or video)
    if (elements.mediaContainer) {
        // Check the media type from API response
        if (apod.media_type === 'image') {
            // For images: use CSS background-image
            // This allows the image to cover the entire viewport beautifully
            elements.mediaContainer.innerHTML = `
                <div
                    class="absolute inset-0 bg-center bg-no-repeat bg-cover"
                    data-alt="${apod.title}"
                    style='background-image: url("${apod.url}");'>
                </div>
            `;
        } else if (apod.media_type === 'video') {
            // For videos: use iframe (usually YouTube embeds)
            // The complex sizing ensures video fills viewport like a background
            // w-[177.77vh] and h-[56.25vw] maintain 16:9 aspect ratio
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
                </div>
            `;
        }
    }
    
    // Update favorite button icon after content changes
    updateFavoriteButton();
}

function updateUI() {
    // This function is called by setState() to sync the UI with the current state
    // It handles showing/hiding elements based on state values
    
    // Toggle modal visibility based on state.isModalOpen
    if (elements.modal) {
        if (state.isModalOpen) {
            elements.modal.classList.remove('hidden');  // Show modal
        } else {
            elements.modal.classList.add('hidden');     // Hide modal
        }
    }
    
    // Toggle loading spinner based on state.isLoading
    if (elements.loadingSpinner) {
        if (state.isLoading) {
            elements.loadingSpinner.classList.remove('hidden');  // Show spinner
        } else {
            elements.loadingSpinner.classList.add('hidden');     // Hide spinner
        }
    }
    
    // Toggle skeleton loading in content card
    const skeletonLoading = document.getElementById('skeleton-loading');
    const apodContent = document.getElementById('apod-content');
    
    if (skeletonLoading && apodContent) {
        if (state.isLoading) {
            // Show skeleton, hide content
            skeletonLoading.classList.remove('hidden');
            apodContent.classList.add('hidden');
        } else {
            // Hide skeleton, show content
            skeletonLoading.classList.add('hidden');
            apodContent.classList.remove('hidden');
        }
    }
    
    // Toggle focus mode - hide/show UI elements
    const header = document.getElementById('header');
    const contentCard = document.getElementById('content-card');
    
    if (header && contentCard) {
        if (state.isFocusMode) {
            // Focus mode: hide UI elements for immersive view
            header.style.opacity = '0';
            header.style.pointerEvents = 'none';
            contentCard.style.opacity = '0';
            contentCard.style.pointerEvents = 'none';
            
            // After transition completes, fully hide elements
            setTimeout(() => {
                if (state.isFocusMode) {
                    header.style.visibility = 'hidden';
                    contentCard.style.visibility = 'hidden';
                }
            }, 300);
        } else {
            // Normal mode: show UI elements
            header.style.visibility = 'visible';
            header.style.pointerEvents = '';
            contentCard.style.visibility = 'visible';
            contentCard.style.pointerEvents = '';
            
            // Force a reflow then fade in
            setTimeout(() => {
                header.style.opacity = '1';
                contentCard.style.opacity = '1';
            }, 10);
        }
    }
}

// ========== FEATURE FUNCTIONS ==========

// Share current APOD using Web Share API
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
            // Use native share if available (mobile/modern browsers)
            await navigator.share(shareData);
        } else {
            // Fallback: copy to clipboard
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

// Download current APOD image
function downloadAPOD() {
    if (!state.currentApod) {
        alert('No APOD data available to download');
        return;
    }
    
    if (state.currentApod.media_type === 'video') {
        // Videos can't be downloaded directly, open in new tab
        window.open(state.currentApod.url, '_blank');
        return;
    }
    
    try {
        // Create temporary anchor element to trigger download
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

// Favorites management using localStorage
function getFavorites() {
    const favorites = localStorage.getItem('apod-favorites');
    return favorites ? JSON.parse(favorites) : {};
}

function saveFavorites(favorites) {
    localStorage.setItem('apod-favorites', JSON.stringify(favorites));
}

function isFavorite(date) {
    const favorites = getFavorites();
    return favorites.hasOwnProperty(date);
}

function toggleFavorite() {
    if (!state.currentApod) {
        alert('No APOD data available to favorite');
        return;
    }
    
    const date = state.currentApod.date;
    const favorites = getFavorites();
    
    if (favorites[date]) {
        // Remove from favorites
        delete favorites[date];
    } else {
        // Add to favorites - store full APOD data
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
    
    // Query dynamically since icon is in conditional content
    const favoriteIcon = document.getElementById('favorite-icon');
    const favoriteBtn = document.getElementById('favorite-btn');
    
    if (!favoriteIcon || !favoriteBtn) return;
    
    const date = state.currentApod.date;
    const isFav = isFavorite(date);
    
    // Update icon: filled star if favorite, outline star if not
    if (isFav) {
        favoriteIcon.textContent = 'star';
        favoriteIcon.style.fontVariationSettings = "'FILL' 1";
        favoriteBtn.setAttribute('aria-label', 'Remove from favorites');
    } else {
        favoriteIcon.textContent = 'star';
        favoriteIcon.style.fontVariationSettings = "'FILL' 0";
        favoriteBtn.setAttribute('aria-label', 'Add to favorites');
    }
}

// Navigate to previous/next APOD
function navigateAPOD(direction) {
    if (!state.currentApod) {
        alert('No APOD data available');
        return;
    }
    
    const currentDate = state.currentApod.date;
    const newDate = addDays(currentDate, direction); // +1 for next, -1 for prev
    
    if (isValidApodDate(newDate)) {
        fetchAPOD(newDate);
    } else {
        const message = direction > 0 
            ? 'No APOD available for future dates' 
            : 'No APOD available before June 16, 1995';
        alert(message);
    }
}

// ========== EVENT LISTENERS ==========
// This function sets up all user interaction handlers
// Called once when the page loads

function initEventListeners() {
    // OPEN MODAL
    // When user clicks the calendar button, show the date picker modal
    if (elements.calendarBtn) {
        elements.calendarBtn.addEventListener('click', openModal);
    }
    
    // OPEN FAVORITES MODAL
    const favoritesBtn = document.getElementById('favorites-btn');
    if (favoritesBtn) {
        favoritesBtn.addEventListener('click', openFavoritesModal);
    }
    
    // CLOSE FAVORITES MODAL
    const favoritesModalCloseBtn = document.getElementById('favorites-modal-close-btn');
    if (favoritesModalCloseBtn) {
        favoritesModalCloseBtn.addEventListener('click', closeFavoritesModal);
    }
    
    // Close favorites modal when clicking outside
    const favoritesModal = document.getElementById('favorites-modal');
    if (favoritesModal) {
        favoritesModal.addEventListener('click', (e) => {
            if (e.target === favoritesModal) {
                closeFavoritesModal();
            }
        });
    }
    
    // CLOSE MODAL - Multiple ways to close for better UX
    
    // Method 1: Click the X button in top-right corner
    if (elements.modalCloseBtn) {
        elements.modalCloseBtn.addEventListener('click', closeModal);
    }
    
    // Method 2: Click the "Cancel" button
    if (elements.modalCancelBtn) {
        elements.modalCancelBtn.addEventListener('click', closeModal);
    }
    
    // Method 3: Click outside the modal (on the dark overlay)
    // e.target is the element that was clicked
    // We only close if they clicked the overlay itself, not the modal content
    if (elements.modal) {
        elements.modal.addEventListener('click', (e) => {
            if (e.target === elements.modal) {
                closeModal();
            }
        });
    }
    
    // FETCH APOD
    // When user clicks "View APOD" button, fetch data for selected date
    if (elements.modalSelectBtn) {
        elements.modalSelectBtn.addEventListener('click', () => {
            // Get the date value from the input field
            const selectedDate = elements.dateInput.value;
            
            // Validate that a date was actually selected
            if (selectedDate) {
                fetchAPOD(selectedDate);  // Make API call with the date
            } else {
                alert('Please select a date');  // User feedback
            }
        });
    }
    
    // KEYBOARD SHORTCUT: Enter key
    // Allow users to press Enter to submit instead of clicking button
    if (elements.dateInput) {
        elements.dateInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                elements.modalSelectBtn.click();  // Trigger the button click
            }
        });
    }
    
    // KEYBOARD SHORTCUT: Escape key
    // Allow users to press Escape to close modal (common UX pattern)
    // This is a global listener, so we check if modal is actually open
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && state.isModalOpen) {
            closeModal();
        }
    });
    
    // ACTION BUTTONS
    // Use fresh queries since buttons might be dynamically rendered
    const shareBtn = document.getElementById('share-btn');
    const downloadBtn = document.getElementById('download-btn');
    const favoriteBtn = document.getElementById('favorite-btn');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    
    // Share button - uses Web Share API with clipboard fallback
    if (shareBtn) {
        shareBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            shareAPOD();
        });
    }
    
    // Download button - downloads image or opens video in new tab
    if (downloadBtn) {
        downloadBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            downloadAPOD();
        });
    }
    
    // Favorite button - toggles favorite status in localStorage
    if (favoriteBtn) {
        favoriteBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleFavorite();
        });
    }
    
    // NAVIGATION BUTTONS
    // Previous button - navigates to previous day's APOD
    if (prevBtn) {
        prevBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            navigateAPOD(-1);
        });
    }
    
    // Next button - navigates to next day's APOD
    if (nextBtn) {
        nextBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            navigateAPOD(1);
        });
    }
    
    // FOCUS MODE TOGGLE
    // Click on empty background areas (not on buttons, cards, or text) to toggle immersive focus mode
    const foregroundLayer = document.getElementById('foreground-layer');
    
    if (foregroundLayer) {
        foregroundLayer.addEventListener('click', (e) => {
            // Don't toggle if modal is open
            if (state.isModalOpen) return;
            
            // Get the clicked element
            const clickedElement = e.target;
            
            // Check if click is on an interactive element (buttons, links, inputs, cards)
            const isInteractive = clickedElement.closest('button, a, input, textarea, select, #content-card, #date-modal, #favorites-modal');
            
            // Only toggle focus mode if NOT clicking on interactive elements
            if (!isInteractive) {
                setState({ isFocusMode: !state.isFocusMode });
            }
        });
    }
}

// ========== INITIALIZATION ==========
// This code runs when the script loads and sets everything up

function init() {
    console.log('🚀 NASA APOD Viewer initialized');
    
    // Initialize state with server-rendered data if available
    if (window.initialApodData) {
        state.currentApod = window.initialApodData;
        state.selectedDate = window.initialApodData.date;
        console.log('✅ State initialized with APOD data:', {
            title: state.currentApod.title,
            date: state.currentApod.date,
            media_type: state.currentApod.media_type
        });
        // Update favorite button to reflect current state
        updateFavoriteButton();
    } else {
        console.error('❌ window.initialApodData is not available!');
        console.log('window.initialApodData:', window.initialApodData);
    }
    
    // Set up all event listeners (button clicks, keyboard shortcuts, etc.)
    initEventListeners();
    
    // Final state check
    console.log('📊 Current state.currentApod:', state.currentApod);
}

// Wait for DOM to be ready before initializing
// This prevents errors from trying to access elements that don't exist yet
if (document.readyState === 'loading') {
    // DOM is still loading, so wait for DOMContentLoaded event
    document.addEventListener('DOMContentLoaded', init);
} else {
    // DOM is already loaded (script was loaded with defer or at end of body)
    init();  // Initialize immediately
}
