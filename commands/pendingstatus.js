const TSCommand = require('../TSCommand.js');

class PendingStatus extends TSCommand {
    constructor() {
        super('pendingstatus', {
           aliases: ['pendingstatus','pending'],
           channelRestriction: 'guild'
        });
    }

    async tsexec(ts,message,args) {
        await ts.gs.loadSheets(["Raw Levels","Raw Members"]);
        const player=await ts.get_user(message);

        const levels=ts.gs.select("Raw Levels",{"Creator":player.Name,"Approved":"0"});

        if(!levels){
            message.reply(player.user_reply+"\nYou have no levels pending");
            return false;
        }

        let levelStrPromises=levels.map(async (level)=>{
            let approvalVotes = await ts.db.PendingVotes.query().where("code",level.Code).where("is_shellder",1).where("type","approve");
            let rejectVotes = await ts.db.PendingVotes.query().where("code",level.Code).where("is_shellder",1).where("type","reject");
            let statusStr=[]
            if(approvalVotes && approvalVotes.length>0){
                statusStr.push(approvalVotes.length+" approval(s)");
            }
            if(rejectVotes && rejectVotes.length>0){
                statusStr.push(rejectVotes.length+" rejection(s)");
            }
            statusStr=statusStr.length>0?statusStr.join(","):"No votes has been cast yet"

            return level.Code+' - "'+level["Level Name"]+'":\n -'+statusStr+'\n';
        })
        let levelStr=await Promise.all(levelStrPromises)
        message.channel.send(player.user_reply+"\nYour Pending Levels:```"+levelStr.join("\n")+"\n```");
    }
}
module.exports = PendingStatus;