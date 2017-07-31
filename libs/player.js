const YoutubeDL = require('youtube-dl');
const ytdl = require('ytdl-core');
const Youtube = require('youtube-api');

const MusicQueue = require('./MusicQueue');
const SettingsProfile = require('./SettingsProfile');

const { promisify } = require('util');
const _ = require('lodash');

module.exports = class Player {

    constructor(client, options) {
        this.client = client;

        // Get all options.
        this.GLOBAL = (options && options.global) || false;
        this.MAX_QUEUE_SIZE = (options && options.maxQueueSize) || 20;
        this.DEFAULT_VOLUME = (options && options.volume) || 50;
        this.ALLOW_ALL_SKIP = (options && options.anyoneCanSkip) || false;
        this.CLEAR_INVOKER = (options && options.clearInvoker) || false;
        this.CHANNEL = (options && options.channel) || false;

        // Create an object of queues.
        this.queues = {};

        // Create an object of djs
        this.djs = {};

        // Create an object of setting profiles.
        this.settings = {};
    }

    /**
     * Checks if the user is a DJ.
     * @param {GuildMember} member - The guild member
     * @param {string} guildId  - The guild ID
     * @returns {boolean} - Whether the member is a DJ or not
     */
    isDJ(member, guildId) {
        // admin permission can do anything
        if (member.hasPermission("ADMINISTRATOR")) {
            return true;
        }
        // if not admin, look for specific DJ roles
        const memberRoles = member.roles.map(role => role.name);
        const djRoles = this.djs[guildId];
        return djRoles ? memberRoles.some(r => djRoles.includes(r)) : false;
    }

    /**
     * Gets the song queue of the server.
     *
     * @param {integer} server - The server id.
     * @returns {object} - The song queue.
     */
    getQueue(server) {
        // Check if global queues are enabled.
        if (this.GLOBAL) server = '_'; // Change to global queue.

        // Return the queue. TODO:  add autoplay option logic
        if (!this.queues[server]) this.queues[server] = new MusicQueue(true);
        return this.queues[server];
    }

    getSettings(server) {
        if (!this.settings[server]) this.settings[server] = new SettingsProfile(server);
        return this.settings[server];
    }

    /**
     * The command for adding a song to the queue.
     *
     * @param {Message} msg - Original message.
     * @param {string} suffix - Command suffix.
     * @returns {<promise>} - The response edit.
     */
    play(msg, suffix, autoplay) {
        // Make sure the user is in a voice channel.
        if (!this.CHANNEL && msg.member.voiceChannel === undefined) return msg.channel.send(this.wrap('You\'re not in a voice channel.'));

        // Make sure the suffix exists.
        if (!suffix) return msg.channel.send(this.wrap('No video specified!'));

        // Get the queue.
        const queue = this.getQueue(msg.guild.id);

        // Check if the queue has reached its maximum size.
        if (queue.size() >= this.MAX_QUEUE_SIZE) {
            return msg.channel.send(this.wrap('Maximum queue size reached!'));
        }

        // Get the video information.
        return msg.channel.send(this.wrap('Searching...')).then(response => {
            var searchstring = suffix
            if (!suffix.toLowerCase().startsWith('http')) {
                searchstring = 'ytsearch1:' + suffix;
            }
            return YoutubeDL.getInfo(searchstring, ['-q', '--no-warnings', '--force-ipv4'], { maxBuffer: Infinity }, (err, info) => {
                // Verify the info.
                if (err || info.format_id === undefined || info.format_id.startsWith('0')) {
                    if (err) console.log(err);
                    return response.edit(this.wrap('Invalid video!'));
                }

                info.requester = msg.author.id;
                let msgPrefix = 'Queued';
                if (autoplay) {
                    msgPrefix = 'Autoplay';
                }
                // Queue the video.
                response.edit(this.wrap(`${msgPrefix}: ${info.title}`)).then(() => {
                    info.requestedBy = msg.member.nickname ? msg.member.nickname : msg.author.username;
                    queue.push(info);
                    // Play if only one element in the queue.
                    if (queue.current === null) this.executeQueue(msg, queue);
                }).catch(console.log);
            });
        });
    }


    /**
     * The command for skipping a song.
     *
     * @param {Message} msg - Original message.
     * @param {string} suffix - Command suffix.
     * @returns {<promise>} - The response message.
     */
    skip(msg, suffix) {
        console.log('inside skip');
        // Get the voice connection.
        const voiceConnection = this.client.voiceConnections.find(val => val.channel.guild.id == msg.guild.id);
        if (voiceConnection === null) return msg.channel.send(this.wrap('No music being played.'));

        // Get the queue.
        const queue = this.getQueue(msg.guild.id);

        // Get the number to skip.
        let toSkip = 1; // Default 1.
        if (!isNaN(suffix) && parseInt(suffix) > 0) {
            toSkip = parseInt(suffix);
        }
        toSkip = Math.min(toSkip, queue.size());

        // Skip.
        queue.skip(toSkip);

        // Resume and stop playing.
        const dispatcher = voiceConnection.player.dispatcher;
        if (voiceConnection.paused) dispatcher.resume();
        dispatcher.end();

        msg.channel.send(this.wrap('Skipped ' + toSkip + '!'));
    }

    /**
     * The command for listing the queue. poop
     *
     * @param {Message} msg - Original message.
     */
    queue(msg) {
        // Get the queue.
        const queue = this.getQueue(msg.guild.id);

        let text = queue.size() <= 0 ? '- Nothing in queue -\n' : queue.songs.map((video, index) => (
            `${(index + 1)} : ${video.title} requested by ${video.requestedBy}`
        )).join('\n');;
        if (queue.current) {
            text = `▶ ${queue.current.title} requested by ${queue.current.requestedBy}\n\n` + text + `\n`;
        }
        if (queue.size() <= 0 && queue.autoplay && queue.autoplayNext) {
            text += `♫ Autoplay: ${queue.autoplayNext.title}\n`;
        }

        // Get the status of the queue.
        let queueStatus = 'Stopped';
        const voiceConnection = this.client.voiceConnections.find(val => val.channel.guild.id == msg.guild.id);
        if (voiceConnection !== null) {
            const dispatcher = voiceConnection.player.dispatcher;
            if (dispatcher) {
                queueStatus = dispatcher.paused ? 'Paused' : 'Playing';
            }
        }
        // Send the queue and status.
        return msg.channel.send(this.wrap('Queue (' + queueStatus + '):\n' + text));
    }

    /**
     * The command for pausing the current song.
     *
     * @param {Message} msg - Original message.
     * @param {string} suffix - Command suffix.
     * @returns {<promise>} - The response message.
     */
    pause(msg, suffix) {
        // Get the voice connection.
        const voiceConnection = this.client.voiceConnections.find(val => val.channel.guild.id == msg.guild.id);
        if (voiceConnection === null) return msg.channel.send(this.wrap('No music being played.'));

        // Pause.
        msg.channel.send(this.wrap('Playback paused.'));
        const dispatcher = voiceConnection.player.dispatcher;
        if (!dispatcher.paused) dispatcher.pause();
    }

    /**
     * The command for leaving the channel and clearing the queue.
     *
     * @param {Message} msg - Original message.
     * @param {string} suffix - Command suffix.
     * @returns {<promise>} - The response message.
     */
    async leave(msg, suffix) {
        console.log('inside leave');
        // if (this.isAdmin(msg.member)) {
        const voiceConnection = this.client.voiceConnections.find(val => val.channel.guild.id == msg.guild.id);
        if (voiceConnection === null) return msg.channel.send(this.wrap('I\'m not in any channel!.'));
        // Clear the queue.
        const queue = this.getQueue(msg.guild.id);
        queue.clear();

        // End the stream and disconnect.
        return await voiceConnection.player.dispatcher.end();
    }

    /**
     * The command for clearing the song queue.
     *
     * @param {Message} msg - Original message.
     * @param {string} suffix - Command suffix.
     */
    clearqueue(msg, suffix) {
        // if (isAdmin(msg.member)) {
        const queue = getQueue(msg.guild.id);

        queue.clear();
        msg.channel.send(this.wrap('Queue cleared!'));
    }

    /**
     * The command for resuming the current song.
     *
     * @param {Message} msg - Original message.
     * @param {string} suffix - Command suffix.
     * @returns {<promise>} - The response message.
     */
    resume(msg, suffix) {
        console.log('inside resume');
        // Get the voice connection.
        const voiceConnection = this.client.voiceConnections.find(val => val.channel.guild.id == msg.guild.id);
        if (voiceConnection === null) return msg.channel.send(this.wrap('No music being played.'));

        // Resume.
        msg.channel.send(this.wrap('Playback resumed.'));
        const dispatcher = voiceConnection.player.dispatcher;
        if (dispatcher.paused) dispatcher.resume();
    }

    /**
     * The command for changing the song volume.
     *
     * @param {Message} msg - Original message.
     * @param {string} suffix - Command suffix.
     * @returns {<promise>} - The response message.
     */
    volume(msg, suffix) {
        // Get the voice connection.
        const voiceConnection = client.voiceConnections.find(val => val.channel.guild.id == msg.guild.id);
        if (voiceConnection === null) return msg.channel.send(this.wrap('No music being played.'));

        if (!isAdmin(msg.member))
            return msg.channel.send(this.wrap('You are not authorized to use this.'));

        // Get the dispatcher
        const dispatcher = voiceConnection.player.dispatcher;

        if (suffix > 200 || suffix < 0) return msg.channel.send(this.wrap('Volume out of range!')).then((response) => {
            response.delete(5000);
        });

        msg.channel.send(this.wrap("Volume set to " + suffix));
        dispatcher.setVolume((suffix / 100));
    }

    /**
     * Executes the next song in the queue.
     *
     * @param {Message} msg - Original message.
     * @param {object} queue - The song queue for this server.
     * @returns {<promise>} - The voice channel.
     */
    async executeQueue(msg, queue) {
        console.log('inside executeQueue');
        // If the queue is empty, finish.
        if (queue.size() === 0) {
            if (queue.autoplay && queue.autoplayNext) {
                // Since autoplay, autofill the queue with the related video found when last song played
                queue.push(queue.autoplayNext);
            } else {
                // Nothing in queue, so done playing
                msg.channel.send(this.wrap('Playback finished.'));

                // Leave the voice channel.
                const voiceConnection = this.client.voiceConnections.find(val => val.channel.guild.id == msg.guild.id);
                if (voiceConnection !== null) return voiceConnection.disconnect();
            }
        }
        // Join the voice channel if not already in one.
        let connection;
        if (this.CHANNEL) {
            connection = await msg.guild.channels.find('name', this.CHANNEL).join();
            // Check if the user is in a voice channel.
        } else if (msg.member.voiceChannel) {
            connection = await msg.member.voiceChannel.join();
        } else {
            // Otherwise, clear queue and leave if in voice
            queue.clear();
            const voiceConnection = this.client.voiceConnections.find(val => val.channel.guild.id == msg.guild.id);
            if (voiceConnection !== null) return voiceConnection.disconnect();
            throw new Error("Player tried to play while not in voice");
        }

        // Get the first item in the queue.
        const current = queue.shift();
        if (queue.autoplay && queue.size() <= 0) {
            // Search for the next related song for autoplay.
            const autoplayNext = await this.getRelatedSong(current.id, queue);
            autoplayNext.requestedBy = 'rei';
            queue.autoplayNext = autoplayNext;
        }

        await msg.channel.send(this.wrap(`Now Playing: ${current.title}`));

        let dispatcher = connection.playStream(ytdl(current.webpage_url, { filter: 'audioonly' }), { seek: 0, volume: (this.DEFAULT_VOLUME / 100) });

        connection.on('error', (error) => {
            // Skip to the next song.
            console.log(error);
            // queue.shift();
            this.executeQueue(msg, queue);
        });

        dispatcher.on('end', () => {
            console.log('inside dispatcher end');
            // Wait a second.
            setTimeout(() => {
                // Play the next song in the queue.
                this.executeQueue(msg, queue);
            }, 1000);
        });
    }

    /**
     * Gets the next song for autoplay mode
     * 
     * @param {string} currentVideoId - The current video id.
     * @returns {<promise>} - The snippet of the next video.
         */
    getRelatedSong(currentVideoId, queue) {
        const list = promisify(Youtube.search.list);
        const history = queue.history.map(s => s.id);
        console.log('history:');
        console.log(queue.history.map(s => s.title));
        return list({
            part: 'snippet',
            type: 'video',
            eventType: 'completed', // TODO: add support for livestreams
            maxResults: 10,
            relatedToVideoId: currentVideoId
        }).then(res => {
            console.log('query results:');
            console.log(res.items.map(i => i.snippet.title));

            let upNext = res.items.find(i => !history.includes(i.id.videoId));
            upNext = upNext ? upNext : _.sample(res.items);
            console.log(`up next: ${upNext.snippet.title}`);
            const id = upNext.id.videoId;
            upNext.snippet.webpage_url = `https://www.youtube.com/watch?v=${id}`;
            upNext.snippet.id = id;
            return Promise.resolve(upNext.snippet);
        });
    }

    /**
     * Wrap text in a code block and escape grave characters.
     *
     * @param {string} text - The input text.
     * @returns {string} - The wrapped text.
         */
    wrap(text) {
        return '```\n' + text.replace(/`/g, '`' + String.fromCharCode(8203)) + '\n```';
    }
}