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

        const levels=await ts.getLevels()
            .where({
                creator:player.id,
                status:ts.LEVEL_STATUS.PENDING,
            });

        if(levels.length===0){
            await message.reply(player.user_reply+"\nYou have no levels pending");
            return false;
        }

        let levelStrPromises=levels.map(async (level)=>{
            let approvalVotes = await ts.getPendingVotes().where('levels.id',level.id).where("type","approve");
            let rejectVotes = await ts.getPendingVotes().where('levels.id',level.id).where("type","reject");
            let fixVotes = await ts.getPendingVotes().where('levels.id',level.id).where("type","fix");
            let statusStr=[]
            if(approvalVotes && approvalVotes.length>0){
                statusStr.push(approvalVotes.length+" approval(s)");
            }
            if(rejectVotes && rejectVotes.length>0){
                statusStr.push(rejectVotes.length+" rejection(s)");
            }
            if(fixVotes && fixVotes.length>0){
                statusStr.push(fixVotes.length+" rejection(s)");
            }
            statusStr=statusStr.length>0?statusStr.join(","):"No votes has been cast yet"

            return level.code+' - "'+level.level_name+'":\n -'+statusStr+'\n';
        })
        let levelStr=await Promise.all(levelStrPromises)
        await message.channel.send(player.user_reply+"\nYour Pending Levels:```"+levelStr.join("\n")+"\n```");
    }
}
module.exports = PendingStatus;