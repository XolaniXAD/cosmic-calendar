# Lessons Learned: NASA APOD Viewer Project

**Author:** Developer Notes  
**Date:** December 3, 2025  
**Project:** The Cosmic Calendar - NASA APOD Viewer

---

## Table of Contents

1. [Axios Error Handling & Rendering](#1-axios-error-handling--rendering)
2. [Dotenv Configuration Management](#2-dotenv-configuration-management)
3. [Express Router Architecture](#3-express-router-architecture)
4. [Scalable Express Project Architecture](#4-scalable-express-project-architecture)

---

## 1. Axios Error Handling & Rendering

### Overview
Axios is a promise-based HTTP client for making API requests. Proper error handling is crucial for providing good user experience when APIs fail.

### Common Axios Errors

#### 1.1 Network Errors
```javascript
// Error when the API server is unreachable or network is down
{
  message: "Network Error",
  code: "ERR_NETWORK"
}
```

#### 1.2 HTTP Status Errors
```javascript
// Error when API returns 4xx or 5xx status codes
{
  message: "Request failed with status code 404",
  response: {
    status: 404,
    statusText: "Not Found",
    data: { error: "Resource not found" }
  }
}
```

#### 1.3 Timeout Errors
```javascript
{
  message: "timeout of 5000ms exceeded",
  code: "ECONNABORTED"
}
```

### Proper Error Handling Pattern

#### Bad Practice ❌
```javascript
// DON'T pass the entire error object to the template
app.get('/', async (req, res) => {
    try {
        const response = await axios.get(API_URL);
        res.render('index', { apod: response.data });
    } catch (error) {
        // ❌ This passes the entire error object as 'apod'
        res.render('index', { apod: error });
    }
});
```

**Problems:**
- Template receives error object instead of null for `apod`
- Error object structure doesn't match expected APOD data
- Template tries to access `error.title`, `error.date`, etc. (undefined)
- No clear error message for the user

#### Good Practice ✅
```javascript
// From our project: routes/index.js
app.get('/', async (req, res) => {
    try {
        const apodResponse = await axios.get(`https://api.nasa.gov/planetary/apod?api_key=${process.env.NASA_API_KEY}`);
        const apodData = apodResponse.data;
        
        // ✅ Pass data with no error
        res.render('index', { apod: apodData, error: null });
    } catch (error) {
        console.error("Error fetching APOD data:", error);
        
        // ✅ Pass null for apod, extract readable error message
        res.render('index', { 
            apod: null, 
            error: error.message || 'Failed to fetch APOD data. Please check your API key and try again.' 
        });
    }
});
```

**Benefits:**
- Clear separation: `apod` for data, `error` for error messages
- Template can check `if (locals.apod)` to conditionally render
- User-friendly error messages
- Fallback message when `error.message` is undefined

### Rendering Errors in EJS

#### Template Pattern (from `views/index.ejs`)
```html
<!-- Check if we have APOD data -->
<% if (locals.apod) { %>
    <!-- Render APOD content -->
    <h1><%= locals.apod.title %></h1>
    <p><%= locals.apod.explanation %></p>
<% } else { %>
    <!-- Render error state -->
    <div class="error-container">
        <span class="error-icon">error</span>
        <h1>Unable to Load APOD</h1>
        
        <p>
            <% if (locals.error) { %>
                <%= locals.error %>
            <% } else { %>
                We couldn't retrieve the Astronomy Picture of the Day.
            <% } %>
        </p>
        
        <button onclick="window.location.reload()">
            Try Again
        </button>
    </div>
<% } %>
```

### Advanced Error Handling: Different Error Types

```javascript
router.get('/', async (req, res) => {
    try {
        const apodResponse = await axios.get(API_URL);
        res.render('index', { apod: apodResponse.data, error: null });
    } catch (error) {
        let errorMessage = 'An unexpected error occurred.';
        
        // Handle different error types
        if (error.response) {
            // Server responded with error status
            const status = error.response.status;
            
            switch(status) {
                case 400:
                    errorMessage = 'Invalid request. Please check the date format.';
                    break;
                case 401:
                    errorMessage = 'Invalid API key. Please check your NASA API key.';
                    break;
                case 403:
                    errorMessage = 'Access forbidden. Your API key may be rate-limited.';
                    break;
                case 404:
                    errorMessage = 'APOD not found for this date.';
                    break;
                case 500:
                    errorMessage = 'NASA API server error. Please try again later.';
                    break;
                default:
                    errorMessage = `Server error: ${status}`;
            }
        } else if (error.request) {
            // Request was made but no response received
            errorMessage = 'No response from NASA API. Check your internet connection.';
        } else {
            // Error in setting up the request
            errorMessage = error.message || 'Failed to make request.';
        }
        
        console.error('APOD fetch error:', error);
        res.render('index', { apod: null, error: errorMessage });
    }
});
```

### Key Takeaways ✨
- Always separate data and error in template props
- Extract user-friendly messages from error objects
- Use `error.response.status` for HTTP errors
- Use `error.request` for network errors
- Provide fallback messages
- Log detailed errors to console for debugging

---

## 2. Dotenv Configuration Management

### What is dotenv?

`dotenv` is a zero-dependency module that loads environment variables from a `.env` file into `process.env`.

**Why use it?**
- ✅ Keep secrets out of source code
- ✅ Different configs for dev/staging/production
- ✅ Easy to change without modifying code
- ✅ Works with version control (never commit `.env`)

### Setup Pattern

#### 1. Installation
```bash
npm install dotenv
```

#### 2. Create `.env` file (Project Root)
```env
# .env
NASA_API_KEY=your_actual_api_key_here
PORT=3000
NODE_ENV=development
```

#### 3. Load in Application (from `app.js`)
```javascript
import dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

// Now you can access variables
const PORT = process.env.PORT || 3000;
const API_KEY = process.env.NASA_API_KEY;
```

### Important: .gitignore Configuration

**Always add `.env` to `.gitignore`:**
```gitignore
# Environment variables (contains secrets!)
.env

# Node modules
node_modules/

# Logs
*.log
```

### Using Environment Variables in Routes

#### From our project: `routes/index.js`
```javascript
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

router.get('/', async (req, res) => {
    try {
        // ✅ Access API key from environment
        const apodResponse = await axios.get(
            `https://api.nasa.gov/planetary/apod?api_key=${process.env.NASA_API_KEY}`
        );
        res.render('index', { apod: apodResponse.data, error: null });
    } catch (error) {
        res.render('index', { apod: null, error: error.message });
    }
});
```

### Best Practices

#### ✅ DO:
```javascript
// Load dotenv at the very top of your entry file
import dotenv from "dotenv";
dotenv.config();

// Use descriptive variable names
const NASA_API_KEY = process.env.NASA_API_KEY;
const DATABASE_URL = process.env.DATABASE_URL;

// Provide defaults for non-sensitive values
const PORT = process.env.PORT || 3000;

// Validate critical variables at startup
if (!process.env.NASA_API_KEY) {
    console.error('ERROR: NASA_API_KEY not found in environment');
    process.exit(1);
}
```

#### ❌ DON'T:
```javascript
// ❌ Don't hardcode secrets in your code
const API_KEY = "abc123xyz789"; // Never do this!

// ❌ Don't commit .env files
// (Add .env to .gitignore)

// ❌ Don't use environment variables before calling config()
const key = process.env.API_KEY; // undefined!
dotenv.config(); // Too late!

// ❌ Don't use env variables in client-side JavaScript
// (They're only available on the server)
```

### Environment-Specific Configurations

```javascript
// app.js
import dotenv from "dotenv";
dotenv.config();

const isDevelopment = process.env.NODE_ENV === 'development';
const isProduction = process.env.NODE_ENV === 'production';

if (isDevelopment) {
    // Development-only middleware
    app.use(morgan('dev'));
    console.log('🔧 Running in development mode');
}

if (isProduction) {
    // Production optimizations
    app.use(compression());
    console.log('🚀 Running in production mode');
}
```

### Key Takeaways ✨
- Call `dotenv.config()` as early as possible
- Never commit `.env` to git
- Validate required environment variables at startup
- Use defaults for non-sensitive configuration
- Keep production secrets in hosting platform's environment settings

---

## 3. Express Router Architecture

### What is Express Router?

`Router` is a mini Express application that handles routing independently. It's like a modular sub-application within your main Express app.

### Why Use Routers?

**Without Routers (Bad for Large Apps):**
```javascript
// app.js - Everything in one file ❌
app.get('/', (req, res) => { /* ... */ });
app.get('/about', (req, res) => { /* ... */ });
app.get('/api/apod', (req, res) => { /* ... */ });
app.post('/api/apod', (req, res) => { /* ... */ });
app.get('/api/users', (req, res) => { /* ... */ });
app.post('/api/users', (req, res) => { /* ... */ });
// 50 more routes...
```

**Problems:**
- 🔴 Hard to maintain
- 🔴 Difficult to test individual routes
- 🔴 No logical organization
- 🔴 Merge conflicts with team

**With Routers (Scalable):**
```javascript
// app.js - Clean entry point ✅
import indexRoutes from "./routes/index.js";
import apiRoutes from "./routes/api.js";

app.use("/", indexRoutes);
app.use("/api", apiRoutes);
```

### Creating a Router

#### From our project: `routes/index.js`
```javascript
import express from "express";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

// 1. Create router instance
const router = express.Router();

// 2. Define routes on the router (not on app)
router.get('/', async (req, res) => {
    try {
        const apodResponse = await axios.get(
            `https://api.nasa.gov/planetary/apod?api_key=${process.env.NASA_API_KEY}`
        );
        const apodData = apodResponse.data;
        res.render('index', { apod: apodData, error: null });
    } catch (error) {
        console.error("Error fetching APOD data:", error);
        res.render('index', { 
            apod: null, 
            error: error.message || 'Failed to fetch APOD data.' 
        });
    }
});

// 3. Export the router
export default router;
```

### Registering Routers in Main App

#### From our project: `app.js`
```javascript
import express from "express";
import dotenv from "dotenv";

// Import routes
import indexRoutes from "./routes/index.js";
import apiRoutes from "./routes/api.js";

dotenv.config();
const app = express();

// Middleware
app.use(express.json());
app.use(express.static("public"));
app.set("view engine", "ejs");

// Register routes
app.use("/", indexRoutes);      // All routes in indexRoutes start with "/"
app.use("/api", apiRoutes);     // All routes in apiRoutes start with "/api"

app.listen(3000);
```

### Router URL Mapping

**How paths combine:**
```javascript
// app.js
app.use("/api", apiRoutes);

// routes/api.js
router.get('/apod', handler);          // Final URL: /api/apod
router.get('/apod/:date', handler);    // Final URL: /api/apod/:date
router.post('/favorites', handler);    // Final URL: /api/favorites
```

### Advanced Router Example: API Routes

```javascript
// routes/api.js
import express from "express";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();
const router = express.Router();

// GET /api/apod - Get today's APOD
router.get('/apod', async (req, res) => {
    try {
        const response = await axios.get(
            `https://api.nasa.gov/planetary/apod?api_key=${process.env.NASA_API_KEY}`
        );
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET /api/apod?date=YYYY-MM-DD - Get APOD for specific date
router.get('/apod', async (req, res) => {
    const { date } = req.query;
    
    try {
        const url = `https://api.nasa.gov/planetary/apod?api_key=${process.env.NASA_API_KEY}${date ? `&date=${date}` : ''}`;
        const response = await axios.get(url);
        res.json(response.data);
    } catch (error) {
        // Handle errors based on status
        if (error.response?.status === 400) {
            res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
        } else {
            res.status(500).json({ error: error.message });
        }
    }
});

export default router;
```

### Router Benefits

| Feature | Without Router | With Router |
|---------|---------------|-------------|
| Organization | All in app.js | Separated by feature |
| Testing | Hard to test | Easy to test in isolation |
| Team Work | Merge conflicts | Work on different files |
| Maintenance | Find route in 1000 lines | Find in relevant file |
| Reusability | Copy-paste | Import and mount |

### Key Takeaways ✨
- Create separate router files for different features
- Use `express.Router()` to create mini-apps
- Mount routers with `app.use(path, router)`
- Keep `app.js` clean - only middleware and route registration
- Export routers with `export default router`

---

## 4. Scalable Express Project Architecture

### Project Structure Overview

Our NASA APOD project follows a scalable architecture pattern:

```
nasa-apod/
├── app.js                      # Application entry point
├── package.json                # Dependencies & scripts
├── .env                        # Environment variables (not in git)
├── .gitignore                  # Git ignore rules
│
├── routes/                     # Route handlers
│   ├── index.js               # Main page routes (SSR)
│   └── api.js                 # API endpoints (JSON)
│
├── views/                      # EJS templates
│   └── index.ejs              # Main view template
│
├── public/                     # Static assets (served directly)
│   ├── main.js                # Client-side JavaScript
│   └── styles.css             # Custom styles
│
└── docs/                       # Documentation
    ├── cosmic-calendar-architecture.md
    ├── cosmic-calendar-prd.md
    └── Learnt-From-Project.md
```

### Layer Separation Principle

#### 1. Entry Point Layer: `app.js`

**Responsibilities:**
- Initialize Express app
- Configure middleware
- Set up view engine
- Register routes
- Start server

**From our project:**
```javascript
import express from "express";
import dotenv from "dotenv";

// Import routes
import indexRoutes from "./routes/index.js";
import apiRoutes from "./routes/api.js";

dotenv.config();
const app = express();

// ========== MIDDLEWARE ==========
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

// ========== VIEW ENGINE ==========
app.set("view engine", "ejs");
app.set("views", "./views");

// ========== ROUTES ==========
app.use("/", indexRoutes);
app.use("/api", apiRoutes);

// ========== START SERVER ==========
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
```

**Key Point:** `app.js` should be **declarative** (what to do), not **imperative** (how to do it).

#### 2. Route Layer: `routes/`

**Responsibilities:**
- Define URL endpoints
- Handle request/response
- Validate input
- Call business logic
- Format responses

**SSR Routes (`routes/index.js`):**
```javascript
// Handles page rendering
router.get('/', async (req, res) => {
    // Fetch data
    // Render template with data
    res.render('index', { apod, error });
});
```

**API Routes (`routes/api.js`):**
```javascript
// Returns JSON data
router.get('/apod', async (req, res) => {
    // Fetch data
    // Return JSON
    res.json({ data });
});
```

#### 3. View Layer: `views/`

**Responsibilities:**
- Present data to users
- Conditional rendering
- Template logic only (no business logic)

```html
<!-- views/index.ejs -->
<% if (locals.apod) { %>
    <!-- Show APOD -->
<% } else { %>
    <!-- Show error -->
<% } %>
```

#### 4. Static Assets: `public/`

**Responsibilities:**
- Client-side JavaScript
- Stylesheets
- Images, fonts, etc.

Served directly by Express via `express.static("public")`

### Scalability Patterns

#### Pattern 1: Feature-Based Structure (For Larger Apps)

```
src/
├── features/
│   ├── apod/
│   │   ├── apod.routes.js
│   │   ├── apod.controller.js
│   │   ├── apod.service.js
│   │   └── apod.model.js
│   │
│   └── users/
│       ├── users.routes.js
│       ├── users.controller.js
│       ├── users.service.js
│       └── users.model.js
│
├── middleware/
│   ├── auth.js
│   └── errorHandler.js
│
└── utils/
    └── logger.js
```

#### Pattern 2: MVC Architecture

```
src/
├── models/          # Data structures & database schemas
├── views/           # Templates (EJS, Pug, etc.)
├── controllers/     # Request handlers
├── routes/          # URL definitions
├── middleware/      # Custom middleware
└── app.js          # App initialization
```

#### Pattern 3: Clean Architecture (Advanced)

```
src/
├── domain/          # Business logic (core)
├── application/     # Use cases
├── infrastructure/  # External services (APIs, DB)
├── interfaces/      # Routes, controllers
└── app.js
```

### When to Split Routes

**Start Simple:**
```javascript
// Good for small apps
routes/
├── index.js         // Main pages
└── api.js          // All API endpoints
```

**Scale as Needed:**
```javascript
// When api.js gets too large (50+ lines per feature)
routes/
├── index.js
└── api/
    ├── apod.js
    ├── favorites.js
    └── users.js
```

### Middleware Organization

#### Global Middleware (app.js)
```javascript
// Applied to ALL routes
app.use(express.json());
app.use(express.static("public"));
```

#### Route-Specific Middleware
```javascript
// routes/api.js
const validateDate = (req, res, next) => {
    const { date } = req.query;
    if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return res.status(400).json({ error: 'Invalid date format' });
    }
    next();
};

router.get('/apod', validateDate, async (req, res) => {
    // Handler
});
```

### Configuration Management

**Good Practice:**
```javascript
// config/config.js
export const config = {
    port: process.env.PORT || 3000,
    nasa: {
        apiKey: process.env.NASA_API_KEY,
        baseUrl: 'https://api.nasa.gov/planetary/apod'
    },
    env: process.env.NODE_ENV || 'development'
};

// Use in routes
import { config } from '../config/config.js';
const url = `${config.nasa.baseUrl}?api_key=${config.nasa.apiKey}`;
```

### Error Handling Architecture

**Centralized Error Handler:**
```javascript
// middleware/errorHandler.js
export const errorHandler = (err, req, res, next) => {
    console.error(err.stack);
    
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal Server Error';
    
    res.status(statusCode).json({
        error: message,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
};

// app.js
import { errorHandler } from './middleware/errorHandler.js';

// Register routes...

// Error handler must be last
app.use(errorHandler);
```

### Testing Structure

```
tests/
├── unit/
│   ├── routes/
│   │   └── apod.test.js
│   └── utils/
│       └── validator.test.js
│
└── integration/
    └── api.test.js
```

### Architecture Evolution

**Phase 1: MVP (Current Project)**
```
✅ Simple structure
✅ Basic separation (routes, views, public)
✅ Perfect for learning & prototypes
```

**Phase 2: Growing App**
```
✅ Split large route files
✅ Add controllers layer
✅ Introduce middleware folder
✅ Add config management
```

**Phase 3: Production App**
```
✅ Feature-based structure
✅ Service layer for business logic
✅ Repository pattern for data access
✅ Comprehensive error handling
✅ Logging & monitoring
✅ Testing at all layers
```

### Key Architecture Principles

#### 1. Separation of Concerns
Each file/folder has ONE clear purpose:
- `app.js` → Setup only
- `routes/` → URL handling only
- `views/` → Presentation only

#### 2. Single Responsibility
Each route does ONE thing well:
```javascript
// ❌ Bad: Route does too much
router.get('/', async (req, res) => {
    // Fetch APOD
    // Validate data
    // Transform data
    // Log analytics
    // Send email
    // Render view
});

// ✅ Good: Route orchestrates, delegates work
router.get('/', async (req, res) => {
    const apod = await apodService.getToday();
    res.render('index', { apod });
});
```

#### 3. Dependency Injection
Pass dependencies instead of hardcoding:
```javascript
// ✅ Good
export const createApodRouter = (apiClient) => {
    const router = express.Router();
    router.get('/', async (req, res) => {
        const data = await apiClient.fetch();
        res.json(data);
    });
    return router;
};
```

#### 4. Environment Awareness
```javascript
const isProduction = process.env.NODE_ENV === 'production';

if (isProduction) {
    app.use(helmet());
    app.use(compression());
} else {
    app.use(morgan('dev'));
}
```

### Folder Structure Checklist

| Folder | Purpose | Examples |
|--------|---------|----------|
| `routes/` | URL definitions | `index.js`, `api.js` |
| `controllers/` | Request handling logic | `apodController.js` |
| `services/` | Business logic | `apodService.js` |
| `models/` | Data structures | `Apod.js` |
| `middleware/` | Request interceptors | `auth.js`, `validation.js` |
| `views/` | Templates | `index.ejs` |
| `public/` | Static assets | `main.js`, `style.css` |
| `config/` | Configuration | `database.js`, `app.js` |
| `utils/` | Helper functions | `logger.js`, `formatter.js` |
| `tests/` | Test files | `apod.test.js` |

### Key Takeaways ✨

**For Small Projects (like ours):**
- Keep it simple: `app.js`, `routes/`, `views/`, `public/`
- Don't over-engineer early
- Focus on clear separation

**As You Scale:**
- Split routes by feature when files get large (>200 lines)
- Add controllers when routes have complex logic
- Add services when business logic needs to be reused
- Add tests when features become critical

**Always:**
- Keep `app.js` clean and declarative
- Use routers for organization
- Separate concerns (routing, logic, presentation)
- Use environment variables for configuration
- Document your architecture decisions

---

## Summary

### Most Important Lessons

1. **Axios Error Handling**
   - Separate data from errors in template props
   - Extract user-friendly messages from error objects
   - Handle different error types (network, HTTP status, timeout)

2. **Dotenv Best Practices**
   - Load at app startup
   - Never commit `.env` to git
   - Validate required variables
   - Use environment-specific configurations

3. **Express Router**
   - Create modular route files
   - Keep `app.js` clean
   - Mount routers with `app.use()`
   - Export with `export default router`

4. **Scalable Architecture**
   - Start simple, scale as needed
   - Separate concerns (routes, views, logic)
   - Feature-based or layer-based structure
   - Follow single responsibility principle

---

*Keep learning, keep building! 🚀*
