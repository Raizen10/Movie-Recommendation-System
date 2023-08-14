const apiKey = "b26cb8b43f7f238483f4eef506d29034";
const tmdbBaseUrl = "https://api.themoviedb.org/3";
const numRecommendations = 6;

let isRecommendationMode = true; // Default mode is movie recommendation

// Function to get movie recommendations based on user input
async function getRecommendedMovies() {
  const inputMovie = document.getElementById("inputMovie").value.trim();

  if (inputMovie === "") {
    alert("Please enter a movie title.");
    return;
  }

  try {
    const movieId = await getMovieId(inputMovie);
    if (movieId) {
      const recommendedMovies = await recommendMovies(
        movieId,
        numRecommendations
      );
      displayMovies(recommendedMovies);
      // Clear the input field after submitting the form
      document.getElementById("inputMovie").value = "";
    } else {
      alert("No movies found for the given title.");
    }
  } catch (error) {
    console.log("Error:", error);
    alert("Error occurred while fetching recommendations.");
  }
}

// Function to get TMDB movie ID using movie title
async function getMovieId(title) {
  const apiUrl = `${tmdbBaseUrl}/search/movie?api_key=${apiKey}&query=${encodeURIComponent(
    title
  )}`;

  const response = await fetch(apiUrl);
  const data = await response.json();

  if (data.results && data.results.length > 0) {
    return data.results[0].id;
  } else {
    return null;
  }
}

// Function to recommend movies using collaborative filtering
async function recommendMovies(movieId, numRecommendations) {
  const apiUrl = `${tmdbBaseUrl}/movie/${movieId}/recommendations?api_key=${apiKey}`;

  const response = await fetch(apiUrl);
  const data = await response.json();

  if (data.results && data.results.length > 0) {
    return data.results.slice(0, numRecommendations);
  } else {
    return [];
  }
}

// Function to display movies (used for both recommendations and form filters)
async function displayMovies(movies) {
  const moviesContainer = document.getElementById("movie-list");
  moviesContainer.innerHTML = "";

  if (movies.length === 0) {
    moviesContainer.innerHTML = "<p>No movies found.</p>";
    return;
  }

  for (const movie of movies) {
    const movieDetails = await getMovieDetails(movie.id);
    const movieDiv = createMovieElement(movie, movieDetails);
    moviesContainer.appendChild(movieDiv);
  }
}

// Function to create a movie element for displaying movies
function createMovieElement(movie, movieDetails) {
  const movieDiv = document.createElement("div");
  movieDiv.classList.add("movie");

  const posterImg = document.createElement("img");
  posterImg.src = `https://image.tmdb.org/t/p/w500/${movie.poster_path}`;
  posterImg.alt = `${movie.title} Poster`;
  posterImg.classList.add("movie-img");
  movieDiv.appendChild(posterImg);

  const movieInfoDiv = document.createElement("div");
  movieInfoDiv.classList.add("movie-info");

  const title = document.createElement("h2");
  title.textContent = movie.title;
  movieInfoDiv.appendChild(title);

  const year = document.createElement("p");
  year.textContent = `Year: ${movie.release_date.substring(0, 4)}`;
  movieInfoDiv.appendChild(year);

  const rating = document.createElement("p");
  rating.textContent = `Rating: ${movieDetails.rating}`;
  rating.classList.add("rating");
  movieInfoDiv.appendChild(rating);

  const director = document.createElement("p");
  director.textContent = `Director: ${movieDetails.director}`;
  director.classList.add("director");
  movieInfoDiv.appendChild(director);

  const genres = document.createElement("p");
  genres.textContent = `Genres: ${movieDetails.genres}`;
  genres.classList.add("genres");
  movieInfoDiv.appendChild(genres);

  movieDiv.appendChild(movieInfoDiv);

  return movieDiv;
}

// Function to get detailed movie information using the movie's ID from TMDB API
async function getMovieDetails(movieId) {
  const apiUrl = `${tmdbBaseUrl}/movie/${movieId}?api_key=${apiKey}&append_to_response=credits`;

  const response = await fetch(apiUrl);
  const data = await response.json();

  const director = data.credits.crew.find((crew) => crew.job === "Director");
  const directorName = director ? director.name : "Director not available";

  const genres = data.genres.map((genre) => genre.name).join(", ");

  return {
    rating: data.vote_average,
    director: directorName,
    genres: genres,
  };
}

// Function to toggle between movie recommendation and form filter modes
function toggleMode() {
  const modeSelect = document.getElementById("mode-select");
  modeSelect.addEventListener("change", function () {
    isRecommendationMode = modeSelect.value === "recommendation";

    const recommendationContainer =
      document.getElementById("recommendedMovies");
    const formFilterContainer = document.getElementById("formFilterContainer");
    const searchContainer = document.getElementById("searchContainer");

    if (isRecommendationMode) {
      recommendationContainer.style.display = "block";
      formFilterContainer.style.display = "none";
      searchContainer.style.display = "block";

      // Clear the form filter outputs and reset form inputs
      document.getElementById("movie-list").innerHTML = "";
      document.getElementById("movie-form").reset();
    } else {
      recommendationContainer.style.display = "none";
      formFilterContainer.style.display = "block";
      searchContainer.style.display = "none";

      // Clear the movie recommendations outputs
      document.getElementById("movie-list").innerHTML = "";
    }
  });
}    




// Function to apply form filters
function applyFormFilter() {
  const genre = document.getElementById("genre").value;
  const fromYear = document.getElementById("from-year").value;
  const toYear = document.getElementById("to-year").value;
  const fromRating = document.getElementById("from-rating").value;
  const toRating = document.getElementById("to-rating").value;

  // Call the function to fetch movies with the provided filters
  getFilteredMovies(genre, fromYear, toYear, fromRating, toRating);
}

// Function to get filtered movies based on form filter inputs
async function getFilteredMovies(
  genre,
  fromYear,
  toYear,
  fromRating,
  toRating
) {
  const apiUrl = `${tmdbBaseUrl}/discover/movie?api_key=${apiKey}&language=en-US&sort_by=popularity.desc&with_genres=${genre}&primary_release_date.gte=${fromYear}-01-01&primary_release_date.lte=${toYear}-12-31&vote_average.gte=${fromRating}&vote_average.lte=${toRating}`;

  try {
    const response = await fetch(apiUrl);
    const data = await response.json();

    // Clear the previous movie list
    document.getElementById("movie-list").innerHTML = "";

    if (data.results.length === 0) {
      document.getElementById("movie-list").innerHTML =
        "No movies found with the given filters.";
    } else {
      const moviesToShow = data.results.slice(0, 6); // Limiting to show only 5 movies

      moviesToShow.forEach(async (movie) => {
        const movieDetails = await getMovieDetails(movie.id);
        const movieDiv = createMovieElement(movie, movieDetails);
        document.getElementById("movie-list").appendChild(movieDiv);
      });
    }

    // Clear the form filter inputs after submission
    document.getElementById("movie-form").reset();
  } catch (error) {
    console.error("Error fetching data:", error);
    document.getElementById("movie-list").innerHTML =
      "Error fetching data. Please try again later.";
  }
}

// Function to initialize the app
function initializeApp() {
  toggleMode();
  // Attach event listeners to buttons
  const searchButton = document.getElementById("searchButton");
  if (searchButton) {
    searchButton.addEventListener("click", getRecommendedMovies);
  }

  const formFilterSubmit = document.getElementById("applyFilter");
  if (formFilterSubmit) {
    formFilterSubmit.addEventListener("click", applyFormFilter);
  }
}

// Call the initializeApp function when the page loads
initializeApp();


