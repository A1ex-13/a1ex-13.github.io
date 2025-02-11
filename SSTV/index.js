// Обработчик события для загрузки изображения
document.getElementById('image').addEventListener('change', handleImageUpload);

// Обработчик загрузки изображения
function handleImageUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    const img = new Image();
    const reader = new FileReader();

    reader.onload = function(e) {
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);

    img.onload = function() {
        const canvas = document.getElementById('preview');
        const ctx = canvas.getContext('2d');
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        processImageData(imageData);
    };
}

// Обработка данных изображения и создание звуковой волны
function processImageData(imageData) {
    // Создаем AudioContext
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();

    // Преобразуем изображение в звуковую волну
    const audioData = imageToSound(imageData, audioContext);

    // Создаем AudioBufferSourceNode для воспроизведения звука
    const source = audioContext.createBufferSource();
    audioContext.decodeAudioData(audioData, (buffer) => {
        source.buffer = buffer;
        source.connect(audioContext.destination);
        source.start();
    });

    // Сохраняем файл (будет использоваться для генерации звука)
    document.getElementById('saveFile').onclick = function() {
        saveAudioToFile(audioContext, audioData);
    };
}

// Преобразование изображения в аудиофайл (пример)
function imageToSound(imageData, audioContext) {
    // Преобразуем каждый пиксель в звуковую волну
    const samples = new Float32Array(imageData.width * imageData.height * 2); // Два канала для стерео

    let index = 0;
    for (let y = 0; y < imageData.height; y++) {
        for (let x = 0; x < imageData.width; x++) {
            const i = (y * imageData.width + x) * 4;
            const r = imageData.data[i] / 255; // Красный канал
            const g = imageData.data[i + 1] / 255; // Зеленый канал
            const b = imageData.data[i + 2] / 255; // Синий канал

            // Преобразуем цвет в звук (простой пример)
            samples[index++] = r * 2 - 1; // Левый канал
            samples[index++] = g * 2 - 1; // Правый канал
        }
    }

    // Создаем аудиобуфер с данными
    const buffer = audioContext.createBuffer(2, samples.length / 2, audioContext.sampleRate);
    buffer.getChannelData(0).set(samples.filter((_, i) => i % 2 === 0)); // Левый канал
    buffer.getChannelData(1).set(samples.filter((_, i) => i % 2 === 1)); // Правый канал

    return buffer;
}

// Функция для сохранения аудиофайла
function saveAudioToFile(audioContext, audioData) {
    const audioBuffer = audioContext.createBufferSource();
    audioContext.decodeAudioData(audioData, (buffer) => {
        audioBuffer.buffer = buffer;
        const audioBlob = bufferToBlob(buffer);
        const url = URL.createObjectURL(audioBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'sstv_audio.wav';
        link.click();
    });
}

// Преобразование аудиобуфера в Blob
function bufferToBlob(buffer) {
    const wavHeader = new ArrayBuffer(44);
    const view = new DataView(wavHeader);
    const audioData = buffer.getChannelData(0);
    const dataSize = audioData.length * 2;
    const bufferLength = dataSize + 44;

    view.setUint8(0, 82); // 'R'
    view.setUint8(1, 73); // 'I'
    view.setUint8(2, 70); // 'F'
    view.setUint8(3, 70); // 'F'
    view.setUint32(4, bufferLength, true);
    view.setUint8(8, 87); // 'W'
    view.setUint8(9, 65); // 'A'
    view.setUint8(10, 86); // 'V'
    view.setUint8(11, 69); // 'E'
    view.setUint8(12, 102); // 'f'
    view.setUint8(13, 109); // 'm'
    view.setUint8(14, 116); // 't'
    view.setUint8(15, 32); // space
    view.setUint32(16, 16, true); // Subchunk1Size
    view.setUint16(20, 1, true); // AudioFormat
    view.setUint16(22, 2, true); // NumChannels
    view.setUint32(24, 44100, true); // SampleRate
    view.setUint32(28, 176400, true); // ByteRate
    view.setUint16(32, 4, true); // BlockAlign
    view.setUint16(34, 16, true); // BitsPerSample
    view.setUint8(36, 100); // 'd'
    view.setUint8(37, 97); // 'a'
    view.setUint8(38, 116); // 't'
    view.setUint8(39, 97); // 'a'
    view.setUint32(40, dataSize, true); // Subchunk2Size

    const wavData = new ArrayBuffer(bufferLength);
    const viewData = new DataView(wavData);
    for (let i = 0; i < audioData.length; i++) {
        viewData.setInt16(i * 2, audioData[i] * 32767, true);
    }

    return new Blob([wavHeader, wavData], { type: 'audio/wav' });
}
