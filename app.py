from flask import Flask, render_template, request, jsonify
import requests
from geopy import geocoders


USGS_API_URL_BASE = "https://earthquake.usgs.gov/fdsnws/event/1/query"

app = Flask(__name__)
@app.route('/')
def index():
    return render_template('index.html')

@app.get("/api/earthquakes")
def get_earthquakes():
    start_time = request.args.get('start_time')
    end_time = request.args.get('end_time')
    minimum_magnitude = request.args.get('min_magnitude')
    order_by = request.args.get('order_by')
    limit = request.args.get('limit')
    params = {
        'format':'geojson',
        'starttime': start_time,
        'endtime': end_time,
        'minmagnitude': minimum_magnitude,
        'orderby': order_by,
        'limit': limit
    }
    
    try:
        response = requests.get(USGS_API_URL_BASE, params=params)
        response.raise_for_status()
    except requests.exceptions.RequestException as e:
        return jsonify({
            'error': 'Failed to fetch earthquake data from USGS API.',
            'details': str(e)
        }), 500
        
    return jsonify(response.json()), 200

if __name__ == '__main__':
    app.run(debug=True)