document.addEventListener('DOMContentLoaded', () => {
    const predictBtn = document.getElementById('predict-btn');
    const themeToggle = document.getElementById('theme-toggle');
    const resultDiv = document.getElementById('prediction-result');
    const resultAqi = document.getElementById('result-aqi');
    const resultCategory = document.getElementById('result-category');
    const resultRecommendation = document.getElementById('result-recommendation');
    
    // Check local storage for theme preference
    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
    themeToggle.checked = savedTheme === 'dark';

    themeToggle.addEventListener('change', (e) => {
        if (e.target.checked) {
            document.documentElement.setAttribute('data-theme', 'dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.setAttribute('data-theme', 'light');
            localStorage.setItem('theme', 'light');
        }
    });
    
    const validationRules = {
        city: { required: true },
        pm25: { min: 0, max: 500, name: 'PM2.5' },
        pm10: { min: 0, max: 500, name: 'PM10' },
        no2: { min: 0, max: 200, name: 'NO2' },
        so2: { min: 0, max: 100, name: 'SO2' },
        co: { min: 0, max: 50, name: 'CO' },
        temp: { min: -50, max: 50, name: 'Temperature' },
        humidity: { min: 0, max: 100, name: 'Humidity' },
        windspeed: { min: 0, max: 150, name: 'Wind Speed' }
    };
    
    // Create Toast element
    const toast = document.createElement('div');
    toast.className = 'toast-notification';
    document.body.appendChild(toast);

    function showToast(message) {
        toast.innerHTML = `<i class="ph-fill ph-warning-circle" style="font-size: 20px;"></i> ${message}`;
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 3000);
    }

    function validateInput(value, rule) {
        if (!value.trim()) return "This field is required";
        if (rule.min !== undefined && rule.max !== undefined) {
            const num = parseFloat(value);
            if (isNaN(num)) return "Must be a valid number";
            if (num < rule.min || num > rule.max) return `Must be between ${rule.min} and ${rule.max}`;
        }
        return "";
    }

    // Setup tooltips and clear error on input
    Object.entries(validationRules).forEach(([id, rule]) => {
        const input = document.getElementById(id);
        if (input) {
            const wrapper = input.closest('.input-wrapper');
            
            if (rule.min !== undefined && rule.max !== undefined) {
                const helper = document.createElement('span');
                helper.className = 'helper-tooltip';
                helper.textContent = `Allowed range: ${rule.min} to ${rule.max}`;
                wrapper.appendChild(helper);
            }

            // Only validate on blur (loses focus), NO input event listener
            input.addEventListener('blur', () => {
                const error = validateInput(input.value, rule);
                let errorMsgEl = wrapper.nextElementSibling;
                if (!errorMsgEl || !errorMsgEl.classList.contains('error-text')) {
                    errorMsgEl = document.createElement('p');
                    errorMsgEl.className = 'error-text';
                    wrapper.after(errorMsgEl);
                }
                
                if (error) {
                    wrapper.classList.add('error');
                    wrapper.classList.remove('valid');
                    errorMsgEl.innerHTML = error;
                    errorMsgEl.style.display = 'block';
                } else if (input.value.trim() !== '') {
                    wrapper.classList.remove('error');
                    wrapper.classList.add('valid');
                    errorMsgEl.style.display = 'none';
                }
            });
        }
    });

    predictBtn.addEventListener('click', async (e) => {
        let isValid = true;
        let outOfRange = false;
        
        Object.entries(validationRules).forEach(([id, rule]) => {
            const input = document.getElementById(id);
            const wrapper = input.closest('.input-wrapper');
            let errorMsgEl = wrapper.nextElementSibling;
            
            if (!errorMsgEl || !errorMsgEl.classList.contains('error-text')) {
                errorMsgEl = document.createElement('p');
                errorMsgEl.className = 'error-text';
                wrapper.after(errorMsgEl);
            }

            const error = validateInput(input.value, rule);
            
            if (error) {
                wrapper.classList.add('error');
                wrapper.classList.remove('valid');
                errorMsgEl.innerHTML = error;
                errorMsgEl.style.display = 'block';
                isValid = false;
                if (error.includes('between')) outOfRange = true;
            } else {
                wrapper.classList.remove('error');
                wrapper.classList.add('valid');
                errorMsgEl.style.display = 'none';
            }
        });

        if (!isValid) {
            e.preventDefault();
            if (outOfRange) {
                showToast('Please enter values within valid range');
            } else {
                showToast('Please enter all required values');
            }
            return;
        }

        const btn = predictBtn;
        const originalText = btn.innerHTML;
        
        btn.innerHTML = '<i class="ph ph-spinner ph-spin"></i> Predicting...';
        btn.style.opacity = '0.8';
        btn.disabled = true;
        
        try {
            // Send exact user-entered values preserving decimals, NO auto-rounding or clamping
            const data = {
                pm25: document.getElementById('pm25').value,
                pm10: document.getElementById('pm10').value,
                no2: document.getElementById('no2').value,
                so2: document.getElementById('so2').value,
                co: document.getElementById('co').value,
                temp: document.getElementById('temp').value,
                humidity: document.getElementById('humidity').value,
                windspeed: document.getElementById('windspeed').value
            };
            
            const response = await fetch('http://localhost:5000/predict', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });
            
            const result = await response.json();
            
            if(result.success) {
                btn.innerHTML = '<i class="ph ph-check-circle"></i> Prediction Complete';
                btn.style.background = '#10B981'; // Success green
                
                resultDiv.style.display = 'block';
                resultAqi.textContent = result.aqi;
                resultCategory.textContent = result.category;
                resultCategory.style.background = result.color;
                resultDiv.style.borderColor = result.color;
                resultRecommendation.textContent = result.recommendation;
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            alert('Error during prediction: ' + error.message);
            btn.innerHTML = '<i class="ph ph-warning-circle"></i> Error';
            btn.style.background = '#EF4444';
        } finally {
            setTimeout(() => {
                btn.innerHTML = originalText;
                btn.style.background = '';
                btn.style.opacity = '1';
                btn.disabled = false;
            }, 3000);
        }
    });

    // City Search Logic
    const searchForm = document.getElementById('city-search-form');
    const searchInput = document.getElementById('city-search-input');
    const searchDropdown = document.getElementById('city-search-dropdown');
    const searchContainer = document.getElementById('city-search-container');
    const API_KEY = 'd8c1a00754c112994994993374d0badd';

    const aqiMapping = {
        1: { label: 'Good', color: '#10B981', value: '0-50' },
        2: { label: 'Fair', color: '#F59E0B', value: '51-100' },
        3: { label: 'Moderate', color: '#F97316', value: '101-150' },
        4: { label: 'Poor', color: '#EF4444', value: '151-200' },
        5: { label: 'Hazardous', color: '#8B5CF6', value: '201+' }
    };

    if (searchForm) {
        searchForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const query = searchInput.value.trim();
            if (!query) return;

            searchDropdown.style.display = 'block';
            searchDropdown.innerHTML = `
                <div class="loading-spinner">
                    <i class="ph ph-spinner ph-spin"></i>
                    <p>Scanning atmosphere...</p>
                </div>
            `;

            try {
                const geoRes = await fetch(`https://api.openweathermap.org/geo/1.0/direct?q=${query}&limit=1&appid=${API_KEY}`);
                const geoData = await geoRes.json();

                if (!geoData || geoData.length === 0 || geoData.cod === "401") {
                    throw new Error('City not found or Invalid API Key');
                }

                const { lat, lon, name, country } = geoData[0];

                const weatherRes = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`);
                const weatherData = await weatherRes.json();

                const aqiRes = await fetch(`https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${API_KEY}`);
                const aqiData = await aqiRes.json();

                const aqiIndex = aqiData.list[0].main.aqi;
                const aqiInfo = aqiMapping[aqiIndex] || aqiMapping[1];

                const temp = Math.round(weatherData.main.temp);
                const humidity = weatherData.main.humidity;
                const condition = weatherData.weather[0].main;
                const icon = weatherData.weather[0].icon;

                searchDropdown.innerHTML = `
                    <div class="result-card">
                        <div class="result-header">
                            <h3>${name}, ${country}</h3>
                            <span class="aqi-badge" style="background-color: ${aqiInfo.color}">${aqiInfo.label}</span>
                        </div>
                        <div class="result-body">
                            <div class="weather-info">
                                <img src="https://openweathermap.org/img/wn/${icon}@2x.png" alt="weather" />
                                <div>
                                    <h1>${temp}°C</h1>
                                    <p>${condition}</p>
                                </div>
                            </div>
                            <div class="metrics-grid">
                                <div class="metric">
                                    <i class="ph ph-wind"></i>
                                    <div>
                                        <p class="label">AQI (US EPA)</p>
                                        <p class="val">${aqiInfo.value}</p>
                                    </div>
                                </div>
                                <div class="metric">
                                    <i class="ph ph-drop"></i>
                                    <div>
                                        <p class="label">Humidity</p>
                                        <p class="val">${humidity}%</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
            } catch (err) {
                searchDropdown.innerHTML = `
                    <div class="error-message">
                        <i class="ph ph-warning-circle"></i>
                        <p>${err.message}</p>
                    </div>
                `;
            }
        });

        document.addEventListener('click', (e) => {
            if (!searchContainer.contains(e.target)) {
                searchDropdown.style.display = 'none';
            }
        });

        searchInput.addEventListener('focus', () => {
            if (searchDropdown.innerHTML.trim() !== '') {
                searchDropdown.style.display = 'block';
            }
        });
    }
});
