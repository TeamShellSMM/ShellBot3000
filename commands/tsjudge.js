const { Command } = require('discord-akairo');
const channels = require('../channels.json');
const emotes = require('../emotes.json');
class TSJudge extends Command {
    constructor() {
        super('tsjudge', {
           aliases: ['tsjudge'],
            args: [],
           channelRestriction: 'guild'
        });
    }
    
    async exec(message,args) {     
      var inCodeDiscussionChannel = false;

      var levelCode;
      //Check if in level discussion channel
      if(ts.valid_code(message.channel.name.toUpperCase())){
        inCodeDiscussionChannel = true;
        levelCode = message.channel.name.toUpperCase();
      }

      if(!( 
        inCodeDiscussionChannel //should also work in the discussion channel for that level
      )) return false;

      //Reload sheets
      await gs.loadSheets(["Raw Levels", "Raw Members", "Shellder Votes"]);
      //Get all current votes for this level
      var level = gs.select("Raw Levels", {"Code":levelCode});

      const author = gs.select("Raw Members",{"Name":level.Creator});

      if(!author){
        message.reply("Author was not found in Members List! " + emotes.think);
        return false;
      }

      var approvalVotes = gs.select("Shellder Votes",{"Code":levelCode, "Type": "approve"});   
      var rejectVotes = gs.select("Shellder Votes",{"Code":levelCode, "Type": "reject"});

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

      if(rejectVoteCount >= 3){
        //Reject level
        var updateLevel = gs.query("Raw Levels", {
          filter: {"Code":levelCode},
          update: {"Approved": "del:" + level.Approved}
        });
        if(updateLevel.Code == levelCode){
          await gs.batchUpdate(updateLevel.update_ranges);
        }

        //Build Status Message
        var postMessage = "**"+ level["Level Name"] + " (" + level.Code + ") by <@" + author.discord_id + ">: Level was " + (level.Approved === "0" ? "rejected" : "removed") + "!** <:AxeMuncher:680243176640217088> \n> __Reasons:__\n";

        for(var i = 0; i < rejectVotes.length; i++){
          postMessage += "> `" + rejectVotes[i].Shellder + "`: `" + rejectVotes[i].Reason + "`\n";
        }

        postMessage += "\n<:Blank:669074779721957377>"
        
        //Send Rejection to #shellder-level-changes
        await this.client.channels.get(channels.shellderLevelChanges).send(postMessage);
        
        message.channel.delete("Justice has been met!");
      } else if (approvalVoteCount >= 3){
        if(level.Approved === "0"){
          //Get the average difficulty and round to nearest .5, build the message at the same time
          var reasonsMessage = "";
          var diffCounter = 0;
          var diffSum = 0;
          for(var i = 0; i < approvalVotes.length; i++){
            reasonsMessage += "> `" + approvalVotes[i].Shellder + " voted " + approvalVotes[i].Difficulty + "`: `" + approvalVotes[i].Reason + "`\n";
            var diff = parseFloat(approvalVotes[i].Difficulty);
            if(!Number.isNaN(diff)){
              diffCounter++;
              diffSum += diff;
            }
          }

          var finalDiff = Math.round((diffSum/diffCounter)*2)/2;

          //Only if the level is pending we approve it and send the message
          var updateLevel = gs.query("Raw Levels", {
            filter: {"Code":levelCode},
            update: {
              "Approved": "1",
              "Difficulty": finalDiff
            }
          });
          if(updateLevel.Code == levelCode){
            await gs.batchUpdate(updateLevel.update_ranges);
          }

          //Update author to set cult_member if they're not already
          if(author.cult_member !== "1"){
            var updateAuthor = gs.query("Raw Members", {
              filter: {"Name":author.Name},
              update: {
                "cult_member": "1"
              }
            });
            if(updateAuthor.Name == author.Name){
              await gs.batchUpdate(updateAuthor.update_ranges);
            }
          }

          //Build Status Message
          var postMessage = "**"+ level["Level Name"] + " (" + level.Code + ") by <@" + author.discord_id + ">: Level was approved for Difficulty: " + finalDiff + "!** <:bam:628731347724271647>\n" + reasonsMessage + "\n<:Blank:669074779721957377>";
  
          //Send Approval to #shellder-level-changes
          await this.client.channels.get(channels.shellderLevelChanges).send(postMessage);
        }

        //Remove Discussion Channel
        message.channel.delete("Justice has been met!");
      } else {
        message.reply("There must be at least 3 Shellders in agreement before this level can be judged! " + emotes.think);
      }
    }
}
module.exports = TSJudge;