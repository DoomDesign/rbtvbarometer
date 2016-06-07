var stats = require('measured').createCollection();




var channels = ['rocketbeanstv'];


var counts = {
	
	'kreygasm' : {
		'iLastTime' : 0,
		'iTime' : 0,
		'iTotal' : 0,
		'iKeys' : 0,
		'regex' : new RegExp("Kreygasm", "gi")
	},
	'love' : {
		'iLastTime' : 0,
		'iTime' : 0,
		'iTotal' : 0,
		'iKeys' : 0,
		'regex' : new RegExp("<3", "gi")
	},
	'kappa' : {
		'iLastTime' : 0,
		'iTime' : 0,
		'iTotal' : 0,
		'iKeys' : 0,
		'regex' : new RegExp("Kappa", "gi")
	},
	'rage' : {
		'iLastTime' : 0,
		'iTime' : 0,
		'iTotal' : 0,
		'iKeys' : 0,
		'regex' : new RegExp("SwiftRage|DansGame", "gi")
	},
	'facepalm' : {
		'iLastTime' : 0,
		'iTime' : 0,
		'iTotal' : 0,
		'iKeys' : 0,
		'regex' : new RegExp("rbtvFacepalm|FailFish", "gi")
	},
	
	
}
for(var key in counts) {
		if (!counts.hasOwnProperty(key)) continue;
		var el = document.createElement('div');
		el.setAttribute('id', key );
		document.body.appendChild( el );
}



var clientOptions = {
			options: {
					debug: true
				},
			channels: channels
		},
	client = new irc.client(clientOptions);



//	function formatEmotes(text, emotes) {
//		var splitText = text.split('');
//		for(var i in emotes) {
//			var e = emotes[i];
//			for(var j in e) {
//				var mote = e[j];
//				if(typeof mote == 'string') {
//					mote = mote.split('-');
//					mote = [parseInt(mote[0]), parseInt(mote[1])];
//					var length =  mote[1] - mote[0],
//						empty = Array.apply(null, new Array(length + 1)).map(function() { return '' });
//					splitText = splitText.slice(0, mote[0]).concat(empty).concat(splitText.slice(mote[1] + 1, splitText.length));
//					splitText.splice(mote[0], 1, '<img class="emoticon" src="http://static-cdn.jtvnw.net/emoticons/v1/' + i + '/3.0">');
//				}
//			}
//		}
//		return htmlEntities(splitText).join('')
//	}

function countEmotes(text) {

	
	for(var key in counts) {
		if (!counts.hasOwnProperty(key)) continue;	
		
		counts[key].iKeys += (text.match(counts[key].regex)||[]).length;
	}

	
	return counts;

}

function badges(chan, user, isBot) {
	
	function createBadge(name) {
		var badge = document.createElement('div');
		badge.className = 'chat-badge-' + name;
		return badge;
	}
	
	var chatBadges = document.createElement('span');
	chatBadges.className = 'chat-badges';
	
	if(!isBot) {
		if(user.username == chan) {
			chatBadges.appendChild(createBadge('broadcaster'));
		}
		if(user['user-type']) {
			chatBadges.appendChild(createBadge(user['user-type']));
		}
		if(user.turbo) {
			chatBadges.appendChild(createBadge('turbo'));
		}
	}
	else {
		chatChages.appendChild(createBadge('bot'));
	}
	
	return chatBadges;
}

var lastTapSeconds = 0;
var bpm = 0;

function bpmCounter(key) { 
console.log(key);

	var tapSeconds = new Date().getTime();

	bpm = ((1 / ((tapSeconds - lastTapSeconds) / 1000)) * 60);
	lastTapSeconds = tapSeconds;    			
	document.getElementById(key).innerHTML = Math.floor(bpm);  
}

function handleChat(channel, user, message, self) {
	
	
	
	
	var gogogo = countEmotes(message);
	
	for(var key in gogogo) {
		if (!counts.hasOwnProperty(key)) continue;	
		

		
		counts[key].iTime = new Date().getTime();
    
		if (counts[key].iLastTime != 0) {
			//counts[key].iKeys += counts[key].iKeys;
			//iKeys++;
		
			counts[key].iTotal += counts[key].iTime - counts[key].iLastTime;
			document.getElementById(key).innerHTML = Math.floor( (counts[key].iKeys / counts[key].iTotal * 60000 ) * 10 );
		}
		
		counts[key].iLastTime = counts[key].iTime;
		
	};

	
	//			iTime = new Date().getTime();
    //			
	//			if (iLastTime != 0) {
	//				iKeys+=emoteCount;
	//				//iKeys++;
    //			
	//				iTotal += iTime - iLastTime;
	//				counter.innerHTML = Math.round( ( ( ( (iKeys / iTotal * 60000 ) * 10 ) / 10 ) / 300 ) * 100 );
	//			}
    //			
	//			iLastTime = iTime;
	
	
	


	
	
}


client.addListener('message', handleChat);

client.connect();

