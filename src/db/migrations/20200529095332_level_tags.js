exports.up = function (knex) {
  return knex.schema.createTable('level_tags', function (t) {
    t.increments('id').unsigned().primary();
    t.dateTime('created_at')
      .notNull()
      .defaultTo(knex.raw('CURRENT_TIMESTAMP'));
    t.dateTime('updated_at').nullable();
    t.dateTime('deleted_at').nullable();

    t.integer('guild_id').unsigned().references('teams.id').notNull();
    t.integer('level_id')
      .unsigned()
      .references('levels.id')
      .notNull();
    t.integer('tag_id').unsigned().references('tags.id').notNull();
    t.integer('user_id')
      .unsigned()
      .references('members.id')
      .nullable();
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable('level_tags');
};
