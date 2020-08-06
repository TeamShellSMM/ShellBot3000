const TSCommand = require('../TSCommand.js');

class PendingStatus extends TSCommand {
  constructor() {
    super('pendingstatus', {
      aliases: [
        'pendingstatus',
        'pending',
        'tslevelstatus',
        'levelstatus',
      ],
      channelRestriction: 'guild',
    });
  }

  async tsexec(ts, message) {
    const player = await ts.getUser(message);

    const levels = await ts
      .getLevels()
      .where({ creator: player.id })
      .whereIn('status', ts.PENDING_LEVELS);

    if (levels.length === 0) {
      ts.userError('pendingStatus.none');
    }

    const levelStr = await Promise.all(
      levels.map(async (level) => {
        let statusStr = [];
        if (level.approves) {
          statusStr.push(
            await ts.message('pendingStatus.approves', level),
          );
        }
        if (level.rejects) {
          statusStr.push(
            await ts.message('pendingStatus.rejects', level),
          );
        }
        if (level.want_fixes) {
          statusStr.push(
            await ts.message('pendingStatus.wantFixes', level),
          );
        }
        statusStr =
          statusStr.length > 0
            ? statusStr.join(',')
            : await ts.message('pendingStatus.noVotes');

        return `${level.code} - "${level.level_name}":\n •${statusStr}\n`;
      }),
    );
    await ts.discord.messageSend(
      message,
      `${player.userReply}\nYour Pending Levels:\`\`\`${levelStr.join(
        '\n',
      )}\n\`\`\``,
    );
  }
}
module.exports = PendingStatus;
