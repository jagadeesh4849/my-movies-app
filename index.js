const API_KEY = '61b652204ae079572dec5724957c7997';
const API_URL = 'https://api.themoviedb.org/3/search/movie';
const IMG_URL = 'https://image.tmdb.org/t/p/w500';

let favorites = [];
let userId = localStorage.getItem('userId');
if (!userId) {
    userId = 'user_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('userId', userId);
}

const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const languageFilter = document.getElementById('languageFilter');
const resultsDiv = document.getElementById('results');
const favoritesDiv = document.getElementById('favoritesGrid');
const typeFilter = document.getElementById('typeFilter');

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

searchBtn.addEventListener('click', searchMovies);
searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') searchMovies();
});
typeFilter.addEventListener('change', displayFavorites);

document.getElementById('tmdbSearchBtn').addEventListener('click', () => {
    const query = searchInput.value.trim();
    if (query) {
        window.open(`https://www.themoviedb.org/search?query=${encodeURIComponent(query)}`, '_blank');
    }
});

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
        if (tabId === 'favorites') displayFavorites();
        if (tabId === 'sync') displaySyncCode();
    });
});

async function searchMovies() {
    const query = searchInput.value.trim();
    if (!query) return;

    const language = languageFilter.value;
    const url = `${API_URL}?api_key=${API_KEY}&query=${encodeURIComponent(query)}${language ? '&language=' + language : ''}`;
    const response = await fetch(url);
    const data = await response.json();
    displayMovies(data.results, resultsDiv);
}

function displayMovies(movies, container) {
    if (!movies || movies.length === 0) {
        container.innerHTML = '<div class="no-results">No movies found</div>';
        return;
    }

    container.innerHTML = movies.map(movie => {
        const fav = favorites.find(f => f.id === movie.id);
        const isFavorite = !!fav;
        return `
            <div class="movie-card ${fav && fav.watched ? 'watched' : ''}" onclick="showMovieDetails(${movie.id})">
                ${fav && fav.watched ? '<div class="watched-badge">✓ Watched</div>' : ''}
                <button class="favorite-btn" onclick="event.stopPropagation(); addToFavorite(${movie.id}, '${movie.title.replace(/'/g, "\\'")}', '${movie.poster_path}', '${movie.release_date}')">${isFavorite ? '❤️' : '🤍'}</button>
                <img src="${movie.poster_path ? IMG_URL + movie.poster_path : 'https://via.placeholder.com/200x300?text=No+Image'}" alt="${movie.title}">
                <div class="movie-info">
                    <h3 class="movie-title">${movie.title}</h3>
                    <p class="movie-year">${movie.release_date ? movie.release_date.split('-')[0] : 'N/A'}</p>
                    ${isFavorite ? `<p class="movie-type">📁 ${fav.type}</p>` : ''}
                </div>
            </div>
        `;
    }).join('');
}

async function addToFavorite(id, title, poster, date) {
    const index = favorites.findIndex(fav => fav.id === id);
    if (index > -1) {
        favorites.splice(index, 1);
        await saveFavorites();
        if (document.getElementById('results').classList.contains('active')) {
            searchMovies();
        } else {
            displayFavorites();
        }
    } else {
        showTypeModal(id, title, poster, date);
    }
}

function showTypeModal(id, title, poster, date) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <h2>Select Movie Type</h2>
            <select id="movieType">
                <option value="Action">Action</option>
                <option value="Comedy">Comedy</option>
                <option value="Drama">Drama</option>
                <option value="Horror">Horror</option>
                <option value="Romance">Romance</option>
                <option value="Sci-Fi">Sci-Fi</option>
                <option value="Thriller">Thriller</option>
                <option value="Other">Other</option>
            </select>
            <div class="modal-buttons">
                <button class="button" onclick="saveWithType(${id}, '${title.replace(/'/g, "\\'")}', '${poster}', '${date}')">Save</button>
                <button class="button cancel" onclick="closeModal()">Cancel</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

async function saveWithType(id, title, poster, date) {
    const type = document.getElementById('movieType').value;
    favorites.push({ id, title, poster_path: poster, release_date: date, type, watched: false });
    await saveFavorites();
    closeModal();
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

async function showMovieDetails(id) {
    const response = await fetch(`https://api.themoviedb.org/3/movie/${id}?api_key=${API_KEY}`);
    const movie = await response.json();
    
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
    const filtered = selectedType ? favorites.filter(f => f.type === selectedType) : favorites;
    
    if (filtered.length === 0) {
        favoritesDiv.innerHTML = '<div class="no-results">No favorites yet. Add some movies!</div>';
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
    alert('Synced! Your favorites are now shared across devices.');
    location.reload();
}

// Initialize app
setTimeout(() => {
    loadFavorites();
}, 500);
