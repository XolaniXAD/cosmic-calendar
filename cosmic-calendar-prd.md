# Product Requirements Document (PRD): The Cosmic Calendar

| Field | Value |
|-------|-------|
| **Document Owner** | John, Product Manager |
| **Status** | Draft (Ready for UX/Engineering Review) |
| **Target Launch** | MVP (TBD) |
| **Associated Epic** | E-COSMIC-001: Core APOD Experience & Time Travel |

---

## 1. Goal & Strategic Fit

### 1.1 Project Goal

Build an elegant, single-page web application that acts as an immersive digital calendar for space enthusiasts.

**Core objective:** fetch, interpret, and display NASA's Astronomy Picture of the Day (APOD) for any selected date, with strong emphasis on visual impact and accessibility.

### 1.2 Success Metrics

**P0 – Core Functionality**
- 100% successful retrieval and display of APOD media (image or video) for:
  - Today's date
  - Any historical date selected

**P1 – Engagement**
- Average session duration ≥ 60 seconds  
  *(indicates interaction with Time Travel Selector)*

**P2 – Performance**
- First Contentful Paint (FCP) under 3 seconds

---

## 2. Target Users & Use Cases

### 2.1 Target User

**The Space Enthusiast / Lifelong Learner**  
A curious user who wants visually appealing access to APOD content without browsing NASA's archives.

### 2.2 Key Use Case — The Time Traveler

1. User opens The Cosmic Calendar
2. App loads most recent APOD as full-screen immersive background
3. User reads title & explanation
4. User opens Time Travel Selector (calendar)
5. User selects any date from 1995 → today
6. App fetches APOD for that date
7. Media and content instantly update
8. **Immersed Viewer:** user taps background to hide UI; taps again to show UI

---

## 3. Scope of Work (MVP)

This PRD defines requirements exclusively for:
- Core APOD display
- Date selection mechanism
- Focus Mode
- Readability features

### 3.1 Features (Mapped to Epic E-COSMIC-001)

| Feature | Description | Priority |
|---------|-------------|----------|
| Immersive Background | APOD media fills entire viewport, non-scrollable | P0 |
| Current Day View | Load today's APOD on startup | P0 |
| Time Travel Selector | Date picker for 1995-today | P0 |
| Content Display | Title, Date, Explanation on screen | P0 |
| Media Type Handling | Render `<img>` or `<iframe>` based on `media_type` | P0 |
| Readability Overlay | Semi-transparent dark layer behind text | P1 |
| Focus Mode / UI Toggle | Tap media to hide/show UI | P1 |

---

## 4. Detailed Functional Requirements

### 4.1 Data & API Integration

| Requirement ID | Description |
|----------------|-------------|
| FR-API-001 | Must use official NASA APOD API |
| FR-API-002 | Handle API rate limits; show friendly error |
| FR-API-003 | Send date as `&date=YYYY-MM-DD` |
| FR-API-004 | Extract: `title`, `date`, `explanation`, `url`, `media_type` |

### 4.2 User Interface & Media Display

| Requirement ID | Description |
|----------------|-------------|
| FR-UI-001 | For images: use `<img>` full-screen, preserve aspect |
| FR-UI-002 | For videos: use `<iframe>` full-screen; attempt autoplay, mute, loop |
| FR-UI-003 | Date Selector must be visible and unobtrusive |
| FR-UI-004 | Text content dynamically inserted and readable |
| FR-UI-005 | Clicking media toggles visibility of UI (Content + Date Picker) |

---

## 5. User Stories (Epic E-COSMIC-001)

| Story ID | User Story | Acceptance Criteria |
|----------|------------|---------------------|
| US-001 | As a user, I want the app to show today's APOD as full-screen on load | AC1: Successful API call for today<br>AC2: Media covers entire viewport |
| US-002 | As a user, I want a date selector to view historical APODs | AC1: Date input present<br>AC2: Selecting date triggers new API fetch |
| US-003 | As a user, I want correct rendering for image vs video | AC1: `<img>` for image<br>AC2: `<iframe>` for video |
| US-004 | As a user, I want Title/Date/Explanation displayed | AC: All fields present and update after each fetch |
| US-005 | As a user, I want text to be readable over any background | AC: Text container has minimum 50% opaque overlay |
| US-006 | As a user, I want to toggle immersive focus mode by tapping media | AC1: Tapping hides UI<br>AC2: Tapping again restores UI |

---

## 6. Open Questions & Future Considerations

### Open Questions

| Item | Rationale |
|------|-----------|
| What is the fallback behavior if NASA API is down? | Need default image + friendly error message |

### Future Scope

| Feature | Description |
|---------|-------------|
| Save to Favorites | Bookmark favorite APODs (post-MVP) |
| Multi-Media Carousel | Swipeable carousel for saved images |

---

*Created: December 1, 2025*  
*Status: Draft - Ready for Review*  
*Epic: E-COSMIC-001*
