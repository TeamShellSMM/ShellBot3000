const TSCommand = require('../TSCommand.js');

class housekeep extends TSCommand {
  constructor() {
    super('housekeep', {
      aliases: ['housekeep'],
      ownerOnly: true,
      category: 'owner',
    });
  }

  async tsexec(ts, message) {
    await ts.load();
    const guild = ts.getGuild();
    let housekept = 0;
    for (let i = 0; i < guild.channels.length; i += 1) {
      const channel = guild.channels[i];
      if (channel.parentID === ts.channels.levelDiscussionCategory) {
        const code = channel.name.toUpperCase();
        let deleteLevel = false;
        let reason = '';
        const currentLevel = await ts.getLevels().where({ code });
        if (currentLevel) {
          if (currentLevel.status !== ts.LEVEL_STATUS.PENDING) {
            deleteLevel = true;
            reason = 'Level not pending anymore';
          }
        } else {
          deleteLevel = true;
          reason = 'No level found in list';
        }
        if (deleteLevel) {
          await ts.deleteDiscussionChannel(code, reason);
          housekept += 1;
        }
      }
    }
    await ts.discord.reply(message, 'Housekeeping done');
  }
}

module.exports = housekeep;
