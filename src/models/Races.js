const TSModel = require('../TSModel.js');

module.exports = (guild_id, ts) => {
  class Races extends TSModel(guild_id, ts) {
    static get tableName() {
      return 'races';
    }
  }
  return Races;
};
