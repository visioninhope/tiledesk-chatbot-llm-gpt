var assert = require('assert');
let axios = require('axios');
const tybot = require("../");
const tybotRoute = tybot.router;
var express = require('express');
var app = express();
app.use("/", tybotRoute);
require('dotenv').config();
const bodyParser = require('body-parser');
const { v4: uuidv4 } = require('uuid');
const bots_data = require('./conversation-actions_bot.js').bots_data;

const PROJECT_ID = "projectID"; //process.env.TEST_ACTIONS_PROJECT_ID;
const REQUEST_ID = "support-group-" + PROJECT_ID + "-" + uuidv4().replace(/-/g, "");
const BOT_ID = "botID"; //process.env.TEST_ACTIONS_BOT_ID;
const CHATBOT_TOKEN = process.env.ACTIONS_CHATBOT_TOKEN;

describe('Conversation1', async () => {

  let app_listener;

  before(() => {
    return new Promise(async (resolve, reject) => {
      console.log("Starting tilebot server...");
      tybot.startApp(
        {
          // MONGODB_URI: process.env.mongoUrl,
          bots: bots_data,
          API_ENDPOINT: process.env.API_ENDPOINT,
          REDIS_HOST: process.env.REDIS_HOST,
          REDIS_PORT: process.env.REDIS_PORT,
          REDIS_PASSWORD: process.env.REDIS_PASSWORD,
          log: process.env.API_LOG
        }, () => {
          console.log("ACTIONS Tilebot route successfully started.");
          var port = process.env.PORT || 10001;
          app_listener = app.listen(port, () => {
            console.log('Tilebot connector listening on port ', port);
            resolve();
          });
        });
    })
  });

  after(function (done) {
    app_listener.close(() => {
      // console.log('ACTIONS app_listener closed.');
      done();
    });
  });

  it('/start', (done) => {
    // console.log("/start...ing story...");
    let message_id = uuidv4();
    let listener;
    let endpointServer = express();
    endpointServer.use(bodyParser.json());
    endpointServer.post('/:projectId/requests/:requestId/messages', function (req, res) {
      // console.log("...req.body:", JSON.stringify(req.body));
      res.send({ success: true });
      const message = req.body;
      assert(message.attributes.commands !== null);
      assert(message.attributes.commands.length === 3);
      const command1 = message.attributes.commands[0];
      const command2 = message.attributes.commands[1];
      const command3 = message.attributes.commands[2];

      assert(command1.type === "message");
      assert(command1.message.text === "Hello by message directive!");

      assert(command2.type === "wait");
      assert(command2.time === 500);

      assert(command3.type === "message");
      assert(command3.message.text === "Start test");
      getChatbotParameters(REQUEST_ID, (err, params) => {
        if (err) {
          assert.ok(false);
        }
        else {
          // console.log("params /start:", params);
          assert(params);
          assert(params["_tdLastMessageId"] === message_id);
          assert(params["_tdProjectId"] === PROJECT_ID);
          listener.close(() => {
            done();
          });
        }
      });

    });

    listener = endpointServer.listen(10002, '0.0.0.0', () => {
      // console.log('endpointServer started', listener.address());
      let request = {
        "payload": {
          "_id": message_id,
          "senderFullname": "guest#367e",
          "type": "text",
          "sender": "A-SENDER",
          "recipient": REQUEST_ID,
          "text": "/start",
          "id_project": PROJECT_ID,
          "metadata": "",
          "request": {
            "request_id": REQUEST_ID
          }
        },
        "token": CHATBOT_TOKEN
      }
      sendMessageToBot(request, BOT_ID, CHATBOT_TOKEN, () => {
        // console.log("Message sent:\n", request);
      });
    });

  });

  it('/MessageActions', (done) => {
    let listener;
    let endpointServer = express();
    endpointServer.use(bodyParser.json());
    endpointServer.post('/:projectId/requests/:requestId/messages', function (req, res) {
      // console.log("req.body:", JSON.stringify(req.body));
      res.send({ success: true });
      const message = req.body;
      assert(message.attributes.commands !== null);
      assert(message.attributes.commands.length === 3);
      const command1 = message.attributes.commands[0];
      const command2 = message.attributes.commands[1];
      const command3 = message.attributes.commands[2];

      assert(command1.type === "message");
      assert(command1.message.text === "Hello by message directive!");

      assert(command2.type === "wait");
      assert(command2.time === 500);

      assert(command3.type === "message");
      assert(command3.message.text === "Ciao");
      assert(command3.message.attributes !== null);
      assert(command3.message.attributes.attachment !== null);
      assert(command3.message.attributes.attachment.buttons !== null);
      assert(command3.message.attributes.attachment.buttons[0].value === "/start");

      listener.close(() => {
        done();
      });

    });

    listener = endpointServer.listen(10002, '0.0.0.0', function () {
      let request = {
        "payload": {
          "_id": uuidv4(),
          "senderFullname": "guest#367e",
          "type": "text",
          "sender": "A-SENDER",
          "recipient": REQUEST_ID,
          "text": "/MessageActions",
          "id_project": PROJECT_ID,
          "metadata": "",
          "request": {
            "request_id": REQUEST_ID,
            "id_project": PROJECT_ID
          }
        },
        "token": CHATBOT_TOKEN
      }
      sendMessageToBot(request, BOT_ID, CHATBOT_TOKEN, () => {
        // console.log("Message sent.");
      });
    });
  });

  it('/Intent', (done) => {
    let listener;
    let endpointServer = express();
    endpointServer.use(bodyParser.json());
    endpointServer.post('/:projectId/requests/:requestId/messages', function (req, res) {
      // console.log("req.body::::::", JSON.stringify(req.body));
      res.send({ success: true });
      const message = req.body;
      if (message.text === "Eureka!\nThis is the reply for **intentAction4**") {
        assert(message.text === "Eureka!\nThis is the reply for **intentAction4**");
        listener.close(() => {
          done();
        });
      }
      // assert(message.text === "Eureka!\nThis is the reply for **intentAction4**");
      // assert(message.attributes.commands.length === 3);
      // const command1 = message.attributes.commands[0];
      // const command2 = message.attributes.commands[1];
      // const command3 = message.attributes.commands[2];

      // assert(command1.type === "message");
      // assert(command1.message.text === "Hello by message directive!");

      // assert(command2.type === "wait");
      // assert(command2.time === 500);

      // assert(command3.type === "message");
      // assert(command3.message.text === "Ciao");
      // assert(command3.message.attributes !== null);
      // assert(command3.message.attributes.attachment !== null);
      // assert(command3.message.attributes.attachment.buttons !== null);
      // assert(command3.message.attributes.attachment.buttons[0].value === "/start");

      // listener.close(() => {
      //   done();
      // });

    });

    listener = endpointServer.listen(10002, '0.0.0.0', function () {
      let request = {
        "payload": {
          "_id": uuidv4(),
          "senderFullname": "guest#367e",
          "type": "text",
          "sender": "A-SENDER",
          "recipient": REQUEST_ID,
          "text": "/Intent",
          "id_project": PROJECT_ID,
          "metadata": "",
          "request": {
            "request_id": REQUEST_ID,
            "id_project": PROJECT_ID
          }
        },
        "token": CHATBOT_TOKEN
      }
      sendMessageToBot(request, BOT_ID, CHATBOT_TOKEN, () => {
        // console.log("Message sent.");
      });
    });
  });

});

