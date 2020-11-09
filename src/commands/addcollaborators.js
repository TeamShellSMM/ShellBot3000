const TSCommand = require('../TSCommand.js');

class AddCollaborators extends TSCommand {
  constructor() {
    super('addcollaborators', {
      aliases: ['addcollaborators', 'addcollaborator'],
      args: [
        {
          id: 'level',
          description: 'levelCode',
          type: 'level',
          default: null,
        },
        {
          id: 'newMembers',
          description: 'Member1,Member2,Member3,...',
          type: 'teammembers',
          match: 'rest',
          default: null,
        },
      ],
      quoted: true,
      channelRestriction: 'guild',
    });
  }

  async tsexec(ts, message, { level, newMembers }) {
    const submitter = await ts.getUser(message);

    const reply = await ts.addCollaborators({
      level,
      newMembers,
      submitter,
    });

    await ts.discord.messageSend(message, reply);
  }
}
module.exports = AddCollaborators;
