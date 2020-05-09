const TSCommand = require('../TSCommand.js');

class TSLevelStatus extends TSCommand {
    constructor() {
        super('tslevelstatus', {
           aliases: ['tslevelstatus','levelstatus'],
            args: [{
                    id: 'code',
                    type: 'uppercase',
                    default: null
                }],
           channelRestriction: 'guild'
        });
    }

    async tsexec(ts,message,{ code }) {
        const approval_votes_needed=ts.get_variable("ApprovalVotesNeeded")
        const reject_votes_needed=ts.get_variable("RejectVotesNeeded")

        if(!ts.valid_code(code))
            ts.userError("There were some invalid characters in your level code")

        code=code.toUpperCase()

        const level=await ts.getLevels().where({ code });

        if(!level)
            ts.userError("Level Code was not found!");

        if(level.status === ts.LEVEL_STATUS.APPROVED){
            await message.reply("This level has already been approved! " + ts.emotes.bam);
        } else if(
            level.status === ts.LEVEL_STATUS.REJECTED
            || level.status === ts.LEVEL_STATUS.REMOVED
        ){
            await message.reply("This level has already been removed/rejected!");
        } else if(level.status == ts.LEVEL_STATUS.PENDING){
            var approvalVotes = await ts.getPendingVotes().where('levels.id',level.id).where("type","approve");
            var fixVotes = await ts.getPendingVotes().where('levels.id',level.id).where("type","fix");
            var rejectVotes = await ts.db.getPendingVotes().where({code:level.id}).where("type","reject");

            //Count Approval and Rejection Votes
            var approvalVotesCount = approvalVotes.length + fixVotes.length;
            var rejectVotesCount = rejectVotes.length;

            var text = "";

            if( (approvalVotesCount > approval_votes_needed || rejectVotesCount > reject_votes_needed) && approvalVotesCount!=rejectVotesCount ){
                text = "This level is ready to be judged: ";
            } else {
                text = "This level is in judgement right now: ";
            }

            if(approvalVotesCount > 0 && rejectVotesCount > 0){
                text +=  approvalVotesCount + "/" + approval_votes_needed + " votes for approval, " + rejectVotesCount + "/" + reject_votes_needed + " votes for rejection!";
            } else if(approvalVotesCount > 0){
                text += approvalVotesCount + "/" + approval_votes_needed + " votes for approval!";
            } else if(rejectVotesCount > 0){
                text += rejectVotesCount + "/" + reject_votes_needed + " votes for rejection!";
            } else {
                text = "This level is not in judgement, no mods seem to have gotten to it yet!";
            }

            await message.reply(text);
        } else {
            await message.reply("This level has probably already been approved or something!");
        }
    }
}
module.exports = TSLevelStatus;