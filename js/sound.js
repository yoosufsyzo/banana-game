/*
 * Banana Game – sound.js
 * Background music and sound effects, made with the browser's WEB AUDIO API.
 *
 * Why the Web Audio API? It is built into every modern browser, so there are no
 * music files to download and no copyright problems: every note is generated in code.
 *
 * EVENTS: this file never gets called by game.js directly. It LISTENS for the custom
 * events game.js sends ("game:start", "game:correct", "gameover"…) and plays a sound.
 * So the game logic and the sound are kept separate: you could delete this file and
 * the game would still work, just silently.
 *
 * CIS046-3 Software for Enterprise
 * Code written with help from Claude (AI assistant, Anthropic) and reviewed by the student.
 */

// Note frequencies in Hz (how high the note is). 0 = silence.
const NOTES = {
  C3: 130.81, F3: 174.61, G3: 196.0, A3: 220.0,
  C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46, G5: 783.99, A5: 880.0, C6: 1046.5,
};

// A short, cheerful 16-step tune that loops during the game
const MELODY = [
  NOTES.C5, NOTES.E5, NOTES.G5, NOTES.E5,
  NOTES.F5, NOTES.A5, NOTES.G5, 0,
  NOTES.E5, NOTES.G5, NOTES.C6, NOTES.G5,
  NOTES.D5, NOTES.F5, NOTES.E5, 0,
];
const BASS = [NOTES.C3, NOTES.F3, NOTES.A3, NOTES.G3]; // one bass note every 4 steps

const Sound = {
  context: null,    // the Web Audio "engine", created the first time we need it
  enabled: true,    // sound on or off (saved in the "sound" cookie)
  musicTimer: null,
  step: 0,

  // Browsers only allow sound after the player has clicked something,
  // so the audio engine is created (or woken up) the first time we play.
  getContext() {
    if (!this.context) {
      const AudioEngine = window.AudioContext || window.webkitAudioContext;
      if (!AudioEngine) return null; // very old browser: just stay silent
      this.context = new AudioEngine();
    }
    if (this.context.state === "suspended") this.context.resume();
    return this.context;
  },

  // Play ONE note. frequency in Hz, delay and length in seconds.
  // An "oscillator" makes the tone, a "gain" node controls the volume.
  note(frequency, delay, length, wave = "triangle", volume = 0.2) {
    if (!this.enabled || !frequency) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.type = wave;
    oscillator.frequency.value = frequency;

    const start = ctx.currentTime + delay;
    gain.gain.setValueAtTime(volume, start);
    gain.gain.exponentialRampToValueAtTime(0.001, start + length); // fade out

    oscillator.connect(gain);
    gain.connect(ctx.destination); // destination = the speakers
    oscillator.start(start);
    oscillator.stop(start + length);
  },

  // ----- Sound effects -----
  correct() {
    this.note(NOTES.E5, 0, 0.15);
    this.note(NOTES.A5, 0.12, 0.3);
  },
  wrong() {
    this.note(220, 0, 0.25, "sawtooth", 0.08);
    this.note(160, 0.2, 0.35, "sawtooth", 0.08);
  },
  tick() {
    this.note(1000, 0, 0.05, "square", 0.04);
  },
  win() {
    [NOTES.C5, NOTES.E5, NOTES.G5, NOTES.C6].forEach((f, i) => this.note(f, i * 0.12, 0.35));
  },
  lose() {
    [NOTES.G5, NOTES.E5, NOTES.C5].forEach((f, i) => this.note(f, i * 0.22, 0.4, "triangle", 0.15));
  },

  // ----- Background music: play the next step of the tune every 250 ms -----
  startMusic() {
    this.stopMusic();
    if (!this.enabled) return;
    this.step = 0;
    this.musicTimer = setInterval(() => {
      this.note(MELODY[this.step % MELODY.length], 0, 0.22, "triangle", 0.04);
      if (this.step % 4 === 0) {
        this.note(BASS[(this.step / 4) % BASS.length], 0, 0.5, "sine", 0.06);
      }
      this.step++;
    }, 250);
  },

  stopMusic() {
    clearInterval(this.musicTimer);
    this.musicTimer = null;
  },

  // ----- Mute button -----
  toggle() {
    this.enabled = !this.enabled;
    setCookie("sound", this.enabled ? "on" : "off", 365); // remember for next time
    if (!this.enabled) {
      this.stopMusic();
    } else if (game.running) {
      this.startMusic();
    }
    updateSoundButton();
  },
};

function updateSoundButton() {
  const button = document.getElementById("sound-btn");
  button.textContent = Sound.enabled ? "🔊" : "🔇";
  button.title = Sound.enabled ? "Sound on (click to mute)" : "Sound off (click to unmute)";
}

// Listen for the game's events and play the matching sound
function setupSoundEvents() {
  Sound.enabled = getCookie("sound") !== "off";
  updateSoundButton();

  document.getElementById("sound-btn").addEventListener("click", () => Sound.toggle());

  document.addEventListener("game:start", () => Sound.startMusic());
  document.addEventListener("game:correct", () => Sound.correct());
  document.addEventListener("game:wrong", () => Sound.wrong());
  document.addEventListener("game:timeup", () => Sound.wrong());
  document.addEventListener("game:quit", () => Sound.stopMusic());

  // Tick every second during the last 10 seconds
  document.addEventListener("game:tick", (event) => {
    const timeLeft = event.detail.timeLeft;
    if (timeLeft > 0 && timeLeft <= CONFIG.WARNING_SECONDS) Sound.tick();
  });

  document.addEventListener("gameover", (event) => {
    Sound.stopMusic();
    if (event.detail.reason === "complete") {
      Sound.win();
    } else {
      Sound.lose();
    }
  });
}
