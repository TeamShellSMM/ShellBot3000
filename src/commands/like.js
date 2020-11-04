const TSCommand = require('../TSCommand.js');

class tslike extends TSCommand {
  constructor() {
    super('like', {
      aliases: ['tslike', 'like', 'tsunlike', 'unlike'],
      args: [
        {
          id: 'level',
          description: 'levelCode',
          type: 'level',
          default: null,
        },
      ],
      quoted: true,
      channelRestriction: 'guild',
    });
  }

  async tsexec(ts, message, args2) {
    const args = args2;
    const likeCommands = ['tslike', 'like'];
    args.liked = likeCommands.includes(args.command.command) ? 1 : 0;
    const clearArgs = {
      ...args,
      discord_id: ts.discord.getAuthor(message),
    };
    const msg = await ts.clear(clearArgs);
    await ts.discord.messageSend(message, msg);
  }
}
module.exports = tslike;
