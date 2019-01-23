const input = document
  .querySelector("input")
  .addEventListener("submit", getInfo);
// ----------------------------------------------------------------------------
// Main function that runs on search
// ----------------------------------------------------------------------------

function getInfo() {
  const inputElement = document.querySelector("input");
  const inputVal = inputElement.value.replace(/\s*,\s*/g, ",");
  console.log(inputVal);
  // Create XHR Object
  const request = new XMLHttpRequest();

  request.open(
    "GET",
    `http://api.openweathermap.org/data/2.5/forecast?q=${inputVal}&units=imperial&APPID=0b795233cfaf33a27ed95301eea3412c
`
  );

  request.onload = function() {
    if (this.status === 200) {
      // replay jello animation on search
      const h1 = document.querySelector("h1");
      h1.classList.remove("jello-vertical");
      h1.classList.add("jello-vertical");
      const newh1 = h1.cloneNode(true);
      h1.parentNode.replaceChild(newh1, h1);

      var res = JSON.parse(this.responseText);
      var forecast = buildForecast(res);
      var daysSorted = sortDays(res);
      var recordTemps = getRecordTemps(daysSorted);

      replaceTemps(recordTemps);
      replaceImages(forecast);
      replaceWeekdayText(forecast);
      replaceWeatherText(forecast);
    } else if (this.status === 404) {
      console.log("error occurred!");
    }
  };

  request.onerror = function() {
    console.log("Request error!");
  };

  // Sends request
  request.send();

  // Prevents page from refreshing on submit
  return false;
}

// ----------------------------------------------------------------------------
// Builds a forecast using the response data from the OpenWeatherAPI
// ----------------------------------------------------------------------------

function buildForecast(res) {
  var weekday = weekdaysRef();
  var weekdayFound = new Array(7);
  for (var i = 0; i < weekdayFound.length; i++) {
    weekdayFound[i] = false;
  }

  var forecast = [];

  res.list.forEach(function(element) {
    //find day of the element
    var day = new Date(element.dt * 1000).getDay();
    var hour = new Date(element.dt * 1000).getHours();
    var today = new Date(Date.now()).getDay();

    if (!weekdayFound[day]) {
      // find the element at 5PM, unless it's today
      if (
        element.dt_txt.includes("18:00:00") ||
        weekday[day] === weekday[today]
      ) {
        // ...add that day's info to the forecast array
        forecast.push(element);
        // then mark that day as "found"
        weekdayFound[day] = true;
      }
    }
  });
  return forecast;
}

// ----------------------------------------------------------------------------
// replaces weather text based on API response
// ----------------------------------------------------------------------------

function replaceWeatherText(forecast) {
  var weatherText = document.querySelectorAll(".weather-text");
  weatherText.forEach(function(text, i) {
    var forecastWeatherText = titleize(forecast[i].weather[0].description);
    text.innerHTML = forecastWeatherText;
  });
}

// ----------------------------------------------------------------------------
// replaces weekday text based on API response
// ----------------------------------------------------------------------------

function replaceWeekdayText(forecast) {
  var weekday = weekdaysRef();
  var weekdayText = document.querySelectorAll(".weekday");
  weekdayText.forEach(function(day, i) {
    var forecastWeekday = weekday[new Date(forecast[i].dt * 1000).getDay()];
    day.innerHTML = forecastWeekday;
  });
}

// ----------------------------------------------------------------------------
// replaces images based on API response
// ----------------------------------------------------------------------------

function replaceImages(forecast) {
  var icons = document.querySelectorAll("i");
  icons.forEach(function(icon, i) {
    var weatherCode = forecast[i].weather[0].id;
    icon.className = "wi wi-owm-" + weatherCode;
  });
}

// ----------------------------------------------------------------------------
// replaces high and low temps based on API response
// ----------------------------------------------------------------------------

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

// ----------------------------------------------------------------------------
// Takes the API response of various 3 hr increments and breaks it into separate days
// ----------------------------------------------------------------------------

function sortDays(res) {
  var today = new Date(Date.now()).getDay();

  var daysArray = [];
  for (var i = 0; i < 6; i++) {
    daysArray[i] = [];
  }

  var dayCount = 0;
  var correctedIndex = 0;

  res.list.forEach(function(element, i) {
    // After 4PM local, the API will not return data for the current day.
    var day = new Date(element.dt * 1000).getDay();
    if (day === today) {
      daysArray[dayCount].push(element);
    } else if (i === 0) {
      // If the API doesn't pull current day, then continue to other days
      daysArray[dayCount].push(element);
      dayCount += 1;
      correctedIndex += 1;
    } else if (correctedIndex % 8 === 0) {
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

// ----------------------------------------------------------------------------
// Takes the result of sortDays() and finds the highest / lowest temps for each day
// ----------------------------------------------------------------------------

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
    var highestTemp = -1000;
    var lowestTemp = 1000;
    var storedDay = "";
    day.forEach(function(element, j) {
      var temp = element.main.temp;
      if (temp > highestTemp) {
        highestTemp = temp;
      }

      if (temp < lowestTemp) {
        lowestTemp = temp;
      }

      if (storedDay === "") {
        storedDay = weekday[new Date(element.dt * 1000).getDay()];
      }
    });

    recordTemps.push({
      high: highestTemp,
      low: lowestTemp,
      day: storedDay
    });
  });

  return recordTemps;
}

// ----------------------------------------------------------------------------
// Commonly used array throughout the program. Turns day number into string.
// ----------------------------------------------------------------------------

function weekdaysRef() {
  var weekday = new Array(7);
  weekday[0] = "Sunday";
  weekday[1] = "Monday";
  weekday[2] = "Tuesday";
  weekday[3] = "Wednesday";
  weekday[4] = "Thursday";
  weekday[5] = "Friday";
  weekday[6] = "Saturday";
  return weekday;
}

// ----------------------------------------------------------------------------
// Returns "foo bar" as "Foo Bar". Used to format weather descriptions.
// ----------------------------------------------------------------------------

function titleize(sentence) {
  if (!sentence.split) return sentence;
  var _titleizeWord = function(string) {
      return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
    },
    result = [];
  sentence.split(" ").forEach(function(w) {
    result.push(_titleizeWord(w));
  });
  return result.join(" ");
}
