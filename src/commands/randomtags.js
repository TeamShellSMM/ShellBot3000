const TSCommand = require('../TSCommand.js');

class randomtag extends TSCommand {
  constructor() {
    super('randomtags', {
      aliases: ['randomtags', 'randomtag'],
      args: [
        {
          id: 'tags',
          type: 'tags:whitelisted',
          default: null,
        },
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
      quoted: true,
      channelRestriction: 'guild',
    });
  }

  async tsexec(ts, message, args) {
    // console.log(args.tags);
    const rand = await ts.randomLevel({
      ...args,
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
module.exports = randomtag;
