// app.js - JavaScript for OMEGA-MOVIES functionality

// API Configuration
const API_CONFIG = {
    baseUrl: 'https://api.themoviedb.org/3',
    apiKey: '87ecd1ca6e71cf8a307a9540f9401401', // Replace with your actual API key
    imageBaseUrl: 'https://image.tmdb.org/t/p/w500',
    backdropBaseUrl: 'https://image.tmdb.org/t/p/original'
};

// Movie Data Cache
let movieDataCache = {
    trending: null,
    latest: null,
    tvShows: null
};

document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing OMEGA-MOVIES...');
    
    // Hide loading screen immediately
    const loadingScreen = document.getElementById('loading-screen');
    if (loadingScreen) {
        loadingScreen.style.opacity = '0';
        setTimeout(() => {
            loadingScreen.style.display = 'none';
        }, 500);
    }

    // Initialize the application
    initializeApp();
});

async function initializeApp() {
    try {
        // Initialize Swiper
        initializeSwiper();
        
        // Load all movie data
        await loadAllMovieData();
        
        // Set up event listeners
        setupEventListeners();
        
        console.log('OMEGA-MOVIES initialized successfully');
    } catch (error) {
        console.error('Error initializing app:', error);
        // Fallback to static data if API fails
        loadStaticData();
    }
}

function initializeSwiper() {
    if (typeof Swiper !== 'undefined') {
        const swiper = new Swiper('.mainSwiper', {
            loop: true,
            autoplay: {
                delay: 5000,
                disableOnInteraction: false,
            },
            pagination: {
                el: '.swiper-pagination',
                clickable: true,
            },
            navigation: {
                nextEl: '.swiper-button-next',
                prevEl: '.swiper-button-prev',
            },
            effect: 'fade',
            fadeEffect: {
                crossFade: true
            },
        });
        console.log('Swiper initialized successfully');
    }
}

async function loadAllMovieData() {
    try {
        // Show loading states
        showSectionLoading('trending-movies');
        showSectionLoading('latest-movies');
        showSectionLoading('tv-shows');

        // Load data in parallel
        const [trending, latest, tvShows] = await Promise.all([
            fetchMovies('trending'),
            fetchMovies('latest'),
            fetchMovies('tvShows')
        ]);

        // Populate sections
        populateSection('trending-movies', trending, 'movie');
        populateSection('latest-movies', latest, 'movie');
        populateSection('tv-shows', tvShows, 'tv');

        // Update hero slider with trending movies
        updateHeroSlider(trending.slice(0, 3));

    } catch (error) {
        console.error('Error loading movie data:', error);
        throw error;
    }
}

async function fetchMovies(type) {
    // Check cache first
    if (movieDataCache[type]) {
        return movieDataCache[type];
    }

    let endpoint = '';
    
    switch (type) {
        case 'trending':
            endpoint = `${API_CONFIG.baseUrl}/trending/movie/week?api_key=${API_CONFIG.apiKey}`;
            break;
        case 'latest':
            endpoint = `${API_CONFIG.baseUrl}/movie/now_playing?api_key=${API_CONFIG.apiKey}&language=en-US&page=1`;
            break;
        case 'tvShows':
            endpoint = `${API_CONFIG.baseUrl}/tv/popular?api_key=${API_CONFIG.apiKey}&language=en-US&page=1`;
            break;
        default:
            throw new Error('Invalid movie type');
    }

    try {
        const response = await fetch(endpoint);
        
        if (!response.ok) {
            throw new Error(`API response error: ${response.status}`);
        }
        
        const data = await response.json();
        const movies = data.results.slice(0, 8); // Get first 8 results
        
        // Cache the results
        movieDataCache[type] = movies;
        
        return movies;
    } catch (error) {
        console.error(`Error fetching ${type} movies:`, error);
        throw error;
    }
}

