let audioContext = new(window.AudioContext || window.webkitAudioContext)();
let analyser = audioContext.createAnalyser();
let bufferLength
let dataArray
let canvas
let canvasCtx
let audioStream
let frame = 0
let heightMultiplier = 2
let fftSize = 32

navigator.mediaDevices.getUserMedia({ audio: true })
  .then(startStream)
  .catch(showError)

function showError(error) {
  console.error(error)
}

function startStream(stream) {
  audioStream = stream
  updateFftSize(fftSize)
  // analyser.minDecibels = -50


  // Get a canvas defined with ID "oscilloscope"
  canvas = document.getElementById("oscilloscope");
  canvasCtx = canvas.getContext("2d");
  canvasCtx.canvas.width  = window.innerWidth;
  canvasCtx.canvas.height = window.innerHeight;

  draw();
}

function updateFftSize(newSize) {
  analyser.fftSize = newSize
  bufferLength = analyser.frequencyBinCount
  dataArray = new Float32Array(bufferLength)
  sourceNode = audioContext.createMediaStreamSource(audioStream)
  sourceNode.connect(analyser)
}

// draw an oscilloscope of the current audio source

function draw() {
  requestAnimationFrame(draw);

  analyser.getFloatFrequencyData(dataArray);
  let decay = 0.8 // higher is slower
  analyser.smoothingTimeConstant = decay

  canvasCtx.fillStyle = "rgb(200, 200, 200)";
  canvasCtx.fillRect(0, 0, canvas.width, canvas.height);

  canvasCtx.lineWidth = 2;
  canvasCtx.strokeStyle = "rgb(0, 0, 0)";

  canvasCtx.beginPath();

  let sliceWidth = canvas.width * 1.0 / bufferLength;
  let x = 0;

  document.getElementById("feedback") ? document.getElementById("feedback").innerText = dataArray[0] : ''
  for (let i = 0; i < bufferLength; i++) {

    let y = 128 - Math.abs(dataArray[i]) // 128 is oscilloscope 0 (center)

    canvasCtx.fillStyle = 'hsl(' + (x-frame) + ',100%,50%)';
    canvasCtx.fillRect(x, canvas.height - (y * heightMultiplier), sliceWidth, canvas.height)

    x += sliceWidth;
  }

  canvasCtx.lineTo(canvas.width, canvas.height / 2);
  canvasCtx.stroke();
  frame++
}