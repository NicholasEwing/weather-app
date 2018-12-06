// Create event listener
document.querySelector("input").addEventListener("submit", getInfo);

function getInfo(){
	// Create XHR Object
	var request = new XMLHttpRequest();
	var display = document.querySelector(".display")

	// OPEN - type, url/file, async
	// This free API key will totally appear on Github, but that's okay for now
	// Will change later and add to ENV variables on Heroku
	request.open("GET", `http://api.openweathermap.org/data/2.5/forecast?q=Charlotte&id=524901&APPID=b8ba6a5354fa2d7a2da256dba787205d`);

	// OPTIONAL - used for loaders
	request.onprogress = function() {
		// might add loader later
	}

	request.onload = function() {
		// break this monolith into proper functions once it actually works
		if(this.status === 200) {
			var res = JSON.parse(this.responseText);

			buildForecast(res);

			console.log(forecast)

		} else if(this.status === 404) {
			console.log("error occurred!");
		}

		console.log("-------- Forecast: --------");
		console.log(forecast);
		console.log("-------- weekdayFound: --------");
		console.log(weekdayFound);
	}

	request.onerror = function() {
		console.log("Request error!");
	}

	// Sends request
	request.send();

	// Prevents page from refreshing on submit
	return false;
}

function buildForecast(res) {
	var weekdayFound = new Array(7);
	for(var i = 0; i < weekdayFound.length; i++) {
		weekdayFound[i] = false;
	}

	var weekday = new Array(7);
	weekday[0]="Sunday";
	weekday[1]="Monday";
	weekday[2]="Tuesday";
	weekday[3]="Wednesday";
	weekday[4]="Thursday";
	weekday[5]="Friday";
	weekday[6]="Saturday";
	// var today = new Date(Date.now()).getDay(); this might come in handy later
	var forecast = [];

	res.list.forEach(function(element) {
		//find day of the element
		var day = new Date(element.dt*1000).getDay();

		// NEED TO ADD TIME RANGE OTHERWISE ALL WEATHER PULLED WILL BE EXTREMELY EARLY IN THE DAY
		// if that day has NOT been found...
		if(!weekdayFound[day]) {
			// ...add that day's info to the forecast array
			forecast.push(element);
			// then mark that day as "found"
			weekdayFound[day] = true;
		}
	});
}