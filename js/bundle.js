(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

function EventEmitter() {
  this._events = this._events || {};
  this._maxListeners = this._maxListeners || undefined;
}
module.exports = EventEmitter;

// Backwards-compat with node 0.10.x
EventEmitter.EventEmitter = EventEmitter;

EventEmitter.prototype._events = undefined;
EventEmitter.prototype._maxListeners = undefined;

// By default EventEmitters will print a warning if more than 10 listeners are
// added to it. This is a useful default which helps finding memory leaks.
EventEmitter.defaultMaxListeners = 10;

// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
EventEmitter.prototype.setMaxListeners = function(n) {
  if (!isNumber(n) || n < 0 || isNaN(n))
    throw TypeError('n must be a positive number');
  this._maxListeners = n;
  return this;
};

EventEmitter.prototype.emit = function(type) {
  var er, handler, len, args, i, listeners;

  if (!this._events)
    this._events = {};

  // If there is no 'error' event listener then throw.
  if (type === 'error') {
    if (!this._events.error ||
        (isObject(this._events.error) && !this._events.error.length)) {
      er = arguments[1];
      if (er instanceof Error) {
        throw er; // Unhandled 'error' event
      }
      throw TypeError('Uncaught, unspecified "error" event.');
    }
  }

  handler = this._events[type];

  if (isUndefined(handler))
    return false;

  if (isFunction(handler)) {
    switch (arguments.length) {
      // fast cases
      case 1:
        handler.call(this);
        break;
      case 2:
        handler.call(this, arguments[1]);
        break;
      case 3:
        handler.call(this, arguments[1], arguments[2]);
        break;
      // slower
      default:
        args = Array.prototype.slice.call(arguments, 1);
        handler.apply(this, args);
    }
  } else if (isObject(handler)) {
    args = Array.prototype.slice.call(arguments, 1);
    listeners = handler.slice();
    len = listeners.length;
    for (i = 0; i < len; i++)
      listeners[i].apply(this, args);
  }

  return true;
};

EventEmitter.prototype.addListener = function(type, listener) {
  var m;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events)
    this._events = {};

  // To avoid recursion in the case that type === "newListener"! Before
  // adding it to the listeners, first emit "newListener".
  if (this._events.newListener)
    this.emit('newListener', type,
              isFunction(listener.listener) ?
              listener.listener : listener);

  if (!this._events[type])
    // Optimize the case of one listener. Don't need the extra array object.
    this._events[type] = listener;
  else if (isObject(this._events[type]))
    // If we've already got an array, just append.
    this._events[type].push(listener);
  else
    // Adding the second element, need to change to array.
    this._events[type] = [this._events[type], listener];

  // Check for listener leak
  if (isObject(this._events[type]) && !this._events[type].warned) {
    if (!isUndefined(this._maxListeners)) {
      m = this._maxListeners;
    } else {
      m = EventEmitter.defaultMaxListeners;
    }

    if (m && m > 0 && this._events[type].length > m) {
      this._events[type].warned = true;
      console.error('(node) warning: possible EventEmitter memory ' +
                    'leak detected. %d listeners added. ' +
                    'Use emitter.setMaxListeners() to increase limit.',
                    this._events[type].length);
      if (typeof console.trace === 'function') {
        // not supported in IE 10
        console.trace();
      }
    }
  }

  return this;
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.once = function(type, listener) {
  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  var fired = false;

  function g() {
    this.removeListener(type, g);

    if (!fired) {
      fired = true;
      listener.apply(this, arguments);
    }
  }

  g.listener = listener;
  this.on(type, g);

  return this;
};

// emits a 'removeListener' event iff the listener was removed
EventEmitter.prototype.removeListener = function(type, listener) {
  var list, position, length, i;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events || !this._events[type])
    return this;

  list = this._events[type];
  length = list.length;
  position = -1;

  if (list === listener ||
      (isFunction(list.listener) && list.listener === listener)) {
    delete this._events[type];
    if (this._events.removeListener)
      this.emit('removeListener', type, listener);

  } else if (isObject(list)) {
    for (i = length; i-- > 0;) {
      if (list[i] === listener ||
          (list[i].listener && list[i].listener === listener)) {
        position = i;
        break;
      }
    }

    if (position < 0)
      return this;

    if (list.length === 1) {
      list.length = 0;
      delete this._events[type];
    } else {
      list.splice(position, 1);
    }

    if (this._events.removeListener)
      this.emit('removeListener', type, listener);
  }

  return this;
};

