const { DirIntent } = require('./DirIntent');
const { TiledeskExpression } = require('../../TiledeskExpression');

class DirCondition {

  constructor(context) {
    if (!context) {
      throw new Error('config (TiledeskClient) object is mandatory.');
    }
    this.context = context;
    // let context =  {
    //   projectId: projectId,
    //   token: token,
    //   supportRequest: supportRequest,
    //   requestId: supportRequest.request_id,
    //   TILEDESK_APIURL: API_URL,
    //   TILEBOT_ENDPOINT:TILEBOT_ENDPOINT,
    //   departmentId: depId,
    //   tdcache: tdcache,
    //   log: false
    // }
    this.tdclient = new TiledeskClient({
      projectId: context.projectId,
      token: context.token,
      APIURL: context.TILEDESK_APIURL,
      APIKEY: "___",
      log: context.log
    });
    this.intentDir = new DirIntent(
      {
        API_ENDPOINT: context.TILEDESK_APIURL,
        TILEBOT_ENDPOINT: context.TILEBOT_ENDPOINT,
        supportRequest: context.supportRequest,
        token: context.token,
        log: context.log
      }
    );
    this.log = context.log;
  }

  execute(directive, callback) {
    let action;
    if (directive.action) {
      action = directive.action
    }
    else if (directive.parameter) {
      let params;
      params = this.parseParams(directive.parameter);
      if (!params.condition) {
        callback();
        return;
      }
      action = {
        body: {
          condition: params.condition,
          trueIntent: params.trueIntent,
          falseIntent: params.falseIntent
        }
      }
    }
    else {
      callback();
      return;
    }
    this.go(action, () => {
      callback();
    });
    
  }

  async go(action, callback) {
    const condition = action.body.condition;
    const trueIntent = action.body.trueIntent;
    const falseIntent = action.body.falseIntent;
    if (!trueIntent && !falseIntent) {
      if (this.log) {console.log("Invalid condition, no intents specified");}
      callback();
      return;
    }
    let trueIntentDirective = null;
    if (trueIntent) {
      trueIntentDirective = {
        action: {
          body: {
            intentName: trueIntent
          }
        }
      }
    }
    let falseIntentDirective = null;
    if (falseIntent) {
      falseIntentDirective = {
        action: {
          body: {
            intentName: falseIntent
          }
        }
      }
    }
    let variables = null;
    if (this.tdcache) {
      variables = 
      await TiledeskChatbot.allParametersStatic(
        this.tdcache, this.requestId
      );
    }
    const result = await this.evaluateCondition(condition, variables);
    if (this.log) {console.log("executed condition:", condition, "result:", result);}
    if (result === true) {
      if (trueIntentDirective) {
        this.intentDir.execute(trueIntentDirective, () => {
          callback();
        });
      }
      else {
        if (this.log) {console.log("No trueIntentDirective specified");}
        callback();
        return;
      }
    }
    else {
      if (falseIntentDirective) {
        this.intentDir.execute(falseIntentDirective, () => {
          callback();
        });
      }
      else {
        if (this.log) {console.log("No falseIntentDirective specified");}
        callback();
        return;
      }
    }
  }

  async evaluateCondition(_condition, variables) {
    let condition = _condition.replace("$", "$data.");
    console.log("Evaluating condition:", condition);
    console.log("With variables:", variables);
    const result = new TiledeskExpression().evaluate(condition, variables)
    console.log("conditionResult:", result);
    return result;
  }

  parseParams(directive_parameter) {
    let condition = null;
    let trueIntent = null;
    let falseIntent = null;
    const params = ms(directive_parameter);
    if (params.condition) {
      condition = params.condition
    }
    if (params.trueIntent) {
      trueIntent = params.trueIntent;
    }
    if (params.falseIntent) {
      falseIntent = params.falseIntent;
    }
    return {
      condition: condition,
      trueIntent: trueIntent,
      falseIntent: falseIntent
    }
  }

}

module.exports = { DirCondition };