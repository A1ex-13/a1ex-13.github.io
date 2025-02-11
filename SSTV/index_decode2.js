const decodeButton = document.getElementById("decode");
const canvas = document.getElementById("decoded");
const ctx = canvas.getContext("2d", { willReadFrequently: true });

const WIDTH = 320;
const HEIGHT = 256;

let audioContext, analyser, microphone, dataArray, bufferLength;

// Настройки SSTV-формата
const FORMAT = {
  lineSyncFreq: 1200, // Синхроимпульс
  redFreqStart: 1500, redFreqEnd: 1900,
  greenFreqStart: 1900, greenFreqEnd: 2100,
  blueFreqStart: 2100, blueFreqEnd: 2300
};

// Буфер кадров SSTV
let frameBuffer = new Uint8Array(WIDTH * HEIGHT * 3);
let currentLine = 0;

async function startDecoding() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    alert("Ваш браузер не поддерживает доступ к микрофону!");
    return;
  }

  audioContext = new (window.AudioContext || window.webkitAudioContext)();
  analyser = audioContext.createAnalyser();
  analyser.fftSize = 4096;

  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  microphone = audioContext.createMediaStreamSource(stream);
  microphone.connect(analyser);

  bufferLength = analyser.frequencyBinCount;
  dataArray = new Uint8Array(bufferLength);

  requestAnimationFrame(decodeSSTV);
}

function decodeSSTV() {
  analyser.getByteFrequencyData(dataArray);

  // Поиск синхроимпульса (начало строки)
  let syncIndex = getFrequencyIndex(FORMAT.lineSyncFreq);
  if (dataArray[syncIndex] > 180) {
    currentLine++;
    if (currentLine >= HEIGHT) currentLine = 0;
  }

  // Заполняем пиксели RGB
  for (let x = 0; x < WIDTH; x++) {
    const rIndex = getFrequencyIndex(FORMAT.redFreqStart + (x / WIDTH) * (FORMAT.redFreqEnd - FORMAT.redFreqStart));
    const gIndex = getFrequencyIndex(FORMAT.greenFreqStart + (x / WIDTH) * (FORMAT.greenFreqEnd - FORMAT.greenFreqStart));
    const bIndex = getFrequencyIndex(FORMAT.blueFreqStart + (x / WIDTH) * (FORMAT.blueFreqEnd - FORMAT.blueFreqStart));

    let r = dataArray[rIndex];
    let g = dataArray[gIndex];
    let b = dataArray[bIndex];

    let pixelIndex = (currentLine * WIDTH + x) * 3;
    frameBuffer[pixelIndex] = r;
    frameBuffer[pixelIndex + 1] = g;
    frameBuffer[pixelIndex + 2] = b;
  }

  renderFrame();
  requestAnimationFrame(decodeSSTV);
}

function getFrequencyIndex(freq) {
  const nyquist = audioContext.sampleRate / 2;
  return Math.floor((freq / nyquist) * bufferLength);
}

function renderFrame() {
  let imageData = ctx.createImageData(WIDTH, HEIGHT);
  for (let y = 0; y < HEIGHT; y++) {
    for (let x = 0; x < WIDTH; x++) {
      let pixelIndex = (y * WIDTH + x) * 3;
      let canvasIndex = (y * WIDTH + x) * 4;

      imageData.data[canvasIndex] = frameBuffer[pixelIndex]; // R
      imageData.data[canvasIndex + 1] = frameBuffer[pixelIndex + 1]; // G
      imageData.data[canvasIndex + 2] = frameBuffer[pixelIndex + 2]; // B
      imageData.data[canvasIndex + 3] = 255; // Alpha
    }
  }
  ctx.putImageData(imageData, 0, 0);
}

decodeButton.addEventListener("click", startDecoding);
