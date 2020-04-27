const TSModel = require('../TSModel.js')

module.exports = (guild_id) => {
  class Members extends TSModel(guild_id, 'members') {
    static get tableName() {
      return 'members';
    }
  }
  return Members;
}