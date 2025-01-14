# ISS Location Bot

A bot that periodically posts the location of the International Space Station to the Fediverse. Powered by [BotKit](https://botkit.fedify.dev/).

## Setup

1. Install [Deno](https://deno.land/).
2. Clone this repository.
3. Run `deno task dev` to start the bot.

## Configuration

The bot expects the following environment variables to be set:

- `SERVER_NAME` - The name of the server hosting the bot.

You can set these variables in a `.env` file in the root of the project.

## How to run the bot locally

1. Run `fedify tunnel 8000` to create a tunnel.
2. Copy the URL shown e.g. `https://xxxxxx.xxx.xx` and assign to the `SERVER_NAME` variable in the `.env` file.
3. Run `deno task dev` to start the bot.
4. Go to https://activitypub.academy/
5. Search for the bot and follow it.

## How the bot works

The bot will post the location of the ISS every hour.

You can also ask the bot "who's in space?" and it will reply with the current people in space.

## Technical details

API is from [OpenNotify](http://api.open-notify.org/).

## License

[MIT](https://cheeaun.mit-license.org/).
