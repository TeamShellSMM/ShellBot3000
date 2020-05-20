const TSCommand = require('../TSCommand.js');

class tsreupload extends TSCommand {
  constructor() {
    super('tsreupload', {
      aliases: ['tsreupload', 'reupload'],
      channelRestriction: 'guild',
    });
  }

  async tsexec(ts, message) {
    const reply = await ts.reuploadLevel(message);
    await ts.discord.messageSend(message, reply);
  }
}
module.exports = tsreupload;
