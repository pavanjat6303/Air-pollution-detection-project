from flask import Flask, request, jsonify
from flask_cors import CORS
import pickle
import numpy as np
import os

app = Flask(__name__)
CORS(app) # Enable CORS for frontend to communicate with backend

# Load the model
model_path = os.path.join(os.path.dirname(__file__), 'model.pkl')
with open(model_path, 'rb') as f:
    saved_data = pickle.load(f)
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
        
        # Extract features in the correct order
        # Expected mapping from frontend keys to backend dataset features
        feature_values = []
        feature_values.append(float(data.get('pm25', 0)))
        feature_values.append(float(data.get('pm10', 0)))
        feature_values.append(float(data.get('no2', 0)))
        feature_values.append(float(data.get('so2', 0)))
        feature_values.append(float(data.get('co', 0)))
        feature_values.append(float(data.get('temp', 0)))
        feature_values.append(float(data.get('humidity', 0)))
        feature_values.append(float(data.get('windspeed', 0)))
        
        # Prepare for prediction
        input_data = np.array([feature_values])
        input_imputed = imputer.transform(input_data)
        
        # Predict
        predicted_aqi = model.predict(input_imputed)[0]
        
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
