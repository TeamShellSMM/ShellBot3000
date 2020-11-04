const TSCommand = require('../TSCommand.js');

class tsrandom extends TSCommand {
  constructor() {
    super('random', {
      aliases: ['tsrandom', 'random', 'randomall', 'randompending'],
      args: [
        {
          id: 'minDifficulty',
          type: 'difficulty',
          default: null,
        },
        {
          id: 'maxDifficulty',
          type: 'difficulty',
          default: null,
        },
      ],
      channelRestriction: 'guild',
    });
  }

  async tsexec(ts, message, args) {
    const rand = await ts.randomLevel({
      ...args,
      randomAll: args.command.command === 'randomall',
      randomPending: args.command.command === 'randompending',
      discord_id: ts.discord.getAuthor(message),
    });
    const randomEmbed = await ts.levelEmbed(
      rand.level,
      ts.embedStyle.random,
    );
    await ts.discord.messageSend(message, rand.player.userReply);
    await ts.discord.messageSend(message, randomEmbed);
  }
}
module.exports = tsrandom;
