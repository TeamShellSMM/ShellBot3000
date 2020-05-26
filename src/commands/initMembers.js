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

    for(let member_arr of message.guild.members){
      let discord_id = member_arr[0];
      let member = member_arr[1];

      if(discord_id == ts.discord.botId()){
        continue;
      }

      let nickname = member.user.username;
      if(await ts.db.Members.query()
      .whereRaw('lower(name) = ?', [nickname.toLowerCase()])
      .first()){
        alreadyRegisteredCount++;
      } else {
        registeredCount++;
        await ts.db.Members.query().insert({
          name: nickname,
          discord_id: discord_id,
          discord_name: nickname,
        });
      }
    }

    await ts.discord.reply(
      message,
      ts.message('initmembers.success', { registeredCount: registeredCount, alreadyRegisteredCount: alreadyRegisteredCount }),
    );
  }
}

module.exports = InitMembers;
