
exports.up = function(knex) {
    return knex.schema.createTable('pending_votes', function(t) {
    t.increments('id').unsigned().primary();
    t.dateTime('created_at').notNull().defaultTo(knex.raw('CURRENT_TIMESTAMP'));
    t.dateTime('updated_at').nullable();
    t.dateTime('deleted_at').nullable();

    t.string('code').notNull().index();
    t.string('player').notNull();
    t.boolean('is_shellder').notNull().defaultTo(0);
    t.string('type').notNull().defaultTo('');
    t.decimal("difficulty_vote",3,1).nullable();
    t.text('reason','longtext').notNull().defaultTo('');;
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('pending_votes')
};
