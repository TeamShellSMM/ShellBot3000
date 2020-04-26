const TSModel = require('../TSModel.js')

module.exports = (guild_id) => { 
  class Levels extends TSModel(guild_id) {
    static get tableName() {
      return 'levels';
    }
  }
  return Levels; 
}