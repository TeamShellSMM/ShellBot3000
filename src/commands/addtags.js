const TSCommand = require('../TSCommand.js');

class TSAddtags extends TSCommand {
  constructor() {
    super('tsaddtags', {
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
    });
  }

  async tsexec(ts, message) {
    const addCommands = [
      'tsaddtags',
      'addtags',
      'tsaddtag',
      'addtag',
    ];

    const command = ts.parseCommand(message);
    let code = command.arguments.shift();
    if (code) {
      code = code.toUpperCase();
    } else {
      ts.userError(ts.message('error.noCode'));
    }

    let newTags = command.arguments.join(' ');
    if (!newTags) {
      ts.userError(ts.message('tags.noTags'));
    }
    newTags = newTags.split(/[,\n]/);

    const player = await ts.getUser(message);
    const level = await ts.getExistingLevel(code);

    newTags = await ts.addTags(newTags, ts.knex, player.discord_id);

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
          ts.message('tags.noNew', level) +
            ts.message('tags.currentTags', {
              tags_str: level.tags.split(',').join('\n'),
            }),
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

      reply = ts.message('tags.haveNew', level);
    } else {
      // removing
      if (
        !(
          level.creator === player.name ||
          (await ts.modOnly(player.discord_id))
        )
      )
        ts.userError(ts.message('tags.noPermission', level));

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
          ts.message('tags.noRemoved', level) +
            ts.message('tags.currentTags', {
              tags_str: level.tags.split(',').join('\n'),
            }),
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

      reply = ts.message('tags.haveRemoved', level);
    }
    /*
ts.message('tags.currentTags', {
          tags_str: oldTags.join('\n'),
        });
    */

    await ts.discord.messageSend(message, player.userReply + reply);
  }
}
module.exports = TSAddtags;
