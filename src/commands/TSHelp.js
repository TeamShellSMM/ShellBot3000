const TSCommand = require('../TSCommand.js');

class TSHelp extends TSCommand {
  constructor() {
    super('help', {
      aliases: ['help', 'help.*', '?'],
      args: [
      ],
      category: 'help',
      channelRestriction: 'guild',
    });
  }

  async tsexec(ts, message, { language }) {
    await ts.discord.messageSend(
      message,
      await ts.message(`help`),
    );
  }
}
module.exports = TSHelp;
