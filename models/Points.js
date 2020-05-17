const TSModel = require('../TSModel.js');

module.exports = (guild_id, ts) => {
  class Points extends TSModel(guild_id, ts) {
    static get tableName() {
      return 'points';
    }
  }
  return Points;
};
