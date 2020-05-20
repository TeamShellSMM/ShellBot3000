const TSCommand = require('../TSCommand.js');

class playersRandom extends TSCommand {
  constructor() {
    super('playersRandom', {
      aliases: ['playersRandom'],
      split: 'quoted',
      args: [
        {
          id: 'players',
          type: 'string',
          default: null,
        },
        {
          id: 'minDifficulty',
          type: 'string',
          default: 1,
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
      discord_id: message.author.id,
    });

    const randomEmbed = ts.levelEmbed(
      rand.level,
      ts.embedStyle.randoms,
      { players: args.players },
    );
    await message.channel.send(rand.player.userReply);
    await message.channel.send(randomEmbed);
  }
}
module.exports = playersRandom;
