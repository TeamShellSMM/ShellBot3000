const TSCommand = require('../TSCommand.js');

class tsrandom extends TSCommand {
  constructor() {
    super('tsrandom', {
      aliases: ['tsrandom', 'random'],
      args: [
        {
          id: 'minDifficulty',
          type: 'string',
          default: null,
        },
        {
          id: 'maxDifficulty',
          type: 'string',
          default: null,
        },
      ],
      channelRestriction: 'guild',
    });
  }

  async tsexec(ts, message, args) {
    const rand = await ts.randomLevel({
      ...args,
      discord_id: ts.discord.getAuthor(message),
    });
    const randomEmbed = ts.levelEmbed(
      rand.level,
      ts.embedStyle.random,
    );
    await ts.discord.messageSend(message, rand.player.userReply);
    await ts.discord.messageSend(message, randomEmbed);
  }
}
module.exports = tsrandom;
