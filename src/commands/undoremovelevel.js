const TSCommand = require('../TSCommand.js');

class undoremovelevel extends TSCommand {
  constructor() {
    super('undoremovelevel', {
      aliases: ['undoremovelevel', 'undolevelstatus', 'undolevel'],
      args: [
        {
          id: 'level',
          type: 'level:any',
          default: null,
        },
        {
          id: 'reason',
          type: 'text',
          match: 'rest',
          default: null,
        },
      ],
      quoted: true,
      channelRestriction: 'guild',
    });
  }

  async tsexec(ts, message, { level, reason }) {
    const player = await ts.getUser(message);

    if (!ts.REMOVED_LEVELS.includes(level.status))
      ts.userError(
        await ts.message('undoRemoveLevel.alreadyNotRemoved', level),
      );

    if (
      !(
        (level.creator === player.name &&
          level.status === ts.LEVEL_STATUS.USER_REMOVED) ||
        player.is_mod
      )
    )
      ts.userError(await ts.message('undoRemoveLevel.cant', level));

    await ts.db.Levels.query()
      .patch({
        status: level.old_status,
        old_status: level.status,
        new_code: null,
      })
      .where({ code: level.code });
    await ts.recalculateAfterUpdate({ code: level.code });

    // Send updates to to #shellbot-level-update
    const undoEmbed = await ts.levelEmbed(level, ts.embedStyle.undo);
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

    const reply = await ts.message('undoRemoveLevel.success', level);
    await ts.discord.messageSend(message, player.userReply + reply);
  }
}
module.exports = undoremovelevel;
