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