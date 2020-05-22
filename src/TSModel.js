const { Model, QueryBuilder } = require('objection');
const knex = require('./db/knex');

Model.knex(knex);

module.exports = (guild_id) => {
  class TSQueryBuilder extends QueryBuilder {
    constructor(...args) {
      super(...args);
      this.onBuild((builder) => {
        builder.where(`${this.tableName()}.guild_id`, guild_id);
      });
    }
  }

  class TSModel extends Model {
    async $beforeInsert(queryContext) {
      await super.$beforeInsert(queryContext);
      this.guild_id = guild_id;
    }
  }
  TSModel.QueryBuilder = TSQueryBuilder;
  return TSModel;
};
