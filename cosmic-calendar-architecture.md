# Frontend Architecture Specification: The Cosmic Calendar

**Role:** Architect  
**Technology Stack:**
- **Frontend:** HTML, CSS, Tailwind, JavaScript
- **Backend / Templating:** Express, Axios, EJS

## Goal
Define a Hybrid Server-Side Rendered (SSR) architecture with a clear separation between backend data handling and client-side UI interactivity.

---

## 1. Architectural Overview: Hybrid SSR

The application uses Express to fetch initial data and render pages with EJS. Client interactivity (Focus Mode toggle, Modal, Date changes) is powered by Vanilla JavaScript and Axios, forming a hybrid SSR + client-side app.

### 1.1 Server-Side Rendering (SSR) – Express & EJS

**Express**
- Handles routing
- Manages API keys
- Fetches initial APOD data (via Axios)
- Performs error handling

**EJS**
- Renders HTML pages
- Injects initial APOD data for fast page load (P2 metric)

### 1.2 Client-Side Interactivity – Vanilla JS & Tailwind

**JavaScript**
- Manages UI state (Focus Mode, Modal open state, loading state)
- Handles user interactions (Date Picker, media click)

**Axios**
- Fetches new APOD data for historical dates
- Avoids full page reload

---

## 2. Project File Structure

```
/
├── app.js                  # Express application entry
├── package.json            # Dependencies (Express, Axios, EJS)
├── .env                    # NASA_API_KEY
├── /routes
│   ├── api.js              # API endpoints (/api/apod)
│   └── index.js            # SSR route for main page
├── /views
│   └── index.ejs           # EJS template for main APOD view
├── /public
│   ├── /js
│   │   └── main.js         # Client-side JavaScript
│   └── /css
│       └── style.css       # Tailwind CSS output
```

---

## 3. Application State Management

State is split between server (data) and client (UI config).

### Server State (Express → EJS Injection)

```javascript
const serverApodState = {
  apod: {
    title: null,
    date: null,
    explanation: null,
    url: null,
    media_type: null,   // 'image' or 'video'
    copyright: null,
  },
};
```

### Client State (JavaScript)

```javascript
const state = {
  ui: {
    selectedDate: serverApodState.apod.date,
    isLoading: false,
    isFocusMode: false,
    isModalOpen: false,
    error: null,
  },
};
```

---

## 4. Component Hierarchy & DOM Mapping

| Component | DOM ID | Functions | Key Features |
|-----------|--------|-----------|--------------|
| Header | `header-container` | `updateHeader` | Date Picker, Focus Mode visibility |
| Media Container | `media-container` | `updateMedia` | Display image/video, Focus Mode toggle |
| Content Card | `content-card` | `updateContentCard` | Metadata text, readability overlay |
| Date Modal | `date-modal` | `renderDateModal`, `setupCalendar` | Archive navigation |
| Main App | `app-root` | `init`, `setState`, `updateUI` | Global listeners, state execution |

---

## 5. Data Flow and Logic

### 5.1 Server Initialization Flow

1. User requests `/`
2. Express server handles request
3. Express fetches current APOD (Axios → NASA API)
4. Server renders EJS:
   ```javascript
   res.render("index", { apodData })
   ```
5. Browser loads page with pre-rendered APOD data

### 5.2 Client Date Change Flow (Hybrid AJAX)

1. User selects a date in the Modal
2. Client sends Axios request → `/api/apod?date=YYYY-MM-DD`
3. Express fetches NASA API & returns JSON
4. Client updates DOM (`updateUI`) with new data

---

## 6. API Interaction & Error Handling

### 6.1 Server-Side (Express + Axios)
- Server communicates with NASA APOD API
- API key stored securely in `.env`

### 6.2 Client-Side (Axios)
- Client only calls Express backend
- Protects API key from exposure

### 6.3 Error Handling

**Server Error (Initial Load):**
- Render EJS with fallback values + error message

