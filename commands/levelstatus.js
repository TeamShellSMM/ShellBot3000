const { Command } = require('discord-akairo');
class points extends Command {
    constructor() {
        super('tslevelstatus', {
           aliases: ['tslevelstatus'],
            args: [{
                    id: 'code',
                    type: 'string',
                    default: ''
                }],
           channelRestriction: 'guild'
        });
    }
    
    async exec(message,args) {     
        await gs.loadSheets(["Raw Levels","Shellder Votes"]);

        if(!ts.valid_format(args.code)) throw "Level code given was not in xxx-xxx-xxx format "+ts.emotes.think
        if(!ts.valid_code(args.code))   throw "There were some invalid characters in your level code "+ts.emotes.think

        const level=gs.select("Raw Levels",{"Code":args.code});

        if(!level){
            message.reply("Level Code was not found! " + ts.emotes.think);
            return false;
        }

        if(level.Approved === "1"){
            message.reply("This level has already been approved! " + ts.emotes.bam);
        } else if(level.Approved.startsWith("del")){
            message.reply("This level has already been removed/rejected!");
        } else if(level.Approved == "0"){
            var approvalVotes = gs.select("Shellder Votes",{"Code":level.Code, "Type": "approve"});   
            var rejectVotes = gs.select("Shellder Votes",{"Code":level.Code, "Type": "reject"});
    
            if(approvalVotes !== undefined && !Array.isArray(approvalVotes)){
                approvalVotes = [approvalVotes];
            } else if(!approvalVotes){
                approvalVotes = [];
            }
            if(rejectVotes !== undefined && !Array.isArray(rejectVotes)){
                rejectVotes = [rejectVotes];
            } else if(!rejectVotes) {
                rejectVotes = [];
            }
    
            //Count Approval and Rejection Votes
            var approvalVoteCount = approvalVotes.length;
            var rejectVoteCount = rejectVotes.length;

            var message = "";
            if(approvalVoteCount >= 3 && rejectVoteCount >= 3){
                message = "This level is ready to be judged, but the votes are split so this might get interesting!";
            } else if(approvalVoteCount >= 3){
                message = "This level is ready to be judged, good news are probably coming soon!";
            } else if(rejectVoteCount >= 3){
                message = "This level is ready to be judged, bad news are probably coming soon!";
            } else if(approvalVoteCount > 0 && rejectVoteCount > 0){
                message = "This level is in judgement right now: " + approvalVoteCount + "/3 votes for approval, " + rejectVoteCount + "/3 votes for rejection!";
            } else if(approvalVoteCount > 0){
                message = "This level is in judgement right now: " + approvalVoteCount + "/3 votes for approval!";
            } else if(rejectVoteCount > 0){
                message = "This level is in judgement right now: " + rejectVoteCount + "/3 votes for rejection!";
            } else {
                message = "This level is not in judgement, no Shellders seem to have gotten to it yet!";
            }

            message.reply(message);
        } else {            
            message.reply("This level has probably already been approved or something!");
        }        
    }
}
module.exports = points;