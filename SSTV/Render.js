export class Tone {
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
    const bits = Array.from(
      mode.toString(2).padStart(7, '0'),
      Number
    ).reverse();
    bits.push(bits.reduce((cum, curr) => cum ^ curr, 0));
    for (const bit of bits) {
      this.tone(bit ? 1100 : 1300, 30);
    }
    this.tone(1200, 30);
  }

  play() {
    return new Promise(resolve => {
      this.#oscillator.start(this.#start);
      this.#oscillator.stop(this.#time);
      this.#oscillator.addEventListener('ended', () => {
        this.#oscillator.disconnect();
        resolve();
      });
    });
  }

  stop() {
    this.#oscillator.stop();
  }
}

export function bufferToWav(audioBuffer) {
  const numOfChan = audioBuffer.numberOfChannels;
  const length = audioBuffer.length * numOfChan * 2 + 44;
  const buffer = new ArrayBuffer(length);
  const view = new DataView(buffer);

  const channels = [];
  let sampleRate = audioBuffer.sampleRate;

  for (let i = 0; i < numOfChan; i++) {
    channels.push(audioBuffer.getChannelData(i));
  }

  let offset = 0;

  function writeString(s) {
    for (let i = 0; i < s.length; i++) {
      view.setUint8(offset + i, s.charCodeAt(i));
    }
    offset += s.length;
  }

  function write16(value) {
    view.setUint16(offset, value, true);
    offset += 2;
  }

  function write32(value) {
    view.setUint32(offset, value, true);
    offset += 4;
  }

  // WAV header
  writeString('RIFF');
  write32(length - 8);
  writeString('WAVE');
  writeString('fmt ');
  write32(16);
  write16(1);
  write16(numOfChan);
  write32(sampleRate);
  write32(sampleRate * numOfChan * 2);
  write16(numOfChan * 2);
  write16(16);
  writeString('data');
  write32(length - offset - 4);

  // PCM data
  for (let i = 0; i < audioBuffer.length; i++) {
    for (let channel = 0; channel < numOfChan; channel++) {
      let sample = Math.max(-1, Math.min(1, channels[channel][i]));
      sample = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
      view.setInt16(offset, sample, true);
      offset += 2;
    }
  }

  return new Blob([buffer], { type: 'audio/wav' });
}

export async function renderAudio(imageData, WIDTH, HEIGHT) {
  const sampleRate = 44100;
  const context = new OfflineAudioContext({
    numberOfChannels: 1,
    length: Math.ceil((111343.32 * sampleRate) / 1000),
    sampleRate: sampleRate
  });

  const tone = new Tone(context);
  writeImageToTone(imageData, tone);
  await tone.play();

  const renderedBuffer = await context.startRendering();
  return bufferToWav(renderedBuffer);
}
