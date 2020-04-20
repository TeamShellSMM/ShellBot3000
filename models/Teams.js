const TSModel = require('../TSModel.js')

module.exports = (guild_id) => { 
  class Teams extends TSModel(guild_id) {
    static get tableName() {
      return 'teams';
    }
  }
  return Teams; 
}