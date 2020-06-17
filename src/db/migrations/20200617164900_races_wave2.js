exports.up = function (knex) {
  return knex.schema.table('races', (t) => {
    t.integer('creator_id')
      .unsigned()
      .references('members.id')
      .nullable();

    t.boolean('unofficial').notNull().defaultTo(0);
    t.string('level_status_type').notNull().defaultTo('approved');
    t.string('weighting_type').notNull().defaultTo('unweighted');
    t.integer('clear_score_from').nullable();
    t.integer('clear_score_to').nullable();
  });
};

exports.down = function (knex) {
  return knex.schema.table('races', (t) => {
    t.dropColumn('creator_id');
    t.dropColumn('clear_score_to');
    t.dropColumn('clear_score_from');
    t.dropColumn('weighting_type');
    t.dropColumn('level_status_type');
    t.dropColumn('unofficial');
  });
};
