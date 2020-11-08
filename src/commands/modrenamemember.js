const TSCommand = require('../TSCommand.js');

class ModRenameMember extends TSCommand {
  constructor() {
    super('modrenamemember', {
      aliases: ['modrenamemember'],
      args: [
        {
          id: 'member',
          description: 'oldMemberName',
          type: 'teammember',
          default: null,
        },
        {
          id: 'memberName',
          description: 'newMemberName',
          type: 'text',
          match: 'rest',
          default: null,
        },
      ],
      quoted: true,
      channelRestriction: 'guild',
    });
  }

  async tsexec(ts, message, args) {
    let { memberName } = args;
    const { member } = args;

    memberName = memberName.replace(/\\/g, '');
    if (member && member.is_banned) {
      ts.userError(await ts.message('error.userBanned'));
    }

    const oldName = member.name;

    const player = await ts.db.Members.query()
      .whereRaw('lower(name) = ?', [memberName.toLowerCase()])
      .first();

    if (player) {
      ts.userError(
        await ts.message('register.nameTaken', { name: memberName }),
      );
    }

    await ts.db.Members.query()
      .where({
        id: member.id,
      })
      .update({
        name: memberName,
      });

    await ts.discord.reply(
      message,
      await ts.message('success.modrenamemember', {
        oldName,
        newName: memberName,
      }),
    );
  }
}
module.exports = ModRenameMember;
