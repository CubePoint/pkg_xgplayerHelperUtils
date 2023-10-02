if (typeof window !== 'undefined') {
  window.TimeRanges.prototype.dump = function () {
    var len = this.length;
    var ret = '';
    for (var i = 0; i < len; i++) {
      ret += "".concat(this.start(i), "~").concat(this.end(i), " ");
    }
    ;
    console.log(ret);
  };
}