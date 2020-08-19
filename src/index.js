// Define the provider path
// /:name/:hosts?/:disableIdParam?/FeatureServer/:layer/:method
// e.g. /example/FeatureServer/0/query
const provider = {
  type: 'provider',
  name: 'nemo',
  hosts: true, // if true, also adds disableIdParam
  disableIdParam: false, // if true, adds to path and req.params
  Controller: require('./controller'),
  Model: require('./model'),
  routes: require('./routes'),
  version: require('../package.json').version,
};

module.exports = provider;
