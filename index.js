const API_KEY = '61b652204ae079572dec5724957c7997';
const API_URL = 'https://api.themoviedb.org/3/search/movie';
const IMG_URL = 'https://image.tmdb.org/t/p/w500';

let favorites = [];
let currentMovies = {};

let searchInput, searchBtn, languageFilter, resultsDiv, popularDiv, trendingTodayDiv, trendingWeekDiv, favoritesDiv, typeFilter, watchedFilter, languageFilterFav;

// Load favorites from Firebase
async function loadFavorites() {
    try {
        if (typeof db !== 'undefined') {
            const doc = await db.collection('users').doc(userId).get();
            if (doc.exists) {
                favorites = doc.data().favorites || [];
            }
        } else {
            throw new Error('Firebase not loaded');
        }
    } catch (error) {
        console.log('Loading from localStorage as fallback:', error);
        favorites = JSON.parse(localStorage.getItem('favorites')) || [];
    }
    displayFavorites();
    populateHeroPosters();
}

// Save favorites to Firebase
async function saveFavorites() {
    try {
        if (typeof db !== 'undefined') {
            await db.collection('users').doc(userId).set({
                favorites: favorites,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        }
        localStorage.setItem('favorites', JSON.stringify(favorites));
    } catch (error) {
        console.error('Error saving to Firebase:', error);
        localStorage.setItem('favorites', JSON.stringify(favorites));
    }
}



async function searchMovies() {
    const query = searchInput.value.trim();
    if (!query) return;

    const language = languageFilter.value;
    const url = `${API_URL}?api_key=${API_KEY}&query=${encodeURIComponent(query)}${language ? '&language=' + language : ''}`;
    const response = await fetch(url);
    const data = await response.json();
    displayMovies(data.results, resultsDiv);
    
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    document.querySelector('[data-tab="results"]').classList.add('active');
    resultsDiv.classList.add('active');
}

function displayMovies(movies, container) {
    if (!movies || movies.length === 0) {
        container.innerHTML = '<div class="no-results">No movies found</div>';
        return;
    }

    currentMovies = {};
    container.innerHTML = movies.map(movie => {
        currentMovies[movie.id] = movie;
        const fav = favorites.find(f => f.id === movie.id);
        const isFavorite = !!fav;
        const isCustom = movie.isCustom || (fav && fav.isCustom);
        let posterUrl = 'https://via.placeholder.com/200x300?text=No+Image';
        if (movie.poster_path && movie.poster_path !== 'null') {
            posterUrl = movie.poster_path.startsWith('http') || movie.poster_path.startsWith('data:') ? movie.poster_path : IMG_URL + movie.poster_path;
        }
        const detailsClick = isCustom ? `onclick="showCustomMovieDetails('${movie.id}')"` : `onclick="showMovieDetails(${movie.id})"`;
        const rating = movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A';
        const overview = movie.overview ? (movie.overview.length > 150 ? movie.overview.substring(0, 150) + '...' : movie.overview) : '';
        
        return `
            <div class="movie-card ${fav && fav.watched ? 'watched' : ''}" ${detailsClick}>
                ${fav && fav.watched ? '<div class="watched-badge">✓ Watched</div>' : ''}
                <button class="favorite-btn" onclick="handleFavoriteClick(event, '${movie.id}')">${isFavorite ? '✅' : '➕'}</button>
                <img src="${posterUrl}" alt="${movie.title}">
                <div class="movie-info">
                    <h3 class="movie-title">${movie.title}</h3>
                    <p class="movie-year">${movie.release_date ? movie.release_date.split('-')[0] : 'N/A'}</p>
                    ${!isCustom && movie.vote_average ? `<p class="movie-rating">⭐ ${rating}</p>` : ''}
                    ${isFavorite ? `<p class="movie-type">📁 ${fav.type}</p>` : ''}
                </div>
            </div>
        `;
    }).join('');
}

async function toggleFavorite(id) {
    console.log('toggleFavorite called with id:', id);
    const fav = favorites.find(f => f.id == id);
    if (fav) {
        console.log('Removing favorite:', fav.title);
        removeFavorite(id);
    } else {
        let movie = currentMovies[id];
        if (!movie) {
            // Fetch movie data from API if not in currentMovies
            try {
                const response = await fetch(`https://api.themoviedb.org/3/movie/${id}?api_key=${API_KEY}`);
                movie = await response.json();
            } catch (error) {
                console.error('Error fetching movie data:', error);
                return;
            }
        }
        if (movie) {
            showTypeModal(movie.id, movie.title, movie.poster_path, movie.release_date);
        }
    }
}

async function removeFavorite(id) {
    const index = favorites.findIndex(fav => fav.id == id);
    if (index > -1) {
        favorites.splice(index, 1);
        await saveFavorites();
        populateHeroPosters();
        if (document.getElementById('results').classList.contains('active')) {
            searchMovies();
        } else {
            displayFavorites();
        }
    }
}

let pendingMovie = null;

function showTypeModal(id, title, poster, date) {
    pendingMovie = {id, title, poster, date};
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <h2>Select Movie Details</h2>
            <select id="movieType" style="width: 100%; padding: 10px; margin: 10px 0; border: 1px solid #ddd; border-radius: 5px;">
                <option value="Action">Action</option>
                <option value="Adventure">Adventure</option>
                <option value="Animation">Animation</option>
                <option value="Biography">Biography</option>
                <option value="Comedy">Comedy</option>
                <option value="Crime">Crime</option>
                <option value="Documentary">Documentary</option>
                <option value="Drama">Drama</option>
                <option value="Fantasy">Fantasy</option>
                <option value="Horror">Horror</option>
                <option value="Musical">Musical</option>
                <option value="Mystery">Mystery</option>
                <option value="Romance">Romance</option>
                <option value="Sci-Fi">Sci-Fi</option>
                <option value="Thriller">Thriller</option>
                <option value="War">War</option>
                <option value="Western">Western</option>
                <option value="Other">Other</option>
            </select>
            <select id="movieLanguage" style="width: 100%; padding: 10px; margin: 10px 0; border: 1px solid #ddd; border-radius: 5px;">
                <option value="English">English</option>
                <option value="Hindi">Hindi</option>
                <option value="Telugu">Telugu</option>
            </select>
            <div class="modal-buttons">
                <button class="button" onclick="saveWithType()">Save</button>
                <button class="button cancel" onclick="closeModal()">Cancel</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

async function saveWithType() {
    if (!pendingMovie) return;
    const type = document.getElementById('movieType').value;
    const language = document.getElementById('movieLanguage').value;
    const {id, title, poster, date} = pendingMovie;
    const isCustom = (typeof id === 'string' && id.startsWith('custom_')) || (poster && poster.startsWith('data:'));
    favorites.push({ id, title, poster_path: poster || '', release_date: date || '', type, language, watched: false, isCustom });
    await saveFavorites();
    populateHeroPosters();
    closeModal();
    pendingMovie = null;
    if (document.getElementById('results').classList.contains('active')) {
        searchMovies();
    } else {
        displayFavorites();
    }
}

function closeModal() {
    const modal = document.querySelector('.modal');
    if (modal) modal.remove();
}

async function toggleWatched(id) {
    const fav = favorites.find(f => f.id === id);
    if (fav) {
        fav.watched = !fav.watched;
        await saveFavorites();
        closeModal();
        if (document.getElementById('favorites').classList.contains('active')) {
            displayFavorites();
        }
    }
}

function showCustomMovieDetails(id) {
    const movie = favorites.find(f => f.id == id);
    if (!movie) return;
    
    const posterUrl = movie.poster_path && movie.poster_path.startsWith('http') || movie.poster_path && movie.poster_path.startsWith('data:') ? movie.poster_path : 'https://via.placeholder.com/300x450?text=No+Image';
    
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.onclick = (e) => { if (e.target === modal) closeModal(); };
    modal.innerHTML = `
        <div class="modal-content details-modal">
            <button class="close-btn" onclick="closeModal()">×</button>
            <div class="details-content">
                <img src="${posterUrl}" alt="${movie.title}">
                <div class="details-info">
                    <h2>${movie.title}</h2>
                    <p><strong>Release Date:</strong> ${movie.release_date ? movie.release_date.split('-')[0] : 'N/A'}</p>
                    <p><strong>Type:</strong> 📁 ${movie.type}</p>
                    <label class="watched-checkbox">
                        <input type="checkbox" ${movie.watched ? 'checked' : ''} onchange="toggleWatched('${id}')">
                        <span>Mark as Watched</span>
                    </label>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

async function showMovieDetails(id) {
    const [movieResponse, providersResponse] = await Promise.all([
        fetch(`https://api.themoviedb.org/3/movie/${id}?api_key=${API_KEY}`),
        fetch(`https://api.themoviedb.org/3/movie/${id}/watch/providers?api_key=${API_KEY}`)
    ]);
    const movie = await movieResponse.json();
    const providers = await providersResponse.json();
    
    const fav = favorites.find(f => f.id === id);
    const isWatched = fav && fav.watched;
    
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.onclick = (e) => { if (e.target === modal) closeModal(); };
    modal.innerHTML = `
        <div class="modal-content details-modal">
            <button class="close-btn" onclick="closeModal()">×</button>
            <div class="details-content">
                <img src="${movie.poster_path ? IMG_URL + movie.poster_path : 'https://via.placeholder.com/300x450?text=No+Image'}" alt="${movie.title}">
                <div class="details-info">
                    <h2>${movie.title}</h2>
                    <p class="tagline">${movie.tagline || ''}</p>
                    <p><strong>Release Date:</strong> ${movie.release_date || 'N/A'}</p>
                    <p><strong>Rating:</strong> ⭐ ${movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A'}/10</p>
                    <p><strong>Runtime:</strong> ${movie.runtime ? movie.runtime + ' min' : 'N/A'}</p>
                    <p><strong>Genres:</strong> ${movie.genres ? movie.genres.map(g => g.name).join(', ') : 'N/A'}</p>
                    ${getStreamingInfo(providers)}
                    <p class="overview"><strong>Overview:</strong><br>${movie.overview || 'No description available.'}</p>
                    ${fav ? `
                        <label class="watched-checkbox">
                            <input type="checkbox" ${isWatched ? 'checked' : ''} onchange="toggleWatched(${id})">
                            <span>Mark as Watched</span>
                        </label>
                    ` : ''}
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

function displayFavorites() {
    const selectedType = typeFilter.value;
    const selectedWatched = watchedFilter.value;
    const selectedLanguage = languageFilterFav.value;
    
    let filtered = favorites;
    if (selectedType) filtered = filtered.filter(f => f.type === selectedType);
    if (selectedWatched === 'watched') filtered = filtered.filter(f => f.watched);
    if (selectedWatched === 'unwatched') filtered = filtered.filter(f => !f.watched);
    if (selectedLanguage) filtered = filtered.filter(f => f.language === selectedLanguage);
    
    if (filtered.length === 0) {
        favoritesDiv.innerHTML = '<div class="no-results">No movies in watchlist yet. Add some movies!</div>';
        return;
    }
    displayMovies(filtered, favoritesDiv);
}

function displaySyncCode() {
    document.getElementById('syncCode').value = userId;
}

function copySyncCode() {
    const syncCode = document.getElementById('syncCode');
    syncCode.select();
    syncCode.setSelectionRange(0, 99999);
    navigator.clipboard.writeText(syncCode.value).then(() => {
        alert('Sync code copied! Paste it on your other device.');
    }).catch(() => {
        document.execCommand('copy');
        alert('Sync code copied! Paste it on your other device.');
    });
}

async function applySyncCode() {
    const newUserId = document.getElementById('enterSyncCode').value.trim();
    if (!newUserId) {
        alert('Please enter a sync code');
        return;
    }
    
    localStorage.setItem('userId', newUserId);
    userId = newUserId;
    await loadFavorites();
    alert('Synced! Your watchlist is now shared across devices.');
    location.reload();
}

function showAddCustomMovie() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <h2>Add Movie</h2>
            <input type="text" id="imdbInput" placeholder="IMDb URL or ID (e.g., tt0111161)" style="width: 100%; padding: 10px; margin: 10px 0; border: 1px solid #ddd; border-radius: 5px;">
            <button class="button" onclick="searchByImdb()" style="width: 100%; margin-bottom: 15px;">Search by IMDb</button>
            <p style="text-align: center; margin: 10px 0;">OR</p>
            <input type="text" id="customTitle" placeholder="Movie Title" style="width: 100%; padding: 10px; margin: 10px 0; border: 1px solid #ddd; border-radius: 5px;">
            <input type="text" id="customYear" placeholder="Year (e.g., 2024)" style="width: 100%; padding: 10px; margin: 10px 0; border: 1px solid #ddd; border-radius: 5px;">
            <input type="text" id="customPoster" placeholder="Poster URL (optional)" style="width: 100%; padding: 10px; margin: 10px 0; border: 1px solid #ddd; border-radius: 5px;">
            <select id="customType" style="width: 100%; padding: 10px; margin: 10px 0; border: 1px solid #ddd; border-radius: 5px;">
                <option value="Action">Action</option>
                <option value="Adventure">Adventure</option>
                <option value="Animation">Animation</option>
                <option value="Biography">Biography</option>
                <option value="Comedy">Comedy</option>
                <option value="Crime">Crime</option>
                <option value="Documentary">Documentary</option>
                <option value="Drama">Drama</option>
                <option value="Fantasy">Fantasy</option>
                <option value="Horror">Horror</option>
                <option value="Musical">Musical</option>
                <option value="Mystery">Mystery</option>
                <option value="Romance">Romance</option>
                <option value="Sci-Fi">Sci-Fi</option>
                <option value="Thriller">Thriller</option>
                <option value="War">War</option>
                <option value="Western">Western</option>
                <option value="Other">Other</option>
            </select>
            <select id="customLanguage" style="width: 100%; padding: 10px; margin: 10px 0; border: 1px solid #ddd; border-radius: 5px;">
                <option value="English">English</option>
                <option value="Hindi">Hindi</option>
                <option value="Telugu">Telugu</option>
            </select>
            <div class="modal-buttons">
                <button class="button" onclick="saveCustomMovie()">Add to Watchlist</button>
                <button class="button cancel" onclick="closeModal()">Cancel</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

async function saveCustomMovie() {
    const title = document.getElementById('customTitle').value.trim();
    const year = document.getElementById('customYear').value.trim();
    const poster = document.getElementById('customPoster').value.trim();
    const type = document.getElementById('customType').value;
    const language = document.getElementById('customLanguage').value;
    
    if (!title) {
        alert('Please enter a movie title');
        return;
    }
    
    if (tmdbMovieData) {
        favorites.push({ 
            id: tmdbMovieData.id, 
            title: tmdbMovieData.title, 
            poster_path: tmdbMovieData.poster_path, 
            release_date: tmdbMovieData.release_date, 
            type, 
            language,
            watched: false,
            isCustom: false
        });
        tmdbMovieData = null;
    } else {
        const customId = 'custom_' + Date.now();
        const releaseDate = year ? `${year}-01-01` : '';
        const posterPath = poster || null;
        
        favorites.push({ 
            id: customId, 
            title, 
            poster_path: posterPath, 
            release_date: releaseDate, 
            type, 
            language,
            watched: false,
            isCustom: true
        });
    }
    
    await saveFavorites();
    populateHeroPosters();
    closeModal();
    displayFavorites();
}

let tmdbMovieData = null;

async function searchByImdb() {
    const input = document.getElementById('imdbInput').value.trim();
    if (!input) return;
    
    let imdbId = input;
    if (input.includes('imdb.com')) {
        const match = input.match(/tt\d+/);
        if (match) imdbId = match[0];
    }
    
    if (!imdbId.startsWith('tt')) {
        alert('Invalid IMDb ID. Should be like tt0111161');
        return;
    }
    
    try {
        const response = await fetch(`https://api.themoviedb.org/3/find/${imdbId}?api_key=${API_KEY}&external_source=imdb_id`);
        const data = await response.json();
        
        if (data.movie_results && data.movie_results.length > 0) {
            const movie = data.movie_results[0];
            tmdbMovieData = movie;
            document.getElementById('customTitle').value = movie.title;
            document.getElementById('customYear').value = movie.release_date ? movie.release_date.split('-')[0] : '';
            document.getElementById('customPoster').value = movie.poster_path ? IMG_URL + movie.poster_path : '';
        } else {
            tmdbMovieData = null;
            alert('Movie not found in TMDB. Please enter details manually.');
        }
    } catch (error) {
        tmdbMovieData = null;
        alert('Error searching TMDB. Please enter details manually.');
    }
}

