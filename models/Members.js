const TSModel = require('../TSModel.js')

module.exports = (guild_id) => {
  class Members extends TSModel(guild_id) {
    static get tableName() {
      return 'members';
    }
  }
  return Members;
}