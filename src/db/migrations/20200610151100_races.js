exports.up = function (knex) {
  return knex.schema
    .createTable('races', function (t) {
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
      t.string('status').notNull().defaultTo("upcoming");
      t.dateTime('start_date').nullable();
      t.dateTime('end_date').nullable();

      t.integer('level_id')
        .unsigned()
        .references('levels.id')
        .nullable();

      t.string('race_type').notNull().defaultTo("FC");
      t.string('level_type').notNull().defaultTo("random-uncleared");

      t.decimal('level_filter_diff_from', 4, 1).notNull();
      t.decimal('level_filter_diff_to', 4, 1).notNull();

      t.integer('level_filter_tag_id').unsigned().references('tags.id').nullable();
      t.string('level_filter_submission_time_type').notNull().defaultTo("all");
      t.boolean('level_filter_failed').notNull().defaultTo(false);

      t.index(['guild_id', 'level_id']);
    })
    .createTable('race_entrants', function (t) {
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

      t.integer('race_id')
        .unsigned()
        .references('races.id')
        .notNull();

      t.integer('member_id')
        .unsigned()
        .references('members.id')
        .notNull();

      t.dateTime('finished_date').nullable();
      t.integer('rank').nullable();

      t.index(['race_id', 'member_id']);
    });
};

exports.down = function (knex) {
  return knex.schema
    .dropTable('race_entrants')
    .dropTable('races');
};
