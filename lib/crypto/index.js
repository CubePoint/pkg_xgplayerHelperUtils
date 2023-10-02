"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var _events = _interopRequireDefault(require("../events"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }
function _typeof(obj) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) { return typeof obj; } : function (obj) { return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }, _typeof(obj); }
function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, _toPropertyKey(descriptor.key), descriptor); } }
function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); Object.defineProperty(Constructor, "prototype", { writable: false }); return Constructor; }
function _toPropertyKey(arg) { var key = _toPrimitive(arg, "string"); return _typeof(key) === "symbol" ? key : String(key); }
function _toPrimitive(input, hint) { if (_typeof(input) !== "object" || input === null) return input; var prim = input[Symbol.toPrimitive]; if (prim !== undefined) { var res = prim.call(input, hint || "default"); if (_typeof(res) !== "object") return res; throw new TypeError("@@toPrimitive must return a primitive value."); } return (hint === "string" ? String : Number)(input); }
var CRYPTO_EVENTS = _events["default"].CRYPTO_EVENTS;
var Crypto = /*#__PURE__*/function () {
  function Crypto(config) {
    _classCallCheck(this, Crypto);
    this.inputBuffer = config.inputbuffer;
    this.outputBuffer = config.outputbuffer;
    this.key = config.key;
    this.iv = config.iv;
    this.method = config.method;
    this.crypto = window.crypto || window.msCrypto;
  }
  _createClass(Crypto, [{
    key: "init",
    value: function init() {
      this.on(CRYPTO_EVENTS.START_DECRYPTO, this.decrypto.bind(this));
    }
  }, {
    key: "decrypto",
    value: function decrypto() {
      var _this = this;
      if (!this.aeskey) {
        var sbkey = this.crypto.subtle.importKey('raw', this.key.buffer, {
          name: 'AES-CBC'
        }, false, ['encrypt', 'decrypt']);
        sbkey.then(function (key) {
          _this.aeskey = key;
          _this.decryptoData();
        });
      } else {
        this.decryptoData();
      }
    }
  }, {
    key: "decryptoData",
    value: function decryptoData() {
      var _this2 = this;
      var inputbuffer = this._context.getInstance(this.inputBuffer);
      var outputbuffer = this._context.getInstance(this.outputBuffer);
      var data = inputbuffer.shift();
      if (data) {
        this.crypto.subtle.decrypt({
          name: 'AES-CBC',
          iv: this.iv.buffer
        }, this.aeskey, data).then(function (res) {
          outputbuffer.push(new Uint8Array(res));
          _this2.emit(CRYPTO_EVENTS.DECRYPTED);
          _this2.decryptoData(data);
        });
      }
    }
  }]);
  return Crypto;
}();
var _default = Crypto;
exports["default"] = _default;