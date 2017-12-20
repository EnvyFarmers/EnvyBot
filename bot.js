var Discord = require('discord.io');
var logger = require('winston');
var auth = require('./auth.json');
global.fetch = require('node-fetch')
const cc = require('cryptocompare')
const get = require('simple-get')
var dateFormat = require('dateformat');

// Configure logger settings
logger.remove(logger.transports.Console);
logger.add(logger.transports.Console, {
    colorize: true
});
logger.level = 'debug';
// Initialize Discord Bot
var bot = new Discord.Client({
   token: auth.discordKey,
   autorun: true
});
bot.on('ready', function (evt) {
    logger.info('Connected');
    logger.info('Logged in as: ');
    logger.info(bot.username + ' - (' + bot.id + ')');
});

bot.on('message', function (user, userID, channelID, message, evt) {
    // Our bot needs to know if it will execute a command
    // It will listen for messages that will start with `!`
    if (message.substring(0, 1) == '!') {
        var args = message.substring(1).split(' ');
        var cmd = args[0];
       
        args = args.splice(1);
        switch(cmd) {
            // !ping
            case 'ping':
                bot.sendMessage({
                    to: channelID,
                    message: 'pong!'
                });
            break;

            case 'price':
                var coin = args[0];

                var price = cc.price(coin,'USD')
                .then(prices => {
                   bot.sendMessage({
                       to: channelID,
                       message: '(' + coin +') : $' + prices.USD + ' USD'
                   });
                })
            break;
			
			case 'payments':
			
				var opts = {
				  method: 'GET',
				  url: 'https://api.nanopool.org/v1/etn/paymentsday/'+auth.etnWallet,
				  json: true
				}
				
				get.concat(opts, function (err, res, data) {
				   if (err) throw err
				   var newMessage = '```==============  Payments in the last 24 Hours ============= \n'
				   var payments = data.data
				   var totalIn24 = 0
				   for(var payment in payments) {
			  	      var d = new Date(0); // The 0 there is the key, which sets the date to the epoch
				      d.setUTCSeconds(payments[payment].date);
					  newMessage += '[' + d.toLocaleString("en-US") + '] ' + payments[payment].amount.toFixed(2)
					  newMessage += '\n'
					  totalIn24 += payments[payment].amount;
				   } 
				   perHour = totalIn24/24;
				   newMessage += 'Total: ' + totalIn24.toFixed(2) + 'ETN or ' + perHour.toFixed(2) + ' ETN/hour \n'
				   newMessage += '```'
				  
				   bot.sendMessage({
                      to: channelID,
                      message: newMessage
                   });
				})
			break;
			
			case 'hashrates':
	
				var opts = {
				  method: 'GET',
				  url: 'http://68.104.95.228:17790/api/miners?key=75a5ebe34a7f4a32ad21195a2b3866e6',
				  json: true
				}
				
				get.concat(opts, function (err, res, data) {
				   if (err) throw err
				   var newMessage = '```==============  Hashrates ============= \n'
				   var miners = data.minerList
				   var totalHash = data.totalHashrates5s
				   for(var miner in miners) {
					  newMessage += '[' + miner.name + '] ' + miner.speedInfo.hashrate + 'H/s'
				   } 
				   newMessage += '```'
				  
				   bot.sendMessage({
                      to: channelID,
                      message: newMessage
                   });
				})
			break;
			break;

            // Just add any case commands if you want to..
         }
     }
});