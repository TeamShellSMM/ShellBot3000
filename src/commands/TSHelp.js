const TSCommand = require('../TSCommand.js');

class TSHelp extends TSCommand {
  constructor() {
    super('help', {
      aliases: ['help', '?'],
      args: [
        {
          id: 'language',
          type: 'string',
          default: '',
        },
      ],
      category: 'help',
      channelRestriction: 'guild',
    });
  }

  async tsexec(ts, message, { language }) {
    await ts.discord.messageSend(
      message,
      ts.message(`${ts.languageCode(language)}help`),
    );
  }
}
module.exports = TSHelp;
