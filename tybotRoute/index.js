const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');
//var cors = require('cors');
//let path = require("path");
//let fs = require('fs');
const { TiledeskChatbotClient } = require('@tiledesk/tiledesk-chatbot-client');
const { TiledeskClient } = require('@tiledesk/tiledesk-client');
//const jwt = require('jsonwebtoken');
//const { v4: uuidv4 } = require('uuid');
const { ExtApi } = require('./ExtApi.js');
const { ExtUtil } = require('./ExtUtil.js');
const { TdCache } = require('./TdCache.js');
//const { IntentForm } = require('./IntentForm.js');
const { TiledeskChatbot } = require('./models/TiledeskChatbot.js');
const { MongodbBotsDataSource } = require('./models/MongodbBotsDataSource.js');
const { MongodbIntentsMachine } = require('./models/MongodbIntentsMachine.js');
const { TiledeskIntentsMachine } = require('./models/TiledeskIntentsMachine.js');

//router.use(cors());
router.use(bodyParser.json({limit: '50mb'}));
router.use(bodyParser.urlencoded({ extended: true , limit: '50mb'}));

let log = false;
let tdcache = null;

// DEV
const { MessagePipeline } = require('./tiledeskChatbotPlugs/MessagePipeline');
const { DirectivesChatbotPlug } = require('./tiledeskChatbotPlugs/DirectivesChatbotPlug');
/*const { SplitsChatbotPlug } = require('./tiledeskChatbotPlugs/SplitsChatbotPlug');
const { MarkbotChatbotPlug } = require('./tiledeskChatbotPlugs/MarkbotChatbotPlug');*/
const { WebhookChatbotPlug } = require('./tiledeskChatbotPlugs/WebhookChatbotPlug');

// PROD
/*const { MessagePipeline } =  require('@tiledesk/tiledesk-chatbot-plugs/MessagePipeline');
const { DirectivesChatbotPlug } = require('@tiledesk/tiledesk-chatbot-plugs/DirectivesChatbotPlug');
const { SplitsChatbotPlug } = require('@tiledesk/tiledesk-chatbot-plugs/SplitsChatbotPlug');
const { MarkbotChatbotPlug } = require('@tiledesk/tiledesk-chatbot-plugs/MarkbotChatbotPlug');
const { WebhookChatbotPlug } = require('@tiledesk/tiledesk-chatbot-plugs/WebhookChatbotPlug');*/

// THE IMPORT
let mongoose = require('mongoose');
//let Faq = require('./models/faq');
//let Faq_kb = require('./models/faq_kb');
let connection;
let APIURL = null;

router.post('/ext/:botid', async (req, res) => {
  if (log) {console.log("REQUEST BODY:", JSON.stringify(req.body));}
  res.status(200).send({"success":true});

  const botId = req.params.botid;
  if (log) {console.log("query botId:", botId);}
  const message = req.body.payload;
  const messageId = message._id;
  const faq_kb = req.body.hook;
  const token = req.body.token;
  const requestId = message.request.request_id;
  const projectId = message.id_project;

  const message_context = {
    projectId: projectId,
    requestId: requestId,
    token: token
  }
  const message_context_key = "tiledesk:messages:context:" + messageId;
  await tdcache.set(
    message_context_key,
    JSON.stringify(message_context),
    {EX: 86400}
  );
  if (log) {console.log("message context saved for messageid:", message_context_key)}
  // provide a http method for set/get message context, authenticated with tiledesk token and APIKEY.
  const botsDS = new MongodbBotsDataSource({projectId: projectId, botId: botId});
  const intentsMachine = new MongodbIntentsMachine({projectId: projectId, language: faq_kb.language});
  //const intentsMachine = new TiledeskIntentsMachine({API_ENDPOINT: "https://MockIntentsMachine.tiledesk.repl.co", log: true});
  const chatbot = new TiledeskChatbot({
    botsDataSource: botsDS, 
    intentsFinder: intentsMachine,
    botId: botId,
    token: token,
    APIURL: APIURL,
    APIKEY: "___",
    tdcache: tdcache,
    requestId: requestId,
    projectId: projectId,
    log: true
  });

  const parameters_key = "tilebot:requests:" + requestId + ":parameters";
  await chatbot.addParameter(requestId, "tdMessageId", messageId);
  //all_params = await chatbot.allParameters(requestId);
  //console.log("Allparams", all_params);
  let reply = await chatbot.replyToMessage(message);
  if (!reply) {
    reply = {
      "text": "No messages found. Is 'defaultFallback' intent missing?"
    }
  }
  reply.triggeredByMessageId = messageId;
  let extEndpoint = `${APIURL}/modules/tilebot/`;
  if (process.env.TYBOT_ENDPOINT) {
    extEndpoint = `${process.env.TYBOT_ENDPOINT}`;
  }
  const apiext = new ExtApi({
    ENDPOINT: extEndpoint,
    log: log
  });

  apiext.sendSupportMessageExt(reply, projectId, requestId, token, () => {
    if (log) {console.log("FORM Message sent.", );}
  });
  
});

