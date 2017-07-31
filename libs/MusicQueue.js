

module.exports = class MusicQueue {
    constructor(isAutoplay) {
        this.songs = [];
        this.history = [];
        this.autoplay = isAutoplay;
        this.MAX_HISTORY = 10; // TODO: add this as an arg later
        this.current = null;
        this.autoplayNext = null;
    }

    push(song) {
        this.songs.push(song);
    }

    shift() {
        if (this.songs.length <= 0) {
            throw new Error("Popping empty queue");
        }
        const song = this.songs.shift()
        if (this.autoplay) {
            if (this.MAX_HISTORY <= this.history.length) {
                this.history.shift(); // pop one to make roomz
            }
            this.history.push(song);
        }
        this.current = song;
        console.log(this.current.title);
        return song;
    }

    clear() {
        this.songs.splice(0, this.songs.length);
        this.history.splice(0, this.history.length);
        this.current = null;
        this.autoplayNext = null;
    }

    size() {
        return this.songs.length;
    }

    skip(toSkip) {
        this.songs.splice(0, toSkip - 1);
    }
}