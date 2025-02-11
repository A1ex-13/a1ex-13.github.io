export class Tone {
  #oscillator;
  #start;
  #time;
  #audioContext;
  #audioBuffer;
  #bufferSize;
  #audioData;
  #currentIndex;

  constructor(context, delay = 0) {
    this.#audioContext = context;
    this.#oscillator = context.createOscillator();
    this.#oscillator.connect(context.destination);
    this.#start = this.#time = context.currentTime + delay;

    // Создаем буфер для записи звуковых данных
    this.#bufferSize = 44100;  // 1 секунду записи при частоте 44.1kHz
    this.#audioBuffer = context.createBuffer(1, this.#bufferSize, context.sampleRate);
    this.#audioData = this.#audioBuffer.getChannelData(0);
    this.#currentIndex = 0;
  }

  tone(frequency, duration) {
    const startIdx = this.#currentIndex;
    const endIdx = startIdx + Math.round(duration / 1000 * this.#audioContext.sampleRate);
    const period = this.#audioContext.sampleRate / frequency;
    for (let i = startIdx; i < endIdx && i < this.#audioData.length; i++) {
      this.#audioData[i] = Math.sin(2 * Math.PI * (i % period) / period);
    }
    this.#currentIndex = endIdx;
  }

  mode(mode) {
    const bits = Array.from(mode.toString(2).padStart(7, '0'), Number).reverse();
    bits.push(bits.reduce((cum, curr) => cum ^ curr, 0));
    for (const bit of bits) {
      this.tone(bit ? 1100 : 1300, 30);
    }
    this.tone(1200, 30);
  }

  play() {
    return new Promise(resolve => {
      const source = this.#audioContext.createBufferSource();
      source.buffer = this.#audioBuffer;
      source.connect(this.#audioContext.destination);
      source.start();
      source.onended = resolve;
    });
  }

  stop() {
    // Логика для остановки
  }

  async saveToFile() {
    const wavData = this.#convertToWav();
    const blob = new Blob([wavData], { type: 'audio/wav' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'sstv_audio.wav';
    link.click();
  }

  #convertToWav() {
    const header = this.#generateWavHeader();
    const audioData = this.#audioData;
    const buffer = new ArrayBuffer(header.length + audioData.length * 2);
    const view = new DataView(buffer);

    for (let i = 0; i < header.length; i++) {
      view.setUint8(i, header[i]);
    }

    let offset = header.length;
    for (let i = 0; i < audioData.length; i++) {
      view.setInt16(offset, audioData[i] * 0x7FFF, true);
      offset += 2;
    }

    return buffer;
  }

  #generateWavHeader() {
    const sampleRate = this.#audioContext.sampleRate;
    const numChannels = 1;
    const bitsPerSample = 16;
    const dataSize = this.#audioData.length * 2;
    const chunkSize = 36 + dataSize;

    const header = new Uint8Array(44);
    const dv = new DataView(header.buffer);

    // RIFF header
    dv.setUint32(0, 0x52494646, false); // "RIFF"
    dv.setUint32(4, chunkSize, true);
    dv.setUint32(8, 0x57415645, false); // "WAVE"
    dv.setUint32(12, 0x666d7420, false); // "fmt "
    dv.setUint32(16, 16, true); // fmt chunk size
    dv.setUint16(20, 1, true); // audio format (PCM)
    dv.setUint16(22, numChannels, true);
    dv.setUint32(24, sampleRate, true);
    dv.setUint32(28, sampleRate * numChannels * bitsPerSample / 8, true); // byte rate
    dv.setUint16(32, numChannels * bitsPerSample / 8, true); // block align
    dv.setUint16(34, bitsPerSample, true); // bits per sample
    dv.setUint32(36, 0x64617461, false); // "data"
    dv.setUint32(40, dataSize, true); // data chunk size

    return header;
  }
}

export function writeImageToTone(imageData, tone) {
  const HELLO = [1900, 1500, 1900, 1500, 2300, 1500, 2300, 1500];
  const MODE = 60;
  const COLOR_LOW = 1500;
  const COLOR_HIGH = 2300;

  for (const freq of HELLO) {
    tone.tone(freq, 100);
  }
  tone.tone(1900, 300);
  tone.tone(1200, 10);
  tone.tone(1900, 300);
  tone.tone(1200, 30);
  tone.mode(MODE);

  tone.tone(1200, 9);
  for (let y = 0; y < imageData.height; y++) {
    const start = y * imageData.width * 4;
    for (const channel of [1, 2, 0]) {
      if (channel === 0) {
        tone.tone(1200, 9);
      }
      tone.tone(1500, 1.5);
      for (let x = 0; x < imageData.width; x++) {
        const value = imageData.data[start + x * 4 + channel];
        tone.tone(
          COLOR_LOW + (COLOR_HIGH - COLOR_LOW) * (value / 255),
          0.432
        );
      }
    }
  }
}
