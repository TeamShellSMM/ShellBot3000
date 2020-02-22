const config = require('./config.json');
const { AkairoClient } = require('discord-akairo');
const TS=require('./TS.js')
const GS=require('./GS.js')
global.gs=new GS(config); //not sure if this is a good idea or not
global.ts=new TS(gs);
const client = new AkairoClient(config, {
    disableEveryone: true
});
const static_vars=[
"TeamShell Variable","Points","TeamShell Ranks","Seasons", //static vars
'Raw Members','Raw Levels','Raw Played' //play info
]; //initial vars to be loaded on bot load
(async () => { //main thread
  const response=await gs.loadSheets(static_vars) //loading initial sheets
  client.login(config.token); 
})();