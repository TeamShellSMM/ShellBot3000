const TSCommand = require('../TSCommand.js');

class TSRegister extends TSCommand {
  constructor() {
    super('tsregister', {
      aliases: ['tsregister', 'register'],
      args: [
        {
          id: 'nicknameOverride',
          type: 'text:optional',
          match: 'rest',
          default: null,
        },
      ],
      channelRestriction: 'guild',
    });
  }

  async tsexec(ts, message, { nicknameOverride }) {
    const player = await ts.db.Members.query()
      .where({ discord_id: ts.discord.getAuthor(message) })
      .first();
    if (player && player.is_banned) {
      ts.userError(await ts.message('error.userBanned'));
    }
    if (player) {
      ts.userError(
        await ts.message('register.already', { ...player }),
      );
    }

    let nickname = ts.discord.getUsername(message);

    if (nicknameOverride) {
      nickname = nicknameOverride;
    }

    if (ts.isSpecialDiscordString(nickname))
      ts.userError(await ts.message('error.specialDiscordString'));

    nickname = nickname.replace(/\\/g, '');
    if (
      await ts.db.Members.query()
        .whereRaw('lower(name) = ?', [nickname.toLowerCase()])
        .first()
    ) {
      ts.userError(
        await ts.message('register.nameTaken', { name: nickname }),
      );
    }

    const authorId = ts.discord.getAuthor(message);
    await ts.db.Members.query().insert({
      name: nickname,
      discord_id: authorId, // insert as string
      discord_name: ts.discord.getUsername(message),
    });

    if (ts.teamVariables.nonMemberRoleId) {
      await ts.discord.addRole(
        authorId,
        ts.teamVariables.nonMemberRoleId,
      );
    }

    const minPoints = Number(ts.teamVariables['Minimum Point']);

    await ts.discord.reply(
      message,
      (await ts.message('register.success', { name: nickname })) +
        (minPoints > 0
          ? await ts.message('register.pointsNeeded', { minPoints })
          : await ts.message('register.noPointsNeeded')),
    );
  }
}
module.exports = TSRegister;
