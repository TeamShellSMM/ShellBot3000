const { Command } = require('discord-akairo');
const channels = require('../channels.json');
const emotes = require('../emotes.json');
class points extends Command {
    constructor() {
        super('points', {
           aliases: ['points'],
            args: [{
                    id: 'role',
                    type: 'string',
                    default: ''
                }],
           channelRestriction: 'guild'
        });
    }
    
    async exec(message,args) {     
        await gs.loadSheets(["Raw Members","Raw Levels","Raw Played"]);
        var player=gs.select("Raw Members",{
          "discord_id":message.author.id
        })

        if(!player) message.reply("You haven't registered yet")

        var all_ranks=gs.select("TeamShell Ranks");
        var all_ranks_id=all_ranks.map(r=>r.discord_roles)
        
         var earned_points=ts.calculatePoints(player.Name) 
         var rank=ts.get_rank(earned_points.clearPoints)
         var user_reply="<@"+message.author.id+">"+rank.Pips+" "


        if(args.role=="role" || args.role=="removerole"){
          await message.member.removeRoles(all_ranks_id)
        }
        if(args.role=="norole"){
          await message.member.addRole(rank.discord_roles)
        }

         var msg="You have "+earned_points.clearPoints+" clear points. You have submitted "+earned_points.levelsMade+" level(s). "

         if(earned_points.available>=0){
           msg+="You have enough points to upload a level "+emotes.PigChamp; 
         } else {
           msg+="You need "+Math.abs(earned_points.available).toFixed(1)+" points to upload a new level "+emotes.buzzyS+". Check how the points are mapped on http://bit.ly/teamshell.";
         }
         msg+=" You have earned the rank **"+rank.Rank+"** "+rank.Pips

        message.channel.send(user_reply+msg)
        
    }
}
module.exports = points;