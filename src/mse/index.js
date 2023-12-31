import EVENTS from '../events'

const { MSE_EVENTS } = EVENTS
class MSE {
  constructor (configs, context) {
    if (context) {
      this._context = context
      this.emit = context._emitter.emit.bind(context._emitter)
    }

    this.TAG = 'MSE'

    this.configs = Object.assign({}, configs)
    this.container = this.configs.container
    this.format = this.configs.format // hls | flv
    this.mediaSource = null
    this.sourceBuffers = {}
    this.preloadTime = this.configs.preloadTime || 1
    this.onSourceOpen = this.onSourceOpen.bind(this)
    this.onTimeUpdate = this.onTimeUpdate.bind(this)
    this.onUpdateEnd = this.onUpdateEnd.bind(this)
    this.onWaiting = this.onWaiting.bind(this)
    this.opened = false
  }

  init () {
    // eslint-disable-next-line no-undef
    this.mediaSource = new self.MediaSource()
    this.mediaSource.addEventListener('sourceopen', this.onSourceOpen)
    this._url = null
    this.container.addEventListener('timeupdate', this.onTimeUpdate)
    this.container.addEventListener('waiting', this.onWaiting)
  }

  resetContext (newCtx, keepBuffer) {
    this._context = newCtx
    this.emit = newCtx._emitter.emit.bind(newCtx._emitter)
    if (!keepBuffer) {
      for (let i = 0; i < Object.keys(this.sourceBuffers).length; i++) {
        let buffer = this.sourceBuffers[Object.keys(this.sourceBuffers)[i]]
        if (!buffer.updating) {
          MSE.clearBuffer(buffer)
        }
      }
    }
  }

  onTimeUpdate () {
    this.emit('TIME_UPDATE', this.container)
  }

  onWaiting () {
    this.emit('WAITING', this.container)
  }

  onSourceOpen () {
    this.opened = true
    this.addSourceBuffers()
  }

  onUpdateEnd () {
    this.emit(MSE_EVENTS.SOURCE_UPDATE_END)
    this.doAppend()
  }
  addSourceBuffers () {
    if (!this.mediaSource || this.mediaSource.readyState !== 'open' || !this.opened) {
      return
    }
    let sources = this._context.getInstance('PRE_SOURCE_BUFFER')
    let tracks = this._context.getInstance('TRACKS')
    let track
    if (!sources || !tracks) {
      return
    }

    sources = sources.sources
    let add = false
    for (let i = 0, k = Object.keys(sources).length; i < k; i++) {
      let type = Object.keys(sources)[i]
      add = false
      if (type === 'audio') {
        track = tracks.audioTrack
      } else if (type === 'video') {
        track = tracks.videoTrack
        // return;
      }
      if (track && sources[type].init !== null && sources[type].data.length) {
        add = true
      }
    }

    if (add) {
      if (Object.keys(this.sourceBuffers).length > 1) {
        return
      }
      for (let i = 0, k = Object.keys(sources).length; i < k; i++) {
        let type = Object.keys(sources)[i]
        if (this.sourceBuffers[type]) {
          continue
        }
        let source = sources[type]
        let mime = (type === 'video') ? 'video/mp4;codecs=' + source.mimetype : 'audio/mp4;codecs=' + source.mimetype

        try {
          // console.log('add sourcebuffer', mime);
          let sourceBuffer = this.mediaSource.addSourceBuffer(mime)
          this.sourceBuffers[type] = sourceBuffer
          sourceBuffer.addEventListener('updateend', this.onUpdateEnd)
        } catch (e) {
          if ((e.code === 22) && (Object.keys(this.sourceBuffers).length > 0)) {
            return this.emit(MSE_EVENTS.MSE_WRONG_TRACK_ADD, type)
          }
          this.emit(MSE_EVENTS.MSE_ERROR, this.TAG, new Error(e.message))
        }
      }
      if (Object.keys(this.sourceBuffers).length === this.sourceBufferLen) {
        this.doAppend()
      }
    }
  }

