const TSCommand = require('../TSCommand.js');

class TSHelp extends TSCommand {
  constructor() {
    super('help', {
      aliases: ['help', 'help.*', '?'],
      args: [],
      category: 'help',
      channelRestriction: 'guild',
    });
  }

  async tsexec(ts, message) {
    const command = ts.parseCommand(message);
    let commandName = command.next();

    if (commandName) {
      if (commandName === 'commands') {
        let replyMessage = await ts.message(`help.commands`);

        const commandsDB = await ts
          .knex('commands')
          .where('category', '<>', 'mods');

        for (const commandDB of commandsDB) {
          if (commandDB.category === 'important') {
            replyMessage += `\n> **__${commandDB.name}__**`;
          } else {
            replyMessage += `\n> ${commandDB.name}`;
          }
        }

        await ts.discord.messageSend(message, replyMessage);
      } else {
        commandName = commandName.replace('!', '');

        const commandDB = await ts
          .knex('commands')
          .where({
            name: commandName,
          })
          .orWhere('aliases', '=', `${commandName}`)
          .orWhere('aliases', 'like', `${commandName},%`)
          .orWhere('aliases', 'like', `%,${commandName}`)
          .orWhere('aliases', 'like', `%,${commandName},%`);

        if (commandDB && commandDB.length > 0) {
          await ts.discord.messageSend(
            message,
            `**${commandDB[0].format}**\n> ${await ts.message(
              `help.${commandDB[0].name}`,
            )}`,
          );
        } else {
          await ts.discord.messageSend(
            message,
            await ts.message(`help.unknownCommand`),
          );
        }
      }
    } else {
      await ts.discord.messageSend(message, await ts.message(`help`));
    }
  }
}
module.exports = TSHelp;
