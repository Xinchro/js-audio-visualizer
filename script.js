// defaults
let settings = {
  "variant": "bar",
  "heightMultiplier": 10,
  "fftSize": 128,
  "decay": 0.5, // higher is slower
  "groupWidth": 1.0, // higher groups more frequencies to the same visual bar
  "barWidth": 0,
  "focusPoint": false,
  "normalized": false
}

let audioContext = new(window.AudioContext || window.webkitAudioContext)()
let analyser = audioContext.createAnalyser()
let audioStream
let bufferLength
let canvas
let canvasCtx
let dataArray
let dataArrayNormalized
let frame = 0

navigator.mediaDevices.getUserMedia({ audio: true })
  .then((media) => fetchSettings(media))
  .then(({ media, fetchedSettings }) => startStream(media, fetchedSettings))
  .catch(showError)


function fetchSettings(media) {
  var request = new XMLHttpRequest()
  request.open('GET', `./settings.json?t=${new Date()}`, false)
  request.send(null)

  if(request.status === 200) {
    return { media, "fetchedSettings": JSON.parse(request.response) }
  } else {
    return { media, "fetchedSettings": {} }
  }
}

function loadSettings(fetchedSettings) {
  settings = {
    ...settings,
    ...fetchedSettings
  }
}

function showError(error) {
  console.error(error)
}

function startStream(stream, fetchedSettings) {
  loadSettings(fetchedSettings)

  audioStream = stream
  setFftSize(settings.fftSize)

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
  analyser.smoothingTimeConstant = settings.decay

  let reducer = (accumulator, currentValue) => accumulator + currentValue
  dataArraySum = dataArray.reduce(reducer)
  dataArrayNormalized = dataArray.map((freq) => {
    return freq/dataArraySum*100
  })

  canvasCtx.fillStyle = 'rgba(200, 200, 200, 0)'

  canvasCtx.beginPath()

  settings.groupWidth = settings.groupWidth < bufferLength ? settings.groupWidth : bufferLength

  pickVariant()

  frame++
}

function pickVariant() {
  switch(settings.variant) {
    case "vertParticles":
      verticalParticles()
      break
    case "barQuad":
      drawQuadVariant()
      break
    case "disc":
      diskVariant()
      break
    case "discMirror":
      diskMirrorVariant()
      break
    case "bar":
    default:
      drawSingleVariant()
  }
}

let particleWaves = []
function verticalParticles() {
  settings.barWidth = canvas.width * settings.groupWidth / bufferLength
  let x = settings.barWidth/2

  for (let i = 0; i < bufferLength; i++) {
    let y = canvas.height - ((128 - Math.abs(dataArray[i])) * settings.heightMultiplier) // 128 is oscilloscope 0 (center)

    if(!particleWaves[i]) {
      particleWaves[i] = {
        start: canvas.height,
        end: y,
        current: canvas.height,
        peaked: false,
        ready: true
      }
    }

    particleWaves[i].end = y
    let increment = 10

    if(particleWaves[i].peaked) {
      particleWaves[i].current += increment
    } else {
      particleWaves[i].current -= increment
    }

    if(particleWaves[i].current - increment < particleWaves[i].end) {
      particleWaves[i].peaked = true
      particleWaves[i].current = y
    }

    if(particleWaves[i].current + increment > particleWaves[i].start) {
      particleWaves[i].ready = true
    }

    if(particleWaves[i].ready) {
      particleWaves[i].start = canvas.height
      particleWaves[i].end = y > 0 && y < canvas.height ? y : canvas.height
      particleWaves[i].current = canvas.height
      particleWaves[i].ready = false
      particleWaves[i].peaked = false
    }

    canvasCtx.fillStyle = 'hsl(' + (frame+360*(particleWaves[i].current/1080)) + ',100%,50%)'
    canvasCtx.beginPath()
    canvasCtx.arc(x, canvas.height-(canvas.height-particleWaves[i].current), settings.barWidth/2, 0, Math.PI*2, false)
    canvasCtx.closePath()
    canvasCtx.fill()
    canvasCtx.font = "12px Arial"
    canvasCtx.fillText(Math.floor(particleWaves[i].start), x,25)
    canvasCtx.fillText(Math.floor(particleWaves[i].end), x,50)
    canvasCtx.fillText(Math.floor(particleWaves[i].current), x,75)
    canvasCtx.fillText(Math.floor(particleWaves[i].ready), x,100)
    canvasCtx.fillText(Math.floor(particleWaves[i].peaked), x,125)

    canvasCtx.fillStyle = 'rgba(125,125,125,1)'
    canvasCtx.beginPath()
    canvasCtx.arc(x, y, settings.barWidth/2, 0, Math.PI*2, false)
    canvasCtx.closePath()
    canvasCtx.fill()
    canvasCtx.setTransform(1, 0, 0, 1, 0, 0) // reset matrix

    x += settings.barWidth
  }
}

