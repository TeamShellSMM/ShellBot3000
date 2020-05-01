
exports.up = function(knex) {
    return knex.schema.createTable('teams', function(t) {
        t.increments('id').unsigned().primary();
        t.dateTime('created_at').notNull().defaultTo(knex.raw('CURRENT_TIMESTAMP'));
        t.dateTime('updated_at').nullable();
        t.dateTime('deleted_at').nullable();

        t.string('guild_id',30).notNull();
        t.string('guild_name').notNull();
        t.string('url_slug').notNull();
        t.string('owner_id').notNull(); //owner is head/creator of the team
        t.string('admin_id').nullable(); //admin is the person who may be helping to setup the bot
        t.json('config').nullable();
        t.json('web_config').nullable();
        t.boolean('active').notNull().defaultTo(false)
        t.boolean('public').notNull().defaultTo(true)
        t.boolean('banned').notNull().defaultTo(false)
        t.index('guild_id')
        t.unique(['guild_id','guild_name','url_slug'])
      });
};

exports.down = function(knex) {
    return knex.schema.dropTable('teams')
};
