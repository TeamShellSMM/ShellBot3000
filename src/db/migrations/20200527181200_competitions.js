exports.up = function (knex) {
  return knex.schema
    .createTable('competition_groups', function (t) {
      t.increments('id').unsigned().primary();
      t.dateTime('created_at')
        .notNull()
        .defaultTo(knex.raw('CURRENT_TIMESTAMP'));
      t.dateTime('updated_at').nullable();
      t.dateTime('deleted_at').nullable();

      t.integer('guild_id')
        .unsigned()
        .references('teams.id')
        .notNull();

      t.string('name').nullable();
      t.string('competition_tag').nullable();
      t.text('description').nullable();
      t.text('rules').nullable();
    })
    .createTable('competitions', function (t) {
      t.increments('id').unsigned().primary();
      t.dateTime('created_at')
        .notNull()
        .defaultTo(knex.raw('CURRENT_TIMESTAMP'));
      t.dateTime('updated_at').nullable();
      t.dateTime('deleted_at').nullable();

      t.integer('guild_id')
        .unsigned()
        .references('teams.id')
        .notNull();

      t.integer('competition_group_id')
        .unsigned()
        .references('competition_groups.id')
        .notNull();

      t.integer('comp_number').notNull();
      t.dateTime('start_date').nullable();
      t.dateTime('end_date').nullable();
      t.text('description').nullable();
      t.text('rules').nullable();
    });
};

exports.down = function (knex) {
  return knex.schema
    .dropTable('competitions')
    .dropTable('competition_groups');
};
