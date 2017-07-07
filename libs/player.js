const YoutubeDL = require('youtube-dl');
const ytdl = require('ytdl-core');
const Youtube = require('youtube-api');
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
    }

    /**
    * Checks if a user is an admin.
    *
    * @param {GuildMember} member - The guild member
    * @returns {boolean} -
    */
    isAdmin(member) {
        return member.hasPermission("ADMINISTRATOR");
    }

    /**
     * Checks if the user can skip the song.
     *
     * @param {GuildMember} member - The guild member
     * @param {array} queue - The current queue
     * @returns {boolean} - If the user can skip
     */
    canSkip(member, queue) {
        if (this.ALLOW_ALL_SKIP) return true;
        else if (queue[0].requester === member.id) return true;
        else if (isAdmin(member)) return true;
        else return false;
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

        // Return the queue.
        if (!this.queues[server]) this.queues[server] = [];
        return this.queues[server];
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

        // If autoplay mode is on, clear queue
        if (autoplay) {
            queue.splice(0, queue.length);
            const voiceConnection = this.client.voiceConnections.find(val => val.channel.guild.id == msg.guild.id);
            if (voiceConnection !== null) {
                const dispatcher = voiceConnection.player.dispatcher;
                if (voiceConnection.paused) dispatcher.resume();
                dispatcher.end();
            }
        }

        // Check if the queue has reached its maximum size.
        if (queue.length >= this.MAX_QUEUE_SIZE) {
            return msg.channel.send(this.wrap('Maximum queue size reached!'));
        }

        // Get the video information.
        msg.channel.send(this.wrap('Searching...')).then(response => {
            var searchstring = suffix
            if (!suffix.toLowerCase().startsWith('http')) {
                searchstring = 'gvsearch1:' + suffix;
            }

            YoutubeDL.getInfo(searchstring, ['-q', '--no-warnings', '--force-ipv4'], { maxBuffer: Infinity }, (err, info) => {
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
                    queue.push(info);
                    // Play if only one element in the queue.
                    if (queue.length === 1) this.executeQueue(msg, queue);
                }).catch(console.log);
            });
        }).catch(console.log);
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
        toSkip = Math.min(toSkip, queue.length);

        // Skip.
        queue.splice(0, toSkip - 1);

        // Resume and stop playing.
        const dispatcher = voiceConnection.player.dispatcher;
        if (voiceConnection.paused) dispatcher.resume();
        dispatcher.end();

        msg.channel.send(this.wrap('Skipped ' + toSkip + '!'));
    }

    /**
     * The command for listing the queue.
     *
     * @param {Message} msg - Original message.
     * @param {boolean} autoplay - Whether queue is an autoplay queue or not.
     */
    queue(msg, autoplay) {
        // Get the queue.
        const queue = this.getQueue(msg.guild.id);

        // Get the queue text.
        let text;
        if (autoplay) {
            text = `Now: ${queue[0].title}\nNext: ${queue[1].title}`
        } else {
            text = queue.map((video, index) => (
                (index + 1) + ': ' + video.title
            )).join('\n');
        }
        // Get the status of the queue.
        let queueStatus = 'Stopped';
        const voiceConnection = this.client.voiceConnections.find(val => val.channel.guild.id == msg.guild.id);
        if (voiceConnection !== null) {
            const dispatcher = voiceConnection.player.dispatcher;
            queueStatus = dispatcher.paused ? 'Paused' : 'Playing';
        }
        // Send the queue and status.
        msg.channel.send(this.wrap('Queue (' + queueStatus + '):\n' + text));
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

        if (!this.isAdmin(msg.member))
            return msg.channel.send(this.wrap('You are not authorized to use this.'));

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
    leave(msg, suffix) {
        console.log('inside leave');
        if (this.isAdmin(msg.member)) {
            const voiceConnection = this.client.voiceConnections.find(val => val.channel.guild.id == msg.guild.id);
            if (voiceConnection === null) return msg.channel.send(this.wrap('I\'m not in any channel!.'));
            // Clear the queue.
            const queue = this.getQueue(msg.guild.id);
            queue.splice(0, queue.length);

            // End the stream and disconnect.
            voiceConnection.player.dispatcher.end();
            voiceConnection.disconnect();
        } else {
            msg.channel.send(this.wrap('You don\'t have permission to use that command!'));
        }
    }

    /**
     * The command for clearing the song queue.
     *
     * @param {Message} msg - Original message.
     * @param {string} suffix - Command suffix.
     */
    clearqueue(msg, suffix) {
        if (isAdmin(msg.member)) {
            const queue = getQueue(msg.guild.id);

            queue.splice(0, queue.length);
            msg.channel.send(this.wrap('Queue cleared!'));
        } else {
            msg.channel.send(this.wrap('You don\'t have permission to use that command!'));
        }
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

        if (!this.isAdmin(msg.member))
            return msg.channel.send(this.wrap('You are not authorized to use this.'));

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
        if (queue.length === 0) {
            msg.channel.send(this.wrap('Playback finished.'));

            // Leave the voice channel.
            const voiceConnection = this.client.voiceConnections.find(val => val.channel.guild.id == msg.guild.id);
            if (voiceConnection !== null) return voiceConnection.disconnect();
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
            queue.splice(0, queue.length);
            const voiceConnection = this.client.voiceConnections.find(val => val.channel.guild.id == msg.guild.id);
            if (voiceConnection !== null) return voiceConnection.disconnect();
            throw new Error("Player tried to play while not in voice");
        }

        // Get the first item in the queue.
        const current = queue[0];
        // Search for the next related song for autoplay (TODO: disable when autoplay isn't enabled)
        const next = await this.getUpcoming(current.id);
        queue.push(next);
        await msg.channel.send(this.wrap(`Now Playing: ${current.title}\nUp Next: ${next.title}`));
        let dispatcher = connection.playStream(ytdl(current.webpage_url, { filter: 'audioonly' }), { seek: 0, volume: (this.DEFAULT_VOLUME / 100) });

        connection.on('error', (error) => {
            // Skip to the next song.
            console.log(error);
            queue.shift();
            this.executeQueue(msg, queue);
        });

        dispatcher.on('error', (error) => {
            // Skip to the next song.
            console.log(error);
            queue.shift();
            this.executeQueue(msg, queue);
        });

        dispatcher.on('end', () => {
            // Wait a second.
            setTimeout(() => {
                if (queue.length > 0) {
                    // Remove the song from the queue.
                    queue.shift();
                    // Play the next song in the queue.
                    this.executeQueue(msg, queue);
                }
            }, 1000);
        });
    }

    /**
     * Gets the next song for autoplay mode
     * 
     * @param {string} currentVideoId - The current video id.
     * @returns {<promise>} - The snippet of the next video.
     */
    getUpcoming(currentVideoId) {
        const list = promisify(Youtube.search.list);
        return list({
            part: 'snippet',
            type: 'video',
            relatedToVideoId: currentVideoId
        }).then(res => {
            console.log('hereeeeeeeee');
            const upNext = _.sample(res.items);
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