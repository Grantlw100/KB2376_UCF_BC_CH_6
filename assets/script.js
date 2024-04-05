const cityForm = document.querySelector('#city-form');
const coordsForm = document.querySelector('#coords-form');
const apiKey = '19dd688c412f1779c42f51258742f343';
const apiURLForecast = 'https://api.openweathermap.org/data/2.5/forecast?';
const apiURLWeather = 'https://api.openweathermap.org/data/2.5/weather?';

cityForm.addEventListener('submit', function(event) {
    event.preventDefault();
    let cityName = document.getElementById('cityName').value; // Updated ID
    console.log(cityName);
    fetchWeatherData(cityName);
    saveSearch(cityName);
});

coordsForm.addEventListener('submit', function(event) {
    event.preventDefault();
    let lat = document.getElementById('lat').value;
    let lon = document.getElementById('lon').value;
    fetchWeatherDataByCoords(lat, lon);
});


document.getElementById('current-location-btn').addEventListener('click', function(event) {
    event.preventDefault();
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function(position) {
            const coords = {
                lat: position.coords.latitude,
                lon: position.coords.longitude
            };
            console.log(`Latitude: ${coords.lat}, Longitude: ${coords.lon}`);
            saveSearch(coords); // Save the search with the new structure
            fetchWeatherDataByCoords(coords.lat, coords.lon);
        }, function() {
            alert('Geolocation is not supported by this browser or permission denied.');
        });
    } else {
        alert('Geolocation is not supported by this browser.');
    }
});


function fetchWeatherData(city) {
    fetch(`${apiURLWeather}q=${city}&appid=${apiKey}&units=imperial`)
    .then(response => response.json())
    .then(data => {
        console.log(data);
        updateWeatherDisplay(data);
    })
    .catch(error => console.log(error));
    fetch(`${apiURLForecast}q=${city}&appid=${apiKey}&units=imperial`)
    .then(response => response.json())
    .then(data => displayFiveDayForecast(data))
    .catch(error => console.log('Error fetching 5-day forecast:', error));
    
}

function fetchWeatherDataByCoords(lat, lon) {
    // First, save the search. This assumes saveSearch has been adapted to accept lat and lon.
    const coords = {lat, lon}

    fetch(`${apiURLForecast}lat=${lat}&lon=${lon}&appid=${apiKey}&units=imperial`) // Changed 'imperial' to 'imperial' for Celsius. Use 'imperial' for Fahrenheit.
    .then(response => {
        if (!response.ok) throw new Error('Network response was not ok');
        return response.json();
    })
    .then(data => {
        console.log('Forecast data:', data);
        displayFiveDayForecast(data);
        // Fetch current weather data
        return fetch(`${apiURLWeather}lat=${lat}&lon=${lon}&appid=${apiKey}&units=imperial`); // Ensure this fetch is returned to chain the promise
    })
    .then(response => {
        if (!response.ok) throw new Error('Network response was not ok');
        return response.json();
    })
    .then(data => {
        console.log('Current weather data:', data);
        updateWeatherDisplay(data);
    })
    .catch(error => console.log('Error fetching weather data by coordinates:', error));
}

function displayFiveDayForecast(forecastData) {
    document.querySelectorAll('.weather-display').forEach(function(element) {
        element.style.display = 'block';
    });

    const forecastContainer = document.getElementById('forecast-container');
    forecastContainer.innerHTML = ''; 

    const dailyForecasts = forecastData.list.filter((item) => item.dt_txt.includes('12:00:00'));

    dailyForecasts.forEach((forecast) => {
        const dateTime = new Date(forecast.dt * 1000); 
        const dayName = dateTime.toLocaleDateString('en-US', { weekday: 'long' });
        const weatherIconUrl = `https://openweathermap.org/img/wn/${forecast.weather[0].icon}.png`;

        const forecastDiv = document.createElement('div');
        forecastDiv.classList.add('forecast-day');

        const dateDiv = document.createElement('div');
        dateDiv.textContent = dayName;
        forecastDiv.appendChild(dateDiv);

        const iconImg = document.createElement('img');
        iconImg.src = weatherIconUrl;
        iconImg.alt = forecast.weather[0].description;
        forecastDiv.appendChild(iconImg);

        const weatherDiv = document.createElement('div');
        weatherDiv.textContent = forecast.weather[0].description;
        forecastDiv.appendChild(weatherDiv);

        const tempDiv = document.createElement('div');
        tempDiv.textContent = `Temp: ${forecast.main.temp.toFixed(1)}°F`;
        forecastDiv.appendChild(tempDiv);

        const minMaxDiv = document.createElement('div');
        minMaxDiv.textContent = `Min: ${forecast.main.temp_min.toFixed(1)}°F / Max: ${forecast.main.temp_max.toFixed(1)}°F`;
        forecastDiv.appendChild(minMaxDiv);

        const humidityDiv = document.createElement('div');
        humidityDiv.textContent = `Humidity: ${forecast.main.humidity}%`;
        forecastDiv.appendChild(humidityDiv);

        const windDiv = document.createElement('div');
        windDiv.textContent = `Wind: ${forecast.wind.speed} m/s`;

        forecastDiv.appendChild(windDiv);
        forecastContainer.appendChild(forecastDiv);
    });
}

