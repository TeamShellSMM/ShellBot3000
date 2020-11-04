const TSCommand = require('../TSCommand.js');

class TSModAddLevel extends TSCommand {
  constructor() {
    super('modaddlevel', {
      aliases: ['tsmodaddlevel', 'modaddlevel'],
      args: [
        {
          id: 'member',
          description: 'memberName',
          type: 'teammember',
          default: null,
        },
        {
          id: 'code',
          description: 'levelCode',
          type: 'levelcode',
          default: null,
        },
        {
          id: 'gameStyle',
          type: 'gameStyle',
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
      channelRestriction: 'guild',
    });
  }

  async tsexec(ts, message, { member, code, gameStyle, levelName }) {
    const { reply } = await ts.addLevel({
      code,
      gameStyle,
      level_name: levelName,
      member: member,
    });
    await ts.discord.messageSend(message, reply);
  }
}
module.exports = TSModAddLevel;
