
exports.up = async function(knex) {
  await knex.schema.table('members', t => {
    t.integer('world_world_count').notNull().defaultTo(0);
    t.integer('world_level_count').notNull().defaultTo(0);
  });
};

exports.down = async function(knex) {
  await knex.schema.table('members', t => {
    t.dropColumn('world_world_count');
    t.dropColumn('world_level_count');
  });
};
