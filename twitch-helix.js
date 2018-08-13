const twitch = require('twitch-helix-api');
const EventEmitter = require('events');
const config = require('./config');
var gameIndex;
var gameName;
const streamEmitter = new EventEmitter();
let startup = false;
let thumbnail;
twitch.clientID = require('./../tokens')["twitch-client-id"];
let streams = { };
let games = [
  {"id": "10979", "name": "TLoZ"},
  {"id": "14890", "name": "Z2"},
  {"id": "9435", "name": "ALTTP"},
  {"id": "31498", "name": "ALTTP-FS"},
  {"id": "16246", "name": "TWoG"},
  {"id": "4612", "name": "TFoE"},
  {"id": "3337", "name": "LA"},
  {"id": "13016", "name": "ZA"},
  {"id": "11557", "name": "OoT"},
  {"id": "8144", "name": "LADX"},
  {"id": "12482", "name": "MM"},
  {"id": "5406", "name": "OoS"},
  {"id": "7335", "name": "OoA"},
  {"id": "15849", "name": "MQ"},
  {"id": "33253", "name": "FS"},
  {"id": "16967", "name": "TWW"},
  {"id": "7200", "name": "FSA"},
  {"id": "5635", "name": "TMC"},
  {"id": "17828", "name": "TP"},
  {"id": "19367", "name": "Tingle"},
  {"id": "3359", "name": "PH"},
  {"id": "24508", "name": "Tingle2"},
  {"id": "23195", "name": "ST"},
  {"id": "24324", "name": "SS"},
  {"id": "28613", "name": "OoT3D"},
  {"id": "368205", "name": "TWWHD"},
  {"id": "369088", "name": "ALBW"},
  {"id": "418067", "name": "HW"},
  {"id": "488533", "name": "MM3D"},
  {"id": "490388", "name": "TFH"},
  {"id": "491327", "name": "TPHD"},
  {"id": "110758", "name": "BotW"}
];
function streamLoop () {
  // Uncomment for logging.
  //console.log("Get streams...");
  //console.log(".--current streams--.");
  //console.log(streams)
  //console.log("'-------------------'");
  twitch.streams.getStreams({
    "game_id": [
      "10979", //TLoZ
      "14890", //Z2
      "9435", //ALTTP
      "31498", //ALTTPFS
      "16246", //TWoG
      "4612", //TFoE
      "3337", //LA
      "13016", //ZA
      "11557", //OoT
      "8144", //LADX
      "12482", //MM
      "5406", //OoS
      "7335",  //OoA
      "15849", //MQ
      "33253", //FS
      "16967", //TWW
      "7200", //FSA
      "5635", //TMC
      "17828", //TP
      "19367", //Tingle
      "3359", //PH
      "24508", //Tingle2
      "23195", //ST
      "24324", //SS
      "28613", //OoT3D
      "368205", //TWWHD
      "369088", //ALBW
      "418067", //HW
      "488533", //MM3D
      "490388", //TFH
      "491327", //TPHD
      "110758" //BotW
    ],
    "community_id": [
      "5db93886-7d58-4db7-8936-9aef93910dea",
      "dbf7204e-af0f-4554-9b47-eb44bca6ff27",
      "6e940c4a-c42f-47d2-af83-0a2c7e47c421"
    ], //Zelda-speedruns, zelda-speed-runs, speedrunning
    "type": 'live'
  }).then((data) => {
    let res = data.response.data;
    let user_ids = [ ];
    for (let stream of res) {
      user_ids.push(stream["user_id"]);
      if (typeof streams[stream["user_id"]] === 'undefined') {
        streams[stream["user_id"]] = { };
      }
      streams[stream["user_id"]]["timer"] = 15;
      streams[stream["user_id"]]["title"] = stream["title"];
      streams[stream["user_id"]]["viewer_count"] = stream["viewer_count"];
      streams[stream["user_id"]]["game_id"] = stream["game_id"]
      
    }
    if (user_ids.length > 0) {
      return twitch.users.getUsers({
        "id": user_ids
      });
    }
    return null;
  }).then((data) => {
    if (data === null) {
      return;
    }

    let res = data.response.data;
    for (let stream of res) {
      if (typeof streams[stream["id"]]["url"] === 'undefined') {
        if (startup === true) {
          gameIndex = games.map(function(e) { return e.id; }).indexOf(streams[stream["id"]]["game_id"]);
          gameName = games[gameIndex].name;
          twitch.games.getGames({
            "id": streams[stream["id"]]["game_id"]
          }).then((Games) => {
            let gameInfo = Games.response.data;
            thumbnail = gameInfo[0].box_art_url.replace("-{width}x{height}","");
          }).catch((e) => {
            console.error(e);
          });
          let emit = setTimeout(function() {
            streamEmitter.emit('messageStreamStarted', {
            "url": 'https://www.twitch.tv/' + stream["login"],
            "name": stream["login"],
            "title": streams[stream["id"]]["title"],
            "game": gameName,
            "gameID": streams[stream["id"]]["game_id"],
            "cover": thumbnail
            // "id": stream["id"],
            // "display_name": stream["display_name"],
            // "login": stream["login"]
           });
          }, 3000);
        }
      }
      streams[stream["id"]]["url"] = 'https://www.twitch.tv/' + stream["login"];
      streams[stream["id"]]["display_name"] = stream["display_name"];
      streams[stream["id"]]["login"] = stream["login"];
    }
    return;
  }).catch((e) => {
    console.error(e);
  }).then(() => {
    if (startup === false) {
      startup = true;
    }
    setTimeout(streamLoop, 30000);
  });
}
setTimeout(streamLoop, 5000);
setInterval(() => {
  for (let stream of Object.keys(streams)) {
    streams[stream]["timer"]--;
    if (streams[stream]["timer"] < 1) {
      if (typeof streams[stream]["url"] !== 'undefined' && typeof streams[stream]["title"] !== 'undefined') {
        streamEmitter.emit('messageStreamDeleted', {
          "url": streams[stream]["url"],
          "title": streams[stream]["title"],
          "id": stream
        });
      }
      delete streams[stream];
    }
  }
}, 20000);
streamEmitter.getStreams = () => {
  return streams;
}
module.exports = streamEmitter;
