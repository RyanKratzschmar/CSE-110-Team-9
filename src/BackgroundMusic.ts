// Background music for a screen: after a short pause, plays an intro track once,
// then repeats a loop track until stop() is called.
export class BackgroundMusic {
    private intro: HTMLAudioElement;
    private loop: HTMLAudioElement;
    private startTimer: ReturnType<typeof setTimeout> | null = null;

    // startDelayMs: silence after the screen opens before the music begins, for a smoother transition
    constructor(introSrc: string, loopSrc: string, volume = 0.4, private readonly startDelayMs = 1000) {
        this.intro = new Audio(introSrc);
        this.intro.volume = volume;
        this.loop = new Audio(loopSrc);
        this.loop.loop = true;
        this.loop.volume = volume;
        this.intro.addEventListener("ended", () => playFromStart(this.loop));
    }

    // Starts the music from the beginning of the intro, after the start delay
    play(): void {
        this.cancelStart();
        this.startTimer = setTimeout(() => {
            this.startTimer = null;
            playFromStart(this.intro);
        }, this.startDelayMs);
    }

    // Stops the intro or loop, whichever is playing, rewinds both,
    // and cancels a start that is still waiting on the delay
    stop(): void {
        this.cancelStart();
        for (const sound of [this.intro, this.loop]) {
            if (sound.paused) continue;
            sound.pause();
            sound.currentTime = 0;
        }
    }

    private cancelStart(): void {
        if (this.startTimer === null) return;
        clearTimeout(this.startTimer);
        this.startTimer = null;
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
