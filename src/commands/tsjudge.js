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
    let inCodeDiscussionChannel = false;
    let levelCode;
    // Check if in level discussion channel
    if (ts.valid_code(message.channel.name.toUpperCase())) {
      levelCode = message.channel.name.toUpperCase();
      if (
        message.channel.parentID ===
        ts.channels.levelDiscussionCategory
      ) {
        inCodeDiscussionChannel = true;
      }
    }

    if (
      !(
        inCodeDiscussionChannel // should also work in the discussion channel for that level
      )
    )
      return false;

    // Reload sheetsconsole.log('here');
    await ts.judge(levelCode);
  }
}
module.exports = TSJudge;
