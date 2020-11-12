const TSCommand = require('../TSCommand.js');

class TSHelp extends TSCommand {
  constructor() {
    super('help', {
      aliases: ['help', 'help.*', '?'],
      args: [
        {
          id: 'commandName',
          type: 'text:optional',
          match: 'rest',
          default: null,
        },
      ],
      category: 'help',
      channelRestriction: 'guild',
    });
  }

  async tsexec(ts, message, args) {
    let { commandName } = args;
    if (commandName) {
      if (commandName === 'commands') {
        let replyMessage = await ts.message(`help.commands`);

        const commandsDB = await ts
          .knex('commands')
          .orderBy('name', 'ASC');

        for (const commandDB of commandsDB) {
          const allowed = await ts.canRunCommand(message, commandDB);
          if (allowed) {
            if (commandDB.category === 'important') {
              replyMessage += `\n> **__${commandDB.name}__**`;
            } else {
              replyMessage += `\n> ${commandDB.name}`;
            }
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
      let msgStr = await ts.message(`help`);

      const commandDB = await ts
        .knex('commands')
        .where({
          name: 'add',
        })
        .first();

      if (commandDB) {
        const commandPermission = await ts
          .knex('command_permissions')
          .where({
            command_id: commandDB.id,
            guild_id: ts.team.id,
          })
          .first();

        // If the add command is disabled we just remove the line with the level submission channel from the help text, hopefully that should be correct for all languages
        if (commandPermission && commandPermission.disabled) {
          const msgArr = msgStr.split('\n');
          const newArr = [];
          for (const msgPart of msgArr) {
            if (
              msgPart.indexOf(
                ts.teamVariables.LevelSubmissionChannel.id
                  ? ts.teamVariables.LevelSubmissionChannel.id
                  : ts.teamVariables.LevelSubmissionChannel,
              ) === -1
            ) {
              newArr.push(msgPart);
            }
          }
          msgStr = newArr.join('\n');
        }
      }
      await ts.discord.messageSend(message, msgStr);
    }
  }
}
module.exports = TSHelp;
