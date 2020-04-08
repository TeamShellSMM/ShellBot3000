const { Command } = require('discord-akairo');
class tsreupload extends Command {
    constructor() {
        super('tsreupload', {
           aliases: ['tsreupload','reupload'],
            args: [{
                    id: 'oldCode',
                    type: 'string',
                    default: ''
                },{
                    id: 'newCode',
                    type: 'string',
                    default: ''
                }],
           channelRestriction: 'guild'
        });
    }

    async exec(message,args) {
         //if(!(
        //    message.channel.id === ts.channels.shellderShellbot  //only in bot-test channel
        //)) return false;
      try {

        var oldCode=args.oldCode.toUpperCase();
        var newCode=args.newCode.toUpperCase();

        if(!ts.valid_code(oldCode))
          ts.userError("You did not provide a valid code for the old level")
        if(!ts.valid_code(newCode))
          ts.userError("You did not provide a valid code for the new level")
        if(oldCode==newCode)
          ts.userError("The codes given were the same")

        await gs.loadSheets(["Raw Members","Raw Levels"]); //when everything goes through shellbot 3000 we can do cache invalidation stuff

        var player=gs.select("Raw Members",{
          "discord_id":message.author.id
        })



        if(!player)
          ts.userError("You are not yet registered");
        var earned_points=await ts.calculatePoints(player.Name);
        var rank=ts.get_rank(earned_points.clearPoints);
        var user_reply="<@"+message.author.id+">"+rank.Pips+" ";

        var level=ts.getExistingLevel(oldCode,true)
        var new_level=gs.select("Raw Levels",{"Code":newCode}) //new level just incase they've already tsadded

        var older_level=gs.query("Raw Levels",{ //this is just in case this is not the first reupload. assign
          filter:{"NewCode":oldCode},
          update:{"NewCode":newCode}
        },true)

        if(!level) ts.userError("Level not found");

        var creator_points=await ts.calculatePoints(level.Creator,level.Approved=="1" || level.Approved=="0")

        if(new_level && level.Creator!=new_level.Creator)
          ts.userError("The new level uploaded doesn't have the same creator as the old level");
        if(new_level && new_level.Approved!=0 && new_level.Approved!=1)
          ts.userError("The new level is not approved or pending");
        if(!new_level && creator_points.available<0)
          ts.userError("Creator doesn't have enough to upload a new level");
        if(level.NewCode && ts.valid_code(level.NewCode))
          ts.userError("Level has already been reuploaded with Code "+level.NewCode)

        //only creator and shellder can reupload a level
        if(!(level.Creator==player.Name || player.shelder=="1"))
          ts.userError("You can't reupload \""+level["Level Name"]+"\" by "+level.Creator);

        level=gs.query("Raw Levels",{
          filter:{"Code":oldCode},
          update:{"Approved":level.Approved=="1"?2:-1,"NewCode":newCode},
        })
        var batch_updates=level.update_ranges
        //combine all the updates into one array to be passed to gs.batchUpdate

        if(older_level){
          older_level.forEach((o)=>{
            batch_updates=batch_updates.concat(o.update_ranges)
          })

        }
        if(!new_level){ //if no new level was found create a new level copying over the old data
          await gs.insert("Raw Levels",{
            Code:newCode,
            "Level Name":level["Level Name"],
            Creator:level.Creator,
            Difficulty:0,
            Approved:0,
            Tags:level.Tags
          })
        }

        if(batch_updates!=null){
          await gs.batchUpdate(batch_updates)
        }

        let guild=ts.getGuild();
        let existingChannel=guild.channels.find(channel => channel.name === oldCode.toLowerCase() && channel.parent.name === "level-discussion")
        if(existingChannel){
          await existingChannel.setName(newCode.toLowerCase())
          await existingChannel.send("This level has been reuploaded from "+oldCode+" to "+newCode+". Below are the comments of the old level")
          let oldEmbed=await ts.makeVoteEmbed(level)
          await existingChannel.send(oldEmbed)
        }

        var reply="You have reuploaded \""+level["Level Name"]+"\" by "+level.Creator+" with code ("+newCode+")."+ts.emotes.bam
        if(!new_level){
          reply+=" If you want to rename the new level, you can use !tsrename new-code level name."
        }
        message.channel.send(user_reply+reply)
      } catch (error) {
        message.reply(ts.getUserErrorMsg(error))
      }
    }
}
module.exports = tsreupload;