const TSModel = require('../TSModel.js');

module.exports = (guild_id, ts) => {
  class Tags extends TSModel(guild_id, ts) {
    static get tableName() {
      return 'tags';
    }
  }
  return Tags;
};
