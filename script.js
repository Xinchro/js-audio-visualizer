let audioContext = new(window.AudioContext || window.webkitAudioContext)();
let analyser = audioContext.createAnalyser();
let bufferLength
let dataArray
let canvas
let canvasCtx
let audioStream
let frame = 0

navigator.mediaDevices.getUserMedia({ audio: true })
  .then(startStream)
  .catch(showError)

function showError(error) {
  console.error(error)
}

function startStream(stream) {
  audioStream = stream
  analyser.fftSize = 2048;
  // analyser.minDecibels = -50
  bufferLength = analyser.frequencyBinCount;
  dataArray = new Float32Array(bufferLength);
  sourceNode = audioContext.createMediaStreamSource(stream)
  sourceNode.connect(analyser)

  // Get a canvas defined with ID "oscilloscope"
  canvas = document.getElementById("oscilloscope");
  canvasCtx = canvas.getContext("2d");

  draw();
}

// draw an oscilloscope of the current audio source

function draw() {
  requestAnimationFrame(draw);

  analyser.getFloatFrequencyData(dataArray);
  analyser.smoothingTimeConstant = 0.1

  canvasCtx.fillStyle = "rgb(200, 200, 200)";
  canvasCtx.fillRect(0, 0, canvas.width, canvas.height);

  canvasCtx.lineWidth = 2;
  canvasCtx.strokeStyle = "rgb(0, 0, 0)";

  canvasCtx.beginPath();

  let sliceWidth = canvas.width * 10.0 / bufferLength;
  let x = 0;

  for (let i = 0; i < bufferLength; i++) {

    let y = 128-Math.abs(dataArray[i])

    canvasCtx.fillStyle = 'hsl(' + (x-frame) + ',100%,50%)';
    canvasCtx.fillRect(x, canvas.height - y, sliceWidth, canvas.height)

    x += sliceWidth;
  }

  canvasCtx.lineTo(canvas.width, canvas.height / 2);
  canvasCtx.stroke();
  frame++
}