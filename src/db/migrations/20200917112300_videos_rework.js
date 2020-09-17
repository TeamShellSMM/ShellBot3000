exports.up = function (knex) {
  const newCommands = [
    {
      name: 'addmyvids',
      format: '!addmyvids <LevelCode> <Link1,Link2,Link3,...>',
      aliases: 'addmyvid',
      category: 'default',
    },
    {
      name: 'removemyvids',
      format: '!removemyvids <LevelCode> <Link1,Link2,Link3,...>',
      aliases: 'removemyvid',
      category: 'default',
    },
    {
      name: 'modaddplayvids',
      format:
        '!modaddplayvids <MemberName> <LevelCode> <Link1,Link2,Link3,...>',
      aliases: 'modaddplayvid',
      category: 'mods',
    },
    {
      name: 'modremoveplayvids',
      format:
        '!modremoveplayvids <MemberName> <LevelCode> <Link1,Link2,Link3,...>',
      aliases: 'modremoveplayvid',
      category: 'mods',
    },
  ];

  const newDefaultStrings = [
    {
      name: 'help.addmyvids',
      message:
        "Use this to add your clearvids to your clear of a level (they're gonna get shown on the page or with !info)",
    },
    {
      name: 'help.removemyvids',
      message:
        'With this you can remove your clearvids from your clears.',
    },
    {
      name: 'help.modaddplayvids',
      message:
        'Use this to add a clearvid to a play of a certain member.',
    },
    {
      name: 'help.modremoveplayvids',
      message:
        'Use this to remove a clearvid from a play of a certain member.',
    },
    {
      name: 'addVids.notAllowed',
      message:
        'The following urls are not from allowed video hosting websites: ```{{{videos}}}```\nCurrently we only allow videos from twitter, youtube, twitch, imgur, streamable and reddit.',
    },
    {
      name: 'addVids.noClear',
      message:
        "You haven't submitted have a clear on this level yet, try using `!clear {{{code}}}` before trying to add a video.",
    },
    {
      name: 'addVids.alreadyUsed',
      message:
        'The following url is already used as a clearvid for another member: ```{{{video}}}```',
    },
    {
      name: 'addVids.currentPlayVideos',
      message: 'Your current videos:```\n{{videos_str}}```',
    },
  ];

  return knex.schema
    .createTable('videos', function (t) {
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
        .nullable();
      t.integer('play_id')
        .unsigned()
        .references('plays.id')
        .nullable();
      t.integer('submitter_id')
        .unsigned()
        .references('members.id')
        .nullable();

      t.string('type').notNull();
      t.string('url').notNull();

      t.index(['level_id', 'play_id']);
    })
    .then(() => {
      return knex('commands').insert(newCommands);
    })
    .then(() => {
      return knex('default_strings').insert(newDefaultStrings);
    })
    .then(() => {
      return knex('levels')
        .where('status', 1)
        .whereNotNull('videos')
        .where('videos', '<>', '')
        .then((levels) => {
          const vidInserts = [];
          for (const level of levels) {
            const vids = level.videos.split(',');
            for (let vid of vids) {
              let vidType = null;

              const allowedTypes = {
                't.co': 'twitter',
                'twitter.com': 'twitter',
                'youtu.be': 'youtube',
                'youtube.com': 'youtube',
                'clips.twitch.tv': 'twitch',
                'imgur.com': 'imgur',
                'streamable.com': 'streamable',
                'reddit.com': 'reddit',
              };

              vid = vid.trim();

              for (const allowedType of Object.keys(allowedTypes)) {
                if (vid.indexOf(allowedType) !== -1) {
                  vidType = allowedTypes[allowedType];
                  break;
                }
              }

              if (vidType) {
                vidInserts.push({
                  created_at: level.created_at,
                  guild_id: level.guild_id,
                  level_id: level.id,
                  type: vidType,
                  url: vid,
                });
              }
            }
          }
          return knex('videos').insert(vidInserts);
        });
    });
};

exports.down = function (knex) {
  return knex.schema
    .dropTable('videos')
    .then(() => {
      return knex('commands')
        .whereIn('name', [
          'addmyvids',
          'removemyvids',
          'modaddplayvids',
          'modremoveplayvids',
        ])
        .del();
    })
    .then(() => {
      return knex('default_strings')
        .whereIn('name', [
          'help.addmyvids',
          'help.removemyvids',
          'help.modaddplayvids',
          'help.modremoveplayvids',
          'addVids.notAllowed',
          'addVids.noClear',
          'addVids.alreadyUsed',
          'addVids.currentPlayVideos',
        ])
        .del();
    });
};
