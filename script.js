let audioContext = new(window.AudioContext || window.webkitAudioContext)()
let analyser = audioContext.createAnalyser()
let bufferLength
let dataArray
let canvas
let canvasCtx
let audioStream
let frame = 0
let heightMultiplier = 10
let fftSize = 64
let decay = 0.5 // higher is slower
let groupWidth = 1.0 // higher groups more frequencies to the same visual bar

navigator.mediaDevices.getUserMedia({ audio: true })
  .then(startStream)
  .catch(showError)

function showError(error) {
  console.error(error)
}

function startStream(stream) {
  audioStream = stream
  updateFftSize(fftSize)

  canvas = document.getElementById('visualizer')
  canvasCtx = canvas.getContext('2d')
  scale = window.devicePixelRatio
  canvas.style.width = 1920 + 'px'
  canvas.style.height = 1080 + 'px'
  canvas.width = Math.floor(1920 * scale)
  canvas.height = Math.floor(1080 * scale)
  canvasCtx.scale(scale, scale)
  canvasCtx.canvas.width  = 1920
  canvasCtx.canvas.height = 1080

  draw()
}

function updateFftSize(newSize) {
  analyser.fftSize = newSize
  bufferLength = analyser.frequencyBinCount
  dataArray = new Float32Array(bufferLength)
  sourceNode = audioContext.createMediaStreamSource(audioStream)
  sourceNode.connect(analyser)
}

function draw() {
  requestAnimationFrame(draw)
  canvasCtx.clearRect(0, 0, canvas.width, canvas.height) // clear the canvas every render

  analyser.getFloatFrequencyData(dataArray)
  analyser.smoothingTimeConstant = decay

  canvasCtx.fillStyle = 'rgba(200, 200, 200, 0)'

  canvasCtx.beginPath()

  groupWidth = groupWidth < bufferLength ? groupWidth : bufferLength
  console.log(bufferLength)

  let barWidth = canvas.width * groupWidth / bufferLength
  let x = 0

  document.getElementById('feedback') ? document.getElementById('feedback').innerText = dataArray[0] : ''

  for (let i = 0; i < bufferLength; i++) {

    let y = canvas.height - ((128 - Math.abs(dataArray[i])) * heightMultiplier) // 128 is oscilloscope 0 (center)
    if(y < 0) y = 0

    canvasCtx.fillStyle = 'hsl(' + (i*(360/bufferLength)+frame) + ',100%,50%)'
    canvasCtx.fillRect(x, y, barWidth, canvas.height)

    x += barWidth
  }

  frame++
}