const axios = require('axios');
const config = require('config');
const { forOwn } = require('lodash');

const example = {
  koopHost: 'koop.getnemo.org',
  host: 'my.nemo-server.org',
  mission: 'my_mission',
  username: 'my_user',
  password: 'my_pass',
  formId: 'my-form-id',
};

const FULL_EXAMPLE = `https://${example.koopHost}/nemo/${example.host} ${example.mission} ${example.username} ${example.password}/${example.formId}/FeatureServer/`;

function Model(koop) {}

Model.prototype.getData = async (request, callback) => {
  try {
    const options = getOptions(request);
    const geojson = await performRequest(options);
    callback(null, geojson);
  } catch (error) {
    try {
      logError(error);
      callback(error);
    } catch (error) {
      // Certain types of error, e.g. HTTPS certificate issues may result in failed callback.
      // That's strange but this will catch anything that might go wrong.
      console.error('Failed to callback:', error);
      callback(new Error('Something went wrong.'));
    }
  }
};

function getOptions(request) {
  // Client can optionally configure things here.
  const {} = config;

  const { host: hostTokens, id: formId } = request.params;
  const [host, mission, username, password, ...excess] = hostTokens.split(' ');
  if (!host) throw missingParamError('Host', example.host);
  if (!mission) throw missingParamError('Mission', example.mission);
  if (!username) throw missingParamError('Username', example.username);
  if (!password) throw missingParamError('Password', example.password);
  if (excess && excess.length) throw excessParamError(excess);

  const auth = Buffer.from(`${username}:${password}`).toString('base64');

  return {
    url: `https://${host}/en/m/${mission}/odata/v1/Responses-${formId}`,
    // TODO: Support auth tokens instead of user/pass.
    headers: {
      Authorization: `Basic ${auth}`,
    },
  };
}

async function performRequest(options) {
  console.debug(`<- Requesting ${options.url}`);

  return axios(options).then(({ data }) => {
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

    return geojson;
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

function missingParamError(param, example) {
  const msg = `${param} not provided, should look like ${example}. Full example: ${FULL_EXAMPLE}.`;
  return new Error(msg);
}

function excessParamError(excess) {
  const msg = `Unexpected additional params: ${excess}. Full example: ${FULL_EXAMPLE}.`;
  return new Error(msg);
}

function logError(error) {
  if (error.isAxiosError) {
    console.error(error.stack);
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      delete error.response.request;
      console.error('Response:', error.response);
    } else if (error.request) {
      // The request was made but no response was received
      // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
      // http.ClientRequest in node.js
      console.error('Request:', error.request);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('Config:', error.config);
    }
  } else {
    console.error(error);
  }
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
