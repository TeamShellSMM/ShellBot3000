const TSCommand = require('../TSCommand.js');

class playersRandom extends TSCommand {
  constructor() {
    super('playersRandom', {
      aliases: ['playersRandom'],
      quoted: true,
      args: [
        {
          id: 'players',
          type: 'teammembers',
          default: '',
        },
        {
          id: 'minDifficulty',
          type: 'difficulty',
          default: 1,
        },
        {
          id: 'maxDifficulty',
          type: 'difficulty',
          default: null,
        },
      ],
      quoted: true,
      channelRestriction: 'guild',
    });
  }

  async tsexec(ts, message, args) {
    const rand = await ts.randomLevel({
      ...args,
      discord_id: ts.discord.getAuthor(message),
    });

    const randomEmbed = await ts.levelEmbed(
      rand.level,
      ts.embedStyle.randoms,
      { players: args.players.map((x) => x.name) },
    );
    await ts.discord.messageSend(message, rand.player.userReply);
    await ts.discord.messageSend(message, randomEmbed);
  }
}
module.exports = playersRandom;
