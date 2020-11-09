exports.up = function (knex) {
  const newCommands = [
    {
      name: 'addcollaborators',
      format:
        '!addcollaborators <LevelCode> <Member1,Member2,Member3,...>',
      aliases: 'addcollaborator',
      category: 'default',
    },
    {
      name: 'removecollaborators',
      format:
        '!removecollaborators <LevelCode> <Member1,Member2,Member3,...>',
      aliases: 'removecollaborator',
      category: 'default',
    },
  ];

  const newDefaultStrings = [
    {
      name: 'help.addcollaborators',
      message: 'Use this to add collaborators to one of your levels.',
    },
    {
      name: 'help.removecollaborators',
      message:
        'Use this to remove collaborators from one of your levels.',
    },
    {
      name: 'addcollaborators.success',
      message:
        'Your collaborators were successfully added to the level.',
    },
    {
      name: 'collaborators.notAllowed',
      message:
        'You need to be the creator of the level (or a {{{ModName}}}) to change collaborators.',
    },
    {
      name: 'collaborators.list',
      message:
        "Current collaborators on '{{{levelName}}}' ({{{levelCode}}}): ```\n{{{collaborators}}}```",
    },
    {
      name: 'removecollaborators.success',
      message:
        'Your collaborators were successfully removed from the level.',
    },
    {
      name: 'collaborators.noChange',
      message: 'No collaborators were changed.',
    },
  ];

  return knex.schema
    .createTable('collaborators', function (t) {
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
      t.integer('level_id')
        .unsigned()
        .references('levels.id')
        .notNull();
      t.integer('member_id')
        .unsigned()
        .references('members.id')
        .notNull();

      t.index(['level_id', 'member_id']);
    })
    .then(() => {
      return knex('commands').insert(newCommands);
    })
    .then(() => {
      return knex('default_strings').insert(newDefaultStrings);
    });
};

exports.down = function (knex) {
  return knex.schema
    .dropTable('collaborators')
    .then(() => {
      return knex('commands')
        .whereIn('name', ['addcollaborators', 'removecollaborators'])
        .del();
    })
    .then(() => {
      return knex('default_strings')
        .whereIn('name', [
          'help.addcollaborators',
          'help.removecollaborators',
          'addcollaborators.success',
          'collaborators.notAllowed',
          'collaborators.list',
          'removecollaborators.success',
          'collaborators.noChange',
        ])
        .del();
    });
};
