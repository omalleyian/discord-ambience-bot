require('dotenv').config();

const portAudio = require('naudiodon');
const Discord = require('discord.js');
const client = new Discord.Client();

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
let selectedvoicechannel = null;
// Log startup message to console
client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

// waiting for message prompt
client.on('message', async message => {
  if (!message.guild) return;
  if (message.author.bot) return;
  console.log (message.author);

  // check if the user has one of the roles set above
  let isEligible = message.member.roles.cache.array().filter(Role => roleNames.includes(Role.name)).length !== 0;

// Works like a toggle switch:
  if (message.content === '>jams') {
  // if not eligible (have the role), deny access
  if (!isEligible) {
    message.reply('Only the enlightened may summon me.');
    return;
  }
    // if in a channel, leave the channel
    if (selectedvoicechannel) {
      message.reply('Jam on!');
      selectedvoicechannel.leave();
      selectedvoicechannel = null;
      ai.quit();
    } else { //if not in a voice channel...
      // Only try to join the sender's voice channel if they are in one themselves
      selectedvoicechannel = message.member.voice.channel;
      if (!selectedvoicechannel) {
        message.reply('Please join a voice channel first, then summon me.');
      } else {
        message.reply('The Jams have been summoned!');

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
        selectedvoicechannel.join()
        .then(connection => {
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
          // the transform stream into the discord voice channel
          const dispatcher = connection.play(stream, { type: 'converted', bitrate: '128000', volume: false, highWaterMark: 12 });
          // start audio capturing
          ai.start();

          dispatcher.on('debug', (info) => console.log(info));
          dispatcher.on('end', () => selectedvoicechannel.leave());
          dispatcher.on('error', (error) => console.log(error));

        })
        .catch(error => {
          console.log(error);
          message.reply(`Cannot join voice channel, because ${error.message}`);
        });
      }
    }
  }
});

client.login(discordBotToken).then(console.log).catch(console.error);
