const WebSocket = require('ws');
const crypto = require('crypto');
const USERS = require('./users.js'); 

const wss = new WebSocket.Server({ port: 5554 });

const users = USERS.users;
const passwords = USERS.passwords;

wss.on('connection', function connection(ws) {
    console.log("Connection open");

    var randBytesSent;

  ws.on('message', function incoming(message) {
    console.log('received: %s', message);
    processMessage(message);
  });

  ws.send('Connected!');

  async function processMessage(msg){
    var split = msg.split(":", 2);
    var pckgName = split[0];
    var pckgCont = split[1];

        if(pckgName == "reqRandBytes"){
            var rand = Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, 20);
            sendMessage(ws, "RandBytes:" + rand);
            randBytesSent = rand;
        }  else if(pckgName == "login"){

            for(var i = 0; i < users.length; i++){
                if(pckgCont == await sha256(randBytesSent + users[i] + passwords[i])){
                    console.log("logged in user " + users[i]);
                    sendMessage(ws, "logged in");
                    return;
                }
            }
            //console.log("login failed. Hash should be " +  await sha256(randBytesSent + users[0] + passwords[0]) + "  " + randBytesSent + users[0] + passwords[0]);
        }
    }  
});  

function sendMessage(connection, msg){
    connection.send(msg);
    console.log("sending " + msg);
}

async function sha256(message) {
    var hash = crypto.createHash('sha256').update(message).digest('hex');
    
    return hash;
  }