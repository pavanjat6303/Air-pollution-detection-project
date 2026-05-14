from flask import Flask, request, jsonify
from flask_cors import CORS
import pickle
import numpy as np
import os

import logging

# Configure basic logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(message)s')

app = Flask(__name__)
CORS(app) # Enable CORS for frontend to communicate with backend

# Load the model
model_path = os.path.join(os.path.dirname(__file__), 'model.pkl')
with open(model_path, 'rb') as f:
    saved_data = pickle.load(f)
    if 'pipeline' in saved_data:
        pipeline = saved_data['pipeline']
    else:
        model = saved_data['model']
        imputer = saved_data['imputer']
    features = saved_data['features']

def get_aqi_category(aqi):
    if aqi <= 50:
        return "Good", "Air quality is satisfactory, and air pollution poses little or no risk.", "#10B981"
    elif aqi <= 100:
        return "Moderate", "Air quality is acceptable. However, there may be a risk for some people.", "#F59E0B"
    elif aqi <= 150:
        return "Unhealthy for Sensitive Groups", "Members of sensitive groups may experience health effects.", "#F97316"
    elif aqi <= 200:
        return "Unhealthy", "Some members of the general public may experience health effects.", "#EF4444"
    elif aqi <= 300:
        return "Very Unhealthy", "Health alert: The risk of health effects is increased for everyone.", "#8B5CF6"
    else:
        return "Hazardous", "Health warning of emergency conditions: everyone is more likely to be affected.", "#7C3AED"

@app.route('/predict', methods=['POST'])
def predict():
    try:
        data = request.json
        
        # Convert all frontend inputs to numeric values before prediction
        feature_values = []
        feature_values.append(float(data.get('pm25', 0)))
        feature_values.append(float(data.get('pm10', 0)))
        feature_values.append(float(data.get('no2', 0)))
        feature_values.append(float(data.get('so2', 0)))
        feature_values.append(float(data.get('co', 0)))
        feature_values.append(float(data.get('temp', 0)))
        feature_values.append(float(data.get('humidity', 0)))
        feature_values.append(float(data.get('windspeed', 0)))
        
        # Log received values
        logging.info(f"Received frontend inputs: {feature_values}")
        
        # Prepare for prediction
        input_data = np.array([feature_values])
        
        if 'pipeline' in globals() or 'pipeline' in locals():
            predicted_aqi = pipeline.predict(input_data)[0]
        else:
            input_imputed = imputer.transform(input_data)
            predicted_aqi = model.predict(input_imputed)[0]
            
        # Fix any NaN or undefined values
        if np.isnan(predicted_aqi):
            predicted_aqi = 0
            
        # Ensure it's realistic (0 to 500 max usually)
        predicted_aqi = max(0, min(500, predicted_aqi))
        
        # Log prediction output
        logging.info(f"Predicted AQI Value: {predicted_aqi}")
        
        category, recommendation, color = get_aqi_category(predicted_aqi)
        
        return jsonify({
            'success': True,
            'aqi': round(predicted_aqi),
            'category': category,
            'recommendation': recommendation,
            'color': color
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 400

if __name__ == '__main__':
    app.run(debug=True, port=5000)
