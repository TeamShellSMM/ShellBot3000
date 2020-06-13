const TSModel = require('../TSModel.js');

module.exports = (guild_id, ts) => {
  class RaceEntrants extends TSModel(guild_id, ts) {
    static get tableName() {
      return 'race_entrants';
    }
  }
  return RaceEntrants;
};
