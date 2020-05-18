const TSCommand = require('../TSCommand.js');

class RenameMember extends TSCommand {
  constructor() {
    super('renamemember', {
      aliases: ['renamemember'],
      args: [
        {
          id: 'discordId',
          type: 'string',
          default: null,
        },
        {
          id: '_newName',
          type: 'string',
          default: null,
        },
      ],
      split: 'quoted',
    });
  }

  async canRun(ts, message) {
    return ts.modOnly(message.author.id);
  }

  async tsexec(ts, message, { discordId, _newName }) {
    if (!discordId) ts.userError('renameMember.noDiscordId');
    if (!_newName) ts.userError('renameMember.noNewName');
    const newName = _newName.trim();
    if (ts.isSpecialDiscordString(newName))
      ts.userError('error.specialDiscordString');

    const existingMember = await ts.db.Members.query()
      .where({ discord_id: discordId })
      .first();
    if (!existingMember)
      ts.userError('renameMember.noMemberFound', {
        discord_id: discordId,
      });
    if (existingMember.name === newName)
      ts.userError('renameMember.already', { newName });
    const oldName = existingMember.name;

    if (
      await ts.db.Members.query()
        .whereRaw('lower(name) = ?', [newName])
        .first()
    ) {
      ts.userError(
        `There is already another member with name "${newName}"`,
      );
    }

    await ts.db.Members.query()
      .patch({ name: newName })
      .where({ discord_id: discordId });

    await message.reply(
      `"${oldName}" has been renamed to "${newName}"`,
    );
  }
}

module.exports = RenameMember;
