
exports.up = function(knex) {
  return knex.schema
      .createTable('seasons', function(t) {
        t.increments('id').unsigned().primary();
        t.dateTime('created_at').notNull().defaultTo(knex.raw('CURRENT_TIMESTAMP'));
        t.dateTime('updated_at').nullable();
        t.dateTime('deleted_at').nullable();
        t.integer('admin_id').notNull();
        t.integer('guild_id').notNull()


        t.dateTime('start_date').nullable();
        t.string('name').notNull();
        

        t.foreign('admin_id').references('id').inTable('members');
        t.foreign('guild_id').references('id').inTable('teams');
      })
      .createTable('competition_winners', function(t) {
        t.increments('id').unsigned().primary();
        t.dateTime('created_at').notNull().defaultTo(knex.raw('CURRENT_TIMESTAMP'));
        t.dateTime('updated_at').nullable();
        t.dateTime('deleted_at').nullable();
        t.integer('admin_id').notNull();
        t.integer('guild_id').notNull()
        
        t.integer('code').notNull()
        t.integer('creator').notNull()
        t.integer('competition_id').nullable();
        t.string('details').nullable();
        t.integer('rank').nullable();
        
        t.foreign('creator').references('id').inTable('members');
        t.foreign('code').references('id').inTable('levels');
        t.foreign('admin_id').references('id').inTable('members');
        t.foreign('guild_id').references('id').inTable('teams');
      })
      .createTable('ranks', function(t) {
        t.increments('id').unsigned().primary();
        t.dateTime('created_at').notNull().defaultTo(knex.raw('CURRENT_TIMESTAMP'));
        t.dateTime('updated_at').nullable();
        t.dateTime('deleted_at').nullable();
        t.integer('admin_id').notNull();
        t.integer('guild_id').notNull()


        t.string('type').nullable();
        t.integer('min_points').nullable();
        t.string('rank').nullable();
        t.string('pips').nullable();
        t.string('discord_role').nullable();
        
        t.foreign('admin_id').references('id').inTable('members');
        t.foreign('guild_id').references('id').inTable('teams');
      })
      .createTable('tags', function(t) {
        t.increments('id').unsigned().primary();
        t.dateTime('created_at').notNull().defaultTo(knex.raw('CURRENT_TIMESTAMP'));
        t.dateTime('updated_at').nullable();
        t.dateTime('deleted_at').nullable();
        t.integer('admin_id').nullable();
        t.integer('guild_id').notNull()

        t.string('name').notNull();
        t.string('synonymous_to').nullable();
        t.string('type').nullable();
        t.string('color').nullable();
        t.boolean('is_seperate').nullable();
        t.boolean('add_lock').nullable();
        t.boolean('remove_lock').nullable();
        t.boolean('is_hidden').nullable();

        t.foreign('admin_id').references('id').inTable('members');
        t.foreign('guild_id').references('id').inTable('teams');
      })
};

exports.down = function(knex) {
  return knex.schema
    .dropTable('seasons')
    .dropTable('competition_winners')
    .dropTable('ranks')
    .dropTable('tags')
};
