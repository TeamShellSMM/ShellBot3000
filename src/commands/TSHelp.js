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
      channelRestriction: 'guild',
    });
  }

  async tsexec(ts, message, { language }) {
    await ts.discord.messageSend(
      message,
      ts.message(`${ts.languageCode(language)}help`, {
        registrationChannel: ts.discord.channel(
          ts.teamVariables.RegistrationChannel,
        ),
      }),
    );
  }
}
module.exports = TSHelp;
