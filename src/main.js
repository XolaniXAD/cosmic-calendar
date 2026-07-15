import axios from "axios";

const NASA_API_KEY = "DEMO_KEY";
const NASA_API_URL = "https://api.nasa.gov/planetary/apod";

// ========== UTILITY FUNCTIONS ==========

function debounce(func, delay) {
    let timeoutId;
    return function (...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
}

function parseDate(dateString) {
    const [year, month, day] = dateString.split("-").map(Number);
    return new Date(year, month - 1, day);
}

function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
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

function getRandomAPODDate() {
    const firstAPODDate = new Date("1995-06-16");
    const today = new Date();
    const randomTimestamp =
        firstAPODDate.getTime() +
        Math.random() * (today.getTime() - firstAPODDate.getTime());
    return new Date(randomTimestamp).toISOString().split("T")[0];
}

function getYouTubeId(url) {
    const match = url.match(
        /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/
    );
    return match && match[2].length === 11 ? match[2] : "";
}

// ========== STATE MANAGEMENT ==========

const state = {
    selectedDate: null,
    isLoading: false,
    isModalOpen: false,
    isFocusMode: false,
    error: null,
    currentApod: null,
};

function setState(updates) {
    Object.assign(state, updates);
    updateUI();
}

// ========== DOM ELEMENTS ==========

const elements = {
    calendarBtn: document.getElementById("calendar-btn"),
    modal: document.getElementById("date-modal"),
    modalCloseBtn: document.getElementById("modal-close-btn"),
    modalCancelBtn: document.getElementById("modal-cancel-btn"),
    modalSelectBtn: document.getElementById("modal-select-btn"),
    dateInput: document.getElementById("date-input"),
    loadingSpinner: document.getElementById("loading-spinner"),
    mediaContainer: document.getElementById("media-container"),
    apodTitle: document.getElementById("apod-title"),
    apodDate: document.getElementById("apod-date"),
    apodExplanation: document.getElementById("apod-explanation"),
    apodCopyright: document.getElementById("apod-copyright"),
    skeletonLoading: document.getElementById("skeleton-loading"),
    apodContent: document.getElementById("apod-content"),
    errorDisplay: document.getElementById("error-display"),
    errorMessage: document.getElementById("error-message"),
};

// ========== MODAL FUNCTIONS ==========

function openModal() {
    setState({ isModalOpen: true });
    if (!elements.dateInput.value) {
        elements.dateInput.value = new Date().toISOString().split("T")[0];
    }
}

function closeModal() {
    setState({ isModalOpen: false });
}

function openFavoritesModal() {
    const modal = document.getElementById("favorites-modal");
    if (modal) {
        modal.classList.add("visible");
        renderFavorites();
    }
}

function closeFavoritesModal() {
    const modal = document.getElementById("favorites-modal");
    if (modal) modal.classList.remove("visible");
}

function renderFavorites() {
    const favorites = getFavorites();
    const favoritesArray = Object.values(favorites);
    const grid = document.getElementById("favorites-grid");
    const empty = document.getElementById("favorites-empty");
    const count = document.getElementById("favorites-count");

    if (!grid || !empty || !count) return;

    const favCount = favoritesArray.length;
    count.textContent = `${favCount} favorite${favCount !== 1 ? "s" : ""} saved`;

    if (favCount === 0) {
        grid.classList.add("hidden");
        empty.classList.add("visible");
        return;
    }

    empty.classList.remove("visible");
    grid.classList.remove("hidden");

    favoritesArray.sort((a, b) => new Date(b.date) - new Date(a.date));

    grid.innerHTML = favoritesArray
        .filter(
            (apod) =>
                apod && typeof apod === "object" && apod.date && apod.title && apod.url
        )
        .map((apod) => {
            const isVideo = apod.media_type === "video";
            const thumbnailUrl = isVideo
                ? `https://img.youtube.com/vi/${getYouTubeId(apod.url)}/maxresdefault.jpg`
                : apod.url;

            return `
                <div class="fav-card" data-apod-date="${apod.date}">
                    <div class="fav-thumb">
                        <img src="${thumbnailUrl}" alt="${apod.title}" loading="lazy"
                             onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 400 300%22%3E%3Crect fill=%22%231a1a1a%22 width=%22400%22 height=%22300%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 dominant-baseline=%22middle%22 text-anchor=%22middle%22 fill=%22%23666%22 font-size=%2220%22%3ENo Image%3C/text%3E%3C/svg%3E'">
                        ${
                            isVideo
                                ? '<div class="fav-play-overlay"><span class="material-symbols-outlined">play_circle</span></div>'
                                : ""
                        }
                    </div>
                    <div class="fav-info">
                        <h3>${apod.title}</h3>
                        <p>${apod.date}</p>
                    </div>
                    <button class="fav-remove" data-remove-date="${apod.date}" aria-label="Remove from favorites">
                        <span class="material-symbols-outlined" style="font-size:0.875rem">delete</span>
                    </button>
                </div>
            `;
        })
        .join("");

    grid.querySelectorAll("[data-apod-date]").forEach((item) => {
        item.addEventListener("click", (e) => {
            if (!e.target.closest(".fav-remove")) {
                loadFavoriteApod(item.getAttribute("data-apod-date"));
            }
        });
    });

    grid.querySelectorAll(".fav-remove").forEach((btn) => {
        btn.addEventListener("click", (e) => {
            e.stopPropagation();
            removeFavorite(btn.getAttribute("data-remove-date"));
        });
    });
}

function loadFavoriteApod(date) {
    if (!date) return;
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
    showError(false);

    try {
        const params = { api_key: NASA_API_KEY };
        if (date) params.date = date;

        const response = await axios.get(NASA_API_URL, { params });
        const apodData = response.data;

        setState({
            isLoading: false,
            currentApod: apodData,
            selectedDate: date || apodData.date,
        });

        updateAPODContent(apodData);
        updateFavoriteButton();
        closeModal();
    } catch (error) {
        console.error("Error fetching APOD:", error);

        let errorMessage;
        if (error.response) {
            const status = error.response.status;
            if (status === 400) {
                errorMessage = "Invalid date format. Use YYYY-MM-DD";
            } else if (status === 401) {
                errorMessage = "Invalid API key";
            } else if (status === 429) {
                errorMessage =
                    "NASA API rate limit reached. Please try again later.";
            } else {
                errorMessage = `Error: ${status}`;
            }
        } else if (error.request) {
            errorMessage =
                "No response from NASA server. Check your connection.";
        } else {
            errorMessage = "Failed to fetch APOD data.";
        }

        setState({ isLoading: false, error: errorMessage });
        showError(true, errorMessage);
    }
}

const fetchAPOD = debounce(fetchAPODInternal, 300);

function showError(show, message) {
    if (show) {
        elements.apodContent.classList.add("hidden");
        elements.skeletonLoading.classList.remove("visible");
        elements.errorDisplay.classList.remove("hidden");
        if (message) elements.errorMessage.textContent = message;
    } else {
        elements.errorDisplay.classList.add("hidden");
    }
}

// ========== UPDATE DOM ==========

function updateAPODContent(apod) {
    elements.apodTitle.textContent = apod.title;
    elements.apodDate.textContent = apod.date;
    elements.apodExplanation.textContent = apod.explanation;

    if (elements.apodCopyright) {
        if (apod.copyright) {
            elements.apodCopyright.textContent = `Image Credit: \u00A9 ${apod.copyright}`;
        } else {
            elements.apodCopyright.textContent = "Image Credit: NASA";
        }
    }

    if (elements.mediaContainer) {
        if (apod.media_type === "image") {
            elements.mediaContainer.innerHTML = `
                <div class="bg-cover-layer" style='background-image: url("${apod.url}");'></div>`;
        } else if (apod.media_type === "video") {
            elements.mediaContainer.innerHTML = `
                <div style="position:absolute;inset:0;overflow:hidden">
                    <iframe
                        style="position:absolute;top:50%;left:50%;width:177.77vh;height:56.25vw;min-height:100vh;min-width:100%;transform:translate(-50%,-50%)"
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
    elements.modal.classList.toggle("visible", state.isModalOpen);
    elements.loadingSpinner.classList.toggle("visible", state.isLoading);

    elements.skeletonLoading.classList.toggle("visible", state.isLoading);
    elements.apodContent.classList.toggle("hidden", state.isLoading);

    const header = document.getElementById("header");
    const contentCard = document.getElementById("content-card");

    if (header && contentCard) {
        const setUIVisibility = (visible) => {
            [header, contentCard].forEach((el) => {
                el.style.opacity = visible ? "1" : "0";
                el.style.pointerEvents = visible ? "" : "none";
                el.style.visibility = visible ? "visible" : "hidden";
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
    if (!state.currentApod) return;

    const shareData = {
        title: `NASA APOD: ${state.currentApod.title}`,
        text: `Check out this amazing astronomy picture from ${state.currentApod.date}!`,
        url: window.location.href,
    };

    try {
        if (navigator.share) {
            await navigator.share(shareData);
        } else {
            await navigator.clipboard.writeText(
                `${shareData.title}\n${shareData.text}\n${shareData.url}`
            );
            alert("Link copied to clipboard!");
        }
    } catch (error) {
        if (error.name !== "AbortError") {
            console.error("Error sharing:", error);
        }
    }
}

function downloadAPOD() {
    if (!state.currentApod) return;

    if (state.currentApod.media_type === "video") {
        window.open(state.currentApod.url, "_blank");
        return;
    }

    try {
        const link = document.createElement("a");
        link.href = state.currentApod.url;
        link.download = `nasa-apod-${state.currentApod.date}.jpg`;
        link.target = "_blank";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    } catch (error) {
        console.error("Error downloading:", error);
        window.open(state.currentApod.url, "_blank");
    }
}

function getFavorites() {
    const favorites = localStorage.getItem("apod-favorites");
    if (!favorites) return {};

    const parsed = JSON.parse(favorites);
    if (Array.isArray(parsed)) {
        localStorage.removeItem("apod-favorites");
        return {};
    }
    return parsed;
}

function saveFavorites(favorites) {
    localStorage.setItem("apod-favorites", JSON.stringify(favorites));
}

function isFavorite(date) {
    return Object.prototype.hasOwnProperty.call(getFavorites(), date);
}

function toggleFavorite() {
    if (!state.currentApod) return;

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
            copyright: state.currentApod.copyright || null,
        };
    }

    saveFavorites(favorites);
    updateFavoriteButton();
}

function updateFavoriteButton() {
    if (!state.currentApod) return;

    const favoriteIcon = document.getElementById("favorite-icon");
    const favoriteBtn = document.getElementById("favorite-btn");

    if (!favoriteIcon || !favoriteBtn) return;

    const isFav = isFavorite(state.currentApod.date);
    favoriteIcon.style.fontVariationSettings = isFav ? "'FILL' 1" : "'FILL' 0";
    favoriteBtn.setAttribute(
        "aria-label",
        isFav ? "Remove from favorites" : "Add to favorites"
    );
}

function navigateAPOD(direction) {
    if (!state.currentApod) return;

    const newDate = addDays(state.currentApod.date, direction);

    if (isValidApodDate(newDate)) {
        fetchAPOD(newDate);
    } else {
        alert(
            direction > 0
                ? "No APOD available for future dates"
                : "No APOD available before June 16, 1995"
        );
    }
}

// ========== EVENT LISTENERS ==========

function initEventListeners() {
    const addClickHandler = (id, handler) => {
        const el = document.getElementById(id);
        if (el) el.addEventListener("click", handler);
    };

    addClickHandler("calendar-btn", openModal);
    addClickHandler("favorites-btn", openFavoritesModal);
    addClickHandler("favorites-modal-close-btn", closeFavoritesModal);
    addClickHandler("modal-close-btn", closeModal);
    addClickHandler("modal-cancel-btn", closeModal);
    addClickHandler("retry-btn", () => fetchAPODInternal(getRandomAPODDate()));

    const favoritesModal = document.getElementById("favorites-modal");
    if (favoritesModal) {
        favoritesModal.addEventListener("click", (e) => {
            if (e.target === favoritesModal) closeFavoritesModal();
        });
    }

    if (elements.modal) {
        elements.modal.addEventListener("click", (e) => {
            if (e.target === elements.modal) closeModal();
        });
    }

    if (elements.modalSelectBtn) {
        elements.modalSelectBtn.addEventListener("click", () => {
            const selectedDate = elements.dateInput.value;
            if (selectedDate) {
                fetchAPOD(selectedDate);
            } else {
                alert("Please select a date");
            }
        });
    }

    if (elements.dateInput) {
        elements.dateInput.addEventListener("keypress", (e) => {
            if (e.key === "Enter") elements.modalSelectBtn.click();
        });
    }

    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && state.isModalOpen) closeModal();
    });

    const actionButtons = {
        "share-btn": shareAPOD,
        "download-btn": downloadAPOD,
        "favorite-btn": toggleFavorite,
        "prev-btn": () => navigateAPOD(-1),
        "next-btn": () => navigateAPOD(1),
    };

    Object.entries(actionButtons).forEach(([id, handler]) => {
        const btn = document.getElementById(id);
        if (btn) {
            btn.addEventListener("click", (e) => {
                e.preventDefault();
                e.stopPropagation();
                handler();
            });
        }
    });

    const foregroundLayer = document.getElementById("foreground-layer");
    if (foregroundLayer) {
        foregroundLayer.addEventListener("click", (e) => {
            if (state.isModalOpen) return;
            const isInteractive = e.target.closest(
                "button, a, input, textarea, select, #content-card, #date-modal, #favorites-modal"
            );
            if (!isInteractive) setState({ isFocusMode: !state.isFocusMode });
        });
    }
}

function init() {
    initEventListeners();
    fetchAPODInternal(getRandomAPODDate());
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
} else {
    init();
}