function populateSection(sectionId, movies, type) {
    const section = document.getElementById(sectionId);
    if (!section) return;

    section.innerHTML = movies.map((movie, index) => 
        createMovieCard(movie, type)
    ).join('');

    // Hide loading state
    hideSectionLoading(sectionId);
}

function createMovieCard(movie, type = 'movie') {
    const title = type === 'movie' ? movie.title : movie.name;
    const releaseDate = type === 'movie' ? movie.release_date : movie.first_air_date;
    const year = releaseDate ? new Date(releaseDate).getFullYear() : 'N/A';
    const rating = movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A';
    
    // Use backdrop image if available, otherwise use poster
    const imageUrl = movie.backdrop_path 
        ? `${API_CONFIG.imageBaseUrl}${movie.backdrop_path}`
        : movie.poster_path 
            ? `${API_CONFIG.imageBaseUrl}${movie.poster_path}`
            : 'images/placeholder.jpg'; // Fallback image

    return `
        <div class="movie-card" data-id="${movie.id}" data-type="${type}">
            <div class="movie-poster">
                <img src="${imageUrl}" alt="${title}" loading="lazy" onerror="this.src='images/placeholder.jpg'">
                <div class="movie-overlay">
                    <div class="quick-actions">
                        <button class="quick-action-btn play-btn">
                            <i class="fas fa-play"></i>
                        </button>
                        <button class="quick-action-btn add-btn">
                            <i class="fas fa-plus"></i>
                        </button>
                        <button class="quick-action-btn info-btn">
                            <i class="fas fa-info"></i>
                        </button>
                    </div>
                </div>
            </div>
            <div class="movie-info">
                <h3 class="movie-title-small">${title}</h3>
                <div class="movie-meta-small">
                    <span>${year}</span>
                    <span class="movie-rating">
                        <i class="fas fa-star"></i> ${rating}
                    </span>
                </div>
            </div>
        </div>
    `;
}

