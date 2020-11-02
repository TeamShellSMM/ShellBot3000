const TSCommand = require('../TSCommand.js');

class TSModSetDiscordId extends TSCommand {
  constructor() {
    super('tsmodsetdiscordid', {
      aliases: ['tsmodsetdiscordid', 'modsetdiscordid'],
      args: [
        {
          id: 'member',
          type: 'teammember',
          default: null,
        },
        {
          id: 'discordId',
          type: 'text',
          default: null,
        },
      ],
      quoted: true,
      channelRestriction: 'guild',
    });
  }

  async tsexec(ts, message, { member, discordId }) {
    if (Number.isNaN(discordId)) {
      ts.userError(await ts.message('modsetdiscordid.invalidId'));
    }

    const discordIdMember = await ts.db.Members.query()
      .where({
        discord_id: discordId,
      })
      .first();

    if (discordIdMember) {
      ts.userError(await ts.message('modsetdiscordid.duplicateId'));
    }

    await ts.db.Members.query().where('id', member.id).update({
      discord_id: discordId,
    });

    await ts.discord.reply(
      message,
      await ts.message('modsetdiscordid.success', {
        name: member.name,
      }),
    );
  }
}
module.exports = TSModSetDiscordId;
