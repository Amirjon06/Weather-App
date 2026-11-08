
const cityInput = document.querySelector('.city-input')
const searchBtn = document.querySelector('.search-btn')

const weatherInfoSection = document.querySelector('.weather-info')
const notFoundSection = document.querySelector('.not-found')
const searchCitySection = document.querySelector('.search-city')

const countryTxt = document.querySelector('.country-txt')
const tempTxt = document.querySelector('.temp-txt')
const conditionTxt = document.querySelector('.condition-txt')
const humidityValueTxt = document.querySelector('.humidity-value-txt')
const windValueTxt = document.querySelector('.wind-value-txt')
const weatherSummaryImg = document.querySelector('.weather-summary-img')
const currentDateTxt = document.querySelector('.current-date-txt')

const forecastItemsContainer = document.querySelector('.forecast-items-container')

// Use your existing OpenWeatherMap API key here.
// For production, use a backend to keep secrets off the client.
const apiKey = 'd613a4e13dc8b6c270f5703b29821dd0'

function searchWeather() {
    const city = cityInput.value.trim()

    if (!city) return

    updateWeatherInfo(city)
    cityInput.value = ''
    cityInput.blur()
}

searchBtn.addEventListener('click', searchWeather)

cityInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
        searchWeather()
    }
})

async function getFetchData(endPoint, city) {
    const params = new URLSearchParams({
        q: city,
        appid: apiKey,
        units: 'metric'
    })

    const apiUrl =
        `https://api.openweathermap.org/data/2.5/${endPoint}?${params}`

    const response = await fetch(apiUrl)

    if (!response.ok) {
        let errorMessage = 'Unable to fetch weather data'

        try {
            const errorData = await response.json()
            errorMessage = errorData.message || errorMessage
        } catch (error) {
            console.warn('Could not parse API error response:', error)
        }

        throw new Error(errorMessage)
    }

    return response.json()
}

function getWeaatherIcon(id) {
    if (id <= 232) return 'thunderstorm.svg'
    if (id <= 321) return 'drizzle.svg'
    if (id <= 531) return 'rain.svg'
    if (id <= 622) return 'snow.svg'
    if (id <= 781) return 'atmosphere.svg'
    if (id <= 800) return 'clear.svg'
    return 'clouds.svg'
}

function getCurrentDate() {
    const currentDate = new Date()

    const options = {
        weekday: 'short',
        day: '2-digit',
        month: 'short'
    }

    return currentDate.toLocaleDateString('en-GB', options)
}

async function updateWeatherInfo(city) {
    try {
        const weatherData = await getFetchData('weather', city)

        if (
            !weatherData.main ||
            !Array.isArray(weatherData.weather) ||
            !weatherData.weather.length ||
            !weatherData.wind
        ) {
            throw new Error('Invalid weather data received')
        }

        const {
            name: country,
            main: { temp, humidity },
            weather: [{ id, main }],
            wind: { speed }
        } = weatherData

        if (
            !Number.isFinite(temp) ||
            !Number.isFinite(humidity) ||
            !Number.isFinite(speed) ||
            !Number.isFinite(id)
        ) {
            throw new Error('Incomplete weather data received')
        }

        countryTxt.textContent = country
        tempTxt.textContent = Math.round(temp) + ' °C'
        conditionTxt.textContent = main

        humidityValueTxt.textContent = humidity + '%'
        windValueTxt.textContent = speed + ' M/s'

        currentDateTxt.textContent = getCurrentDate()

        weatherSummaryImg.src =
            `assets/weather/${getWeaatherIcon(id)}`

        await updateForecastsInfo(city)

        showDisplaySection(weatherInfoSection)

    } catch (error) {
        console.error('Weather request failed:', error)

        showDisplaySection(notFoundSection)
    }
}

async function updateForecastsInfo(city) {
    const forecastsData = await getFetchData('forecast', city)

    if (!Array.isArray(forecastsData.list)) {
        throw new Error('Invalid forecast data received')
    }

    const timeTaken = '12:00:00'
    const todayDate = new Date().toISOString().split('T')[0]

    forecastItemsContainer.innerHTML = ''

    forecastsData.list.forEach(forecastWeather => {
        if (
            typeof forecastWeather.dt_txt === 'string' &&
            forecastWeather.dt_txt.includes(timeTaken) &&
            !forecastWeather.dt_txt.includes(todayDate) &&
            Array.isArray(forecastWeather.weather) &&
            forecastWeather.weather.length > 0 &&
            forecastWeather.main &&
            Number.isFinite(forecastWeather.main.temp) &&
            Number.isFinite(forecastWeather.weather[0].id)
        ) {
            updateForecastItems(forecastWeather)
        }
    })
}

function updateForecastItems(weatherData) {
    const {
        dt_txt: date,
        weather: [{ id }],
        main: { temp }
    } = weatherData

    const dateTaken = new Date(date.replace(' ', 'T'))

    const dateOption = {
        day: '2-digit',
        month: 'short'
    }

    const dateResult = dateTaken.toLocaleDateString(
        'en-US',
        dateOption
    )

    const forecastItem = `
        <div class="forecast-item">
            <h5 class="forecast-item-date regular-txt">
                ${dateResult}
            </h5>
            <img
                src="assets/weather/${getWeaatherIcon(id)}"
                class="forecast-item-img"
                alt="Weather forecast"
            >
            <h5 class="forecast-item-temp">
                ${Math.round(temp)} °C
            </h5>
        </div>
    `

    forecastItemsContainer.insertAdjacentHTML(
        'beforeend',
        forecastItem
    )
}

function showDisplaySection(section) {
    [
        weatherInfoSection,
        searchCitySection,
        notFoundSection
    ].forEach(item => {
        item.style.display = 'none'
    })

    section.style.display = 'flex'
}
