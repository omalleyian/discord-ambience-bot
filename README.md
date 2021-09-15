# Stream your local music directly into your RPG Session on Discord
There are several solutions streaming your local audio directly into Discord, many invovle PulseAudio or Voicemeeter (Banana/ Potato). The audio quality for me was never sufficient.

By registering a bot on the Discord Site, then running this bot locally and inviting it to your own Discord server, you have a much higher quality of your current audio stream with minimal config

## Configuration

### Local Environment

- Requires `Node >=16.6.0`

### Setting up Discord

1. Go to the [Discord Developer Portal](https://discordapp.com/developers/applications/) and register a new application.
2. On the `General Information`-Tab: Provide a App Icon and a Name
3. On the `OAuth2`-Tab: Check the `bot` scope, then copy the generated oAuth link into your clipboard
4. On the same tab, check the following permissions: `Voice Permissions/Connect` and `Voice Permissions/speak`
5. On the `Bot`-Tab: Upload an App Icon and copy the bot token, insert that into the `.env´ file locally
6. Go to the copied oauth2 URL and invite the bot to the desired server.

### Setup Audio Loopback device

Naudiodon is only able to caputre output sound, not output devices. So, you will be unable to record audio from a monitor or optical out. Install an virtual audio loopback device in order to allow the bot to record audio from a program like Spotify.

#### Windows 

VB-Audio Software offers [VB-CABLE Virtual Device](https://vb-audio.com/Cable/) that forwards all audio coming in the CABLE input to the CABLE output device.

1. Install VB-CABLE Virtual Audio Device
2. Find the CABLE Output device id (see below)
3. Set your music software of choice to output to CABLE Input

### Get your Audio Device
Run `node listAudioHardware` to get the ID of your desired audo device and insert that into the variable `audioDeviceId` in `index.js`. 

### Permissions
Change `roleNames` to any Role Name that should be able to use the bot. **Note:** they still must have the `index.js` on their computer and need to run through the requirements above to prepare a work environment for the locally run bot.

### Start Server

`node ./index.js`

## Bot Usage

1. Connect to your Discord server
2. Go into a voice Channel
3. `>jams` summons the bot into your channel, it starts playing audio right away
4. `>jams` again will disconnect the bot from the current audio channel