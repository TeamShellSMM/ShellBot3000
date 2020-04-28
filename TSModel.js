const { Model,QueryBuilder } = require('objection');
const moment = require('moment');
const knex = require('./db/knex')
Model.knex(knex)

module.exports = (guild_id,table_name) => {
  class TSQueryBuilder extends QueryBuilder {
    constructor(...args) {
      super(...args);
      this.onBuild(builder => {
        builder.where(this.tableName() + '.guild_id',guild_id);
      });
    }
  }

  class TSModel extends Model {

    $beforeInsert() {
      this.guild_id=guild_id
    }

    $beforeUpdate() {
      this.updated_at=moment().format("YYYY-MM-DD HH:mm:ss")
    }

  }
  TSModel.QueryBuilder = TSQueryBuilder
  return TSModel;
}