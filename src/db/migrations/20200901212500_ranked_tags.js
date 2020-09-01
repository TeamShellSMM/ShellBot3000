exports.up = function (knex) {
  return knex.schema.table('tags', (t) => {
    t.boolean('ranked').notNull().defaultTo(0);
  });
};

exports.down = function (knex) {
  return knex.schema.table('tags', (t) => {
    t.dropColumn('ranked');
  });
};
