// yle-tiksuttelija-slack-app
// Antti Plathan 8 Feb 2021
// antti.plathan@gmail.com

const { App, ExpressReceiver } = require('@slack/bolt');
const awsServerlessExpress = require('aws-serverless-express');
const sn = require('servicenow-rest-api');

// Exposataan custom http routerin parserit (json...)
// https://github.com/slackapi/bolt-js/issues/516
const express = require('express')

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









app.command('/tiksu', async ({ ack, body, client }) => {
  // Acknowledge the command request
  await ack();

  try {
    // Call views.open with the built-in client
    const result = await client.views.open({
      // Pass a valid trigger_id within 3 seconds of receiving it
      trigger_id: body.trigger_id,
      // View payload
      view: {
        "type": "modal",
        "submit": {
          "type": "plain_text",
          "text": "Lähetä tiketti",
          "emoji": false
        },
        "close": {
          "type": "plain_text",
          "text": "Peruuta",
          "emoji": false
        },
        "callback_id": "view-new-incident",
        "title": {
          "type": "plain_text",
          "text": "Yle Service Desk",
          "emoji": false
        },
        "blocks": [
          {
            "type": "section",
            "text": {
              "type": "mrkdwn",
              "text": ":wave: Hei!\n\n*Tarvitsetko apua tietokoneesi tai muun laitteen kanssa?*\n\nKuvaile ongelmasi tai kerro, kuinka voimme olla avuksi. Ylen Service Desk ottaa tikettisi käsittelyyn ja ohjaa sen sopivalle asiantuntijalle."
            }
          },
          {
            "type": "divider"
          },
          {
            "type": "input",
            "block_id": "short_description",
            "element": {
              "type": "plain_text_input",
              "action_id": "short_description"
            },
            "label": {
              "type": "plain_text",
              "text": "Kirjoita tiketille lyhyt mutta selkeä otsikko.",
              "emoji": false
            }
          },
          {
            "type": "input",
            "block_id": "description",
            "label": {
              "type": "plain_text",
              "text": "Kuvaile ongelma mahdollisimman yksityiskohtaisesti. Kerro kaikki mieleesi tulevat asiat, kuten miten ja milloin vika esiintyy, oletko kotona vai töissä, mitä konetta käytät, kiinteä vai langaton yhteys?",
              "emoji": false
            },
            "element": {
              "type": "plain_text_input",
              "action_id": "description",
              "multiline": true
            }
          },
          {
            "type": "section",
            "block_id": "u_app_or_prod_unit",
            "text": {
              "type": "mrkdwn",
              "text": "Valitse järjestelmä tai tuotantoyksikkö, jos tiedossa.\nJätä muussa tapauksessa tyhjäksi."
            },
            "accessory": {
              "type": "static_select",
              "placeholder": {
                "type": "plain_text",
                "text": "Valitse...",
                "emoji": false
              },
              "options": [
                {
                  "text": {
                    "type": "plain_text",
                    "text": "Analytiikka",
                    "emoji": true
                  },
                  "value": "Analytiikka"
                },
                {
                  "text": {
                    "type": "plain_text",
                    "text": "Areena Bigscreen",
                    "emoji": true
                  },
                  "value": "Areena Bigscreen"
                },
                {
                  "text": {
                    "type": "plain_text",
                    "text": "Audiotuotanto",
                    "emoji": true
                  },
                  "value": "Audiotuotanto"
                }
              ],
              "action_id": "u_app_or_prod_unit"
            }
          }
        ]
      }
    });
    console.log(result);
  }
  catch (error) {
    console.error(error);
  }

  
  // ServiceNow
  const ServiceNow = new sn(process.env.TIKSU_INSTANCE, process.env.TIKSU_USERID, process.env.TIKSU_PASSWORD);
  try {
    await ServiceNow.Authenticate();
  }
  catch (error) {
    console.error(error);
  }


});





// Handle a view_submission event
app.view('view-new-incident', async ({ ack, body, view, client }) => {
  // Acknowledge the view_submission event
  await ack();

  const userid = body['user']['id'];
  const short_description = view['state']['values']['short_description']['short_description'];
  const description = view['state']['values']['description']['description'];
  const u_app_or_prod_unit = view['state']['values']['u_app_or_prod_unit']['u_app_or_prod_unit'];
  
  console.log(u_app_or_prod_unit.selected_option.value);
  console.log(short_description.value);
  console.log(description.value);
  console.log(userid);


 


  
    // Message to send user
    let msg = '';
    // Save to DB
    //const results = await db.set(user.input, val);

    //if (results) {
    if (true) {  
      // DB save was successful
      msg = 'Tiketin lähettäminen onnistui.';
    } else {
      msg = 'Tiketin lähettäminen ei onnistunut.';
    }

    // Message the user
    try {
      await client.chat.postMessage({
        channel: userid,
        text: msg
      });
    }
    catch (error) {
      console.error(error);
    }


const incidentData={
  'caller_id':'antti.plathan@yle.fi',
  'u_app_or_prod_unit':'Escenic',
  'cmdb_ci':'Escenic MySQL',
  'priority':'3 - Normal',
  'short_description':'Testitiketti 1 Slackista REST-apin kautta.',
  'assignment_group':'Service Desk',
  'description':'Testitiketin pidempi kuvaus\r\n\r\nt. Antti'
};

/*
# Toimii

ServiceNow.createNewTask(incidentData, 'incident', res => {
  console.log(res);
});
*/







});





// Handle the Lambda function event
module.exports.handler = (event, context) => {
  console.log('yle-tiksuttelija-slack-app is running!');
  awsServerlessExpress.proxy(server, event, context);
};
