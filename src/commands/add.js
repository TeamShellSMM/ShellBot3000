const TSCommand = require('../TSCommand.js');

class tsadd extends TSCommand {
  constructor() {
    super('tsadd', {
      aliases: ['tsadd', 'add'],
      channelRestriction: 'guild',
      args: [
        {
          id: 'code',
          type: 'levelcode',
          default: null,
        },
        {
          id: 'gameStyle',
          type: 'gamestyle',
          default: null,
        },
        {
          id: 'levelName',
          type: 'text',
          match: 'rest',
          default: null,
        },
      ],
      quoted: true,
    });
  }

  async tsexec(ts, message, args) {
    let { code, gameStyle } = args;
    const { levelName } = args;

    if (ts.teamVariables.disableMemberLevelSubmission === 'true') {
      ts.userError(await ts.message('add.notAllowed'));
    }

    if (code) code = code.toUpperCase();
    if (gameStyle) gameStyle = gameStyle.toUpperCase();

    const { reply, player } = await ts.addLevel({
      code,
      gameStyle,
      level_name: levelName,
      discord_id: ts.discord.getAuthor(message),
    });
    await ts.discord.messageSend(message, player.userReply + reply);
  }
}
module.exports = tsadd;
