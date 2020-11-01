const TSCommand = require('../TSCommand.js');

class TSApprove extends TSCommand {
  constructor() {
    super('tsreject', {
      aliases: [
        'reject',
      ],
      args: [
        {
          id: 'level',
          type: 'level:pending',
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

  async tsexec(ts, message, args) {
    args.type = 'reject';
    args.discord_id = ts.discord.getAuthor(message);

    const replyMessage = await ts.approve(args);
    await ts.discord.reply(message, replyMessage);

    return true;
  }
}
module.exports = TSApprove;
