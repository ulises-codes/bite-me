(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define([], factory);
	else if(typeof exports === 'object')
		exports["BiteMe"] = factory();
	else
		root["BiteMe"] = factory();
})(self, function() {
return /******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./node_modules/comlink/dist/esm/comlink.mjs":
/*!***************************************************!*\
  !*** ./node_modules/comlink/dist/esm/comlink.mjs ***!
  \***************************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "createEndpoint": () => (/* binding */ createEndpoint),
/* harmony export */   "expose": () => (/* binding */ expose),
/* harmony export */   "proxy": () => (/* binding */ proxy),
/* harmony export */   "proxyMarker": () => (/* binding */ proxyMarker),
/* harmony export */   "releaseProxy": () => (/* binding */ releaseProxy),
/* harmony export */   "transfer": () => (/* binding */ transfer),
/* harmony export */   "transferHandlers": () => (/* binding */ transferHandlers),
/* harmony export */   "windowEndpoint": () => (/* binding */ windowEndpoint),
/* harmony export */   "wrap": () => (/* binding */ wrap)
/* harmony export */ });
/**
 * Copyright 2019 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *     http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
const proxyMarker = Symbol("Comlink.proxy");
const createEndpoint = Symbol("Comlink.endpoint");
const releaseProxy = Symbol("Comlink.releaseProxy");
const throwMarker = Symbol("Comlink.thrown");
const isObject = (val) => (typeof val === "object" && val !== null) || typeof val === "function";
/**
 * Internal transfer handle to handle objects marked to proxy.
 */
const proxyTransferHandler = {
    canHandle: (val) => isObject(val) && val[proxyMarker],
    serialize(obj) {
        const { port1, port2 } = new MessageChannel();
        expose(obj, port1);
        return [port2, [port2]];
    },
    deserialize(port) {
        port.start();
        return wrap(port);
    },
};
/**
 * Internal transfer handler to handle thrown exceptions.
 */
const throwTransferHandler = {
    canHandle: (value) => isObject(value) && throwMarker in value,
    serialize({ value }) {
        let serialized;
        if (value instanceof Error) {
            serialized = {
                isError: true,
                value: {
                    message: value.message,
                    name: value.name,
                    stack: value.stack,
                },
            };
        }
        else {
            serialized = { isError: false, value };
        }
        return [serialized, []];
    },
    deserialize(serialized) {
        if (serialized.isError) {
            throw Object.assign(new Error(serialized.value.message), serialized.value);
        }
        throw serialized.value;
    },
};
/**
 * Allows customizing the serialization of certain values.
 */
const transferHandlers = new Map([
    ["proxy", proxyTransferHandler],
    ["throw", throwTransferHandler],
]);
function expose(obj, ep = self) {
    ep.addEventListener("message", function callback(ev) {
        if (!ev || !ev.data) {
            return;
        }
        const { id, type, path } = Object.assign({ path: [] }, ev.data);
        const argumentList = (ev.data.argumentList || []).map(fromWireValue);
        let returnValue;
        try {
            const parent = path.slice(0, -1).reduce((obj, prop) => obj[prop], obj);
            const rawValue = path.reduce((obj, prop) => obj[prop], obj);
            switch (type) {
                case 0 /* GET */:
                    {
                        returnValue = rawValue;
                    }
                    break;
                case 1 /* SET */:
                    {
                        parent[path.slice(-1)[0]] = fromWireValue(ev.data.value);
                        returnValue = true;
                    }
                    break;
                case 2 /* APPLY */:
                    {
                        returnValue = rawValue.apply(parent, argumentList);
                    }
                    break;
                case 3 /* CONSTRUCT */:
                    {
                        const value = new rawValue(...argumentList);
                        returnValue = proxy(value);
                    }
                    break;
                case 4 /* ENDPOINT */:
                    {
                        const { port1, port2 } = new MessageChannel();
                        expose(obj, port2);
                        returnValue = transfer(port1, [port1]);
                    }
                    break;
                case 5 /* RELEASE */:
                    {
                        returnValue = undefined;
                    }
                    break;
            }
        }
        catch (value) {
            returnValue = { value, [throwMarker]: 0 };
        }
        Promise.resolve(returnValue)
            .catch((value) => {
            return { value, [throwMarker]: 0 };
        })
            .then((returnValue) => {
            const [wireValue, transferables] = toWireValue(returnValue);
            ep.postMessage(Object.assign(Object.assign({}, wireValue), { id }), transferables);
            if (type === 5 /* RELEASE */) {
                // detach and deactive after sending release response above.
                ep.removeEventListener("message", callback);
                closeEndPoint(ep);
            }
        });
    });
    if (ep.start) {
        ep.start();
    }
}
function isMessagePort(endpoint) {
    return endpoint.constructor.name === "MessagePort";
}
function closeEndPoint(endpoint) {
    if (isMessagePort(endpoint))
        endpoint.close();
}
function wrap(ep, target) {
    return createProxy(ep, [], target);
}
function throwIfProxyReleased(isReleased) {
    if (isReleased) {
        throw new Error("Proxy has been released and is not useable");
    }
}
function createProxy(ep, path = [], target = function () { }) {
    let isProxyReleased = false;
    const proxy = new Proxy(target, {
        get(_target, prop) {
            throwIfProxyReleased(isProxyReleased);
            if (prop === releaseProxy) {
                return () => {
                    return requestResponseMessage(ep, {
                        type: 5 /* RELEASE */,
                        path: path.map((p) => p.toString()),
                    }).then(() => {
                        closeEndPoint(ep);
                        isProxyReleased = true;
                    });
                };
            }
            if (prop === "then") {
                if (path.length === 0) {
                    return { then: () => proxy };
                }
                const r = requestResponseMessage(ep, {
                    type: 0 /* GET */,
                    path: path.map((p) => p.toString()),
                }).then(fromWireValue);
                return r.then.bind(r);
            }
            return createProxy(ep, [...path, prop]);
        },
        set(_target, prop, rawValue) {
            throwIfProxyReleased(isProxyReleased);
            // FIXME: ES6 Proxy Handler `set` methods are supposed to return a
            // boolean. To show good will, we return true asynchronously ¯\_(ツ)_/¯
            const [value, transferables] = toWireValue(rawValue);
            return requestResponseMessage(ep, {
                type: 1 /* SET */,
                path: [...path, prop].map((p) => p.toString()),
                value,
            }, transferables).then(fromWireValue);
        },
        apply(_target, _thisArg, rawArgumentList) {
            throwIfProxyReleased(isProxyReleased);
            const last = path[path.length - 1];
            if (last === createEndpoint) {
                return requestResponseMessage(ep, {
                    type: 4 /* ENDPOINT */,
                }).then(fromWireValue);
            }
            // We just pretend that `bind()` didn’t happen.
            if (last === "bind") {
                return createProxy(ep, path.slice(0, -1));
            }
            const [argumentList, transferables] = processArguments(rawArgumentList);
            return requestResponseMessage(ep, {
                type: 2 /* APPLY */,
                path: path.map((p) => p.toString()),
                argumentList,
            }, transferables).then(fromWireValue);
        },
        construct(_target, rawArgumentList) {
            throwIfProxyReleased(isProxyReleased);
            const [argumentList, transferables] = processArguments(rawArgumentList);
            return requestResponseMessage(ep, {
                type: 3 /* CONSTRUCT */,
                path: path.map((p) => p.toString()),
                argumentList,
            }, transferables).then(fromWireValue);
        },
    });
    return proxy;
}
function myFlat(arr) {
    return Array.prototype.concat.apply([], arr);
}
function processArguments(argumentList) {
    const processed = argumentList.map(toWireValue);
    return [processed.map((v) => v[0]), myFlat(processed.map((v) => v[1]))];
}
const transferCache = new WeakMap();
function transfer(obj, transfers) {
    transferCache.set(obj, transfers);
    return obj;
}
function proxy(obj) {
    return Object.assign(obj, { [proxyMarker]: true });
}
function windowEndpoint(w, context = self, targetOrigin = "*") {
    return {
        postMessage: (msg, transferables) => w.postMessage(msg, targetOrigin, transferables),
        addEventListener: context.addEventListener.bind(context),
        removeEventListener: context.removeEventListener.bind(context),
    };
}
function toWireValue(value) {
    for (const [name, handler] of transferHandlers) {
        if (handler.canHandle(value)) {
            const [serializedValue, transferables] = handler.serialize(value);
            return [
                {
                    type: 3 /* HANDLER */,
                    name,
                    value: serializedValue,
                },
                transferables,
            ];
        }
    }
    return [
        {
            type: 0 /* RAW */,
            value,
        },
        transferCache.get(value) || [],
    ];
}
function fromWireValue(value) {
    switch (value.type) {
        case 3 /* HANDLER */:
            return transferHandlers.get(value.name).deserialize(value.value);
        case 0 /* RAW */:
            return value.value;
    }
}
function requestResponseMessage(ep, msg, transfers) {
    return new Promise((resolve) => {
        const id = generateUUID();
        ep.addEventListener("message", function l(ev) {
            if (!ev.data || !ev.data.id || ev.data.id !== id) {
                return;
            }
            ep.removeEventListener("message", l);
            resolve(ev.data);
        });
        if (ep.start) {
            ep.start();
        }
        ep.postMessage(Object.assign({ id }, msg), transfers);
    });
}
function generateUUID() {
    return new Array(4)
        .fill(0)
        .map(() => Math.floor(Math.random() * Number.MAX_SAFE_INTEGER).toString(16))
        .join("-");
}


//# sourceMappingURL=comlink.mjs.map


/***/ }),

/***/ "./src/helper/index.ts":
/*!*****************************!*\
  !*** ./src/helper/index.ts ***!
  \*****************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "initFoodPosition": () => (/* reexport safe */ _initFoodPosition__WEBPACK_IMPORTED_MODULE_0__.default)
