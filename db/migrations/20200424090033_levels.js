
exports.up = function(knex) {
  return knex.schema.createTable('levels', function(t) {
    t.increments('id').unsigned().primary();
    t.dateTime('created_at').notNull().defaultTo(knex.raw('CURRENT_TIMESTAMP'));
    t.dateTime('updated_at').nullable();
    t.dateTime('deleted_at').nullable();

    t.string('guild_id',30).notNull();
    t.string('discord_id').notNull();
    t.string('code').notNull();
    t.string('creator').notNull();
    t.string('level_name').notNull();

    t.string('difficulty').nullable();
    t.integer('approved').nullable();
    
    t.string('new_code').nullable();
    t.string('videos').nullable();
    t.string('tags').nullable();
    t.booelan('free_submission').nullable();


   

  
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('levels')
};
