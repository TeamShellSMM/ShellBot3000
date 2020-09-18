const TSCommand = require('../TSCommand.js');

class TSAddvids extends TSCommand {
  constructor() {
    super('tsaddvids', {
      aliases: [
        'tsaddvids',
        'addvids',
        'tsaddvid',
        'addvid',
        'tsremovevids',
        'removevids',
        'tsrmemovevid',
        'removevid',
        'addmyvids',
        'addmyvid',
        'removemyvids',
        'removemyvid',
      ],
      channelRestriction: 'guild',
    });
  }

  async tsexec(ts, message) {
    const command = ts.parseCommand(message);
    let code = command.arguments.shift();
    if (code) {
      code = code.toUpperCase();
    } else {
      ts.userError('error.noCode');
    }

    let newVids = command.arguments.join(' ');
    if (!newVids) {
      ts.userError("You didn't give any links");
    }
    newVids = newVids.split(/[, \n]/);

    const player = await ts.getUser(message);

    const reply = await ts.addVideos({
      command,
      code,
      newVids,
      player,
      submitter: player,
    });

    await ts.discord.messageSend(message, reply);
  }
}
module.exports = TSAddvids;
