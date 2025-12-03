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
    apodExplanation: document.getElementById('apod-explanation')    // APOD description paragraph
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
    const focusModeTrigger = document.getElementById('focus-mode-trigger');
    
    if (header && contentCard && focusModeTrigger) {
        if (state.isFocusMode) {
            // Focus mode: hide UI elements for immersive view
            header.style.opacity = '0';
            header.style.pointerEvents = 'none';  // Disable clicks
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
            contentCard.style.visibility = 'visible';
            
            // Force a reflow then fade in
            setTimeout(() => {
                header.style.opacity = '1';
                header.style.pointerEvents = 'auto';  // Enable clicks
                contentCard.style.opacity = '1';
                contentCard.style.pointerEvents = 'auto';
            }, 10);
        }
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
    
    // FOCUS MODE TOGGLE
    // Click ONLY on the background (not on cards, text, or buttons) to toggle immersive focus mode
    const focusModeTrigger = document.getElementById('focus-mode-trigger');
    
    if (focusModeTrigger) {
        focusModeTrigger.addEventListener('click', (e) => {
            // Only toggle if modal is not open
            if (!state.isModalOpen) {
                // Toggle focus mode state
                // This will hide/show header and content card for immersive viewing
                setState({ isFocusMode: !state.isFocusMode });
            }
        });
    }
}

// ========== INITIALIZATION ==========
// This code runs when the script loads and sets everything up

function init() {
    // Set up all event listeners (button clicks, keyboard shortcuts, etc.)
    initEventListeners();
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
