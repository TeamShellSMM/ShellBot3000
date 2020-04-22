const TSCommand = require('../TSCommand.js');
const config = require('../config.json');
class AmmendCode extends TSCommand {
    constructor() {
        super('ammendcode', {
            aliases: ['ammendcode'],
            args: [{
                id: 'oldCode',
                type: 'string',
                default: ''
            },{
                id: 'newCode',
                type: 'string',
                default: ''
            }],
        });
    }

    canRun(ts,message){
        if(config.ownerID && config.ownerID.indexOf(message.author.id)!==-1){
            return true;
        }
        if(config.devs && config.devs.indexOf(message.author.id)!==-1){
            return true;
        }
        let player=ts.gs.select("Raw Members",{"discord_id":message.author.id,"shelder":"1"},true)
        if(player.length>0){
            return true
        }
        
        return false;
    }

    async tsexec(ts,message, { oldCode, newCode }) {
        if(!this.canRun(ts,message)){
            return false;
        }
        oldCode=oldCode.toUpperCase()
        newCode=newCode.toUpperCase()

        if(!ts.valid_code(oldCode)){
            ts.userError(ts.message("reupload.invalidOldCode"))
        }
        if(!ts.valid_code(newCode)){
            ts.userError(ts.message("reupload.invalidNewCode"))
        }
        if(oldCode==newCode){
            ts.userError(ts.message('reupload.sameCode'))
        }

        await ts.gs.loadSheets(["Raw Members","Raw Levels","Competition Winners"]);

        const existing_level=ts.getExistingLevel(oldCode,true)
        const new_code_check=ts.gs.selectOne("Raw Levels",{"Code":newCode});
        if(new_code_check){
            ts.userError(ts.message('add.levelExisting',{ level: new_code_check}))
        }
        
        let updates=[]
        let level_update=ts.gs.query("Raw Levels", {
            filter: {Code:oldCode},
            update: {Code:newCode}
        },true);

        if(level_update){
            level_update=level_update.map((level)=>{
                return level.update_ranges[0]
            })
            updates=updates.concat(level_update)
        }

        let winners=ts.gs.query("Competition Winners", {
            filter: {Code:oldCode},
            update: {Code:newCode}
        },true);
        if(winners){
            winners=winners.map((level)=>{
                return level.update_ranges[0]
            })
            updates=updates.concat(winners)
        }

        if(updates){
            await ts.gs.batchUpdate(updates);
            await ts.db.Plays.query().patch({"code":newCode}).where("code",oldCode)
            await ts.db.PendingVotes.query().patch({"code":newCode}).where("code",oldCode)
            await ts.load()
        }

        let guild=ts.getGuild();
        let existingChannel=guild.channels.find(channel => channel.name === oldCode.toLowerCase() && channel.parent.id == ts.channels.levelDiscussionCategory)
        if(existingChannel){
            await existingChannel.setName(newCode.toLowerCase())
        }
        
        return message.reply(ts.message('ammendCode.success',{ level:existing_level, oldCode,newCode}));
    }
}

module.exports = AmmendCode;