/**
 * A stub to send message to the "ext/botId" endpoint, hosted by tilebot on:
 * /${TILEBOT_ROUTE}/ext/${botId}
 *
 * @param {Object} message. The message to send
 * @param {string} botId. Tiledesk botId
 * @param {string} token. User token
 */
function sendMessageToBot(message, botId, token, callback) {
  // const jwt_token = this.fixToken(token);
  const url = `${process.env.TYBOT_ENDPOINT}/ext/${botId}`;
  // console.log("sendMessageToBot URL", url);
  const HTTPREQUEST = {
    url: url,
    headers: {
      'Content-Type': 'application/json'
    },
    json: message,
    method: 'POST'
  };
  myrequest(
    HTTPREQUEST,
    function (err, resbody) {
      if (err) {
        if (callback) {
          callback(err);
        }
      }
      else {
        if (callback) {
          callback(null, resbody);
        }
      }
    }, false
  );
}

/**
 * A stub to get the request parameters, hosted by tilebot on:
 * /${TILEBOT_ROUTE}/ext/parameters/requests/${requestId}?all
 *
 * @param {string} requestId. Tiledesk chatbot/requestId parameters
 */
function getChatbotParameters(requestId, callback) {
  // const jwt_token = this.fixToken(token);
  const url = `${process.env.TYBOT_ENDPOINT}/ext/parameters/requests/${requestId}?all`;
  const HTTPREQUEST = {
    url: url,
    headers: {
      'Content-Type': 'application/json'
    },
    method: 'get'
  };
  myrequest(
    HTTPREQUEST,
    function (err, resbody) {
      if (err) {
        if (callback) {
          callback(err);
        }
      }
      else {
        if (callback) {
          callback(null, resbody);
        }
      }
    }, false
  );
}

function myrequest(options, callback, log) {
  if (log) {
    console.log("API URL:", options.url);
    console.log("** Options:", options);
  }
  axios(
    {
      url: options.url,
      method: options.method,
      data: options.json,
      params: options.params,
      headers: options.headers
    })
    .then((res) => {
      if (log) {
        console.log("Response for url:", options.url);
        console.log("Response headers:\n", res.headers);
        //console.log("******** Response for url:", res);
      }
      if (res && res.status == 200 && res.data) {
        if (callback) {
          callback(null, res.data);
        }
      }
      else {
        if (callback) {
          callback(TiledeskClient.getErr({ message: "Response status not 200" }, options, res), null, null);
        }
      }
    })
    .catch((error) => {
      console.error("An error occurred:", error);
      if (callback) {
        callback(error, null, null);
      }
    });
}