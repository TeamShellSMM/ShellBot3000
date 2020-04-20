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

    async tsexec(ts,message,args) {
        await ts.gs.loadSheets(["Raw Levels"]);

        if(!ts.valid_format(args.code)) throw "Level code given was not in xxx-xxx-xxx format "+(ts.emotes.think ? ts.emotes.think : "")
        if(!ts.valid_code(args.code))   throw "There were some invalid characters in your level code "+(ts.emotes.think ? ts.emotes.think : "")

        args.code=args.code.toUpperCase()

        const level=ts.gs.select("Raw Levels",{"Code":args.code});

        if(!level){
            message.reply("Level Code was not found! " + (ts.emotes.think ? ts.emotes.think : ""));
            return false;
        }

        if(level.Approved === "1"){
            message.reply("This level has already been approved! " + (ts.emotes.bam ? ts.emotes.bam : ""));
        } else if(level.Approved.startsWith("del")){
            message.reply("This level has already been removed/rejected!");
        } else if(level.Approved == "0"){
            var approvalVotes = await ts.db.PendingVotes.query().where("code",args.code).where("is_shellder",1).where("type","approve");
            var fixVotes = await ts.db.PendingVotes.query().where("code",args.code).where("is_shellder",1).where("type","fix");
            var rejectVotes = await ts.db.PendingVotes.query().where("code",args.code).where("is_shellder",1).where("type","reject");

            //Count Approval and Rejection Votes
            var approvalVoteCount = approvalVotes.length + fixVotes.length;
            var rejectVoteCount = rejectVotes.length;

            var text = "";

            if( (approvalVoteCount > 3 || rejectVoteCount > 3) && approvalVoteCount!=rejectVoteCount ){
                text = "This level is ready to be judged: ";
            } else {
                text = "This level is in judgement right now: ";
            }

            if(approvalVoteCount > 0 && rejectVoteCount > 0){
                text +=  approvalVoteCount + "/3 votes for approval, " + rejectVoteCount + "/3 votes for rejection!";
            } else if(approvalVoteCount > 0){
                text += approvalVoteCount + "/3 votes for approval!";
            } else if(rejectVoteCount > 0){
                text += rejectVoteCount + "/3 votes for rejection!";
            } else {
                text = "This level is not in judgement, no Shellders seem to have gotten to it yet!";
            }

            message.reply(text);
        } else {
            message.reply("This level has probably already been approved or something!");
        }
    }
}
module.exports = TSLevelStatus;