const TSCommand = require('../TSCommand.js');

class TSJudge extends TSCommand {
  constructor() {
    super('tsjudge', {
      aliases: ['tsjudge', 'judge'],
      args: [],
      channelRestriction: 'guild',
    });
  }

  async tsexec(ts, message) {
    // Check if in level discussion channel
    if (
      ts.validCode(
        ts.discord.messageGetChannelName(message).toUpperCase(),
      )
    ) {
      const levelCode = ts.discord
        .messageGetChannelName(message)
        .toUpperCase();
      if (
        ts.discord.messageGetParent(message) ===
        ts.channels.levelDiscussionCategory
      ) {
        await ts.judge(levelCode);
      }
    }
    return true;
  }
}
module.exports = TSJudge;
