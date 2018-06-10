# NBA-Chatbot
A line chatbot built to report NBA live stats

<img src="https://github.com/johnhckuo/NBA-Chatbot/raw/master/qrcode.png">

## Features

* Team Subscription
* Team Leaders Lookup
* Team Roster Lookup
* Playoffs Schedule
* Game Result Lookup

## Installation and Building

```bash
# clone repository
git clone https://github.com/johnhckuo/NBA-Chatbot.git
cd NBA-Chatbot

# install required packages and dependencies
npm install

# build and run locally
npm run dev

# If you wish to test this bot locally, please download ngrok(https://ngrok.com) first and execute it
./ngrok http 8080

# ngrok will show you the following info
ngrok by @inconshreveable
Session Status                online
Session Expires               5 hours, 15 minutes
Version                       2.2.8
Region                        United States (us)
Web Interface                 http://127.0.0.1:4040
Forwarding                    http://35fea9c2.ngrok.io -> localhost:8080
Forwarding                    https://35fea9c2.ngrok.io -> localhost:8080  

# copy the Forwarding URL, which is http://35fea9c2.ngrok.io in our example, to the Webhook URL of your line chatbot

```

## Powered by
- [Line Messaging API](https://developers.line.me/en/)
- [Express](http://expressjs.com)
- [Heroku](https://www.heroku.com/)
- [ngrok](https://ngrok.com)