async function loadPopularMovies() {
    const response = await fetch(`https://api.themoviedb.org/3/movie/popular?api_key=${API_KEY}&language=en-US&page=1`);
    const data = await response.json();
    displayMovies(data.results, popularDiv);
}

async function loadTrendingToday() {
    const response = await fetch(`https://api.themoviedb.org/3/trending/movie/day?api_key=${API_KEY}`);
    const data = await response.json();
    displayMovies(data.results, trendingTodayDiv);
}

async function loadTrendingWeek() {
    const response = await fetch(`https://api.themoviedb.org/3/trending/movie/week?api_key=${API_KEY}`);
    const data = await response.json();
    displayMovies(data.results, trendingWeekDiv);
}

function populateHeroPosters() {
    const headerPosters = document.getElementById('headerPosters');
    if (!headerPosters || favorites.length === 0) {
        headerPosters.innerHTML = '';
        return;
    }
    
    // Create multiple sets for better infinite scroll
    const postersToShow = [...favorites, ...favorites, ...favorites, ...favorites];
    
    headerPosters.innerHTML = postersToShow.map(movie => {
        let posterUrl = 'https://via.placeholder.com/60x90?text=No+Image';
        if (movie.poster_path && movie.poster_path !== 'null') {
            posterUrl = movie.poster_path.startsWith('http') || movie.poster_path.startsWith('data:') ? movie.poster_path : IMG_URL + movie.poster_path;
        }
        const isCustom = movie.isCustom;
        const clickHandler = isCustom ? `showCustomMovieDetails('${movie.id}')` : `showMovieDetails(${movie.id})`;
        return `
            <div class="header-poster" onclick="${clickHandler}">
                <img src="${posterUrl}" alt="${movie.title}">
            </div>
        `;
    }).join('');
}

