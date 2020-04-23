const config = require('../config.json');
const TSCommand = require('../TSCommand.js');
class mockUser extends TSCommand {
    constructor() {
        super('mockUser', {
          aliases: ['mockUser'],
          args: [{
            id: 'user',
            type: 'string',
            default: ''
          }],
        });
    }

    canRun(ts,message){
        if(ts.teamVariables.isTesting!=="yes"){
            return false
        }

        if(config.ownerID && config.ownerID.indexOf(message.author.id)!==-1){
            return true;
        }
        if(config.devs && config.devs.indexOf(message.author.id)!==-1){
            return true;
        }
        
        return false;
    }


    async tsexec(ts,message,args) {
        await ts.gs.loadSheets(["Raw Members"]);

        let player=ts.gs.selectOne("Raw Members",{ 
            "discord_id":message.author.id
        })

        let target=ts.gs.selectOne("Raw Members",{
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
    }
}
module.exports = mockUser;