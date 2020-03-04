const { Command } = require('discord-akairo');
const Discord = require('discord.js');
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
        message.reply("Author was not found in Members List! " + ts.emotes.think);
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
        /*var postMessage = "**"+ level["Level Name"] + " (" + level.Code + ") by <@" + author.discord_id + ">: Level was " + (level.Approved === "0" ? "rejected" : "removed") + "!!** <:AxeMuncher:680243176640217088> \n> __Reasons:__\n";

        for(var i = 0; i < rejectVotes.length; i++){
          postMessage += "> `" + rejectVotes[i].Shellder + "`: `" + rejectVotes[i].Reason + "`\n";
        }

        postMessage += "\n<:Blank:669074779721957377>"*/

        //Build embed
        var mention = "**<@" + author.discord_id + ">, new level update: **";

        var exampleEmbed = new Discord.RichEmbed()
          .setColor("#dc3545")
          .setAuthor("Level was " + (level.Approved === "0" ? "rejected" : "removed") + "!")
          .setTitle(level["Level Name"] + " (" + level.Code + ")")
          .setURL("https://teamshell.net/levels/?code=" + level.Code)
          .setDescription("made by [" + author.Name + "](https://teamshell.net/levels/?creator=" + urlencode(author.Name) + ")")
          .setThumbnail('https://teamshellsmm.github.io/assets/axemuncher.png');

        for(var i = 0; i < rejectVotes.length; i++){
          exampleEmbed = exampleEmbed.addField(rejectVotes[i].Shellder + " voted for rejection", rejectVotes[i].Reason);
        }
        
        exampleEmbed = exampleEmbed.setTimestamp();
        
        //Send Rejection to #shellder-level-changes
        await this.client.channels.get(ts.channels.shellderLevelChanges).send(mention);
        await this.client.channels.get(ts.channels.shellderLevelChanges).send(exampleEmbed);
        
        message.channel.delete("Justice has been met!");
      } else if (approvalVoteCount >= 3){
        if(level.Approved === "0"){
          //Get the average difficulty and round to nearest .5, build the message at the same time
          var diffCounter = 0;
          var diffSum = 0;
          for(var i = 0; i < approvalVotes.length; i++){
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
          var mention = "<@" + author.discord_id + ">";

          var exampleEmbed = new Discord.RichEmbed()
            .setColor("#01A19F")
            .setAuthor("This level was approved for difficulty: " + finalDiff + "!")
            .setTitle(level["Level Name"] + " (" + level.Code + ")")
            .setURL("https://teamshell.net/levels/?code=" + level.Code)
            .setDescription("made by [" + author.Name + "](https://teamshell.net/levels/?creator=" + urlencode(author.Name) + ")")
            .setThumbnail('https://teamshellsmm.github.io/assets/bam.png');

          for(var i = 0; i < approvalVotes.length; i++){
            exampleEmbed = exampleEmbed.addField(approvalVotes[i].Shellder + " voted " + approvalVotes[i].Difficulty, approvalVotes[i].Reason);
          }
          
          exampleEmbed = exampleEmbed.setTimestamp();
          
          //Send Rejection to #shellder-level-changes
          await this.client.channels.get(ts.channels.shellderLevelChanges).send(mention);
          await this.client.channels.get(ts.channels.shellderLevelChanges).send(exampleEmbed);
        }

        //Remove Discussion Channel
        message.channel.delete("Justice has been met!");
      } else {
        message.reply("There must be at least 3 Shellders in agreement before this level can be judged! " + ts.emotes.think);
      }
    }
}
module.exports = TSJudge;