const axios = require("axios").default;
const { TiledeskChatbot } = require('../../models/TiledeskChatbot');
const { Filler } = require('../Filler');
let https = require("https");
const { DirIntent } = require("./DirIntent");
require('dotenv').config();

class DirAskGPT {

  constructor(context) {
    if (!context) {
      throw new Error('context object is mandatory');
    }
    this.context = context;
    this.tdcache = this.context.tdcache;
    this.requestId = this.context.requestId;
    this.intentDir = new DirIntent(context);
    this.log = context.log;
  }

  execute(directive, callback) {
    if (this.log) { console.log("AskGPT directive: ", directive); }
    let action;
    if (directive.action) {
      action = directive.action;
    }
    else {
      console.error("Incorrect directive: ", JSON.stringify(directive));
      callback();
      return;
    }
    this.go(action, (stop) => {
      callback(stop);
    })
  }

  async go(action, callback) {
    if (this.log) { console.log("DirAskGPT action:", JSON.stringify(action)); }
    if (!this.tdcache) {
      console.error("Error: DirAskGPT tdcache is mandatory");
      callback();
      return;
    }

    let trueIntent = action.trueIntent;
    let falseIntent = action.falseIntent;
    let trueIntentAttributes = action.trueIntentAttributes;
    let falseIntentAttributes = action.falseIntentAttributes;

    if (this.log) {
      console.log("DirAskGPT trueIntent", trueIntent)
      console.log("DirAskGPT falseIntent", falseIntent)
      console.log("DirAskGPT trueIntentAttributes", trueIntentAttributes)
      console.log("DirAskGPT falseIntentAttributes", falseIntentAttributes)
    }

    // default values
    let answer = "No answers";
    let source = null;

    if (!action.question || action.question === '') {
      console.error("Error: DirAskGPT question attribute is mandatory. Executing condition false...");
      await this.#assignAttributes(action, answer, source);
      if (falseIntent) {
        await this.#executeCondition(false, trueIntent, trueIntentAttributes, falseIntent, falseIntentAttributes);
      }
      callback(true);
      return;
    }

    if (!action.kbid) {
      console.error("Error: DirAskGPT kbid attribute is mandatory. Executing condition false...");
      await this.#assignAttributes(action, answer, source);
      if (falseIntent) {
        await this.#executeCondition(false, trueIntent, trueIntentAttributes, falseIntent, falseIntentAttributes)
      }
      callback(true);
      return;
    }

    let requestVariables = null;
    requestVariables =
      await TiledeskChatbot.allParametersStatic(
        this.tdcache, this.requestId
      );

    const filler = new Filler();
    const filled_question = filler.fill(action.question, requestVariables);

    const server_base_url = process.env.API_ENDPOINT || process.env.API_URL;
    const kb_url = server_base_url + "/" + this.context.projectId + "/kbsettings";
    if (this.log) { console.log("DirAskGPT ApiEndpoint URL: ", kb_url); }

    const KB_HTTPREQUEST = {
      url: kb_url,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'JWT ' + this.context.token
      },
      method: "GET"
    }
    if (this.log) { console.log("DirAskGPT KB_HTTPREQUEST", KB_HTTPREQUEST); }

