let audioContext = new(window.AudioContext || window.webkitAudioContext)()
let analyser = audioContext.createAnalyser()
let bufferLength
let dataArray
let canvas
let canvasCtx
let audioStream
let frame = 0
let heightMultiplier = 10
let fftSize = 128
let decay = 0.5 // higher is slower
let groupWidth = 1.0 // higher groups more frequencies to the same visual bar
let barWidth
let focusPoint = false

navigator.mediaDevices.getUserMedia({ audio: true })
  .then(startStream)
  .catch(showError)

function showError(error) {
  console.error(error)
}

function startStream(stream) {
  audioStream = stream
  setFftSize(fftSize)

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

function setFftSize(newSize) {
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

  // drawSingleVariant()
  // drawQuadVariant()
  diskVariant()

  frame++
}

function diskVariant() {
  let radius = 100
  let circumference = 2 * Math.PI * radius
  let totalDisc = 2 * Math.PI
  let maxBarHeight = (canvas.height - (radius*2))/2
  let normalized = false

  let reducer = (accumulator, currentValue) => accumulator + currentValue
  dataArraySum = dataArray.reduce(reducer)
  dataArrayNormalised = dataArray.map((freq) => {
    return freq/dataArraySum*100
  })

  for (let i = 0; i < bufferLength; i++) {
    let x1 = 0
    let y1 = 0
    let x2 = 0
    let y2 = 0
    let volume = normalized ?
      (128 - Math.abs(dataArray[i]))*dataArrayNormalised[i]
      : 128 - Math.abs(dataArray[i])
    let percentage = i / bufferLength
    let angle = totalDisc * percentage

    let segmentLength = circumference / bufferLength

    let posx = Math.cos(angle)
    let posy = Math.sin(angle)

    y1 = canvas.height - ((volume) * heightMultiplier)/2 // 128 is oscilloscope 0 (center)

    x1 = canvas.width/2 + posx * radius
    y1 = canvas.height/2 + posy * radius
    x2 = segmentLength
    y2 = ((volume) * heightMultiplier)/2

    tx1 = canvas.width/4 + Math.cos(i) * radius
    ty1 = canvas.height/4 + Math.sin(i) * radius

    if(y2 <= segmentLength) { //min size
      y2 = segmentLength
    }
    if(y2 >= maxBarHeight) { //max size
      y2 = maxBarHeight
    }

    canvasCtx.fillStyle = 'hsla(' + (i*(360/bufferLength)+frame) + ',100%,50%,50%)'
    canvasCtx.translate(canvas.width/2, canvas.height/2)
    canvasCtx.rotate(angle - Math.PI)
    canvasCtx.fillRect(0, radius, x2, y2)
    canvasCtx.setTransform(1, 0, 0, 1, 0, 0)

  }
}

function drawQuadVariant() {
  barWidth = canvas.width * groupWidth / bufferLength
  let xOffset = 0

  for (let i = 0; i < bufferLength; i++) {
    let x1 = 0
    let y1 = 0
    let x2 = 0
    let y2 = 0
    let volume = 0

    volume = 128 - Math.abs(dataArray[i])

    y1 = canvas.height - ((volume) * heightMultiplier)/2 // 128 is oscilloscope 0 (center)
    // if(y2 <= 0) y1 = 0

    x1 = x1+canvas.width/2
    y1 = y1/2
    x2 = barWidth/2
    y2 = (canvas.height/2 - y1)*2

    if(y2 <= 0) {
      y2 = 10
      y1 = canvas.height/2 - y2/2
    }

    // right side
    canvasCtx.fillStyle = 'hsla(' + (i*(360/bufferLength)+frame) + ',100%,50%,50%)'
    canvasCtx.fillRect(x1+xOffset, y1, x2, y2) // top right

    //left side
    if(focusPoint) {
      canvasCtx.fillStyle = 'hsla(' + (i*(360/bufferLength)+frame) + ',100%,50%,50%)'
    } else {
      canvasCtx.fillStyle = 'hsla(' + (frame-i*(360/bufferLength)) + ',100%,50%,50%)'
    }
    // don't render first bar on the left, to not overlap with right
    if(i!=0) canvasCtx.fillRect(x1-xOffset, y1, x2, y2) // top left

    xOffset += barWidth/2
  }
}

function drawSingleVariant() {
  barWidth = canvas.width * groupWidth / bufferLength
  let x = 0
  for (let i = 0; i < bufferLength; i++) {

    let y = canvas.height - ((128 - Math.abs(dataArray[i])) * heightMultiplier) // 128 is oscilloscope 0 (center)
    if(y < 0) y = 0

    canvasCtx.fillStyle = 'hsl(' + (i*(360/bufferLength)+frame) + ',100%,50%)'
    canvasCtx.fillRect(x, y, barWidth, canvas.height)

    x += barWidth
  }
}