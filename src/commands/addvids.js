const TSCommand = require('../TSCommand.js');

class TSAddvids extends TSCommand {
  constructor() {
    super('addvids', {
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
      args: [
        {
          id: 'level',
          description: 'levelCode',
          type: 'level',
          default: null,
        },
        {
          id: 'newVids',
          type: 'videos',
          description: 'Link1,Link2,Link3,...',
          match: 'rest',
          default: null,
        },
      ],
      quoted: true,
    });
  }

  async tsexec(ts, message, { command, level, newVids }) {
    const player = await ts.getUser(message);

    const reply = await ts.addVideos({
      command,
      level,
      newVids,
      player,
      submitter: player,
    });

    await ts.updatePendingDiscussionChannel(level);

    await ts.discord.messageSend(message, reply);
  }
}
module.exports = TSAddvids;
