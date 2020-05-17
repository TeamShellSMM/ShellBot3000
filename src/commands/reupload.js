const TSCommand = require('../TSCommand.js');

class tsreupload extends TSCommand {
  constructor() {
    super('tsreupload', {
      aliases: ['tsreupload', 'reupload'],
      channelRestriction: 'guild',
    });
  }

  async tsexec(ts, message, args) {
    const reply = await ts.reuploadLevel(message);
    await message.channel.send(reply);
  }
}
module.exports = tsreupload;
