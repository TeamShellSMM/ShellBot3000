const { Command } = require('discord-akairo');
const config = require('../config.json');
class login extends Command {
    constructor() {
        super('login', {
           aliases: ['login','tslogin'],
           cooldown: 5000,
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
          let command=ts.parse_command(message);
          await ts.gs.loadSheets(["Raw Members","Raw Levels"]);
          const player=await ts.get_user(message);
          let otp=await ts.generateOtp(message.author.id)
          message.author.send(player.user_reply+" You have requested a login token for the website. click the link below to login.:\n <"+config.page_url + ts.config.url_slug + "/login/"+otp+"> "+(ts.emotes.bam ? ts.emotes.bam : "")+"\n If you're on mobile, copy the link and paste it into your preferred browser app. If you open this link in an in-app browser, your login might not be saved properly. "+ts.emotes.buzzyS+"\nThis token will only be valid for 30 minutes")
        } catch(error){
            message.reply(ts.getUserErrorMsg(error))
        }
    }
}
module.exports = login;