const { Command } = require('discord-akairo');
const PendingVotes = require('../models/PendingVotes');

class PendingStatus extends Command {
    constructor() {
        super('pendingstatus', {
           aliases: ['pendingstatus','pending'],
           channelRestriction: 'guild'
        });
    }
    
    async exec(message,args) {     
        try{
            await gs.loadSheets(["Raw Levels","Raw Members"]);
            const player=await ts.get_user(message);

            const levels=gs.select("Raw Levels",{"Creator":player.Name,"Approved":"0"},true);

            if(!levels){
                message.reply(player.user_reply+"\nYou have no levels pending");
                return false;
            }

            let levelStrPromises=levels.map(async (level)=>{
                let approvalVotes = await PendingVotes.query().where("code",level.Code).where("is_shellder",1).where("type","approve");
                let rejectVotes = await PendingVotes.query().where("code",level.Code).where("is_shellder",1).where("type","reject");
                let statusStr=[]
                if(approvalVotes && approvalVotes.length>0){
                    statusStr.push(approvalVotes.length+" approval"+ts.plural(approvalVotes.length));
                }
                if(rejectVotes && rejectVotes.length>0){
                    statusStr.push(rejectVotes.length+" rejection"+ts.plural(rejectVotes.length));
                }
                statusStr=statusStr.length>0?statusStr.join(","):"No votes has been cast yet"
                
                return level.Code+' - "'+level["Level Name"]+'":\n -'+statusStr+'\n';
            })
            let levelStr=await Promise.all(levelStrPromises)
            console.log(levelStr)
            message.channel.send(player.user_reply+"\nYour Pending Levels:```"+levelStr.join("\n")+"\n```");
        } catch (error){
            message.reply(ts.getUserErrorMsg(error));
        }
    }
}
module.exports = PendingStatus;