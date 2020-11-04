const TSCommand = require('../TSCommand.js');

class ModAddPlayVids extends TSCommand {
  constructor() {
    super('modaddplayvids', {
      aliases: [
        'modaddplayvids',
        'modaddplayvid',
        'modremoveplayvids',
        'modremoveplayvid',
      ],
      args: [
        {
          id: 'member',
          description: 'memberName',
          type: 'teammember',
          default: null,
        },
        {
          id: 'level',
          description: 'levelCode',
          type: 'level',
          default: null,
        },
        {
          id: 'newVids',
          type: 'videos',
          match: 'rest',
          default: null,
        },
      ],
      quoted: true,
      channelRestriction: 'guild',
    });
  }

  async tsexec(ts, message, { command, member, level, newVids }) {
    const submitter = await ts.getUser(message);

    const reply = await ts.addVideos({
      command,
      level,
      newVids,
      player: member,
      submitter,
    });

    await ts.discord.messageSend(message, reply);
  }
}
module.exports = ModAddPlayVids;