router.post('/ext/:projectId/requests/:requestId/messages', async (req, res) => {
  res.json({success:true});
  const projectId = req.params.projectId;
  const requestId = req.params.requestId;
  const token = req.headers["authorization"];
  let answer = req.body;
  const tdclient = new TiledeskClient({
    projectId: projectId,
    token: token,
    APIURL: APIURL,
    APIKEY: "___",
    log: false
  });
  
  let request;
  const request_key = "tilebot:" + requestId;
  if (tdcache) {
    request = await tdcache.getJSON(request_key)
    if (log) {console.log("HIT! Request from cache:", request.request_id);}
    if (!request) {
      if (log) {console.log("!Request from cache", requestId);}
      request = await tdclient.getRequestById(requestId);
      if (log) {console.log("Got request with APIs (after no cache hit)");}
    }
  }
  else {
    if (log) {console.log("No tdcache. Getting request with APIs", requestId);}
    request = await tdclient.getRequestById(requestId);
    if (log) {console.log("(No tdcache) Got request with APIs");}
  }
  let directivesPlug = new DirectivesChatbotPlug({supportRequest: request, TILEDESK_API_ENDPOINT: APIURL, token: token, log: log, HELP_CENTER_API_ENDPOINT: process.env.HELP_CENTER_API_ENDPOINT, cache: tdcache});
  // PIPELINE-EXT
  const bot_answer = await ExtUtil.execPipelineExt(request, answer, directivesPlug, tdcache, log);
  //const bot_answer = answer;
  tdclient.sendSupportMessage(requestId, bot_answer, () => {
    directivesPlug.processDirectives(() => {
      if (log) {console.log("After message execute directives end.");}
    });
  });
});

router.get('/message/context/:messageid', async (req, res) => {
  const messageid = req.params.messageid;
  const message_key = "tiledesk:messages:context:" + messageid;
  const message_context_s = await tdcache.get(message_key);
  if (message_context_s) {
    const message_context = JSON.parse(message_context_s);
    res.send(message_context);
  }
  else {
    res.send(null);
  }
});

router.get('/', (req, res) => {
  res.send('Hello Tilebot!');
});

function startApp(settings, completionCallback) {
  console.log("Starting Tilebot with Settings:", settings);

  if (!settings.MONGODB_URI) {
    throw new Error("settings.MONGODB_URI is mandatory.");
  }
  if (!settings.API_ENDPOINT) {
    throw new Error("settings.API_ENDPOINT is mandatory.");
  }
  else {
    APIURL = settings.API_ENDPOINT;
    console.log("(Tilebot) settings.API_ENDPOINT:", APIURL);
  }
  if (settings.REDIS_HOST && settings.REDIS_PORT) {
    tdcache = new TdCache({
      host: settings.REDIS_HOST,
      port: settings.REDIS_PORT,
      password: settings.REDIS_PASSWORD
    });
  }
  
  if (!settings.log) {
    log = false;
  }
  else {
    log = true;
  }
  console.log("(Tilebot) log:", log);
  var pjson = require('./package.json');
  console.log("(Tilebot) Starting Tilebot connector v" + pjson.version);
  console.log("(Tilebot) Connecting to mongodb...");

  connection = mongoose.connect(settings.MONGODB_URI, { "useNewUrlParser": true, "autoIndex": false }, async (err) => {
    if (err) { 
      console.error('(Tilebot) Failed to connect to MongoDB on ' + settings.MONGODB_URI + " ", err);
      //process.exit(1); // add => exitOnFail: true
    }
    else {
      console.log("(Tilebot) mongodb connection ok.");
      if (tdcache) {
        try {
          await tdcache.connect();
        }
        catch (error) {
          tdcache = null;
          console.error("(Tilebot) tdcache (Redis) connection error:", error);
        }
        console.log("(Tilebot) tdcache (Redis) connected.");
      }
      console.info("Tilebot started.");
      if (completionCallback) {
        completionCallback();
      }
    }
  });
}

module.exports = { router: router, startApp: startApp};