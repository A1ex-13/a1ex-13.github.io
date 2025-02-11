const elems = {
  image: document.getElementById("image"),
  play: document.getElementById("play"),
  stop: document.getElementById("stop"),
  render: document.getElementById("render"),
  preview: document.getElementById("preview"),
  audio: document.getElementById("audio"),
  download: document.getElementById("download"),
};

/** @type {CanvasRenderingContext2D} */
const c = elems.preview.getContext("2d", { willReadFrequently: true });

const WIDTH = 320;
const HEIGHT = 256;

function loadImage(file) {
  const url = URL.createObjectURL(file);
  image = new Image();
  image.addEventListener("load", () => {
    c.drawImage(image, 0, 0, WIDTH, HEIGHT);
    URL.revokeObjectURL(url);
  });
  image.src = url;
}

elems.image.addEventListener("change", () => {
  if (elems.image.files[0]) {
    loadImage(elems.image.files[0]);
  }
});

document.addEventListener("paste", (e) => {
  if (e.clipboardData.files[0]) {
    loadImage(e.clipboardData.files[0]);
  }
});

fetch("./sstv-test-image.jpg")
  .then((r) => r.blob())
  .then(loadImage);

/** @type {AudioContext} */
let context;

class Tone {
  #oscillator;
  #start;
  #time;

  constructor(context, delay = 0) {
    this.#oscillator = context.createOscillator();
    this.#oscillator.connect(context.destination);
    this.#start = this.#time = context.currentTime + delay;
  }

  tone(frequency, duration) {
    this.#oscillator.frequency.setValueAtTime(frequency, this.#time);
    this.#time += duration / 1000;
  }

  mode(mode) {
    const bits = Array.from(mode.toString(2).padStart(7, "0"), Number).reverse();
    bits.push(bits.reduce((cum, curr) => cum ^ curr, 0));
    for (const bit of bits) {
      this.tone(bit ? 1100 : 1300, 30);
    }
    this.tone(1200, 30);
  }

  play() {
    return new Promise((resolve) => {
      this.#oscillator.start(this.#start);
      this.#oscillator.stop(this.#time);
      this.#oscillator.addEventListener("ended", () => {
        this.#oscillator.disconnect();
        resolve();
      });
    });
  }

  stop() {
    this.#oscillator.stop();
  }
}

/** In seconds. */
const DELAY = 0.1;
const HELLO = [1900, 1500, 1900, 1500, 2300, 1500, 2300, 1500];
/** Scottie S1. */
const MODE = 60;
const COLOR_LOW = 1500;
const COLOR_HIGH = 2300;

function writeImageToTone(imageData, tone) {
  for (const freq of HELLO) {
    tone.tone(freq, 100);
  }
  tone.tone(1900, 300);
  tone.tone(1200, 10);
  tone.tone(1900, 300);
  tone.tone(1200, 30);
  tone.mode(MODE);

  tone.tone(1200, 9);
  for (let y = 0; y < HEIGHT; y++) {
    const start = y * WIDTH * 4;
    for (const channel of [1, 2, 0]) {
      if (channel === 0) {
        tone.tone(1200, 9);
      }
      tone.tone(1500, 1.5);
      for (let x = 0; x < WIDTH; x++) {
        const value = imageData.data[start + x * 4 + channel];
        tone.tone(
          COLOR_LOW + (COLOR_HIGH - COLOR_LOW) * (value / 255),
          0.432
        );
      }
    }
  }
}

elems.play.addEventListener("click", () => {
  context ??= new AudioContext();
  const tone = new Tone(context, DELAY);
  writeImageToTone(c.getImageData(0, 0, WIDTH, HEIGHT), tone);

  elems.play.disabled = true;
  elems.stop.disabled = false;
  tone.play().then(() => {
    elems.play.disabled = false;
    elems.stop.disabled = true;
  });

  elems.stop.onclick = () => tone.stop();
});

const encoder = new TextEncoder();
function header(byteCount, sampleRate, channelCount = 1) {
  const header = new DataView(new ArrayBuffer(44));
  const byteView = new Uint8Array(header.buffer);
  byteView.set(encoder.encode("RIFF"), 0);
  header.setUint32(4, byteCount + 36, true);
  byteView.set(encoder.encode("WAVE"), 8);
  byteView.set(encoder.encode("fmt "), 12);
  header.setUint32(16, 16, true);
  header.setUint16(20, 1, true);
  header.setUint16(22, channelCount, true);
  header.setUint32(24, sampleRate, true);
  header.setUint32(28, sampleRate * 4, true);
  header.setUint16(32, channelCount * 2, true);
  header.setUint16(34, 16, true);
  byteView.set(encoder.encode("data"), 36);
  header.setUint32(40, byteCount, true);
  return header;
}

elems.render.addEventListener("click", async () => {
  elems.render.disabled = true;
  const context = new OfflineAudioContext({
    numberOfChannels: 1,
    length: Math.ceil((111343.32 * 44100) / 1000),
    sampleRate: 44100,
  });

  const tone = new Tone(context);
  writeImageToTone(c.getImageData(0, 0, WIDTH, HEIGHT), tone);
  await tone.play();

  const audioBuffer = await context.startRendering();
  const wavData = encodeWav(audioBuffer);
  const blob = new Blob([wavData], { type: "audio/wav" });
  const url = URL.createObjectURL(blob);

  elems.audio.innerHTML = <audio controls src="${url}"></audio>;
  elems.download.href = url;
  elems.download.download = "sstv_audio.wav";
  elems.download.style.display = "block";
});

function encodeWav(audioBuffer) {
  const raw = audioBuffer.getChannelData(0);
  const buffer = new ArrayBuffer(44 + raw.length * 2);
  const view = new DataView(buffer);

  const writeString = (offset, string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  writeString(0, "RIFF");
  view.setUint32(4, 36 + raw.length * 2, true);
  writeString(8, "WAVE");
  writeString(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, audioBuffer.sampleRate, true);
  view.setUint32(28, audioBuffer.sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(36, "data");
  view.setUint32(40, raw.length * 2, true);

  for (let i = 0, offset = 44; i < raw.length; i++, offset += 2) {
    view.setInt16(offset, raw[i] * 32767, true);
  }

  return buffer;
}
