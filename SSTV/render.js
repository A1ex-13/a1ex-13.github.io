export class Tone {
    #oscillator;
    #start;
    #time;
    #audioBuffer;
    #audioContext;

    constructor(context, delay = 0) {
        this.#audioContext = context;
        this.#oscillator = context.createOscillator();
        this.#oscillator.connect(context.destination);
        this.#start = this.#time = context.currentTime + delay;
    }

    tone(frequency, duration) {
        this.#oscillator.frequency.setValueAtTime(frequency, this.#time);
        this.#time += duration / 1000;
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

    saveToFile() {
        const buffer = this.#audioContext.createBuffer(1, this.#audioContext.sampleRate * this.#time, this.#audioContext.sampleRate);
        const data = buffer.getChannelData(0);
        // Здесь можно вставить код для преобразования и сохранения звука в файл
        const wav = encodeWav(data);
        
        const blob = new Blob([wav], { type: 'audio/wav' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'sound.wav';
        link.click();
    }
}

function encodeWav(data) {
    // Код для преобразования данных в формат WAV
    let buffer = new ArrayBuffer(44 + data.length * 2); // Заголовок WAV + данные звука
    let view = new DataView(buffer);

    // Записываем заголовок WAV
    writeWavHeader(view, data.length);

    // Записываем данные звука (16 бит, моно)
    let offset = 44;
    for (let i = 0; i < data.length; i++) {
        view.setInt16(offset, data[i] * 32767, true);
        offset += 2;
    }

    return buffer;
}

function writeWavHeader(view, dataLength) {
    const sampleRate = 44100;
    const bitsPerSample = 16;
    const channels = 1;

    // Заголовок WAV
    view.setUint8(0, 82); // "R"
    view.setUint8(1, 73); // "I"
    view.setUint8(2, 70); // "F"
    view.setUint8(3, 70); // "F"
    view.setUint32(4, 36 + dataLength * 2, true);
    view.setUint8(8, 87); // "W"
    view.setUint8(9, 65); // "A"
    view.setUint8(10, 86); // "V"
    view.setUint8(11, 69); // "E"
    view.setUint8(12, 102); // "f"
    view.setUint8(13, 109); // "m"
    view.setUint8(14, 116); // "t"
    view.setUint8(15, 32); // " "
    view.setUint32(16, 16, true); // Subchunk1Size
    view.setUint16(20, 1, true); // AudioFormat (PCM)
    view.setUint16(22, channels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * channels * bitsPerSample / 8, true);
    view.setUint16(32, channels * bitsPerSample / 8, true);
    view.setUint16(34, bitsPerSample, true);
    view.setUint8(36, 100); // "d"
    view.setUint8(37, 97); // "a"
    view.setUint8(38, 116); // "t"
    view.setUint8(39, 97); // "a"
    view.setUint8(40, 102); // "f"
    view.setUint8(41, 109); // "m"
    view.setUint8(42, 116); // "t"
    view.setUint8(43, 32); // " "
    view.setUint32(44, dataLength * 2, true); // Subchunk2Size
}
