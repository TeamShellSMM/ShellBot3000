const TSCommand = require('../TSCommand.js');

class mockUser extends TSCommand {
  constructor() {
    super('mockUser', {
      aliases: ['mockUser'],
      quoted: true,
      args: [
        {
          id: 'member',
          type: 'teammember',
          match: 'rest',
          default: null,
        },
      ],
    });
  }

  async tsexec(ts, message, {member}) {
    const player = await ts.getUser(message);

    if (!member) ts.userError('mock.notFound');
    if (member.name === player.name) ts.userError('mock.already');

    await ts.db.Members.query()
      .patch({ discord_id: player.discord_id_temp || '1' })
      .where({ discord_id: ts.discord.getAuthor(message) });

    await ts.db.Members.query()
      .patch({
        discord_id: ts.discord.getAuthor(message),
        discord_id_temp: member.discord_id,
      })
      .where({ name: member.name });

    const p = await ts.getUser(message);
    await ts.discord.messageSend(
      message,
      await ts.message('mock.userSuccess', { name: p.name }),
    );
  }
}
module.exports = mockUser;
