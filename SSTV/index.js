document.getElementById("encodeButton").addEventListener("click", async () => {
    const fileInput = document.getElementById("imageInput");
    if (!fileInput.files.length) {
        alert("Выберите изображение");
        return;
    }
    
    const file = fileInput.files[0];
    const reader = new FileReader();
    
    reader.onload = async function(event) {
        const imageData = event.target.result;
        const audioData = await encodeSSTV(imageData);
        playAudio(audioData);
    };

    reader.readAsDataURL(file);
});

async function encodeSSTV(imageData) {
    // Здесь нужно реализовать преобразование изображения в SSTV-сигнал
    console.log("Эмуляция кодирования SSTV...");
    
    // Временная заглушка: генерируем простую синусоиду
    const sampleRate = 44100;
    const duration = 3;
    const buffer = new Float32Array(sampleRate * duration);
    
    for (let i = 0; i < buffer.length; i++) {
        buffer[i] = Math.sin(2 * Math.PI * 1000 * (i / sampleRate)); // 1 кГц
    }
    
    return buffer;
}

function playAudio(buffer) {
    const audioContext = new AudioContext();
    const audioBuffer = audioContext.createBuffer(1, buffer.length, 44100);
    audioBuffer.copyToChannel(buffer, 0);

    const source = audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioContext.destination);
    source.start();
    
    console.log("Проигрывание SSTV-сигнала...");
}
