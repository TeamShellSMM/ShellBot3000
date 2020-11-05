const TSCommand = require('../TSCommand.js');

class TSReject extends TSCommand {
  constructor() {
    super('reject', {
      aliases: ['reject', 'tsreject'],
      args: [
        {
          id: 'level',
          description: 'levelCode',
          type: 'level:pending',
          default: null,
        },
        {
          id: 'reason',
          type: 'longtext:emotes',
          match: 'rest',
          default: null,
        },
      ],
      quoted: true,
      channelRestriction: 'guild',
    });
  }

  async tsexec(ts, message, args2) {
    console.log('not reacting');
    const args = args2;
    args.type = 'reject';
    args.discord_id = ts.discord.getAuthor(message);

    const replyMessage = await ts.approve(args);
    await ts.discord.reply(message, replyMessage);

    return true;
  }
}
module.exports = TSReject;
