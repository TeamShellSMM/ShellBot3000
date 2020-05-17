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
    args.discord_id = message.author.id;
    const rand = await ts.randomLevel(args);
    const randomEmbed = ts.levelEmbed(
      rand.level,
      ts.embedStyle.random,
    );
    await message.channel.send(rand.player.user_reply);
    await message.channel.send(randomEmbed);
  }
}
module.exports = tsrandom;
