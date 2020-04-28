
exports.up = function(knex) {
  return knex.schema
  .alterTable('points', function(t) {
    t.index(['guild_id','difficulty'])
  })
  .alterTable('members', function(t) {
    t.index(['guild_id','discord_id'])
    t.index(['guild_id','name'])
  })
  .alterTable('levels', function(t) {
    t.index(['guild_id','code'])
  })
  .alterTable('plays', function(t) {
    t.index(['guild_id','player'])
    t.index(['guild_id','code'])
  })
  .alterTable('teams', function(t) {
    t.index(['guild_id','url_slug'])
  })

};

exports.down = function(knex) {
  return knex.schema
  .alterTable('points', function(t) {
    t.dropIndex(['guild_id','difficulty'])
  })
  .alterTable('members', function(t) {
    t.dropIndex(['guild_id','discord_id'])
    t.dropIndex(['guild_id','name'])
  })
  .alterTable('levels', function(t) {
    t.dropIndex(['guild_id','code'])
  })
  .alterTable('plays', function(t) {
    t.dropIndex(['guild_id','player'])
    t.dropIndex(['guild_id','code'])
  })
  .alterTable('teams', function(t) {
    t.dropIndex(['guild_id','url_slug'])
  })
};
