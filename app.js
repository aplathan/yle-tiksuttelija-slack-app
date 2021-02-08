// yle-tiksuttelija-slack-app
// Antti Plathan 8 Feb 2021
// antti.plathan@gmail.com

const { App, ExpressReceiver } = require('@slack/bolt');
const awsServerlessExpress = require('aws-serverless-express');
const sn = require('servicenow-rest-api');

// Exposataan custom http routerin parserit (json...)
// https://github.com/slackapi/bolt-js/issues/516
const express = require('express')

// ServiceNow
const ServiceNow = new sn(process.env.TIKSU_INSTANCE, process.env.TIKSU_USERID, process.env.TIKSU_PASSWORD);
ServiceNow.Authenticate();

/*
// Tämä toimii

const fields=[
  'number', // 'INCYLE0547229'
  'caller_id', // display_value: 'Antti Plathan'
  'u_app_or_prod_unit', // 'Escenic'
  'cmdb_ci', // 'Escenic MySQL'
  'priority', // '3 - Normal'
  'short_description',
  'assignment_group', // 'Service Desk'
  'description'
];

const filters=[
  //'urgency=1'
  //'caller_id=36f2d319ecb349004f8b8dc0c754ba25',
  'number=INCYLE0547229'
];

ServiceNow.getTableData(fields,filters,'incident',function(res){
  console.log(res);
});
*/

/*
# Toimii

const incidentData={
  'caller_id':'antti.plathan@yle.fi',
  'u_app_or_prod_unit':'Escenic',
  'cmdb_ci':'Escenic MySQL',
  'priority':'3 - Normal',
  'short_description':'Testitiketti 1 Slackista REST-apin kautta.',
  'assignment_group':'Service Desk',
  'description':'Testitiketin pidempi kuvaus\r\n\r\nt. Antti'
};

ServiceNow.createNewTask(incidentData, 'incident', res => {
  console.log(res);
});
*/



const incidentData={
  'caller_id':'Antti Plathan',
  'u_app_or_prod_unit':'Esko',
  'cmdb_ci':'',
  'priority':'3 - Normal',
  'short_description':'Testitiketti 1 Slackista REST-apin kautta.',
  'assignment_group':'Service Desk',
  'description':'Testitiketin pidempi kuvaus\r\n\r\nt. Antti'
};

ServiceNow.createNewTask(incidentData, 'incident', res => {
  console.log(res);
});



// Initialize your custom receiver
const expressReceiver = new ExpressReceiver({
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  processBeforeResponse: true
});

// Initializes your app with your bot token and the AWS Lambda ready receiver
const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  receiver: expressReceiver
});

// Initialize your AWSServerlessExpress server using Bolt's ExpressReceiver
const server = awsServerlessExpress.createServer(expressReceiver.app);


app.command('/tiksu', async ({ command, ack, say, client, body }) => {
  await ack();

  console.log("Tultiin komennon sisään.");
  console.log(command);
  console.log(command.text);
  await say('Tähän tulee vastaus Tiksusta.');



  /*

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

  */




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
