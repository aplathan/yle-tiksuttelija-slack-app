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

// Kuunnellaan /tiksu -läsykomentoa ja avatan käyttäjälle uusi modaali
app.command('/tiksu', async ({ ack, body, client }) => {
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
    // console.log(result); // tätä on turha enää logittaa
    console.log('Modaali avattu onnistuneesti.')
  }
  catch (error) {
    console.error(error);
  }
});


// Handler for processing data sent from the new incident modal
app.view('view-new-incident', async ({ ack, body, view, client }) => {
  await ack();

  const ServiceNow = new sn(process.env.TIKSU_INSTANCE, process.env.TIKSU_USERID, process.env.TIKSU_PASSWORD);

  // Aloitetaan Tiksuun autentikoituminen mahdollisimman varhaisessa vaiheessa
  try {
    ServiceNow.Authenticate();
    // Voiko tässäkin käyttää callback-funktiota? Tyyliin
    // ServiceNow.Authenticate(res => { console.log(res) });
  }
  catch (error) {
    console.error(error);
  }

  // Kerätään lomakkeella annetut tiedot
  const user_id = body['user']['id'];
  const short_description = view['state']['values']['short_description']['short_description'].value;
  const description = view['state']['values']['description']['description'].value;
  const u_app_or_prod_unit = view['state']['values']['u_app_or_prod_unit']['u_app_or_prod_unit']['selected_option'].value;
  
  // Kysytään Slack API:lta käyttäjän profiilia ja sieltä sähköpostiosoite. Näitä tietoja ei saa suoraan eventin mukana
  try {
    var user = await client.users.profile.get({ user: user_id });
    var user_email = user.profile.email;

    // Nyt kaikki tarvittava tieto uutta tikettiä varten on kasassa
    var newIncidentData={
      'caller_id': user_email,
      'u_app_or_prod_unit': u_app_or_prod_unit,
      'short_description': short_description,
      'assignment_group': 'Service Desk',
      'description': description
    };
    console.log(newIncidentData);  
  }
  catch (error) {
    console.error(error);
  }

  let msg = "Jokin meni pieleen, koska tätä ei pitäisi koskaan nähdä.";
  // Tiksu-tiketin voi tehdä vain yleläinen. Koska js on event-pohjainen, aloitetaan 
  // nopeimmasta operaatiosta ja jätetään hidas rest-kutsu Tiksuun viimeiseksi.
  if (!user_email.endsWith("@yle.fi")) {
    msg = 'Tiketin voi tehdä vain käyttäjä, jolla on Ylen sähköpostiosoite.';

    try {
        client.chat.postMessage({
          channel: user_id,
          text: msg
      });
    }
    catch (error) {
      console.error(error);
    }
  } else {
      // Eli nyt käyttäjällä tiedetään olevan yle-osoite
      try{
        ServiceNow.createNewTask(newIncidentData, 'incident', res => {
          var tiksu_response = res;
          var sys_id = tiksu_response.sys_id;
          var tiksu_id = tiksu_response.number;
          var tiksu_url = 'https://yletest.service-now.com/incident.do?sys_id=' + sys_id;
          msg = 'Tiketin lähettäminen onnistui. Voit seurata tikettisi etenemistä Tiksussa: <' + tiksu_url + '|' + tiksu_id + '>';
          // msg = 'Tiketin lähettäminen onnistui.';
          
          try {
            client.chat.postMessage({
              channel: user_id,
              text: msg
            });
          }
          catch (error) {
            console.error(error);
          }

        });
      }
      catch (error) {
        console.error(error);
        msg = 'Tiketin lähettäminen ei onnistunut.';

        try {
          client.chat.postMessage({
            channel: user_id,
            text: msg
          });
        }
        catch (error) {
          console.error(error);
        }
      }
    }
  

});





// Handle the Lambda function event
module.exports.handler = (event, context) => {
  console.log('yle-tiksuttelija-slack-app is running!');
  awsServerlessExpress.proxy(server, event, context);
};


/*

  let msg = "Tiketin lähettäminen onnistui.";
  // Tarkistetaan, onko tiketin tekijä yleläinen
  if (user_email.endsWith("@yle.fi")) {
     const incidentData={
      'caller_id': user_email,
      'u_app_or_prod_unit': u_app_or_prod_unit,
      'short_description': short_description,
      'assignment_group': 'Service Desk',
      'description': description
    };
    
    try{
      ServiceNow.createNewTask(incidentData, 'incident', res => {
        var tiksu_response = res;
        //var sys_id = tiksu_response.sys_id;
        //var tiksu_id = tiksu_response.number;
        //var tiksu_url = 'https://yletest.service-now.com/incident.do?sys_id=' + sys_id;
        //msg = 'Tiketin lähettäminen onnistui. Voit seurata tikettisi etenemistä Tiksussa: <' + tiksu_url + '|' + tiksu_id + '>';
        msg = 'Tiketin lähettäminen onnistui.';
      });
    }
    catch (error) {
      console.error(error);
      msg = 'Tiketin lähettäminen ei onnistunut.';
    }
  } else {
    msg = 'Tiketin voi tehdä vain käyttäjä, jolla on Ylen sähköpostiosoite.';
  }

*/
