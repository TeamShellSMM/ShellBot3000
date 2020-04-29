exports.up = async function(knex) {
  await knex.schema.table('members', t => {
    t.boolean('is_mod').nullable();
  });
};

exports.down = async function(knex) {
  await knex.schema.table('members', t => {
    t.dropColumn('is_mod');
  });
};