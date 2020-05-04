
exports.up = async function(knex) {
    await knex.schema.table('plays', t => {
        t.string('guild_id',30).notNull().defaultTo(0)
    });
    await knex.schema.table('pending_votes', t => {
        t.string('guild_id',30).notNull().defaultTo(0)
    });
    return knex;
};

exports.down = async function(knex) {
    await knex.schema.table('plays', t => {
        t.dropColumn('guild_id');
    });
    await knex.schema.table('pending_votes', t => {
        t.dropColumn('guild_id');
    });
    return knex;
};