const { Command } = require('discord-akairo');
const Plays = require('../models/Plays');
const PendingVotes = require('../models/PendingVotes');

class housekeep extends Command {
    constructor() {
        super('housekeep', {
            aliases: ['housekeep'],
            ownerOnly: true,
            category: 'owner'
        });
    }

    async exec(message, args) {
        try {
            var ts=get_ts(message.guild.id)
          } catch(error){
            message.reply(error)
            throw error;
          }
        try{
            await ts.load()
            let guild=ts.getGuild();
            let housekept=0;
            await guild.channels.forEach(async (channel)=>{
                if(channel.parentID==ts.channels.levelDiscussionCategory){
                    const levelCode=channel.name.toUpperCase()
                    let deleteLevel=false,reason="";
                    let currentLevel=ts.gs.select("Raw Levels",{Code:levelCode})
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
            message.reply("Housekeeping done "+ts.emotes.robo)

        } catch(error){
            message.reply(ts.getUserErrorMsg(error))
        }
    }
}

module.exports = housekeep;