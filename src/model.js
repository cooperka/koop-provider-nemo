const request = require('axios');
const config = require('config');
const { forOwn } = require('lodash');

const example = {
  koopHost: 'my-koop.org',
  host: 'my-nemo.org',
  mission: 'my_mission',
  username: 'my_user',
  password: 'my_pass',
  formId: 'example-form-id-123',
};

const FULL_EXAMPLE = `https://${example.koopHost}/nemo/${example.host} ${example.mission} ${example.username} ${example.password}/${example.formId}/FeatureServer/`;

function Model(koop) {}

Model.prototype.getData = async (request, callback) => {
  try {
    const options = getOptions(request);
    await performRequest(options, callback);
  } catch (error) {
    callback(error);
  }
};

function getOptions(request) {
  // Client can optionally configure things here.
  const {} = config;

  const { host: hostTokens, id: formId } = request.params;
  const [host, mission, username, password, ...excess] = hostTokens.split(' ');
  if (!host) return missingParam(callback, 'Host', example.host);
  if (!mission) return missingParam(callback, 'Mission', example.mission);
  if (!username) return missingParam(callback, 'Username', example.username);
  if (!password) return missingParam(callback, 'Password', example.password);
  if (excess && excess.length) return excessParam(callback, excess);

  return {
    url: `https://${username}:${password}@${host}/en/m/${mission}/odata/v1/Responses-${formId}`,
    // TODO: Support auth tokens instead of user/pass.
    headers: {
      Auth: 'token foo',
    },
  };
}

async function performRequest(options, callback) {
  console.debug(`<- Requesting ${options.url}`);

  return request(options.url).then(({ data }) => {
    // translate the response into geojson
    const geojson = {
      type: 'FeatureCollection',
      features: data.value.map(formatFeature),
      // Example of metadata options: https://github.com/koopjs/FeatureServer
      metadata: {
        name: 'NEMO',
        idField: 'ResponseID',
      },
      // Optional: cache data for N seconds at a time.
      ttl: 10,
    };

    // hand off the data to Koop
    callback(null, geojson);
  });
}

function formatFeature(inputFeature) {
  // Most of what we need to do here is extract the longitude and latitude
  const feature = {
    type: 'Feature',
    properties: inputFeature,
  };

  forOwn(inputFeature, (value, key) => {
    if (value && value.Longitude != null) {
      feature.geometry = {
        type: 'Point',
        coordinates: [value.Longitude, value.Latitude],
      };
      delete feature.properties[key];
    }
  });

  return feature;
}

function missingParam(callback, param, example) {
  const msg = `${param} not provided, should look like ${example}. Full example: ${FULL_EXAMPLE}.`;
  callback(new Error(msg));
}

function excessParam(callback, excess) {
  const msg = `Unexpected additional params: ${excess}. Full example: ${FULL_EXAMPLE}.`;
  callback(new Error(msg));
}

module.exports = Model;

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
