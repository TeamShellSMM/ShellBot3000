const { Command } = require('discord-akairo');
class atmebot extends Command {
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

    async exec(message,args) {
        try {
          var ts=get_ts(message.guild.id)
        } catch(error){
          message.reply(error)
          throw error;
        }
        
        try{
          const atmeCommands=["atmebot",'atme']
          var command=ts.parse_command(message);

          await ts.gs.loadSheets(["Raw Members","Raw Levels"]);
          const player=await ts.get_user(message);

          if(atmeCommands.indexOf(command.command)!=-1){
            var atmeVal="1"
            var alreadyError="You already have chosen to be atted"
            var msg="You will be atted by ShellBot "+ts.emotes.bam
          } else {
            var atmeVal=""
            var alreadyError="You already have chosen to be not atted"
            var msg="You will be not be atted by ShellBot "+ts.emotes.bam

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
        } catch(error){
            message.reply(ts.getUserErrorMsg(error))
        }
    }
}
module.exports = atmebot;