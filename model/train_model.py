import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor
from sklearn.impute import SimpleImputer
import pickle
import os

def train():
    print("Loading dataset...")
    # Load dataset
    df = pd.read_csv('dataset/AirQualityData.csv')
    
    # Select required features
    features = ['PM2.5', 'PM10', 'NO2(GT)', 'SO2(GT)', 'CO(GT)', 'Temperature', 'Humidity', 'WindSpeed']
    target = 'AirQualityIndex'
    
    # Handle missing values
    imputer = SimpleImputer(strategy='mean')
    
    X = df[features]
    y = df[target]
    
    # Impute missing values
    X_imputed = imputer.fit_transform(X)
    
    # Train-test split
    X_train, X_test, y_train, y_test = train_test_split(X_imputed, y, test_size=0.2, random_state=42)
    
    print("Training model...")
    # Train model
    model = RandomForestRegressor(n_estimators=100, random_state=42)
    model.fit(X_train, y_train)
    
    score = model.score(X_test, y_test)
    print(f"Model R^2 Score: {score:.4f}")
    
    # Save the model and imputer
    print("Saving model...")
    os.makedirs('backend', exist_ok=True)
    with open('backend/model.pkl', 'wb') as f:
        pickle.dump({'model': model, 'imputer': imputer, 'features': features}, f)
        
    print("Model saved successfully in backend/model.pkl")

if __name__ == "__main__":
    train()
