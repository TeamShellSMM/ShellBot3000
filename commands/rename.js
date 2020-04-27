const TSCommand = require('../TSCommand.js');
class TSRename extends TSCommand {
    constructor() {
        super('tsrename', {
           aliases: ['tsrename','rename'],
           channelRestriction: 'guild'
        });
    }

    async tsexec(ts,message,args) {
      let command=ts.parse_command(message);
      let code=command.arguments.shift()
      if(code)
        code=code.toUpperCase()

      if(!ts.valid_code(code))
        ts.userError("You did not provide a valid level code")

      const level_name=command.arguments.join(" ")

      if(!level_name)
        ts.userError("You didn't give a new level name")

      const player=await ts.get_user(message);
      var level=await ts.getExistingLevel(code)

      if(!(level.creator==player.name || ts.is_mod(player)))
        ts.userError("You can't rename \""+level.level_name+"\" by "+level.creator);

      if(level.level_name==level_name)
        ts.userError("Level name is already \""+level_name+"\"")

      await ts.db.Levels.query()
        .patch({level_name})
        .where({code})

      var reply="The level \""+level.level_name+"\" ("+code+") has been renamed to \""+level_name+"\" "+(ts.emotes.bam ? ts.emotes.bam : "")
      message.channel.send(player.user_reply+reply)
    }
}
module.exports = TSRename;