exports.up = function(knex) {
  return knex.schema.createTable('points', function(t) {
    t.string('guild_id',30).notNull();
    t.float('difficulty').notNull();
    t.float('score').notNull();
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('points')
};
