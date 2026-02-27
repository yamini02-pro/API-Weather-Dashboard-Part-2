// SkyFetch Weather Dashboard - Part 3: OOP & 5-Day Forecast

// ============================================
// WeatherApp Constructor Function
// ============================================
function WeatherApp() {
    // Store DOM references for performance
    this.cityEl = document.getElementById("city");
    this.tempEl = document.getElementById("temp");
    this.descEl = document.getElementById("description");
    this.iconEl = document.getElementById("icon");
    this.searchInput = document.getElementById("search-input");
    this.searchBtn = document.getElementById("search-btn");
    this.loadingEl = document.getElementById("loading");
    this.errorMessageEl = document.getElementById("error-message");
    this.weatherCard = document.getElementById("weather");

    // API configuration
    this.apiKey = "YOUR_API_KEY"; // Replace with your actual API key
    this.defaultCity = "London";
}

// ============================================
// Prototype Methods
// ============================================

// Initialize the application
WeatherApp.prototype.init = function () {
    // Bind event listeners with correct 'this' context
    this.searchBtn.addEventListener("click", this.handleSearch.bind(this));
    this.searchInput.addEventListener("keypress", (event) => {
        if (event.key === "Enter") {
            this.handleSearch();
        }
    });

    // Clear error when user types
    this.searchInput.addEventListener("input", () => {
        if (this.errorMessageEl.classList.contains("show")) {
            this.hideError();
        }
    });

    // Initial weather fetch
    this.getWeather(this.defaultCity);
};

// Handle search button click
WeatherApp.prototype.handleSearch = function () {
    const cityName = this.searchInput.value.trim();
    if (!cityName) {
        this.showError("Please enter a city name");
        return;
    }
    this.getWeather(cityName);
};

// Fetch both current weather and forecast using Promise.all()
WeatherApp.prototype.getWeather = async function (cityName) {
    this.showLoading();
    this.hideError();

    const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(cityName)}&appid=${this.apiKey}&units=metric`;
    const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(cityName)}&appid=${this.apiKey}&units=metric`;

    try {
        // Fetch both APIs simultaneously using Promise.all()
        const responses = await Promise.all([
            axios.get(weatherUrl),
            axios.get(forecastUrl)
        ]);

        const weatherData = responses[0].data;
        const forecastData = responses[1].data;

        // Display both weather and forecast
        this.displayWeather(weatherData);
        const processedForecast = this.processForecastData(forecastData);
        this.displayForecast(processedForecast);

        this.hideLoading();
    } catch (error) {
        this.hideLoading();

        // Handle different error types
        if (error.response) {
            if (error.response.status === 404) {
                this.showError(`City "${cityName}" not found. Please check the spelling and try again.`);
            } else {
                this.showError(`Error: ${error.response.data.message || "Unable to fetch weather data"}`);
            }
        } else if (error.request) {
            this.showError("Network error. Please check your internet connection and try again.");
        } else {
            this.showError("An unexpected error occurred. Please try again.");
        }

        console.error("Error fetching weather:", error);
    }
};

// Fetch forecast data separately (if needed independently)
WeatherApp.prototype.getForecast = async function (cityName) {
    const url = `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(cityName)}&appid=${this.apiKey}&units=metric`;

    const response = await axios.get(url);
    return response.data;
};

