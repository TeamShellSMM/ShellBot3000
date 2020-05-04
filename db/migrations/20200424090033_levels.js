
exports.up = function(knex) {
  return knex.schema.createTable('levels', function(t) {
    t.increments('id').unsigned().primary();
    t.dateTime('created_at').notNull().defaultTo(knex.raw('CURRENT_TIMESTAMP'));
    t.dateTime('updated_at').nullable();
    t.dateTime('deleted_at').nullable();

    t.string('guild_id',30).notNull().defaultTo(0)
    t.string('code').notNull();
    t.string('creator').notNull();
    t.string('level_name').notNull();

    t.string('difficulty').nullable();
    t.integer('status').notNull().defaultTo(0);
    t.string('new_code').nullable();
    
    t.string('videos').notNull().defaultTo('');
    t.string('tags').notNull().defaultTo('');
    t.boolean('is_free_submission').nullable();
  
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('levels')
};
