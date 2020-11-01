const TSCommand = require('../TSCommand.js');

class TSRerate extends TSCommand {
  constructor() {
    super('tsrerate', {
      aliases: ['tsrerate', 'rerate'],
      args: [
        {
          id: 'level',
          type: 'level:approved',
          default: null,
        },
        {
          id: 'difficulty',
          type: 'difficulty',
          default: null,
        },
        {
          id: 'reason',
          type: 'longtext',
          match: 'rest',
          default: null,
        },
      ],
      quoted: true,
      channelRestriction: 'guild',
    });
  }

  async tsexec(ts, message, {level, difficulty, reason}) {
    if (level.status !== ts.LEVEL_STATUS.APPROVED) {
      ts.userError('error.notApproved');
    }

    const author = await ts.db.Members.query()
      .where({ name: level.creator })
      .first();

    if (level.difficulty === difficulty)
      ts.userError(
        `"${level.level_name}" is already rated ${difficulty}`,
      );

    await ts.db.Levels.query().patch({ difficulty }).where({ code: level.code });

    await ts.recalculateAfterUpdate({ code: level.code });

    const rerateEmbed = (
      await ts.levelEmbed(level, ts.embedStyle.rerate, {
        old_difficulty: level.difficulty,
        new_difficulty: difficulty,
      })
    ).addField(
      '\u200b',
      `**Reason** :\n\`\`\`${reason}\`\`\`Rerated by <@${ts.discord.getAuthor(
        message,
      )}>`,
    );

    const mention = `**<@${author.discord_id}>, we got some news for you: **`;
    await ts.discord.send(
      ts.channels.levelChangeNotification,
      mention,
    );
    await ts.discord.send(
      ts.channels.levelChangeNotification,
      rerateEmbed,
    );

    await ts.deleteAuditChannels(
      `${ts.CHANNEL_LABELS.AUDIT_RERATE_REQUEST}${level.code}`,
      await ts.message('approval.channelDeleted'),
    );

    return ts.discord.reply(
      message,
      await ts.message('difficulty.success'),
    );
  }
}
module.exports = TSRerate;
