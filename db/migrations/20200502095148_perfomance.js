
exports.up = function(knex) {
  return knex.schema
  .alterTable('plays', function(t) {
    t.index(['guild_id','code','player'])
  })
};

exports.down = function(knex) {
  return knex.schema
  .alterTable('plays', function(t) {
    t.dropIndex(['guild_id','code','player'])
  })
};
