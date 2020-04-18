const config = require('./config.json');
module.exports = {
  development:config.db,
  test:config.db,
  production:config.db
};
