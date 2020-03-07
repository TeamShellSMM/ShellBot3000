const { Command } = require('discord-akairo');
class tsdifficulty extends Command {
    constructor() {
        super('tsdifficulty', {
           aliases: ['tsdifficulty','difficulty'],
            args: [{
                    id: 'code',
                    type: 'string',
                    default: ''
                },{
                    id: 'difficulty',
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

          if(!ts.valid_difficulty(args.difficulty))
            ts.userError("You didn't provide a valid difficulty vote")
      
          await gs.loadSheets(["Raw Members","Raw Levels","Raw Played"]);
          const player=ts.get_user(message);
          var level=gs.select("Raw Levels",{"Code":args.code})
           if(
              !level || //level doesn't exist
              !(level.Approved==0 || level.Approved==1) //level is removed. not pending/accepted
             ){
            ts.userError("Level code was not found in Team Shell's list");
          }

          if(level.Creator==player.Name)
            ts.userError("You can't submit a difficulty vote for your own level")

          var existing_play=gs.select("Raw Played",{"Code":args.code,"Player":player.Name})
          if(!existing_play || existing_play && existing_play.Completed!="1")
            ts.userError("You haven't submitted a clear for \""+level["Level Name"]+" by "+level.Creator)

          var creator_str=ts.creator_str(level) //will return discord id if wants to be atted

          existing_play=gs.query("Raw Played",{
            filter:{"Code":args.code,"Player":player.Name},
            update:{"Difficulty Vote":args.difficulty}
          })

          if(!existing_play.updated["Difficulty Vote"])
            ts.userError("You have already voted \""+level["Level Name"]+" by "+level.Creator+" a **"+args.difficulty+"**")
          
          await gs.batchUpdate(existing_play.update_ranges)

          var msg="You have voted \""+level["Level Name"]+"\"  by "+creator_str+" to have a difficulty of **"+args.difficulty+"** "+ts.emotes.bam
          message.channel.send(player.user_reply+msg)
        } catch(error){
            message.reply(ts.getUserErrorMsg(error))
        }
    }
}
module.exports = tsdifficulty;