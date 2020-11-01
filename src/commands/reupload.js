const TSCommand = require('../TSCommand.js');

class tsreupload extends TSCommand {
  constructor() {
    super('tsreupload', {
      aliases: ['tsreupload', 'reupload'],
      channelRestriction: 'guild',
      args: [
        {
          id: 'oldLevel',
          type: 'level:any',
          default: null,
        },
        {
          id: 'newCode',
          type: 'levelcode',
          default: null,
        },
        {
          id: 'reason',
          type: 'longtext',
          match: 'rest',
          default: null,
        },
      ],
      quoted: true,
    });
  }

  async tsexec(ts, message, args) {
    const reply = await ts.reuploadLevel(message, args);
    await ts.discord.messageSend(message, reply);
  }
}
module.exports = tsreupload;
