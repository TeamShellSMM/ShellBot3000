const { Command } = require('discord-akairo');
class TSInitiate extends Command {
    constructor() {
        super('tsinitiate', {
           aliases: ['tsinitiate'],
            args: [{
                    id: 'preview',
                    type: 'string',
                    default: ''
                }],
           channelRestriction: 'guild'
        });
    }
    
    async exec(message,args) {     
         if(!( 
            message.channel.id === ts.channels.shellderShellbot  //only in bot-test channel
            //&& message.member.roles.exists(role => role.name === 'Shellder')  //only shellder
        )) return false;

      await gs.loadSheets(["Raw Members"]); //when everything goes through shellbot 3000 we can do cache invalidation stuff
      const shellcults=gs.select("Raw Members",{"cult_member":"1"}).map(m=>m.discord_id)
      const current_shellcult=message.guild.roles.get(ts.channels.shellcult_id).members.map(m=>m.user.id)
      let loaded_guild=await message.guild.fetchMembers()
      let missing_shellcults=shellcults.filter(v=> -1 === current_shellcult.indexOf(v))
      missing_shellcults=missing_shellcults.filter(v=> loaded_guild.members.has(v))
      let at_str=""
      for(let i=0;i<missing_shellcults.length;i++){
        at_str+="<@"+missing_shellcults[i]+">\n"
      }
      

      if(missing_shellcults.length>0){
        let at_str=""
        for(let i=0;i<missing_shellcults.length;i++){
          if(args.preview!="preview"){
            let curr_usr=message.guild.members.get(missing_shellcults[i])
            curr_usr.addRole(ts.channels.shellcult_id)
          }
          at_str+="<@"+missing_shellcults[i]+">\n"
        }

        if(args.preview=="preview"){
            return message.reply("Currently have not recieved shellcult role in discord: "+at_str);
        } else {
            this.client.channels.get(ts.channels.initiateChannel).send("<a:ts_2:632758958284734506><a:ts_2:632758958284734506><a:ts_1:632758942992302090>\n<:SpigLove:628057762449850378> **We welcome these initates into the shell cult. **<:PigChamp:628055057690132481>\n\n"+at_str+"\n\n **Let the shells flow free**\n<a:ts_2:632758958284734506><a:ts_2:632758958284734506><a:ts_1:632758942992302090> <:bam:628731347724271647>")    
        }
      } else {
        message.reply("There is no one that needs initiating")
      }

        
    }
}
module.exports = TSInitiate;