# Koop Provider for NEMO

Cloned from the example Koop provider.
Full documentation is provided [here](https://koopjs.github.io/docs/usage/provider).

## Koop provider file structure

| File | | Description |
| --- | --- | --- |
| `src/index.js` | Mandatory | Configures provider for usage by Koop |
| `src/model.js` | Mandatory | Translates remote API to GeoJSON |
| `src/routes.js` | Optional | Specifies additional routes to be handled by this provider |
| `src/controller.js` | Optional | Handles additional routes specified in `routes.js` |
| `test/model-test.js` | Optional | tests the `getData` function on the model |
| `test/fixtures/input.json` | Optional | a sample of the raw input from the 3rd party API |
| `config/default.json` | Optional | used for advanced configuration, usually API keys. |

## Test it out

Run server:
- `npm install`
- `npm start`

Example API Query:
- `curl localhost:8080/example/FeatureServer/0/query?returnCountOnly=true`

Tests:
- `npm test`

### Development output callstack logs

During development you can output error callstack with

- `NODE_ENV=test npm start`

## Publish to npm

- run `npm init` and update the fields
  - Choose a name like `koop-provider-foo`
- run `npm publish`
