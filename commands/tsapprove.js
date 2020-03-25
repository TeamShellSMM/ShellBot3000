const { Command } = require('discord-akairo');
const Plays = require('../models/Plays');
const PendingVotes = require('../models/PendingVotes');


class TSApprove extends Command {
    constructor() {
        super('tsapprove', {
           aliases: ['tsapprove', 'tsreject', 'tsapprove+c', 'tsapprove+cl', 'tsapprove+lc'],
           split: 'quoted',
            args: [{
                id: 'code',
                type: 'string',
                default: ''
              },
              {
                id: 'difficulty',
                type: 'string',
                default: ''
              },
              {
                id: 'reason',
                type: 'string',
                default: ''
              }
            ],
           channelRestriction: 'guild'
        });
    }

    async exec(message,args) {
      try{
      /*
        Possible command syntax:
        !tsapprove code difficulty reason
        !tsreject code reason

        in channel
        !tsapprove difficulty reason
        !tsreject reason
      */



      const clearCommands = ['tsapprove+c', 'tsapprove+cl', 'tsapprove+lc'];
      const likeCommands =  ['tsapprove+cl', 'tsapprove+lc'];

      var command=ts.parse_command(message);
      var inCodeDiscussionChannel = false;

      //Check if in level discussion channel
      if(ts.valid_code(message.channel.name.toUpperCase())){
        inCodeDiscussionChannel = true;
        args.reason = args.difficulty;
        args.difficulty = args.code;
        args.code = message.channel.name.toUpperCase();
      } else {
        //Check the code only if not in discussion channel
        if(!ts.valid_code(args.code.toUpperCase())){
          ts.userError("Level Code is invalid! ")
        }
      }

      if(!(
        message.channel.id === ts.channels.shellderShellbot  //only in shellder-bot channel
        || inCodeDiscussionChannel //should also work in the discussion channel for that level
      )) return false;

      if(command.command == "tsreject"){
        //Difficulty doesn't exist in reject, so it get replaced by reason
        args.reason = args.difficulty;
        args.difficulty = "";
      }

      if(args.code){
        args.code = args.code.toUpperCase();
      }

      //Then Check the other args
      if(command.command == "tsapprove" || clearCommands.indexOf(command.command) !== -1){
        //We only check difficulty in tsapprove mode
        if(!ts.valid_difficulty(args.difficulty)){
          ts.userError("Invalid difficulty format!");
        }
      }

      //Check if vote already exists
      await gs.loadSheets(["Raw Levels", "Raw Members"]);

      const shellder=await ts.get_user(message);

      var vote=await PendingVotes.query().where("code",args.code).where("player",shellder.Name).first();

      if(!vote){
        //We only check reason if we have no vote yet
        if(!args.reason){
          ts.userError("You need to give a reason for the change (in quotation marks)!");
        }
      }

      const level=ts.getExistingLevel(args.code);
      const author = gs.select("Raw Members",{"Name":level.Creator});

      if(!author){
        ts.userError("Author was not found in Members List!");
      }

      //Check if level is approved, if it's approved only allow rejection
      if(level.Approved === "1"){
        if(command.command == "tsapprove" || clearCommands.indexOf(command.command) !== -1){
          ts.userError("Level is already approved!");
        }
      } else if(level.Approved === "0"){
        //I don't care that this is empty, I can't be arsed anymore to think how to structure this if
      } else {
        ts.userError("Level is not pending!");
      }


      var overviewMessage;
      var discussionChannel;
      if(!inCodeDiscussionChannel){
        //Check if channel already exists
        discussionChannel = message.guild.channels.find(channel => channel.name === level.Code.toLowerCase());;
        if(!discussionChannel){
          //Create new channel and set parent to category
          discussionChannel = await message.guild.createChannel(args.code, {
            type: 'text',
            parent: this.client.channels.get(ts.channels.levelDiscussionCategory )
          });
          //Post empty overview post
          overviewMessage = await discussionChannel.send("**The Judgement for '" + level["Level Name"] + " (" + level.Code + ") by <@" + author.discord_id + ">' has now begun!**\n\n> Current Votes for approving the level:\n> None\n\n> Current votes for rejecting the level:\n> None");
          overviewMessage = await overviewMessage.pin();
        }
      } else {
        discussionChannel = message.channel;
      }

      //Add/Update Approval/Rejection to new sheet 'shellder votes?' + difficulty + reason
      var updating = false;
      if(!vote){
        await PendingVotes.query().insert({
          code: level.Code,
          is_shellder: 1, //to be changed to member value?
          player: shellder.Name,
          type: command.command == "tsreject" ? "reject" : "approve",
          difficulty_vote: command.command == "tsapprove" || clearCommands.indexOf(command.command) !== -1 ? args.difficulty : "",
          reason: args.reason
        });
      } else {
        updating = true;
        var updateJson = {
          "type": command.command == "tsreject" ? "reject" : "approve"
        }
        if(args.reason){
          updateJson.reason = args.reason;
        }
        if(args.difficulty){
          updateJson.difficulty_vote = args.difficulty;
        }
        var updateVote = await PendingVotes.query().findById(vote.id).patch(updateJson);
      }

      //Reload sheets
      await gs.loadSheets(["Raw Levels", "Raw Members"]);
      //Get all current votes for this level
      var approveVotes = await PendingVotes.query().where("code",args.code).where("is_shellder",1).where("type","approve");
      var rejectVotes = await PendingVotes.query().where("code",args.code).where("is_shellder",1).where("type","reject");

      //Update Overview post in discussion channel

      var voteEmbed=ts.levelEmbed(level)
        .setAuthor("The Judgement  has now begun for this level:")
        .setThumbnail(ts.getEmoteUrl(ts.emotes.judgement));

      var postString = "__Current Votes for approving the level:__\n";
      if(approveVotes == undefined || approveVotes.length == 0){
        postString += "> None\n";
      } else {
        for(var i = 0; i < approveVotes.length; i++){
          const curShellder = gs.select("Raw Members",{"Name":approveVotes[i].player});
          postString += "<@" + curShellder.discord_id + "> - Difficulty: " + approveVotes[i].difficulty_vote + ", Reason: " + approveVotes[i].reason + "\n";
        }
      }

      postString += "\n__Current votes for rejecting the level:__\n";

      if(rejectVotes == undefined || rejectVotes.length == 0){
        postString += "None\n";
      } else {
        for(var i = 0; i < rejectVotes.length; i++){
          const curShellder = gs.select("Raw Members",{"Name":rejectVotes[i].player});
          postString += "<@" + curShellder.discord_id + "> - Reason: " + rejectVotes[i].reason + "\n";
        }
      }

      ts.embedAddLongField(voteEmbed,"",postString)

      if(!overviewMessage){
        overviewMessage = (await discussionChannel.fetchPinnedMessages()).last();
      }

      await overviewMessage.edit(voteEmbed);

      var replyMessage = "";
      if(updating){
        replyMessage += "Your vote was changed in <#" + discussionChannel.id + ">!";
      } else {
        replyMessage += "Your vote was added to <#" + discussionChannel.id + ">!";
      }

      if(clearCommands.indexOf(command.command) !== -1){
        //Add a clear to the level if it's not already there
        var played = await Plays.query()
          .where('code', '=', args.code)
          .where('player', '=', shellder.Name)
          .first();

        if(played){
          //Update

            await Plays.query()
              .findById(played.id)
              .patch({
              liked: likeCommands.indexOf(command.command) !== -1 ? 1 : 0,
              difficulty_vote: args.difficulty
            });

          replyMessage += " You also updated your clear and community vote on this level!";

          if(likeCommands.indexOf(command.command) !== -1){
            replyMessage += " You also liked the level " + ts.emotes.love + "!";
          }
        } else {
          //Insert
          await Plays.query().insert({
            "code": level.Code,
            "player": shellder.Name,
            "completed": "1",
            "is_shellder": "1",
            "liked": likeCommands.indexOf(command.command) !== -1 ? 1 : 0,
            "difficulty_vote": args.difficulty
          });

          replyMessage += " You also added a clear and community vote on this level!";

          if(likeCommands.indexOf(command.command) !== -1){
            replyMessage += " You also liked the level " + ts.emotes.love + "!";
          }
        }
      }
        message.reply(replyMessage);

      } catch(error){
        message.reply(ts.getUserErrorMsg(error))
      }
    }
}
module.exports = TSApprove;