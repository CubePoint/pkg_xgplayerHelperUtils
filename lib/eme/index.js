"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
function _typeof(obj) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) { return typeof obj; } : function (obj) { return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }, _typeof(obj); }
function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, _toPropertyKey(descriptor.key), descriptor); } }
function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); Object.defineProperty(Constructor, "prototype", { writable: false }); return Constructor; }
function _toPropertyKey(arg) { var key = _toPrimitive(arg, "string"); return _typeof(key) === "symbol" ? key : String(key); }
function _toPrimitive(input, hint) { if (_typeof(input) !== "object" || input === null) return input; var prim = input[Symbol.toPrimitive]; if (prim !== undefined) { var res = prim.call(input, hint || "default"); if (_typeof(res) !== "object") return res; throw new TypeError("@@toPrimitive must return a primitive value."); } return (hint === "string" ? String : Number)(input); }
var KeySystems = {
  WIDEVINE: 'com.widevine.alpha',
  PLAYREADY: 'com.microsoft.playready'
};
var MAX_LICENSE_REQUEST_FAILURES = 3;
var EME = /*#__PURE__*/function () {
  function EME(_ref) {
    var config = _ref.config,
      player = _ref.player;
    _classCallCheck(this, EME);
    this.licenseUrl = config.licenseUrl;
    this.mediaKeySystemConfigs = config.mediaKeySystemConfigs;
    this.keySystem = config.keySystem || KeySystems.WIDEVINE;
    this.video = player.video;
    this.mediaKeysList = [];
    this.requestLicenseFailureCount = 0;
  }
  _createClass(EME, [{
    key: "init",
    value: function init() {
      this.on('ManifestParsed', this.onManifestParsed.bind(this));
    }
  }, {
    key: "onManifestParsed",
    value: function onManifestParsed(data) {
      var _this = this;
      var mediaKeySystemConfigs = this.mediaKeySystemConfigs || this.createWidevineMediaKeySystemConfigurations(data.audioCodecs, data.videoCodecs);
      navigator.requestMediaKeySystemAccess(this.keySystem, mediaKeySystemConfigs).then(function (keySystemAccess) {
        return keySystemAccess.createMediaKeys();
      }).then(function (mediaKeys) {
        _this.video.setMediaKeys(mediaKeys);
      });
      this.video.addEventListener('encrypted', this.onMediaEncrypted.bind(this));
    }
  }, {
    key: "onKeySessionMessage",
    value: function onKeySessionMessage(keySession, message) {
      this.requestLicense(message, function (data) {
        keySession.update(data);
      });
    }
  }, {
    key: "requestLicense",
    value: function requestLicense(keyMessage, callback) {
      try {
        var url = this.licenseUrl;
        var xhr = this.createLicenseXhr(url, keyMessage, callback);
        xhr.send(keyMessage);
      } catch (e) {}
    }
  }, {
    key: "createLicenseXhr",
    value: function createLicenseXhr(url, keyMessage, callback) {
      var xhr = new window.XMLHttpRequest();
      xhr.open('POST', url, true);
      xhr.responseType = 'arraybuffer';
      xhr.onreadystatechange = this.onLicenseRequestReadyStageChange.bind(this, xhr, url, keyMessage, callback);
      return xhr;
    }
  }, {
    key: "onLicenseRequestReadyStageChange",
    value: function onLicenseRequestReadyStageChange(xhr, url, keyMessage, callback) {
      switch (xhr.readyState) {
        case 4:
          if (xhr.status === 200) {
            this.requestLicenseFailureCount = 0;
            callback(xhr.response);
          } else {
            this.requestLicenseFailureCount++;
            if (this.requestLicenseFailureCount > MAX_LICENSE_REQUEST_FAILURES) {
              return;
            }
            this.requestLicense(keyMessage, callback);
          }
          break;
      }
    }
  }, {
    key: "onMediaEncrypted",
    value: function onMediaEncrypted(e) {
      var _this2 = this;
      var keySession = this.video.mediaKeys.createSession();
      keySession.addEventListener('message', function (event) {
        _this2.onKeySessionMessage(keySession, event.message);
      }, false);
      keySession.generateRequest(e.initDataType, e.initData);
    }
  }, {
    key: "createWidevineMediaKeySystemConfigurations",
    value: function createWidevineMediaKeySystemConfigurations(audioCodecs, videoCodecs) {
      return [{
        videoCapabilities: videoCodecs.map(function (codec) {
          return {
            contentType: "video/mp4; codecs=\"".concat(codec, "\"")
          };
        })
      }];
    }
  }], [{
    key: "isSupported",
    value: function isSupported() {
      var checkIsIncompatibleBrowser = function checkIsIncompatibleBrowser() {
        var ua = navigator.userAgent;
        var isSafari = /^((?!chrome|android).)*safari/i.test(ua);
        var isMSBrowser = ua.indexOf('MSIE ') > 0 || ua.indexOf('Trident/') > 0;
        var isFirefox = ua.indexOf('Firefox') > 0;
        var isEdge = ua.indexOf('Edge') > 0;
        return isSafari || isMSBrowser || isFirefox || isEdge;
      };
      return !!navigator.requestMediaKeySystemAccess && !checkIsIncompatibleBrowser();
    }
  }]);
  return EME;
}();
exports["default"] = EME;