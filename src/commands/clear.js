const TSCommand = require('../TSCommand.js');

class TSClear extends TSCommand {
  constructor() {
    super('tsclear', {
      aliases: ['tsclear', 'clear'],
      args: [
        {
          id: 'code',
          type: 'uppercase',
          default: null,
        },
        {
          id: 'difficulty',
          type: 'string',
          default: null,
        },
        {
          id: 'liked',
          type: 'string',
          default: null,
        },
      ],
      channelRestriction: 'guild',
    });
  }

  async tsexec(ts, message, args) {
    const msg = await ts.clear({
      ...args,
      discord_id: ts.discord.getAuthor(message),
      completed: 1,
    });
    await ts.discord.messageSend(message, msg);
  }
}
module.exports = TSClear;
