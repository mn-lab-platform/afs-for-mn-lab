/*
 * ATTENTION: The "eval" devtool has been used (maybe by default in mode: "development").
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
require([], () => { return /******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ "../arches-for-science/arches_for_science/media/js/utils/label-based-graph-utils.js":
/*!******************************************************************************************!*\
  !*** ../arches-for-science/arches_for_science/media/js/utils/label-based-graph-utils.js ***!
  \******************************************************************************************/
/***/ ((module, exports) => {

eval("{var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;function _createForOfIteratorHelper(r, e) { var t = \"undefined\" != typeof Symbol && r[Symbol.iterator] || r[\"@@iterator\"]; if (!t) { if (Array.isArray(r) || (t = _unsupportedIterableToArray(r)) || e && r && \"number\" == typeof r.length) { t && (r = t); var _n = 0, F = function F() {}; return { s: F, n: function n() { return _n >= r.length ? { done: !0 } : { done: !1, value: r[_n++] }; }, e: function e(r) { throw r; }, f: F }; } throw new TypeError(\"Invalid attempt to iterate non-iterable instance.\\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.\"); } var o, a = !0, u = !1; return { s: function s() { t = t.call(r); }, n: function n() { var r = t.next(); return a = r.done, r; }, e: function e(r) { u = !0, o = r; }, f: function f() { try { a || null == t.return || t.return(); } finally { if (u) throw o; } } }; }\nfunction _unsupportedIterableToArray(r, a) { if (r) { if (\"string\" == typeof r) return _arrayLikeToArray(r, a); var t = {}.toString.call(r).slice(8, -1); return \"Object\" === t && r.constructor && (t = r.constructor.name), \"Map\" === t || \"Set\" === t ? Array.from(r) : \"Arguments\" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0; } }\nfunction _arrayLikeToArray(r, a) { (null == a || a > r.length) && (a = r.length); for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e]; return n; }\nfunction _typeof(o) { \"@babel/helpers - typeof\"; return _typeof = \"function\" == typeof Symbol && \"symbol\" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && \"function\" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? \"symbol\" : typeof o; }, _typeof(o); }\n!(__WEBPACK_AMD_DEFINE_ARRAY__ = [], __WEBPACK_AMD_DEFINE_RESULT__ = (function () {\n  var processRawNodeValue = function processRawNodeValue(rawValue) {\n    if (typeof rawValue === 'string') {\n      return rawValue;\n    } else if (!rawValue) {\n      return '--';\n    }\n    var nodeValue = (rawValue === null || rawValue === void 0 ? void 0 : rawValue['@display_value']) || (rawValue === null || rawValue === void 0 ? void 0 : rawValue['display_value']);\n    var geojson = rawValue === null || rawValue === void 0 ? void 0 : rawValue.geojson;\n    if (geojson) {\n      return geojson;\n    }\n\n    //strict checks here because some nodeValues (0, false, etc.) should be rendered differently.\n    if (nodeValue !== undefined && nodeValue !== null && nodeValue !== '') {\n      var regex = /<[^>]*>/g;\n      return nodeValue.replace(regex, \"\"); // strip out HTML\n    } else {\n      return '--';\n    }\n  };\n  var standardizeNode = function standardizeNode(obj) {\n    if (obj) {\n      var keys = Object.keys(obj);\n      keys.forEach(function (x) {\n        obj[x.toLowerCase().trim()] = obj[x];\n      });\n    }\n  };\n  var getRawNodeValue = function getRawNodeValue(resource) {\n    var rootNode = resource;\n    var testPaths = undefined;\n    for (var _len = arguments.length, args = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {\n      args[_key - 1] = arguments[_key];\n    }\n    if (_typeof(args === null || args === void 0 ? void 0 : args[0]) == 'object') {\n      var _args$;\n      testPaths = (_args$ = args[0]) === null || _args$ === void 0 ? void 0 : _args$.testPaths;\n    } else {\n      testPaths = [args];\n    }\n    var _iterator = _createForOfIteratorHelper(testPaths),\n      _step;\n    try {\n      for (_iterator.s(); !(_step = _iterator.n()).done;) {\n        var path = _step.value;\n        var node = rootNode;\n        for (var i = 0; i < path.length; ++i) {\n          var _node;\n          standardizeNode(node);\n          var pathComponent = path[i];\n          node = (_node = node) === null || _node === void 0 ? void 0 : _node[pathComponent];\n        }\n        if (node) {\n          return node;\n        }\n      }\n    } catch (err) {\n      _iterator.e(err);\n    } finally {\n      _iterator.f();\n    }\n  };\n  var getNodeValue = function getNodeValue(resource) {\n    for (var _len2 = arguments.length, args = new Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {\n      args[_key2 - 1] = arguments[_key2];\n    }\n    var rawValue = getRawNodeValue.apply(void 0, [resource].concat(args));\n    return processRawNodeValue(rawValue);\n  };\n  var getPropByNodeId = function getPropByNodeId(resource, nodeId, prop) {\n    return Object.values(resource).find(function (val) {\n      return val['@node_id'] == nodeId;\n    })[prop];\n  };\n  return {\n    getNodeValue: getNodeValue,\n    // use this to get the \"friendly\" value of a node.  It uses both getRawNodeValue and processRawNodeValue\n    getRawNodeValue: getRawNodeValue,\n    processRawNodeValue: processRawNodeValue,\n    standardizeNode: standardizeNode,\n    getPropByNodeId: getPropByNodeId\n  };\n}).apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__),\n\t\t__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));\n\n//# sourceURL=webpack://afs_plocal/../arches-for-science/arches_for_science/media/js/utils/label-based-graph-utils.js?\n}");

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module can't be inlined because the eval devtool is used.
/******/ 	var __webpack_exports__ = __webpack_require__("../arches-for-science/arches_for_science/media/js/utils/label-based-graph-utils.js");
/******/ 	
/******/ 	return __webpack_exports__;
/******/ })()
;
});;