"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var _events = _interopRequireDefault(require("../events"));
var _xgplayerHelperModels = require("xgplayer-helper-models");
var _eventemitter = _interopRequireDefault(require("eventemitter3"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }
function _typeof(obj) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) { return typeof obj; } : function (obj) { return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }, _typeof(obj); }
function _get() { if (typeof Reflect !== "undefined" && Reflect.get) { _get = Reflect.get.bind(); } else { _get = function _get(target, property, receiver) { var base = _superPropBase(target, property); if (!base) return; var desc = Object.getOwnPropertyDescriptor(base, property); if (desc.get) { return desc.get.call(arguments.length < 3 ? target : receiver); } return desc.value; }; } return _get.apply(this, arguments); }
function _superPropBase(object, property) { while (!Object.prototype.hasOwnProperty.call(object, property)) { object = _getPrototypeOf(object); if (object === null) break; } return object; }
function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); Object.defineProperty(subClass, "prototype", { writable: false }); if (superClass) _setPrototypeOf(subClass, superClass); }
function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }
function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = _getPrototypeOf(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = _getPrototypeOf(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return _possibleConstructorReturn(this, result); }; }
function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } else if (call !== void 0) { throw new TypeError("Derived constructors may only return object or undefined"); } return _assertThisInitialized(self); }
function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }
function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); return true; } catch (e) { return false; } }
function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf.bind() : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }
function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, _toPropertyKey(descriptor.key), descriptor); } }
function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); Object.defineProperty(Constructor, "prototype", { writable: false }); return Constructor; }
function _toPropertyKey(arg) { var key = _toPrimitive(arg, "string"); return _typeof(key) === "symbol" ? key : String(key); }
function _toPrimitive(input, hint) { if (_typeof(input) !== "object" || input === null) return input; var prim = input[Symbol.toPrimitive]; if (prim !== undefined) { var res = prim.call(input, hint || "default"); if (_typeof(res) !== "object") return res; throw new TypeError("@@toPrimitive must return a primitive value."); } return (hint === "string" ? String : Number)(input); }
var DIRECT_EMIT_FLAG = '__TO__';
var Context = /*#__PURE__*/function () {
  /**
   *
   * @param {*} player
   * @param {*} configs
   * @param {string[]}allowedEvents
   */
  function Context(player, configs) {
    var allowedEvents = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : [];
    _classCallCheck(this, Context);
    this._emitter = new _eventemitter["default"]();
    if (!this._emitter.off) {
      this._emitter.off = this._emitter.removeListener;
    }
    this.mediaInfo = new _xgplayerHelperModels.MediaInfo();
    this._instanceMap = {}; // 所有的解码流程实例
    this._clsMap = {}; // 构造函数的map
    this._inited = false;
    this.allowedEvents = allowedEvents;
    this._configs = configs;
    this._player = player;
    this._hooks = {}; // 注册在事件前/后的钩子，例如 before('DEMUX_COMPLETE')
  }

  /**
   * 从上下文中获取解码流程实例，如果没有实例，构造一个
   * @param {string} tag
   * @returns {*}
   */
  _createClass(Context, [{
    key: "getInstance",
    value: function getInstance(tag) {
      var instance = this._instanceMap[tag];
      if (instance) {
        return instance;
      } else {
        // throw new Error(`${tag}实例尚未初始化`)
        return null;
      }
    }

    /**
     * 初始化具体实例
     * @param {string} tag
     * @param {any[]}args
     */
  }, {
    key: "initInstance",
    value: function initInstance(tag) {
      for (var _len = arguments.length, args = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
        args[_key - 1] = arguments[_key];
      }
      var a = args[0],
        b = args[1],
        c = args[2],
        d = args[3];
      if (this._clsMap[tag]) {
        var newInstance = new this._clsMap[tag](a, b, c, d);
        this._instanceMap[tag] = newInstance;
        if (newInstance.init) {
          newInstance.init(); // TODO: lifecircle
        }

        return newInstance;
      } else {
        throw new Error("".concat(tag, "\u672A\u5728context\u4E2D\u6CE8\u518C"));
      }
    }

    /**
     * 避免大量的initInstance调用，初始化所有的组件
     * @param {*} config
     */
  }, {
    key: "init",
    value: function init(config) {
      if (this._inited) {
        return;
      }
      for (var tag in this._clsMap) {
        // if not inited, init an instance
        if (this._clsMap.hasOwnProperty(tag) && !this._instanceMap[tag]) {
          this.initInstance(tag, config);
        }
      }
      this._inited = true;
    }

    /**
     * 注册一个上下文流程，提供安全的事件发送机制
     * @param {string} tag
     * @param {*} cls
     */
  }, {
    key: "registry",
    value: function registry(tag, cls) {
      var _this2 = this;
      var emitter = this._emitter;
      var checkMessageName = this._isMessageNameValid.bind(this);
      var self = this;
      var enhanced = /*#__PURE__*/function (_cls) {
        _inherits(enhanced, _cls);
        var _super = _createSuper(enhanced);
        function enhanced(a, b, c) {
          var _this;
          _classCallCheck(this, enhanced);
          _this = _super.call(this, a, b, c);
          _this.listeners = {};
          _this.onceListeners = {};
          _this.TAG = tag;
          _this._context = self;
          return _this;
        }

        /**
         * @param {string} messageName
         * @param {function} callback
         */
        _createClass(enhanced, [{
          key: "on",
          value: function on(messageName, callback) {
            checkMessageName(messageName);
            if (this.listeners[messageName]) {
              this.listeners[messageName].push(callback);
            } else {
              this.listeners[messageName] = [callback];
            }
            emitter.on("".concat(messageName).concat(DIRECT_EMIT_FLAG).concat(tag), callback); // 建立定向通信监听
            return emitter.on(messageName, callback);
          }

          /**
           * @param {string} messageName
           * @param {function} callback
           */
        }, {
          key: "before",
          value: function before(messageName, callback) {
            checkMessageName(messageName);
            if (self._hooks[messageName]) {
              self._hooks[messageName].push(callback);
            } else {
              self._hooks[messageName] = [callback];
            }
          }

          /**
           * @param {string} messageName
           * @param {function} callback
           */
        }, {
          key: "once",
          value: function once(messageName, callback) {
            checkMessageName(messageName);
            if (this.onceListeners[messageName]) {
              this.onceListeners[messageName].push(callback);
            } else {
              this.onceListeners[messageName] = [callback];
            }
            emitter.once("".concat(messageName).concat(DIRECT_EMIT_FLAG).concat(tag), callback);
            return emitter.once(messageName, callback);
          }

          /**
           * @param {string} messageName
           * @param {any[]} args
           */
        }, {
          key: "emit",
          value: function emit(messageName) {
            checkMessageName(messageName);
            // console.log('emit ', messageName);

            var beforeList = self._hooks ? self._hooks[messageName] : null;
            for (var _len2 = arguments.length, args = new Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
              args[_key2 - 1] = arguments[_key2];
            }
            if (beforeList) {
              for (var i = 0, len = beforeList.length; i < len; i++) {
                var callback = beforeList[i];
                // eslint-disable-next-line standard/no-callback-literal
                callback.apply(void 0, args);
              }
            }
            return emitter.emit.apply(emitter, [messageName].concat(args));
          }

          /**
           * 定向发送给某个组件单例的消息
           * @param {string} messageName
           * @param {any[]} args
           */
        }, {
          key: "emitTo",
          value: function emitTo(tag, messageName) {
            checkMessageName(messageName);
            for (var _len3 = arguments.length, args = new Array(_len3 > 2 ? _len3 - 2 : 0), _key3 = 2; _key3 < _len3; _key3++) {
              args[_key3 - 2] = arguments[_key3];
            }
            return emitter.emit.apply(emitter, ["".concat(messageName).concat(DIRECT_EMIT_FLAG).concat(tag)].concat(args));
          }

          /**
           * 定向发送给某个组件单例的消息
           * @param {string} messageName
           * @param {function} callback
           */
        }, {
          key: "off",
          value: function off(messageName, callback) {
            checkMessageName(messageName);
            return emitter.off(messageName, callback);
          }
        }, {
          key: "removeListeners",
          value: function removeListeners() {
            var hasOwn = Object.prototype.hasOwnProperty.bind(this.listeners);
            for (var messageName in this.listeners) {
              if (hasOwn(messageName)) {
                var callbacks = this.listeners[messageName] || [];
                for (var i = 0; i < callbacks.length; i++) {
                  var callback = callbacks[i];
                  emitter.off(messageName, callback);
                  emitter.off("".concat(messageName).concat(DIRECT_EMIT_FLAG).concat(tag), callback);
                }
              }
            }
            for (var _messageName in this.onceListeners) {
              if (hasOwn(_messageName)) {
                var _callbacks = this.onceListeners[_messageName] || [];
                for (var _i = 0; _i < _callbacks.length; _i++) {
                  var _callback = _callbacks[_i];
                  emitter.off(_messageName, _callback);
                  emitter.off("".concat(_messageName).concat(DIRECT_EMIT_FLAG).concat(tag), _callback);
                }
              }
            }
          }

          /**
           * 在组件销毁时，默认将它注册的事件全部卸载，确保不会造成内存泄漏
           */
        }, {
          key: "destroy",
          value: function destroy() {
            // step1 unlisten events
            this.removeListeners();
            this.listeners = {};
            // step2 release from context
            delete self._instanceMap[tag];
            if (_get(_getPrototypeOf(enhanced.prototype), "destroy", this)) {
              return _get(_getPrototypeOf(enhanced.prototype), "destroy", this).call(this);
            }
            this._context = null;
          }
        }, {
          key: "_player",
          get: function get() {
            if (!this._context) {
              return null;
            }
            return this._context._player;
          },
          set: function set(v) {
            if (this._context) {
              this._context._player = v;
            }
          }
        }, {
          key: "_pluginConfig",
          get: function get() {
            if (!this._context) {
              return null;
            }
            return this._context._configs;
          }
        }]);
        return enhanced;
      }(cls);
      this._clsMap[tag] = enhanced;

      /**
       * get instance immediately
       * e.g const instance = context.registry(tag, Cls)(config)
       * */
      return function () {
        for (var _len4 = arguments.length, args = new Array(_len4), _key4 = 0; _key4 < _len4; _key4++) {
          args[_key4] = arguments[_key4];
        }
        return _this2.initInstance.apply(_this2, [tag].concat(args));
      };
    }

    /**
     * 各个模块处理seek
     * @param {number} time
     */
  }, {
    key: "seek",
    value: function seek(time) {
      this._emitter.emit(_events["default"].PLAYER_EVENTS.SEEK, time);
    }

    /**
     * 对存在的实例进行
     */
  }, {
    key: "destroyInstances",
    value: function destroyInstances() {
      var _this3 = this;
      Object.keys(this._instanceMap).forEach(function (tag) {
        if (_this3._instanceMap[tag].destroy) {
          _this3._instanceMap[tag].destroy();
        }
      });
    }

    /**
     * 编解码流程无需关注事件的解绑
     */
  }, {
    key: "destroy",
    value: function destroy() {
      this.destroyInstances();
      if (this._emitter) {
        this._emitter.removeAllListeners();
      }
      this._emitter = null;
      this.allowedEvents = [];
      this._clsMap = null;
      this._hooks = null;
      this._player = null;
      this._configs = null;
    }

    /**
     * 对信道进行收拢
     * @param {string} messageName
     * @private
     */
  }, {
    key: "_isMessageNameValid",
    value: function _isMessageNameValid(messageName) {
      if (!this.allowedEvents.indexOf(messageName) < 0) {
        throw new Error("unregistered message name: ".concat(messageName));
      }
    }
  }]);
  return Context;
}();
var _default = Context;
exports["default"] = _default;