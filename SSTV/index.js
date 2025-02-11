import { Tone, writeImageToTone } from './Render.js';

const elems = {
  image: document.getElementById('image'),
  play: document.getElementById('play'),
  stop: document.getElementById('stop'),
  render: document.getElementById('render'),
  preview: document.getElementById('preview'),
  audio: document.getElementById('audio')
};

/** @type {CanvasRenderingContext2D} */
const c = elems.preview.getContext('2d', { willReadFrequently: true });

const WIDTH = 320;
const HEIGHT = 256;

function loadImage(file) {
  const url = URL.createObjectURL(file);
  const image = new Image();
  image.addEventListener('load', () => {
    c.drawImage(image, 0, 0, WIDTH, HEIGHT);
    URL.revokeObjectURL(url);
  });
  image.src = url;
}

elems.image.addEventListener('change', () => {
  if (elems.image.files[0]) {
    loadImage(elems.image.files[0]);
  }
});

document.addEventListener('paste', e => {
  if (e.clipboardData.files[0]) {
    loadImage(e.clipboardData.files[0]);
  }
});

fetch('./sstv-test-image.jpg')
  .then(r => r.blob())
  .then(loadImage);

/** @type {AudioContext} */
let context;

elems.play.addEventListener('click', () => {
  context ??= new AudioContext();
  const tone = new Tone(context, 0.1);
  writeImageToTone(c.getImageData(0, 0, WIDTH, HEIGHT), tone);

  elems.play.disabled = true;
  elems.stop.disabled = false;
  tone.play().then(() => {
    elems.play.disabled = false;
    elems.stop.disabled = true;
  });

  elems.stop.onclick = () => tone.stop();
});

elems.render.addEventListener('click', async () => {
  elems.render.disabled = true;
  const context = new OfflineAudioContext({
    numberOfChannels: 1,
    length: Math.ceil((111343.32 * 44100) / 1000),
    sampleRate: 44100
  });
  const tone = new Tone(context);
  writeImageToTone(c.getImageData(0, 0, WIDTH, HEIGHT), tone);
  tone.play();
});
