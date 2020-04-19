const { Command } = require('discord-akairo');
class TSRegister extends Command {
    constructor() {
        super('tsregister', {
           aliases: ['tsregister','register'],
            args: [{
                    id: 'nickname',
                    type: 'string',
                    default: ''
                }],
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

        try{
          await ts.gs.loadSheets(["Raw Members"]);
          const player=ts.gs.select("Raw Members",{"discord_id":message.author.id});
          if(player && player.banned){
            ts.userError("You're barred from using this service")
          }
          if(player){
            ts.userError("You're already registered as **"+player.Name+"**")
          }

          if(!args.nickname)
            args.nickname=message.author.username
          args.nickname=args.nickname.replace(/\\/g,'');
          ts.gs.select("Raw Members",{},true).forEach((member)=>{
              if(member && args.nickname.toLowerCase()==member.Name.toLowerCase()){
                ts.userError("\""+member.Name+"\" has already been registered by someone else. Please use another nickname")
              }
            })

          var row={
            "Name":args.nickname,
            "discord_id":message.author.id,
            "discord_name":message.author.username,
          }

            await ts.gs.insert("Raw Members",row);
            message.reply("You are now registered as \""+args.nickname+"\". You can now start submitting your clears in #level-clears "+(ts.emotes.bam ? ts.emotes.bam : ""))
        } catch(error){
            message.reply(ts.getUserErrorMsg(error))
        }
    }
}
module.exports = TSRegister;