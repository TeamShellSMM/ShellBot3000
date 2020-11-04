const TSCommand = require('../TSCommand.js');

class tsinfo extends TSCommand {
  constructor() {
    super('info', {
      aliases: ['tsinfo', 'info', 'level'],
      args: [
        {
          id: 'level',
          description: 'levelCode',
          type: 'level',
          default: null,
        },
      ],
      quoted: true,
      channelRestriction: 'guild',
    });
  }

  async tsexec(ts, message, { level }) {
    const player = await ts.getUser(message);

    const randomEmbed = await ts.levelEmbed(level);

    await ts.discord.messageSend(message, player.userReply);
    await ts.discord.messageSend(message, randomEmbed);
  }
}
module.exports = tsinfo;
