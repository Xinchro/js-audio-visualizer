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
let path

function startStream(stream) {
  let audioStream = audioContent.createMediaStreamSource( stream )
  let analyser = audioContent.createAnalyser()
  let fftSize = 256

  analyser.fftSize = fftSize // range (guessing) from 0dB to X
  audioStream.connect(analyser)

  // if(widthResolution <= fftSize) { fits() }
  // at 128, performance matches native browser
  let widthResolution = 256
  let height = 512 // 512 because frequencies cap at 255, so 2 bars make ~512(actual 510)

  let bufferLength = analyser.frequencyBinCount
  let frequencyArray = new Uint8Array(bufferLength)

  let pixelHeight = 2
  let pixelSpace = 1
  let strokeWidth = .1

  visualizer.setAttribute('viewBox', `0 0 ${widthResolution} ${height}`)

  for(let i=0; i<widthResolution; i++) {
    path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('stroke-dashoffset', `${pixelHeight/2}`)
    path.setAttribute('stroke-dasharray', `${pixelHeight},${pixelSpace}`)
    path.setAttribute('stroke-width', strokeWidth)
    path.classList.add('topRight')
    topRightMask.appendChild(path)

    path2 = document.createElementNS('http://www.w3.org/2000/svg', 'path')
    path2.setAttribute('stroke-dashoffset', `${pixelHeight/2}`)
    path2.setAttribute('stroke-dasharray', `${pixelHeight},${pixelSpace}`)
    path2.setAttribute('stroke-width', strokeWidth)
    path2.classList.add('bottomRight')
    bottomRightMask.appendChild(path2)

    path3 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path3.setAttribute('stroke-dashoffset', `${pixelHeight/2}`)
    path3.setAttribute('stroke-dasharray', `${pixelHeight},${pixelSpace}`)
    path3.setAttribute('stroke-width', strokeWidth)
    path3.classList.add('topLeft')
    topLeftMask.appendChild(path3)

    path4 = document.createElementNS('http://www.w3.org/2000/svg', 'path')
    path4.setAttribute('stroke-dashoffset', `${pixelHeight/2}`)
    path4.setAttribute('stroke-dasharray', `${pixelHeight},${pixelSpace}`)
    path4.setAttribute('stroke-width', strokeWidth)
    path4.classList.add('bottomLeft')
    bottomLeftMask.appendChild(path4)
  }

  let draw = function () {
    analyser.getByteFrequencyData(frequencyArray)

    let barHeight, newHeight

    for(let i=0; i<widthResolution; i++) {
      barHeight = Math.floor(frequencyArray[i])

      newHeight = barHeight > pixelHeight ? barHeight : pixelHeight/2

      topRightPaths[i]
        .setAttribute('d',
          'M '
          + (Math.ceil((widthResolution/2) + 0.5)+i)
          +`,${(height/2) - (0.75/2)} l 0,-`
          + newHeight)

      bottomRightPaths[i]
        .setAttribute('d',
          'M '
          + (Math.ceil((widthResolution/2) + 0.5)+i)
          +`,${(height/2) + (0.75/2)} l 0,`
          + newHeight)

      topLeftPaths[i]
        .setAttribute('d',
          'M '
          + (Math.ceil((widthResolution/2) - 0.5)-i)
          +`,${(height/2) - (0.75/2)} l 0,-`
          + newHeight)

      bottomLeftPaths[i]
        .setAttribute('d',
          'M '
          + (Math.ceil((widthResolution/2) - 0.5)-i)
          +`,${(height/2) + (0.75/2)} l 0,`
          + newHeight)
    }
  }

  let animation = setInterval(draw, 1000/60)
}

function showError(error) {
  console.error(error)
}

navigator.mediaDevices.getUserMedia({ audio: true })
  .then(startStream)
  .catch(showError)

AudioContext = window.AudioContext || window.webkitAudioContext
audioContent = new AudioContext()
