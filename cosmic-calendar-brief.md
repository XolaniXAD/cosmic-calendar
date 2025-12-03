# Project Brief: The Cosmic Calendar

## 1. Project Summary

**Project Name:** The Cosmic Calendar

**Concept:**  
A simple, elegant web application that uses NASA's Astronomy Picture of the Day (APOD) as a full-screen background. Users can browse history by selecting any date through a built-in calendar.

**Why:**  
This project gives hands-on experience with the full lifecycle of consuming external APIs:
- Requesting data
- Handling JSON responses
- Dynamically presenting media on a webpage
- Managing UI/UX through a visually immersive interface

**Core Feature:**  
The APOD media (image or video) always fills the entire screen as the immersive background.

---

## 2. User Experience & Features

The app emphasizes minimalism and celestial immersion. Interface elements are clean and unobtrusive.

### Features

| Feature Name | User Experience |
|--------------|-----------------|
| **Current Day View** | When the site loads, the most recent APOD media fills the screen. Title + explanation overlay the media. |
| **Time Travel Selector** | A clear calendar input allows users to pick a date. When selected, the app fetches and displays the APOD for that historical date. |
| **Media Immersion** | Images fill the background; videos (typically YouTube) are embedded and scaled to behave like fullscreen backgrounds. |
| **Readability Overlay** | A subtle, dark, semi-transparent layer ensures text is always legible on bright or complex space images. |
| **Content Information** | Displays Title, Date, and Explanation of the selected APOD. |

---

## 3. Implementation & Learning Objectives

This project builds competency in key web development fundamentals.

| Learning Objective | Project Task |
|-------------------|--------------|
| **API Calls** | Write code to securely request APOD data from NASA's servers. |
| **Response Handling** | Extract title, explanation, url, and other fields from the JSON response. |
| **Query Parameters** | Format requests for specific dates (e.g., `&date=YYYY-MM-DD`). |
| **Conditional Logic** | Detect whether APOD content is an image or video; display `<img>` or `<iframe>` accordingly. |
| **Data Presentation** | Dynamically insert media and text into the DOM and style it as a full-screen experience. |

---

## 4. Complexity Assessment

**Complexity Level:** Intermediate

**Justification:**
- Fetching today's image is straightforward
- Implementing time travel logic
- Managing different media types (image vs. video)
- Handling dynamic UI behavior

These introduce intermediate-level front-end and API skills.

---

*Created: December 1, 2025*  
*Status: Planning Phase*
