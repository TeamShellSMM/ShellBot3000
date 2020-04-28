exports.up = function(knex) {
  return knex.schema.createTable('points', function(t) {
    t.dateTime('created_at').notNull().defaultTo(knex.raw('CURRENT_TIMESTAMP'));
    t.dateTime('updated_at').nullable();
    t.dateTime('deleted_at').nullable();

    t.string('guild_id',30).notNull();
    t.float('difficulty').notNull();
    t.float('score').notNull();
  })
  .alterTable('levels', function(t) {
    t.float('clear_score').notNull().defaultTo(0.0);
  })
  .alterTable('members', function(t) {
    t.float('clear_score_sum').notNull().defaultTo(0.0);
    t.integer('levels_created').notNull().defaultTo(0);
    t.integer('levels_cleared').notNull().defaultTo(0);
  });;
};

exports.down = function(knex) {
  return knex.schema.dropTable('points')
  .table('levels', function(t){
    t.dropColumn('clear_score');
  })
  .table('members', function(t){
    t.dropColumn('clear_score_sum');
    t.dropColumn('levels_created');
    t.dropColumn('levels_cleared');
  });
};
