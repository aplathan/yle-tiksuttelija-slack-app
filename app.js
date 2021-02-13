'use strict'

const { App, ExpressReceiver } = require('@slack/bolt');
const awsServerlessExpress = require('aws-serverless-express');
const axios = require('axios').default;
//const sn = require('servicenow-rest-api');

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

// Bolt method to handle incoming Slack command event. A new modal view is created as a response.
app.command('/tiksu', async ({ ack, body, client }) => {
  await ack();

  try {
    const result = await client.views.open({
      // Pass a valid trigger_id within 3 seconds of receiving it
      trigger_id: body.trigger_id,
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
  }
  catch (error) {
    console.error(error);
  }
});


// Bolt method to handle incoming Slack view_submission events
app.view('view-new-incident', async ({ ack, body, view, client }) => {
  await ack();

  // Parse the 'view' payload to get user input from modal view's input blocks.
  // View object is a dictionary consisting of modal's [block_id](s) and [action_id](s)
  // Figuring out the data model can be a little trial and error, as the view payload's
  // json may contain both simple key-value pairs, but also objects as the values.
  const short_description = view['state']['values']['short_description']['short_description'].value;
  const description = view['state']['values']['description']['description'].value;
  const u_app_or_prod_unit = view['state']['values']['u_app_or_prod_unit']['u_app_or_prod_unit']['selected_option'].value;
  
  // Full Slack user profile, we need this to get user's email address
  const user_id = body['user']['id'];
  const user = await client.users.profile.get({ user: user_id });

  const newIncidentData = {
    'caller_id': user.profile.email,
    'u_app_or_prod_unit': u_app_or_prod_unit,
    'short_description': short_description,
    'assignment_group': 'Service Desk',
    'description': description
  };

  let msg = "Jokin meni pieleen, koska tätä ei pitäisi koskaan nähdä.";
  // Tiksu-tiketin voi tehdä vain yleläinen. Koska js on event-pohjainen, aloitetaan 
  // nopeimmasta operaatiosta ja jätetään hidas rest-kutsu Tiksuun viimeiseksi.
  if (!user.profile.email.endsWith("@yle.fi")) {
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
      try {
        const options = {
            url:'https://' + process.env.TIKSU_INSTANCE + '/api/now/table/incident?sysparm_input_display_value=true&sysparm_display_value=true',
            method:'post',
            headers:{
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            data: newIncidentData,
            auth:{
                username: process.env.TIKSU_USERID,
                password: process.env.TIKSU_PASSWORD
            }
        };
        // Tämä on varsinainen kutsu ServiceNowiin
        var tiksu_res = await axios(options);
        var res = tiksu_res.data.result;
        // console.log(res);

        var tiksu_url = 'https://yletest.service-now.com/incident.do?sys_id=' + res.sys_id;
        msg = 'Tiketin lähettäminen onnistui. Voit seurata tikettisi etenemistä Tiksussa: <' + tiksu_url + '|' + res.number + '>';

        try {
          await client.chat.postMessage({
            channel: user_id,
            text: msg,
            blocks: [
              {
                "type": "header",
                "text": {
                  "type": "plain_text",
                  "text": "Tiketistäsi on luotu uusi palvelupyyntö Ylen Service Deskiin",
                  "emoji": false
                }
              },
              {
                "type": "divider"
              },
              {
                "type": "section",
                "text": {
                  "type": "mrkdwn",
                  "text": res.number + ': *<' + tiksu_url + '|' + res.short_description + '>*'
                }
              },
              {
                "type": "section",
                "fields": [
                  {
                    "type": "mrkdwn",
                    "text": '*Järjestelmä tai tuotantoyksikkö:*\n' + res.u_app_or_prod_unit.display_value
                  },
                  {
                    "type": "mrkdwn",
                    "text": '*Tiketti avattu:*\n' + res.opened_at
                  },
                  {
                    "type": "mrkdwn",
                    "text": '*Komponentti:*\n' + res.cmdb_ci
                  },
                  {
                    "type": "mrkdwn",
                    "text": '*Asiakas, jos tiedossa:*\n' + res.caller_id.display_value
                  },
                  {
                    "type": "mrkdwn",
                    "text": '*Palvelujono:*\n' + res.assignment_group.display_value
                  },
                  {
                    "type": "mrkdwn",
                    "text": '*Prioriteetti:*\n' + res.priority
                  }
                ]
              },
              {
                "type": "divider"
              },
              {
                "type": "section",
                "text": {
                  "type": "mrkdwn",
                  "text": res.description
                }
              }
            ]
          });
        }
        catch (error) {
          console.error(error);
          msg = 'Tiketin lähettäminen ei onnistunut.';

          try {
            await client.chat.postMessage({
              channel: user_id,
              text: msg
            });
          }
          catch (error) {
            console.error(error);
          }
        }
      } catch (err) {
          console.error(err);
      }
    }
});

// Handle the Lambda function event
module.exports.handler = (event, context) => {
  console.log('yle-tiksuttelija-slack-app is running!');
  awsServerlessExpress.proxy(server, event, context);
};