**Client Error (Date Change):**
- Store error in `state.ui.error`
- `updateContentCard` displays message per UX spec

---

## 7. Implementation Roadmap

Complete these tasks in order. Each task is atomic and testable. Check off each box once complete.

### Phase 1: Backend Foundation (Server-Side Data Layer)

#### 1.1 Environment Setup
- [x] Create `.env` file in project root
- [x] Add `NASA_API_KEY=your_key_here` to `.env` (Get key from https://api.nasa.gov/)
- [x] Add `.env` to `.gitignore` to protect your API key
- [x] Test: Run `node app.js` and verify no errors about missing env variables

#### 1.2 API Route Setup (`routes/api.js`)
- [x] Import required modules: `express`, `axios`, `dotenv`
- [x] Create Express router instance
- [x] Define `GET /api/apod` route that:
  - Accepts optional `date` query parameter (format: `YYYY-MM-DD`)
  - Fetches data from `https://api.nasa.gov/planetary/apod?api_key=YOUR_KEY&date=DATE`
  - Returns JSON response with APOD data
  - Handles errors with appropriate status codes (400 for bad date, 500 for API failure)
- [x] Export the router
- [x] Test: Use browser or Postman to call `http://localhost:3000/api/apod` and verify JSON response

#### 1.3 Main Route Setup (`routes/index.js`)
- [x] Import required modules: `express`, `axios`, `dotenv`
- [x] Create Express router instance
- [x] Define `GET /` route that:
  - Fetches today's APOD from NASA API using Axios
  - Extracts: `title`, `date`, `explanation`, `url`, `media_type`, `copyright`
  - Renders `index.ejs` with APOD data object
  - Handles errors gracefully (render with fallback/error message)
- [x] Export the router
- [x] Test: Visit `http://localhost:3000/` and verify EJS template renders with real data

#### 1.4 Connect Routes in `app.js`
- [x] Import `api.js` route: `import apiRoutes from "./routes/api.js"`
- [x] Import `index.js` route: `import indexRoutes from "./routes/index.js"`
- [x] Register API routes: `app.use("/api", apiRoutes)`
- [x] Register main routes: `app.use("/", indexRoutes)`
- [x] Remove the temporary hardcoded `app.get('/')` route
- [x] Test: Restart server and verify both `/` and `/api/apod` work correctly

---

### Phase 2: Frontend Template (Server-Side Rendering)

#### 2.1 Update EJS Template (`views/index.ejs`)
- [x] Replace hardcoded title with: `<%= apodData.title %>`
- [x] Replace hardcoded date with: `<%= apodData.date %>`
- [x] Replace hardcoded explanation with: `<%= apodData.explanation %>`
- [x] Add conditional rendering for `media_type`:
  - If `image`: `<img src="<%= apodData.url %>" />`
  - If `video`: `<iframe src="<%= apodData.url %>" />`
- [x] Update background image to use: `background-image: url("<%= apodData.url %>")`
- [x] Add copyright display if present: `<% if (apodData.copyright) { %> © <%= apodData.copyright %> <% } %>`
- [x] Test: Refresh page and verify dynamic content loads from NASA API

#### 2.2 Handle Error States in EJS
- [x] Accept optional `error` parameter in EJS
- [x] Add conditional block to display error message if API fails
- [x] Style error message to be visible over any background
- [x] Test: Break API key temporarily and verify error displays gracefully

---

### Phase 3: Client-Side Interactivity (JavaScript)

#### 3.1 State Management (`public/main.js`)
- [x] Define initial client state object:
  ```javascript
  const state = {
    selectedDate: null,  // Currently displayed date
    isLoading: false,    // Loading indicator
    isFocusMode: false,  // UI visibility toggle
    isModalOpen: false,  // Calendar modal state
    error: null          // Error message
  };
  ```
- [x] Create `setState(updates)` function that merges updates and calls `updateUI()`
- [x] Create `updateUI()` function that syncs DOM with state
- [x] Test: Console.log state changes to verify reactivity

#### 3.2 Date Picker Modal
- [x] Add HTML structure for modal in EJS:
  - Modal overlay (full screen, semi-transparent)
  - Modal content container
  - Date input field (type="date")
  - Close button
  - Submit/Select button
- [x] Style modal with Tailwind (hidden by default, centered when visible)
- [x] In `main.js`, create `openModal()` function that sets `isModalOpen: true`
- [x] Create `closeModal()` function that sets `isModalOpen: false`
- [x] Bind calendar button click to `openModal()`
- [x] Bind close button and overlay click to `closeModal()`
- [x] Test: Click calendar button and verify modal opens/closes

#### 3.3 Fetch Historical APOD
- [x] Create async function `fetchAPOD(date)` in `main.js`:
  - Set `isLoading: true`
  - Use Axios to call `/api/apod?date=${date}`
  - On success: update DOM with new APOD data
  - On error: set `error` in state
  - Finally: set `isLoading: false`
- [x] Bind date selection to trigger `fetchAPOD(selectedDate)`
- [x] Update DOM elements: title, date, explanation, media (image or iframe)
- [x] Handle both image and video media types correctly
- [x] Test: Select different dates and verify content updates without page reload

#### 3.4 Loading States
- [x] Add loading spinner HTML in EJS (initially hidden)
- [x] In `updateUI()`, show/hide spinner based on `state.isLoading`
- [x] Add disabled state to buttons while loading
- [ ] Optional: Add skeleton loading for content card
- [x] Test: Select a date and verify spinner appears during fetch

---

### Phase 4: Focus Mode (Immersive Experience)

#### 4.1 Implement Focus Mode Toggle
- [x] Add click event listener to background/media container
- [x] On click, toggle `state.isFocusMode`
- [x] When `isFocusMode = true`:
  - Hide header (calendar button and title)
  - Hide content card
  - Keep only background visible
- [x] When `isFocusMode = false`:
  - Show all UI elements
- [x] Use Tailwind classes or CSS transitions for smooth fade
- [x] Test: Click background and verify UI hides, click again to restore

#### 4.2 Focus Mode Visual Polish
- [x] Implement smooth transitions and cursor feedback

---

### Phase 5: Error Handling & Edge Cases

#### 5.1 Client-Side Error Display
- [x] Add error message container in EJS (hidden by default)
- [x] Style error with red background or warning icon
- [x] Display errors from `state.error` in the content card area
- [x] Add "Try Again" button that resets error state
- [x] Test: Manually trigger errors (invalid date, network failure)

#### 5.2 Date Validation
- [x] Set min date on date picker: `1995-06-16` (first APOD)
- [x] Set max date on date picker: today's date
- [x] Validate date format before sending to API
- [x] Show user-friendly message for invalid dates
- [x] Test: Try selecting dates outside valid range

#### 5.3 Video Handling
- [x] For YouTube videos, ensure iframe has proper attributes:
  - `allow="autoplay; encrypted-media"`
  - Proper aspect ratio (16:9)
- [x] Add fallback for videos that don't embed properly
- [x] Test with known video APODs (search NASA APOD archive)

---

### Phase 6: Polish & Optimization

#### 6.1 Performance Optimization
- [x] Add caching headers for static assets
- [x] Preload critical fonts in HTML `<head>`
- [x] Optimize image loading: add `loading="lazy"` for non-critical images
- [x] Consider rate limiting API calls (debounce rapid date changes)
- [x] Test: Check Network tab for unnecessary requests

#### 6.2 Accessibility
- [x] Add `alt` text to images using APOD title
- [x] Ensure modal can be closed with `Escape` key
- [x] Add ARIA labels to icon buttons (calendar, share, close)
- [x] Test keyboard navigation (Tab through interactive elements)
- [x] Test with screen reader if possible

#### 6.3 Responsive Design
- [x] Test layout on mobile (320px width)
- [x] Test layout on tablet (768px width)
- [x] Test layout on desktop (1920px width)
- [x] Ensure content card doesn't overflow on small screens
- [x] Adjust text sizes for readability on mobile
- [x] Test: Use browser DevTools device emulation

#### 6.4 Final Visual Polish
- [ ] Verify readability overlay darkness (adjust opacity if needed)
- [ ] Check color contrast ratios for accessibility
- [ ] Add smooth transitions to all interactive elements
- [ ] Review typography hierarchy (title vs. body text)
- [ ] Test: View with different APOD images (bright vs. dark backgrounds)

---

### Phase 7: Testing & Deployment

#### 7.1 Manual Testing Checklist
- [ ] Test with today's date
- [ ] Test with 5 random historical dates
- [ ] Test with earliest APOD date (1995-06-16)
- [ ] Test with invalid date formats
- [ ] Test with no network connection
- [ ] Test focus mode activation/deactivation
- [ ] Test modal open/close flows
- [ ] Test on 3 different browsers (Chrome, Firefox, Safari/Edge)

#### 7.2 Code Quality
- [ ] Remove all `console.log()` statements
- [ ] Add comments to complex logic
- [ ] Ensure consistent code formatting
- [ ] Check for unused imports or variables
- [ ] Verify `.env` is in `.gitignore`

#### 7.3 Documentation
- [ ] Update README.md with:
  - Project description
  - Setup instructions (npm install, .env configuration)
  - How to run locally
  - API key acquisition steps
- [ ] Document any known limitations
- [ ] Add screenshots to README (optional)

#### 7.4 Deployment (Optional)
- [ ] Choose hosting platform (Vercel, Render, Railway)
- [ ] Set environment variables in hosting platform
- [ ] Deploy and test production URL
- [ ] Verify API calls work in production
- [ ] Monitor for errors after deployment

---

## 8. Quick Reference: Key Implementation Notes

### NASA API Details
- **Base URL:** `https://api.nasa.gov/planetary/apod`
- **Required param:** `api_key=YOUR_KEY`
- **Optional param:** `date=YYYY-MM-DD`
- **Date range:** 1995-06-16 to present
- **Rate limit:** 1000 requests/hour (with API key)

### Critical DOM IDs to Add
| Element | ID/Class | Purpose |
|---------|----------|---------|
| Background container | `#media-container` | Click for focus mode |
| Content card | `#content-card` | Display APOD info |
| Title | `#apod-title` | Dynamic title update |
| Date | `#apod-date` | Dynamic date update |
| Explanation | `#apod-explanation` | Dynamic text update |
| Calendar button | `#calendar-btn` | Open modal |
| Modal | `#date-modal` | Date selection UI |
| Loading spinner | `#loading-spinner` | Loading feedback |
| Error container | `#error-message` | Error display |

### State-to-DOM Mapping
```javascript
// Example updateUI() implementation structure
function updateUI() {
  // Update title
  document.getElementById('apod-title').textContent = currentAPOD.title;
  
  // Update date
  document.getElementById('apod-date').textContent = currentAPOD.date;
  
  // Update explanation
  document.getElementById('apod-explanation').textContent = currentAPOD.explanation;
  
  // Update media (image vs video)
  const container = document.getElementById('media-container');
  if (currentAPOD.media_type === 'image') {
    container.style.backgroundImage = `url("${currentAPOD.url}")`;
  } else {
    // Handle video embed
  }
  
  // Toggle visibility based on state
  document.getElementById('loading-spinner').classList.toggle('hidden', !state.isLoading);
  document.getElementById('date-modal').classList.toggle('hidden', !state.isModalOpen);
  document.getElementById('content-card').classList.toggle('hidden', state.isFocusMode);
}
```

---

*Created: December 1, 2025*  
*Updated: December 3, 2025*  
*Status: Ready for Implementation*
