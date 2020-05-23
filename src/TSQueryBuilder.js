const { QueryBuilder } = require('objection');

module.exports = (guild_id) => {
  class TSQueryBuilder extends QueryBuilder {
    constructor(...args) {
      super(...args);
      this.onBuild((builder) => {
        builder.where(`${this.tableName()}.guild_id`, guild_id);
      });
    }
  }
  return TSQueryBuilder;
};
