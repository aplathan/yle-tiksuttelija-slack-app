# yle-tiksuttelija-slack-app

This Yle Tiksuttelija Slack App is Based on "Getting Started ⚡️ Bolt for JavaScript tutorial. 

At the time of forking this repo under Yleisradio account, the app is designed to be deployed using Serverless to AWS Lambda. However, [author's][6] intention is to use this as a tool to learn how code is written for Yle's AWS environment, and how deployments are managed using Terraform.

It is likely that other individuals and teams will have similar needs for simple Slack Apps in Yle Slack Workspace. The author is an amateur and has no prior first-hand experience in any of the DevOps practices required from developers working for Yle. This experiment will document what information was needed, and where this information can be found, to allow an inexperienced person to develop, test and deploy a working production quality service into a mature IaC environment.

> Slack app example from 📚 [Getting started with Bolt for JavaScript tutorial][1]

## Overview

This is a Slack app built with the [Bolt for JavaScript framework][2]. When deployed with the included configuration, a CloudFormation Stack is created including the main app as an AWS Lambda Function, API Gateway for the requests from Slack, and CloudWatch Logs for monitoring the app.

This screenshot shows the ticket creation modal and the message sent to the user after a ticket has succesfully been created.

Ticket creation is launched using a slash command that is defined in Slack App configuration. This example uses /tiksu.

![Screenshot of a ticket creation modal and the message shown after a ticke has succesfully been created.](https://github.com/aplathan/yle-tiksuttelija-slack-app/blob/main/images/tiksuttelija-screenshot.png)

## Installing

### 1. Setup environment variables

```zsh
# Replace with your signing secret and token
export SLACK_BOT_TOKEN=<your-bot-token>
export SLACK_SIGNING_SECRET=<your-signing-secret>
export TIKSU_INSTANCE=<your-service-now-host.service-now.com>
export TIKSU_USERID=<ServiceNow-user-for-integration>
export TIKSU_PASSWORD=<ServiceNow-password-for-integration>
```

### 2. Setup your local project and Serverless Framework

```zsh
# Clone this project onto your machine
git clone https://github.com/aplathan/yle-tiksuttelija-slack-app.git

# Change into the project
cd yle-tiksuttelija-slack-app/

# Install the dependencies
npm install
```

[Install Serverless][5] with your preferred method. Note that running Serverless with Node (npx serverless deploy) is very slow compared to running it netively (serverless deploy).

### 3. Testing locally

Before deploying yle-tiksuttelija-slack-app to AWS it may be a good idea to test it locally to mamke sure everything works fine with your Slack workspace.

```zsh
# Start the local deck
serverless offline --noPrependStageInUrl

# If you installed Serverless with npm, say
npx serverless offline --noPrependStageInUrl
```

[Setup ngrok][3] to create a local requests URL for development.

```zsh
npm run ngrok
npm run start
```

Set up a new Slack app in your Slack workspace and copy the url given by ngrok to your Slack app's Slash Commands page. Create New Command if you haven't done it before. Append /slack/events to the ngrok url.

```zsh
# Tell Slack where to send events when your app is invoked
https://<randomly-generated-hostname>.ngrok.io/slack/events
```

## Deploying to AWS via CloudFormation

This version doesn't work correctly in AWS Lambda.

## Contributing

### Issues and questions

Found a bug or have a question about this project? We'd love to hear from you!

1. Browse to [aplathan/yle-tiksuttelija-slack-app/issues][4]
1. Create a new issue
1. Select the `[x] examples` category

See you there and thanks for helping to improve Bolt for everyone!

[1]: https://slack.dev/bolt-js/tutorial/getting-started
[2]: https://slack.dev/bolt-js
[3]: https://slack.dev/bolt-js/tutorial/getting-started#setting-up-events
[4]: https://github.com/aplathan/yle-tiksuttelija-slack-app/issues/new
[5]: https://www.serverless.com/framework/docs/getting-started/
[6]: https://github.com/aplathan