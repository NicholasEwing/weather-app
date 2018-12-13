// Create event listener
var input = document.querySelector("input").addEventListener("submit", getInfo);


function getInfo(){
	var inputElement = document.querySelector("input");
	var inputVal = inputElement.value.replace(/\s/g, "");
	// Create XHR Object
	var request = new XMLHttpRequest();
	var display = document.querySelector(".display");

	// OPEN - type, url/file, async
	// This free API key will totally appear on Github, but that's okay for now
	// Will change later and add to ENV variables on Heroku
	request.open("GET", `http://api.openweathermap.org/data/2.5/forecast?q=${inputVal}&units=imperial&APPID=b8ba6a5354fa2d7a2da256dba787205d`);

	// OPTIONAL - used for loaders
	request.onprogress = function() {
		// might add loader later
	}

	request.onload = function() {
		if(this.status === 200) {
			// replay jello animation on search
			var h1 = document.querySelector("h1");
			var newh1 = h1.cloneNode(true);
			h1.parentNode.replaceChild(newh1, h1);
			forecastSum.parentNode.replaceChild(newForecastSum, forecastSum);

			var weekday = weekdaysRef();
			var res = JSON.parse(this.responseText);
			var forecast = buildForecast(res);
			console.log(forecast);

			var daysSorted = sortDays(res);
			var recordTemps = getRecordTemps(daysSorted);

			replaceTemps(recordTemps);
			replaceImages(forecast);
			replaceWeekdayText(forecast);
			replaceWeatherText(forecast);

		} else if(this.status === 404) {
			console.log("error occurred!");
		}
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
	var weekday = weekdaysRef()
	var weekdayFound = new Array(7);
	for(var i = 0; i < weekdayFound.length; i++) {
		weekdayFound[i] = false;
	}

	console.log(res);

	var forecast = [];

	res.list.forEach(function(element) {
		//find day of the element
		var day = new Date(element.dt*1000).getDay();
		var hour = new Date(element.dt*1000).getHours();
		var today = new Date(Date.now()).getDay();

		if(!weekdayFound[day]) {
			// find the element at 5PM, unless it's today
			if(element.dt_txt.includes("18:00:00") || weekday[day] === weekday[today]) {
				// ...add that day's info to the forecast array
				forecast.push(element);
				// then mark that day as "found"
				weekdayFound[day] = true;
			}
		}
	});

	return forecast;
}

function replaceWeatherText(forecast) {
	var weatherText = document.querySelectorAll(".weather-text");
	weatherText.forEach(function(text, i) {
		var forecastWeatherText = titleize(forecast[i].weather[0].description);
		text.innerHTML = forecastWeatherText;
	});
}

function replaceWeekdayText(forecast) {
	var weekday = weekdaysRef();
	var weekdayText = document.querySelectorAll(".weekday");
	weekdayText.forEach(function(day, i){
		var forecastWeekday = weekday[new Date(forecast[i].dt*1000).getDay()];
		day.innerHTML = forecastWeekday;
	});
}

function replaceImages(forecast) {
	var icons = document.querySelectorAll("i");
	icons.forEach(function(icon, i){
		var weatherCode = forecast[i].weather[0].id;
		icon.className = "wi wi-owm-" + weatherCode;
	});
}

function replaceTemps(recordTemps) {
	var high = document.querySelectorAll(".high");
	var low = document.querySelectorAll(".low");
	high.forEach(function(highText, i) {
		highText.innerHTML = Math.round(recordTemps[i].high) + "°";
	});

	low.forEach(function(lowText, i) {
		lowText.innerHTML = Math.round(recordTemps[i].low) + "°";
	});
}


function sortDays(res) {
	var today = new Date(Date.now()).getDay();

	var daysArray = [];
	for (var i = 0; i < 6; i++) {
		daysArray[i] = [];
	}

	var dayCount = 0;
	var correctedIndex = 0;
	// I can't rely on i here because sometimes the current
	// day will send back 2, 3, or 4 elements. I need to start
	// counting once there are no longer any "today" elements.

	// Also, I should come up with a better name for the
	// weather objects from the API. "Elements" is not
	// an intuitive term.
	res.list.forEach(function(element, i) {
		// After 4PM local, the API will not return data for the current day.
		var day = new Date(element.dt*1000).getDay();
		if (day === today) {
			daysArray[dayCount].push(element);
		} else if (i === 0){
			// If the API doesn't pull current day, then continue to other days
			daysArray[dayCount].push(element);
			dayCount += 1;
			correctedIndex += 1;
		} else if (correctedIndex % 8 === 0){
			dayCount += 1;
			correctedIndex += 1;
			daysArray[dayCount].push(element);
		} else {
			correctedIndex += 1;
			daysArray[dayCount].push(element);
		}
	});
	return daysArray;
}

function getRecordTemps(daysSorted) {
	// Big issue - the "high" and "low" for the current day
	// will always be very close to one another since the API only pulls
	// weather for the current day at every 3 hour interval past the current time

	// This means if you pull the weather at 1PM for the current day
	// then you'll only get the "high" and "low" temps that day 
	// from 5PM to 9PM on the same day. It won't give you the "low" from
	// earlier in the day.

	// This would be fixed if I paid money for the premium API service
	// since it gives the high and low average for the entire day.

	// But alas, I am broke.

	var weekday = weekdaysRef();
	var recordTemps = [];
	daysSorted.forEach(function(day, i) {
		// Setting temps to crazy numbers in case the "high" 
		// for a day is negative or if the "low" for a day is very high
		var highestTemp = -1000;
		var lowestTemp = 1000;
		var storedDay = "";
		day.forEach(function(element, j) {
			var temp = element.main.temp;
			if(temp > highestTemp) {
				highestTemp = temp;
			}

			if(temp < lowestTemp) {
				lowestTemp = temp;
			}

			if (storedDay === "") {
				storedDay = weekday[new Date(element.dt*1000).getDay()];
			}
		});

		recordTemps.push({
			"high" : highestTemp,
			"low" : lowestTemp,
			"day" : storedDay
		});

	});

	return recordTemps;
}

function weekdaysRef() {
	var weekday = new Array(7);
	weekday[0]="Sunday";
	weekday[1]="Monday";
	weekday[2]="Tuesday";
	weekday[3]="Wednesday";
	weekday[4]="Thursday";
	weekday[5]="Friday";
	weekday[6]="Saturday";
	return weekday;
}

function titleize(sentence) {
    if(!sentence.split) return sentence;
    var _titleizeWord = function(string) {
            return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
        },
        result = [];
    sentence.split(" ").forEach(function(w) {
        result.push(_titleizeWord(w));
    });
    return result.join(" ");
}