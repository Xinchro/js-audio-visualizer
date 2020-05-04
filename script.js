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
let seconds = 0
let loud_volume_threshold = 30
let colorPercent = 0

function startStream(stream) {
  permission = true

  let audioStream = audioContent.createMediaStreamSource( stream )
  let analyser = audioContent.createAnalyser()
  let fftSize = 1024

  analyser.fftSize = fftSize
  audioStream.connect(analyser)

  let bufferLength = analyser.frequencyBinCount
  let frequencyArray = new Uint8Array(bufferLength)

  visualizer.setAttribute('viewBox', '0 0 1024 256')

  for(let i=0; i<1024; i++) {
    path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('stroke-dasharray', '2,1')
    path.classList.add('topRight')
    topRightMask.appendChild(path)
  }

  for(let i=0; i<1024; i++) {
    path = document.createElementNS('http://www.w3.org/2000/svg', 'path')
    path.setAttribute('stroke-dasharray', '2,1')
    path.classList.add('bottomRight')
    bottomRightMask.appendChild(path)
  }
  for(let i=0; i<1024; i++) {
    path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('stroke-dasharray', '2,1')
    path.classList.add('topLeft')
    topLeftMask.appendChild(path)
  }

  for(let i=0; i<1024; i++) {
    path = document.createElementNS('http://www.w3.org/2000/svg', 'path')
    path.setAttribute('stroke-dasharray', '2,1')
    path.classList.add('bottomLeft')
    bottomLeftMask.appendChild(path)
  }

  let draw = function () {
    requestAnimationFrame(draw)
    analyser.getByteFrequencyData(frequencyArray)

    let adjustedLength

    for(let i=0; i<1024; i++) {
      adjustedLength = (Math.floor(frequencyArray[i]) - (Math.floor(frequencyArray[i]) % 3))/2
      topRightPaths[i].setAttribute('d', 'M '+ (508+i) +',125 l 0,-' + adjustedLength)
      bottomRightPaths[i].setAttribute('d', 'M '+ (508+i) +',125 l 0,' + adjustedLength)
    }
    for(let i=0; i<1024; i++) {
      adjustedLength = (Math.floor(frequencyArray[i]) - (Math.floor(frequencyArray[i]) % 3))/2
      topLeftPaths[i].setAttribute('d', 'M '+ (508-i) +',125 l 0,-' + adjustedLength)
      bottomLeftPaths[i].setAttribute('d', 'M '+ (508-i) +',125 l 0,' + adjustedLength)
    }
  }

  draw()
}

function showError(error) {
  console.error(error)
}

navigator.mediaDevices.getUserMedia({ audio: true })
  .then(startStream)
  .catch(showError)

AudioContext = window.AudioContext || window.webkitAudioContext
audioContent = new AudioContext()
