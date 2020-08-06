const TSCommand = require('../TSCommand.js');

class ChangeName extends TSCommand {
  constructor() {
    super('changename', {
      aliases: ['changename', 'nickname', 'nick'],
      args: [
        {
          id: 'newName',
          type: 'string',
          default: null,
        },
      ],
      split: 'quoted',
    });
  }

  async tsexec(ts, message, args) {
    let { newName } = args;
    if (!newName) ts.userError('renameMember.noNewName');

    newName = newName.trim();

    if (ts.isSpecialDiscordString(newName))
      ts.userError('error.specialDiscordString');

    const player = await ts.getUser(message);
    if (player.name === newName)
      ts.userError('nickname.already', { newName });

    if (
      await ts.db.Members.query()
        .whereRaw('lower(name) = ?', [newName])
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
