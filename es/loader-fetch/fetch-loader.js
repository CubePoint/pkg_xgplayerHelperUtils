function _typeof(obj) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) { return typeof obj; } : function (obj) { return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }, _typeof(obj); }
function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, _toPropertyKey(descriptor.key), descriptor); } }
function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); Object.defineProperty(Constructor, "prototype", { writable: false }); return Constructor; }
function _toPropertyKey(arg) { var key = _toPrimitive(arg, "string"); return _typeof(key) === "symbol" ? key : String(key); }
function _toPrimitive(input, hint) { if (_typeof(input) !== "object" || input === null) return input; var prim = input[Symbol.toPrimitive]; if (prim !== undefined) { var res = prim.call(input, hint || "default"); if (_typeof(res) !== "object") return res; throw new TypeError("@@toPrimitive must return a primitive value."); } return (hint === "string" ? String : Number)(input); }
import EVENTS from '../events';
import Speed from './speed';
var LOADER_EVENTS = EVENTS.LOADER_EVENTS;
var READ_STREAM = 0;
var READ_TEXT = 1;
var READ_JSON = 2;
var READ_BUFFER = 3;
var FetchLoader = /*#__PURE__*/function () {
  function FetchLoader(configs) {
    _classCallCheck(this, FetchLoader);
    this.configs = Object.assign({}, configs);
    this.url = null;
    this.status = 0;
    this.error = null;
    this._reader = null;
    this._canceled = false;
    this._destroyed = false;
    this.readtype = this.configs.readtype;
    this.buffer = this.configs.buffer || 'LOADER_BUFFER';
    this._loaderTaskNo = 0;
    this._ttfb = 0;
    this._speed = new Speed();
    if (window.AbortController) {
      this.abortControllerEnabled = true;
    }
  }
  _createClass(FetchLoader, [{
    key: "init",
    value: function init() {
      this.on(LOADER_EVENTS.LADER_START, this.load.bind(this));
    }
  }, {
    key: "fetch",
    value: function (_fetch) {
      function fetch(_x, _x2, _x3) {
        return _fetch.apply(this, arguments);
      }
      fetch.toString = function () {
        return _fetch.toString();
      };
      return fetch;
    }(
    /**
     * @param {string}      url
     * @param {RequestInit} params
     * @param {number}      timeout
     * @return {Promise<unknown>}
     */
    function (url, params, timeout) {
      var _this2 = this;
      var timer = null;
      if (this.abortControllerEnabled) {
        this.abortController = new window.AbortController();
      }
      Object.assign(params, {
        signal: this.abortController ? this.abortController.signal : undefined
      });
      var start = new Date().getTime();
      var csFetch = null;
      if (window.overrideXgFetch) csFetch = window.overrideXgFetch;else csFetch = fetch;
      return Promise.race([csFetch(url, params), new Promise(function (resolve, reject) {
        timer = setTimeout(function () {
          /* eslint-disable-next-line */
          reject({
            code: 999,
            message: 'fetch timeout'
          });
          if (_this2.abortController) {
            _this2.abortController.abort();
          }
        }, timeout || 1e4); // 10s
      })]).then(function (response) {
        if (timer) {
          clearTimeout(timer);
          timer = null;
        }
        var end = new Date().getTime();
        _this2.emit(LOADER_EVENTS.LOADER_TTFB, {
          start: start,
          end: end,
          elapsed: end - start
        });
        return response;
      });
    }

    /**
     * @param {string}      url
     * @param {RequestInit} params
     * @param {number}      retryTimes
     * @param {number}      totalRetry
     * @param {number}      delayTime
     * @return {Promise<{ok}>}
     */)
  }, {
    key: "internalLoad",
    value: function internalLoad(url, params, retryTimes, totalRetry) {
      var _this3 = this;
      var delayTime = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : 0;
      var loadTimeout = arguments.length > 5 ? arguments[5] : undefined;
      if (this._destroyed) return;
      this.loading = true;
      return this.fetch(this.url, params, loadTimeout).then(function (response) {
        !_this3._destroyed && _this3.emit(LOADER_EVENTS.LOADER_RESPONSE_HEADERS, _this3.TAG, response.headers);
        if (response.ok) {
          _this3.status = response.status;
          Promise.resolve().then(function () {
            _this3._onFetchResponse(response);
          });
          return Promise.resolve(response);
        }
        if (retryTimes-- > 0) {
          _this3._retryTimer = setTimeout(function () {
            _this3.emit(LOADER_EVENTS.LOADER_RETRY, _this3.TAG, {
              response: response,
              reason: 'response not ok',
              retryTime: totalRetry - retryTimes
            });
            return _this3.internalLoad(url, params, retryTimes, totalRetry, delayTime, loadTimeout);
          }, delayTime);
        } else {
          _this3.loading = false;
          _this3.emit(LOADER_EVENTS.LOADER_ERROR, _this3.TAG, {
            code: response.status || 21,
            message: "".concat(response.status, " (").concat(response.statusText, ")")
          });
        }
      })["catch"](function (error) {
        if (_this3._destroyed) {
          _this3.loading = false;
          return;
        }
        if (retryTimes-- > 0) {
          _this3._retryTimer = setTimeout(function () {
            _this3.emit(LOADER_EVENTS.LOADER_RETRY, _this3.TAG, {
              error: error,
              reason: 'fetch error',
              retryTime: totalRetry - retryTimes
            });
            return _this3.internalLoad(url, params, retryTimes, totalRetry, delayTime, loadTimeout);
          }, delayTime);
        } else {
          _this3.loading = false;
          if (error && error.name === 'AbortError') {
            return;
          }
          _this3.emit(LOADER_EVENTS.LOADER_ERROR, _this3.TAG, Object.assign({
            code: 21
          }, error));
        }
      });
    }

    /**
     * @param {string}      url
     * @param {RequestInit} opts
     * @param {retryCount, retryDelay, loadTimeout}  pluginConfig
     * @return {Promise<{ok}>}
     */
  }, {
    key: "load",
    value: function load(url) {
      var opts = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
      var _ref = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {},
        retryCount = _ref.retryCount,
        retryDelay = _ref.retryDelay,
        loadTimeout = _ref.loadTimeout;
      retryCount = retryCount === undefined ? 3 : retryCount;
      this.url = url;
      this._canceled = false;

      // TODO: Add Ranges
      var params = this.getParams(opts);
      return this.internalLoad(url, params, retryCount, retryCount, retryDelay, loadTimeout);
    }
  }, {
    key: "_onFetchResponse",
    value: function _onFetchResponse(response) {
      var _this4 = this;
      var _this = this;
      var buffer = this._context.getInstance(this.buffer);
      this._loaderTaskNo++;
      var taskno = this._loaderTaskNo;
      if (response.ok === true) {
        switch (this.readtype) {
          case READ_JSON:
            response.json().then(function (data) {
              _this.loading = false;
              if (!_this._canceled && !_this._destroyed) {
                if (buffer) {
                  buffer.push(data);
                  _this.emit(LOADER_EVENTS.LOADER_COMPLETE, buffer);
                } else {
                  _this.emit(LOADER_EVENTS.LOADER_COMPLETE, data);
                }
              }
            });
            break;
          case READ_TEXT:
            response.text().then(function (data) {
              _this.loading = false;
              if (!_this._canceled && !_this._destroyed) {
                if (buffer) {
                  buffer.push(data);
                  _this.emit(LOADER_EVENTS.LOADER_COMPLETE, buffer);
                } else {
                  _this.emit(LOADER_EVENTS.LOADER_COMPLETE, data);
                }
              }
            });
            break;
          case READ_BUFFER:
            response.arrayBuffer().then(function (data) {
              _this.loading = false;
              if (!_this._canceled && !_this._destroyed) {
                if (buffer) {
                  buffer.push(new Uint8Array(data));
                  _this4._speed.addBytes(data.byteLength);
                  _this.emit(LOADER_EVENTS.LOADER_COMPLETE, buffer);
                } else {
                  _this.emit(LOADER_EVENTS.LOADER_COMPLETE, data);
                }
              }
            })["catch"](function () {});
            break;
          case READ_STREAM:
          default:
            return this._onReader(response.body.getReader(), taskno);
        }
      }
    }
  }, {
    key: "_onReader",
    value: function _onReader(reader, taskno) {
      var _this5 = this;
      var buffer = this._context.getInstance(this.buffer);
      if (!buffer && this._reader || this._destroyed) {
        try {
          this._reader.cancel();
        } catch (e) {
          // DO NOTHING
        }
      }
      this._reader = reader;
      if (this.loading === false) {
        return;
      }

      // reader read function returns a Promise. get data when callback and has value.done when disconnected.
      // read方法返回一个Promise. 回调中可以获取到数据。当value.done存在时，说明链接断开。
      this._noDataTimer = setTimeout(function () {
        if (_this5.loading === false) return;
        _this5.emit(LOADER_EVENTS.LOADER_COMPLETE);
      }, 3000);
      this._reader && this._reader.read().then(function (val) {
        clearTimeout(_this5._noDataTimer);
        if (_this5._canceled || _this5._destroyed) {
          if (_this5._reader) {
            try {
              _this5._reader.cancel();
            } catch (e) {
              // DO NOTHING
            }
          }
          return;
        }
        if (val.done) {
          _this5.loading = false;
          _this5.status = 0;
          Promise.resolve().then(function () {
            _this5.emit(LOADER_EVENTS.LOADER_COMPLETE, buffer);
          });
          return;
        }
        buffer.push(val.value);
        _this5._speed.addBytes(val.value.byteLength);
        Promise.resolve().then(function () {
          _this5.emit(LOADER_EVENTS.LOADER_DATALOADED, buffer);
        });
        return _this5._onReader(reader, taskno);
      })["catch"](function (error) {
        clearTimeout(_this5._noDataTimer);
        _this5.loading = false;
        if (error && error.name === 'AbortError') return;
        _this5.emit(LOADER_EVENTS.LOADER_ERROR, _this5.TAG, error);
      });
    }

    /**
     *
     * @param {RequestInit} opts
     * @return {{mode: string, headers: Headers, cache: string, method: string}}
     */
  }, {
    key: "getParams",
    value: function getParams(opts) {
      var options = Object.assign({}, opts);
      var headers = new Headers();
      var params = {
        method: 'GET',
        headers: headers,
        mode: 'cors',
        cache: 'default'
      };

      // add custmor headers
      // 添加自定义头
      if (_typeof(this.configs.headers) === 'object') {
        var configHeaders = this.configs.headers;
        for (var key in configHeaders) {
          if (configHeaders.hasOwnProperty(key)) {
            headers.append(key, configHeaders[key]);
          }
        }
      }
      if (_typeof(options.headers) === 'object') {
        var optHeaders = options.headers;
        for (var _key in optHeaders) {
          if (optHeaders.hasOwnProperty(_key)) {
            headers.append(_key, optHeaders[_key]);
          }
        }
      }
      if (options.cors === false) {
        params.mode = 'same-origin';
      }

      // withCredentials is disabled by default
      // withCredentials 在默认情况下不被使用。
      if (options.withCredentials) {
        params.credentials = 'include';
      }

      // TODO: Add ranges;
      return params;
    }

    // in KB/s
  }, {
    key: "currentSpeed",
    get: function get() {
      return this._speed.lastSamplingKBps;
    }
  }, {
    key: "cancel",
    value: function cancel() {
      if (this._reader) {
        try {
          this._reader.cancel();
        } catch (e) {
          // 防止failed: 200错误被打印到控制台上
        }
        this._reader = null;
        this.loading = false;
      }
      clearTimeout(this._noDataTimer);
      this._canceled = true;
      if (this.abortController) {
        this.abortController.abort();
      }
    }
  }, {
    key: "destroy",
    value: function destroy() {
      this._destroyed = true;
      clearTimeout(this._retryTimer);
      clearTimeout(this._noDataTimer);
      this.cancel();
      this._speed.reset();
    }
  }], [{
    key: "isSupported",
    value: function isSupported() {
      return !!window.fetch;
    }
  }, {
    key: "type",
    get: function get() {
      return 'loader';
    }
  }]);
  return FetchLoader;
}();
export default FetchLoader;