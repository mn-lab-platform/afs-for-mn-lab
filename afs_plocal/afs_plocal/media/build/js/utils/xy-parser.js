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

/***/ "../arches-for-science/arches_for_science/media/js/utils/xy-parser.js":
/*!****************************************************************************!*\
  !*** ../arches-for-science/arches_for_science/media/js/utils/xy-parser.js ***!
  \****************************************************************************/
/***/ ((module, exports) => {

eval("{var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [], __WEBPACK_AMD_DEFINE_RESULT__ = (function () {\n  var average = function average(yValues) {\n    return yValues.reduce(function (total, num) {\n      return total + num;\n    }, 0) / yValues.length;\n  };\n  var runTransformation = function runTransformation(yValues, transform) {\n    switch (transform) {\n      case 'mean':\n        return average(yValues);\n      default:\n        return yValues[0];\n    }\n  };\n  return {\n    transformations: function transformations() {\n      return [\"mean\"];\n    },\n    parse: function parse(text, config) {\n      var _config$delimiterChar;\n      var values;\n      var workingText = text;\n      var parsedData = {\n        x: [],\n        y: []\n      };\n      try {\n        if (config !== null && config !== void 0 && config.footerDelimiter) {\n          workingText = workingText.split(config === null || config === void 0 ? void 0 : config.footerDelimiter)[0].trim();\n        }\n        if (config !== null && config !== void 0 && config.headerDelimiter) {\n          values = workingText.split(config === null || config === void 0 ? void 0 : config.headerDelimiter)[1].trim().split('\\n');\n        } else if (config !== null && config !== void 0 && config.headerFixedLines) {\n          var lines = workingText.split('\\n');\n          values = lines.slice(config === null || config === void 0 ? void 0 : config.headerFixedLines);\n        } else {\n          values = workingText.trim().split('\\n');\n        }\n      } catch (e) {\n        values = workingText.trim().split('\\n');\n      }\n      var delimiterCharacter = (_config$delimiterChar = config === null || config === void 0 ? void 0 : config.delimiterCharacter) !== null && _config$delimiterChar !== void 0 ? _config$delimiterChar : ',';\n      try {\n        var valueRegex = delimiterCharacter.length < 2 ? new RegExp(\"[\".concat(delimiterCharacter, \"\\\\s]+\")) : new RegExp(\"\".concat(delimiterCharacter));\n        var transform = config !== null && config !== void 0 && config.transformation ? config.transformation : 'basic';\n        values.forEach(function (val) {\n          var rec = val.trim().split(valueRegex).filter(function (element) {\n            return element !== \"\";\n          });\n          parsedData.x.push(parseFloat(rec[0]));\n          var yValues = rec.slice(1).map(function (val) {\n            return parseFloat(val);\n          });\n          parsedData.y.push(runTransformation(yValues, transform));\n        });\n        return parsedData;\n      } catch (e) {\n        if (e instanceof SyntaxError) {\n          throw new Error(\"Invalid regular expression.  Delimiter Character in config must be a valid regular expression.\");\n        }\n      }\n    }\n  };\n}).apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__),\n\t\t__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));\n\n//# sourceURL=webpack://afs_plocal/../arches-for-science/arches_for_science/media/js/utils/xy-parser.js?\n}");

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
/******/ 	var __webpack_exports__ = __webpack_require__("../arches-for-science/arches_for_science/media/js/utils/xy-parser.js");
/******/ 	
/******/ 	return __webpack_exports__;
/******/ })()
;
});;