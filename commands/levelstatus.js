const TSCommand = require('../TSCommand.js');

class TSLevelStatus extends TSCommand {
    constructor() {
        super('tslevelstatus', {
           aliases: ['tslevelstatus','levelstatus'],
            args: [{
                    id: 'code',
                    type: 'string',
                    default: ''
                }],
           channelRestriction: 'guild'
        });
    }

    async tsexec(ts,message,{ code }) {
        const approval_votes_needed=ts.get_variable("ApprovalVotesNeeded")
        const reject_votes_needed=ts.get_variable("RejectVotesNeeded")

        if(!ts.valid_format(code))
            ts.userError("Level code given was not in xxx-xxx-xxx format")
        if(!ts.valid_code(code))
            ts.userError("There were some invalid characters in your level code")

        code=code.toUpperCase()

        const level=await ts.db.Levels.query().where({ code });

        if(!level)
            ts.userError("Level Code was not found!");

        if(level.status === ts.LEVEL_STATUS.APPROVED){
            message.reply("This level has already been approved! " + ts.emotes.bam);
        } else if(level.status.startsWith("del")){
            message.reply("This level has already been removed/rejected!");
        } else if(level.status == ts.LEVEL_STATUS.PENDING){
            var approvalVotes = await ts.db.PendingVotes.query().where("code",code).where("type","approve");
            var fixVotes = await ts.db.PendingVotes.query().where("code",code).where("type","fix");
            var rejectVotes = await ts.db.PendingVotes.query().where("code",code).where("type","reject");

            //Count Approval and Rejection Votes
            var approvalVoteCount = approvalVotes.length + fixVotes.length;
            var rejectVoteCount = rejectVotes.length;

            var text = "";

            if( (approvalVoteCount > approval_votes_needed || rejectVoteCount > reject_votes_needed) && approvalVoteCount!=rejectVoteCount ){
                text = "This level is ready to be judged: ";
            } else {
                text = "This level is in judgement right now: ";
            }

            if(approvalVoteCount > 0 && rejectVoteCount > 0){
                text +=  approvalVoteCount + "/" + approval_votes_needed + " votes for approval, " + rejectVoteCount + "/" + reject_votes_needed + " votes for rejection!";
            } else if(approvalVoteCount > 0){
                text += approvalVoteCount + "/" + approval_votes_needed + " votes for approval!";
            } else if(rejectVoteCount > 0){
                text += rejectVoteCount + "/" + reject_votes_needed + " votes for rejection!";
            } else {
                text = "This level is not in judgement, no mods seem to have gotten to it yet!";
            }

            message.reply(text);
        } else {
            message.reply("This level has probably already been approved or something!");
        }
    }
}
module.exports = TSLevelStatus;