    this.myrequest(
      KB_HTTPREQUEST, async (err, resbody) => {
        if (this.log) { console.log("DirAskGPT get kbs resbody:", resbody); }
        
        if (err) {
          if (this.log) { console.error("DirAskGPT get kbs error:", err); }
          if (callback) {
            await this.#assignAttributes(action, answer, source);
            if (falseIntent) {
              this.#executeCondition(false, trueIntent, trueIntentAttributes, falseIntent, falseIntentAttributes);
            }
            callback(true);
            return;
          }

        } else if (callback) {
          if (this.log) { console.log("DirAskGPT gptkey: " + resbody.gptkey); }

          if (!resbody.gptkey) {
            console.error("Error: DirAskGPT missing gptkey. Executing condition false...");
            await this.#assignAttributes(action, answer, source);
            if (falseIntent) {
              this.#executeCondition(false, trueIntent, trueIntentAttributes, falseIntent, falseIntentAttributes);
            }
            callback(true);
            return;

          } else {
            let json = {
              question: filled_question,
              kbid: action.kbid,
              gptkey: resbody.gptkey
            };
            if (this.log) { console.log("DirAskGPT json:", json); }

            const url = process.env.PAI_ENDPOINT || process.env.GPT_ENDPOINT;
            if (this.log) { console.log("DirAskGPT GPT Endpoint", url); }
            const HTTPREQUEST = {
              url: url,
              json: json,
              method: "POST"
            }
            if (this.log) { console.log("DirAskGPT HTTPREQUEST", HTTPREQUEST); }

            this.myrequest(
              HTTPREQUEST, async (err, resbody) => {
                if (this.log && err) {
                  console.log("DirAskGPT error: ", err);
                }
                if (this.log) { console.log("DirAskGPT resbody:", resbody); }
                let answer = resbody.answer;
                let source = resbody.source_url;
                await this.#assignAttributes(action, answer, source);

                if (err) {
                  if (callback) {
                    if (falseIntent) {
                      await this.#executeCondition(false, trueIntent, trueIntentAttributes, falseIntent, falseIntentAttributes);
                    }
                    callback(true);
                    return;
                  }
                }
                else if (resbody.success === true) {
                  if (trueIntent) {
                    await this.#executeCondition(true, trueIntent, trueIntentAttributes, falseIntent, falseIntentAttributes);
                  }
                  callback(); // se la condition è true si deve ritornare true nella callback ugualmente?
                  return;
                } else {
                  if (falseIntent) {
                    await this.#executeCondition(false, trueIntent, trueIntentAttributes, falseIntent, falseIntentAttributes);
                  }
                  callback(true);
                  return;
                }
              }
            )
          }
        }
      }
    )
  }

  async #executeCondition(result, trueIntent, trueIntentAttributes, falseIntent, falseIntentAttributes, callback) {
    let trueIntentDirective = null;
    if (trueIntent) {
      trueIntentDirective = DirIntent.intentDirectiveFor(trueIntent, trueIntentAttributes);
    }
    let falseIntentDirective = null;
    if (falseIntent) {
      falseIntentDirective = DirIntent.intentDirectiveFor(falseIntent, falseIntentAttributes);
    }
    if (result === true) {
      if (trueIntentDirective) {
        this.intentDir.execute(trueIntentDirective, () => {
          if (callback) {
            callback();
          }
        })
      }
      else {
        if (this.log) { console.log("No trueIntentDirective specified"); }
        if (callback) {
          callback();
        }
      }
    }
    else {
      if (falseIntentDirective) {
        this.intentDir.execute(falseIntentDirective, () => {
          if (callback) {
            callback();
          }
        });
      }
      else {
        if (this.log) { console.log("No falseIntentDirective specified"); }
        if (callback) {
          callback();
        }
      }
    }
  }

  async #assignAttributes(action, answer, source) {
    if (this.log) {
      console.log("assignAttributes action:", action)
      console.log("assignAttributes answer:", answer)
      console.log("assignAttributes source:", source)
    }
    if (this.context.tdcache) {
      if (action.assignReplyTo && answer) {
        await TiledeskChatbot.addParameterStatic(this.context.tdcache, this.context.requestId, action.assignReplyTo, answer);
      }
      // console.log("--> action.assignSourceTo: ", action.assignSourceTo)
      // console.log("--> source: ", source)
      if (action.assignSourceTo && source) {
        // console.log("--> source: ", source)
        await TiledeskChatbot.addParameterStatic(this.context.tdcache, this.context.requestId, action.assignSourceTo, source);
      }
      // Debug log
      if (this.log) {
        const all_parameters = await TiledeskChatbot.allParametersStatic(this.context.tdcache, this.context.requestId);
        for (const [key, value] of Object.entries(all_parameters)) {
          if (this.log) { console.log("(askgpt) request parameter:", key, "value:", value, "type:", typeof value) }
        }
      }
    }
  }

  myrequest(options, callback) {
    if (this.log) {
      console.log("API URL:", options.url);
      console.log("** Options:", JSON.stringify(options));
    }
    let axios_options = {
      url: options.url,
      method: options.method,
      params: options.params,
      headers: options.headers
    }
    if (options.json !== null) {
      axios_options.data = options.json
    }
    if (this.log) {
      console.log("axios_options:", JSON.stringify(axios_options));
    }
    if (options.url.startsWith("https:")) {
      const httpsAgent = new https.Agent({
        rejectUnauthorized: false,
      });
      axios_options.httpsAgent = httpsAgent;
    }
    axios(axios_options)
      .then((res) => {
        if (this.log) {
          console.log("Response for url:", options.url);
          console.log("Response headers:\n", JSON.stringify(res.headers));
        }
        if (res && res.status == 200 && res.data) {
          if (callback) {
            callback(null, res.data);
          }
        }
        else {
          if (callback) {
            callback(new Error("Response status is not 200"), null);
          }
        }
      })
      .catch((error) => {
        // console.error("An error occurred:", JSON.stringify(error.data));
        if (callback) {
          callback(error, null);
        }
      });
  }

}

module.exports = { DirAskGPT }