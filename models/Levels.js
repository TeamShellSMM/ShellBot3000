const TSModel = require('../TSModel.js')

module.exports = (guild_id,ts) => {
  class Levels extends TSModel(guild_id,ts) {
    static get tableName() {
      return 'levels';
    }
  }
  return Levels;
}