/* harmony export */ });
/* harmony import */ var _initFoodPosition__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./initFoodPosition */ "./src/helper/initFoodPosition.ts");



/***/ }),

/***/ "./src/helper/initFoodPosition.ts":
/*!****************************************!*\
  !*** ./src/helper/initFoodPosition.ts ***!
  \****************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ initFoodPosition)
/* harmony export */ });
function initFoodPosition({ snakeSize, canvasHeight, canvasWidth, foodSize, }) {
    const size = snakeSize;
    const startX = Math.floor(Math.random() * (canvasWidth / size - foodSize / (foodSize - size))) * size;
    const startY = Math.floor(Math.random() * (canvasHeight / size - foodSize / (foodSize - size))) * size;
    return [startX, startY];
}


/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		if(__webpack_module_cache__[moduleId]) {
/******/ 			return __webpack_module_cache__[moduleId].exports;
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
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry need to be wrapped in an IIFE because it need to be isolated against other modules in the chunk.
(() => {
/*!***********************!*\
  !*** ./src/worker.ts ***!
  \***********************/
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "SnakeWorker": () => (/* binding */ SnakeWorker)
/* harmony export */ });
/* harmony import */ var _helper__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./helper */ "./src/helper/index.ts");
/* harmony import */ var comlink__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! comlink */ "./node_modules/comlink/dist/esm/comlink.mjs");


const SnakeWorker = class SnakeWorker {
    constructor(canvas, advanceSnake, props) {
        var _a, _b, _c, _d, _e, _f;
        this.advanceSnake = advanceSnake;
        this.backgroundColor = props.canvas.backgroundColor;
        this.canvasHeight = props.canvas.height;
        this.canvasWidth = props.canvas.width;
        this.ctx = canvas.getContext('2d');
        this.gameOverColor = (_a = props.text.gameOverColor) !== null && _a !== void 0 ? _a : '#F26463';
        this.foodColor = (_b = props.food.color) !== null && _b !== void 0 ? _b : '#2a2a2a';
        this.foodImgSrc = props.food.imgSrc;
        this.foodPadding = 4;
        this.foodSize = props.food.size;
        this.keyPressed = [];
        this.snakeColor = (_c = props.snake.color) !== null && _c !== void 0 ? _c : '#2a2a2a';
        this.snakeSize = props.snake.snakeSize;
        this.textColor = (_d = props.text.color) !== null && _d !== void 0 ? _d : '#2a2a2a';
        this.titleColor = (_e = props.text.titleColor) !== null && _e !== void 0 ? _e : '#2a2a2a';
        this.subtitleColor = (_f = props.text.subtitleColor) !== null && _f !== void 0 ? _f : '#2a2a2a';
    }
    clearCanvas() {
        var _a;
        (_a = this.ctx) === null || _a === void 0 ? void 0 : _a.clearRect(0, 0, this.canvasHeight, this.canvasWidth);
    }
    drawText(text, y, color = this.textColor, font = '12px courier') {
        const context = this.ctx;
        if (!context)
            return;
        context.beginPath();
        context.fillStyle = color;
        context.font = font;
        const textSize = context.measureText(text).width;
        context.fillText(text, this.canvasWidth / 2 - Math.round(textSize / 2), y);
    }
    drawTitlePage(coordinates) {
        const context = this.ctx;
        if (!context)
            return;
        this.clearCanvas();
        const verticalCenter = this.canvasHeight / 2;
        this.initFood([10, 20]);
        this.initFood([this.canvasWidth - this.foodSize - 10, 20]);
        this.drawSnake({ currentCoordinates: coordinates });
        // Draw title
        this.drawText('BITE ME', 55, this.titleColor, '40px courier');
        // Draw subtitle
        this.drawText('A snake game', 95, this.subtitleColor, '16px courier');
        this.drawText('Press SPACE or Tap to Begin', verticalCenter, this.titleColor, '14px courier');
        this.drawText('Press h or tap with two', verticalCenter + 30, this.subtitleColor, '12px courier');
        this.drawText('fingers for help', verticalCenter + 45, this.subtitleColor, '12px courier');
    }
    drawInstructionsPage() {
        this.clearCanvas();
        const context = this.ctx;
        if (!context)
            return;
        this.drawText('HOW TO PLAY', 45, undefined, '40px courier');
        this.drawText('Use the arrows on your', 75);
        this.drawText('keypad or swipe to move', 90);
        this.drawText('the snake along.', 105);
        this.drawText('Eat the food—a picture of my', 130);
        this.drawText('head that my wife hates–', 145);
        this.drawText('without crashing into the', 160);
        this.drawText('walls or yourself!', 175);
        this.drawText('Key Combinations: ', 225, this.subtitleColor, '14px courier');
        this.drawText('start: SPACE', 240);
        this.drawText('quit: q', 255);
        this.drawText('mute: m', 270);
        this.drawText('Volume Down, Up: 2, 1', 285);
    }
    drawSnake({ currentCoordinates, newCoordinates }) {
        const context = this.ctx;
        let coordinates;
        if (newCoordinates) {
            coordinates = newCoordinates;
        }
        else {
            coordinates = currentCoordinates;
        }
        if (!context)
            return;
        const size = this.snakeSize;
        context.strokeStyle = this.backgroundColor;
        context.lineWidth = 2;
        const color = this.snakeColor;
        coordinates.forEach(([x, y], i) => {
            if (typeof color === 'string') {
                context.fillStyle = this.snakeColor;
            }
            else {
                context.fillStyle = color[i % color.length];
            }
            context.fillRect(x, y, size, size);
            context.strokeRect(x, y, size, size);
        });
    }
    drawFood([x, y]) {
        const padding = this.foodPadding;
        const context = this.ctx;
        if (!context)
            return;
        if (!this.foodImg) {
            const radius = this.foodSize / 2;
            context.beginPath();
            context.ellipse(x + radius, y + radius, radius - padding * 2, radius - padding * 2, 0, 0, 2 * Math.PI);
            context.fill();
        }
        else {
            const foodSize = this.foodSize - padding;
            context.imageSmoothingEnabled = true;
            context.imageSmoothingQuality = 'high';
            context.drawImage(this.foodImg, x + padding / 2, y + padding / 2, foodSize, foodSize);
        }
    }
    drawGameOver(score, cb) {
        const context = this.ctx;
        if (!context)
            return;
        this.clearCanvas();
        const verticalCenter = this.canvasHeight / 2;
        context.fillStyle = this.gameOverColor;
        this.drawText('GAME OVER', verticalCenter - 10, this.gameOverColor, '40px courier');
        this.drawText(`Score: ${score}`, verticalCenter + 20, this.subtitleColor, '14px courier');
        this.drawText('Press SPACE or Tap to Begin', verticalCenter + 60, this.titleColor, '14px courier');
        cb();
        this.stopTimer();
    }
    clearPrevPosition(x, y) {
        if (!this.ctx)
            return;
        this.ctx.clearRect(x, y, this.snakeSize, this.snakeSize);
    }
    clearFood(coordinates) {
        const context = this.ctx;
        if (!context)
            return;
        const size = this.snakeSize;
        for (let i = 0; i < this.canvasWidth; i += size) {
            for (let j = 0; j < this.canvasHeight; j += size) {
                if (coordinates.some(([x, y]) => x === i && y === j)) {
                    continue;
                }
                context.clearRect(i, j, size, size);
            }
        }
    }
    eatFood(coordinates) {
        this.clearFood(coordinates);
        const getNewFoodPosition = () => {
            return (0,_helper__WEBPACK_IMPORTED_MODULE_0__.initFoodPosition)({
                foodSize: this.foodSize,
                snakeSize: this.snakeSize,
                canvasWidth: this.canvasHeight,
                canvasHeight: this.canvasHeight,
            });
        };
        let [newX, newY] = getNewFoodPosition();
        const checkPosition = () => {
            const columns = Math.floor(this.foodSize / this.snakeSize);
            const newCoordinates = [];
            for (let x = 0; x < columns; x++) {
                for (let y = 0; y < columns; y++) {
                    if (x === 0 && y === 0) {
                        newCoordinates.push([newX, newY]);
                        continue;
                    }
                    newCoordinates.push([
                        newX + x * (this.foodSize / columns),
                        newY + y * (this.foodSize / columns),
                    ]);
                }
            }
            if (!newCoordinates.every(([x, y]) => !coordinates.some(([a, b]) => x === a && y === b))) {
                return true;
            }
            return false;
        };
        while (checkPosition()) {
            [newX, newY] = getNewFoodPosition();
        }
        this.drawFood([newX, newY]);
        return [newX, newY];
    }
    async initGame(snakeCoordinates) {
        if (this.foodImgSrc) {
            const blob = await fetch(this.foodImgSrc).then((res) => res.blob());
            this.foodImg = await createImageBitmap(blob);
        }
        this.drawTitlePage(snakeCoordinates);
    }
    async initFood(foodPosition) {
        // If new game, get position from state; otherwise, create new position
        const [x, y] = foodPosition;
        this.drawFood([x, y]);
    }
    startTimer() {
        const cb = () => {
            if (this.timeoutId)
                clearTimeout(this.timeoutId);
            this.timeoutId = setTimeout(async () => {
                requestAnimationFrame(cb);
                await this.advanceSnake();
            }, 100);
        };
        this.timerId = requestAnimationFrame(cb);
    }
    stopTimer() {
        if (this.timerId) {
            cancelAnimationFrame(this.timerId);
        }
        if (this.timeoutId) {
            clearTimeout(this.timeoutId);
        }
    }
};
comlink__WEBPACK_IMPORTED_MODULE_1__.expose(SnakeWorker);

})();