function getStreamingInfo(providers) {
    const indiaProviders = providers?.results?.IN;
    if (!indiaProviders) {
        return '<p><strong>Streaming in India:</strong> Not available</p>';
    }
    
    let streamingHtml = '';
    
    if (indiaProviders.flatrate && indiaProviders.flatrate.length > 0) {
        const platforms = indiaProviders.flatrate.map(p => p.provider_name).join(', ');
        streamingHtml += `<p><strong>🎬 Stream:</strong> ${platforms}</p>`;
    }
    
    if (indiaProviders.rent && indiaProviders.rent.length > 0) {
        const platforms = indiaProviders.rent.map(p => p.provider_name).join(', ');
        streamingHtml += `<p><strong>💰 Rent:</strong> ${platforms}</p>`;
    }
    
    if (indiaProviders.buy && indiaProviders.buy.length > 0) {
        const platforms = indiaProviders.buy.map(p => p.provider_name).join(', ');
        streamingHtml += `<p><strong>🛒 Buy:</strong> ${platforms}</p>`;
    }
    
    return streamingHtml || '<p><strong>Streaming in India:</strong> Not available</p>';
}

function handleFavoriteClick(event, movieId) {
    event.preventDefault();
    event.stopPropagation();
    console.log('Favorite button clicked for movie:', movieId);
    toggleFavorite(movieId);
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Initialize DOM elements
    searchInput = document.getElementById('searchInput');
    searchBtn = document.getElementById('searchBtn');
    languageFilter = document.getElementById('languageFilter');
    resultsDiv = document.getElementById('results');
    popularDiv = document.getElementById('popular');
    trendingTodayDiv = document.getElementById('trendingToday');
    trendingWeekDiv = document.getElementById('trendingWeek');
    favoritesDiv = document.getElementById('favoritesGrid');
    typeFilter = document.getElementById('typeFilter');
    watchedFilter = document.getElementById('watchedFilter');
    languageFilterFav = document.getElementById('languageFilterFav');
    
    // Add event listeners
    if (searchBtn) searchBtn.addEventListener('click', searchMovies);
    if (searchInput) searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') searchMovies();
    });
    if (typeFilter) typeFilter.addEventListener('change', displayFavorites);
    if (watchedFilter) watchedFilter.addEventListener('change', displayFavorites);
    if (languageFilterFav) languageFilterFav.addEventListener('change', displayFavorites);
    
    const imdbBtn = document.getElementById('imdbSearchBtn');
    if (imdbBtn) {
        imdbBtn.addEventListener('click', () => {
            const query = searchInput.value.trim();
            if (query) {
                window.open(`https://www.imdb.com/find?q=${encodeURIComponent(query)}`, '_blank');
            }
        });
    }
    
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            btn.classList.add('active');
            const tabId = btn.dataset.tab;
            const tabElement = document.getElementById(tabId);
            if (tabElement) {
                tabElement.classList.add('active');
            }
            if (tabId === 'popular') loadPopularMovies();
            if (tabId === 'trendingToday') loadTrendingToday();
            if (tabId === 'trendingWeek') loadTrendingWeek();
            if (tabId === 'favorites') displayFavorites();
            if (tabId === 'sync') displaySyncCode();
        });
    });
    
    // Load initial data
    loadFavorites();
    loadPopularMovies();
});
