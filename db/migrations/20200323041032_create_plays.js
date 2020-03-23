exports.up = function(knex) {
  return knex.schema.createTable('plays', function(t) {
    t.increments('id').unsigned().primary();
    t.dateTime('created_at').notNull().defaultTo(knex.raw('CURRENT_TIMESTAMP'));
    t.dateTime('updated_at').nullable();
    t.dateTime('deleted_at').nullable();

    t.string('code').notNull();
    t.string('player').notNull();
    t.boolean('completed').notNull().defaultTo(0);
    t.boolean('is_shellder').notNull().defaultTo(0);
    t.boolean("liked").notNull().defaultTo(0);
    t.decimal("difficulty_vote",3,1).nullable();
  });
};

exports.down = function(knex) {
  knex.schema.dropTable('tokens')
};
