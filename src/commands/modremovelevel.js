const TSCommand = require('../TSCommand.js');

class TSModRemoveLevel extends TSCommand {
  constructor() {
    super('modremovelevel', {
      aliases: ['modremovelevel'],
      args: [
        {
          id: 'level',
          description: 'levelCode',
          type: 'level',
          default: null,
        },
        {
          id: 'reason',
          description: 'reason',
          type: 'longtext:emotes',
          match: 'rest',
          default: null,
        },
      ],
      quoted: true,
      channelRestriction: 'guild',
    });
  }

  async tsexec(ts, message, args) {
    const { level, reason } = args;

    const author = await ts.db.Members.query()
      .where({ id: level.creator_id })
      .first();
    const player = await ts.db.Members.query()
      .where({ discord_id: message.author.id })
      .first();

    await ts.removeLevel(level, player, reason);

    const authorMention = await ts.message('general.heyListen', {
      discord_id: author.discord_id,
    });

    const embedTitle = 'notice.modremovelevel';
    const embedStyle = ts.embedStyle[ts.LEVEL_STATUS.REJECTED];

    const finishAuditRequestEmbed = await ts.levelEmbed(level, {
      ...embedStyle,
      title: embedTitle,
    });
    finishAuditRequestEmbed.addField(
      '\u200b',
      `**Reason** :\`\`\`${reason}\`\`\`-<@${player.discord_id}>`,
    );
    await ts.discord.send(
      ts.channels.levelChangeNotification,
      authorMention,
    );
    await ts.discord.send(
      ts.channels.levelChangeNotification,
      finishAuditRequestEmbed,
    );
    // Remove Discussion Channel
    await ts.deleteAuditChannels(level.code, 'level removed by mod');
    await ts.deleteDiscussionChannel(
      level.code,
      'level removed by mod',
    );

    await ts.discord.reply(
      message,
      await ts.message('success.modremovelevel', {
        levelName: level.level_name,
        discordId: author.discord_id,
      }),
    );
  }
}
module.exports = TSModRemoveLevel;
