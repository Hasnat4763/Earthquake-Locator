from flask import Flask, render_template, request
from geopy import geocoders
app = Flask(__name__)
@app.route('/')
def index():
    return render_template('index.html')

@app.route('/submit_location', methods=['POST'])
def submit_location():
    location = request.form['location']
    lat, long = geocoders.Nominatim(user_agent="myGeocoder").geocode(location)
    return render_template('result.html', lat=lat, long=long)