const TSCommand = require('../TSCommand.js');

class undoremovelevel extends TSCommand {
  constructor() {
    super('undoremovelevel', {
      aliases: ['undoremovelevel', 'undolevelstatus', 'undolevel'],
      channelRestriction: 'guild',
    });
  }

  async tsexec(ts, message, { command }) {
    let code = command.arguments.shift();
    if (!code) ts.userError(ts.message('error.noCode'));
    code = code.toUpperCase();
    const reason = command.arguments.join(' ');

    if (!reason)
      ts.userError(
        ts.userError(ts.message('undoRemoveLevel.noReason')),
      );

    const player = await ts.getUser(message);
    const level = await ts.getExistingLevel(code, true);

    if (!ts.REMOVED_LEVELS.includes(level.status))
      ts.userError(
        ts.message('undoRemoveLevel.alreadyNotRemoved', level),
      );

    if (
      !(
        (level.creator === player.name &&
          level.status === ts.LEVEL_STATUS.USER_REMOVED) ||
        player.is_mod
      )
    )
      ts.userError(ts.message('undoRemoveLevel.cant', level));

    await ts.db.Levels.query()
      .patch({
        status: level.old_status,
        old_status: level.status,
        new_code: null,
      })
      .where({ code });
    await ts.recalculateAfterUpdate({ code });

    // Send updates to to #shellbot-level-update
    const undoEmbed = ts.levelEmbed(level, ts.embedStyle.undo);
    undoEmbed.addField(
      '\u200b',
      `**Notes on level status undo** :\`\`\`${reason}\`\`\`-<@${player.discord_id}>`,
    );

    if (level.creator !== player.name) {
      // moderation
      const creator = await ts.db.Members.query()
        .where({ name: level.creator })
        .first();
      const mention = `**<@${creator.discord_id}>, we got some news for you: **`;
      await ts.discord.send(
        ts.channels.levelChangeNotification,
        mention,
      );
    }
    await ts.discord.send(
      ts.channels.levelChangeNotification,
      undoEmbed,
    );

    const reply = ts.message('undoRemoveLevel.success', level);
    await message.channel.send(player.userReply + reply);
  }
}
module.exports = undoremovelevel;
