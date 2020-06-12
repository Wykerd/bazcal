# Bazcal Bot

A Discord bot for bazaar trading.

# Backstory

This bot is the successor to a bot made initially for fun by [Jakkalsie](https://github.com/Jakkalsie) / Vent#9459.

He got involved in making bots for Nert#2599 aka [NertCoding](https://github.com/NertCoding)'s discord server Skyblock Stock Brokers. At this point Vent got in contact with me to help him out with the bot as he was still relatively new to the javascript ecosystem. 

So came to existance `Bazcal` _improved version_ with a superior algorithm and feature set to the original `Bazcal`

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

# Usage

The main command for the bot is `!bz notif <amount>` but the bot also uses the NLP capablities of [@wykerd/discord-framework](https://github.com/Wykerd/discord-framework) so you can also access it with chat messages along the line of `Bazcal, I have 137k coins, can you advise me on how to invest it?` (it requires the words bazcal, bz or baz to be present in the message to detect it)

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