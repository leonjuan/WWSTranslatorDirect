var express = require('express');
var cfenv = require('cfenv');

const APP_ID = "Your App ID";
const APP_SECRET = "Your App Secret";
const APP_WEBHOOK_SECRET = "Your Webhook Secret";

const url = "Watson Language translator URL";
const username = "Your Watson Language translator username";
const password = "Your Watson Language translator password";

// ---------------------------------------------------------
// Initialize Watson Workspace
// ---------------------------------------------------------
const wwsdk = require('watsonworkspace-sdk');
const ww = new wwsdk(APP_ID,APP_SECRET);
const wwui = require('watsonworkspace-sdk').UI; //for ui elements

// ---------------------------------------------------------
// Initialize Bot framework
// ---------------------------------------------------------
const botFramework = require('watsonworkspace-bot');
botFramework.level('debug');
botFramework.startServer(8080);

const bot = botFramework.create(APP_ID, APP_SECRET, APP_WEBHOOK_SECRET) // bot settings defined by process.env
bot.authenticate()

// ---------------------------------------------------------
// Initialize Watson Language Translator
// ---------------------------------------------------------
var LanguageTranslatorV2 = require('watson-developer-cloud/language-translator/v2');
var language_translator = new LanguageTranslatorV2({
  username: username,
  password: password,
  url: url
});

// ---------------------------------------------------------
// App body
// ---------------------------------------------------------
var textBreak = "\r\n";

//////////////////////////////////////////
// Action: Directly translate to es
//////////////////////////////////////////
bot.on(`actionSelected:/translate-en-to-es`, (message, annotation, params) => {
let textToTranslate = annotation.actionId.substring("/translate-en-to-es".length+1, annotation.actionId.length);
  language_translator.translate(
  {
    text: textToTranslate,
    source: 'en',
    target: 'es'
  },
  function(err, translation) {
    if (err) {
      console.log('error:', err);
    } else {
      let translatedText = translation.translations[0].translation;

      ww.authenticate()
      .then(token => {
        const buttons = [wwui.button('/translation-to-space '+translatedText, 'Share')];
        const dialog = wwui.generic('Translated from english to spanish', '*Original text:* '+ textToTranslate + textBreak +'*Translated text:* '+translatedText, buttons);
        ww.sendTargetedMessage(message.userId, annotation, dialog);
      })
      .catch(error => console.log(error))
    }
  }
  );
})

//////////////////////////////////////////
// Action: Directly translate to en
//////////////////////////////////////////
bot.on(`actionSelected:/translate-es-to-en`, (message, annotation, params) => {
let textToTranslate = annotation.actionId.substring("/translate-es-to-en".length+1, annotation.actionId.length);
  language_translator.translate(
  {
    text: textToTranslate,
    source: 'es',
    target: 'en'
  },
  function(err, translation) {
    if (err) {
      console.log('error:', err);
    } else {
      let translatedText = translation.translations[0].translation;

      ww.authenticate()
      .then(token => {
        const buttons = [wwui.button('/translation-to-space '+translatedText, 'Share to space')];
        const dialog = wwui.generic('Translated from english to spanish', '*Original text:* '+ textToTranslate + textBreak +'*Translated text:* '+translatedText, buttons);
        ww.sendTargetedMessage(message.userId, annotation, dialog);
      })
      .catch(error => console.log(error))
    }
  }
  );
})

//////////////////////////////////////////
// Action: Share translated text to space
//////////////////////////////////////////
bot.on(`actionSelected:/translation-to-space`, (message, annotation, params) => {
  let translatedText = annotation.actionId.substring("translation-to-space".length+1, annotation.actionId.length);
  ww.authenticate()
    .then(token => {
      const buttons = [wwui.button('/OK', 'OK')];
      const dialog = wwui.generic('Success!', 'Successfuly shared to space.', buttons);
      ww.sendTargetedMessage(message.userId, annotation, dialog);
      ww.sendMessage(message.spaceId, {
        "type": "generic",
        "version": "1",

        "color": "#36a64f",
        "title": "Translated text",
        "text": translatedText,

        "actor": {
          "name": message.userName
        }
      })
    })
    .catch(error => console.log(error))
})