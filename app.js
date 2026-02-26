// SkyFetch Weather Dashboard - Part 2: User Interaction

// DOM element references
const cityEl = document.getElementById("city");
const tempEl = document.getElementById("temp");
const descEl = document.getElementById("description");
const iconEl = document.getElementById("icon");
const searchInput = document.getElementById("search-input");
const searchBtn = document.getElementById("search-btn");
const loadingEl = document.getElementById("loading");
const errorMessageEl = document.getElementById("error-message");
const weatherCard = document.getElementById("weather");

// OpenWeatherMap API key - Get your free key at https://openweathermap.org/api
// Replace "YOUR_API_KEY" below with your actual API key
const apiKey = "YOUR_API_KEY";

// Initial city to display on load
const defaultCity = "London";

// Function to show loading state
function showLoading() {
    loadingEl.classList.add("show");
    weatherCard.classList.add("hidden");
}

// Function to hide loading state
function hideLoading() {
    loadingEl.classList.remove("show");
    weatherCard.classList.remove("hidden");
}

// Function to show error message
function showError(message) {
    errorMessageEl.textContent = message;
    errorMessageEl.classList.add("show");
}

// Function to hide error message
function hideError() {
    errorMessageEl.classList.remove("show");
}

// Function to update DOM with weather data
function updateDOM(data) {
    cityEl.textContent = data.name;
    tempEl.textContent = `${Math.round(data.main.temp)} °C`;
    descEl.textContent = data.weather[0].description;

    const iconCode = data.weather[0].icon;
    iconEl.src = `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
    iconEl.alt = data.weather[0].description;
}

// Async function to fetch weather data
async function fetchWeather(cityName) {
    // Validate input
    if (!cityName || cityName.trim() === "") {
        showError("Please enter a city name");
        hideLoading();
        return;
    }

    showLoading();
    hideError();

    const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(cityName)}&appid=${apiKey}&units=metric`;

    try {
        // Using async/await instead of .then()/.catch()
        const response = await axios.get(url);
        const data = response.data;
        updateDOM(data);
        hideLoading();
    } catch (error) {
        hideLoading();

        // Handle different types of errors
        if (error.response) {
            // Server responded with error status (e.g., 404 for city not found)
            if (error.response.status === 404) {
                showError(`City "${cityName}" not found. Please check the spelling and try again.`);
            } else {
                showError(`Error: ${error.response.data.message || "Unable to fetch weather data"}`);
            }
        } else if (error.request) {
            // No response received (network error)
            showError("Network error. Please check your internet connection and try again.");
        } else {
            // Other errors
            showError("An unexpected error occurred. Please try again.");
        }

        console.error("Error fetching weather:", error);
    }
}

// Event listener for search button click
searchBtn.addEventListener("click", () => {
    const cityName = searchInput.value.trim();
    fetchWeather(cityName);
});

// Event listener for Enter key in input field
searchInput.addEventListener("keypress", (event) => {
    if (event.key === "Enter") {
        const cityName = searchInput.value.trim();
        fetchWeather(cityName);
    }
});

// Event listener to clear error when user types
searchInput.addEventListener("input", () => {
    if (errorMessageEl.classList.contains("show")) {
        hideError();
    }
});

// Initial fetch on page load
fetchWeather(defaultCity);
