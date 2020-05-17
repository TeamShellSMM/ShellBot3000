const { Model } = require('objection');
const TSModel = require('../TSModel.js');

module.exports = (guild_id, ts) => {
  if (guild_id) {
    class Teams extends TSModel(guild_id, ts) {
      static get tableName() {
        return 'teams';
      }
    }
    return Teams;
  }
  class Teams extends Model {
    static get tableName() {
      return 'teams';
    }
  }
  return Teams;
};
