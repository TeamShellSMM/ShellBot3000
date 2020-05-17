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
          id: 'new_name',
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

  async tsexec(ts, message, { discord_id, new_name }) {
    if (!discord_id) ts.userError('renameMember.noDiscordId');
    if (!new_name) ts.userError('renameMember.noNewName');

    if (
      await ts.db.Members.query()
        .whereRaw('lower(name) = ?', [new_name])
        .first()
    ) {
      ts.userError(
        `There is already another member with name "${new_name}"`,
      );
    }

    const existing_member = await ts.db.Members.query()
      .where({ discord_id })
      .first();
    if (!existing_member)
      ts.userError('renameMember.noMemberFound', { discord_id });
    const old_name = existing_member.name;

    await ts.db.Members.query()
      .patch({ name: new_name })
      .where({ discord_id });

    return await message.reply(
      `"${old_name}" has been renamed to "${new_name}"`,
    );
  }
}

module.exports = RenameMember;
