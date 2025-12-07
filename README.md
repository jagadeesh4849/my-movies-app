# My Movies App

A feature-rich movie search and watchlist management web application powered by TMDB API with cross-device synchronization.

🔗 **Live Demo**: [https://jagadeesh4849.github.io/my-movies-app/](https://jagadeesh4849.github.io/my-movies-app/)

## Features

- **Movie Search**: Search movies from TMDB's extensive database
- **IMDb Integration**: Add movies directly using IMDb URLs or IDs
- **Custom Movies**: Manually add movies not found in TMDB
- **Trending & Popular**: Browse what's trending today, this week, or currently popular
- **Watchlist Management**: Save movies with custom categories and tracking
- **Advanced Filters**: Filter by type (18 categories), language (English/Hindi/Telugu), and watched status
- **Cross-Device Sync**: Sync your watchlist across devices using Firebase
- **Dark Theme**: Modern black theme with responsive design

## Tech Stack

- HTML5, CSS3, JavaScript (Vanilla)
- TMDB API for movie data
- Firebase Firestore for cloud sync
- GitHub Pages for hosting

## Getting Started

### Local Development

1. Clone the repository:
```bash
git clone https://github.com/jagadeesh4849/my-movies-app.git
cd my-movies-app
```

2. Open `src/index.html` in your browser or use Live Server extension in VS Code

### Testing on Mobile

- Use browser DevTools (F12 → Ctrl+Shift+M) to test responsive design
- Or access via your local network IP address

## Usage

### Search Movies
- Enter movie name in search bar and click Search
- Use language filter to narrow results
- Click "Search on IMDb" to add movies via IMDb ID/URL

### Manage Watchlist
- Click ✓ or + button on any movie card to add to watchlist
- Select movie type (Action, Drama, etc.) and language
- Mark movies as watched/unwatched
- Filter watchlist by type, language, or watched status

### Sync Across Devices
1. Go to Sync tab
2. Copy your sync code
3. Enter the same code on another device
4. Your watchlist syncs automatically

### Custom Sync Codes
Create memorable sync codes via browser console:
```javascript
localStorage.setItem('userId', 'YOUR_CUSTOM_CODE');
location.reload();
```

## Movie Categories

Action, Adventure, Animation, Biography, Comedy, Crime, Documentary, Drama, Fantasy, Horror, Musical, Mystery, Romance, Sci-Fi, Thriller, War, Western, Other

## API Configuration

TMDB API Key: `61b652204ae079572dec5724957c7997`  
Firebase Project: `my-movies-833c3`

## Project Structure

```
my-web-app/
├── src/
│   ├── index.html          # Main HTML
│   ├── index.js            # Core JavaScript
│   ├── firebase-config.js  # Firebase setup
│   ├── styles/
│   │   └── style.css       # Styling
│   ├── Jag.png            # Logo
│   └── search-bg.png      # Background image
└── README.md
```

## Contributing

Fork the repository and submit pull requests for improvements.

## License

MIT License

## Disclaimer

This product uses the TMDB API but is not endorsed or certified by TMDB.
