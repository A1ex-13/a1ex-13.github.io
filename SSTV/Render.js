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
