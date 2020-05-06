let visualizer = document.getElementById('audio-visualizer')

let topRightMask = visualizer.getElementById('topRightMask')
let bottomRightMask = visualizer.getElementById('bottomRightMask')
let topRightPaths = topRightMask.getElementsByTagName('path')
let bottomRightPaths = bottomRightMask.getElementsByTagName('path')

let topLeftMask = visualizer.getElementById('topLeftMask')
let bottomLeftMask = visualizer.getElementById('bottomLeftMask')
let topLeftPaths = topLeftMask.getElementsByTagName('path')
let bottomLeftPaths = bottomLeftMask.getElementsByTagName('path')

let AudioContext
let audioContent

let audioStream
let analyser
let fftSize

let frequencyArray

let widthResolution
let height

let bufferLength
frequencyArray

let pixelHeight
let pixelGap
let strokeWidth

function startStream(stream) {
  audioStream = audioContent.createMediaStreamSource( stream )
  analyser = audioContent.createAnalyser()
  fftSize = 256

  analyser.fftSize = fftSize // range (guessing) from 0dB to X
  audioStream.connect(analyser)

  // if(widthResolution <= fftSize) { fits() }
  // at 128, performance matches native browser
  widthResolution = 256
  height = 512 // 512 because frequencies cap at 255, so 2 bars make ~512(actual 510)

  bufferLength = analyser.frequencyBinCount
  frequencyArray = new Uint8Array(bufferLength)

  pixelHeight = 1
  pixelGap = 1
  strokeWidth = .9

  visualizer.setAttribute('viewBox', `0 0 ${widthResolution} ${height}`)

  for(let i=0; i<widthResolution; i++) {
    let topRightPath = document.createElementNS('http://www.w3.org/2000/svg', 'path')
    topRightPath.setAttribute('stroke-dashoffset', -(pixelGap/2))
    topRightPath.setAttribute('stroke-dasharray', `${pixelHeight},${pixelGap}`)
    topRightPath.setAttribute('stroke-width', strokeWidth)
    topRightPath.classList.add('topRight')
    topRightMask.appendChild(topRightPath)

    let bottomRightPath = document.createElementNS('http://www.w3.org/2000/svg', 'path')
    bottomRightPath.setAttribute('stroke-dashoffset', -(pixelGap/2))
    bottomRightPath.setAttribute('stroke-dasharray', `${pixelHeight},${pixelGap}`)
    bottomRightPath.setAttribute('stroke-width', strokeWidth)
    bottomRightPath.classList.add('bottomRight')
    bottomRightMask.appendChild(bottomRightPath)

    let topLeftPath = document.createElementNS('http://www.w3.org/2000/svg', 'path')
    topLeftPath.setAttribute('stroke-dashoffset', -(pixelGap/2))
    topLeftPath.setAttribute('stroke-dasharray', `${pixelHeight},${pixelGap}`)
    topLeftPath.setAttribute('stroke-width', strokeWidth)
    topLeftPath.classList.add('topLeft')
    topLeftMask.appendChild(topLeftPath)

    let bottomLeftPath = document.createElementNS('http://www.w3.org/2000/svg', 'path')
    bottomLeftPath.setAttribute('stroke-dashoffset', -(pixelGap/2))
    bottomLeftPath.setAttribute('stroke-dasharray', `${pixelHeight},${pixelGap}`)
    bottomLeftPath.setAttribute('stroke-width', strokeWidth)
    bottomLeftPath.classList.add('bottomLeft')
    bottomLeftMask.appendChild(bottomLeftPath)
  }


  let animation = setInterval(draw, 1000/60)
}

function showError(error) {
  console.error(error)
}

let draw = function () {
  analyser.getByteFrequencyData(frequencyArray)

  let barHeight, newHeight

  for(let i=0; i<widthResolution; i++) {
    barHeight = Math.floor(frequencyArray[i])

    newHeight = barHeight > pixelHeight ? (barHeight + pixelGap/2) : pixelHeight*2

    topRightPaths[i]
      .setAttribute('d',
        'M '
        + (Math.ceil((widthResolution/2) + strokeWidth/2)+i) // horizontal translate
        +`,${Math.ceil((height*100)/2)/100 - (Math.ceil((0.75*100)/2)/100)} l 0,-` // vertical translate + offset
        + newHeight)

    bottomRightPaths[i]
      .setAttribute('d',
        'M '
        + (Math.ceil((widthResolution/2) + strokeWidth/2)+i)
        +`,${Math.ceil((height*100)/2)/100 + (Math.ceil((0.75*100)/2)/100)} l 0,`
        + newHeight)

    topLeftPaths[i]
      .setAttribute('d',
        'M '
        + (Math.ceil((widthResolution/2) - strokeWidth/2)-i)
        +`,${Math.ceil((height*100)/2)/100 - (Math.ceil((0.75*100)/2)/100)} l 0,-`
        + newHeight)

    bottomLeftPaths[i]
      .setAttribute('d',
        'M '
        + (Math.ceil((widthResolution/2) - strokeWidth/2)-i)
        +`,${Math.ceil((height*100)/2)/100 + (Math.ceil((0.75*100)/2)/100)} l 0,`
        + newHeight)
  }
}

navigator.mediaDevices.getUserMedia({ audio: true })
  .then(startStream)
  .catch(showError)

AudioContext = window.AudioContext || window.webkitAudioContext
audioContent = new AudioContext()
