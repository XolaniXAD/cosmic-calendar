# 🌌 Cosmic Calendar

An immersive web application that showcases NASA's Astronomy Picture of the Day (APOD) with a beautiful, interactive interface. Explore the cosmos through stunning images and videos, browse historical astronomical content, and enjoy an immersive focus mode for distraction-free viewing.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D14.0.0-brightgreen.svg)

## ✨ Features

- **Daily APOD Display**: Automatically loads a random NASA Astronomy Picture of the Day on each visit
- **Historical Archive**: Browse through NASA's APOD archive dating back to June 16, 1995
- **Focus Mode**: Click the background to enter an immersive, distraction-free viewing experience
- **Video Support**: Seamlessly handles both images and video content from NASA
- **Responsive Design**: Optimized for mobile, tablet, and desktop viewing
- **Glassmorphism UI**: Modern, elegant interface with backdrop blur effects
- **Accessibility**: Full keyboard navigation and screen reader support
- **Performance Optimized**: Asset caching, lazy loading, and debounced API calls

## 🚀 Getting Started

### Prerequisites

- Node.js (version 14 or higher)
- npm (comes with Node.js)
- A NASA API key (free)

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd NASA-APOD
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Get your NASA API key**
   - Visit [NASA API Portal](https://api.nasa.gov/)
   - Click "Generate API Key"
   - Fill out the simple form (first name, last name, email)
   - Your API key will be sent to your email instantly

4. **Configure environment variables**
   - Create a `.env` file in the project root:
     ```bash
     touch .env
     ```
   - Add your NASA API key:
     ```
     NASA_API_KEY=your_api_key_here
     PORT=3000
     ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   - Navigate to `http://localhost:3000`
   - Enjoy exploring the cosmos! 🌠

## 📖 Usage

### Browsing APODs
- The app loads a random APOD on each refresh
- Click the **calendar icon** in the top-right to open the date picker
- Select any date from June 16, 1995 to today
- The content updates instantly without page reload

### Focus Mode
- Click anywhere on the **empty background** (not on cards or buttons)
- All UI elements fade away for immersive viewing
- Click the background again to restore the UI

### Keyboard Shortcuts
- **Escape**: Close the date picker modal
- **Tab**: Navigate through interactive elements

## 🛠️ Technology Stack

- **Backend**: Express.js (Node.js web framework)
- **Templating**: EJS (Embedded JavaScript)
- **HTTP Client**: Axios
- **Styling**: Tailwind CSS
- **Icons**: Google Material Symbols
- **Fonts**: Inter, Space Mono

## 📁 Project Structure

```
NASA-APOD/
├── app.js                 # Express server configuration
├── package.json           # Dependencies and scripts
├── .env                   # Environment variables (not tracked)
├── .gitignore            # Git ignore rules
├── routes/
│   ├── index.js          # Server-side rendering route
│   └── api.js            # JSON API endpoint
├── views/
│   └── index.ejs         # Main HTML template
├── public/
│   └── main.js           # Client-side JavaScript
└── README.md             # This file
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NASA_API_KEY` | Your NASA API key | Yes |
| `PORT` | Server port (default: 3000) | No |

### NASA API Details

- **Endpoint**: `https://api.nasa.gov/planetary/apod`
- **Date Range**: June 16, 1995 - Present
- **Rate Limit**: 1000 requests/hour with API key
- **Media Types**: Images (JPEG, PNG) and Videos (YouTube embeds)

## 🎨 Features in Detail

### State Management
- Vanilla JavaScript with centralized state pattern
- React-inspired `setState()` function for UI updates
- Maintains: loading states, modal visibility, focus mode, error handling

### Performance Optimizations
- Static asset caching (1 day max-age with ETag)
- Debounced API calls (300ms delay)
- Lazy loading for images and videos
- Font preloading for faster initial render

### Accessibility Features
- ARIA labels on all icon buttons
- Keyboard navigation support
- Screen reader friendly
- Semantic HTML structure

## 🐛 Known Limitations

- Videos are YouTube embeds only (NASA's APOD format)
- API rate limited to 1000 requests/hour
- Requires internet connection to fetch APOD data
- Some historical dates may not have content available

## 📝 Scripts

| Script | Description |
|--------|-------------|
| `npm start` | Start production server |
| `npm run dev` | Start development server with auto-reload |

## 🤝 Contributing

This is a learning project, but suggestions are welcome! Feel free to fork and experiment.

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- NASA for providing the incredible APOD API
- Astronomy lovers and space enthusiasts worldwide
- The open-source community

## ⚖️ Content Attribution & Legal

**NASA Content Policy**:
- All images and videos are sourced from NASA's Astronomy Picture of the Day (APOD) API
- NASA content is generally in the public domain and free to use
- Some images are copyrighted by their respective authors (copyright info displayed when available)
- This is an unofficial project and is not endorsed by NASA

**API Usage**:
- This application uses NASA's official APOD API
- API Key required (free to obtain from api.nasa.gov)
- Rate limited to 1000 requests per hour

**Disclaimer**: 
This project is for educational and showcase purposes. All astronomical images and data are property of NASA and/or their respective copyright holders. Individual image copyrights are displayed in the application when provided by the APOD API.

## 📧 Contact

For questions or feedback, please open an issue on GitHub.

---

**Made with ❤️ and ☕ for space enthusiasts**
