const config = require('./config.json');
module.exports = {
  development:config.development.db,
  testing:config.testing.db,
  production:config.production.db,
};