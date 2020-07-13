exports.up = function (knex) {
  return knex.schema.table('members', (t) => {
    t.string('discord_id').nullable().alter();
  });
};

exports.down = function (knex) {
  return knex.schema.table('members', (t) => {
    t.string('discord_id').notNull().alter();
  });
};
