const TSCommand = require('../TSCommand.js');
const config = require('../config.json')[process.env.NODE_ENV || 'development']
class RenameMember extends TSCommand {
    constructor() {
        super('renamemember', {
            aliases: ['renamemember'],
            args: [{
                id: 'discord_id',
                type: 'string',
                default: null
            },{
                id: 'new_name',
                type: 'string',
                default: null
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
        
        const member=await ts.db.Member.query().where({discord_id:message.author.id}).first()
        if(member && member.is_mod){
            return true
        }

        return false;
    }

    async tsexec(ts,message,{ discord_id,new_name }) {

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

        return await message.reply('"'+old_name+'" has been renamed to "'+new_name+'"');
    }
}

module.exports = RenameMember;