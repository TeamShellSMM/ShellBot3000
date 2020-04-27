const TSCommand = require('../TSCommand.js');

class PendingStatus extends TSCommand {
    constructor() {
        super('pendingstatus', {
           aliases: ['pendingstatus','pending'],
           channelRestriction: 'guild'
        });
    }

    async tsexec(ts,message,args) {
        const player=await ts.get_user(message);

        const levels=await ts.db.Levels.query()
            .where({
                creator:player.name,
                status:ts.LEVEL_STATUS.PENDING,
            });

        if(levels.length===0){
            message.reply(player.user_reply+"\nYou have no levels pending");
            return false;
        }

        let levelStrPromises=levels.map(async (level)=>{
            let approvalVotes = await ts.db.PendingVotes.query().where("code",level.code).where("type","approve");
            let rejectVotes = await ts.db.PendingVotes.query().where("code",level.code).where("type","reject");
            let statusStr=[]
            if(approvalVotes && approvalVotes.length>0){
                statusStr.push(approvalVotes.length+" approval(s)");
            }
            if(rejectVotes && rejectVotes.length>0){
                statusStr.push(rejectVotes.length+" rejection(s)");
            }
            statusStr=statusStr.length>0?statusStr.join(","):"No votes has been cast yet"

            return level.code+' - "'+level.level_name+'":\n -'+statusStr+'\n';
        })
        let levelStr=await Promise.all(levelStrPromises)
        message.channel.send(player.user_reply+"\nYour Pending Levels:```"+levelStr.join("\n")+"\n```");
    }
}
module.exports = PendingStatus;