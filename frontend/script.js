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
    
    predictBtn.addEventListener('click', async () => {
        const btn = predictBtn;
        const originalText = btn.innerHTML;
        
        btn.innerHTML = '<i class="ph ph-spinner ph-spin"></i> Predicting...';
        btn.style.opacity = '0.8';
        btn.disabled = true;
        
        try {
            // Gather data
            const data = {
                pm25: document.getElementById('pm25').value || 0,
                pm10: document.getElementById('pm10').value || 0,
                no2: document.getElementById('no2').value || 0,
                so2: document.getElementById('so2').value || 0,
                co: document.getElementById('co').value || 0,
                temp: document.getElementById('temp').value || 0,
                humidity: document.getElementById('humidity').value || 0,
                windspeed: document.getElementById('windspeed').value || 0
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
});
