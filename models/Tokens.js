const { Model } = require('objection');
const knex = require('../db/knex')
Model.knex(knex)

class Tokens extends Model {
  static get tableName() {
    return 'tokens';
  }
}

module.exports = Tokens;