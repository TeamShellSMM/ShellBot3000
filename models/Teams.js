const TSModel = require('../TSModel.js')
const { Model } = require('objection');

module.exports = (guild_id) => { 
  if(guild_id){
    class Teams extends TSModel(guild_id) {
      static get tableName() {
        return 'teams';
      }
    }
    return Teams;
  } else {
    class Teams extends Model {
      static get tableName() {
        return 'teams';
      }
    }
    return Teams;
  }
}