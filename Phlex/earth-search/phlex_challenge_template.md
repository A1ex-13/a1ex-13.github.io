# phlex challenge template  

### [🌍 AIforEarthChallenge2024](https://platform.ai4eo.eu/)  
### 💧 Task 5 - Inputs: geojson + 2 dates; Output: F1  
###  Monitoring and Control:  
>Phlex can be connected to a monitoring system that tracks water quality in real-time,
>such as in a coastal zone.
>This will enable quick responses to deteriorations in water quality.
### Directory Structure:  
```python
project_directory/
│
├── configs/
│   └── metadata.yaml                # Metadata file with information about various types of data
│
├── models/
│   ├── 5_scaler.joblib              # Scaler for data normalization
│   └── task_5_model.h5              # Saved model
│
├── src/
│   ├── __pycache__/                 # Cached Python files
│   │     ├── datamodule.cpython-311.pyc
│   │     ├── factory.cpython-311.pyc
│   │     ├── model.cpython-311.pyc
│   │     ├── model_clay.cpython-311.pyc
│   │     ├── model_clay_v1.cpython-311.pyc
│   │     └── utils.cpython-311.pyc
│   ├── tests/                       # Tests for code verification
│   │     ├── test_callbacks.py
│   │     ├── test_datamodule.py
│   │     ├── test_model.py
│   │     └── test_trainer.py
│   ├── README.md                    # Project documentation and description
│   ├── callbacks_wandb.py           # Script for Weights & Biases integration
│   ├── datamodule.py                # Module for data loading and preparation
│   ├── factory.py                  # Factory method for creating model objects
│   ├── model.py                    # Main model
│   ├── model_clay.py               # Clay model (specific to your project)
│   ├── model_clay_v1.py            # Version 1 of the Clay model
│   ├── model_vit.py                # Vision Transformer model (if used)
│   └── utils.py                    # Utilities and helper functions
│
├── train_data
│   └── challenge_1.parquet          # Training data
│
├── .DS_Store                        # ?? File created by macOS to store metadata 
├── .gitignore                       # File specifying which files and folders to ignore in Git
├── phlex_v1_challenge_template.ipynb   # Competition notebook template
├── challenge_demo.ipynb             # Demonstration notebook
└── environment.yml                  # File with project dependencies
```
Here's an example of how to configure `phlex_challenge_template` to work with the folder structure and project.  
This notebook template will include the main steps: data loading, preprocessing, using the model for predictions, and evaluating results.

### Explanation
```
1.Data Loading: Connect and load data from train_data/challenge_1.parquet.
2.Data Preprocessing: The preprocess_data function (check and adjust it in src/datamodule.py) prepares the data for the model.
3.Model Loading: Load the model and scaler from the models/ folder.
4.Prediction: Apply the model for predictions and process the results depending on the task type (classification or regression).
5.Model Evaluation: Use performance evaluation metrics such as accuracy or RMSE.
6.Saving Results: Save the results to a submission.csv file for submission.
```
Be sure to adapt the data paths and functions to match your `project_directory`.

### Phlex Challenge Template
This notebook is designed to help you prepare your submissions for the Phlex Challenge. 

### Setup
Let's start by loading the necessary libraries and setting up our environment.

```python
# Import necessary libraries
import numpy as np
import pandas as pd
import geopandas as gpd
import joblib
import tensorflow as tf
from sklearn.metrics import mean_squared_error, f1_score, accuracy_score
from keras.models import load_model
import os

# Set device
device = '/GPU:0' if tf.config.list_physical_devices('GPU') else '/CPU:0'
```

### Load Data  
We'll begin by loading the training data and any additional data needed for evaluation.

```python
# Load training data
train_data_path = 'train_data/challenge_1.parquet'
train_data = pd.read_parquet(train_data_path)

# Display basic information
print(train_data.head())
```
### Preprocess Data
Ensure your data is properly preprocessed according to the challenge requirements. You may need to adjust this based on your specific data.

```python
from src.datamodule import preprocess_data  # Import your preprocessing function

# Preprocess data
X_train, y_train = preprocess_data(train_data)

# Display preprocessed data info
print(X_train.shape, y_train.shape)
```
### Load Model
Load the pre-trained model and scaler from the `models/` directory.

```python
# Load scaler
scaler_path = 'models/5_scaler.joblib'
scaler = joblib.load(scaler_path)

# Load model
model_path = 'models/task_5_model.h5'
model = load_model(model_path)
```
### Predict
Make predictions using the loaded model and preprocessed data.

```python
# Apply scaler to the data
X_train_scaled = scaler.transform(X_train)

# Make predictions
predictions = model.predict(X_train_scaled)

# If it's a classification task
predicted_classes = np.argmax(predictions, axis=1)

# If it's a regression task
# predicted_values = predictions
```
### Evaluate
Evaluate the model performance based on the predictions.

```python
from sklearn.metrics import accuracy_score, mean_squared_error

# If it's a classification task
accuracy = accuracy_score(y_train, predicted_classes)
print(f'Accuracy: {accuracy:.4f}')

# If it's a regression task
mse = mean_squared_error(y_train, predictions)
rmse = np.sqrt(mse)
print(f'RMSE: {rmse:.4f}')
```
### Save Predictions
Save the predictions to a file for submission.

```python
# Create a DataFrame with predictions
submission_df = pd.DataFrame({
    'id': train_data['id'],  # Make sure this column exists in your data
    'predictions': predicted_classes  # Adjust based on your task
})

# Save to CSV
submission_df.to_csv('submission.csv', index=False)
print('Submission file created.')
```
### Summary
In this notebook, we:  
* Loaded and preprocessed data.  
* Loaded a pre-trained model and scaler.  
* Made predictions and evaluated the model.  
* Saved the predictions for submission.

Feel free to adjust this template based on your specific needs and the challenge requirements.  

7.09.24 me & code in the process of learning

[🧔 about me](https://a1ex-13.github.io/me/1)  

[🚪 home](https://a1ex-13.github.io)  


