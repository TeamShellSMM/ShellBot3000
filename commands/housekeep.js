const TSCommand = require('../TSCommand.js');
class housekeep extends TSCommand {
    constructor() {
        super('housekeep', {
            aliases: ['housekeep'],
            ownerOnly: true,
            category: 'owner'
        });
    }

    async tsexec(ts,message, args) {
        await ts.load()
        let guild=ts.getGuild();
        let housekept=0;
        await guild.channels.forEach(async (channel)=>{
            if(channel.parentID==ts.channels.levelDiscussionCategory){
                const levelCode=channel.name.toUpperCase()
                let deleteLevel=false,reason="";
                let currentLevel=ts.gs.selectOne("Raw Levels",{Code:levelCode})
                if(currentLevel){
                    if(currentLevel.Approved!=="0"){
                        deleteLevel=true
                        reason="Level not pending anymore"
                    }
                } else {
                    deleteLevel=true
                    reason="No level found in list"
                }
                if(deleteLevel){
                    await ts.deleteDiscussionChannel(levelCode,reason)
                    housekept++
                }
            }
        });
        message.reply("Housekeeping done "+(ts.emotes.robo ? ts.emotes.robo : ""))
    }
}

module.exports = housekeep;