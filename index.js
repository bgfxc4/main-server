const WebSocket = require('ws');
const crypto = require('crypto');
const USERS = require('./users.js'); 
const sha512 = require('./sha512');
const CryptoJS = require('crypto-js');
const fs = require('fs');


const wss = new WebSocket.Server({ port: 5554 });

const users = USERS.users;
const passwords = USERS.passwords;
var sessIDs = [];

for(var i = 0; i < users.length; i++){sessIDs[i] = ''}

wss.on('connection', function connection(ws) {
    console.log("Connection open");
    var randBytesSent;
    var indexOfUser;

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
                if(pckgCont == await SHA512(randBytesSent + users[i] + passwords[i])){
                    indexOfUser = i;
                    console.log("logged in user " + users[i]);
                    sessIDs[i] = generateSessionID();
                    sendMessage(ws, "loggedIn:" + encryptAes(passwords[indexOfUser],getSessionID(indexOfUser)));
                    console.log(sessIDs);
                    return;
                }
            }
            sendMessage(ws, "loginFailed: ");
            //console.log("login failed. Hash should be " +  await SHA256(randBytesSent + users[0] + passwords[0]) + "  " + randBytesSent + users[0] + passwords[0]);
        }
    }  

    ws.on('close', function(){
        if(indexOfUser != undefined){
            sessIDs[indexOfUser] = '';
        }
        console.log("ws closed!");
    })
});  

function sendMessage(connection, msg){
    connection.send(msg);
    console.log("sending " + msg);
}

async function SHA512(message) {
    var hash = sha512.create();
    hash.update(message);
    hash.hex();
    return hash;
  }

function generateSessionID(){
    var isEqual = false;
    var ID;
    do{
        isEqual = false;
        ID = makeRandStr(20);
        for(var i = 0; i < users.length; i++){
            if(ID == sessIDs[i]){
                isEqual = true;
            }
        }
    }while(isEqual);
    return ID;
}

function makeRandStr(length) {
    var result           = '';
    var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for ( var i = 0; i < length; i++ ) {
       result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
 }

function getSessionID(indexOfUser){
    return sessIDs[indexOfUser];
}

function encryptAes(key, text){
    var encrypted = CryptoJS.AES.encrypt(text, key).toString();
    return encrypted;
}

function decryptAes(key, text){
    var decrypted = CryptoJS.AES.decrypt(text, key);
    return decrypted.toString(CryptoJS.enc.Utf8);
}