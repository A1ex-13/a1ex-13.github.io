export class Tone {
    #oscillator;
    #start;
    #time;
    #audioContext;
    #buffer;

    constructor(context, delay = 0) {
        this.#audioContext = context;
        this.#oscillator = context.createOscillator();
        this.#oscillator.connect(context.destination);
        this.#start = this.#time = context.currentTime + delay;
        this.#buffer = [];
    }

    tone(frequency, duration) {
        this.#oscillator.frequency.setValueAtTime(frequency, this.#time);
        this.#time += duration / 1000;
        // Записываем в buffer
        const sampleRate = this.#audioContext.sampleRate;
        const length = Math.ceil(sampleRate * duration / 1000);
        const buffer = this.#audioContext.createBuffer(1, length, sampleRate);
        const channelData = buffer.getChannelData(0);
        for (let i = 0; i < length; i++) {
            channelData[i] = Math.sin(2 * Math.PI * frequency * (i / sampleRate));
        }
        this.#buffer.push(buffer);
    }

    async saveToFile() {
        const audioBuffer = this.#audioContext.createBuffer(1, 0, this.#audioContext.sampleRate);
        const audioData = audioBuffer.getChannelData(0);
        let offset = 0;

        this.#buffer.forEach(buffer => {
            const channelData = buffer.getChannelData(0);
            audioData.set(channelData, offset);
            offset += channelData.length;
        });

        // Создаем WAV файл
        const wavData = this._audioBufferToWav(audioBuffer);
        const blob = new Blob([wavData], { type: 'audio/wav' });

        // Скачиваем файл
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'output.wav';
        a.click();
    }

    _audioBufferToWav(buffer) {
        const sampleRate = buffer.sampleRate;
        const numOfChannels = buffer.numberOfChannels;
        const length = buffer.length;
        const wavData = [];

        const writeString = (str) => {
            for (let i = 0; i < str.length; i++) {
                wavData.push(str.charCodeAt(i));
            }
        };

        const writeInt = (value, bytes) => {
            for (let i = 0; i < bytes; i++) {
                wavData.push((value >> (i * 8)) & 0xFF);
            }
        };

        // RIFF header
        writeString('RIFF');
        writeInt(36 + length * numOfChannels * 2, 4);
        writeString('WAVE');

        // fmt chunk
        writeString('fmt ');
        writeInt(16, 4);
        writeInt(1, 2); // PCM
        writeInt(numOfChannels, 2);
        writeInt(sampleRate, 4);
        writeInt(sampleRate * numOfChannels * 2, 4); // byte rate
        writeInt(numOfChannels * 2, 2); // block align
        writeInt(16, 2); // bits per sample

        // data chunk
        writeString('data');
        writeInt(length * numOfChannels * 2, 4);

        // audio data
        for (let i = 0; i < length; i++) {
            for (let channel = 0; channel < numOfChannels; channel++) {
                const value = buffer.getChannelData(channel)[i];
                const intValue = Math.max(-1, Math.min(1, value)) * 32767;
                writeInt(intValue, 2);
            }
        }

        return new Uint8Array(wavData);
    }
}
