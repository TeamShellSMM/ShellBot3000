const TSCommand = require('../TSCommand.js');

class InitMembers extends TSCommand {
  constructor() {
    super('initmembers', {
      aliases: ['initmembers'],
    });
  }

  async canRun(ts, message) {
    return ts.teamAdmin(message.author.id);
  }

  async tsexec(ts, message) {
    let registeredCount = 0;
    let alreadyRegisteredCount = 0;

    for (const memberArr of message.guild.members) {
      const discord_id = memberArr[0];
      const member = memberArr[1];

      if (discord_id !== ts.discord.botId()) {
        const nickname = member.user.username;
        if (
          await ts.db.Members.query()
            .whereRaw('lower(name) = ?', [nickname.toLowerCase()])
            .first()
        ) {
          alreadyRegisteredCount += 1;
        } else {
          registeredCount += 1;
          await ts.db.Members.query().insert({
            name: nickname,
            discord_id: discord_id,
            discord_name: nickname,
          });
        }
      }
    }

    await ts.discord.reply(
      message,
      await ts.message('initmembers.success', {
        registeredCount: registeredCount,
        alreadyRegisteredCount: alreadyRegisteredCount,
      }),
    );
  }
}

module.exports = InitMembers;
