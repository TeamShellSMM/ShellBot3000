
exports.up = function(knex) {
  return knex.schema
  .alterTable('levels', function(t) {
    t.integer('old_status').notNull().defaultTo(0);
  })
  
};

exports.down = function(knex) {
  return knex.schema
  .alterTable('levels', function(t) {
    t.dropColumn('old_status');
  })
};