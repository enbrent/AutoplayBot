

module.exports = class MusicQueue {
    constructor(isAutoplay) {
        this.songs = [];
        this.history = [];
        this.autoplay = isAutoplay;
        this.MAX_HISTORY = 10; // TODO: add this as an arg later
    }

    push(song) {
        this.songs.push(song);
    }

    pop() {
        if (this.songs.length <= 0) {
            throw new Error("Popping empty queue");
        }
        const song = this.songs.pop()
        if (this.autoplay) {
            if (this.MAX_HISTORY <= this.history.length) {
                this.history.pop(); // pop one to make roomz
            }
            this.history.push(song);
        }
        return song;
    }

    clear() {
        this.songs.splice(0, this.songs.length);
        this.history.splice(0, this.history.length);
    }

    size() {
        return this.songs.length;
    }

    skip(toSkip) {
        this.songs.splice(0, toSkip - 1);
    }
}