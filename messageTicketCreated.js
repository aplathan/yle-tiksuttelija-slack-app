[
    {
      "type": "header",
      "text": {
        "type": "plain_text",
        "text": "Tiketistäsi on luotu uusi palvelupyyntösi Ylen Service Deskiin",
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
        "text": tiksu_response.number + ': *<' + tiksu_url + '|' + tiksu_response.short_description + '>*';
      }
    },
    {
      "type": "section",
      "fields": [
        {
          "type": "mrkdwn",
          "text": '*Järjestelmä tai tuotantoyksikkö:*\n' + tiksu_response.u_app_or_prod_unit.display_value;
        },
        {
          "type": "mrkdwn",
          "text": '*Tiketti avattu:*\n' + tiksu_response.opened_at;
        },
        {
          "type": "mrkdwn",
          "text": '*Komponentti:*\n' + tiksu_response.cmdb_ci;
        },
        {
          "type": "mrkdwn",
          "text": '*Asiakas, jos tiedossa:*\n' + tiksu_response.caller_id.display_value;
        },
        {
          "type": "mrkdwn",
          "text": '*Palvelujono:*\n' + tiksu_response.assignment_group.display_value;
        },
        {
          "type": "mrkdwn",
          "text": '*Prioriteetti:*\n' + tiksu_response.priority;
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
        "text": tiksu_response.description;
      }
    }
  ]