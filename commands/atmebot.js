const TSCommand = require('../TSCommand.js');
class atmebot extends TSCommand {
    constructor() {
        super('atmebot', {
           aliases: ['atmebot','atme','dontatmebot','dontatme'],
            args: [{
                    id: 'code',
                    type: 'string',
                    default: ''
                }],
           channelRestriction: 'guild'
        });
    }

    async tsexec(ts,message,args) {
      const atmeCommands=["atmebot",'atme']
      var command=ts.parse_command(message);

      await ts.gs.loadSheets(["Raw Members","Raw Levels"]);
      const player=await ts.get_user(message);

      if(atmeCommands.indexOf(command.command)!=-1){
        var atmeVal="1"
        var alreadyError=ts.message("atme.already")
        var msg=ts.message("atme.willBe")
      } else {
        var atmeVal=""
        var alreadyError=ts.message("atme.alreadyNot")
        var msg=ts.message("atme.willBeNot")
      }

      var member=ts.gs.query("Raw Members",{
        filter:{"discord_id":message.author.id},
        update:{"atme":atmeVal}
      })

      if(member && !member.updated["atme"]){
        ts.userError(alreadyError)
      }

      await ts.gs.batchUpdate(member.update_ranges)
      message.channel.send(player.user_reply+msg)
    }
}
module.exports = atmebot;