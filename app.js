// yle-tiksuttelija-slack-app
// Antti Plathan 6 Feb 2021
// antti.plathan@gmail.com

const { App, ExpressReceiver } = require('@slack/bolt');
const awsServerlessExpress = require('aws-serverless-express');

// Exposataan custom http routerin parserit (json...)
// https://github.com/slackapi/bolt-js/issues/516
const express = require('express')


// Initialize your custom receiver
const expressReceiver = new ExpressReceiver({
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  // The `processBeforeResponse` option is required for all FaaS environments.
  // It allows Bolt methods (e.g. `app.message`) to handle a Slack request
  // before the Bolt framework responds to the request (e.g. `ack()`). This is
  // important because FaaS immediately terminate handlers after the response.
  processBeforeResponse: true
});

// Initializes your app with your bot token and the AWS Lambda ready receiver
const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  receiver: expressReceiver
});

// Initialize your AWSServerlessExpress server using Bolt's ExpressReceiver
const server = awsServerlessExpress.createServer(expressReceiver.app);

// Luodaan dictionary sivujen hakusanoista ja niiden mäppäylsistä TTV-sivunmeroihin
var pageDict = {
  "etusivu": 100, 
  "hakemistot": 199,
  "kotimaa": 102,
  "ulkomaat": 130,
  "talous": 160,
  "sää": 400,
  "liikenne": 400,
  "urheilu": 201,
  "nhl": 235,
  "änäri": 235,
  "eurojalkapallo": 600,
  "jalkapallo": 600,
  "fudis": 600,
  "veikkaus": 470,
  "tv-ohjelmat": 300,
  "tv": 300,
  "ohjelmat": 300,
  "ohjelmaopas": 350,
  "opas": 350,
  "alueuutiset": 500,
  "news": 190,
  "english": 190,
  "newsinenglish": 190,
  "svenska": 700,
  "påsvenska": 700,
  "viikkomakasiini": 800,
  "viikko": 800,
  "makasiini": 800
};

app.command('/tiksu', async ({ command, ack, say, client, body }) => {
  await ack();

  console.log(command);
  console.log(command.text);

  // Parsitaan käyttäjän antamasta komennosta vain ensimmäinen parametri
  const requestedPage = (command.text).split(' ')[0];
  console.log(requestedPage);
  // ttvPage pysyy falsena ellei pyynnöst löydy validia sivupyyntöä
  var ttvPage = false;

  // Löytyykö pyydetty sivu dictionarystä? Samalla se tarkoittaa myös sitä, että pyyntö ei ollut numero
  if (requestedPage in pageDict) {
    console.log("Sivu löytyy dictionarystä! Asetetaan näytettäväksi TTV-sivuksi:");
    // Haetaan dictionarystä pyydettyä osastoa vastaava ttv-sivunumero
    ttvPage = pageDict[requestedPage]; 
    console.log(ttvPage);
  } else if (isNaN(requestedPage)) {
      // Jos pyyntö ei ole numero (ei ole suoraa testiä sille, että ON numero), ttvPage pysyy falsena ja käyttäjälle tullaan näyttämään helppi
      console.log("Pyydetty sivu ei ole numero eikä kuulu tunnettujen osastojen joukkoon:");
      console.log(requestedPage);
      ttvPage = false; // Redundantti, mutta luettavuuden helpottamiseksi
    } else {
        // Nyt tiedetään, että pyyntö oli numero. Muutetaan se kokonaisluvuksi
        const pageNumber = parseInt(requestedPage, 10);

        // Ylen TTV:n sallitut sivunumerot ovat 100-899
        if (pageNumber > 99 && pageNumber < 900) {
          console.log("Sivunumero on sallituissa rajoissa.");
          ttvPage = pageNumber; // Asetetaan haettava TTV-sivunumero
        } else {
          console.log("Sivunumero ei ole sallituissa rajoissa!");
          ttvPage = false; // Redundantti, mutta luettavuuden helpottamiseksi
        }
      }
     
  
  if (ttvPage) {
    // Näytettävä sivu tiedetään, yritetään näyttää se
    console.log("Perillä ollaan, yritetään näyttää pyydetty sivunumero: ");
    console.log(ttvPage);

    await say({
      text: `https://external.api.yle.fi/v1/teletext/images/${ttvPage}/1.png?${process.env.TTV_API_KEY}`,
      replace_original: false,
      response_type: `ephemeral`,
      unfurl_links: true,
      unfurl_media: true
    });
  } else {
    // Kelvollista TTV-sivua ei voitu asettaa, näytetään helppi käyttäjälle
    console.log("Loppuun päädyttiin, mutta käyttäjän syötteestä ei tunnistettu oikeaa sivunumeroa tai osastoa, tai pyyntö oli help:")
    console.log(ttvPage);

    await say({
      response_type: 'ephemeral',
      text: 'Näin käytät /ttv -komentoa:',
      attachments:[
          {
              text:'Anna haettavan TTV-sivun numero `/ttv 100` tai osaston nimi `/ttv kotimaa`.\nOsastojen nimet ovat `etusivu`, `hakemistot`, `kotimaa`, `ulkomaat`, `talous`, `sää`, `liikenne`, `urheilu`, `nhl`, `eurojalkapallo`, `veikkaus`, `tv-ohjelmat`, `ohjelmaopas`, `alueuutiset`, `news`, `svenska`, `viikkomakasiini`.\n'
          }]
    });    
  }

  


});  





// Tämä ei ole nyt käytössä, muista poistaa 
// Listening get requests from external sources, mainly for testing
expressReceiver.router.get('/test', (req, res) => {
  // You're working with an express req and res now.
  res.send('yay, get!');
});


// Handle the Lambda function event
module.exports.handler = (event, context) => {
  console.log('⚡️ Bolt app is running!');
  awsServerlessExpress.proxy(server, event, context);
};
