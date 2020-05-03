const config = require('../config.json')[process.env.NODE_ENV || 'development']
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

    async canRun(ts,message){
        if(ts.teamVariables.isTesting!=="yes"){
            return false
        }

        if(config.ownerID && config.ownerID.indexOf(message.author.id)!==-1){
            return true;
        }
        if(config.devs && config.devs.indexOf(message.author.id)!==-1){
            return true;
        }

        if(message.author.id==ts.client.user.id){
          return true;
        }
        
        return false;
    }


    async tsexec(ts,message,args) {

        let player=await ts.get_user(message)
        let target=await ts.db.Members.query().where({ name:args.user }).first()

        if(!target) ts.userError('No user found');
        if(target.name==player.name) ts.userError('You\'re already them');
        
        await ts.db.Members
          .query()
          .patch({discord_id: player.discord_id_temp || '1' })
          .where({discord_id:message.author.id})

        await ts.db.Members
          .query()
          .patch({
              discord_id:message.author.id,
              discord_id_temp:target.discord_id,
            })
          .where({name:target.name})

        let p=await ts.get_user(message)
        await message.channel.send(ts.message('mock.userSuccess',{name:p.name}))
    }
}
module.exports = mockUser;