EventEmitter.prototype.removeAllListeners = function(type) {
  var key, listeners;

  if (!this._events)
    return this;

  // not listening for removeListener, no need to emit
  if (!this._events.removeListener) {
    if (arguments.length === 0)
      this._events = {};
    else if (this._events[type])
      delete this._events[type];
    return this;
  }

  // emit removeListener for all listeners on all events
  if (arguments.length === 0) {
    for (key in this._events) {
      if (key === 'removeListener') continue;
      this.removeAllListeners(key);
    }
    this.removeAllListeners('removeListener');
    this._events = {};
    return this;
  }

  listeners = this._events[type];

  if (isFunction(listeners)) {
    this.removeListener(type, listeners);
  } else if (listeners) {
    // LIFO order
    while (listeners.length)
      this.removeListener(type, listeners[listeners.length - 1]);
  }
  delete this._events[type];

  return this;
};

EventEmitter.prototype.listeners = function(type) {
  var ret;
  if (!this._events || !this._events[type])
    ret = [];
  else if (isFunction(this._events[type]))
    ret = [this._events[type]];
  else
    ret = this._events[type].slice();
  return ret;
};

EventEmitter.prototype.listenerCount = function(type) {
  if (this._events) {
    var evlistener = this._events[type];

    if (isFunction(evlistener))
      return 1;
    else if (evlistener)
      return evlistener.length;
  }
  return 0;
};

EventEmitter.listenerCount = function(emitter, type) {
  return emitter.listenerCount(type);
};

function isFunction(arg) {
  return typeof arg === 'function';
}

function isNumber(arg) {
  return typeof arg === 'number';
}

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}

