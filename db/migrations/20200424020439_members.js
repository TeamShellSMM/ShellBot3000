
exports.up = function(knex) {
    return knex.schema.createTable('members', function(t) {
        t.increments('id').unsigned().primary();
        t.dateTime('created_at').notNull().defaultTo(knex.raw('CURRENT_TIMESTAMP'));
        t.dateTime('updated_at').nullable();
        t.dateTime('deleted_at').nullable();
    
        t.string('guild_id',30).notNull().defaultTo(0)
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

        t.string('discord_id_temp'); //only used on testing servers for mockUser
      });
};

exports.down = function(knex) {
    return knex.schema.dropTable('members')
};
