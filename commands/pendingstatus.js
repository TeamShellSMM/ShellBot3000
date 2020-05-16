const TSCommand = require('../TSCommand.js');

class PendingStatus extends TSCommand {
    constructor() {
        super('pendingstatus', {
           aliases: ['pendingstatus','pending','tslevelstatus','levelstatus'],
           channelRestriction: 'guild'
        });
    }

    async tsexec(ts,message,args) {
        const player=await ts.get_user(message);

        const levels=await ts.getLevels()
            .where({creator:player.id})
            .whereIn('status',ts.PENDING_LEVELS);

        if(levels.length===0){
            ts.userError('pendingStatus.none')
        }

        let levelStr=levels.map((level)=>{
            let statusStr=[]
            if(level.approves){
                statusStr.push(ts.message('pendingStatus.approves',level));
            }
            if(level.rejects){
                statusStr.push(ts.message('pendingStatus.rejects',level));
            }
            if(level.want_fixes){
                statusStr.push(ts.message('pendingStatus.wantFixes',level));
            }
            statusStr=statusStr.length>0?statusStr.join(","):ts.message('pendingStatus.noVotes')

            return level.code+' - "'+level.level_name+'":\n •'+statusStr+'\n';
        })
        await message.channel.send(player.user_reply+"\nYour Pending Levels:```"+levelStr.join("\n")+"\n```");
    }
}
module.exports = PendingStatus;