const TSCommand = require('../TSCommand.js');
const config = require('../config.json')[process.env.NODE_ENV || 'development']
class RenameMember extends TSCommand {
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
        });
    }

    async canRun(ts,message){
        if(config.ownerID && config.ownerID.indexOf(message.author.id)!==-1){
            return true;
        }
        if(config.devs && config.devs.indexOf(message.author.id)!==-1){
            return true;
        }
        
        if(ts.is_mod({discord_id:message.author.id})){
            return true
        }

        return false;
    }

    async tsexec(ts,message,{ discord_id,new_name }) {

        await ts.gs.loadSheets(["Competition Winners"]);
        if(await ts.db.Members.query().whereRaw('lower(name) = ?',[new_name]).first()){
            ts.userError(`There is already another member with name "${new_name}"`)
        }

        let existing_member=await ts.db.Members.query().where({ discord_id }).first()
        if(!existing_member)
            ts.userError('No member found with that discord_id');
        let old_name=existing_member.name

        await ts.db.Members.query()
          .patch({name:new_name})
          .where({discord_id})


        let updates=[]
        let winners=ts.gs.query("Competition Winners", {
            filter: {"Creator":old_name},
            update: {"Creator":new_name}
        },true);
        if(winners){
            winners=winners.map((level)=>{
                return level.update_ranges[0]
            })
            updates=updates.concat(winners)
        }


        if(updates){
            await ts.gs.batchUpdate(updates);
            
            await ts.load()
        }

        return await message.reply('"'+old_name+'" has been renamed to "'+new_name+'"');
    }
}

module.exports = RenameMember;