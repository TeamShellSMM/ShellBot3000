const TSCommand = require('../TSCommand.js');
const config = require('../config.json');
class AmmendCode extends TSCommand {
    constructor() {
        super('ammendcode', {
            aliases: ['ammendcode'],
            args: [{
                id: 'oldCode',
                type: 'string',
                default: ''
            },{
                id: 'newCode',
                type: 'string',
                default: ''
            }],
        });
    }

    canRun(ts,message){
        if(config.ownerID && config.ownerID.indexOf(message.author.id)!==-1){
            return true;
        }
        if(config.devs && config.devs.indexOf(message.author.id)!==-1){
            return true;
        }
        let player=ts.gs.select("Raw Members",{"discord_id":message.author.id,"shelder":"1"},true)
        if(player.length>0){
            return true
        }
        
        return false;
    }

    async tsexec(ts,message, args) {
        if(!this.canRun(ts,message)){
            return false;
        }

        await ts.load()
        let new_name_check=ts.gs.select("Raw Members",{"Name":args.new_name});
        if(ts.gs.select("Raw Members",{"Name":args.new_name})){
            ts.userError("There is already another member with name \""+args.new_name+"\"")
        }

        let member_update=ts.gs.query("Raw Members", {
            filter: {"discord_id":args.discord_id},
            update: {"Name":args.new_name}
        });
        if(!member_update)
            ts.userError("No member found with that discord_id");

        let updates=member_update.update_ranges;

        let oldName=member_update.Name

        let level_update=ts.gs.query("Raw Levels", {
            filter: {"Creator":oldName},
            update: {"Creator":args.new_name}
        },true);
        if(level_update){
            level_update=level_update.map((level)=>{
                return level.update_ranges[0]
            })
            updates=updates.concat(level_update)
        }

        let winners=ts.gs.query("Competition Winners", {
            filter: {"Creator":oldName},
            update: {"Creator":args.new_name}
        },true);
        if(winners){
            winners=winners.map((level)=>{
                return level.update_ranges[0]
            })
            updates=updates.concat(winners)
        }


        if(updates){
            await ts.gs.batchUpdate(updates);
            let oldPlays=await ts.db.Plays.query().patch({"player":args.new_name}).where("player",oldName)
            let pendingVotes=await ts.db.PendingVotes.query().patch({"player":args.new_name}).where("player",oldName)
            await ts.load()
        }

        return message.reply('"'+oldName+'" has been renamed to "'+args.new_name+'"');
    }
}

module.exports = AmmendCode;