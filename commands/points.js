const { Command } = require('discord-akairo');
const channels = require('../channels.json');
class points2 extends Command {
    constructor() {
        super('points2', {
           aliases: ['points2'],
            args: [{
                    id: 'preview',
                    type: 'string',
                    default: ''
                }],
           channelRestriction: 'guild'
        });
    }
    
    async exec(message,args) {     
         //if(!( 
            //message.channel.id === channels.shellderShellbot  //only in bot-test channel
            //&& message.member.roles.exists(role => role.name === 'Shellder')  //only shellder
        //)) return false;
        await gs.loadSheets(["Raw Members","Raw Levels","Raw Played"]);
        var player=gs.select("Raw Members",{
          "discord_id":message.author.id
        })

        if(!player) message.reply("You haven't registered yet")

         var earned_points=ts.calculatePoints(player.Name) 
         var rank=ts.get_rank(earned_points.clearPoints)
         var rank_pip=rank.pips+" "
        //not working
    
        //let curr_usr=message.guild.members.get(missing_shellcults[i])
        //curr_usr.addRole(channels.shellcult_id)
  
        //this.client.channels.get(channels.initiateChannel).send("<a:ts_2:632758958284734506><a:ts_2:632758958284734506><a:ts_1:632758942992302090>\n<:SpigLove:628057762449850378> **We welcome these initates into the shell cult. **<:PigChamp:628055057690132481>\n\n"+at_str+"\n\n **Let the shells flow free**\n<a:ts_2:632758958284734506><a:ts_2:632758958284734506><a:ts_1:632758942992302090> <:bam:628731347724271647>")    
        message.reply()
        
    }
}
module.exports = points2;