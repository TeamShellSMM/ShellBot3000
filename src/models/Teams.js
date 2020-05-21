const TSModel = require('../TSModel.js');

module.exports = (guild_id, ts) => {
  class Teams extends TSModel(guild_id, ts) {
    static get tableName() {
      return 'teams';
    }
  }
  return Teams;
};
