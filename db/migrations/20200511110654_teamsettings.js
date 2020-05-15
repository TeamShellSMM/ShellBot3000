
exports.up = function(knex) {
  return knex.schema.createTable('team_settings', function(t) {
    t.increments('id').unsigned().primary();
    t.dateTime('created_at').notNull().defaultTo(knex.raw('CURRENT_TIMESTAMP'));
    t.dateTime('updated_at').nullable();
    t.dateTime('deleted_at').nullable();

    t.integer('guild_id').notNull()
    t.string('type').notNull();
    t.string('name').notNull();
    t.text('value').nullable();
    t.integer('admin_id').notNull();

    t.foreign('admin_id').references('id').inTable('members');
    t.foreign('guild_id').references('id').inTable('teams');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('team_settings')
};
