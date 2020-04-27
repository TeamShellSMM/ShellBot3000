exports.up = function(knex) {
  return knex.schema.createTable('points', function(t) {
    t.string('guild_id',30).notNull();
    t.float('difficulty').notNull();
    t.float('score').notNull();
  })
  .alterTable('levels', function(t) {
    t.float('clear_score').notNull().defaultTo(0.0);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('points')
  .table('levels', function(t){
    t.dropColumn('clear_score');
  });
};
