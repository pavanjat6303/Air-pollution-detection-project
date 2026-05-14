const { useState, useEffect, useRef } = React;

const SearchBar = () => {
    const [query, setQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    // User provided API Key
    const API_KEY = 'd8c1a00754c112994994993374d0badd';

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!query.trim()) return;

        setLoading(true);
        setError('');
        setResult(null);
        setIsOpen(true);

        try {
            // 1. Get Lat/Lon
            const geoRes = await fetch(`https://api.openweathermap.org/geo/1.0/direct?q=${query}&limit=1&appid=${API_KEY}`);
            const geoData = await geoRes.json();

            if (!geoData || geoData.length === 0 || geoData.cod === "401") {
                throw new Error('City not found or Invalid API Key');
            }

            const { lat, lon, name, country } = geoData[0];

            // 2. Get Weather
            const weatherRes = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`);
            const weatherData = await weatherRes.json();

            // 3. Get AQI
            const aqiRes = await fetch(`https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${API_KEY}`);
            const aqiData = await aqiRes.json();

            const aqiIndex = aqiData.list[0].main.aqi; // 1 to 5
            
            // Map OpenWeather AQI (1-5) to Standard AQI Category
            const aqiMapping = {
                1: { label: 'Good', color: '#10B981', value: '0-50' },
                2: { label: 'Fair', color: '#F59E0B', value: '51-100' },
                3: { label: 'Moderate', color: '#F97316', value: '101-150' },
                4: { label: 'Poor', color: '#EF4444', value: '151-200' },
                5: { label: 'Hazardous', color: '#8B5CF6', value: '201+' }
            };

            const aqiInfo = aqiMapping[aqiIndex] || aqiMapping[1];

            setResult({
                city: `${name}, ${country}`,
                temp: Math.round(weatherData.main.temp),
                humidity: weatherData.main.humidity,
                condition: weatherData.weather[0].main,
                icon: weatherData.weather[0].icon,
                aqiLabel: aqiInfo.label,
                aqiColor: aqiInfo.color,
                aqiValue: aqiInfo.value
            });

        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="search-bar-container" ref={dropdownRef} style={{ position: 'relative' }}>
            <form onSubmit={handleSearch} className="search-bar">
                <i className="ph ph-magnifying-glass"></i>
                <input 
                    type="text" 
                    placeholder="Search city weather & AQI..." 
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => { if(result || error) setIsOpen(true); }}
                />
            </form>

            {isOpen && (loading || error || result) && (
                <div className="search-dropdown glassmorphism">
                    {loading && (
                        <div className="loading-spinner">
                            <i className="ph ph-spinner ph-spin"></i>
                            <p>Scanning atmosphere...</p>
                        </div>
                    )}

                    {error && !loading && (
                        <div className="error-message">
                            <i className="ph ph-warning-circle"></i>
                            <p>{error}</p>
                        </div>
                    )}

                    {result && !loading && (
                        <div className="result-card">
                            <div className="result-header">
                                <h3>{result.city}</h3>
                                <span className="aqi-badge" style={{ backgroundColor: result.aqiColor }}>
                                    {result.aqiLabel}
                                </span>
                            </div>
                            
                            <div className="result-body">
                                <div className="weather-info">
                                    <img src={`https://openweathermap.org/img/wn/${result.icon}@2x.png`} alt="weather" />
                                    <div>
                                        <h1>{result.temp}°C</h1>
                                        <p>{result.condition}</p>
                                    </div>
                                </div>
                                <div className="metrics-grid">
                                    <div className="metric">
                                        <i className="ph ph-wind"></i>
                                        <div>
                                            <p className="label">AQI (US EPA)</p>
                                            <p className="val">{result.aqiValue}</p>
                                        </div>
                                    </div>
                                    <div className="metric">
                                        <i className="ph ph-drop"></i>
                                        <div>
                                            <p className="label">Humidity</p>
                                            <p className="val">{result.humidity}%</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

const root = ReactDOM.createRoot(document.getElementById('react-search-root'));
root.render(<SearchBar />);
