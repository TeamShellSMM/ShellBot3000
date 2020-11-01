const TSCommand = require('../TSCommand.js');

class ChangeName extends TSCommand {
  constructor() {
    super('changename', {
      aliases: ['changename', 'nickname', 'nick'],
      args: [
        {
          id: 'newName',
          type: 'text',
          match: 'rest',
          default: null,
        },
      ],
      quoted: true
    });
  }

  async tsexec(ts, message, {newName}) {
    const player = await ts.getUser(message);
    if (player.name === newName)
      ts.userError('nickname.already', { newName });

    if (
      await ts.db.Members.query()
        .whereRaw('lower(name) = ?', [newName.toLowerCase()])
        .first()
    ) {
      ts.userError('renameMember.alreadyUsed', { newName });
    }

    await ts.db.Members.query()
      .patch({ name: newName })
      .where({ id: player.id });

    await ts.discord.reply(
      message,
      await ts.message('nickname.success', {
        oldName: player.name,
        newName,
      }),
    );
  }
}

module.exports = ChangeName;