/******/ 	return __webpack_exports__;
/******/ })()
;
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly9CaXRlTWUvd2VicGFjay91bml2ZXJzYWxNb2R1bGVEZWZpbml0aW9uIiwid2VicGFjazovL0JpdGVNZS8uL25vZGVfbW9kdWxlcy9jb21saW5rL2Rpc3QvZXNtL2NvbWxpbmsubWpzIiwid2VicGFjazovL0JpdGVNZS8uL3NyYy9oZWxwZXIvaW5kZXgudHMiLCJ3ZWJwYWNrOi8vQml0ZU1lLy4vc3JjL2hlbHBlci9pbml0Rm9vZFBvc2l0aW9uLnRzIiwid2VicGFjazovL0JpdGVNZS93ZWJwYWNrL2Jvb3RzdHJhcCIsIndlYnBhY2s6Ly9CaXRlTWUvd2VicGFjay9ydW50aW1lL2RlZmluZSBwcm9wZXJ0eSBnZXR0ZXJzIiwid2VicGFjazovL0JpdGVNZS93ZWJwYWNrL3J1bnRpbWUvaGFzT3duUHJvcGVydHkgc2hvcnRoYW5kIiwid2VicGFjazovL0JpdGVNZS93ZWJwYWNrL3J1bnRpbWUvbWFrZSBuYW1lc3BhY2Ugb2JqZWN0Iiwid2VicGFjazovL0JpdGVNZS8uL3NyYy93b3JrZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsQ0FBQztBQUNELE87Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUNWQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsZUFBZSxlQUFlO0FBQzlCO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGVBQWUsUUFBUTtBQUN2QjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsaUJBQWlCO0FBQ2pCO0FBQ0E7QUFDQTtBQUNBLDBCQUEwQjtBQUMxQjtBQUNB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YjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsMkJBQTJCLGFBQWE7QUFDeEMsK0JBQStCLGFBQWE7QUFDNUM7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGdEQUFnRDtBQUNoRDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSwyQ0FBYyIsImZpbGUiOiJ3b3JrZXIuanMiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gd2VicGFja1VuaXZlcnNhbE1vZHVsZURlZmluaXRpb24ocm9vdCwgZmFjdG9yeSkge1xuXHRpZih0eXBlb2YgZXhwb3J0cyA9PT0gJ29iamVjdCcgJiYgdHlwZW9mIG1vZHVsZSA9PT0gJ29iamVjdCcpXG5cdFx0bW9kdWxlLmV4cG9ydHMgPSBmYWN0b3J5KCk7XG5cdGVsc2UgaWYodHlwZW9mIGRlZmluZSA9PT0gJ2Z1bmN0aW9uJyAmJiBkZWZpbmUuYW1kKVxuXHRcdGRlZmluZShbXSwgZmFjdG9yeSk7XG5cdGVsc2UgaWYodHlwZW9mIGV4cG9ydHMgPT09ICdvYmplY3QnKVxuXHRcdGV4cG9ydHNbXCJCaXRlTWVcIl0gPSBmYWN0b3J5KCk7XG5cdGVsc2Vcblx0XHRyb290W1wiQml0ZU1lXCJdID0gZmFjdG9yeSgpO1xufSkoc2VsZiwgZnVuY3Rpb24oKSB7XG5yZXR1cm4gIiwiLyoqXHJcbiAqIENvcHlyaWdodCAyMDE5IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXHJcbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XHJcbiAqIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cclxuICogWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XHJcbiAqICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcclxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxyXG4gKiBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXHJcbiAqIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxyXG4gKiBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXHJcbiAqIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxyXG4gKi9cclxuY29uc3QgcHJveHlNYXJrZXIgPSBTeW1ib2woXCJDb21saW5rLnByb3h5XCIpO1xyXG5jb25zdCBjcmVhdGVFbmRwb2ludCA9IFN5bWJvbChcIkNvbWxpbmsuZW5kcG9pbnRcIik7XHJcbmNvbnN0IHJlbGVhc2VQcm94eSA9IFN5bWJvbChcIkNvbWxpbmsucmVsZWFzZVByb3h5XCIpO1xyXG5jb25zdCB0aHJvd01hcmtlciA9IFN5bWJvbChcIkNvbWxpbmsudGhyb3duXCIpO1xyXG5jb25zdCBpc09iamVjdCA9ICh2YWwpID0+ICh0eXBlb2YgdmFsID09PSBcIm9iamVjdFwiICYmIHZhbCAhPT0gbnVsbCkgfHwgdHlwZW9mIHZhbCA9PT0gXCJmdW5jdGlvblwiO1xyXG4vKipcclxuICogSW50ZXJuYWwgdHJhbnNmZXIgaGFuZGxlIHRvIGhhbmRsZSBvYmplY3RzIG1hcmtlZCB0byBwcm94eS5cclxuICovXHJcbmNvbnN0IHByb3h5VHJhbnNmZXJIYW5kbGVyID0ge1xyXG4gICAgY2FuSGFuZGxlOiAodmFsKSA9PiBpc09iamVjdCh2YWwpICYmIHZhbFtwcm94eU1hcmtlcl0sXHJcbiAgICBzZXJpYWxpemUob2JqKSB7XHJcbiAgICAgICAgY29uc3QgeyBwb3J0MSwgcG9ydDIgfSA9IG5ldyBNZXNzYWdlQ2hhbm5lbCgpO1xyXG4gICAgICAgIGV4cG9zZShvYmosIHBvcnQxKTtcclxuICAgICAgICByZXR1cm4gW3BvcnQyLCBbcG9ydDJdXTtcclxuICAgIH0sXHJcbiAgICBkZXNlcmlhbGl6ZShwb3J0KSB7XHJcbiAgICAgICAgcG9ydC5zdGFydCgpO1xyXG4gICAgICAgIHJldHVybiB3cmFwKHBvcnQpO1xyXG4gICAgfSxcclxufTtcclxuLyoqXHJcbiAqIEludGVybmFsIHRyYW5zZmVyIGhhbmRsZXIgdG8gaGFuZGxlIHRocm93biBleGNlcHRpb25zLlxyXG4gKi9cclxuY29uc3QgdGhyb3dUcmFuc2ZlckhhbmRsZXIgPSB7XHJcbiAgICBjYW5IYW5kbGU6ICh2YWx1ZSkgPT4gaXNPYmplY3QodmFsdWUpICYmIHRocm93TWFya2VyIGluIHZhbHVlLFxyXG4gICAgc2VyaWFsaXplKHsgdmFsdWUgfSkge1xyXG4gICAgICAgIGxldCBzZXJpYWxpemVkO1xyXG4gICAgICAgIGlmICh2YWx1ZSBpbnN0YW5jZW9mIEVycm9yKSB7XHJcbiAgICAgICAgICAgIHNlcmlhbGl6ZWQgPSB7XHJcbiAgICAgICAgICAgICAgICBpc0Vycm9yOiB0cnVlLFxyXG4gICAgICAgICAgICAgICAgdmFsdWU6IHtcclxuICAgICAgICAgICAgICAgICAgICBtZXNzYWdlOiB2YWx1ZS5tZXNzYWdlLFxyXG4gICAgICAgICAgICAgICAgICAgIG5hbWU6IHZhbHVlLm5hbWUsXHJcbiAgICAgICAgICAgICAgICAgICAgc3RhY2s6IHZhbHVlLnN0YWNrLFxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgIHNlcmlhbGl6ZWQgPSB7IGlzRXJyb3I6IGZhbHNlLCB2YWx1ZSB9O1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gW3NlcmlhbGl6ZWQsIFtdXTtcclxuICAgIH0sXHJcbiAgICBkZXNlcmlhbGl6ZShzZXJpYWxpemVkKSB7XHJcbiAgICAgICAgaWYgKHNlcmlhbGl6ZWQuaXNFcnJvcikge1xyXG4gICAgICAgICAgICB0aHJvdyBPYmplY3QuYXNzaWduKG5ldyBFcnJvcihzZXJpYWxpemVkLnZhbHVlLm1lc3NhZ2UpLCBzZXJpYWxpemVkLnZhbHVlKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhyb3cgc2VyaWFsaXplZC52YWx1ZTtcclxuICAgIH0sXHJcbn07XHJcbi8qKlxyXG4gKiBBbGxvd3MgY3VzdG9taXppbmcgdGhlIHNlcmlhbGl6YXRpb24gb2YgY2VydGFpbiB2YWx1ZXMuXHJcbiAqL1xyXG5jb25zdCB0cmFuc2ZlckhhbmRsZXJzID0gbmV3IE1hcChbXHJcbiAgICBbXCJwcm94eVwiLCBwcm94eVRyYW5zZmVySGFuZGxlcl0sXHJcbiAgICBbXCJ0aHJvd1wiLCB0aHJvd1RyYW5zZmVySGFuZGxlcl0sXHJcbl0pO1xyXG5mdW5jdGlvbiBleHBvc2Uob2JqLCBlcCA9IHNlbGYpIHtcclxuICAgIGVwLmFkZEV2ZW50TGlzdGVuZXIoXCJtZXNzYWdlXCIsIGZ1bmN0aW9uIGNhbGxiYWNrKGV2KSB7XHJcbiAgICAgICAgaWYgKCFldiB8fCAhZXYuZGF0YSkge1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNvbnN0IHsgaWQsIHR5cGUsIHBhdGggfSA9IE9iamVjdC5hc3NpZ24oeyBwYXRoOiBbXSB9LCBldi5kYXRhKTtcclxuICAgICAgICBjb25zdCBhcmd1bWVudExpc3QgPSAoZXYuZGF0YS5hcmd1bWVudExpc3QgfHwgW10pLm1hcChmcm9tV2lyZVZhbHVlKTtcclxuICAgICAgICBsZXQgcmV0dXJuVmFsdWU7XHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgY29uc3QgcGFyZW50ID0gcGF0aC5zbGljZSgwLCAtMSkucmVkdWNlKChvYmosIHByb3ApID0+IG9ialtwcm9wXSwgb2JqKTtcclxuICAgICAgICAgICAgY29uc3QgcmF3VmFsdWUgPSBwYXRoLnJlZHVjZSgob2JqLCBwcm9wKSA9PiBvYmpbcHJvcF0sIG9iaik7XHJcbiAgICAgICAgICAgIHN3aXRjaCAodHlwZSkge1xyXG4gICAgICAgICAgICAgICAgY2FzZSAwIC8qIEdFVCAqLzpcclxuICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVyblZhbHVlID0gcmF3VmFsdWU7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgY2FzZSAxIC8qIFNFVCAqLzpcclxuICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHBhcmVudFtwYXRoLnNsaWNlKC0xKVswXV0gPSBmcm9tV2lyZVZhbHVlKGV2LmRhdGEudmFsdWUpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm5WYWx1ZSA9IHRydWU7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgY2FzZSAyIC8qIEFQUExZICovOlxyXG4gICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuVmFsdWUgPSByYXdWYWx1ZS5hcHBseShwYXJlbnQsIGFyZ3VtZW50TGlzdCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgY2FzZSAzIC8qIENPTlNUUlVDVCAqLzpcclxuICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHZhbHVlID0gbmV3IHJhd1ZhbHVlKC4uLmFyZ3VtZW50TGlzdCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVyblZhbHVlID0gcHJveHkodmFsdWUpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgIGNhc2UgNCAvKiBFTkRQT0lOVCAqLzpcclxuICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHsgcG9ydDEsIHBvcnQyIH0gPSBuZXcgTWVzc2FnZUNoYW5uZWwoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZXhwb3NlKG9iaiwgcG9ydDIpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm5WYWx1ZSA9IHRyYW5zZmVyKHBvcnQxLCBbcG9ydDFdKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICBjYXNlIDUgLyogUkVMRUFTRSAqLzpcclxuICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVyblZhbHVlID0gdW5kZWZpbmVkO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBjYXRjaCAodmFsdWUpIHtcclxuICAgICAgICAgICAgcmV0dXJuVmFsdWUgPSB7IHZhbHVlLCBbdGhyb3dNYXJrZXJdOiAwIH07XHJcbiAgICAgICAgfVxyXG4gICAgICAgIFByb21pc2UucmVzb2x2ZShyZXR1cm5WYWx1ZSlcclxuICAgICAgICAgICAgLmNhdGNoKCh2YWx1ZSkgPT4ge1xyXG4gICAgICAgICAgICByZXR1cm4geyB2YWx1ZSwgW3Rocm93TWFya2VyXTogMCB9O1xyXG4gICAgICAgIH0pXHJcbiAgICAgICAgICAgIC50aGVuKChyZXR1cm5WYWx1ZSkgPT4ge1xyXG4gICAgICAgICAgICBjb25zdCBbd2lyZVZhbHVlLCB0cmFuc2ZlcmFibGVzXSA9IHRvV2lyZVZhbHVlKHJldHVyblZhbHVlKTtcclxuICAgICAgICAgICAgZXAucG9zdE1lc3NhZ2UoT2JqZWN0LmFzc2lnbihPYmplY3QuYXNzaWduKHt9LCB3aXJlVmFsdWUpLCB7IGlkIH0pLCB0cmFuc2ZlcmFibGVzKTtcclxuICAgICAgICAgICAgaWYgKHR5cGUgPT09IDUgLyogUkVMRUFTRSAqLykge1xyXG4gICAgICAgICAgICAgICAgLy8gZGV0YWNoIGFuZCBkZWFjdGl2ZSBhZnRlciBzZW5kaW5nIHJlbGVhc2UgcmVzcG9uc2UgYWJvdmUuXHJcbiAgICAgICAgICAgICAgICBlcC5yZW1vdmVFdmVudExpc3RlbmVyKFwibWVzc2FnZVwiLCBjYWxsYmFjayk7XHJcbiAgICAgICAgICAgICAgICBjbG9zZUVuZFBvaW50KGVwKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgfSk7XHJcbiAgICBpZiAoZXAuc3RhcnQpIHtcclxuICAgICAgICBlcC5zdGFydCgpO1xyXG4gICAgfVxyXG59XHJcbmZ1bmN0aW9uIGlzTWVzc2FnZVBvcnQoZW5kcG9pbnQpIHtcclxuICAgIHJldHVybiBlbmRwb2ludC5jb25zdHJ1Y3Rvci5uYW1lID09PSBcIk1lc3NhZ2VQb3J0XCI7XHJcbn1cclxuZnVuY3Rpb24gY2xvc2VFbmRQb2ludChlbmRwb2ludCkge1xyXG4gICAgaWYgKGlzTWVzc2FnZVBvcnQoZW5kcG9pbnQpKVxyXG4gICAgICAgIGVuZHBvaW50LmNsb3NlKCk7XHJcbn1cclxuZnVuY3Rpb24gd3JhcChlcCwgdGFyZ2V0KSB7XHJcbiAgICByZXR1cm4gY3JlYXRlUHJveHkoZXAsIFtdLCB0YXJnZXQpO1xyXG59XHJcbmZ1bmN0aW9uIHRocm93SWZQcm94eVJlbGVhc2VkKGlzUmVsZWFzZWQpIHtcclxuICAgIGlmIChpc1JlbGVhc2VkKSB7XHJcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiUHJveHkgaGFzIGJlZW4gcmVsZWFzZWQgYW5kIGlzIG5vdCB1c2VhYmxlXCIpO1xyXG4gICAgfVxyXG59XHJcbmZ1bmN0aW9uIGNyZWF0ZVByb3h5KGVwLCBwYXRoID0gW10sIHRhcmdldCA9IGZ1bmN0aW9uICgpIHsgfSkge1xyXG4gICAgbGV0IGlzUHJveHlSZWxlYXNlZCA9IGZhbHNlO1xyXG4gICAgY29uc3QgcHJveHkgPSBuZXcgUHJveHkodGFyZ2V0LCB7XHJcbiAgICAgICAgZ2V0KF90YXJnZXQsIHByb3ApIHtcclxuICAgICAgICAgICAgdGhyb3dJZlByb3h5UmVsZWFzZWQoaXNQcm94eVJlbGVhc2VkKTtcclxuICAgICAgICAgICAgaWYgKHByb3AgPT09IHJlbGVhc2VQcm94eSkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuICgpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVxdWVzdFJlc3BvbnNlTWVzc2FnZShlcCwge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiA1IC8qIFJFTEVBU0UgKi8sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHBhdGg6IHBhdGgubWFwKChwKSA9PiBwLnRvU3RyaW5nKCkpLFxyXG4gICAgICAgICAgICAgICAgICAgIH0pLnRoZW4oKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjbG9zZUVuZFBvaW50KGVwKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaXNQcm94eVJlbGVhc2VkID0gdHJ1ZTtcclxuICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYgKHByb3AgPT09IFwidGhlblwiKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAocGF0aC5sZW5ndGggPT09IDApIHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4geyB0aGVuOiAoKSA9PiBwcm94eSB9O1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgY29uc3QgciA9IHJlcXVlc3RSZXNwb25zZU1lc3NhZ2UoZXAsIHtcclxuICAgICAgICAgICAgICAgICAgICB0eXBlOiAwIC8qIEdFVCAqLyxcclxuICAgICAgICAgICAgICAgICAgICBwYXRoOiBwYXRoLm1hcCgocCkgPT4gcC50b1N0cmluZygpKSxcclxuICAgICAgICAgICAgICAgIH0pLnRoZW4oZnJvbVdpcmVWYWx1ZSk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gci50aGVuLmJpbmQocik7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIGNyZWF0ZVByb3h5KGVwLCBbLi4ucGF0aCwgcHJvcF0pO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgc2V0KF90YXJnZXQsIHByb3AsIHJhd1ZhbHVlKSB7XHJcbiAgICAgICAgICAgIHRocm93SWZQcm94eVJlbGVhc2VkKGlzUHJveHlSZWxlYXNlZCk7XHJcbiAgICAgICAgICAgIC8vIEZJWE1FOiBFUzYgUHJveHkgSGFuZGxlciBgc2V0YCBtZXRob2RzIGFyZSBzdXBwb3NlZCB0byByZXR1cm4gYVxyXG4gICAgICAgICAgICAvLyBib29sZWFuLiBUbyBzaG93IGdvb2Qgd2lsbCwgd2UgcmV0dXJuIHRydWUgYXN5bmNocm9ub3VzbHkgwq9cXF8o44OEKV8vwq9cclxuICAgICAgICAgICAgY29uc3QgW3ZhbHVlLCB0cmFuc2ZlcmFibGVzXSA9IHRvV2lyZVZhbHVlKHJhd1ZhbHVlKTtcclxuICAgICAgICAgICAgcmV0dXJuIHJlcXVlc3RSZXNwb25zZU1lc3NhZ2UoZXAsIHtcclxuICAgICAgICAgICAgICAgIHR5cGU6IDEgLyogU0VUICovLFxyXG4gICAgICAgICAgICAgICAgcGF0aDogWy4uLnBhdGgsIHByb3BdLm1hcCgocCkgPT4gcC50b1N0cmluZygpKSxcclxuICAgICAgICAgICAgICAgIHZhbHVlLFxyXG4gICAgICAgICAgICB9LCB0cmFuc2ZlcmFibGVzKS50aGVuKGZyb21XaXJlVmFsdWUpO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgYXBwbHkoX3RhcmdldCwgX3RoaXNBcmcsIHJhd0FyZ3VtZW50TGlzdCkge1xyXG4gICAgICAgICAgICB0aHJvd0lmUHJveHlSZWxlYXNlZChpc1Byb3h5UmVsZWFzZWQpO1xyXG4gICAgICAgICAgICBjb25zdCBsYXN0ID0gcGF0aFtwYXRoLmxlbmd0aCAtIDFdO1xyXG4gICAgICAgICAgICBpZiAobGFzdCA9PT0gY3JlYXRlRW5kcG9pbnQpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiByZXF1ZXN0UmVzcG9uc2VNZXNzYWdlKGVwLCB7XHJcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogNCAvKiBFTkRQT0lOVCAqLyxcclxuICAgICAgICAgICAgICAgIH0pLnRoZW4oZnJvbVdpcmVWYWx1ZSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgLy8gV2UganVzdCBwcmV0ZW5kIHRoYXQgYGJpbmQoKWAgZGlkbuKAmXQgaGFwcGVuLlxyXG4gICAgICAgICAgICBpZiAobGFzdCA9PT0gXCJiaW5kXCIpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBjcmVhdGVQcm94eShlcCwgcGF0aC5zbGljZSgwLCAtMSkpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGNvbnN0IFthcmd1bWVudExpc3QsIHRyYW5zZmVyYWJsZXNdID0gcHJvY2Vzc0FyZ3VtZW50cyhyYXdBcmd1bWVudExpc3QpO1xyXG4gICAgICAgICAgICByZXR1cm4gcmVxdWVzdFJlc3BvbnNlTWVzc2FnZShlcCwge1xyXG4gICAgICAgICAgICAgICAgdHlwZTogMiAvKiBBUFBMWSAqLyxcclxuICAgICAgICAgICAgICAgIHBhdGg6IHBhdGgubWFwKChwKSA9PiBwLnRvU3RyaW5nKCkpLFxyXG4gICAgICAgICAgICAgICAgYXJndW1lbnRMaXN0LFxyXG4gICAgICAgICAgICB9LCB0cmFuc2ZlcmFibGVzKS50aGVuKGZyb21XaXJlVmFsdWUpO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgY29uc3RydWN0KF90YXJnZXQsIHJhd0FyZ3VtZW50TGlzdCkge1xyXG4gICAgICAgICAgICB0aHJvd0lmUHJveHlSZWxlYXNlZChpc1Byb3h5UmVsZWFzZWQpO1xyXG4gICAgICAgICAgICBjb25zdCBbYXJndW1lbnRMaXN0LCB0cmFuc2ZlcmFibGVzXSA9IHByb2Nlc3NBcmd1bWVudHMocmF3QXJndW1lbnRMaXN0KTtcclxuICAgICAgICAgICAgcmV0dXJuIHJlcXVlc3RSZXNwb25zZU1lc3NhZ2UoZXAsIHtcclxuICAgICAgICAgICAgICAgIHR5cGU6IDMgLyogQ09OU1RSVUNUICovLFxyXG4gICAgICAgICAgICAgICAgcGF0aDogcGF0aC5tYXAoKHApID0+IHAudG9TdHJpbmcoKSksXHJcbiAgICAgICAgICAgICAgICBhcmd1bWVudExpc3QsXHJcbiAgICAgICAgICAgIH0sIHRyYW5zZmVyYWJsZXMpLnRoZW4oZnJvbVdpcmVWYWx1ZSk7XHJcbiAgICAgICAgfSxcclxuICAgIH0pO1xyXG4gICAgcmV0dXJuIHByb3h5O1xyXG59XHJcbmZ1bmN0aW9uIG15RmxhdChhcnIpIHtcclxuICAgIHJldHVybiBBcnJheS5wcm90b3R5cGUuY29uY2F0LmFwcGx5KFtdLCBhcnIpO1xyXG59XHJcbmZ1bmN0aW9uIHByb2Nlc3NBcmd1bWVudHMoYXJndW1lbnRMaXN0KSB7XHJcbiAgICBjb25zdCBwcm9jZXNzZWQgPSBhcmd1bWVudExpc3QubWFwKHRvV2lyZVZhbHVlKTtcclxuICAgIHJldHVybiBbcHJvY2Vzc2VkLm1hcCgodikgPT4gdlswXSksIG15RmxhdChwcm9jZXNzZWQubWFwKCh2KSA9PiB2WzFdKSldO1xyXG59XHJcbmNvbnN0IHRyYW5zZmVyQ2FjaGUgPSBuZXcgV2Vha01hcCgpO1xyXG5mdW5jdGlvbiB0cmFuc2ZlcihvYmosIHRyYW5zZmVycykge1xyXG4gICAgdHJhbnNmZXJDYWNoZS5zZXQob2JqLCB0cmFuc2ZlcnMpO1xyXG4gICAgcmV0dXJuIG9iajtcclxufVxyXG5mdW5jdGlvbiBwcm94eShvYmopIHtcclxuICAgIHJldHVybiBPYmplY3QuYXNzaWduKG9iaiwgeyBbcHJveHlNYXJrZXJdOiB0cnVlIH0pO1xyXG59XHJcbmZ1bmN0aW9uIHdpbmRvd0VuZHBvaW50KHcsIGNvbnRleHQgPSBzZWxmLCB0YXJnZXRPcmlnaW4gPSBcIipcIikge1xyXG4gICAgcmV0dXJuIHtcclxuICAgICAgICBwb3N0TWVzc2FnZTogKG1zZywgdHJhbnNmZXJhYmxlcykgPT4gdy5wb3N0TWVzc2FnZShtc2csIHRhcmdldE9yaWdpbiwgdHJhbnNmZXJhYmxlcyksXHJcbiAgICAgICAgYWRkRXZlbnRMaXN0ZW5lcjogY29udGV4dC5hZGRFdmVudExpc3RlbmVyLmJpbmQoY29udGV4dCksXHJcbiAgICAgICAgcmVtb3ZlRXZlbnRMaXN0ZW5lcjogY29udGV4dC5yZW1vdmVFdmVudExpc3RlbmVyLmJpbmQoY29udGV4dCksXHJcbiAgICB9O1xyXG59XHJcbmZ1bmN0aW9uIHRvV2lyZVZhbHVlKHZhbHVlKSB7XHJcbiAgICBmb3IgKGNvbnN0IFtuYW1lLCBoYW5kbGVyXSBvZiB0cmFuc2ZlckhhbmRsZXJzKSB7XHJcbiAgICAgICAgaWYgKGhhbmRsZXIuY2FuSGFuZGxlKHZhbHVlKSkge1xyXG4gICAgICAgICAgICBjb25zdCBbc2VyaWFsaXplZFZhbHVlLCB0cmFuc2ZlcmFibGVzXSA9IGhhbmRsZXIuc2VyaWFsaXplKHZhbHVlKTtcclxuICAgICAgICAgICAgcmV0dXJuIFtcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICB0eXBlOiAzIC8qIEhBTkRMRVIgKi8sXHJcbiAgICAgICAgICAgICAgICAgICAgbmFtZSxcclxuICAgICAgICAgICAgICAgICAgICB2YWx1ZTogc2VyaWFsaXplZFZhbHVlLFxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgIHRyYW5zZmVyYWJsZXMsXHJcbiAgICAgICAgICAgIF07XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgcmV0dXJuIFtcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHR5cGU6IDAgLyogUkFXICovLFxyXG4gICAgICAgICAgICB2YWx1ZSxcclxuICAgICAgICB9LFxyXG4gICAgICAgIHRyYW5zZmVyQ2FjaGUuZ2V0KHZhbHVlKSB8fCBbXSxcclxuICAgIF07XHJcbn1cclxuZnVuY3Rpb24gZnJvbVdpcmVWYWx1ZSh2YWx1ZSkge1xyXG4gICAgc3dpdGNoICh2YWx1ZS50eXBlKSB7XHJcbiAgICAgICAgY2FzZSAzIC8qIEhBTkRMRVIgKi86XHJcbiAgICAgICAgICAgIHJldHVybiB0cmFuc2ZlckhhbmRsZXJzLmdldCh2YWx1ZS5uYW1lKS5kZXNlcmlhbGl6ZSh2YWx1ZS52YWx1ZSk7XHJcbiAgICAgICAgY2FzZSAwIC8qIFJBVyAqLzpcclxuICAgICAgICAgICAgcmV0dXJuIHZhbHVlLnZhbHVlO1xyXG4gICAgfVxyXG59XHJcbmZ1bmN0aW9uIHJlcXVlc3RSZXNwb25zZU1lc3NhZ2UoZXAsIG1zZywgdHJhbnNmZXJzKSB7XHJcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcclxuICAgICAgICBjb25zdCBpZCA9IGdlbmVyYXRlVVVJRCgpO1xyXG4gICAgICAgIGVwLmFkZEV2ZW50TGlzdGVuZXIoXCJtZXNzYWdlXCIsIGZ1bmN0aW9uIGwoZXYpIHtcclxuICAgICAgICAgICAgaWYgKCFldi5kYXRhIHx8ICFldi5kYXRhLmlkIHx8IGV2LmRhdGEuaWQgIT09IGlkKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZXAucmVtb3ZlRXZlbnRMaXN0ZW5lcihcIm1lc3NhZ2VcIiwgbCk7XHJcbiAgICAgICAgICAgIHJlc29sdmUoZXYuZGF0YSk7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgaWYgKGVwLnN0YXJ0KSB7XHJcbiAgICAgICAgICAgIGVwLnN0YXJ0KCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVwLnBvc3RNZXNzYWdlKE9iamVjdC5hc3NpZ24oeyBpZCB9LCBtc2cpLCB0cmFuc2ZlcnMpO1xyXG4gICAgfSk7XHJcbn1cclxuZnVuY3Rpb24gZ2VuZXJhdGVVVUlEKCkge1xyXG4gICAgcmV0dXJuIG5ldyBBcnJheSg0KVxyXG4gICAgICAgIC5maWxsKDApXHJcbiAgICAgICAgLm1hcCgoKSA9PiBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiBOdW1iZXIuTUFYX1NBRkVfSU5URUdFUikudG9TdHJpbmcoMTYpKVxyXG4gICAgICAgIC5qb2luKFwiLVwiKTtcclxufVxuXG5leHBvcnQgeyBjcmVhdGVFbmRwb2ludCwgZXhwb3NlLCBwcm94eSwgcHJveHlNYXJrZXIsIHJlbGVhc2VQcm94eSwgdHJhbnNmZXIsIHRyYW5zZmVySGFuZGxlcnMsIHdpbmRvd0VuZHBvaW50LCB3cmFwIH07XG4vLyMgc291cmNlTWFwcGluZ1VSTD1jb21saW5rLm1qcy5tYXBcbiIsImV4cG9ydCB7IGRlZmF1bHQgYXMgaW5pdEZvb2RQb3NpdGlvbiB9IGZyb20gJy4vaW5pdEZvb2RQb3NpdGlvbic7XG4iLCJleHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBpbml0Rm9vZFBvc2l0aW9uKHsgc25ha2VTaXplLCBjYW52YXNIZWlnaHQsIGNhbnZhc1dpZHRoLCBmb29kU2l6ZSwgfSkge1xuICAgIGNvbnN0IHNpemUgPSBzbmFrZVNpemU7XG4gICAgY29uc3Qgc3RhcnRYID0gTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogKGNhbnZhc1dpZHRoIC8gc2l6ZSAtIGZvb2RTaXplIC8gKGZvb2RTaXplIC0gc2l6ZSkpKSAqIHNpemU7XG4gICAgY29uc3Qgc3RhcnRZID0gTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogKGNhbnZhc0hlaWdodCAvIHNpemUgLSBmb29kU2l6ZSAvIChmb29kU2l6ZSAtIHNpemUpKSkgKiBzaXplO1xuICAgIHJldHVybiBbc3RhcnRYLCBzdGFydFldO1xufVxuIiwiLy8gVGhlIG1vZHVsZSBjYWNoZVxudmFyIF9fd2VicGFja19tb2R1bGVfY2FjaGVfXyA9IHt9O1xuXG4vLyBUaGUgcmVxdWlyZSBmdW5jdGlvblxuZnVuY3Rpb24gX193ZWJwYWNrX3JlcXVpcmVfXyhtb2R1bGVJZCkge1xuXHQvLyBDaGVjayBpZiBtb2R1bGUgaXMgaW4gY2FjaGVcblx0aWYoX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fW21vZHVsZUlkXSkge1xuXHRcdHJldHVybiBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX19bbW9kdWxlSWRdLmV4cG9ydHM7XG5cdH1cblx0Ly8gQ3JlYXRlIGEgbmV3IG1vZHVsZSAoYW5kIHB1dCBpdCBpbnRvIHRoZSBjYWNoZSlcblx0dmFyIG1vZHVsZSA9IF9fd2VicGFja19tb2R1bGVfY2FjaGVfX1ttb2R1bGVJZF0gPSB7XG5cdFx0Ly8gbm8gbW9kdWxlLmlkIG5lZWRlZFxuXHRcdC8vIG5vIG1vZHVsZS5sb2FkZWQgbmVlZGVkXG5cdFx0ZXhwb3J0czoge31cblx0fTtcblxuXHQvLyBFeGVjdXRlIHRoZSBtb2R1bGUgZnVuY3Rpb25cblx0X193ZWJwYWNrX21vZHVsZXNfX1ttb2R1bGVJZF0obW9kdWxlLCBtb2R1bGUuZXhwb3J0cywgX193ZWJwYWNrX3JlcXVpcmVfXyk7XG5cblx0Ly8gUmV0dXJuIHRoZSBleHBvcnRzIG9mIHRoZSBtb2R1bGVcblx0cmV0dXJuIG1vZHVsZS5leHBvcnRzO1xufVxuXG4iLCIvLyBkZWZpbmUgZ2V0dGVyIGZ1bmN0aW9ucyBmb3IgaGFybW9ueSBleHBvcnRzXG5fX3dlYnBhY2tfcmVxdWlyZV9fLmQgPSAoZXhwb3J0cywgZGVmaW5pdGlvbikgPT4ge1xuXHRmb3IodmFyIGtleSBpbiBkZWZpbml0aW9uKSB7XG5cdFx0aWYoX193ZWJwYWNrX3JlcXVpcmVfXy5vKGRlZmluaXRpb24sIGtleSkgJiYgIV9fd2VicGFja19yZXF1aXJlX18ubyhleHBvcnRzLCBrZXkpKSB7XG5cdFx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywga2V5LCB7IGVudW1lcmFibGU6IHRydWUsIGdldDogZGVmaW5pdGlvbltrZXldIH0pO1xuXHRcdH1cblx0fVxufTsiLCJfX3dlYnBhY2tfcmVxdWlyZV9fLm8gPSAob2JqLCBwcm9wKSA9PiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG9iaiwgcHJvcCkpIiwiLy8gZGVmaW5lIF9fZXNNb2R1bGUgb24gZXhwb3J0c1xuX193ZWJwYWNrX3JlcXVpcmVfXy5yID0gKGV4cG9ydHMpID0+IHtcblx0aWYodHlwZW9mIFN5bWJvbCAhPT0gJ3VuZGVmaW5lZCcgJiYgU3ltYm9sLnRvU3RyaW5nVGFnKSB7XG5cdFx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFN5bWJvbC50b1N0cmluZ1RhZywgeyB2YWx1ZTogJ01vZHVsZScgfSk7XG5cdH1cblx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsICdfX2VzTW9kdWxlJywgeyB2YWx1ZTogdHJ1ZSB9KTtcbn07IiwiaW1wb3J0IHsgaW5pdEZvb2RQb3NpdGlvbiB9IGZyb20gJy4vaGVscGVyJztcbmltcG9ydCAqIGFzIENvbWxpbmsgZnJvbSAnY29tbGluayc7XG5leHBvcnQgY29uc3QgU25ha2VXb3JrZXIgPSBjbGFzcyBTbmFrZVdvcmtlciB7XG4gICAgY29uc3RydWN0b3IoY2FudmFzLCBhZHZhbmNlU25ha2UsIHByb3BzKSB7XG4gICAgICAgIHZhciBfYSwgX2IsIF9jLCBfZCwgX2UsIF9mO1xuICAgICAgICB0aGlzLmFkdmFuY2VTbmFrZSA9IGFkdmFuY2VTbmFrZTtcbiAgICAgICAgdGhpcy5iYWNrZ3JvdW5kQ29sb3IgPSBwcm9wcy5jYW52YXMuYmFja2dyb3VuZENvbG9yO1xuICAgICAgICB0aGlzLmNhbnZhc0hlaWdodCA9IHByb3BzLmNhbnZhcy5oZWlnaHQ7XG4gICAgICAgIHRoaXMuY2FudmFzV2lkdGggPSBwcm9wcy5jYW52YXMud2lkdGg7XG4gICAgICAgIHRoaXMuY3R4ID0gY2FudmFzLmdldENvbnRleHQoJzJkJyk7XG4gICAgICAgIHRoaXMuZ2FtZU92ZXJDb2xvciA9IChfYSA9IHByb3BzLnRleHQuZ2FtZU92ZXJDb2xvcikgIT09IG51bGwgJiYgX2EgIT09IHZvaWQgMCA/IF9hIDogJyNGMjY0NjMnO1xuICAgICAgICB0aGlzLmZvb2RDb2xvciA9IChfYiA9IHByb3BzLmZvb2QuY29sb3IpICE9PSBudWxsICYmIF9iICE9PSB2b2lkIDAgPyBfYiA6ICcjMmEyYTJhJztcbiAgICAgICAgdGhpcy5mb29kSW1nU3JjID0gcHJvcHMuZm9vZC5pbWdTcmM7XG4gICAgICAgIHRoaXMuZm9vZFBhZGRpbmcgPSA0O1xuICAgICAgICB0aGlzLmZvb2RTaXplID0gcHJvcHMuZm9vZC5zaXplO1xuICAgICAgICB0aGlzLmtleVByZXNzZWQgPSBbXTtcbiAgICAgICAgdGhpcy5zbmFrZUNvbG9yID0gKF9jID0gcHJvcHMuc25ha2UuY29sb3IpICE9PSBudWxsICYmIF9jICE9PSB2b2lkIDAgPyBfYyA6ICcjMmEyYTJhJztcbiAgICAgICAgdGhpcy5zbmFrZVNpemUgPSBwcm9wcy5zbmFrZS5zbmFrZVNpemU7XG4gICAgICAgIHRoaXMudGV4dENvbG9yID0gKF9kID0gcHJvcHMudGV4dC5jb2xvcikgIT09IG51bGwgJiYgX2QgIT09IHZvaWQgMCA/IF9kIDogJyMyYTJhMmEnO1xuICAgICAgICB0aGlzLnRpdGxlQ29sb3IgPSAoX2UgPSBwcm9wcy50ZXh0LnRpdGxlQ29sb3IpICE9PSBudWxsICYmIF9lICE9PSB2b2lkIDAgPyBfZSA6ICcjMmEyYTJhJztcbiAgICAgICAgdGhpcy5zdWJ0aXRsZUNvbG9yID0gKF9mID0gcHJvcHMudGV4dC5zdWJ0aXRsZUNvbG9yKSAhPT0gbnVsbCAmJiBfZiAhPT0gdm9pZCAwID8gX2YgOiAnIzJhMmEyYSc7XG4gICAgfVxuICAgIGNsZWFyQ2FudmFzKCkge1xuICAgICAgICB2YXIgX2E7XG4gICAgICAgIChfYSA9IHRoaXMuY3R4KSA9PT0gbnVsbCB8fCBfYSA9PT0gdm9pZCAwID8gdm9pZCAwIDogX2EuY2xlYXJSZWN0KDAsIDAsIHRoaXMuY2FudmFzSGVpZ2h0LCB0aGlzLmNhbnZhc1dpZHRoKTtcbiAgICB9XG4gICAgZHJhd1RleHQodGV4dCwgeSwgY29sb3IgPSB0aGlzLnRleHRDb2xvciwgZm9udCA9ICcxMnB4IGNvdXJpZXInKSB7XG4gICAgICAgIGNvbnN0IGNvbnRleHQgPSB0aGlzLmN0eDtcbiAgICAgICAgaWYgKCFjb250ZXh0KVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICBjb250ZXh0LmJlZ2luUGF0aCgpO1xuICAgICAgICBjb250ZXh0LmZpbGxTdHlsZSA9IGNvbG9yO1xuICAgICAgICBjb250ZXh0LmZvbnQgPSBmb250O1xuICAgICAgICBjb25zdCB0ZXh0U2l6ZSA9IGNvbnRleHQubWVhc3VyZVRleHQodGV4dCkud2lkdGg7XG4gICAgICAgIGNvbnRleHQuZmlsbFRleHQodGV4dCwgdGhpcy5jYW52YXNXaWR0aCAvIDIgLSBNYXRoLnJvdW5kKHRleHRTaXplIC8gMiksIHkpO1xuICAgIH1cbiAgICBkcmF3VGl0bGVQYWdlKGNvb3JkaW5hdGVzKSB7XG4gICAgICAgIGNvbnN0IGNvbnRleHQgPSB0aGlzLmN0eDtcbiAgICAgICAgaWYgKCFjb250ZXh0KVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB0aGlzLmNsZWFyQ2FudmFzKCk7XG4gICAgICAgIGNvbnN0IHZlcnRpY2FsQ2VudGVyID0gdGhpcy5jYW52YXNIZWlnaHQgLyAyO1xuICAgICAgICB0aGlzLmluaXRGb29kKFsxMCwgMjBdKTtcbiAgICAgICAgdGhpcy5pbml0Rm9vZChbdGhpcy5jYW52YXNXaWR0aCAtIHRoaXMuZm9vZFNpemUgLSAxMCwgMjBdKTtcbiAgICAgICAgdGhpcy5kcmF3U25ha2UoeyBjdXJyZW50Q29vcmRpbmF0ZXM6IGNvb3JkaW5hdGVzIH0pO1xuICAgICAgICAvLyBEcmF3IHRpdGxlXG4gICAgICAgIHRoaXMuZHJhd1RleHQoJ0JJVEUgTUUnLCA1NSwgdGhpcy50aXRsZUNvbG9yLCAnNDBweCBjb3VyaWVyJyk7XG4gICAgICAgIC8vIERyYXcgc3VidGl0bGVcbiAgICAgICAgdGhpcy5kcmF3VGV4dCgnQSBzbmFrZSBnYW1lJywgOTUsIHRoaXMuc3VidGl0bGVDb2xvciwgJzE2cHggY291cmllcicpO1xuICAgICAgICB0aGlzLmRyYXdUZXh0KCdQcmVzcyBTUEFDRSBvciBUYXAgdG8gQmVnaW4nLCB2ZXJ0aWNhbENlbnRlciwgdGhpcy50aXRsZUNvbG9yLCAnMTRweCBjb3VyaWVyJyk7XG4gICAgICAgIHRoaXMuZHJhd1RleHQoJ1ByZXNzIGggb3IgdGFwIHdpdGggdHdvJywgdmVydGljYWxDZW50ZXIgKyAzMCwgdGhpcy5zdWJ0aXRsZUNvbG9yLCAnMTJweCBjb3VyaWVyJyk7XG4gICAgICAgIHRoaXMuZHJhd1RleHQoJ2ZpbmdlcnMgZm9yIGhlbHAnLCB2ZXJ0aWNhbENlbnRlciArIDQ1LCB0aGlzLnN1YnRpdGxlQ29sb3IsICcxMnB4IGNvdXJpZXInKTtcbiAgICB9XG4gICAgZHJhd0luc3RydWN0aW9uc1BhZ2UoKSB7XG4gICAgICAgIHRoaXMuY2xlYXJDYW52YXMoKTtcbiAgICAgICAgY29uc3QgY29udGV4dCA9IHRoaXMuY3R4O1xuICAgICAgICBpZiAoIWNvbnRleHQpXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIHRoaXMuZHJhd1RleHQoJ0hPVyBUTyBQTEFZJywgNDUsIHVuZGVmaW5lZCwgJzQwcHggY291cmllcicpO1xuICAgICAgICB0aGlzLmRyYXdUZXh0KCdVc2UgdGhlIGFycm93cyBvbiB5b3VyJywgNzUpO1xuICAgICAgICB0aGlzLmRyYXdUZXh0KCdrZXlwYWQgb3Igc3dpcGUgdG8gbW92ZScsIDkwKTtcbiAgICAgICAgdGhpcy5kcmF3VGV4dCgndGhlIHNuYWtlIGFsb25nLicsIDEwNSk7XG4gICAgICAgIHRoaXMuZHJhd1RleHQoJ0VhdCB0aGUgZm9vZOKAlGEgcGljdHVyZSBvZiBteScsIDEzMCk7XG4gICAgICAgIHRoaXMuZHJhd1RleHQoJ2hlYWQgdGhhdCBteSB3aWZlIGhhdGVz4oCTJywgMTQ1KTtcbiAgICAgICAgdGhpcy5kcmF3VGV4dCgnd2l0aG91dCBjcmFzaGluZyBpbnRvIHRoZScsIDE2MCk7XG4gICAgICAgIHRoaXMuZHJhd1RleHQoJ3dhbGxzIG9yIHlvdXJzZWxmIScsIDE3NSk7XG4gICAgICAgIHRoaXMuZHJhd1RleHQoJ0tleSBDb21iaW5hdGlvbnM6ICcsIDIyNSwgdGhpcy5zdWJ0aXRsZUNvbG9yLCAnMTRweCBjb3VyaWVyJyk7XG4gICAgICAgIHRoaXMuZHJhd1RleHQoJ3N0YXJ0OiBTUEFDRScsIDI0MCk7XG4gICAgICAgIHRoaXMuZHJhd1RleHQoJ3F1aXQ6IHEnLCAyNTUpO1xuICAgICAgICB0aGlzLmRyYXdUZXh0KCdtdXRlOiBtJywgMjcwKTtcbiAgICAgICAgdGhpcy5kcmF3VGV4dCgnVm9sdW1lIERvd24sIFVwOiAyLCAxJywgMjg1KTtcbiAgICB9XG4gICAgZHJhd1NuYWtlKHsgY3VycmVudENvb3JkaW5hdGVzLCBuZXdDb29yZGluYXRlcyB9KSB7XG4gICAgICAgIGNvbnN0IGNvbnRleHQgPSB0aGlzLmN0eDtcbiAgICAgICAgbGV0IGNvb3JkaW5hdGVzO1xuICAgICAgICBpZiAobmV3Q29vcmRpbmF0ZXMpIHtcbiAgICAgICAgICAgIGNvb3JkaW5hdGVzID0gbmV3Q29vcmRpbmF0ZXM7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBjb29yZGluYXRlcyA9IGN1cnJlbnRDb29yZGluYXRlcztcbiAgICAgICAgfVxuICAgICAgICBpZiAoIWNvbnRleHQpXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIGNvbnN0IHNpemUgPSB0aGlzLnNuYWtlU2l6ZTtcbiAgICAgICAgY29udGV4dC5zdHJva2VTdHlsZSA9IHRoaXMuYmFja2dyb3VuZENvbG9yO1xuICAgICAgICBjb250ZXh0LmxpbmVXaWR0aCA9IDI7XG4gICAgICAgIGNvbnN0IGNvbG9yID0gdGhpcy5zbmFrZUNvbG9yO1xuICAgICAgICBjb29yZGluYXRlcy5mb3JFYWNoKChbeCwgeV0sIGkpID0+IHtcbiAgICAgICAgICAgIGlmICh0eXBlb2YgY29sb3IgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICAgICAgY29udGV4dC5maWxsU3R5bGUgPSB0aGlzLnNuYWtlQ29sb3I7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBjb250ZXh0LmZpbGxTdHlsZSA9IGNvbG9yW2kgJSBjb2xvci5sZW5ndGhdO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29udGV4dC5maWxsUmVjdCh4LCB5LCBzaXplLCBzaXplKTtcbiAgICAgICAgICAgIGNvbnRleHQuc3Ryb2tlUmVjdCh4LCB5LCBzaXplLCBzaXplKTtcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIGRyYXdGb29kKFt4LCB5XSkge1xuICAgICAgICBjb25zdCBwYWRkaW5nID0gdGhpcy5mb29kUGFkZGluZztcbiAgICAgICAgY29uc3QgY29udGV4dCA9IHRoaXMuY3R4O1xuICAgICAgICBpZiAoIWNvbnRleHQpXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIGlmICghdGhpcy5mb29kSW1nKSB7XG4gICAgICAgICAgICBjb25zdCByYWRpdXMgPSB0aGlzLmZvb2RTaXplIC8gMjtcbiAgICAgICAgICAgIGNvbnRleHQuYmVnaW5QYXRoKCk7XG4gICAgICAgICAgICBjb250ZXh0LmVsbGlwc2UoeCArIHJhZGl1cywgeSArIHJhZGl1cywgcmFkaXVzIC0gcGFkZGluZyAqIDIsIHJhZGl1cyAtIHBhZGRpbmcgKiAyLCAwLCAwLCAyICogTWF0aC5QSSk7XG4gICAgICAgICAgICBjb250ZXh0LmZpbGwoKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGNvbnN0IGZvb2RTaXplID0gdGhpcy5mb29kU2l6ZSAtIHBhZGRpbmc7XG4gICAgICAgICAgICBjb250ZXh0LmltYWdlU21vb3RoaW5nRW5hYmxlZCA9IHRydWU7XG4gICAgICAgICAgICBjb250ZXh0LmltYWdlU21vb3RoaW5nUXVhbGl0eSA9ICdoaWdoJztcbiAgICAgICAgICAgIGNvbnRleHQuZHJhd0ltYWdlKHRoaXMuZm9vZEltZywgeCArIHBhZGRpbmcgLyAyLCB5ICsgcGFkZGluZyAvIDIsIGZvb2RTaXplLCBmb29kU2l6ZSk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgZHJhd0dhbWVPdmVyKHNjb3JlLCBjYikge1xuICAgICAgICBjb25zdCBjb250ZXh0ID0gdGhpcy5jdHg7XG4gICAgICAgIGlmICghY29udGV4dClcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgdGhpcy5jbGVhckNhbnZhcygpO1xuICAgICAgICBjb25zdCB2ZXJ0aWNhbENlbnRlciA9IHRoaXMuY2FudmFzSGVpZ2h0IC8gMjtcbiAgICAgICAgY29udGV4dC5maWxsU3R5bGUgPSB0aGlzLmdhbWVPdmVyQ29sb3I7XG4gICAgICAgIHRoaXMuZHJhd1RleHQoJ0dBTUUgT1ZFUicsIHZlcnRpY2FsQ2VudGVyIC0gMTAsIHRoaXMuZ2FtZU92ZXJDb2xvciwgJzQwcHggY291cmllcicpO1xuICAgICAgICB0aGlzLmRyYXdUZXh0KGBTY29yZTogJHtzY29yZX1gLCB2ZXJ0aWNhbENlbnRlciArIDIwLCB0aGlzLnN1YnRpdGxlQ29sb3IsICcxNHB4IGNvdXJpZXInKTtcbiAgICAgICAgdGhpcy5kcmF3VGV4dCgnUHJlc3MgU1BBQ0Ugb3IgVGFwIHRvIEJlZ2luJywgdmVydGljYWxDZW50ZXIgKyA2MCwgdGhpcy50aXRsZUNvbG9yLCAnMTRweCBjb3VyaWVyJyk7XG4gICAgICAgIGNiKCk7XG4gICAgICAgIHRoaXMuc3RvcFRpbWVyKCk7XG4gICAgfVxuICAgIGNsZWFyUHJldlBvc2l0aW9uKHgsIHkpIHtcbiAgICAgICAgaWYgKCF0aGlzLmN0eClcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgdGhpcy5jdHguY2xlYXJSZWN0KHgsIHksIHRoaXMuc25ha2VTaXplLCB0aGlzLnNuYWtlU2l6ZSk7XG4gICAgfVxuICAgIGNsZWFyRm9vZChjb29yZGluYXRlcykge1xuICAgICAgICBjb25zdCBjb250ZXh0ID0gdGhpcy5jdHg7XG4gICAgICAgIGlmICghY29udGV4dClcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgY29uc3Qgc2l6ZSA9IHRoaXMuc25ha2VTaXplO1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMuY2FudmFzV2lkdGg7IGkgKz0gc2l6ZSkge1xuICAgICAgICAgICAgZm9yIChsZXQgaiA9IDA7IGogPCB0aGlzLmNhbnZhc0hlaWdodDsgaiArPSBzaXplKSB7XG4gICAgICAgICAgICAgICAgaWYgKGNvb3JkaW5hdGVzLnNvbWUoKFt4LCB5XSkgPT4geCA9PT0gaSAmJiB5ID09PSBqKSkge1xuICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgY29udGV4dC5jbGVhclJlY3QoaSwgaiwgc2l6ZSwgc2l6ZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgZWF0Rm9vZChjb29yZGluYXRlcykge1xuICAgICAgICB0aGlzLmNsZWFyRm9vZChjb29yZGluYXRlcyk7XG4gICAgICAgIGNvbnN0IGdldE5ld0Zvb2RQb3NpdGlvbiA9ICgpID0+IHtcbiAgICAgICAgICAgIHJldHVybiBpbml0Rm9vZFBvc2l0aW9uKHtcbiAgICAgICAgICAgICAgICBmb29kU2l6ZTogdGhpcy5mb29kU2l6ZSxcbiAgICAgICAgICAgICAgICBzbmFrZVNpemU6IHRoaXMuc25ha2VTaXplLFxuICAgICAgICAgICAgICAgIGNhbnZhc1dpZHRoOiB0aGlzLmNhbnZhc0hlaWdodCxcbiAgICAgICAgICAgICAgICBjYW52YXNIZWlnaHQ6IHRoaXMuY2FudmFzSGVpZ2h0LFxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH07XG4gICAgICAgIGxldCBbbmV3WCwgbmV3WV0gPSBnZXROZXdGb29kUG9zaXRpb24oKTtcbiAgICAgICAgY29uc3QgY2hlY2tQb3NpdGlvbiA9ICgpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGNvbHVtbnMgPSBNYXRoLmZsb29yKHRoaXMuZm9vZFNpemUgLyB0aGlzLnNuYWtlU2l6ZSk7XG4gICAgICAgICAgICBjb25zdCBuZXdDb29yZGluYXRlcyA9IFtdO1xuICAgICAgICAgICAgZm9yIChsZXQgeCA9IDA7IHggPCBjb2x1bW5zOyB4KyspIHtcbiAgICAgICAgICAgICAgICBmb3IgKGxldCB5ID0gMDsgeSA8IGNvbHVtbnM7IHkrKykge1xuICAgICAgICAgICAgICAgICAgICBpZiAoeCA9PT0gMCAmJiB5ID09PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBuZXdDb29yZGluYXRlcy5wdXNoKFtuZXdYLCBuZXdZXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBuZXdDb29yZGluYXRlcy5wdXNoKFtcbiAgICAgICAgICAgICAgICAgICAgICAgIG5ld1ggKyB4ICogKHRoaXMuZm9vZFNpemUgLyBjb2x1bW5zKSxcbiAgICAgICAgICAgICAgICAgICAgICAgIG5ld1kgKyB5ICogKHRoaXMuZm9vZFNpemUgLyBjb2x1bW5zKSxcbiAgICAgICAgICAgICAgICAgICAgXSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKCFuZXdDb29yZGluYXRlcy5ldmVyeSgoW3gsIHldKSA9PiAhY29vcmRpbmF0ZXMuc29tZSgoW2EsIGJdKSA9PiB4ID09PSBhICYmIHkgPT09IGIpKSkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9O1xuICAgICAgICB3aGlsZSAoY2hlY2tQb3NpdGlvbigpKSB7XG4gICAgICAgICAgICBbbmV3WCwgbmV3WV0gPSBnZXROZXdGb29kUG9zaXRpb24oKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmRyYXdGb29kKFtuZXdYLCBuZXdZXSk7XG4gICAgICAgIHJldHVybiBbbmV3WCwgbmV3WV07XG4gICAgfVxuICAgIGFzeW5jIGluaXRHYW1lKHNuYWtlQ29vcmRpbmF0ZXMpIHtcbiAgICAgICAgaWYgKHRoaXMuZm9vZEltZ1NyYykge1xuICAgICAgICAgICAgY29uc3QgYmxvYiA9IGF3YWl0IGZldGNoKHRoaXMuZm9vZEltZ1NyYykudGhlbigocmVzKSA9PiByZXMuYmxvYigpKTtcbiAgICAgICAgICAgIHRoaXMuZm9vZEltZyA9IGF3YWl0IGNyZWF0ZUltYWdlQml0bWFwKGJsb2IpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuZHJhd1RpdGxlUGFnZShzbmFrZUNvb3JkaW5hdGVzKTtcbiAgICB9XG4gICAgYXN5bmMgaW5pdEZvb2QoZm9vZFBvc2l0aW9uKSB7XG4gICAgICAgIC8vIElmIG5ldyBnYW1lLCBnZXQgcG9zaXRpb24gZnJvbSBzdGF0ZTsgb3RoZXJ3aXNlLCBjcmVhdGUgbmV3IHBvc2l0aW9uXG4gICAgICAgIGNvbnN0IFt4LCB5XSA9IGZvb2RQb3NpdGlvbjtcbiAgICAgICAgdGhpcy5kcmF3Rm9vZChbeCwgeV0pO1xuICAgIH1cbiAgICBzdGFydFRpbWVyKCkge1xuICAgICAgICBjb25zdCBjYiA9ICgpID0+IHtcbiAgICAgICAgICAgIGlmICh0aGlzLnRpbWVvdXRJZClcbiAgICAgICAgICAgICAgICBjbGVhclRpbWVvdXQodGhpcy50aW1lb3V0SWQpO1xuICAgICAgICAgICAgdGhpcy50aW1lb3V0SWQgPSBzZXRUaW1lb3V0KGFzeW5jICgpID0+IHtcbiAgICAgICAgICAgICAgICByZXF1ZXN0QW5pbWF0aW9uRnJhbWUoY2IpO1xuICAgICAgICAgICAgICAgIGF3YWl0IHRoaXMuYWR2YW5jZVNuYWtlKCk7XG4gICAgICAgICAgICB9LCAxMDApO1xuICAgICAgICB9O1xuICAgICAgICB0aGlzLnRpbWVySWQgPSByZXF1ZXN0QW5pbWF0aW9uRnJhbWUoY2IpO1xuICAgIH1cbiAgICBzdG9wVGltZXIoKSB7XG4gICAgICAgIGlmICh0aGlzLnRpbWVySWQpIHtcbiAgICAgICAgICAgIGNhbmNlbEFuaW1hdGlvbkZyYW1lKHRoaXMudGltZXJJZCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRoaXMudGltZW91dElkKSB7XG4gICAgICAgICAgICBjbGVhclRpbWVvdXQodGhpcy50aW1lb3V0SWQpO1xuICAgICAgICB9XG4gICAgfVxufTtcbkNvbWxpbmsuZXhwb3NlKFNuYWtlV29ya2VyKTtcbiJdLCJzb3VyY2VSb290IjoiIn0=