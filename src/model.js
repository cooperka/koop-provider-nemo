/*
  model.js

  This file is required. It must export a class with at least one public function called `getData`

  Documentation: http://koopjs.github.io/docs/usage/provider
*/
const request = require('request').defaults({ gzip: true, json: true })
const config = require('config')

function Model (koop) {}

// Public function to return data from the
// Return: GeoJSON FeatureCollection
//
// Config parameters (config/default.json)
// req.
//
// URL path parameters:
// req.params.host (if index.js:hosts true)
// req.params.id  (if index.js:disableIdParam false)
// req.params.layer
// req.params.method
Model.prototype.getData = function (req, callback) {
  const key = config.trimet.key

  const { query: { host, mission, formId, username, password } } = req

  const options = {
    url: `https://${username}:${password}@${host}/en/m/${mission}/odata/v1/Responses-${formId}`,
    headers: {
      'Auth': 'token foo'
    }
  };

  const oldExampleUrl = `https://developer.trimet.org/ws/v2/vehicles/onRouteOnly/false/appid/${key}`

  // Call the remote API with our developer key
  request(options.url, (err, res, body) => {
    if (err) return callback(err)

    // translate the response into geojson
    const geojson = {
      type: 'FeatureCollection',
      features: body.value.map(formatFeature),
      // Example of metadata options: https://github.com/koopjs/FeatureServer
      metadata: {
        idField: "ResponseID"
      }
      // Optional: cache data for N seconds at a time.
      // ttl: 10
    }

    // hand off the data to Koop
    callback(null, geojson)
  })
}

function formatFeature (inputFeature) {
  // Most of what we need to do here is extract the longitude and latitude
  const feature = {
    type: 'Feature',
    properties: inputFeature,
  }

  // Temporary hack for demo.
  if (inputFeature.LocationQ) {
    feature.geometry = {
      type: 'Point',
      coordinates: [inputFeature.LocationQ.Longitude, inputFeature.LocationQ.Latitude]
    }
    delete feature.properties.LocationQ
  }

  return feature
}

module.exports = Model

/* Example provider API:
   - needs to be converted to GeoJSON Feature Collection
{
  "resultSet": {
  "queryTime": 1488465776220,
  "vehicle": [
    {
      "tripID": "7144393",
      "signMessage": "Red Line to Beaverton",
      "expires": 1488466246000,
      "serviceDate": 1488441600000,
      "time": 1488465767051,
      "latitude": 45.5873117,
      "longitude": -122.5927705,
    }
  ]
}

Converted to GeoJSON:

{
  "type": "FeatureCollection",
  "features": [
    "type": "Feature",
    "properties": {
      "tripID": "7144393",
      "signMessage": "Red Line to Beaverton",
      "expires": "2017-03-02T14:50:46.000Z",
      "serviceDate": "2017-03-02T08:00:00.000Z",
      "time": "2017-03-02T14:42:47.051Z",
    },
    "geometry": {
      "type": "Point",
      "coordinates": [-122.5927705, 45.5873117]
    }
  ]
}
*/
