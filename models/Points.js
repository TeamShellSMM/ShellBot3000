const TSModel = require('../TSModel.js')

module.exports = (guild_id) => {
  class Points extends TSModel(guild_id, 'points') {
    static get tableName() {
      return 'points';
    }
  }
  return Points;
}