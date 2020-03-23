const { Model } = require('objection');
const knex = require('../db/knex')
Model.knex(knex)

class Plays extends Model {
  static get tableName() {
    return 'plays';
  }
}

module.exports = Plays;