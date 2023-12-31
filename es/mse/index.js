function _typeof(obj) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) { return typeof obj; } : function (obj) { return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }, _typeof(obj); }
function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, _toPropertyKey(descriptor.key), descriptor); } }
function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); Object.defineProperty(Constructor, "prototype", { writable: false }); return Constructor; }
function _toPropertyKey(arg) { var key = _toPrimitive(arg, "string"); return _typeof(key) === "symbol" ? key : String(key); }
function _toPrimitive(input, hint) { if (_typeof(input) !== "object" || input === null) return input; var prim = input[Symbol.toPrimitive]; if (prim !== undefined) { var res = prim.call(input, hint || "default"); if (_typeof(res) !== "object") return res; throw new TypeError("@@toPrimitive must return a primitive value."); } return (hint === "string" ? String : Number)(input); }
import EVENTS from '../events';
var MSE_EVENTS = EVENTS.MSE_EVENTS;
var MSE = /*#__PURE__*/function () {
  function MSE(configs, context) {
    _classCallCheck(this, MSE);
    if (context) {
      this._context = context;
      this.emit = context._emitter.emit.bind(context._emitter);
    }
    this.TAG = 'MSE';
    this.configs = Object.assign({}, configs);
    this.container = this.configs.container;
    this.format = this.configs.format; // hls | flv
    this.mediaSource = null;
    this.sourceBuffers = {};
    this.preloadTime = this.configs.preloadTime || 1;
    this.onSourceOpen = this.onSourceOpen.bind(this);
    this.onTimeUpdate = this.onTimeUpdate.bind(this);
    this.onUpdateEnd = this.onUpdateEnd.bind(this);
    this.onWaiting = this.onWaiting.bind(this);
    this.opened = false;
  }
  _createClass(MSE, [{
    key: "init",
    value: function init() {
      // eslint-disable-next-line no-undef
      this.mediaSource = new self.MediaSource();
      this.mediaSource.addEventListener('sourceopen', this.onSourceOpen);
      this._url = null;
      this.container.addEventListener('timeupdate', this.onTimeUpdate);
      this.container.addEventListener('waiting', this.onWaiting);
    }
  }, {
    key: "resetContext",
    value: function resetContext(newCtx, keepBuffer) {
      this._context = newCtx;
      this.emit = newCtx._emitter.emit.bind(newCtx._emitter);
      if (!keepBuffer) {
        for (var i = 0; i < Object.keys(this.sourceBuffers).length; i++) {
          var buffer = this.sourceBuffers[Object.keys(this.sourceBuffers)[i]];
          if (!buffer.updating) {
            MSE.clearBuffer(buffer);
          }
        }
      }
    }
  }, {
    key: "onTimeUpdate",
    value: function onTimeUpdate() {
      this.emit('TIME_UPDATE', this.container);
    }
  }, {
    key: "onWaiting",
    value: function onWaiting() {
      this.emit('WAITING', this.container);
    }
  }, {
    key: "onSourceOpen",
    value: function onSourceOpen() {
      this.opened = true;
      this.addSourceBuffers();
    }
  }, {
    key: "onUpdateEnd",
    value: function onUpdateEnd() {
      this.emit(MSE_EVENTS.SOURCE_UPDATE_END);
      this.doAppend();
    }
  }, {
    key: "addSourceBuffers",
    value: function addSourceBuffers() {
      if (!this.mediaSource || this.mediaSource.readyState !== 'open' || !this.opened) {
        return;
      }
      var sources = this._context.getInstance('PRE_SOURCE_BUFFER');
      var tracks = this._context.getInstance('TRACKS');
      var track;
      if (!sources || !tracks) {
        return;
      }
      sources = sources.sources;
      var add = false;
      for (var i = 0, k = Object.keys(sources).length; i < k; i++) {
        var type = Object.keys(sources)[i];
        add = false;
        if (type === 'audio') {
          track = tracks.audioTrack;
        } else if (type === 'video') {
          track = tracks.videoTrack;
          // return;
        }

        if (track && sources[type].init !== null && sources[type].data.length) {
          add = true;
        }
      }
      if (add) {
        if (Object.keys(this.sourceBuffers).length > 1) {
          return;
        }
        for (var _i = 0, _k = Object.keys(sources).length; _i < _k; _i++) {
          var _type = Object.keys(sources)[_i];
          if (this.sourceBuffers[_type]) {
            continue;
          }
          var source = sources[_type];
          var mime = _type === 'video' ? 'video/mp4;codecs=' + source.mimetype : 'audio/mp4;codecs=' + source.mimetype;
          try {
            // console.log('add sourcebuffer', mime);
            var sourceBuffer = this.mediaSource.addSourceBuffer(mime);
            this.sourceBuffers[_type] = sourceBuffer;
            sourceBuffer.addEventListener('updateend', this.onUpdateEnd);
          } catch (e) {
            if (e.code === 22 && Object.keys(this.sourceBuffers).length > 0) {
              return this.emit(MSE_EVENTS.MSE_WRONG_TRACK_ADD, _type);
            }
            this.emit(MSE_EVENTS.MSE_ERROR, this.TAG, new Error(e.message));
          }
        }
        if (Object.keys(this.sourceBuffers).length === this.sourceBufferLen) {
          this.doAppend();
        }
      }
    }
  }, {
    key: "doAppend",
    value: function doAppend() {
      if (!this.mediaSource || this.mediaSource.readyState === 'closed') return;
      this._doCleanupSourceBuffer();
      var sources = this._context.getInstance('PRE_SOURCE_BUFFER');
      if (!sources) return;
      if (Object.keys(this.sourceBuffers).length < this.sourceBufferLen) {
        return;
      }
      for (var i = 0; i < Object.keys(this.sourceBuffers).length; i++) {
        var type = Object.keys(this.sourceBuffers)[i];
        var sourceBuffer = this.sourceBuffers[type];
        if (sourceBuffer.updating) continue;
        var source = sources.sources[type];
        if (this["no".concat(type)]) {
          source.data = [];
          source.init.buffer = null;
          continue;
        }
        if (source && !source.inited) {
          try {
            // console.log('append init buffer: ', type)
            sourceBuffer.appendBuffer(source.init.buffer.buffer);
            source.inited = true;
          } catch (e) {
            // DO NOTHING
          }
        } else if (source) {
          var data = source.data.shift();
          if (data) {
            try {
              // console.log('append buffer: ', type);
              sourceBuffer.appendBuffer(data.buffer.buffer);
            } catch (e) {
              source.data.unshift(data);
            }
          }
        }
      }
    }
  }, {
    key: "endOfStream",
    value: function endOfStream() {
      try {
        var readyState = this.mediaSource.readyState;
        if (readyState === 'open') {
          this.mediaSource.endOfStream();
        }
      } catch (e) {}
    }
  }, {
    key: "remove",
    value: function remove(end) {
      var start = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
      try {
        for (var i = 0; i < Object.keys(this.sourceBuffers).length; i++) {
          var buffer = this.sourceBuffers[Object.keys(this.sourceBuffers)[i]];
          if (!buffer.updating) {
            if (end > start) {
              buffer.remove(start, end);
            }
          }
        }
      } catch (e) {}
    }
  }, {
    key: "_doCleanupSourceBuffer",
    value: function _doCleanupSourceBuffer() {
      var currentTime = this.container.currentTime;
      var autoCleanupMinBackwardDuration = 60 * 3;
      var _pendingRemoveRanges = {
        video: [],
        audio: []
      };
      for (var i = 0; i < Object.keys(this.sourceBuffers).length; i++) {
        var type = Object.keys(this.sourceBuffers)[i];
        var sourceBuffer = this.sourceBuffers[type];
        var buffered = sourceBuffer.buffered;
        var doRemove = false;
        for (var j = 0; j < buffered.length; j++) {
          var start = buffered.start(j);
          var end = buffered.end(j);
          if (start <= currentTime && currentTime < end + 3) {
            if (currentTime - start >= autoCleanupMinBackwardDuration) {
              doRemove = true;
              var removeEnd = currentTime - autoCleanupMinBackwardDuration;
              _pendingRemoveRanges[type].push({
                start: start,
                end: removeEnd
              });
            }
          } else if (end < currentTime && currentTime - start >= autoCleanupMinBackwardDuration) {
            doRemove = true;
            _pendingRemoveRanges[type].push({
              start: start,
              end: end
            });
          }
        }
        if (doRemove && !sourceBuffer.updating) {
          this._doRemoveRanges(_pendingRemoveRanges);
        }
      }
    }
  }, {
    key: "_doRemoveRanges",
    value: function _doRemoveRanges(_pendingRemoveRanges) {
      for (var type in _pendingRemoveRanges) {
        if (!this.sourceBuffers[type] || this.sourceBuffers[type].updating) {
          continue;
        }
        var sb = this.sourceBuffers[type];
        var ranges = _pendingRemoveRanges[type];
        while (ranges.length && !sb.updating) {
          var range = ranges.shift();
          try {
            if (range && range.end > range.start) {
              sb.remove(range.start, range.end);
            }
          } catch (e) {}
        }
      }
    }
  }, {
    key: "cleanBuffers",
    value: function cleanBuffers() {
      var _this = this;
      var taskList = [];
      var _loop = function _loop(i) {
        var buffer = _this.sourceBuffers[Object.keys(_this.sourceBuffers)[i]];
        var task = void 0;
        if (buffer.updating) {
          task = new Promise(function (resolve) {
            var doCleanBuffer = function doCleanBuffer() {
              var retryTime = 3;
              var clean = function clean() {
                if (!buffer.updating) {
                  MSE.clearBuffer(buffer);
                  buffer.addEventListener('updateend', function () {
                    resolve();
                  });
                } else if (retryTime > 0) {
                  setTimeout(clean, 200);
                  retryTime--;
                } else {
                  resolve();
                }
              };
              setTimeout(clean, 200);
              buffer.removeEventListener('updateend', doCleanBuffer);
            };
            buffer.addEventListener('updateend', doCleanBuffer);
          });
        } else {
          task = new Promise(function (resolve) {
            MSE.clearBuffer(buffer);
            buffer.addEventListener('updateend', function () {
              resolve();
            });
          });

          // task = Promise.resolve()
        }

        taskList.push(task);
      };
      for (var i = 0; i < Object.keys(this.sourceBuffers).length; i++) {
        _loop(i);
      }
      return Promise.all(taskList);
    }
  }, {
    key: "removeBuffers",
    value: function removeBuffers() {
      var _this2 = this;
      var taskList = [];
      var _loop2 = function _loop2(i) {
        var buffer = _this2.sourceBuffers[Object.keys(_this2.sourceBuffers)[i]];
        buffer.removeEventListener('updateend', _this2.onUpdateEnd);
        var task = void 0;
        if (buffer.updating) {
          task = new Promise(function (resolve) {
            var doCleanBuffer = function doCleanBuffer() {
              var retryTime = 3;
              var clean = function clean() {
                if (!buffer.updating) {
                  MSE.clearBuffer(buffer);
                  buffer.addEventListener('updateend', function () {
                    resolve();
                  });
                } else if (retryTime > 0) {
                  setTimeout(clean, 200);
                  retryTime--;
                } else {
                  resolve();
                }
              };
              setTimeout(clean, 200);
              buffer.removeEventListener('updateend', doCleanBuffer);
            };
            buffer.addEventListener('updateend', doCleanBuffer);
          });
        } else {
          task = new Promise(function (resolve) {
            MSE.clearBuffer(buffer);
            buffer.addEventListener('updateend', function () {
              resolve();
            });
          });

          // task = Promise.resolve()
        }

        taskList.push(task);
      };
      for (var i = 0; i < Object.keys(this.sourceBuffers).length; i++) {
        _loop2(i);
      }
      return Promise.all(taskList);
    }
  }, {
    key: "destroy",
    value: function destroy() {
      var _this3 = this;
      if (!this.container) return Promise.resolve();
      this.container.removeEventListener('timeupdate', this.onTimeUpdate);
      this.container.removeEventListener('waiting', this.onWaiting);
      this.mediaSource.removeEventListener('sourceopen', this.onSourceOpen);
      return this.removeBuffers().then(function () {
        var sources = Object.keys(_this3.sourceBuffers);
        for (var i = 0; i < sources.length; i++) {
          var buffer = _this3.sourceBuffers[sources[i]];
          delete _this3.sourceBuffers[sources[i]];
          if (_this3.mediaSource.readyState === 'open') {
            _this3.mediaSource.removeSourceBuffer(buffer);
          }
        }
        _this3.endOfStream();
        try {
          window.URL.revokeObjectURL(_this3.url);
        } catch (e) {}
        _this3.url = null;
        _this3.configs = {};
        _this3.container = null;
        _this3.mediaSource = null;
        _this3.sourceBuffers = {};
        _this3.preloadTime = 1;
        _this3.onSourceOpen = null;
        _this3.onTimeUpdate = null;
        _this3.onUpdateEnd = null;
        _this3.onWaiting = null;
        _this3.noaudio = undefined;
        _this3.novideo = undefined;
      });
    }
  }, {
    key: "sourceBufferLen",
    get: function get() {
      if (!this._context.mediaInfo) {
        if (this.noaudio || this.novideo) return 1;
        return 2;
      }
      return (!!this._context.mediaInfo.hasVideo && !this.novideo) + (!!this._context.mediaInfo.hasAudio && !this.noaudio);
    }
  }, {
    key: "url",
    get: function get() {
      if (!this._url) {
        try {
          this._url = window.URL.createObjectURL(this.mediaSource);
        } catch (e) {}
      }
      return this._url;
    },
    set: function set(val) {
      this._url = val;
    }
  }], [{
    key: "clearBuffer",
    value: function clearBuffer(buffer) {
      try {
        var buffered = buffer.buffered;
        var bEnd = 0.1;
        for (var i = 0, len = buffered.length; i < len; i++) {
          bEnd = buffered.end(i);
        }
        buffer.remove(0, bEnd);
      } catch (e) {
        // DO NOTHING
      }
    }
  }]);
  return MSE;
}();
export default MSE;