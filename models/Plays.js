const TSModel = require('../TSModel.js')

module.exports = (guild_id) => {
  class Plays extends TSModel(guild_id) {
    static get tableName() {
      return 'plays';
    }
  }
  return Plays;
}