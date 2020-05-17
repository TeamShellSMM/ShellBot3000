const TSCommand = require('../TSCommand.js');

class TSJudge extends TSCommand {
  constructor() {
    super('tsjudge', {
      aliases: ['tsjudge', 'judge'],
      args: [],
      channelRestriction: 'guild',
    });
  }

  async tsexec(ts, message, args) {
    let inCodeDiscussionChannel = false;
    let levelCode;
    // Check if in level discussion channel
    if (ts.valid_code(message.channel.name.toUpperCase())) {
      inCodeDiscussionChannel = true;
      levelCode = message.channel.name.toUpperCase();
    }

    if (
      !(
        inCodeDiscussionChannel // should also work in the discussion channel for that level
      )
    )
      return false;

    // Reload sheets
    await ts.judge(levelCode);
  }
}
module.exports = TSJudge;