  doAppend () {
    if (!this.mediaSource || this.mediaSource.readyState === 'closed') return
    this._doCleanupSourceBuffer()
    let sources = this._context.getInstance('PRE_SOURCE_BUFFER')
    if (!sources) return
    if (Object.keys(this.sourceBuffers).length < this.sourceBufferLen) {
      return
    }
    for (let i = 0; i < Object.keys(this.sourceBuffers).length; i++) {
      let type = Object.keys(this.sourceBuffers)[i]
      let sourceBuffer = this.sourceBuffers[type]
      if (sourceBuffer.updating) continue
      let source = sources.sources[type]
      if (this[`no${type}`]) {
        source.data = []
        source.init.buffer = null
        continue
      }
      if (source && !source.inited) {
        try {
          // console.log('append init buffer: ', type)
          sourceBuffer.appendBuffer(source.init.buffer.buffer)
          source.inited = true
        } catch (e) {
          // DO NOTHING
        }
      } else if (source) {
        let data = source.data.shift()
        if (data) {
          try {
            // console.log('append buffer: ', type);
            sourceBuffer.appendBuffer(data.buffer.buffer)
          } catch (e) {
            source.data.unshift(data)
          }
        }
      }
    }
  }

  endOfStream () {
    try {
      const { readyState } = this.mediaSource
      if (readyState === 'open') {
        this.mediaSource.endOfStream()
      }
    } catch (e) {}
  }

  remove (end, start = 0) {
    try {
      for (let i = 0; i < Object.keys(this.sourceBuffers).length; i++) {
        let buffer = this.sourceBuffers[Object.keys(this.sourceBuffers)[i]]
        if (!buffer.updating) {
          if (end > start) {
            buffer.remove(start, end)
          }
        }
      }
    } catch (e) {}
  }

  _doCleanupSourceBuffer () {
    let currentTime = this.container.currentTime
    let autoCleanupMinBackwardDuration = 60 * 3
    let _pendingRemoveRanges = {
      video: [],
      audio: []
    }
    for (let i = 0; i < Object.keys(this.sourceBuffers).length; i++) {
      let type = Object.keys(this.sourceBuffers)[i]
      let sourceBuffer = this.sourceBuffers[type]
      let buffered = sourceBuffer.buffered
      let doRemove = false
      for (let j = 0; j < buffered.length; j++) {
        let start = buffered.start(j)
        let end = buffered.end(j)
        if (start <= currentTime && currentTime < end + 3) {
          if (currentTime - start >= autoCleanupMinBackwardDuration) {
            doRemove = true
            let removeEnd = currentTime - autoCleanupMinBackwardDuration
            _pendingRemoveRanges[type].push({start: start, end: removeEnd})
          }
        } else if (end < currentTime && (currentTime - start >= autoCleanupMinBackwardDuration)) {
          doRemove = true
          _pendingRemoveRanges[type].push({start: start, end: end})
        }
      }
      if (doRemove && !sourceBuffer.updating) {
        this._doRemoveRanges(_pendingRemoveRanges)
      }
    }
  }

  _doRemoveRanges (_pendingRemoveRanges) {
    for (let type in _pendingRemoveRanges) {
      if (!this.sourceBuffers[type] || this.sourceBuffers[type].updating) {
        continue
      }
      let sb = this.sourceBuffers[type]
      let ranges = _pendingRemoveRanges[type]
      while (ranges.length && !sb.updating) {
        let range = ranges.shift()
        try {
          if (range && range.end > range.start) {
            sb.remove(range.start, range.end)
          }
        } catch (e) {}
      }
    }
  }

