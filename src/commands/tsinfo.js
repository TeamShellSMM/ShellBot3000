const TSCommand = require('../TSCommand.js');

class tsinfo extends TSCommand {
  constructor() {
    super('tsinfo', {
      aliases: ['tsinfo', 'info', 'level'],
      args: [
        {
          id: 'code',
          type: 'uppercase',
          default: null,
        },
      ],
      channelRestriction: 'guild',
    });
  }

  async tsexec(ts, message, { code }) {
    if (!code) ts.userError('error.noCode');
    const player = await ts.getUser(message);
    const level = await ts.getExistingLevel(code);

    const randomEmbed = await ts.levelEmbed(level);

    await ts.discord.messageSend(message, player.userReply);
    await ts.discord.messageSend(message, randomEmbed);
  }
}
module.exports = tsinfo;