// Process forecast data - filter 40 data points to 5 days (one per day at noon)
WeatherApp.prototype.processForecastData = function (data) {
    // Get all forecast items
    const allForecast = data.list;

    // Filter to get one forecast per day (at noon ~12:00)
    const dailyForecast = [];
    const seenDays = new Set();

    for (const item of allForecast) {
        const date = new Date(item.dt * 1000);
        const dayOfWeek = date.getDay();

        // Skip if we've already got this day, or if it's not around noon
        if (seenDays.has(dayOfWeek)) continue;

        // Get noon time (or closest to it)
        const hours = date.getHours();
        if (hours >= 9 && hours <= 15) {
            seenDays.add(dayOfWeek);
            dailyForecast.push({
                day: this.getDayName(date),
                date: date.toLocaleDateString(),
                temp: Math.round(item.main.temp),
                description: item.weather[0].description,
                icon: item.weather[0].icon,
                humidity: item.main.humidity
            });
        }
    }

    // If we don't have 5 days yet, fill in with remaining days
    if (dailyForecast.length < 5) {
        for (const item of allForecast) {
            if (dailyForecast.length >= 5) break;

            const date = new Date(item.dt * 1000);
            const dayOfWeek = date.getDay();

            if (!seenDays.has(dayOfWeek)) {
                seenDays.add(dayOfWeek);
                dailyForecast.push({
                    day: this.getDayName(date),
                    date: date.toLocaleDateString(),
                    temp: Math.round(item.main.temp),
                    description: item.weather[0].description,
                    icon: item.weather[0].icon,
                    humidity: item.main.humidity
                });
            }
        }
    }

    return dailyForecast.slice(0, 5); // Return exactly 5 days
};

// Get day name from date
WeatherApp.prototype.getDayName = function (date) {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[date.getDay()];
};

// Display current weather data
WeatherApp.prototype.displayWeather = function (data) {
    this.cityEl.textContent = data.name;
    this.tempEl.textContent = `${Math.round(data.main.temp)} °C`;
    this.descEl.textContent = data.weather[0].description;

    const iconCode = data.weather[0].icon;
    this.iconEl.src = `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
    this.iconEl.alt = data.weather[0].description;
};

// Display 5-day forecast cards
WeatherApp.prototype.displayForecast = function (forecastData) {
    // Check if forecast container exists, if not create it
    let forecastContainer = document.getElementById("forecast-container");

    if (!forecastContainer) {
        // Create forecast container
        forecastContainer = document.createElement("div");
        forecastContainer.id = "forecast-container";
        forecastContainer.className = "forecast-container";

        // Insert after weather card
        this.weatherCard.parentNode.insertBefore(forecastContainer, this.weatherCard.nextSibling);
    }

    // Generate forecast cards HTML
    let forecastHTML = '<h3>5-Day Forecast</h3>';
    forecastHTML += '<div class="forecast-grid">';

    for (const day of forecastData) {
        forecastHTML += `
            <div class="forecast-card">
                <p class="forecast-day">${day.day}</p>
                <img src="https://openweathermap.org/img/wn/${day.icon}@2x.png" alt="${day.description}" class="forecast-icon" />
                <p class="forecast-temp">${day.temp}°C</p>
                <p class="forecast-desc">${day.description}</p>
            </div>
        `;
    }

    forecastHTML += '</div>';

    // Use += to append (not replace) forecast
    forecastContainer.innerHTML = forecastHTML;
};

// Show loading state
WeatherApp.prototype.showLoading = function () {
    this.loadingEl.classList.add("show");
    this.weatherCard.classList.add("hidden");

    // Also hide/clear forecast when loading
    const forecastContainer = document.getElementById("forecast-container");
    if (forecastContainer) {
        forecastContainer.innerHTML = '';
    }
};

// Hide loading state
WeatherApp.prototype.hideLoading = function () {
    this.loadingEl.classList.remove("show");
    this.weatherCard.classList.remove("hidden");
};

// Show error message
WeatherApp.prototype.showError = function (message) {
    this.errorMessageEl.textContent = message;
    this.errorMessageEl.classList.add("show");

    // Hide forecast on error
    const forecastContainer = document.getElementById("forecast-container");
    if (forecastContainer) {
        forecastContainer.innerHTML = '';
    }
};

// Hide error message
WeatherApp.prototype.hideError = function () {
    this.errorMessageEl.classList.remove("show");
};

// ============================================
// Initialize the Application
// ============================================
const app = new WeatherApp();
app.init();

// For debugging - verify prototype structure
console.log("WeatherApp instance:", app);
console.log("Prototype methods:", Object.getOwnPropertyNames(WeatherApp.prototype));
