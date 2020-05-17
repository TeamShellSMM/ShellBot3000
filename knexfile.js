const config = require('./config.json');

module.exports = {
  development: config.development.db,
  test: config.test.db,
  production: config.production.db,
};
