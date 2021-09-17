require('dotenv').config();

const portAudio = require('naudiodon');
const { Intents, Client } = require('discord.js');
const { NoSubscriberBehavior,
  StreamType,
  createAudioPlayer,
  createAudioResource,
  entersState,
  AudioPlayerStatus,
  VoiceConnectionStatus,
  joinVoiceChannel,
} = require('@discordjs/voice')

const myIntents = new Intents()
myIntents.add(
  Intents.FLAGS.GUILDS,
  Intents.FLAGS.GUILD_VOICE_STATES,
  Intents.FLAGS.GUILD_MESSAGES,
)
const client = new Client({ intents: myIntents });

// Discord Bot Token
let discordBotToken = process.env.DISCORD_BOT_TOKEN;

// roles that are able to summon the bot into their voice channel
const roleNames = ['MusicLord'];

// samplerate to set. Adjust to your voicemeeter banana setting or just use 44100
const sampleRate = 48000;

// set the audio device ID, run `node listAudioHardware` to find out which to use, 
// or use null for the configured default device
const audioDeviceId = 2;

// Create an instance of AudioIO with inOptions, which will return a ReadableStream
let ai = null;

// voice channel status is saved for toggling on/off; assume null at first
// as obviously the bot can't be in a voice channel before its started
let channel = null;

const maxTransmissionGap = 5000

const player = createAudioPlayer({
  behaviors: {
    noSubscriber: NoSubscriberBehavior.Play,
    maxMissedFrames: Math.round(maxTransmissionGap / 20),
  },
})

player.on('stateChange', (oldState, newState) => {
  if (oldState.status === AudioPlayerStatus.Idle && newState.status === AudioPlayerStatus.Playing) {
    console.log('Playing audio output on audio player');
  } else if (newState.status === AudioPlayerStatus.Idle) {
    console.log('Playback has stopped. Attempting to restart.');
    ai.quit()
    attachRecorder();
  }
});


// Log startup message to console
client.once('ready', async () => {
  console.log(`Logged in as ${client.user.tag}!`);
  attachRecorder()
});

// waiting for message prompt
client.on('messageCreate', async message => {
  // console.log(message.member)
  if (!message.guild) return;
  if (message.author.bot) return;

  // check if the user has one of the roles set above
  let isEligible = message.member.roles.cache.find(role => roleNames.includes(role.name)).length !== 0;

  // Works like a toggle switch:
  if (message.content === '>jams') {
    // if not eligible (have the role), deny access
    if (!isEligible) {
      await message.reply('Only the enlightened may summon me.');
      return;
    }

    // if in a channel, leave the channel
    if (channel) {
      channel.leave();
      channel = null;
      ai.quit();
    } else { //if not in a voice channel...
      // Only try to join the sender's voice channel if they are in one themselves
      channel = message.member?.voice.channel;
      if (!channel) {
        await message.reply('Please join a voice channel first, then summon me.');
      } else {
        await message.reply('The Jams have been summoned!');

        const connection = await connectToChannel(channel)
        connection.subscribe(player)
      }
    }
  }
});

client.login(discordBotToken).then(console.log).catch(console.error);

async function connectToChannel(channel) {
  const connection = joinVoiceChannel({
    channelId: channel.id,
    guildId: channel.guild.id,
    adapterCreator: channel.guild.voiceAdapterCreator,
  });
  try {
    await entersState(connection, VoiceConnectionStatus.Ready, 30_000);
    return connection;
  } catch (error) {
    connection.destroy();
    throw error;
  }
}

function attachRecorder() {
  // get the default device. Set to any device id you can find, just 
  // do a console.log(portAudio.getDevices()) to find out what's your favorite device ID
  let portInfo = portAudio.getHostAPIs();
  let defaultDeviceId = portInfo.HostAPIs[portInfo.defaultHostAPI].defaultOutput;
  let defaultDevice = portAudio.getDevices().filter(device => device.id === defaultDeviceId);

  // create the transform stream
  let stream = new require('stream').Transform()
  stream._transform = function (chunk, encoding, done) {
    this.push(chunk);
    done();
  }

  // selectedvoicechannel.join()
  //   .then(connection => {
      ai = new portAudio.AudioIO({
        inOptions: {
          channelCount: 2,
          sampleFormat: portAudio.SampleFormat16Bit,
          sampleRate: sampleRate,
          deviceId: audioDeviceId !== null ? audioDeviceId : defaultDevice.id // Use -1 or omit the deviceId to select the default device
        }
      });

      // pipe the audio input into the transform stream and
      ai.pipe(stream);
      ai.start();
      // the transform stream into the discord voice channel
      player.play(createAudioResource(stream, { type: 'converted', bitrate: '128000', volume: false, highWaterMark: 12 }))
      // const dispatcher = connection.play(stream, { type: 'converted', bitrate: '128000', volume: false, highWaterMark: 12 });
      // start audio capturing

      // dispatcher.on('debug', (info) => console.log(info));
      // dispatcher.on('end', () => selectedvoicechannel.leave());
      // dispatcher.on('error', (error) => console.log(error));

    // })
    // .catch(error => {
    //   console.log(error);
    //   message.reply(`Cannot join voice channel, because ${error.message}`);
    // });
  console.log('Attached recorder - ready to go!');
}