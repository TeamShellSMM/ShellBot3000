exports.up = function (knex) {
  return knex.schema.table('tags', (t) => {
    t.boolean('verify_clears').notNull().defaultTo(0);
  });
};

exports.down = function (knex) {
  return knex.schema.table('tags', (t) => {
    t.dropColumn('verify_clears');
  });
};
