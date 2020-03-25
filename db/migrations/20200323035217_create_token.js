
exports.up = function(knex) {
  return knex.schema.createTable('tokens', function(t) {
    t.increments('id').unsigned().primary();
    t.dateTime('created_at').notNull().defaultTo(knex.raw('CURRENT_TIMESTAMP'));
    t.dateTime('updated_at').nullable();
    t.dateTime('deleted_at').nullable();

    t.string('discord_id').notNull();
    t.string('token').notNull();
    t.boolean('authenticated').notNull().defaultTo(false);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('tokens')
};
