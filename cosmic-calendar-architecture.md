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

## 7. Development Checklist

| Item | Status | Notes |
|------|--------|-------|
| Core State Defined | ✔️ | Server: Data, Client: UI |
| Express Setup | ✔️ | Requires `/` (SSR) and `/api/apod` routes |
| EJS Templating | ✔️ | Initial render + data injection |
| Axios Usage | ✔️ | Server: NASA API, Client: Date changes |
| Focus Mode | ✔️ | Pure client-side JS/Tailwind |
| Date Modal | ✔️ | Client-side rendering & logic |
| Readability Overlay | ✔️ | Tailwind class in EJS template |

---

*Created: December 1, 2025*  
*Status: Architecture Design Complete*