function updateWeatherDisplay(data) {
    const city = document.getElementById('city-name');
    const weather = document.getElementById('weather');
    const date = document.getElementById('date');
    const temperature = document.getElementById('temperature');
    const tempMin = document.getElementById('temp-min');
    const tempMax = document.getElementById('temp-max');
    const humidity = document.getElementById('humidity');
    const windSpeed = document.getElementById('wind-speed');
    const iconImg = document.getElementById('weather-icon');

    document.querySelectorAll('.display-weather').forEach(function(element) {
        element.style.display = 'block'; 
    });

    
    
    city.textContent = data.name; 
    weather.textContent = data.weather[0].description;
    iconImg.src = `https://openweathermap.org/img/wn/${data.weather[0].icon}.png`;
    date.textContent = new Date(data.dt * 1000).toLocaleDateString('en-US'); 
    temperature.textContent = (data.main.temp).toFixed(2); 
    tempMin.textContent = (data.main.temp_min).toFixed(2); 
    tempMax.textContent = (data.main.temp_max).toFixed(2); 
    humidity.textContent = data.main.humidity;
    windSpeed.textContent = data.wind.speed;
}

function saveSearch(searchData) {
    let history = JSON.parse(localStorage.getItem('searchHistory')) || [];
    if (typeof searchData === 'string') {
        // For city name
        if (!history.some(item => item.type === 'city' && item.value === searchData)) {
            history.push({ type: 'city', value: searchData });
        }
    } else if (typeof searchData === 'object' && searchData.lat && searchData.lon) {
        // For coordinates
        const coordString = `${searchData.lat},${searchData.lon}`;
        if (!history.some(item => item.type === 'coords' && item.value === coordString)) {
            history.push({ type: 'coords', value: coordString });
        }
    } else {
        console.error('Invalid searchData provided to saveSearch');
        return;
    }
    localStorage.setItem('searchHistory', JSON.stringify(history));
    updateSearchHistory();
}


 
function clearLocalStorage() {
    localStorage.clear();
    console.log('Local storage cleared.');
    updateSearchHistory();
}

document.getElementById('clear-history-btn').addEventListener('click', clearLocalStorage);

function updateSearchHistory() {
    const history = JSON.parse(localStorage.getItem('searchHistory')) || [];
    const historyElement = document.getElementById('history');
    historyElement.innerHTML = ''; 

    history.forEach(item => {
        let li = document.createElement('li');
        if (item.type === 'city') {
            li.textContent = item.value; 
        } else if (item.type === 'coords') {
            li.textContent = `Coordinates: ${item.value}`; 
        }
        li.addEventListener('click', () => {
            if (item.type === 'city') {
                fetchWeatherData(item.value); 
            } else {
                const [lat, lon] = item.value.split(',');
                fetchWeatherDataByCoords(lat, lon);
            }
        });
        historyElement.appendChild(li);
    });
}

updateSearchHistory();

const toggleThemeButton = document.getElementById('toggle-theme');
    toggleThemeButton.addEventListener('click', () => {
        const body = document.body;
        const currentTheme = body.getAttribute('data-theme');
        
        // Toggle theme attribute
        if (currentTheme === 'dark') {
            body.setAttribute('data-theme', 'light');
        } else {
            body.setAttribute('data-theme', 'dark');
        }
});

document.addEventListener('DOMContentLoaded', () => {
    const body = document.body;
    const windowHour = new Date().getHours();
    const isNight = windowHour < 6 || windowHour >= 18;
    if (isNight) {
        body.setAttribute('data-theme', 'dark');
    } else {
    body.setAttribute('data-theme', 'light');
    }
});