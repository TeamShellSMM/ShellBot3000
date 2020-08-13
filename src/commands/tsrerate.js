const TSCommand = require('../TSCommand.js');

class TSRerate extends TSCommand {
  constructor() {
    super('tsrerate', {
      aliases: ['tsrerate', 'rerate'],
      split: 'quoted',
      args: [
        {
          id: 'code',
          type: 'uppercase',
          default: null,
        },
        {
          id: 'difficulty',
          type: 'number',
          default: null,
        },
        {
          id: 'reason',
          type: 'string',
          default: null,
        },
      ],
      channelRestriction: 'guild',
    });
  }

  async tsexec(ts, message) {
    if (
      !(
        ts.discord.messageGetChannel(message) ===
          ts.channels.modChannel || // only in shellder-bot channel
        ts.discord.messageGetChannel(message) ===
          ts.channels.pendingShellbot
      )
    )
      return false; // silently fail

    const { code, command } = ts.getCodeArgument(message);
    const difficulty = Number(command.next());
    const reason = command.rest();

    // Check all the args first
    if (!difficulty) ts.userError('difficulty.noDifficulty');
    if (!ts.valid_difficulty(difficulty))
      ts.userError('Invalid difficulty format!');
    if (!reason) ts.userError('difficulty.noReason');
    ts.reasonLengthCheck(reason, 800);

    const level = await ts.getExistingLevel(code, true);
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

    await ts.db.Levels.query().patch({ difficulty }).where({ code });

    await ts.recalculateAfterUpdate({ code });

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