  cleanBuffers () {
    const taskList = []
    for (let i = 0; i < Object.keys(this.sourceBuffers).length; i++) {
      let buffer = this.sourceBuffers[Object.keys(this.sourceBuffers)[i]]

      let task
      if (buffer.updating) {
        task = new Promise((resolve) => {
          const doCleanBuffer = function () {
            let retryTime = 3

            const clean = () => {
              if (!buffer.updating) {
                MSE.clearBuffer(buffer)
                buffer.addEventListener('updateend', () => {
                  resolve()
                })
              } else if (retryTime > 0) {
                setTimeout(clean, 200)
                retryTime--
              } else {
                resolve()
              }
            }

            setTimeout(clean, 200)
            buffer.removeEventListener('updateend', doCleanBuffer)
          }
          buffer.addEventListener('updateend', doCleanBuffer)
        })
      } else {
        task = new Promise((resolve) => {
          MSE.clearBuffer(buffer)
          buffer.addEventListener('updateend', () => {
            resolve()
          })
        })

        // task = Promise.resolve()
      }

      taskList.push(task)
    }

    return Promise.all(taskList)
  }

  removeBuffers () {
    const taskList = []
    for (let i = 0; i < Object.keys(this.sourceBuffers).length; i++) {
      let buffer = this.sourceBuffers[Object.keys(this.sourceBuffers)[i]]
      buffer.removeEventListener('updateend', this.onUpdateEnd)

      let task
      if (buffer.updating) {
        task = new Promise((resolve) => {
          const doCleanBuffer = function () {
            let retryTime = 3

            const clean = () => {
              if (!buffer.updating) {
                MSE.clearBuffer(buffer)
                buffer.addEventListener('updateend', () => {
                  resolve()
                })
              } else if (retryTime > 0) {
                setTimeout(clean, 200)
                retryTime--
              } else {
                resolve()
              }
            }

            setTimeout(clean, 200)
            buffer.removeEventListener('updateend', doCleanBuffer)
          }
          buffer.addEventListener('updateend', doCleanBuffer)
        })
      } else {
        task = new Promise((resolve) => {
          MSE.clearBuffer(buffer)
          buffer.addEventListener('updateend', () => {
            resolve()
          })
        })

        // task = Promise.resolve()
      }

      taskList.push(task)
    }

    return Promise.all(taskList)
  }

  destroy () {
    if (!this.container) return Promise.resolve()
    this.container.removeEventListener('timeupdate', this.onTimeUpdate)
    this.container.removeEventListener('waiting', this.onWaiting)
    this.mediaSource.removeEventListener('sourceopen', this.onSourceOpen)
    return this.removeBuffers().then(() => {
      let sources = Object.keys(this.sourceBuffers)
      for (let i = 0; i < sources.length; i++) {
        let buffer = this.sourceBuffers[sources[i]]
        delete this.sourceBuffers[sources[i]]

        if (this.mediaSource.readyState === 'open') {
          this.mediaSource.removeSourceBuffer(buffer)
        }
      }

      this.endOfStream()
      try {
        window.URL.revokeObjectURL(this.url)
      } catch (e) {}

      this.url = null
      this.configs = {}
      this.container = null
      this.mediaSource = null
      this.sourceBuffers = {}
      this.preloadTime = 1

      this.onSourceOpen = null
      this.onTimeUpdate = null
      this.onUpdateEnd = null
      this.onWaiting = null
      this.noaudio = undefined
      this.novideo = undefined
    })
  }

  get sourceBufferLen () {
    if (!this._context.mediaInfo) {
      if (this.noaudio || this.novideo) return 1
      return 2
    }
    return (!!this._context.mediaInfo.hasVideo && !this.novideo) + (!!this._context.mediaInfo.hasAudio && !this.noaudio)
  }

  set url (val) {
    this._url = val
  }

  get url () {
    if (!this._url) {
      try {
        this._url = window.URL.createObjectURL(this.mediaSource)
      } catch (e) {}
    }
    return this._url
  }

  static clearBuffer (buffer) {
    try {
      const buffered = buffer.buffered
      let bEnd = 0.1
      for (let i = 0, len = buffered.length; i < len; i++) {
        bEnd = buffered.end(i)
      }
      buffer.remove(0, bEnd)
    } catch (e) {
      // DO NOTHING
    }
  }
}
export default MSE
