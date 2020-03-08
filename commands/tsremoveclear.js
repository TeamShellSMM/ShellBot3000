const { Command } = require('discord-akairo');
class TSRemoveclear extends Command {
    constructor() {
        super('tsremoveclear', {
           aliases: ['tsremoveclear',"removeclear"],
            args: [{
                    id: 'code',
                    type: 'string',
                    default: ''
                }],
           channelRestriction: 'guild'
        });
    }
    
    async exec(message,args) {
        try{
          
          args.code=args.code.toUpperCase();
          if(!ts.valid_code(args.code))
            ts.userError("You did not provide a valid code for the level");

          await gs.loadSheets(["Raw Members","Raw Levels","Raw Played"]);
          const player=ts.get_user(message);
          var level=ts.getExistingLevel(args.code)

          var existing_play=gs.select("Raw Played",{"Code":args.code,"Player":player.Name})
          if(!existing_play || existing_play && existing_play.Completed!="1")
            ts.userError("You haven't submitted a clear for \""+level["Level Name"]+" by "+level.Creator)


          existing_play=gs.query("Raw Played",{
            filter:{"Code":args.code,"Player":player.Name},
            update:{"Completed":"0","Liked":"","Difficulty Vote":""}
          })

          await gs.batchUpdate(existing_play.update_ranges)

          var msg="You have removed your clear for "+level["Level Name"]+" by "+level.Creator+" "+ts.emotes.bam
          message.channel.send(player.user_reply+msg)
        } catch(error){
            message.reply(ts.getUserErrorMsg(error))
        }
    }
}
module.exports = TSRemoveclear;