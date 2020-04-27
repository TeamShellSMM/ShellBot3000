const TSModel = require('../TSModel.js')

module.exports = (guild_id) => {
  class PendingVotes extends TSModel(guild_id) {
    static get tableName() {
      return 'pending_votes';
    }
  }
  return PendingVotes;
}