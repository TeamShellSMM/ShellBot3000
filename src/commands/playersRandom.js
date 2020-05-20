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
          default: '',
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
    if (!args.players) ts.userError('random.noPlayersGiven');

    const rand = await ts.randomLevel({
      ...args,
      discord_id: ts.discord.getAuthor(message),
    });

    const randomEmbed = ts.levelEmbed(
      rand.level,
      ts.embedStyle.randoms,
      { players: args.players },
    );
    await ts.discord.messageSend(message, rand.player.userReply);
    await ts.discord.messageSend(message, randomEmbed);
  }
}
module.exports = playersRandom;
