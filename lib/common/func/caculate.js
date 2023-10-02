"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
/**
 *
 * @param {number} num
 * @param {number} fixed
 * @return {number}
 */
var fixedFloat = function fixedFloat(num, fixed) {
  return parseFloat(Number(num).toFixed(fixed));
};
var _default = {
  fixedFloat: fixedFloat
};
exports["default"] = _default;