function isUndefined(arg) {
  return arg === void 0;
}

},{}],2:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    if (!draining || !currentQueue) {
        return;
    }
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = setTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    clearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        setTimeout(drainQueue, 0);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],3:[function(require,module,exports){
/***************************************************/
/***************************************************/
/*********** WER DAS LIEST, IST DOOF! **************/
/***************************************************/
/***************************************************/
/************** (oder ein Nerd!) :) ****************/
/***************************************************/
/***************************************************/



function initBarometer() {
	var elem = document.getElementById("loading");
	elem.parentNode.removeChild(elem);
	
	var container = document.getElementById('container');
	var emoticoncontainer = document.getElementById('emoticoncontainer');

	var Measured = require('measured').createCollection();

	var meterOptions = {
		
		//rateUnit: 60000,
		//tickInterval: 200
		
	};

	var counts = {
		
		'kreygasm' : {
			title : 'Kreygasm',
			counter : 0,
			regex : new RegExp("Kreygasm", "i"),
			color: '#EC407A',
			pic: 'https://static-cdn.jtvnw.net/emoticons/v1/41/1.0'
		},
		'love' : {
			title : 'Love (<3 / rbtvLove / rbtvSupaa)',
			counter : 0,
			regex : new RegExp("<3|rbtvLove|rbtvSupaa", "i"),
			color: '#673AB7',
			pic: 'https://static-cdn.jtvnw.net/emoticons/v1/9/1.0'
		},
		'fun' : {
			title : 'Fun (:D / XD / ;D / FeelsGoodMan)',
			counter : 0,
			regex : new RegExp(":D|XD|;D|FeelsGoodMan", "i"),
			color: '#76FF03',
			pic: 'https://static-cdn.jtvnw.net/emoticons/v1/3/1.0'
		},
		'kappa' : {
			title : 'Kappa (Kappa / Keepo)',
			counter : 0,
			regex : new RegExp("Kappa|Keepo", "i"),
			color: '#9E9E9E',
			pic: 'https://static-cdn.jtvnw.net/emoticons/v1/25/1.0'
		},
		
		'fail' : {
			title : 'Facepalm (rbtvFacepalm / FailFish / NotLikeThis)',
			counter : 0,
			regex : new RegExp("rbtvFacepalm|FailFish|NotLikeThis", "i"),
			color: '#CDDC39',
			pic: 'https://static-cdn.jtvnw.net/emoticons/v1/360/1.0'
		},
		
		'sad' : {
			title : 'Sad (:( / BibleThump / FeelsBadMan)',
			counter : 0,
			regex : new RegExp(":\\(|BibleThump|FeelsBadMan", "i"),
			color: '#039BE5',
			pic: 'https://static-cdn.jtvnw.net/emoticons/v1/86/1.0'
		},
		'salt' : {
			title : 'Salt (PJSalt)',
			counter : 0,
			regex : new RegExp("PJSalt", "i"),
			color: '#EEEEEE',
			pic: 'https://static-cdn.jtvnw.net/emoticons/v1/36/1.0'
		},
		'rage' : {
			title : 'Rage (SwiftRage / DansGame)',
			counter : 0,
			regex : new RegExp("SwiftRage|DansGame", "i"),
			color: '#B71C1C',
			pic: 'https://static-cdn.jtvnw.net/emoticons/v1/34/1.0'
		},
		
		
	};

	var chartdata = {};
	var seriesData = [];

	for(var key in counts) {
		
		
			if (!counts.hasOwnProperty(key)) continue;
			var el = document.createElement('div');
			el.setAttribute('id', key );
			el.classList.add('emoticonpic');
			
			var initindex = counts[key].title;
			
			
	//		var elmeter = document.createElement('meter');
	//		elmeter.setAttribute('id', key + '_meter');
	//		elmeter.setAttribute('max', '1.0');
	//		elmeter.setAttribute('min', '0.0');
	//		elmeter.setAttribute('value', '0.0');
	//		elmeter.setAttribute('high', '0.75');
	//		elmeter.setAttribute('low', '0.25');
	//		el.appendChild(elmeter);
			
			var emoticonpic = document.createElement('div');
			emoticonpic.setAttribute('id', key + '_pic');
			
			emoticonpic.style.backgroundImage = 'url(' + counts[key].pic + ')';
			el.appendChild( emoticonpic );
			
			emoticoncontainer.appendChild( el );
			
			Measured.meter(initindex, meterOptions);
			
			chartdata[initindex] = 0;
			
			seriesData.push( {name: counts[key].title, color: counts[key].color } );

			
	};

	chartContainerRow = document.createElement('div');
	chartContainerRow.classList.add('col-xs-12');

	chartContainer = document.createElement('div');
	chartContainer.setAttribute('id','chartContainer');	
	chartContainer.classList.add('row');
	
	
	chartTitleContainer = document.createElement('div');
	chartTitleContainer.classList.add('col-xs-12');

	chartTitle = document.createElement('h2');
	chartTitle.innerHTML = 'Emoticon H\u00e4ufigkeit pro Minute';

	chartTitleContainer.appendChild(chartTitle);
	chartContainer.appendChild(chartTitleContainer);


	chartBox = document.createElement('div');
	chartBox.setAttribute('id','chartbox');
	chartBox.classList.add('col-xs-12');
	chartBox.classList.add('col-sm-12');
	chartBox.classList.add('col-md-8');
	
	chartContainer.appendChild( chartBox );
	
	chartElement = document.createElement('div');
	chartElement.setAttribute('id','chart');
	chartElement.classList.add('well');
	
	chartBox.appendChild( chartElement );

	legendBox = document.createElement('div');
	legendBox.setAttribute('id','legendbox');
	legendBox.classList.add('col-xs-12');
	legendBox.classList.add('col-sm-12');
	legendBox.classList.add('col-md-4');
	
	chartContainer.appendChild( legendBox );
	
	legendElement = document.createElement('div');
	legendElement.setAttribute('id','legend');
	legendElement.classList.add('well');

	legendBox.appendChild( legendElement );

	chartContainerRow.appendChild( chartContainer );
	container.appendChild( chartContainerRow );


	var tv = 5000;



	var seriesObject = new Rickshaw.Series.FixedDuration( seriesData, undefined, {
			timeInterval: tv,
			maxDataPoints: 100,
			timeBase: new Date().getTime() / 1000
		});
		
		




	// instantiate our graph!

	graphStyle = window.getComputedStyle(chartElement);

	var graph = new Rickshaw.Graph( {
		element: chartElement,
		width: parseFloat(graphStyle.width),
		height: 300,
		renderer: 'area',
		stroke: true,
		preserve: true,
		//unstack: true,
		series: seriesObject
	} );





	graph.renderer.unstack = true;



	var ticksTreatment = 'inverse';

	var xAxis = new Rickshaw.Graph.Axis.Time( {
		graph: graph,
		ticksTreatment: ticksTreatment,
		timeFixture: new Rickshaw.Fixtures.Time.Local()
	} );

	var yAxis = new Rickshaw.Graph.Axis.Y( {
		graph: graph,
		tickFormat: Rickshaw.Fixtures.Number.formatKMBT,
		ticksTreatment: ticksTreatment,
		pixelsPerTick: 50
	} );


	var hoverDetail = new Rickshaw.Graph.HoverDetail( {
		graph: graph,
		xFormatter: function(x) {
			return new Date(x * 1000).toLocaleString();
		}
	} );

	var legend = new Rickshaw.Graph.Legend({
		graph: graph,
		element: legendElement
	});

	var highlighter = new Rickshaw.Graph.Behavior.Series.Highlight({
		graph: graph,
		legend: legend,
		disabledColor: function() { return 'rgba(100, 100, 100, 0.5)' }
	});


	graph.render();

	function resizeChart() {
		graph.configure({
			width: parseFloat(graphStyle.width)
	  });
	  graph.render();
	}

	window.onresize = function(){ resizeChart(); }






	setInterval(function() {
		var whatsup = JSON.parse( JSON.stringify(Measured.toJSON()));
		
		for(var key in counts) {
			
			
			var currentindex = counts[key].title;
			
			
			if( whatsup[currentindex] ) {
				
				


	//			document.getElementById(key + '_meter').setAttribute('value', whatsup[key]['1MinuteRate']);
				
				var scaleAdd = 0;
				var scaleLimit = 30;
				if( whatsup[currentindex]['1MinuteRate']*50 <= scaleLimit) {
					scaleAdd = whatsup[currentindex]['1MinuteRate']*50;
				} else {
					scaleAdd = scaleLimit;
					
				}
				
				document.getElementById(key + '_pic').style.transform = 'translateZ(0) scale(' + ( 1 + scaleAdd ) + ')';

				document.getElementById(key + '_pic').style.zIndex = 100 + Math.floor( scaleAdd ) ;

				chartdata[currentindex] = ( whatsup[currentindex]['1MinuteRate'] * 100);

				
			}

			
			if( key === 'love' && whatsup[currentindex] ) {
				
				var rate = whatsup[currentindex]['1MinuteRate'];
				
				
				var heightsubtract = 0;
				if( 100 - (rate*300) >= 0) {
					heightsubtract = (rate*300);
				} else {
					heightsubtract = 100;
				}
				
				var speedsubtract = 0;
				
				if( 5 - (rate*30) >= 1 ) {
					speedsubtract = (rate*30);
				} else {
					speedsubtract = 4;
				}
				
				document.getElementById('cutoffrect').style.height = 100 -  heightsubtract + '%';
				document.getElementById('heart').style.animationDuration = 5 -  speedsubtract + 's';
			
			}
		}
		
		graph.series.addData(chartdata);
		graph.render();
		
		
	}, 5000);
	
	
	function handleChat(channel, user, message, self) {


		
		for(var key in counts) {
			if (!counts.hasOwnProperty(key)) continue;	
			
			var counter = (message.match(counts[key].regex)||[]).length;
			
			if ( counter > 0 ) {
				Measured.meter(counts[key].title).mark( counter );
			}

		}


		
	};


	client.addListener('message', handleChat);

};


var channels = ['rocketbeanstv'];

var clientOptions = {
		options: {
				debug: false
			},
		channels: channels,
		connection: {
			reconnect: true
		},
	},
client = new irc.client(clientOptions);


client.addListener('crash', function () {
	alert("Chat crashed :( Reload the page!");
});

client.addListener('join', function (channel, username) {
	if(username == client.getUsername()) {
		initBarometer();
	}
});


client.connect();


},{"measured":5}],4:[function(require,module,exports){
if (typeof Object.create === 'function') {
  // implementation from standard node.js 'util' module
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    ctor.prototype = Object.create(superCtor.prototype, {
      constructor: {
        value: ctor,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
  };
} else {
  // old school shim for old browsers
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    var TempCtor = function () {}
    TempCtor.prototype = superCtor.prototype
    ctor.prototype = new TempCtor()
    ctor.prototype.constructor = ctor
  }
}

},{}],5:[function(require,module,exports){
'use strict';

var Collection = require('./lib/Collection');
var metrics = require('./lib/metrics');
var util = require('./lib/util');

var name;
for (name in metrics) {
  if (metrics.hasOwnProperty(name)) {
    exports[name] = metrics[name];
  }
}

for (name in util) {
  if (util.hasOwnProperty(name)) {
    exports[name] = util[name];
  }
}

exports.createCollection = function (name) {
  return new Collection(name);
};

exports.Collection = Collection;

},{"./lib/Collection":6,"./lib/metrics":12,"./lib/util":17}],6:[function(require,module,exports){
'use strict';

var metrics = require('./metrics');

function Collection(name) {
  this.name     = name;
  this._metrics = {};
}

Collection.prototype.register = function (name, metric) {
  this._metrics[name] = metric;
};

Collection.prototype.toJSON = function () {
  var json = {};

  var metric;
  for (metric in this._metrics) {
    if (this._metrics.hasOwnProperty(metric)) {
      json[metric] = this._metrics[metric].toJSON();
    }
  }

  if (!this.name) {
    return json;
  }

  var wrapper = {};
  wrapper[this.name] = json;

  return wrapper;
};

Collection.prototype.end = function end() {
  var metrics = this._metrics;
  Object.keys(metrics).forEach(function (name) {
    var metric = metrics[name];
    if (metric.end) {
      metric.end();
    }
  });
};

Object
  .keys(metrics)
  .forEach(function (name) {
    var MetricConstructor = metrics[name];
    var method = name.substr(0, 1).toLowerCase() + name.substr(1);

    Collection.prototype[method] = function (name, properties) {
      if (!name) {
        throw new Error('Collection.NoMetricName');
      }

      if (this._metrics[name]) {
        return this._metrics[name];
      }

      var metric = new MetricConstructor(properties);
      this.register(name, metric);
      return metric;
    };
  });

module.exports = Collection;

},{"./metrics":12}],7:[function(require,module,exports){
'use strict';

function Counter(properties) {
  properties = properties || {};

  this._count = properties.count || 0;
}

Counter.prototype.toJSON = function () {
  return this._count;
};

Counter.prototype.inc = function (n) {
  this._count += (arguments.length ? n : 1);
};

Counter.prototype.dec = function (n) {
  this._count -= (arguments.length ? n : 1);
};

Counter.prototype.reset = function (count) {
  this._count = count || 0;
};

module.exports = Counter;

},{}],8:[function(require,module,exports){
'use strict';

function Gauge(readFn) {
  this._readFn = readFn;
}

// This is sync for now, but maybe async gauges would be useful as well?
Gauge.prototype.toJSON = function () {
  return this._readFn();
};

module.exports = Gauge;

},{}],9:[function(require,module,exports){
'use strict';

var EDS = require('../util/ExponentiallyDecayingSample');

function Histogram(properties) {
  properties = properties || {};

  this._sample    = properties.sample || new EDS();
  this._min       = null;
  this._max       = null;
  this._count     = 0;
  this._sum       = 0;

  // These are for the Welford algorithm for calculating running variance
  // without floating-point doom.
  this._varianceM = 0;
  this._varianceS = 0;
}

Histogram.prototype.update = function (value) {
  this._count++;
  this._sum += value;

  this._sample.update(value);
  this._updateMin(value);
  this._updateMax(value);
  this._updateVariance(value);
};

Histogram.prototype.percentiles = function (percentiles) {
  var values = this._sample
    .toArray()
    .sort(function (a, b) {
      return (a === b)
        ? 0
        : a - b;
    });

  var results = {};

  var i, percentile, pos, lower, upper;
  for (i = 0; i < percentiles.length; i++) {
    percentile = percentiles[i];
    if (values.length) {
      pos = percentile * (values.length + 1);
      if (pos < 1) {
        results[percentile] = values[0];
      } else if (pos >= values.length) {
        results[percentile] = values[values.length - 1];
      } else {
        lower = values[Math.floor(pos) - 1];
        upper = values[Math.ceil(pos) - 1];
        results[percentile] =
          lower + (pos - Math.floor(pos)) * (upper - lower);
      }
    } else {
      results[percentile] = null;
    }
  }

  return results;
};

Histogram.prototype.reset = function () {
  this.constructor();
};

Histogram.prototype.hasValues = function () {
  return this._count > 0;
};

Histogram.prototype.toJSON = function () {
  var percentiles = this.percentiles([0.5, 0.75, 0.95, 0.99, 0.999]);

  return {
    min      : this._min,
    max      : this._max,
    sum      : this._sum,
    variance : this._calculateVariance(),
    mean     : this._calculateMean(),
    stddev   : this._calculateStddev(),
    count    : this._count,
    median   : percentiles[0.5],
    p75      : percentiles[0.75],
    p95      : percentiles[0.95],
    p99      : percentiles[0.99],
    p999     : percentiles[0.999]
  };
};

Histogram.prototype._updateMin = function (value) {
  if (this._min === null || value < this._min) {
    this._min = value;
  }
};

Histogram.prototype._updateMax = function (value) {
  if (this._max === null || value > this._max) {
    this._max = value;
  }
};

Histogram.prototype._updateVariance = function (value) {
  if (this._count === 1) {
    this._varianceM = value;
    return value;
  }

  var oldM = this._varianceM;

  this._varianceM += ((value - oldM) / this._count);
  this._varianceS += ((value - oldM) * (value - this._varianceM));
};

Histogram.prototype._calculateMean = function () {
  return (this._count === 0)
    ? 0
    : this._sum / this._count;
};

Histogram.prototype._calculateVariance = function () {
  return (this._count <= 1)
    ? null
    : this._varianceS / (this._count - 1);
};

Histogram.prototype._calculateStddev = function () {
  return (this._count < 1)
    ? null
    : Math.sqrt(this._calculateVariance());
};

module.exports = Histogram;

},{"../util/ExponentiallyDecayingSample":14}],10:[function(require,module,exports){
(function (process){
'use strict';

var units     = require('../util/units');
var EWMA      = require('../util/ExponentiallyMovingWeightedAverage');
var Stopwatch = require('../util/Stopwatch');

function Meter(properties) {
  properties = properties || {};

  this._rateUnit     = properties.rateUnit || Meter.RATE_UNIT;
  this._tickInterval = properties.tickInterval || Meter.TICK_INTERVAL;
  if (properties.getTime) {
    this._getTime = properties.getTime;
  }

  this._m1Rate     = new EWMA(units.MINUTES, this._tickInterval);
  this._m5Rate     = new EWMA(5 * units.MINUTES, this._tickInterval);
  this._m15Rate    = new EWMA(15 * units.MINUTES, this._tickInterval);
  this._count      = 0;
  this._currentSum = 0;
  this._startTime = this._getTime();
  this._lastToJSON = this._getTime();
  this._interval = setInterval(this._tick.bind(this), Meter.TICK_INTERVAL);
}

Meter.RATE_UNIT     = units.SECONDS;
Meter.TICK_INTERVAL = 5 * units.SECONDS;

Meter.prototype.mark = function (n) {
  if (!this._interval) {
    this.start();
  }

  n = n || 1;

  this._count += n;
  this._currentSum += n;
  this._m1Rate.update(n);
  this._m5Rate.update(n);
  this._m15Rate.update(n);
};

Meter.prototype.start = function () {
  return;
};

Meter.prototype.end = function () {
  clearInterval(this._interval);
  this._interval = null;
};

Meter.prototype.ref = function () {
  if (this._interval && this._interval.ref) {
    this._interval.ref();
  }
};

Meter.prototype.unref = function () {
  if (this._interval && this._interval.unref) {
    this._interval.unref();
  }
};

Meter.prototype._tick = function () {
  this._m1Rate.tick();
  this._m5Rate.tick();
  this._m15Rate.tick();
};

Meter.prototype.reset = function () {
  this.end();
  this.constructor();
};

Meter.prototype.meanRate = function () {
  if (this._count === 0) {
    return 0;
  }

  var elapsed = this._getTime() - this._startTime;
  return this._count / elapsed * this._rateUnit;
};

Meter.prototype.currentRate = function () {
  var currentSum  = this._currentSum;
  var duration    = this._getTime() - this._lastToJSON;
  var currentRate = currentSum / duration * this._rateUnit;

  this._currentSum = 0;
  this._lastToJSON = this._getTime();

  // currentRate could be NaN if duration was 0, so fix that
  return currentRate || 0;
};

Meter.prototype.toJSON = function () {
  return {
    'mean'         : this.meanRate(),
    'count'        : this._count,
    'currentRate'  : this.currentRate(),
    '1MinuteRate'  : this._m1Rate.rate(this._rateUnit),
    '5MinuteRate'  : this._m5Rate.rate(this._rateUnit),
    '15MinuteRate' : this._m15Rate.rate(this._rateUnit)
  };
};

Meter.prototype._getTime = function () {
  if (!process.hrtime) {
    return new Date().getTime();
  }

  var hrtime = process.hrtime();
  return hrtime[0] * 1000 + hrtime[1] / (1000 * 1000);
};

module.exports = Meter;

}).call(this,require('_process'))
},{"../util/ExponentiallyMovingWeightedAverage":15,"../util/Stopwatch":16,"../util/units":18,"_process":2}],11:[function(require,module,exports){
'use strict';

var Histogram = require('./Histogram');
var Meter     = require('./Meter');
var Stopwatch = require('../util/Stopwatch');

function Timer(properties) {
  properties = properties || {};

  this._meter     = properties.meter || new Meter();
  this._histogram = properties.histogram || new Histogram();
  this._getTime   = properties.getTime;
}

Timer.prototype.start = function () {
  var self  = this;
  var watch = new Stopwatch({getTime: this._getTime});

  watch.once('end', function (elapsed) {
    self.update(elapsed);
  });

  return watch;
};

Timer.prototype.update = function (value) {
  this._meter.mark();
  this._histogram.update(value);
};


Timer.prototype.reset = function () {
  this._meter.reset();
  this._histogram.reset();
};

Timer.prototype.end = function () {
  this._meter.end();
};

Timer.prototype.ref = function () {
  this._meter.ref();
};

Timer.prototype.unref = function () {
  this._meter.unref();
};

Timer.prototype.toJSON = function () {
  return {
    meter : this._meter.toJSON(),
    histogram : this._histogram.toJSON()
  };
};

module.exports = Timer;

},{"../util/Stopwatch":16,"./Histogram":9,"./Meter":10}],12:[function(require,module,exports){
'use strict';

exports.Counter   = require('./Counter');
exports.Gauge     = require('./Gauge');
exports.Histogram = require('./Histogram');
exports.Meter     = require('./Meter');
exports.Timer     = require('./Timer');

},{"./Counter":7,"./Gauge":8,"./Histogram":9,"./Meter":10,"./Timer":11}],13:[function(require,module,exports){
'use strict';

// Based on http://en.wikipedia.org/wiki/Binary_Heap
// as well as http://eloquentjavascript.net/appendix2.html
function BinaryHeap(options) {
  options = options || {};

  this._elements = options.elements || [];
  this._score    = options.score || this._score;
}

BinaryHeap.prototype.add = function () {
  var i, element;
  for (i = 0; i < arguments.length; i++) {
    element = arguments[i];

    this._elements.push(element);
    this._bubble(this._elements.length - 1);
  }
};

BinaryHeap.prototype.first = function () {
  return this._elements[0];
};

BinaryHeap.prototype.removeFirst = function () {
  var root = this._elements[0];
  var last = this._elements.pop();

  if (this._elements.length > 0) {
    this._elements[0] = last;
    this._sink(0);
  }

  return root;
};

BinaryHeap.prototype.clone = function () {
  return new BinaryHeap({
    elements: this.toArray(),
    score: this._score
  });
};

BinaryHeap.prototype.toSortedArray = function () {
  var array = [];
  var clone = this.clone();
  var element;

  while (true) {
    element = clone.removeFirst();
    if (element === undefined) {
      break;
    }

    array.push(element);
  }

  return array;
};

BinaryHeap.prototype.toArray = function () {
  return [].concat(this._elements);
};

BinaryHeap.prototype.size = function () {
  return this._elements.length;
};

BinaryHeap.prototype._bubble = function (bubbleIndex) {
  var bubbleElement = this._elements[bubbleIndex];
  var bubbleScore   = this._score(bubbleElement);
  var parentIndex;
  var parentElement;
  var parentScore;

  while (bubbleIndex > 0) {
    parentIndex   = this._parentIndex(bubbleIndex);
    parentElement = this._elements[parentIndex];
    parentScore   = this._score(parentElement);

    if (bubbleScore <= parentScore) {
      break;
    }

    this._elements[parentIndex] = bubbleElement;
    this._elements[bubbleIndex] = parentElement;
    bubbleIndex                 = parentIndex;
  }
};

BinaryHeap.prototype._sink = function (sinkIndex) {
  var sinkElement = this._elements[sinkIndex];
  var sinkScore   = this._score(sinkElement);
  var length      = this._elements.length;
  var swapIndex;
  var swapScore;
  var swapElement;
  var childIndexes;
  var i;
  var childIndex;
  var childElement;
  var childScore;

  while (true) {
    swapIndex    = null;
    swapScore    = null;
    swapElement  = null;
    childIndexes = this._childIndexes(sinkIndex);

    for (i = 0; i < childIndexes.length; i++) {
      childIndex = childIndexes[i];

      if (childIndex >= length) {
        break;
      }

      childElement = this._elements[childIndex];
      childScore   = this._score(childElement);

      if (childScore > sinkScore) {
        if (swapScore === null || swapScore < childScore) {
          swapIndex   = childIndex;
          swapScore   = childScore;
          swapElement = childElement;
        }
      }
    }

    if (swapIndex === null) {
      break;
    }

    this._elements[swapIndex] = sinkElement;
    this._elements[sinkIndex] = swapElement;
    sinkIndex = swapIndex;
  }
};

BinaryHeap.prototype._parentIndex = function (index) {
  return Math.floor((index - 1) / 2);
};

BinaryHeap.prototype._childIndexes = function (index) {
  return [
    2 * index + 1,
    2 * index + 2
  ];
};

BinaryHeap.prototype._score = function (element) {
  return element.valueOf();
};

module.exports = BinaryHeap;

},{}],14:[function(require,module,exports){
'use strict';

var BinaryHeap = require('./BinaryHeap');
var units      = require('./units');

function ExponentiallyDecayingSample(options) {
  options = options || {};

  this._elements = new BinaryHeap({
    score: function (element) {
      return -element.priority;
    }
  });

  this._rescaleInterval = options.rescaleInterval
    || ExponentiallyDecayingSample.RESCALE_INTERVAL;
  this._alpha           = options.alpha || ExponentiallyDecayingSample.ALPHA;
  this._size            = options.size || ExponentiallyDecayingSample.SIZE;
  this._random          = options.random || this._random;
  this._landmark        = null;
  this._nextRescale     = null;
}

ExponentiallyDecayingSample.RESCALE_INTERVAL = units.HOURS;
ExponentiallyDecayingSample.ALPHA            = 0.015;
ExponentiallyDecayingSample.SIZE             = 1028;

ExponentiallyDecayingSample.prototype.update = function (value, timestamp) {
  var now = Date.now();
  if (!this._landmark) {
    this._landmark    = now;
    this._nextRescale = this._landmark + this._rescaleInterval;
  }

  timestamp = timestamp || now;

  var newSize = this._elements.size() + 1;

  var element = {
    priority: this._priority(timestamp - this._landmark),
    value: value
  };

  if (newSize <= this._size) {
    this._elements.add(element);
  } else if (element.priority > this._elements.first().priority) {
    this._elements.removeFirst();
    this._elements.add(element);
  }

  if (now >= this._nextRescale) {
    this._rescale(now);
  }
};

ExponentiallyDecayingSample.prototype.toSortedArray = function () {
  return this._elements
    .toSortedArray()
    .map(function (element) {
      return element.value;
    });
};


ExponentiallyDecayingSample.prototype.toArray = function () {
  return this._elements
    .toArray()
    .map(function (element) {
      return element.value;
    });
};

ExponentiallyDecayingSample.prototype._weight = function (age) {
  // We divide by 1000 to not run into huge numbers before reaching a
  // rescale event.
  return Math.exp(this._alpha * (age / 1000));
};

ExponentiallyDecayingSample.prototype._priority = function (age) {
  return this._weight(age) / this._random();
};

ExponentiallyDecayingSample.prototype._random = function () {
  return Math.random();
};

ExponentiallyDecayingSample.prototype._rescale = function (now) {
  now               = now || Date.now();

  var self          = this;
  var oldLandmark   = this._landmark;
  this._landmark    = now || Date.now();
  this._nextRescale = now + this._rescaleInterval;

  var factor = self._priority(-(self._landmark - oldLandmark));

  this._elements
    .toArray()
    .forEach(function (element) {
      element.priority *= factor;
    });
};

module.exports = ExponentiallyDecayingSample;

},{"./BinaryHeap":13,"./units":18}],15:[function(require,module,exports){
'use strict';

var units = require('./units');

function ExponentiallyMovingWeightedAverage(timePeriod, tickInterval) {
  this._timePeriod   = timePeriod || units.MINUTE;
  this._tickInterval = tickInterval
    || ExponentiallyMovingWeightedAverage.TICK_INTERVAL;
  this._alpha        = 1 - Math.exp(-this._tickInterval / this._timePeriod);
  this._count        = 0;
  this._rate         = 0;
}
ExponentiallyMovingWeightedAverage.TICK_INTERVAL = 5 * units.SECONDS;

ExponentiallyMovingWeightedAverage.prototype.update = function (n) {
  this._count += n;
};

ExponentiallyMovingWeightedAverage.prototype.tick = function () {
  var instantRate = this._count / this._tickInterval;
  this._count     = 0;

  this._rate += (this._alpha * (instantRate - this._rate));
};

ExponentiallyMovingWeightedAverage.prototype.rate = function (timeUnit) {
  return (this._rate || 0) * timeUnit;
};

module.exports = ExponentiallyMovingWeightedAverage;

},{"./units":18}],16:[function(require,module,exports){
(function (process){
'use strict';

var inherits     = require('inherits');
var EventEmitter = require('events').EventEmitter;

function Stopwatch(options) {
  options = options || {};
  EventEmitter.call(this);

  if (options.getTime) {
    this._getTime = options.getTime;
  }
  this._start = this._getTime();
  this._ended = false;
}

inherits(Stopwatch, EventEmitter);

Stopwatch.prototype.end = function () {
  if (this._ended) {
    return;
  }

  this._ended = true;
  var elapsed   = this._getTime() - this._start;

  this.emit('end', elapsed);
  return elapsed;
};

Stopwatch.prototype._getTime = function () {
  if (!process.hrtime) {
    return Date.now();
  }

  var hrtime = process.hrtime();
  return hrtime[0] * 1000 + hrtime[1] / (1000 * 1000);
};

module.exports = Stopwatch;

}).call(this,require('_process'))
},{"_process":2,"events":1,"inherits":4}],17:[function(require,module,exports){
'use strict';

exports.units      = require('./units');
exports.BinaryHeap = require('./BinaryHeap');
exports.Stopwatch  = require('./Stopwatch');
exports.ExponentiallyDecayingSample
  = require('./ExponentiallyDecayingSample');
exports.ExponentiallyMovingWeightedAverage
  = require('./ExponentiallyMovingWeightedAverage');

},{"./BinaryHeap":13,"./ExponentiallyDecayingSample":14,"./ExponentiallyMovingWeightedAverage":15,"./Stopwatch":16,"./units":18}],18:[function(require,module,exports){
'use strict';
// Time units, as found in Java:
// http://download.oracle.com/
//   javase/6/docs/api/java/util/concurrent/TimeUnit.html
exports.NANOSECONDS  = 1 / (1000 * 1000);
exports.MICROSECONDS = 1 / 1000;
exports.MILLISECONDS = 1;
exports.SECONDS      = 1000 * exports.MILLISECONDS;
exports.MINUTES      = 60 * exports.SECONDS;
exports.HOURS        = 60 * exports.MINUTES;
exports.DAYS         = 24 * exports.HOURS;

},{}]},{},[3]);
