const TSModel = require('../TSModel.js');

module.exports = (guild_id, ts) => {
  class Plays extends TSModel(guild_id, ts) {
    static get tableName() {
      return 'plays';
    }
  }
  return Plays;
};
