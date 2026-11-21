// Background music for a screen: plays an intro track once, then repeats a loop track
// until stop() is called.
export class BackgroundMusic {
    private intro: HTMLAudioElement;
    private loop: HTMLAudioElement;

    constructor(introSrc: string, loopSrc: string, volume = 0.4) {
        this.intro = new Audio(introSrc);
        this.intro.volume = volume;
        this.loop = new Audio(loopSrc);
        this.loop.loop = true;
        this.loop.volume = volume;
        this.intro.addEventListener("ended", () => playFromStart(this.loop));
    }

    // Starts the music from the beginning of the intro
    play(): void {
        playFromStart(this.intro);
    }

    // Stops the intro or loop, whichever is playing, and rewinds both
    stop(): void {
        for (const sound of [this.intro, this.loop]) {
            if (sound.paused) continue;
            sound.pause();
            sound.currentTime = 0;
        }
    }
}

// Plays a sound from the beginning, ignoring errors (e.g. autoplay blocked or no audio in tests)
function playFromStart(sound: HTMLAudioElement): void {
    sound.currentTime = 0;
    try {
        const promise = sound.play();
        if (promise && typeof promise.catch === "function") {
            promise.catch(() => {});
        }
    } catch {
        // Audio not supported in environment
    }
}