function updateHeroSlider(movies) {
    const swiperWrapper = document.querySelector('.swiper-wrapper');
    if (!swiperWrapper) return;

    const slides = movies.map((movie, index) => {
        const backdropUrl = movie.backdrop_path 
            ? `${API_CONFIG.backdropBaseUrl}${movie.backdrop_path}`
            : `images/Latest/${index + 7}.jpg`; // Fallback to local images

        return `
            <div class="swiper-slide">
                <div class="hero-slide">
                    <div class="slide-background">
                        <img src="${backdropUrl}" alt="${movie.title}" class="bg-image" onerror="this.src='images/Latest/${index + 7}.jpg'">
                        <div class="bg-overlay"></div>
                    </div>
                    <div class="slide-content">
                        <div class="content-wrapper">
                            <span class="quality-badge">HD</span>
                            <h1 class="movie-title">${movie.title}</h1>
                            <div class="movie-meta">
                                <span class="year">${new Date(movie.release_date).getFullYear()}</span>
                                <span class="duration">${Math.floor(Math.random() * 60) + 90}m</span>
                                <span class="rating"><i class="fas fa-star"></i> ${movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A'}/10</span>
                            </div>
                            <p class="movie-description">
                                ${movie.overview ? movie.overview.substring(0, 150) + '...' : 'Description not available.'}
                            </p>
                            <div class="movie-tags">
                                <span class="tag">Action</span>
                                <span class="tag">Adventure</span>
                            </div>
                            <div class="action-buttons">
                                <button class="btn btn-primary play-btn" data-id="${movie.id}">
                                    <i class="fas fa-play"></i> Watch Now
                                </button>
                                <button class="btn btn-secondary add-btn" data-id="${movie.id}">
                                    <i class="fas fa-plus"></i> Add to List
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    swiperWrapper.innerHTML = slides;
    
    // Reinitialize swiper with new content
    if (typeof Swiper !== 'undefined') {
        setTimeout(() => {
            const swiper = new Swiper('.mainSwiper', {
                loop: true,
                autoplay: {
                    delay: 5000,
                    disableOnInteraction: false,
                },
                pagination: {
                    el: '.swiper-pagination',
                    clickable: true,
                },
                navigation: {
                    nextEl: '.swiper-button-next',
                    prevEl: '.swiper-button-prev',
                },
                effect: 'fade',
                fadeEffect: {
                    crossFade: true
                },
            });
        }, 100);
    }
}

function setupEventListeners() {
    // Theme Toggle
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        const themeIcon = themeToggle.querySelector('i');
        
        // Check for saved theme preference
        if (localStorage.getItem('theme') === 'dark' || 
            (window.matchMedia('(prefers-color-scheme: dark)').matches && !localStorage.getItem('theme'))) {
            document.body.classList.add('dark-theme');
            if (themeIcon) {
                themeIcon.classList.remove('fa-moon');
                themeIcon.classList.add('fa-sun');
            }
        }
        
        themeToggle.addEventListener('click', function() {
            document.body.classList.toggle('dark-theme');
            
            if (document.body.classList.contains('dark-theme')) {
                if (themeIcon) {
                    themeIcon.classList.remove('fa-moon');
                    themeIcon.classList.add('fa-sun');
                }
                localStorage.setItem('theme', 'dark');
            } else {
                if (themeIcon) {
                    themeIcon.classList.remove('fa-sun');
                    themeIcon.classList.add('fa-moon');
                }
                localStorage.setItem('theme', 'light');
            }
        });
    }

    // Scroll Progress Indicator
    const progress = document.getElementById('progress');
    const progressValue = document.getElementById('progress-value');
    
    if (progress && progressValue) {
        window.onscroll = function() {
            const totalHeight = document.body.scrollHeight - window.innerHeight;
            const progressHeight = (window.pageYOffset / totalHeight) * 100;
            
            if (window.pageYOffset > 100) {
                progress.style.opacity = '1';
            } else {
                progress.style.opacity = '0';
            }
        };
        
        progressValue.addEventListener('click', function() {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }

    // Search functionality
    const searchInput = document.querySelector('.search-input');
    const searchForm = document.querySelector('.search-box');
    
    if (searchForm) {
        searchForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const searchTerm = searchInput ? searchInput.value.trim() : '';
            if (searchTerm) {
                performSearch(searchTerm);
            }
        });
    }

    // Mobile menu toggle
    const menuBtn = document.getElementById('menu-btn');
    if (menuBtn) {
        menuBtn.addEventListener('change', function() {
            document.body.style.overflow = this.checked ? 'hidden' : 'auto';
        });
    }

    // Delegate click events for dynamic content
    document.addEventListener('click', function(e) {
        // Play button
        if (e.target.closest('.play-btn')) {
            const movieCard = e.target.closest('.movie-card');
            const movieId = movieCard ? movieCard.dataset.id : null;
            const movieTitle = movieCard ? 
                movieCard.querySelector('.movie-title-small').textContent :
                (e.target.closest('.hero-slide') ? e.target.closest('.hero-slide').querySelector('.movie-title').textContent : 'Movie');
            
            if (movieId) {
                playMovie(movieId, movieTitle);
            } else {
                alert(`Now playing: ${movieTitle}`);
            }
        }
        
        // Add to list button
        if (e.target.closest('.add-btn')) {
            const movieCard = e.target.closest('.movie-card');
            const movieId = movieCard ? movieCard.dataset.id : null;
            const movieTitle = movieCard ? 
                movieCard.querySelector('.movie-title-small').textContent :
                (e.target.closest('.hero-slide') ? e.target.closest('.hero-slide').querySelector('.movie-title').textContent : 'Movie');
            
            if (movieId) {
                addToWatchlist(movieId, movieTitle);
            } else {
                alert(`Added "${movieTitle}" to your list`);
            }
        }
        
        // Info button
        if (e.target.closest('.info-btn')) {
            const movieCard = e.target.closest('.movie-card');
            const movieId = movieCard ? movieCard.dataset.id : null;
            const movieTitle = movieCard ? 
                movieCard.querySelector('.movie-title-small').textContent :
                (e.target.closest('.hero-slide') ? e.target.closest('.hero-slide').querySelector('.movie-title').textContent : 'Movie');
            
            if (movieId) {
                showMovieDetails(movieId, movieTitle);
            } else {
                alert(`Showing details for: ${movieTitle}`);
            }
        }
    });

    // Refresh data button (you can add this to your HTML)
    const refreshBtn = document.createElement('button');
    refreshBtn.innerHTML = '<i class="fas fa-sync-alt"></i> Refresh';
    refreshBtn.className = 'btn btn-secondary';
    refreshBtn.style.marginLeft = '10px';
    refreshBtn.addEventListener('click', refreshData);
    
    const sectionHeaders = document.querySelectorAll('.section-header');
    if (sectionHeaders.length > 0) {
        sectionHeaders[0].appendChild(refreshBtn);
    }
}

// API Functions
async function performSearch(query) {
    try {
        const response = await fetch(
            `${API_CONFIG.baseUrl}/search/multi?api_key=${API_CONFIG.apiKey}&query=${encodeURIComponent(query)}&page=1`
        );
        
        if (!response.ok) {
            throw new Error('Search failed');
        }
        
        const data = await response.json();
        displaySearchResults(data.results);
    } catch (error) {
        console.error('Search error:', error);
        alert('Search failed. Please try again.');
    }
}

function displaySearchResults(results) {
    // You can implement a search results modal or page here
    console.log('Search results:', results);
    alert(`Found ${results.length} results for your search`);
}

function playMovie(movieId, title) {
    // Implement your video player logic here
    console.log(`Playing movie ${movieId}: ${title}`);
    alert(`Now playing: ${title}`);
}

function addToWatchlist(movieId, title) {
    // Implement watchlist logic here
    let watchlist = JSON.parse(localStorage.getItem('watchlist') || '[]');
    if (!watchlist.includes(movieId)) {
        watchlist.push(movieId);
        localStorage.setItem('watchlist', JSON.stringify(watchlist));
        alert(`Added "${title}" to your watchlist`);
    } else {
        alert(`"${title}" is already in your watchlist`);
    }
}

function showMovieDetails(movieId, title) {
    // Implement movie details modal or page here
    console.log(`Showing details for movie ${movieId}: ${title}`);
    alert(`Showing details for: ${title}`);
}

async function refreshData() {
    try {
        // Clear cache
        movieDataCache = { trending: null, latest: null, tvShows: null };
        
        // Show loading states
        showSectionLoading('trending-movies');
        showSectionLoading('latest-movies');
        showSectionLoading('tv-shows');
        
        // Reload data
        await loadAllMovieData();
        
        alert('Data refreshed successfully!');
    } catch (error) {
        console.error('Error refreshing data:', error);
        alert('Error refreshing data. Please try again.');
    }
}

// Utility Functions
function showSectionLoading(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        section.innerHTML = `
            <div class="loading-placeholder">
                <div class="spinner-small"></div>
                <p>Loading...</p>
            </div>
        `.repeat(8);
    }
}

function hideSectionLoading(sectionId) {
    // Loading state is automatically removed when content is populated
}

function loadStaticData() {
    console.log('Loading static data as fallback');
    // Your existing static data would go here
    // This ensures the site works even if API fails
}

// Fallback: If everything else fails, hide loading screen after 3 seconds
setTimeout(() => {
    const loadingScreen = document.getElementById('loading-screen');
    if (loadingScreen && loadingScreen.style.display !== 'none') {
        console.log('Fallback: Hiding loading screen after timeout');
        loadingScreen.style.opacity = '0';
        setTimeout(() => {
            loadingScreen.style.display = 'none';
        }, 500);
    }
}, 3000);