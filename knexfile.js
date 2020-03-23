const config = require('./config.json');
module.exports = {
  development:config.development,
  staging: config.staging,
  production:config.production,
  debug:config.debug
};
