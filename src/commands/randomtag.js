const TSCommand = require('../TSCommand.js');

class randomtag extends TSCommand {
  constructor() {
    super('randomtag', {
      aliases: ['randomtag'],
      split: 'quoted',
      args: [
        {
          id: 'tag',
          type: 'string',
          default: null,
        },
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
    if (!args.tag) ts.userError('tag.noTag');
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
module.exports = randomtag;
