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

    const setTags = (await ts.getTags()) || [];
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
    let argTags = newTags;

    const player = await ts.getUser(message);
    const level = await ts.getExistingLevel(code);
    // First we get all available tags
    newTags = await ts.addTags(newTags, ts.knex, player.discord_id, addCommands.indexOf(command.command) !== -1);

    const filteredTags = newTags;
    let oldTags = level.tags ? level.tags.split(',') : [];
    let reply;

    if (addCommands.indexOf(command.command) !== -1) {
      // adding
      const lockedTags = setTags
        .filter((t) => t.add_lock)
        .map((t) => t.name);

      newTags = [];
      filteredTags.forEach((tag) => {
        if (lockedTags.includes(tag) && !player.is_mod)
          ts.userError(ts.message('tags.cantAdd', { tag }));
        if (!oldTags.includes(tag)) {
          newTags.push(tag);
        }
      });

      if (newTags.length === 0)
        ts.userError(
          ts.message('tags.noNew', level) +
            ts.message('tags.currentTags', {
              tags_str: oldTags.join('\n'),
            }),
        );

      oldTags = oldTags.concat(newTags);
      reply =
        ts.message('tags.haveNew', level) +
        ts.message('tags.currentTags', {
          tags_str: oldTags.join('\n'),
        });
    } else {
      // removing
      if (!(level.creator === player.name || player.is_mod))
        ts.userError(ts.message('tags.noPermission', level));

      const lockedTags = setTags
        .filter((t) => t.remove_lock)
        .map((t) => t.name);

      newTags = [];
      filteredTags.forEach((tag) => {
        if (lockedTags.includes(tag) && !player.is_mod)
          ts.userError(ts.message('tags.cantRemove', { tag }));
      });

      oldTags.forEach((tag) => {
        if (!filteredTags.includes(tag)) {
          newTags.push(tag);
        }
      });

      if (oldTags.length === newTags.length)
        ts.userError(
          ts.message('tags.noRemoved', level) +
            ts.message('tags.currentTags', {
              tags_str: oldTags.join('\n'),
            }),
        );
      oldTags = newTags;
      reply =
        ts.message('tags.haveRemoved', level) +
        ts.message('tags.currentTags', {
          tags_str: oldTags.join('\n'),
        });
    }

    await ts.db.Levels.query()
      .patch({ tags: oldTags.join(',') })
      .where({ code });

    if(addCommands.indexOf(command.command) === -1){
      await ts.checkTagsForRemoval(argTags, ts.knex);
    }

    await ts.discord.messageSend(message, player.userReply + reply);
  }
}
module.exports = TSAddtags;
