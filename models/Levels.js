const { Model,QueryBuilder } = require('objection');
const TSModel = require('../TSModel.js')
const Member = require('./Members.js')
const Teams = require('./Teams.js')

module.exports = (guild_id,ts) => {
  class Levels extends TSModel(guild_id,ts) {
    static get tableName() {
      return 'levels';
    }
    static relationMappings = {
      Creator: {
        relation: Model.BelongsToOneRelation,
        modelClass: Member,
        join: {
          from: 'levels.creator',
          to: 'members.id'
        }
      },
      team:{
        relation: Model.BelongsToOneRelation,
        modelClass: Teams,
        join: {
          from: 'levels.guild_id',
          to: 'teams.id'
        }
      }
    };
  }
  return Levels;
}