const TSModel = require('../TSModel.js')

module.exports = (guild_id,ts) => {
  class PendingVotes extends TSModel(guild_id,ts) {
    static get tableName() {
      return 'pending_votes';
    }
  }
  return PendingVotes;
}