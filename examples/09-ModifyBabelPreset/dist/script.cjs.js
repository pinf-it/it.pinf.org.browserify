((function (_require, _exports, _module) {
var bundle = { require: _require, exports: _exports, module: _module };
if (typeof bundle.exports !== "object") throw new Error("The 'exports' variable must be set!");
var exports = undefined;
var module = undefined;
var define = function (deps, init) {
var exports = init();
[["foo","foo"]].forEach(function (expose) {
bundle.exports[expose[0]] = exports[expose[1]];
});
}; define.amd = true;

(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.mainModule = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
"use strict";

exports.foo = async function () {
  return new Promise(function (resolve) {
    resolve("bar");
  });
};
},{}]},{},[1])(1)
});

})((typeof require !== "undefined" && require) || undefined, (typeof exports !== "undefined" && exports) || undefined, (typeof module !== "undefined" && module) || undefined))