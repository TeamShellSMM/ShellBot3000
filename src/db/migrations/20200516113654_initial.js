exports.up = function (knex) {
  return knex.schema
    .createTable('tokens', function (t) {
      t.increments('id').unsigned().primary();
      t.dateTime('created_at')
        .notNull()
        .defaultTo(knex.raw('CURRENT_TIMESTAMP'));
      t.dateTime('updated_at').nullable();
      t.dateTime('deleted_at').nullable();

      t.string('discord_id').notNull();
      t.string('token').notNull();
      t.boolean('authenticated').notNull().defaultTo(false);
    })
    .createTable('teams', function (t) {
      t.increments('id').unsigned().primary();
      t.dateTime('created_at')
        .notNull()
        .defaultTo(knex.raw('CURRENT_TIMESTAMP'));
      t.dateTime('updated_at').nullable();
      t.dateTime('deleted_at').nullable();

      t.string('guild_id', 30).notNull().index();
      t.string('guild_name').notNull();
      t.string('url_slug').notNull();
      t.text('config').nullable();
      t.text('web_config').nullable();
      t.boolean('active').notNull().defaultTo(false);
      t.boolean('public').notNull().defaultTo(true);
      t.boolean('banned').notNull().defaultTo(false);

      t.index(['guild_id', 'url_slug']);
    })
    .createTable('members', function (t) {
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
      t.string('discord_id').notNull();
      t.string('name').notNull();

      t.boolean('is_mod').nullable();
      t.boolean('is_member').nullable();

      t.string('discord_name').nullable();

      t.string('maker_id').nullable();
      t.string('maker_name').nullable();
      t.string('world_description').nullable();
      t.string('badges').nullable();

      t.string('twitch').nullable();
      t.string('youtube').nullable();
      t.string('twitter').nullable();

      t.boolean('is_banned').nullable();
      t.boolean('atme').nullable();

      t.float('clear_score_sum').notNull().defaultTo(0.0);
      t.integer('levels_created').notNull().defaultTo(0);
      t.integer('levels_cleared').notNull().defaultTo(0);

      t.decimal('maker_points', 8, 1).notNull().default(0);
      t.decimal('own_score', 6, 1).notNull().default(0);
      t.integer('free_submissions').notNull().default(0);

      t.integer('world_world_count').notNull().defaultTo(0);
      t.integer('world_level_count').notNull().defaultTo(0);

      t.string('discord_id_temp'); // only used on testing servers for mockUser

      t.index(['guild_id', 'discord_id']);
      t.index(['guild_id', 'name']);
    })
    .createTable('points', function (t) {
      t.dateTime('created_at')
        .notNull()
        .defaultTo(knex.raw('CURRENT_TIMESTAMP'));
      t.dateTime('updated_at').nullable();
      t.dateTime('deleted_at').nullable();

      t.integer('guild_id')
        .unsigned()
        .references('teams.id')
        .notNull();
      t.decimal('difficulty', 4, 1).notNull();
      t.decimal('score', 5, 1).notNull();

      t.index(['guild_id', 'difficulty']);
    })
    .createTable('levels', function (t) {
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
      t.integer('creator')
        .unsigned()
        .references('members.id')
        .notNull();
      t.decimal('difficulty', 4, 1).nullable();

      t.string('code').notNull();
      t.string('level_name').notNull();

      t.integer('status').notNull().defaultTo(0);
      t.integer('old_status').notNull().defaultTo(0);
      t.string('newCode').nullable();

      t.string('videos').notNull().defaultTo('');
      t.string('tags').notNull().defaultTo('');
      t.boolean('is_free_submission').nullable();

      t.integer('likes').notNull().default(0);
      t.integer('clears').notNull().default(0);
      t.integer('num_votes').notNull().default(0);
      t.decimal('average_votes', 4, 1).notNull().default(0);
      t.decimal('maker_points', 8, 1).notNull().default(0);
      t.integer('row_num').nullable();
      t.decimal('clear_like_ratio', 4, 1).notNull().default(0);
      t.boolean('not_default').nullable();

      t.integer('rejects').notNull().default(0);
      t.integer('approves').notNull().default(0);
      t.integer('want_fixes').notNull().default(0);

      t.index(['guild_id', 'code']);
    })
    .createTable('plays', function (t) {
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
      t.integer('player')
        .unsigned()
        .references('members.id')
        .notNull();
      t.integer('code').unsigned().references('levels.id').notNull();
      t.boolean('completed').notNull().defaultTo(0);
      t.boolean('is_shellder').notNull().defaultTo(0);
      t.boolean('liked').notNull().defaultTo(0);
      t.decimal('difficulty_vote', 3, 1).nullable();

      t.index(['guild_id', 'player']);
      t.index(['guild_id', 'code']);
    })
    .createTable('pending_votes', function (t) {
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
      t.integer('player')
        .unsigned()
        .references('members.id')
        .notNull();
      t.integer('code').unsigned().references('levels.id').notNull();

      t.boolean('is_shellder').notNull().defaultTo(0);
      t.string('type').notNull().defaultTo('');
      t.decimal('difficulty_vote', 3, 1).nullable();
      t.text('reason').notNull().defaultTo('');
    })
    .createTable('team_settings', function (t) {
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
      t.string('type').notNull();
      t.string('name').notNull();
      t.text('value').nullable();
      t.integer('admin_id')
        .unsigned()
        .references('members.id')
        .notNull();
    })
    .createTable('seasons', function (t) {
      t.increments('id').unsigned().primary();
      t.dateTime('created_at')
        .notNull()
        .defaultTo(knex.raw('CURRENT_TIMESTAMP'));
      t.dateTime('updated_at').nullable();
      t.dateTime('deleted_at').nullable();
      t.integer('admin_id')
        .unsigned()
        .references('members.id')
        .notNull();
      t.integer('guild_id')
        .unsigned()
        .references('teams.id')
        .notNull();

      t.dateTime('start_date').nullable();
      t.string('name').notNull();
    })
    .createTable('competition_winners', function (t) {
      t.increments('id').unsigned().primary();
      t.dateTime('created_at')
        .notNull()
        .defaultTo(knex.raw('CURRENT_TIMESTAMP'));
      t.dateTime('updated_at').nullable();
      t.dateTime('deleted_at').nullable();
      t.integer('admin_id')
        .unsigned()
        .references('members.id')
        .notNull();
      t.integer('guild_id')
        .unsigned()
        .references('teams.id')
        .notNull();

      t.integer('code').unsigned().references('levels.id').notNull();
      t.integer('creator')
        .unsigned()
        .references('members.id')
        .notNull();
      t.integer('competition_id').nullable();
      t.string('details').nullable();
      t.integer('rank').nullable();
    })
    .createTable('ranks', function (t) {
      t.increments('id').unsigned().primary();
      t.dateTime('created_at')
        .notNull()
        .defaultTo(knex.raw('CURRENT_TIMESTAMP'));
      t.dateTime('updated_at').nullable();
      t.dateTime('deleted_at').nullable();
      t.integer('admin_id')
        .unsigned()
        .references('members.id')
        .notNull();
      t.integer('guild_id')
        .unsigned()
        .references('teams.id')
        .notNull();

      t.string('type').nullable();
      t.integer('min_points').nullable();
      t.string('rank').nullable();
      t.string('pips').nullable();
      t.string('discord_role').nullable();
    })
    .createTable('tags', function (t) {
      t.increments('id').unsigned().primary();
      t.dateTime('created_at')
        .notNull()
        .defaultTo(knex.raw('CURRENT_TIMESTAMP'));
      t.dateTime('updated_at').nullable();
      t.dateTime('deleted_at').nullable();
      t.integer('admin_id')
        .unsigned()
        .references('members.id')
        .nullable();
      t.integer('guild_id')
        .unsigned()
        .references('teams.id')
        .notNull();

      t.string('name').notNull();
      t.string('synonymous_to').nullable();
      t.string('type').nullable();
      t.string('color').nullable();
      t.boolean('is_seperate').nullable();
      t.boolean('add_lock').nullable();
      t.boolean('remove_lock').nullable();
      t.boolean('is_hidden').nullable();
    });
};

exports.down = function (knex) {
  return knex.schema
    .dropTable('tokens')
    .dropTable('team_settings')
    .dropTable('tags')
    .dropTable('ranks')
    .dropTable('plays')
    .dropTable('pending_votes')
    .dropTable('seasons')
    .dropTable('competition_winners')
    .dropTable('levels')
    .dropTable('points')
    .dropTable('members')
    .dropTable('teams');
};
