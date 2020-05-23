const { Model } = require('objection');
const TSQueryBuilder = require('./TSQueryBuilder');
const knex = require('./db/knex');

Model.knex(knex);

module.exports = (guild_id) => {
  class TSModel extends Model {
    async $beforeInsert(queryContext) {
      await super.$beforeInsert(queryContext);
      this.guild_id = guild_id;
    }
  }
  TSModel.QueryBuilder = TSQueryBuilder(guild_id);
  return TSModel;
};
