const utils = require("./utils");
const bind = require("./bind.js");
const config = require("./config");

const SteamUser = require('steam-user');

module.exports = function(bot) {
    bot.steamBot.on('loggedOn', function(details) {
        bot.steamBot.setPersona(SteamUser.EPersonaState.Online);

        setTimeout(function() {
           console.log("Logged into Steam as " + bot.steamBot.accountInfo.name);
        }, 1000);

    });

    bot.steamBot.on('error', function(e) {
        // Some error occurred during logon
        console.log(e);
    });

    bot.steamBot.on('accountInfo', function(name, country, authedMachines, flags, facebookID, facebookName) {
        let accountInfo = {
            "name":name,
            "country":country,
            "authedMachines":authedMachines,
            "flags":flags,
            "facebookID":facebookID,
            "facebookName":facebookName,
        };

        bot.steamBot.accountInfo = accountInfo;
    });

    bot.steamBot.on('friendMessage', function(senderID, message) {
        let steamID = senderID.getSteamID64()
        let channelID = bind.getBindSteam(steamID);

        if (channelID) {
            bot.discordBot.channels.get(channelID).send(message);
        } else {
            let server = bot.discordBot.guilds.array()[0]; //just get the first server
            let username = bot.getSteamName(steamID);

            server.createChannel(utils.toChannelName(username), "text").then(channel => {
                bind.bind(channel.id, steamID);
                channel.send(message);
            });
        }
    });
    
    bot.steamBot.on('friendTyping', function(senderID) {        
        let channelID = bind.getBindSteam(senderID.getSteamID64());
        if (!config.receiveTyping) return;
        
        if (channelID) {
            let channel = bot.discordBot.channels.get(channelID);
            
            if (channel) {
                channel.startTyping();
                
                setTimeout(function() {
                    channel.stopTyping(true);
                }, 5000);
            }
        }
    });
    
    bot.steamBot.on('friendMessageEcho', function(senderID, message) {
        let channelID = bind.getBindSteam(senderID.getSteamID64());
        
        if (channelID) {
            let channel = bot.discordBot.channels.get(channelID);
            
            if (channel) {
                let stamName = bot.steamBot.users[senderID.getSteamID64()].player_name;
                channel.send(utils.discordCode(stamName) + " -> " + message);
            }
        }
    });
}