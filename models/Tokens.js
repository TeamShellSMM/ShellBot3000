const TSModel = require('../TSModel.js')

module.exports = (guild_id) => { 
  class Tokens extends TSModel(guild_id) {
    static get tableName() {
      return 'tokens';
    }
  }
  return Tokens; 
}