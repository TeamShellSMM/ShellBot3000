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
      try{
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

      if(rejectVoteCount >= ts.get_variable("VotesNeeded")){
        //Reject level
        var updateLevel = gs.query("Raw Levels", {
          filter: {"Code":levelCode},
          update: {"Approved": -2}
        });
        if(updateLevel.Code == levelCode){
          await gs.batchUpdate(updateLevel.update_ranges);
        }

        //Build embed
        var mention = "**<@" + author.discord_id + ">, we got some news for you: **";

        var exampleEmbed = new Discord.RichEmbed()
          .setColor("#dc3545")
          .setAuthor("Level was " + (level.Approved === "0" ? "rejected" : "removed") + "!")
          .setTitle(level["Level Name"] + " (" + level.Code + ")")
          .setURL("https://teamshellsmm.github.io/levels/?code=" + level.Code)
          .setDescription("made by [" + author.Name + "](https://teamshellsmm.github.io/levels/?creator=" + encodeURIComponent(author.Name) + ")")
          .setThumbnail('https://teamshellsmm.github.io/assets/axemuncher.png');

        for(var i = 0; i < rejectVotes.length; i++){
          var embedHeader=rejectVotes[i].Shellder + " voted " + rejectVotes[i].Difficulty
            var reasonArr=rejectVotes[i].Reason.split(".")
            var reasonStr=[""];
            for(var k=0,l=0;k<reasonArr.length;k++){
              if(reasonArr[k]){
              if( (reasonStr[l].length+reasonArr[k].length+1) > 980 ){
                l++;
                reasonStr[l]=""
              }
                reasonStr[l]+=reasonArr[k]+"."
              }
            }
            for(var k=0;k<reasonStr.length;k++){
              exampleEmbed = exampleEmbed.addField(embedHeader,reasonStr[k]);
              embedHeader = "\u200b"
            }
        }
        
        exampleEmbed = exampleEmbed.setTimestamp();
        
        //Send Rejection to #shellder-level-changes
        await this.client.channels.get(ts.channels.shellderLevelChanges).send(mention);
        await this.client.channels.get(ts.channels.shellderLevelChanges).send(exampleEmbed);
        
        message.channel.delete("Justice has been met!");
      } else if (approvalVoteCount >= ts.get_variable("VotesNeeded")){
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
              await gs.batchUpdate(updateAuthor.update_ranges); //should combine the batch updates
              if(author.discord_id){
                console.log(author)
                var curr_user=await message.guild.members.get(author.discord_id)
                if(!curr_user){
                  console.error(author.Name+" was not found in the discord")
                } else {
                  await curr_user.addRole(ts.channels.shellcult_id)
                  await this.client.channels.get(ts.channels.initiateChannel).send("<a:ts_2:632758958284734506><a:ts_2:632758958284734506><a:ts_1:632758942992302090> <:SpigLove:628057762449850378> We welcome <@"+author.discord_id+"> into the shell cult <:PigChamp:628055057690132481> <a:ts_2:632758958284734506><a:ts_2:632758958284734506><a:ts_1:632758942992302090> <:bam:628731347724271647>")      
                }
              }
            }
          }

          //Build Status Message
          var mention = "**<@" + author.discord_id + ">, we got some news for you: **";

          var exampleEmbed = new Discord.RichEmbed()
            .setColor("#01A19F")
            .setAuthor("This level was approved for difficulty: " + finalDiff + "!")
            .setTitle(level["Level Name"] + " (" + level.Code + ")")
            .setURL("https://teamshellsmm.github.io/levels/?code=" + level.Code)
            .setDescription("made by [" + author.Name + "](https://teamshellsmm.github.io/levels/?creator=" + encodeURIComponent(author.Name) + ")")
            .setThumbnail('https://teamshellsmm.github.io/assets/bam.png');

          for(var i = 0; i < approvalVotes.length; i++){
            var embedHeader=approvalVotes[i].Shellder + " voted " + approvalVotes[i].Difficulty
            var reasonArr=approvalVotes[i].Reason.split(".")
            var reasonStr=[""];
            for(var k=0,l=0;k<reasonArr.length;k++){
              if(reasonArr[k]){
              if( (reasonStr[l].length+reasonArr[k].length+1) > 980 ){
                l++
                reasonStr[l]=""
              }
                reasonStr[l]+=reasonArr[k]+"."
              }
            }
            for(var k=0;k<reasonStr.length;k++){
              exampleEmbed = exampleEmbed.addField(embedHeader,reasonStr[k]);
              embedHeader = "\u200b"
            }
          }
          
          exampleEmbed = exampleEmbed.setTimestamp();
          
          //Send Rejection to #shellder-level-changes
          await this.client.channels.get(ts.channels.shellderLevelChanges).send(mention);
          await this.client.channels.get(ts.channels.shellderLevelChanges).send(exampleEmbed);
        }

        //Remove Discussion Channel
        message.channel.delete("Justice has been met!");
      } else {
        ts.userError("There must be at least "+ts.get_variable("VotesNeeded")+" Shellders in agreement before this level can be judged!");
      }
      } catch (error){
        message.reply(ts.getUserErrorMsg(error))
      }
    }
}
module.exports = TSJudge;