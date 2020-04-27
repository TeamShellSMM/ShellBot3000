
exports.up = async function(knex) {
  
  await knex.schema.table('teams', t => {
    t.dropColumn('owner_id');
    t.dropColumn('admin_id');
  });

  await knex.schema.table('members', t => {
    t.dropColumn('is_mod');
  });
};

exports.down = async function(knex) {
  await knex.schema.table('teams', t => {
    t.string('owner_id').notNull(); //owner is head/creator of the team
    t.string('admin_id').nullable(); //admin is the person who may be helping to setup the bot
  });

  await knex.schema.table('members', t => {
    t.boolean('is_mod').nullable();
  });

};
