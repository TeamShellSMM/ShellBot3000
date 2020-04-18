const { Command } = require('discord-akairo');
const Plays = require('../models/Plays');
const PendingVotes = require('../models/PendingVotes');

class RenameMember extends Command {
    constructor() {
        super('renamemember', {
            aliases: ['renamemember'],
            args: [{
                id: 'discord_id',
                type: 'string',
                default: ''
            },{
                id: 'new_name',
                type: 'string',
                default: ''
            }],
            split: 'quoted',
            ownerOnly: true,
            category: 'owner'
        });
    }

    async exec(message, args) {
        try{
            await ts.load()
            let new_name_check=ts.gs.select("Raw Members",{"Name":args.new_name});
            if(gs.select("Raw Members",{"Name":args.new_name})){
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
                let oldPlays=await Plays.query().patch({"player":args.new_name}).where("player",oldName)
                let pendingVotes=await PendingVotes.query().patch({"player":args.new_name}).where("player",oldName)
                await ts.load()
            }

            return message.reply('"'+oldName+'" has been renamed to "'+args.new_name+'"');
        } catch(error){
            message.reply(ts.getUserErrorMsg(error))
        }
    }
}

module.exports = RenameMember;