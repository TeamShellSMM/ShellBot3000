const { CommandHandler } = require('discord-akairo');

const TS = require('./TS.js');

class TSCommandHandler extends CommandHandler {
  async handleDirectCommand(
    message,
    content,
    command,
    ignore = false,
  ) {
    const ts = TS.teams(TS.DiscordWrapper.messageGetGuild(message));
    let commandName = ts.parseCommand(message).cmd;

    if (commandName.indexOf(':') !== -1) {
      commandName = commandName.substring(
        0,
        commandName.lastIndexOf(':'),
      );
    }

    const commandDB = await ts
      .knex('commands')
      .where({
        name: commandName,
      })
      .orWhere('aliases', '=', `${commandName}`)
      .orWhere('aliases', 'like', `${commandName},%`)
      .orWhere('aliases', 'like', `%,${commandName}`)
      .orWhere('aliases', 'like', `%,${commandName},%`)
      .first();

    const canRunCommand = await ts.canRunCommand(
      message,
      commandDB,
      true,
    );

    if (!canRunCommand) {
      return true;
    }

    return super.handleDirectCommand(
      message,
      content,
      command,
      ignore,
    );
  }
}

module.exports = TSCommandHandler;
