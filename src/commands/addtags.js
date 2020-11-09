const TSCommand = require('../TSCommand.js');

class TSAddtags extends TSCommand {
  constructor() {
    super('addtags', {
      aliases: [
        'tsaddtags',
        'addtags',
        'tsaddtag',
        'addtag',
        'tsremovetags',
        'removetags',
        'tsrmemovetag',
        'removetag',
      ],
      channelRestriction: 'guild',
      args: [
        {
          id: 'level',
          description: 'levelCode',
          type: 'level',
          default: null,
        },
        {
          id: 'newTags',
          type: 'tags',
          description: 'Tag1,Tag2,Tag3,...',
          match: 'rest',
          default: null,
        },
      ],
      quoted: true,
    });
  }

  async tsexec(ts, message, args) {
    const { command, level } = args;
    let { newTags } = args;

    const addCommands = [
      'tsaddtags',
      'addtags',
      'tsaddtag',
      'addtag',
    ];

    const player = await ts.getUser(message);
    // First we get all available tags
    newTags = await ts.addTags(
      newTags,
      ts.knex,
      player.discord_id,
      addCommands.indexOf(command.command) !== -1,
    );

    const oldTags = await ts
      .knex('level_tags')
      .where({ level_id: level.id });

    let reply;

    if (addCommands.indexOf(command.command) !== -1) {
      const tagsToBeAdded = await ts
        .knex('tags')
        .where({ guild_id: ts.team.id })
        .whereIn('name', newTags)
        .whereNotIn(
          'id',
          oldTags.map((t) => t.tag_id),
        );

      const lockedTags = tagsToBeAdded.filter((t) => t.add_lock);
      if (
        lockedTags.length > 0 &&
        !(await ts.modOnly(player.discord_id))
      ) {
        ts.userError('tags.cantAdd', {
          tag: lockedTags.map((t) => t.name).join(','),
        });
      }

      if (tagsToBeAdded.length === 0)
        ts.userError(
          (await ts.message('tags.noNew', level)) +
            (await ts.message('tags.currentTags', {
              tags_str: level.tags.split(',').join('\n'),
            })),
        );

      const rows = tagsToBeAdded.map((x) => {
        return {
          guild_id: ts.team.id,
          level_id: level.id,
          tag_id: x.id,
          user_id: player.id,
        };
      });

      await ts.knex.transaction((trx) => {
        return trx('level_tags').insert(rows);
      });

      reply = await ts.message('tags.haveNew', level);
    } else {
      // removing
      if (
        !(
          level.creator === player.name ||
          (await ts.modOnly(player.discord_id))
        )
      )
        ts.userError(await ts.message('tags.noPermission', level));

      const tagsToBeRemoved = await ts
        .knex('tags')
        .where({ guild_id: ts.team.id })
        .whereIn('name', newTags)
        .whereIn(
          'id',
          oldTags.map((t) => t.tag_id),
        );

      const lockedTags = tagsToBeRemoved.filter((t) => t.remove_lock);
      if (
        lockedTags.length > 0 &&
        !(await ts.modOnly(player.discord_id))
      ) {
        ts.userError('tags.cantRemove', {
          tag: lockedTags.map((t) => t.name).join(','),
        });
      }

      if (tagsToBeRemoved.length === 0)
        ts.userError(
          (await ts.message('tags.noRemoved', level)) +
            (await ts.message('tags.currentTags', {
              tags_str: level.tags.split(',').join('\n'),
            })),
        );

      await ts
        .knex('level_tags')
        .where({ guild_id: ts.team.id })
        .where({ level_id: level.id })
        .whereIn(
          'tag_id',
          tagsToBeRemoved.map((x) => x.id),
        )
        .del();

      reply = await ts.message('tags.haveRemoved', level);
    }

    const updatedTags = await ts.getLevelTags(level.id);

    if (addCommands.indexOf(command.command) === -1) {
      await ts.checkTagsForRemoval();
    }

    await ts.discord.messageSend(
      message,
      player.userReply +
        reply +
        (await ts.message('tags.currentTags', {
          tags_str: updatedTags.map((t) => t.name).join('\n'),
        })),
    );
  }
}
module.exports = TSAddtags;
