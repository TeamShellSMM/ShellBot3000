const TSModel = require('../TSModel.js');

module.exports = (guild_id, ts) => {
  class Videos extends TSModel(guild_id, ts) {
    static get tableName() {
      return 'videos';
    }
  }
  return Videos;
};
