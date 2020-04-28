const TSModel = require('../TSModel.js')

module.exports = (guild_id,ts) => {
  class Members extends TSModel(guild_id,ts) {
    static get tableName() {
      return 'members';
    }
  }
  return Members;
}