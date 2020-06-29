# Bazcal Bot

A highly customizable discord bot for Hypixel bazaar trading.

# Features

## Built-in commands

- Advise
    - Simple flipping command
- Notif
    - Advanced bazaar trading. The bot tell you what to create buy orders for and notifies you when to create the sell orders for maximum profits. 
- Lookup
    - Returns info regarding an item

## Scripting

Bazcal has a custom scripting language I like to call BScript. This allows you to make your own custom commands without coding your own bot from scratch. The language is brand new so the features are still lacking but I'll be adding more features as time goes by.

For more info on how to use BScript read BScript.md

# Roadmap

Bazcal is slowly becoming more than a simple bazaar trading bot and more a general purpose, scriptable bot. In the future we might branch of this bot more into that direction.

# Setup

## Prerequisites

The program runs in docker so make sure you have that installed, the guide shows how to deploy with the docker-compose container orchestrator so install that too if you want to follow along with the guide in this README.

- ArchLinux useful links and commands:
    - Docker setup: https://wiki.archlinux.org/index.php/docker#Installation
    - docker-compose: `pip install docker-compose`

## Deployment

First, Clone this repo if you haven't already

```
git clone https://github.com/Wykerd/bazcal-api.git
```

Next setup the environment variables for the bot in the `docker-compose.yml` file

- API_KEY: Your hypixel api key
- DISCORD_KEY: Your discord bot token

Lastly build and deploy with docker-compose

```
docker-compose up --build
```

## Server Config

Run `!bz init` to generate a default config for your server. 

### Config options

- `advice_defaults`
    - `timeframe` - the default timeframe in minutes (default: 15)
    - `include_stablity` - if true only includes flips with increasing sell prices (default: false)
- `message_templates`
    - I'm not gonna document this yet I'm lazy
- `bscipt`
    - `force_channel_messages` - forces messages to be sent in the private channel instead of current channel when using `get_current_channel` (default: false)
    - `send_message_limit` - sets the maximum of times `send_message` may be called. (default: 5)

### Changing config options

No simple interface implimented yet! Help would be appreciated or I'll will work on it on a later date.

# License

Copyright Daniel Wykerd, Dirk Beukes 2020

```
Bazcal is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

Bazcal is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with Bazcal.  If not, see <https://www.gnu.org/licenses/>.
```

**NOTE:** This software depends on other packages that may be licensed under different open source licenses.