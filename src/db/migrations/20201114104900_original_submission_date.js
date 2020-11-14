exports.up = function (knex) {
  return knex.schema
    .table('levels', (t) => {
      t.dateTime('original_submission_date')
        .notNull()
        .defaultTo(knex.raw('CURRENT_TIMESTAMP'));
    })
    .then(() => {
      return knex.raw(
        'update levels set original_submission_date = created_at where id >= 0;',
      );
    });
};

exports.down = function (knex) {
  return knex.schema.table('levels', (t) => {
    t.dropColumn('original_submission_date');
  });
};
