const TSCommand = require('../TSCommand.js');

class ModAddMember extends TSCommand {
  constructor() {
    super('tsmodaddmember', {
      aliases: ['tsmodaddmember', 'modaddmember'],
      args: [
        {
          id: 'memberName',
          type: 'text',
          match: 'rest',
          default: null,
        },
      ],
      quoted: true,
      channelRestriction: 'guild',
    });
  }

  async tsexec(ts, message, {command, memberName}) {

    memberName = name.replace(/\\/g, '');

    const player = await ts.db.Members.query()
      .whereRaw('lower(name) = ?', [memberName.toLowerCase()])
      .first();
    if (player && player.is_banned) {
      ts.userError(await ts.message('error.userBanned'));
    }
    if (player) {
      ts.userError(
        await ts.message('register.nameTaken', { name: memberName }),
      );
    }

    await ts.db.Members.query().insert({
      name: memberName,
      discord_name: memberName,
    });

    await ts.discord.reply(
      message,
      await ts.message('modaddmember.success', { name: memberName }),
    );
  }
}
module.exports = ModAddMember;