function diskMirrorVariant() {
  let radius = 100
  let circumference = Math.PI * radius
  let totalDisc = Math.PI
  let maxBarHeight = (canvas.height - (radius*2))/2

  let angleOffset = (totalDisc * 1 / bufferLength)/2

  for (let i = 0; i < bufferLength; i++) {
    let x1 = 0
    let y1 = 0
    let x2 = 0
    let y2 = 0
    let volume = settings.normalized ?
      (128 - Math.abs(dataArray[i]))*dataArrayNormalized[i]
      : 128 - Math.abs(dataArray[i])
    let percentage = i / bufferLength
    let angle = totalDisc * percentage

    let segmentLength = circumference / bufferLength

    let posx = Math.cos(angle)
    let posy = Math.sin(angle)

    y1 = canvas.height - ((volume) * settings.heightMultiplier)/2 // 128 is oscilloscope 0 (center)

    x1 = canvas.width/2 + posx * radius
    y1 = canvas.height/2 + posy * radius
    x2 = segmentLength
    y2 = ((volume) * settings.heightMultiplier)/2

    tx1 = canvas.width/4 + Math.cos(i) * radius
    ty1 = canvas.height/4 + Math.sin(i) * radius

    if(y2 <= segmentLength) { //min size
      y2 = segmentLength
    }
    if(y2 >= maxBarHeight) { //max size
      y2 = maxBarHeight
    }


    // right
    canvasCtx.fillStyle = 'hsla(' + (i*(180/bufferLength)+frame) + ',100%,50%,50%)'
    canvasCtx.translate(canvas.width/2 , canvas.height/2 )
    canvasCtx.rotate(angleOffset + angle - Math.PI)
    canvasCtx.fillRect(-x2/2, radius, x2, y2)
    canvasCtx.setTransform(1, 0, 0, 1, 0, 0) // reset matrix

    // left
    if(settings.focusPoint) {
      canvasCtx.fillStyle = 'hsla(' + (i*(180/bufferLength)+frame) + ',100%,50%,50%)'
    } else {
      canvasCtx.fillStyle = 'hsla(' + (frame-i*(180/bufferLength)) + ',100%,50%,50%)'
    }
    canvasCtx.translate(canvas.width/2 , canvas.height/2 )
    canvasCtx.rotate(-angleOffset - angle - Math.PI)
    canvasCtx.fillRect(-x2/2, radius, x2, y2)
    canvasCtx.setTransform(1, 0, 0, 1, 0, 0) // reset matrix
  }
}

function diskVariant() {
  let radius = 100
  let circumference = 2 * Math.PI * radius
  let totalDisc = 2 * Math.PI
  let maxBarHeight = (canvas.height - (radius*2))/2
  let normalized = false

  for (let i = 0; i < bufferLength; i++) {
    let x1 = 0
    let y1 = 0
    let x2 = 0
    let y2 = 0
    let volume = settings.normalized ?
      (128 - Math.abs(dataArray[i]))*dataArrayNormalized[i]
      : 128 - Math.abs(dataArray[i])
    let percentage = i / bufferLength
    let angle = totalDisc * percentage

    let segmentLength = circumference / bufferLength

    let posx = Math.cos(angle)
    let posy = Math.sin(angle)

    y1 = canvas.height - ((volume) * settings.heightMultiplier)/2 // 128 is oscilloscope 0 (center)

    x1 = canvas.width/2 + posx * radius
    y1 = canvas.height/2 + posy * radius
    x2 = segmentLength
    y2 = ((volume) * settings.heightMultiplier)/2

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
    canvasCtx.fillRect(0, radius, -x2, y2)
    canvasCtx.setTransform(1, 0, 0, 1, 0, 0)

  }
}

function drawQuadVariant() {
  settings.barWidth = canvas.width * settings.groupWidth / bufferLength
  let xOffset = 0

  for (let i = 0; i < bufferLength; i++) {
    let x1 = 0
    let y1 = 0
    let x2 = 0
    let y2 = 0
    let volume = settings.normalized ?
      (128 - Math.abs(dataArray[i]))*dataArrayNormalized[i]
      : 128 - Math.abs(dataArray[i])


    x1 = x1+canvas.width/2
    y1 = canvas.height/2 - ((volume) * settings.heightMultiplier)/2
    x2 = settings.barWidth/2
    y2 = (canvas.height/2 - y1)*2

    if(y2 <= 0) {
      y2 = 10
      y1 = canvas.height/2 - y2/2
    }

    // right side
    canvasCtx.fillStyle = 'hsla(' + (i*(360/bufferLength)+frame) + ',100%,50%,50%)'
    canvasCtx.fillRect(x1+xOffset, y1, x2, y2) // top right

    //left side
    if(settings.focusPoint) {
      canvasCtx.fillStyle = 'hsla(' + (i*(360/bufferLength)+frame) + ',100%,50%,50%)'
    } else {
      canvasCtx.fillStyle = 'hsla(' + (frame-i*(360/bufferLength)) + ',100%,50%,50%)'
    }
    // don't render first bar on the left, to not overlap with right
    if(i!=0) canvasCtx.fillRect(x1-xOffset, y1, x2, y2) // top left

    xOffset += settings.barWidth/2
  }
}

function drawSingleVariant() {
  settings.barWidth = canvas.width * settings.groupWidth / bufferLength
  let x = 0
  for (let i = 0; i < bufferLength; i++) {

    let y = canvas.height - ((128 - Math.abs(dataArray[i])) * settings.heightMultiplier) // 128 is oscilloscope 0 (center)
    if(y < 0) y = 0

    canvasCtx.fillStyle = 'hsl(' + (i*(360/bufferLength)+frame) + ',100%,50%)'
    canvasCtx.fillRect(x, y, settings.barWidth, canvas.height)

    x += settings.barWidth
  }
}