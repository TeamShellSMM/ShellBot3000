const TSCommand = require('../TSCommand.js');

class RenameMember extends TSCommand {
  constructor() {
    super('renamemember', {
      aliases: ['renamemember'],
      args: [
        {
          id: 'discord_id',
          type: 'string',
          default: null,
        },
        {
          id: 'newName',
          type: 'string',
          default: null,
        },
      ],
      split: 'quoted',
    });
  }

  async canRun(ts, message) {
    return await ts.modOnly(message.author.id);
  }

  async tsexec(ts, message, { discord_id, newName }) {
    if (!discord_id) ts.userError('renameMember.noDiscordId');
    if (!newName) ts.userError('renameMember.noNewName');
    newName = newName.trim();

    const existing_member = await ts.db.Members.query()
      .where({ discord_id })
      .first();
    if (!existing_member)
      ts.userError('renameMember.noMemberFound', { discord_id });
    if (existing_member.name === newName)
      ts.userError('renameMember.already', { newName });
    const oldName = existing_member.name;

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
      .where({ discord_id });

    return await message.reply(
      `"${oldName}" has been renamed to "${newName}"`,
    );
  }
}

module.exports = RenameMember;
