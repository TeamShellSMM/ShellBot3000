exports.up = function (knex) {
  const insertJson = [
    {
      name: 'modaddlevel.missingMemberName',
      message: 'You have to enter a valid member name.',
    },
    {
      name: 'help.renamemember',
      message:
        "With this you can rename another member. You will need to supply the users' discord id (you can get that by enabling the developer mode in the discord settings and then right clicking on that user).",
    },
  ];

  const commandJson = [
    {
      name: 'renamemember',
      format: '!renamemember <discordID> <newMemberName>',
      aliases: 'tsunsetworld',
      category: 'default',
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

      t.boolean('disabled').notNull().defaultTo(0);
      t.string('roles').nullable();
      t.string('text_channels').nullable();
      t.string('channel_categories').nullable();

      t.unique(['guild_id', 'command_id']);
      t.index(['guild_id', 'command_id']);
    })
    .then(function () {
      // Inserts seed entries
      return knex('default_strings').insert(insertJson);
    })
    .then(function () {
      // Inserts seed entries
      return knex('default_strings')
        .where({
          name: 'register.success',
        })
        .update({
          message:
            "You are now registered as '{{name}}'.  {{{bam}}}\n ‣ You can find the levels in {{TeamURI}}/levels\n ‣ You can submit your clears with `!clear LEV-ELC-ODE` in {{{LevelClearChannel}}}\n ‣ You can also submit your clears in the website by logging in with `!login`\n ‣ English - `!help`\n 🇰🇷 `!help:kr`\n 🇷🇺 `!help:ru`\n 🌐 `!help:lang`",
        });
    })
    .then(function () {
      // Inserts seed entries
      return knex('default_strings')
        .where({
          name: 'error.notRegistered',
        })
        .update({
          message:
            'You are not yet registered. You will have to register first by using `!register` in {{{RegistrationChannel}}}\n🇰🇷 `!help:kr`\n🇷🇺 `!help:ru`\n🌐 `!help:lang`',
        });
    })
    .then(function () {
      // Inserts seed entries
      return knex('commands').insert(commandJson);
    });
};

exports.down = function (knex) {
  return knex.schema
    .dropTable('command_permissions')
    .then(function () {
      return knex('commands').where({ name: 'renamemember' }).del();
    })
    .then(function () {
      return knex('default_strings')
        .where({ name: 'help.renamemember' })
        .orWhere({ name: 'modaddlevel.missingMemberName' })
        .del();
    });
};
