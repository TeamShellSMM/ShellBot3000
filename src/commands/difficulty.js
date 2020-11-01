const TSCommand = require('../TSCommand.js');

class tsdifficulty extends TSCommand {
  constructor() {
    super('tsdifficulty', {
      aliases: ['tsdifficulty', 'difficulty', 'rate'],
      args: [
        {
          id: 'level',
          type: 'level',
          default: null,
        },
        {
          id: 'difficulty',
          type: 'difficulty',
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
    });
    await ts.discord.messageSend(message, msg);
  }
}
module.exports = tsdifficulty;
