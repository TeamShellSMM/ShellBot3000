const TSCommand = require('../TSCommand.js');

class InitRoles extends TSCommand {
    constructor() {
        super('initroles', {
            aliases: ['initroles'],
        });
    }

    async canRun(ts,message){
        if(message.member.hasPermission("ADMINISTRATOR")){
            return true
        }
        return false
    }

    async tsexec(ts,message, args) {        

 /*
        
        const defaultChannels={
          'modChannel':{
              permissionOverwrites:[
                  {
                  id:message.guild.id,
                  allow:[],
                  deny:['VIEW_CHANNEL','SEND_MESSAGES'],
              },
            ],
          },
          'initiateChannel':{
              permissionOverwrites:[
                  {
                    id:message.guild.id,
                    allow:['VIEW_CHANNEL'],
                    deny:['SEND_MESSAGES'],
                },
            ],
          },
          'levelChangeNotification':{
              permissionOverwrites:[
                  {
                id:message.guild.id,
                allow:['VIEW_CHANNEL'],
                deny:['SEND_MESSAGES'],
            }],
              
          },
        'commandFeed':{
              permissionOverwrites:[{
                id:message.guild.id,
                allow:['VIEW_CHANNEL'],
                deny:['SEND_MESSAGES'],
            }],
          },
        'levelDiscussionCategory':{
            type:'category',
            permissionOverwrites:[{
              id:message.guild.id,
              allow:[],
              deny:['VIEW_CHANNEL','SEND_MESSAGES'],
          }],
        },
          'pendingReuploadCategory':{
              type:'category',
              permissionOverwrites:[{
                id:message.guild.id,
                allow:[],
                deny:['VIEW_CHANNEL','SEND_MESSAGES'],
            }],
          },
          'feedbackChannel':{
              permissionOverwrites:[{
                id:message.guild.id,
                allow:[],
                deny:['VIEW_CHANNEL','SEND_MESSAGES'],
            }],
          },
        }

        let botPermissions={
            id:ts.client.user.id,
            allow:['VIEW_CHANNEL','SEND_MESSAGES','MANAGE_MESSAGES','MANAGE_CHANNELS','READ_MESSAGE_HISTORY','ADD_REACTIONS','USE_EXTERNAL_EMOJIS'],
            deny:[],
        }

        let change=false;
    
        let channels=ts.gs.select("Channels");
        let sheet_updates=[];
        for(let i in channels){
            let c=channels[i]
            if(!c.value){
                console.log({
                    type:"notset",
                    row:c,
                    data:defaultChannels[c.Name],
                })
                
                let channelTemplate=defaultChannels[c.Name];
                let channelName=c.default
                channelTemplate.permissionOverwrites.push(botPermissions)
                console.log(channelTemplate)
                let newChannel=message.guild.channels.find(channel => channel.name === channelName)
                if(!newChannel) newChannel=await message.guild.createChannel(channelName,channelTemplate)
                let embed = ts.client.util.embed()
                    .setColor("#007bff")
                    .setTitle("Channel Help (You can delete this)")
                let newChannelHelp;    
                if(channelTemplate.type=='category'){
                    newChannelHelp=await message.guild.createChannel(channelName+'-help',{
                        parent: newChannel.id
                    })
                    embed.setDescription('```fix\n'+c.Description+'\n```**You can delete this channel**\n<a:SHELLBOTTED:666097068640829440>')
                } else {
                    newChannelHelp=newChannel;
                    embed.setDescription('```fix\n'+c.Description+'\n```**You can move this channel for organization**\n**You can delete this message**\n<a:SHELLBOTTED:666097068640829440>')
                }
                await newChannelHelp.send(`<@${message.author.id}>`)
                await newChannelHelp.send(embed)

                let sheet=ts.gs.queryOne('Channels',{
                    filter:{ Name: c.Name },
                    update:{ value: "'"+newChannel.id }
                })
                sheet_updates=sheet_updates.concat(sheet.update_ranges)
                change=true;
            }
        }

        if(sheet_updates.length>0) await ts.gs.batchUpdate(sheet_updates);
*/
        await ts.load()
        message.reply('reloaded');
    }
}

module.exports = InitRoles;