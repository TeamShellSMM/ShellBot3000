const { Command } = require('discord-akairo');
const debugError = require('debug')('shellbot3000:error');
const debug = require('debug')('shellbot3000:TSCommand');
const TS = require('./TS.js');
const DiscordLog = require('./DiscordLog');

class TSCommand extends Command {
  async tsexec() {
    // to be extended
  }

  /**
   * Overide this to do checks if a command runs or not
   * @param {TS} ts
   * @param {object} message
   * @returns {boolean}
   */
  async canRun() {
    return true;
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
        message.content = message.content.replace(
          cmd,
          cmd.substring(0, cmd.indexOf(':')),
        );
      } else {
        ts.commandLanguage = "en";
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
        DiscordLog.log(
          ts.makeErrorObj(`can't run: ${message.content}`, message),
        );
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
