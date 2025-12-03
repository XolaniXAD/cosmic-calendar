// ========== STATE MANAGEMENT ==========
// This is the single source of truth for our app's UI state
// Similar to React's state management, but using vanilla JavaScript

const state = {
    selectedDate: null,      // Stores the currently selected date (YYYY-MM-DD format)
    isLoading: false,        // True when fetching data from API
    isModalOpen: false,      // True when date picker modal is visible
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

async function fetchAPOD(date) {
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
}

// ========== INITIALIZATION ==========
// This code runs when the script loads and sets everything up

function init() {
    // Log to console so we know the script loaded successfully
    console.log('🚀 APOD Viewer initialized');
    
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
