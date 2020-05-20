const { Command } = require('discord-akairo');
const debugError = require('debug')('shellbot3000:error');
const debug = require('debug')('shellbot3000:TSCommand');
const TS = require('./TS.js');
const DiscordLog = require('./DiscordLog');

class TSCommand extends Command {
  async tsexec(ts, message, args) {}

  /**
   * Overide this to do checks if a command runs or not
   * @param {TS} ts
   * @param {object} message
   * @returns {boolean}
   */
  async canRun(ts, message) {
    return true;
  }

  async exec(message, args) {
    debug(`start ${message.content}`);
    let ts;
    try {
      ts = TS.teams(message.guild.id);
      if (!(await this.canRun(ts, message))) {
        DiscordLog.log(
          ts.makeErrorObj(`can't run: ${message.content}`, message),
        );
        return false;
      }
      args.command = ts.parseCommand(message);
      await this.tsexec(ts, message, args);
    } catch (error) {
      debugError(error);
      if (ts) {
        await TS.DiscordWrapper.reply(
          message,
          ts.getUserErrorMsg(error, message),
        );
      } else {
        await TS.DiscordWrapper.reply(message, error);
        DiscordLog.log(error, this.client);
      }

      // throw error;
    } finally {
      if (typeof TS.promisedCallback === 'function')
        TS.promisedCallback();

      debug(`end ${message.content}`);
    }
  }
}
module.exports = TSCommand;
