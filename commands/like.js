const { Command } = require('discord-akairo');
class tslike extends Command {
    constructor() {
        super('tslike', {
           aliases: ['tslike','like'],
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
          await gs.loadSheets(["Raw Members","Raw Levels","Raw Played"]);
          args.code=args.code.toUpperCase();
          
          const player=ts.get_user(message);

          if(!ts.valid_code(args.code))
            ts.userError("You did not provide a valid code for the level");
      
          var level=gs.select("Raw Levels",{"Code":args.code})
           if(
              !level || //level doesn't exist
              !(level.Approved==0 || level.Approved==1) //level is removed. not pending/accepted
             ){
            ts.userError("Level code was not found in Team Shell's list");
          }

          if(level.Creator==player.Name)
            ts.userError("You can't submit a like for your own level")

          var existing_play=gs.select("Raw Played",{"Code":args.code,"Player":player.Name})
          if(!existing_play)
            ts.userError("You haven't submitted a clear for \""+level["Level Name"]+" by "+level.Creator)

          var creator_str=ts.creator_str(level) //will return discord id if wants to be atted

          existing_play=gs.query("Raw Played",{
            filter:{"Code":args.code,"Player":player.Name},
            update:{"Liked":1}
          })

          if(!existing_play.updated["Liked"])
            ts.userError("You have already liked \""+level["Level Name"]+" by "+level.Creator)
          
          await gs.batchUpdate(existing_play.update_ranges)

          var msg="You have liked \""+level["Level Name"]+"\"  by "+creator_str+" "+ts.emotes.love
          message.channel.send(player.user_reply+msg)
        } catch(error){
            message.reply(ts.getUserErrorMsg(error))
        }
    }
}
module.exports = tslike;