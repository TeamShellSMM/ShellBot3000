const { Model } = require('objection');
const knex = require('../db/knex')
Model.knex(knex)

class PendingVotes extends Model {
  static get tableName() {
    return 'pending_votes';
  }
}

module.exports = PendingVotes;