const { Command } = require('discord-akairo');

class mockUser extends Command {
    constructor() {
        super('mockUser', {
          aliases: ['mockUser'],
          args: [{
            id: 'user',
            type: 'string',
            default: ''
          }],
          ownerOnly: true,
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
      
      try {
        if(ts.channels.isTesting!=="yes"){
            return false
        }
        
        await ts.gs.loadSheets(["Raw Members"]);

        let player=ts.gs.select("Raw Members",{ 
            "discord_id":message.author.id
        })

        let target=ts.gs.select("Raw Members",{
            "Name":args.user
        })

        if(!target){
            ts.userError("No user found")
        }
        if(target.Name==player.Name)
            ts.userError("You're already them")

        var temp_id=player.discord_id_temp?player.discord_id_temp:"1"
        
        player=ts.gs.query("Raw Members",{
            "filter":{"discord_id":message.author.id},
            "update":{"discord_id":temp_id}
        });
        target=ts.gs.query("Raw Members",{
            "filter":{"Name":args.user},
            "update":{
                "discord_id":message.author.id,
                "discord_id_temp":target.discord_id
            }
        });
        let batch_updates=player.update_ranges.concat(target.update_ranges)
        await ts.gs.batchUpdate(batch_updates)
        await ts.gs.loadSheets(["Raw Members"])
        let p=await ts.get_user(message)
        message.channel.send("You're now "+p.Name+"("+p.rank.Rank+"). Identity theft is not a joke, Jim!")
      } catch (error) {
        message.reply(ts.getUserErrorMsg(error))
      }
    }
}
module.exports = mockUser;