const { Command } = require('discord-akairo');
const debugError = require('debug')('shellbot3000:error');
const debug = require('debug')('shellbot3000:TSCommand');
const TS = require('./TS.js');
const DiscordLog = require('./DiscordLog');
const { defaultCommandPermissions } = require('./constants');

class TSCommand extends Command {
  async tsexec() {
    // to be extended
  }

  /**
   * Checks permissions
   * @param {TS} ts
   * @param {object} message
   * @returns {boolean}
   */
  async canRun(ts, message) {
    const commandName = ts.parseCommand(message).cmd;

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

    if (commandDB) {
      // Default behavior if no command permission is set
      const defaultPermission =
        defaultCommandPermissions[commandDB.name];

      if (
        !(
          defaultPermission.allowedRoles === 'all' ||
          (defaultPermission.allowedRoles === 'mods' &&
            (await ts.modOnly(message.author.id))) ||
          (defaultPermission.allowedRoles === 'admins' &&
            (await ts.teamAdmin(message.author.id)))
        )
      ) {
        return false;
      }

      if (!ts.inAllowedChannel(message, defaultPermission)) {
        return false;
      }
      return true;
    }
    if (ts.teamAdmin(message.author.id)) {
      return true;
    }
    return false;
  }

  async exec(message, args) {
    debug(`start ${message.content}`);
    let ts;
    try {
      ts = TS.teams(TS.DiscordWrapper.messageGetGuild(message));

      // Language stuff
      // If we find a colon in the command we remove the language part from the message content entire and set the ts language to that
      const { cmd } = ts.parseCommand(message);
      if (cmd.indexOf(':') !== -1) {
        ts.commandLanguage = cmd.substring(
          cmd.indexOf(':') + 1,
          cmd.length,
        );
        // eslint-disable-next-line no-param-reassign
        message.content = message.content.replace(
          cmd,
          cmd.substring(0, cmd.indexOf(':')),
        );
      } else {
        ts.commandLanguage = 'en';
      }

      if (
        ts.teamVariables.ChannelsShellbotAllowed &&
        this.category.id !== 'help'
      ) {
        const allowed = ts.teamVariables.ChannelsShellbotAllowed.split(
          ',',
        );
        if (
          !allowed.find((c) => {
            return (
              c.toLowerCase() ===
                message.channel.name.toLowerCase() ||
              (message.channel.parent &&
                c.toLowerCase() ===
                  message.channel.parent.name.toLowerCase())
            );
          })
        )
          return false;
      }

      if (!(await this.canRun(ts, message))) {
        /* DiscordLog.info(
          ts.makeErrorObj(`can't run: ${message.content}`, message),
        ); */
        return false;
      }
      await this.tsexec(ts, message, {
        ...args,
        command: ts.parseCommand(message),
      });
    } catch (error) {
      debugError(error);
      if (ts) {
        await TS.DiscordWrapper.reply(
          message,
          await ts.getUserErrorMsg(error, message),
        );
      } else {
        await TS.DiscordWrapper.reply(message, error.toString());
        DiscordLog.log(error, this.client);
      }
    } finally {
      TS.promisedCallback();
      debug(`end ${message.content}`);
    }
    return true;
  }
}
module.exports = TSCommand;
