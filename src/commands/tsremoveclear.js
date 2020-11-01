const TSCommand = require('../TSCommand.js');

class TSRemoveclear extends TSCommand {
  constructor() {
    super('tsremoveclear', {
      aliases: ['tsremoveclear', 'removeclear'],
      args: [
        {
          id: 'level',
          type: 'level',
          default: null,
        },
      ],
      quoted: true,
      channelRestriction: 'guild',
    });
  }

  async tsexec(ts, message, args) {
    const msg = await ts.clear({
      ...args,
      completed: 0,
      discord_id: ts.discord.getAuthor(message),
    });
    await ts.discord.messageSend(message, msg);
  }
}
module.exports = TSRemoveclear;
