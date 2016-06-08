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
/* ES6-Promise Polyfill für den Internet Explorer */
var Promise = require('es6-promise').Promise;
/* Measured JS Library, eine Collection für Messdaten initialisieren */
var Measured = require('measured').createCollection();

/***************************************************/
/************* CUSTOM SCRIPT START *****************/
/***************************************************/
/*************** RocketBeansTV <3 ******************/
/***************************************************/

/*
Hauptmethode des Scripts,
wird nach dem erfolgreichen Verbinden mit dem Twitch-Chat aufgerufen
(siehe unterste Zeilen dieser Datei)
*/
function initBarometer() {
	
	/* Lade-Animation entfernen, weil jetzt die Show losgeht */
	var elem = document.getElementById("loading");
	elem.parentNode.removeChild(elem);
	
	/* Wichtige Hauptelemente definieren */
	var container = document.getElementById('container');
	var emoticoncontainer = document.getElementById('emoticoncontainer');

	/* Dieses Objekt beinhaltet alle verschiedenen Emotes */
	
	var counts = {
		
		'kreygasm' : { 
			title : 'Kreygasm', // was im Graphen und in der Legende als Text angezeigt wird
			counter : 0, // der anfängliche Zählwert
			regex : new RegExp("Kreygasm", "i"), // ein regulärer Ausdruck mit dem Parameter "i" (ignoriert Groß- und Kleinschreibung)
			color: '#EC407A', // Hex-Wert für Farbe, diese Farbe bekommt die Linie im Graph
			pic: 'https://static-cdn.jtvnw.net/emoticons/v1/41/1.0' // Bild, das im Thermometer stellvertretend angezeigt wird
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

	/* brauchen wir fürs Messen und den Graphen */
	var chartdata = {};
	var seriesData = [];

	/* mit allen Emote-Einträgen von weiter oben machen wir folgendes... */ 
	for(var key in counts) {
		
			/* falls der Eintrag nicht wirklich existiert, spring zum nächsten */
			if (!counts.hasOwnProperty(key)) continue;
			
			/* Element für das Emote erstellen */
			var el = document.createElement('div');
			el.setAttribute('id', key );
			el.classList.add('emoticonpic');
			
			
			/* Unterelement mit dem eigentlichen Bild erstellen */
			var emoticonpic = document.createElement('div');
			emoticonpic.setAttribute('id', key + '_pic');
			
			emoticonpic.style.backgroundImage = 'url(' + counts[key].pic + ')';
			el.appendChild( emoticonpic );
			
			/* Emote-Element in den entsprechenden Container einfügen */
			emoticoncontainer.appendChild( el );
			
			/* Der Titel dient als eindeutiger Schlüssel */
			var initindex = counts[key].title;
			
			/* Erstellt in den Messdaten einen neuen Eintrag für diesen Schlüssel */
			Measured.meter(initindex);
			
			/*
			Erstellt in dem Array für den Schlüssel einen neuen Eintrag mit dem Wert 0.
			Dieses Array wird dann später immer wieder erneuert und vom Graphen als neue Daten hinzugefügt
			*/
			chartdata[initindex] = 0;
			
			/*
			seriesData stellt die anfänglichen Graphen-Linien dar,
			mit denen der Graph initialisiert wird (weiter unten).
			Noch ohne Messdaten, aber mit einem Namen und einer Farbe.
			*/
			seriesData.push( {name: counts[key].title, color: counts[key].color } );

			
	};

	/* Elemente für den Graphen und die Legende erstellen, verschachteln, einfügen ... */
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

	/* eine Datenserie für den Graphen wird initialisiert, mit den Startdaten von eben */
	var seriesObject = new Rickshaw.Series.FixedDuration( seriesData, undefined, {
			timeInterval: tv,
			maxDataPoints: 100, // je höher desto mehr Daten werden gesammelt = desto mehr vergangene Minuten zeigt der Graph an 
			timeBase: new Date().getTime() / 1000
		});
		
		


	/* Style-Eigenschaften des Graphen holen, brauchen wir für jetzt und später */
	graphStyle = window.getComputedStyle(chartElement);

	/* Jetzt wird der eigentliche Graph initialisiert */
	var graph = new Rickshaw.Graph( {
		element: chartElement,
		width: parseFloat(graphStyle.width),
		height: 300,
		renderer: 'area',
		stroke: true,
		preserve: true,
		series: seriesObject // Datenserie von etwas weiter oben verwenden
	} );

	graph.renderer.unstack = true;


	/* weitere Optionen und Gimmicks für den Graph */
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

	/* Graph anzeigen */
	graph.render();

	
	/* Wenn sich die Fenstergröße ändert, soll sich auch die Graphenbreite mitändern! */
	function resizeChart() {
		graph.configure({
			width: parseFloat(graphStyle.width)
	  });
	  graph.render();
	}

	window.onresize = function(){ resizeChart(); }


	/* Funktion mit einem Intervall, wird regelmäßig wiederholt */
	setInterval(function() {
		
		/* wir holen uns von der Mess-Library die aktuellen Werte in einem gescheiten Format */
		var whatsup = JSON.parse( JSON.stringify(Measured.toJSON()));
		
		/* jetzt gehen wir wieder alle Emotes durch */
		for(var key in counts) {
			
			
			var currentindex = counts[key].title;
			
			/* nur wenn die geholten Messdaten für diesen Schlüssel etwas enthalten */
			if( whatsup[currentindex] ) {

				/* im Folgenden wird definiert, was bei jeden neuen Daten mit dem Emote-Bild-Element passieren soll */
				
				var scaleAdd = 0; // scaleAdd ist der Wert, der zur Skalierung hinzugerechnet wird. Erstmal 0.
				var scaleLimit = 30; // wie groß darf scaleAdd maximal werden
				var rate = whatsup[currentindex]['1MinuteRate']; // der Wert für die "Häufigkeit in der letzten Minute"
				
				/* die 50 in den folgenden Zeilen sind ein ermittelter, optisch nett aussehender Wert */
				if( rate*50 <= scaleLimit) { // wenn der multiplizierte Wert unter dem Limit liegt...
					scaleAdd = rate*50;		 // ... ist scaleAdd ebenjener multiplizierter Wert
				} else {
					scaleAdd = scaleLimit;   // ansonsten bekommt scaleAdd den Wert von scaleLimit, und geht nie höher
				}
				
				/* das Emote-Bild-Element für diesen Schlüssel transformieren mit dem scaleAdd-Wert */
				document.getElementById(key + '_pic').style.transform = 'translateZ(0) scale(' + ( 1 + scaleAdd ) + ')';

				/* dem Emote-Bild-Element einen neuen Z-Index geben, um die stärksten Emotes auch in den Vordergrund zu rücken */
				document.getElementById(key + '_pic').style.zIndex = 100 + Math.floor( scaleAdd ) ;

				/*
				die Häufigkeit der letzten Minute mit 100 multiplizieren,
				um einen "korrekten" Wert für den Graphen zu erhalten.
				Dieser Wert wird dann dem chartdata-Array hinzugefügt und wird weiter unten eingelesen
				*/
				chartdata[currentindex] = ( whatsup[currentindex]['1MinuteRate'] * 100);

				
			}

			/*
			mit dem Love-Messdaten beeinflussen wir im Folgenden
			das "Lovemeter" gesondert, unabhängig vom Thermometer
			*/
			if( key === 'love' && whatsup[currentindex] ) {
				
				var rate = whatsup[currentindex]['1MinuteRate'];

				var heightsubtract = 0; // Prozent, die vom "schwarzen" Herz in der Höhe abgezogen werden
				
				if( 100 - (rate*300) >= 0) {       // solange der Prozentwert nicht unter 0 rutscht...
					heightsubtract = (rate*300);   // ... diesen Wert setzen ...
				} else {
					heightsubtract = 100;		   // ... ansonsten volle 100 Prozent setzen
				}
				
				
				var speedsubtract = 0; // Abzug für die Geschwindigkeit der Herzklopf-Animation
				
				if( 5 - (rate*30) >= 1 ) {		// solange 5 Sekunden minus ein "optisch schön" multiplizierter Wert >= 1 Sekunde ...
					speedsubtract = (rate*30);  // ... diesen Wert setzen ...
				} else {
					speedsubtract = 4;			// ... ansonsten maximal 4 abziehen, damit man nie unter 1 Sekunde kommt
				}
				
				/*
				das Lovemeter beinhaltet ein schwarzes und ein violettes Herz.
				Das schwarze verdeckt das violette.
				Mit einem speziellen Masken-Element können wir das schwarze Herz beschneiden.
				Die nächste Zeile verändert also die Höhe dieses Masken-Elements
				*/
				document.getElementById('cutoffrect').setAttribute('height', 100 -  heightsubtract + '%');
				
				/* das Herz-Element bekommt die neue Animations-Geschwindigkeit */
				document.getElementById('heart').style.animationDuration = 5 -  speedsubtract + 's';
			
			}
		}
		
		/* der Graph bekommt nun die neuen Messwerte */
		graph.series.addData(chartdata);
		graph.render();
		
		
	}, 5000); // alle 5 Sekunden diese ganze Funktion ausführen
	
	
	
	/* Funktion, welche jede Chat-Nachricht verarbeitet */
	function handleChat(channel, user, message, self) {

		/* jede Chatnachricht wird nach den festgelegten Emotes durchsucht */
		for(var key in counts) {
			if (!counts.hasOwnProperty(key)) continue;	
			
			/* den Text der Nachricht mit dem regulären Ausdruck des Emotes durchwühlen und die Anzahl an Treffern speichern */
			var counter = (message.match(counts[key].regex)||[]).length;
			
			/* Falls ein Emote gefunden wurde, Meldung an die Mess-Bibliothek senden */
			if ( counter > 0 ) {
				Measured.meter(counts[key].title).mark( counter );
			}

		}


		
	};

	/* dem Twitch-Klienten diese Funktion zuteilen */
	client.addListener('message', handleChat);

};

/* welche/r Channel soll/en durchsucht werden? */
var channels = ['rocketbeanstv'];

/* Twitch Client-Optionen definieren */
var clientOptions = {
		options: {
				debug: false
			},
		channels: channels,
		connection: {
			reconnect: true
		},
	},
client = new irc.client(clientOptions); // Twitch Client initialisieren


/* weitere Funktionen für den Klienten */
client.addListener('crash', function () {
	alert("Chat crashed :( Reload the page!");
});

/* wenn der Klient dem bzw. einem Channel fertig gejoint ist, wird die initBarometer() Hauptfunktion aufgerufen */
client.addListener('join', function (channel, username) {
	if(username == client.getUsername()) {
		initBarometer();
	}
});

/* Los geht's ! */
client.connect();
},{"es6-promise":4,"measured":6}],4:[function(require,module,exports){
(function (process,global){
/*!
 * @overview es6-promise - a tiny implementation of Promises/A+.
 * @copyright Copyright (c) 2014 Yehuda Katz, Tom Dale, Stefan Penner and contributors (Conversion to ES6 API by Jake Archibald)
 * @license   Licensed under MIT license
 *            See https://raw.githubusercontent.com/jakearchibald/es6-promise/master/LICENSE
 * @version   3.2.1
 */

(function() {
    "use strict";
    function lib$es6$promise$utils$$objectOrFunction(x) {
      return typeof x === 'function' || (typeof x === 'object' && x !== null);
    }

    function lib$es6$promise$utils$$isFunction(x) {
      return typeof x === 'function';
    }

    function lib$es6$promise$utils$$isMaybeThenable(x) {
      return typeof x === 'object' && x !== null;
    }

    var lib$es6$promise$utils$$_isArray;
    if (!Array.isArray) {
      lib$es6$promise$utils$$_isArray = function (x) {
        return Object.prototype.toString.call(x) === '[object Array]';
      };
    } else {
      lib$es6$promise$utils$$_isArray = Array.isArray;
    }

    var lib$es6$promise$utils$$isArray = lib$es6$promise$utils$$_isArray;
    var lib$es6$promise$asap$$len = 0;
    var lib$es6$promise$asap$$vertxNext;
    var lib$es6$promise$asap$$customSchedulerFn;

    var lib$es6$promise$asap$$asap = function asap(callback, arg) {
      lib$es6$promise$asap$$queue[lib$es6$promise$asap$$len] = callback;
      lib$es6$promise$asap$$queue[lib$es6$promise$asap$$len + 1] = arg;
      lib$es6$promise$asap$$len += 2;
      if (lib$es6$promise$asap$$len === 2) {
        // If len is 2, that means that we need to schedule an async flush.
        // If additional callbacks are queued before the queue is flushed, they
        // will be processed by this flush that we are scheduling.
        if (lib$es6$promise$asap$$customSchedulerFn) {
          lib$es6$promise$asap$$customSchedulerFn(lib$es6$promise$asap$$flush);
        } else {
          lib$es6$promise$asap$$scheduleFlush();
        }
      }
    }

    function lib$es6$promise$asap$$setScheduler(scheduleFn) {
      lib$es6$promise$asap$$customSchedulerFn = scheduleFn;
    }

    function lib$es6$promise$asap$$setAsap(asapFn) {
      lib$es6$promise$asap$$asap = asapFn;
    }

    var lib$es6$promise$asap$$browserWindow = (typeof window !== 'undefined') ? window : undefined;
    var lib$es6$promise$asap$$browserGlobal = lib$es6$promise$asap$$browserWindow || {};
    var lib$es6$promise$asap$$BrowserMutationObserver = lib$es6$promise$asap$$browserGlobal.MutationObserver || lib$es6$promise$asap$$browserGlobal.WebKitMutationObserver;
    var lib$es6$promise$asap$$isNode = typeof self === 'undefined' && typeof process !== 'undefined' && {}.toString.call(process) === '[object process]';

    // test for web worker but not in IE10
    var lib$es6$promise$asap$$isWorker = typeof Uint8ClampedArray !== 'undefined' &&
      typeof importScripts !== 'undefined' &&
      typeof MessageChannel !== 'undefined';

    // node
    function lib$es6$promise$asap$$useNextTick() {
      // node version 0.10.x displays a deprecation warning when nextTick is used recursively
      // see https://github.com/cujojs/when/issues/410 for details
      return function() {
        process.nextTick(lib$es6$promise$asap$$flush);
      };
    }

    // vertx
    function lib$es6$promise$asap$$useVertxTimer() {
      return function() {
        lib$es6$promise$asap$$vertxNext(lib$es6$promise$asap$$flush);
      };
    }

    function lib$es6$promise$asap$$useMutationObserver() {
      var iterations = 0;
      var observer = new lib$es6$promise$asap$$BrowserMutationObserver(lib$es6$promise$asap$$flush);
      var node = document.createTextNode('');
      observer.observe(node, { characterData: true });

      return function() {
        node.data = (iterations = ++iterations % 2);
      };
    }

    // web worker
    function lib$es6$promise$asap$$useMessageChannel() {
      var channel = new MessageChannel();
      channel.port1.onmessage = lib$es6$promise$asap$$flush;
      return function () {
        channel.port2.postMessage(0);
      };
    }

    function lib$es6$promise$asap$$useSetTimeout() {
      return function() {
        setTimeout(lib$es6$promise$asap$$flush, 1);
      };
    }

    var lib$es6$promise$asap$$queue = new Array(1000);
    function lib$es6$promise$asap$$flush() {
      for (var i = 0; i < lib$es6$promise$asap$$len; i+=2) {
        var callback = lib$es6$promise$asap$$queue[i];
        var arg = lib$es6$promise$asap$$queue[i+1];

        callback(arg);

        lib$es6$promise$asap$$queue[i] = undefined;
        lib$es6$promise$asap$$queue[i+1] = undefined;
      }

      lib$es6$promise$asap$$len = 0;
    }

    function lib$es6$promise$asap$$attemptVertx() {
      try {
        var r = require;
        var vertx = r('vertx');
        lib$es6$promise$asap$$vertxNext = vertx.runOnLoop || vertx.runOnContext;
        return lib$es6$promise$asap$$useVertxTimer();
      } catch(e) {
        return lib$es6$promise$asap$$useSetTimeout();
      }
    }

    var lib$es6$promise$asap$$scheduleFlush;
    // Decide what async method to use to triggering processing of queued callbacks:
    if (lib$es6$promise$asap$$isNode) {
      lib$es6$promise$asap$$scheduleFlush = lib$es6$promise$asap$$useNextTick();
    } else if (lib$es6$promise$asap$$BrowserMutationObserver) {
      lib$es6$promise$asap$$scheduleFlush = lib$es6$promise$asap$$useMutationObserver();
    } else if (lib$es6$promise$asap$$isWorker) {
      lib$es6$promise$asap$$scheduleFlush = lib$es6$promise$asap$$useMessageChannel();
    } else if (lib$es6$promise$asap$$browserWindow === undefined && typeof require === 'function') {
      lib$es6$promise$asap$$scheduleFlush = lib$es6$promise$asap$$attemptVertx();
    } else {
      lib$es6$promise$asap$$scheduleFlush = lib$es6$promise$asap$$useSetTimeout();
    }
    function lib$es6$promise$then$$then(onFulfillment, onRejection) {
      var parent = this;

      var child = new this.constructor(lib$es6$promise$$internal$$noop);

      if (child[lib$es6$promise$$internal$$PROMISE_ID] === undefined) {
        lib$es6$promise$$internal$$makePromise(child);
      }

      var state = parent._state;

      if (state) {
        var callback = arguments[state - 1];
        lib$es6$promise$asap$$asap(function(){
          lib$es6$promise$$internal$$invokeCallback(state, child, callback, parent._result);
        });
      } else {
        lib$es6$promise$$internal$$subscribe(parent, child, onFulfillment, onRejection);
      }

      return child;
    }
    var lib$es6$promise$then$$default = lib$es6$promise$then$$then;
    function lib$es6$promise$promise$resolve$$resolve(object) {
      /*jshint validthis:true */
      var Constructor = this;

      if (object && typeof object === 'object' && object.constructor === Constructor) {
        return object;
      }

      var promise = new Constructor(lib$es6$promise$$internal$$noop);
      lib$es6$promise$$internal$$resolve(promise, object);
      return promise;
    }
    var lib$es6$promise$promise$resolve$$default = lib$es6$promise$promise$resolve$$resolve;
    var lib$es6$promise$$internal$$PROMISE_ID = Math.random().toString(36).substring(16);

    function lib$es6$promise$$internal$$noop() {}

    var lib$es6$promise$$internal$$PENDING   = void 0;
    var lib$es6$promise$$internal$$FULFILLED = 1;
    var lib$es6$promise$$internal$$REJECTED  = 2;

    var lib$es6$promise$$internal$$GET_THEN_ERROR = new lib$es6$promise$$internal$$ErrorObject();

    function lib$es6$promise$$internal$$selfFulfillment() {
      return new TypeError("You cannot resolve a promise with itself");
    }

    function lib$es6$promise$$internal$$cannotReturnOwn() {
      return new TypeError('A promises callback cannot return that same promise.');
    }

    function lib$es6$promise$$internal$$getThen(promise) {
      try {
        return promise.then;
      } catch(error) {
        lib$es6$promise$$internal$$GET_THEN_ERROR.error = error;
        return lib$es6$promise$$internal$$GET_THEN_ERROR;
      }
    }

    function lib$es6$promise$$internal$$tryThen(then, value, fulfillmentHandler, rejectionHandler) {
      try {
        then.call(value, fulfillmentHandler, rejectionHandler);
      } catch(e) {
        return e;
      }
    }

    function lib$es6$promise$$internal$$handleForeignThenable(promise, thenable, then) {
       lib$es6$promise$asap$$asap(function(promise) {
        var sealed = false;
        var error = lib$es6$promise$$internal$$tryThen(then, thenable, function(value) {
          if (sealed) { return; }
          sealed = true;
          if (thenable !== value) {
            lib$es6$promise$$internal$$resolve(promise, value);
          } else {
            lib$es6$promise$$internal$$fulfill(promise, value);
          }
        }, function(reason) {
          if (sealed) { return; }
          sealed = true;

          lib$es6$promise$$internal$$reject(promise, reason);
        }, 'Settle: ' + (promise._label || ' unknown promise'));

        if (!sealed && error) {
          sealed = true;
          lib$es6$promise$$internal$$reject(promise, error);
        }
      }, promise);
    }

    function lib$es6$promise$$internal$$handleOwnThenable(promise, thenable) {
      if (thenable._state === lib$es6$promise$$internal$$FULFILLED) {
        lib$es6$promise$$internal$$fulfill(promise, thenable._result);
      } else if (thenable._state === lib$es6$promise$$internal$$REJECTED) {
        lib$es6$promise$$internal$$reject(promise, thenable._result);
      } else {
        lib$es6$promise$$internal$$subscribe(thenable, undefined, function(value) {
          lib$es6$promise$$internal$$resolve(promise, value);
        }, function(reason) {
          lib$es6$promise$$internal$$reject(promise, reason);
        });
      }
    }

    function lib$es6$promise$$internal$$handleMaybeThenable(promise, maybeThenable, then) {
      if (maybeThenable.constructor === promise.constructor &&
          then === lib$es6$promise$then$$default &&
          constructor.resolve === lib$es6$promise$promise$resolve$$default) {
        lib$es6$promise$$internal$$handleOwnThenable(promise, maybeThenable);
      } else {
        if (then === lib$es6$promise$$internal$$GET_THEN_ERROR) {
          lib$es6$promise$$internal$$reject(promise, lib$es6$promise$$internal$$GET_THEN_ERROR.error);
        } else if (then === undefined) {
          lib$es6$promise$$internal$$fulfill(promise, maybeThenable);
        } else if (lib$es6$promise$utils$$isFunction(then)) {
          lib$es6$promise$$internal$$handleForeignThenable(promise, maybeThenable, then);
        } else {
          lib$es6$promise$$internal$$fulfill(promise, maybeThenable);
        }
      }
    }

    function lib$es6$promise$$internal$$resolve(promise, value) {
      if (promise === value) {
        lib$es6$promise$$internal$$reject(promise, lib$es6$promise$$internal$$selfFulfillment());
      } else if (lib$es6$promise$utils$$objectOrFunction(value)) {
        lib$es6$promise$$internal$$handleMaybeThenable(promise, value, lib$es6$promise$$internal$$getThen(value));
      } else {
        lib$es6$promise$$internal$$fulfill(promise, value);
      }
    }

    function lib$es6$promise$$internal$$publishRejection(promise) {
      if (promise._onerror) {
        promise._onerror(promise._result);
      }

      lib$es6$promise$$internal$$publish(promise);
    }

    function lib$es6$promise$$internal$$fulfill(promise, value) {
      if (promise._state !== lib$es6$promise$$internal$$PENDING) { return; }

      promise._result = value;
      promise._state = lib$es6$promise$$internal$$FULFILLED;

      if (promise._subscribers.length !== 0) {
        lib$es6$promise$asap$$asap(lib$es6$promise$$internal$$publish, promise);
      }
    }

    function lib$es6$promise$$internal$$reject(promise, reason) {
      if (promise._state !== lib$es6$promise$$internal$$PENDING) { return; }
      promise._state = lib$es6$promise$$internal$$REJECTED;
      promise._result = reason;

      lib$es6$promise$asap$$asap(lib$es6$promise$$internal$$publishRejection, promise);
    }

    function lib$es6$promise$$internal$$subscribe(parent, child, onFulfillment, onRejection) {
      var subscribers = parent._subscribers;
      var length = subscribers.length;

      parent._onerror = null;

      subscribers[length] = child;
      subscribers[length + lib$es6$promise$$internal$$FULFILLED] = onFulfillment;
      subscribers[length + lib$es6$promise$$internal$$REJECTED]  = onRejection;

      if (length === 0 && parent._state) {
        lib$es6$promise$asap$$asap(lib$es6$promise$$internal$$publish, parent);
      }
    }

    function lib$es6$promise$$internal$$publish(promise) {
      var subscribers = promise._subscribers;
      var settled = promise._state;

      if (subscribers.length === 0) { return; }

      var child, callback, detail = promise._result;

      for (var i = 0; i < subscribers.length; i += 3) {
        child = subscribers[i];
        callback = subscribers[i + settled];

        if (child) {
          lib$es6$promise$$internal$$invokeCallback(settled, child, callback, detail);
        } else {
          callback(detail);
        }
      }

      promise._subscribers.length = 0;
    }

    function lib$es6$promise$$internal$$ErrorObject() {
      this.error = null;
    }

    var lib$es6$promise$$internal$$TRY_CATCH_ERROR = new lib$es6$promise$$internal$$ErrorObject();

    function lib$es6$promise$$internal$$tryCatch(callback, detail) {
      try {
        return callback(detail);
      } catch(e) {
        lib$es6$promise$$internal$$TRY_CATCH_ERROR.error = e;
        return lib$es6$promise$$internal$$TRY_CATCH_ERROR;
      }
    }

    function lib$es6$promise$$internal$$invokeCallback(settled, promise, callback, detail) {
      var hasCallback = lib$es6$promise$utils$$isFunction(callback),
          value, error, succeeded, failed;

      if (hasCallback) {
        value = lib$es6$promise$$internal$$tryCatch(callback, detail);

        if (value === lib$es6$promise$$internal$$TRY_CATCH_ERROR) {
          failed = true;
          error = value.error;
          value = null;
        } else {
          succeeded = true;
        }

        if (promise === value) {
          lib$es6$promise$$internal$$reject(promise, lib$es6$promise$$internal$$cannotReturnOwn());
          return;
        }

      } else {
        value = detail;
        succeeded = true;
      }

      if (promise._state !== lib$es6$promise$$internal$$PENDING) {
        // noop
      } else if (hasCallback && succeeded) {
        lib$es6$promise$$internal$$resolve(promise, value);
      } else if (failed) {
        lib$es6$promise$$internal$$reject(promise, error);
      } else if (settled === lib$es6$promise$$internal$$FULFILLED) {
        lib$es6$promise$$internal$$fulfill(promise, value);
      } else if (settled === lib$es6$promise$$internal$$REJECTED) {
        lib$es6$promise$$internal$$reject(promise, value);
      }
    }

    function lib$es6$promise$$internal$$initializePromise(promise, resolver) {
      try {
        resolver(function resolvePromise(value){
          lib$es6$promise$$internal$$resolve(promise, value);
        }, function rejectPromise(reason) {
          lib$es6$promise$$internal$$reject(promise, reason);
        });
      } catch(e) {
        lib$es6$promise$$internal$$reject(promise, e);
      }
    }

    var lib$es6$promise$$internal$$id = 0;
    function lib$es6$promise$$internal$$nextId() {
      return lib$es6$promise$$internal$$id++;
    }

    function lib$es6$promise$$internal$$makePromise(promise) {
      promise[lib$es6$promise$$internal$$PROMISE_ID] = lib$es6$promise$$internal$$id++;
      promise._state = undefined;
      promise._result = undefined;
      promise._subscribers = [];
    }

    function lib$es6$promise$promise$all$$all(entries) {
      return new lib$es6$promise$enumerator$$default(this, entries).promise;
    }
    var lib$es6$promise$promise$all$$default = lib$es6$promise$promise$all$$all;
    function lib$es6$promise$promise$race$$race(entries) {
      /*jshint validthis:true */
      var Constructor = this;

      if (!lib$es6$promise$utils$$isArray(entries)) {
        return new Constructor(function(resolve, reject) {
          reject(new TypeError('You must pass an array to race.'));
        });
      } else {
        return new Constructor(function(resolve, reject) {
          var length = entries.length;
          for (var i = 0; i < length; i++) {
            Constructor.resolve(entries[i]).then(resolve, reject);
          }
        });
      }
    }
    var lib$es6$promise$promise$race$$default = lib$es6$promise$promise$race$$race;
    function lib$es6$promise$promise$reject$$reject(reason) {
      /*jshint validthis:true */
      var Constructor = this;
      var promise = new Constructor(lib$es6$promise$$internal$$noop);
      lib$es6$promise$$internal$$reject(promise, reason);
      return promise;
    }
    var lib$es6$promise$promise$reject$$default = lib$es6$promise$promise$reject$$reject;


    function lib$es6$promise$promise$$needsResolver() {
      throw new TypeError('You must pass a resolver function as the first argument to the promise constructor');
    }

    function lib$es6$promise$promise$$needsNew() {
      throw new TypeError("Failed to construct 'Promise': Please use the 'new' operator, this object constructor cannot be called as a function.");
    }

    var lib$es6$promise$promise$$default = lib$es6$promise$promise$$Promise;
    /**
      Promise objects represent the eventual result of an asynchronous operation. The
      primary way of interacting with a promise is through its `then` method, which
      registers callbacks to receive either a promise's eventual value or the reason
      why the promise cannot be fulfilled.

      Terminology
      -----------

      - `promise` is an object or function with a `then` method whose behavior conforms to this specification.
      - `thenable` is an object or function that defines a `then` method.
      - `value` is any legal JavaScript value (including undefined, a thenable, or a promise).
      - `exception` is a value that is thrown using the throw statement.
      - `reason` is a value that indicates why a promise was rejected.
      - `settled` the final resting state of a promise, fulfilled or rejected.

      A promise can be in one of three states: pending, fulfilled, or rejected.

      Promises that are fulfilled have a fulfillment value and are in the fulfilled
      state.  Promises that are rejected have a rejection reason and are in the
      rejected state.  A fulfillment value is never a thenable.

      Promises can also be said to *resolve* a value.  If this value is also a
      promise, then the original promise's settled state will match the value's
      settled state.  So a promise that *resolves* a promise that rejects will
      itself reject, and a promise that *resolves* a promise that fulfills will
      itself fulfill.


      Basic Usage:
      ------------

      ```js
      var promise = new Promise(function(resolve, reject) {
        // on success
        resolve(value);

        // on failure
        reject(reason);
      });

      promise.then(function(value) {
        // on fulfillment
      }, function(reason) {
        // on rejection
      });
      ```

      Advanced Usage:
      ---------------

      Promises shine when abstracting away asynchronous interactions such as
      `XMLHttpRequest`s.

      ```js
      function getJSON(url) {
        return new Promise(function(resolve, reject){
          var xhr = new XMLHttpRequest();

          xhr.open('GET', url);
          xhr.onreadystatechange = handler;
          xhr.responseType = 'json';
          xhr.setRequestHeader('Accept', 'application/json');
          xhr.send();

          function handler() {
            if (this.readyState === this.DONE) {
              if (this.status === 200) {
                resolve(this.response);
              } else {
                reject(new Error('getJSON: `' + url + '` failed with status: [' + this.status + ']'));
              }
            }
          };
        });
      }

      getJSON('/posts.json').then(function(json) {
        // on fulfillment
      }, function(reason) {
        // on rejection
      });
      ```

      Unlike callbacks, promises are great composable primitives.

      ```js
      Promise.all([
        getJSON('/posts'),
        getJSON('/comments')
      ]).then(function(values){
        values[0] // => postsJSON
        values[1] // => commentsJSON

        return values;
      });
      ```

      @class Promise
      @param {function} resolver
      Useful for tooling.
      @constructor
    */
    function lib$es6$promise$promise$$Promise(resolver) {
      this[lib$es6$promise$$internal$$PROMISE_ID] = lib$es6$promise$$internal$$nextId();
      this._result = this._state = undefined;
      this._subscribers = [];

      if (lib$es6$promise$$internal$$noop !== resolver) {
        typeof resolver !== 'function' && lib$es6$promise$promise$$needsResolver();
        this instanceof lib$es6$promise$promise$$Promise ? lib$es6$promise$$internal$$initializePromise(this, resolver) : lib$es6$promise$promise$$needsNew();
      }
    }

    lib$es6$promise$promise$$Promise.all = lib$es6$promise$promise$all$$default;
    lib$es6$promise$promise$$Promise.race = lib$es6$promise$promise$race$$default;
    lib$es6$promise$promise$$Promise.resolve = lib$es6$promise$promise$resolve$$default;
    lib$es6$promise$promise$$Promise.reject = lib$es6$promise$promise$reject$$default;
    lib$es6$promise$promise$$Promise._setScheduler = lib$es6$promise$asap$$setScheduler;
    lib$es6$promise$promise$$Promise._setAsap = lib$es6$promise$asap$$setAsap;
    lib$es6$promise$promise$$Promise._asap = lib$es6$promise$asap$$asap;

    lib$es6$promise$promise$$Promise.prototype = {
      constructor: lib$es6$promise$promise$$Promise,

    /**
      The primary way of interacting with a promise is through its `then` method,
      which registers callbacks to receive either a promise's eventual value or the
      reason why the promise cannot be fulfilled.

      ```js
      findUser().then(function(user){
        // user is available
      }, function(reason){
        // user is unavailable, and you are given the reason why
      });
      ```

      Chaining
      --------

      The return value of `then` is itself a promise.  This second, 'downstream'
      promise is resolved with the return value of the first promise's fulfillment
      or rejection handler, or rejected if the handler throws an exception.

      ```js
      findUser().then(function (user) {
        return user.name;
      }, function (reason) {
        return 'default name';
      }).then(function (userName) {
        // If `findUser` fulfilled, `userName` will be the user's name, otherwise it
        // will be `'default name'`
      });

      findUser().then(function (user) {
        throw new Error('Found user, but still unhappy');
      }, function (reason) {
        throw new Error('`findUser` rejected and we're unhappy');
      }).then(function (value) {
        // never reached
      }, function (reason) {
        // if `findUser` fulfilled, `reason` will be 'Found user, but still unhappy'.
        // If `findUser` rejected, `reason` will be '`findUser` rejected and we're unhappy'.
      });
      ```
      If the downstream promise does not specify a rejection handler, rejection reasons will be propagated further downstream.

      ```js
      findUser().then(function (user) {
        throw new PedagogicalException('Upstream error');
      }).then(function (value) {
        // never reached
      }).then(function (value) {
        // never reached
      }, function (reason) {
        // The `PedgagocialException` is propagated all the way down to here
      });
      ```

      Assimilation
      ------------

      Sometimes the value you want to propagate to a downstream promise can only be
      retrieved asynchronously. This can be achieved by returning a promise in the
      fulfillment or rejection handler. The downstream promise will then be pending
      until the returned promise is settled. This is called *assimilation*.

      ```js
      findUser().then(function (user) {
        return findCommentsByAuthor(user);
      }).then(function (comments) {
        // The user's comments are now available
      });
      ```

      If the assimliated promise rejects, then the downstream promise will also reject.

      ```js
      findUser().then(function (user) {
        return findCommentsByAuthor(user);
      }).then(function (comments) {
        // If `findCommentsByAuthor` fulfills, we'll have the value here
      }, function (reason) {
        // If `findCommentsByAuthor` rejects, we'll have the reason here
      });
      ```

      Simple Example
      --------------

      Synchronous Example

      ```javascript
      var result;

      try {
        result = findResult();
        // success
      } catch(reason) {
        // failure
      }
      ```

      Errback Example

      ```js
      findResult(function(result, err){
        if (err) {
          // failure
        } else {
          // success
        }
      });
      ```

      Promise Example;

      ```javascript
      findResult().then(function(result){
        // success
      }, function(reason){
        // failure
      });
      ```

      Advanced Example
      --------------

      Synchronous Example

      ```javascript
      var author, books;

      try {
        author = findAuthor();
        books  = findBooksByAuthor(author);
        // success
      } catch(reason) {
        // failure
      }
      ```

      Errback Example

      ```js

      function foundBooks(books) {

      }

      function failure(reason) {

      }

      findAuthor(function(author, err){
        if (err) {
          failure(err);
          // failure
        } else {
          try {
            findBoooksByAuthor(author, function(books, err) {
              if (err) {
                failure(err);
              } else {
                try {
                  foundBooks(books);
                } catch(reason) {
                  failure(reason);
                }
              }
            });
          } catch(error) {
            failure(err);
          }
          // success
        }
      });
      ```

      Promise Example;

      ```javascript
      findAuthor().
        then(findBooksByAuthor).
        then(function(books){
          // found books
      }).catch(function(reason){
        // something went wrong
      });
      ```

      @method then
      @param {Function} onFulfilled
      @param {Function} onRejected
      Useful for tooling.
      @return {Promise}
    */
      then: lib$es6$promise$then$$default,

    /**
      `catch` is simply sugar for `then(undefined, onRejection)` which makes it the same
      as the catch block of a try/catch statement.

      ```js
      function findAuthor(){
        throw new Error('couldn't find that author');
      }

      // synchronous
      try {
        findAuthor();
      } catch(reason) {
        // something went wrong
      }

      // async with promises
      findAuthor().catch(function(reason){
        // something went wrong
      });
      ```

      @method catch
      @param {Function} onRejection
      Useful for tooling.
      @return {Promise}
    */
      'catch': function(onRejection) {
        return this.then(null, onRejection);
      }
    };
    var lib$es6$promise$enumerator$$default = lib$es6$promise$enumerator$$Enumerator;
    function lib$es6$promise$enumerator$$Enumerator(Constructor, input) {
      this._instanceConstructor = Constructor;
      this.promise = new Constructor(lib$es6$promise$$internal$$noop);

      if (!this.promise[lib$es6$promise$$internal$$PROMISE_ID]) {
        lib$es6$promise$$internal$$makePromise(this.promise);
      }

      if (lib$es6$promise$utils$$isArray(input)) {
        this._input     = input;
        this.length     = input.length;
        this._remaining = input.length;

        this._result = new Array(this.length);

        if (this.length === 0) {
          lib$es6$promise$$internal$$fulfill(this.promise, this._result);
        } else {
          this.length = this.length || 0;
          this._enumerate();
          if (this._remaining === 0) {
            lib$es6$promise$$internal$$fulfill(this.promise, this._result);
          }
        }
      } else {
        lib$es6$promise$$internal$$reject(this.promise, lib$es6$promise$enumerator$$validationError());
      }
    }

    function lib$es6$promise$enumerator$$validationError() {
      return new Error('Array Methods must be provided an Array');
    }

    lib$es6$promise$enumerator$$Enumerator.prototype._enumerate = function() {
      var length  = this.length;
      var input   = this._input;

      for (var i = 0; this._state === lib$es6$promise$$internal$$PENDING && i < length; i++) {
        this._eachEntry(input[i], i);
      }
    };

    lib$es6$promise$enumerator$$Enumerator.prototype._eachEntry = function(entry, i) {
      var c = this._instanceConstructor;
      var resolve = c.resolve;

      if (resolve === lib$es6$promise$promise$resolve$$default) {
        var then = lib$es6$promise$$internal$$getThen(entry);

        if (then === lib$es6$promise$then$$default &&
            entry._state !== lib$es6$promise$$internal$$PENDING) {
          this._settledAt(entry._state, i, entry._result);
        } else if (typeof then !== 'function') {
          this._remaining--;
          this._result[i] = entry;
        } else if (c === lib$es6$promise$promise$$default) {
          var promise = new c(lib$es6$promise$$internal$$noop);
          lib$es6$promise$$internal$$handleMaybeThenable(promise, entry, then);
          this._willSettleAt(promise, i);
        } else {
          this._willSettleAt(new c(function(resolve) { resolve(entry); }), i);
        }
      } else {
        this._willSettleAt(resolve(entry), i);
      }
    };

    lib$es6$promise$enumerator$$Enumerator.prototype._settledAt = function(state, i, value) {
      var promise = this.promise;

      if (promise._state === lib$es6$promise$$internal$$PENDING) {
        this._remaining--;

        if (state === lib$es6$promise$$internal$$REJECTED) {
          lib$es6$promise$$internal$$reject(promise, value);
        } else {
          this._result[i] = value;
        }
      }

      if (this._remaining === 0) {
        lib$es6$promise$$internal$$fulfill(promise, this._result);
      }
    };

    lib$es6$promise$enumerator$$Enumerator.prototype._willSettleAt = function(promise, i) {
      var enumerator = this;

      lib$es6$promise$$internal$$subscribe(promise, undefined, function(value) {
        enumerator._settledAt(lib$es6$promise$$internal$$FULFILLED, i, value);
      }, function(reason) {
        enumerator._settledAt(lib$es6$promise$$internal$$REJECTED, i, reason);
      });
    };
    function lib$es6$promise$polyfill$$polyfill() {
      var local;

      if (typeof global !== 'undefined') {
          local = global;
      } else if (typeof self !== 'undefined') {
          local = self;
      } else {
          try {
              local = Function('return this')();
          } catch (e) {
              throw new Error('polyfill failed because global object is unavailable in this environment');
          }
      }

      var P = local.Promise;

      if (P && Object.prototype.toString.call(P.resolve()) === '[object Promise]' && !P.cast) {
        return;
      }

      local.Promise = lib$es6$promise$promise$$default;
    }
    var lib$es6$promise$polyfill$$default = lib$es6$promise$polyfill$$polyfill;

    var lib$es6$promise$umd$$ES6Promise = {
      'Promise': lib$es6$promise$promise$$default,
      'polyfill': lib$es6$promise$polyfill$$default
    };

    /* global define:true module:true window: true */
    if (typeof define === 'function' && define['amd']) {
      define(function() { return lib$es6$promise$umd$$ES6Promise; });
    } else if (typeof module !== 'undefined' && module['exports']) {
      module['exports'] = lib$es6$promise$umd$$ES6Promise;
    } else if (typeof this !== 'undefined') {
      this['ES6Promise'] = lib$es6$promise$umd$$ES6Promise;
    }

    lib$es6$promise$polyfill$$default();
}).call(this);


}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"_process":2}],5:[function(require,module,exports){
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

},{}],6:[function(require,module,exports){
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

},{"./lib/Collection":7,"./lib/metrics":13,"./lib/util":18}],7:[function(require,module,exports){
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

},{"./metrics":13}],8:[function(require,module,exports){
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

},{}],9:[function(require,module,exports){
'use strict';

function Gauge(readFn) {
  this._readFn = readFn;
}

// This is sync for now, but maybe async gauges would be useful as well?
Gauge.prototype.toJSON = function () {
  return this._readFn();
};

module.exports = Gauge;

},{}],10:[function(require,module,exports){
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

},{"../util/ExponentiallyDecayingSample":15}],11:[function(require,module,exports){
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
},{"../util/ExponentiallyMovingWeightedAverage":16,"../util/Stopwatch":17,"../util/units":19,"_process":2}],12:[function(require,module,exports){
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

},{"../util/Stopwatch":17,"./Histogram":10,"./Meter":11}],13:[function(require,module,exports){
'use strict';

exports.Counter   = require('./Counter');
exports.Gauge     = require('./Gauge');
exports.Histogram = require('./Histogram');
exports.Meter     = require('./Meter');
exports.Timer     = require('./Timer');

},{"./Counter":8,"./Gauge":9,"./Histogram":10,"./Meter":11,"./Timer":12}],14:[function(require,module,exports){
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

},{}],15:[function(require,module,exports){
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

},{"./BinaryHeap":14,"./units":19}],16:[function(require,module,exports){
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

},{"./units":19}],17:[function(require,module,exports){
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
},{"_process":2,"events":1,"inherits":5}],18:[function(require,module,exports){
'use strict';

exports.units      = require('./units');
exports.BinaryHeap = require('./BinaryHeap');
exports.Stopwatch  = require('./Stopwatch');
exports.ExponentiallyDecayingSample
  = require('./ExponentiallyDecayingSample');
exports.ExponentiallyMovingWeightedAverage
  = require('./ExponentiallyMovingWeightedAverage');

},{"./BinaryHeap":14,"./ExponentiallyDecayingSample":15,"./ExponentiallyMovingWeightedAverage":16,"./Stopwatch":17,"./units":19}],19:[function(require,module,exports){
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
