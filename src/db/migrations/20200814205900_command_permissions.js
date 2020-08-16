exports.up = function (knex) {
  const insertJson = [
    {
      name: 'modaddlevel.missingMemberName',
      message: 'You have to enter a valid member name.',
    },
  ];

  return knex.schema
    .createTable('command_permissions', function (t) {
      t.increments('id').unsigned().primary();
      t.dateTime('created_at')
        .notNull()
        .defaultTo(knex.raw('CURRENT_TIMESTAMP'));
      t.dateTime('updated_at').nullable();
      t.dateTime('deleted_at').nullable();

      t.integer('guild_id')
        .unsigned()
        .references('teams.id')
        .notNull();

      t.integer('command_id')
        .unsigned()
        .references('commands.id')
        .notNull();

      t.string('roles').nullable();
      t.string('channels').nullable();

      t.unique(['guild_id', 'command_id']);
      t.index(['guild_id', 'command_id']);
    })
    .then(function () {
      // Inserts seed entries
      return knex('default_strings').insert(insertJson);
    });
};

exports.down = function (knex) {
  return knex.schema.dropTable('command_permissions');
};
