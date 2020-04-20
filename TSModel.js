const { Model,QueryBuilder } = require('objection');
const knex = require('./db/knex')
Model.knex(knex)

module.exports = (guild_id) => { 
  class TSQueryBuilder extends QueryBuilder {
    constructor(...args) {
      super(...args);
      this.onBuild(builder => {
        builder.where('guild_id',guild_id);
      });
    }
  }

  class TSModel extends Model {

    $beforeInsert() {
      this.guild_id=guild_id
    }

  }
  TSModel.QueryBuilder = TSQueryBuilder
  return TSModel; 
}