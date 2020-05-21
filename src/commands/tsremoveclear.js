const TSCommand = require('../TSCommand.js');

class TSRemoveclear extends TSCommand {
  constructor() {
    super('tsremoveclear', {
      aliases: ['tsremoveclear', 'removeclear'],
      args: [
        {
          id: 'code',
          type: 'uppercase',
          default: null,
        },
      ],
      channelRestriction: 'guild',
    });
  }

  async tsexec(ts, message, args) {
    args.completed = 0;
    args.discord_id = ts.discord.getAuthor(message);
    const msg = await ts.clear(args);
    await ts.discord.messageSend(message, msg);
  }
}
module.exports = TSRemoveclear;
