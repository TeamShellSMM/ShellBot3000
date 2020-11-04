const TSCommand = require('../TSCommand.js');

class TSJudge extends TSCommand {
  constructor() {
    super('judge', {
      aliases: ['tsjudge', 'judge', 'forcejudge'],
      args: [],
      channelRestriction: 'guild',
    });
  }

  async tsexec(ts, message, { command }) {
    // Check if in level discussion channel
    if (
      ts.discord.messageGetParent(message) ===
      ts.channels.levelDiscussionCategory
    ) {
      const { code } = ts.getCodeArgument(message);
      await ts.judge(
        code,
        false,
        ts.teamAdmin(ts.discord.getAuthor(message)) &&
          command.command === 'forcejudge',
      );
    }
    return false;
  }
}
module.exports = TSJudge;
