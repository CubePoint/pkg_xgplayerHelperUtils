/**
 * @param {number} num
 * @param {number} fixed
 * @return {number}
 */
export default (function (fn, wait) {
  var lastTime = Date.now();
  var timer = null;
  var isFirstTime = true;
  return function () {
    for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }
    var now = Date.now();
    if (isFirstTime) {
      lastTime = Date.now();
      isFirstTime = false;
      fn.apply(void 0, args);
    }
    if (now - lastTime > wait) {
      lastTime = now;
      fn.apply(void 0, args);
    } else {
      if (timer) {
        window.clearTimeout(timer);
      }
      timer = setTimeout(function () {
        fn.apply(void 0, args);
      }, wait);
    }
  };
});