from flask import Flask, render_template, request, jsonify
import requests
from geopy.geocoders import Nominatim
from geopy.extra.rate_limiter import RateLimiter

USGS_API_URL_BASE = "https://earthquake.usgs.gov/fdsnws/event/1/query"

app = Flask(__name__)
@app.route('/')
def index():
    return render_template('index.html')

geolocator = Nominatim(user_agent='earthquake_locator (Hasnat4763)')
geocode = RateLimiter(geolocator.geocode, min_delay_seconds=1)
reverse = RateLimiter(geolocator.reverse, min_delay_seconds=1)

@app.route('/api/geocode')
def geocode_api():
    query = request.args.get("q", "").strip()
    if not query:
        return jsonify({"error": "Place name is required."}), 400
    location = geocode(query)
    if not location:
        return jsonify({
            "error": "Location Not Found"
        }), 404
    
    return jsonify({
        "query": query,
        "address": location.address,
        "latitude": location.latitude,
        "longitude": location.longitude
    })


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
    print(params)
    try:
        response = requests.get(USGS_API_URL_BASE, params=params)
        response.raise_for_status()
    except requests.exceptions.RequestException as e:
        return jsonify({
            'error': 'Failed to fetch earthquake data from USGS API.',
            'details': str(e)
        }), 500
        
    return jsonify(response.json()), 200


@app.route('/api/earthquakes/radius')
def earthquakes_by_radius():
    start_time = request.args.get('start_time')
    end_time = request.args.get('end_time')
    minimum_magnitude = request.args.get('min_magnitude')
    order_by = request.args.get('order_by')
    limit = request.args.get('limit')
    latitude = request.args.get('latitude')
    longitude = request.args.get('longitude')
    maxradiuskm = request.args.get('max_radius_km')
    params = {
        'format':'geojson',
        'starttime': start_time,
        'endtime': end_time,
        'minmagnitude': minimum_magnitude,
        'orderby': order_by,
        'limit': limit,
        'latitude': latitude,
        'longitude': longitude,
        'maxradiuskm': maxradiuskm
    }
    try:
        response = requests.get(USGS_API_URL_BASE, params=params)
        response.raise_for_status()
        print(response.url)
    except requests.exceptions.RequestException as e:
        return jsonify({
            'error': 'Failed to fetch earthquake data from USGS API.',
            'details': str(e)
        }), 500
    
    return jsonify(response.json()), 200

@app.get("/api/reverse_geocode")
def reversegeocode():
    lat = request.args.get('lat')
    lon = request.args.get('lon')
    if not lat or not lon:
        return jsonify({
            "error": "Latitude and Longitude are required."
            
        }), 400
    try:
        location = reverse(f"{lat}, {lon}", language="en")
        if not location:
            return jsonify({
                "error": "Location not found"
            }), 404
        address_data = location.raw.get("address", {})

        city = address_data.get("city") or address_data.get("town") or address_data.get("village", "")
        country = address_data.get("country", "")

        address = f"{city}, {country}"

        print(address)
        return jsonify({
            "address": address
        }), 200

    except Exception as e:
        return jsonify({
            "error": "Failed to fetch reverse geocoding data."
        }), 500

if __name__ == '__main__':
    app.run(debug=True)