/***************************************************/
/************* CUSTOM SCRIPT START *****************/
/***************************************************/
/*************** RocketBeansTV <3 ******************/
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
				
				document.getElementById('cutoffrect').setAttribute('height', 100 -  heightsubtract + '%');
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

