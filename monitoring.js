(function () {
  "use strict";

  const monitoringPage = document.querySelector(".monitoring-page");
  if (!monitoringPage) return;

  // HTML elements
  const countrySelect = document.getElementById("countrySelect");
  const citySelect = document.getElementById("citySelect");
  const celsiusButton = document.getElementById("celsiusButton");
  const fahrenheitButton = document.getElementById("fahrenheitButton");

  const locationDisplay = document.getElementById("weatherLocation");
  const localTimeDisplay = document.getElementById("localTime");
  const dateDisplay = document.getElementById("weatherDate");
  const currentTemperatureDisplay = document.getElementById("currentTemperature");
  const currentTemperatureUnitDisplay = document.getElementById("currentUnit");
  const heatConditionDisplay = document.getElementById("currentWeatherDescription");
  const feelsLikeDisplay = document.getElementById("feelsLike");
  const feelsLikeUnitDisplay = document.getElementById("feelsLikeUnit");
  const humidityDisplay = document.getElementById("humidityValue");
  const uvIndexDisplay = document.getElementById("uvValue");
  const todayMaximumTemperatureDisplay = document.getElementById("todayHigh");
  const updatedDisplay = document.getElementById("weatherUpdated");
  const statusDisplay = document.getElementById("weatherStatus");

  const heatAlertList = document.getElementById("weatherAlerts");
  const heatAlertCount = document.getElementById("alertCount");
  const browserAlertCheckbox = document.getElementById("enableBrowserAlerts");
  const testBrowserAlertButton = document.getElementById("testAlertButton");
  const testPersonalHeatAlertButton = document.getElementById("testPersonalHeatAlert");
  const savePersonalHeatSettingsButton = document.getElementById("savePersonalHeatSettings");
  const personalHeatSettingsStatus = document.getElementById("personalHeatSettingsStatus");

  const personalHeatAlertsEnabledInput = document.getElementById("personalHeatAlertsEnabled");
  const personalHeatThresholdInput = document.getElementById("personalHeatThreshold");
  const personalHeatDaysInput = document.getElementById("personalHeatDays");

  const temperatureOutlookLocation = document.getElementById("forecastLocation");
  const temperatureOutlookContainer = document.getElementById("weeklyForecast");
  const temperatureChartCanvas = document.getElementById("temperatureChart");
  const weeklyTemperatureSummary = document.getElementById("weeklySummary");
  const heatPreparationAdvice = document.getElementById("preparationAdvice");

  const previousTemperatureInput = document.getElementById("previousTemperatureInput");
  const currentTemperatureInput = document.getElementById("currentTemperatureInput");
  const calculateTemperatureChangeButton = document.getElementById("calculateTemperatureChangeButton");
  const temperatureChangeResult = document.getElementById("temperatureChangeResult");
  const historicalDateInput = document.getElementById("historicalDateInput");
  const fetchHistoricalTemperatureButton = document.getElementById("fetchHistoricalTemperatureButton");
  const historyFetchStatus = document.getElementById("historyFetchStatus");
  const accuracyStatus = document.getElementById("accuracyStatus");
  const accuracyMae = document.getElementById("accuracyMae");
  const accuracyBias = document.getElementById("accuracyBias");
  const accuracyDays = document.getElementById("accuracyDays");
  const accuracyTableBody = document.getElementById("accuracyTableBody");
  const preparationOutlook = document.getElementById("preparationOutlook");
  const preparationRangeSelect = document.getElementById("preparationRangeSelect");
  const preparationRangeAdvice = document.getElementById("preparationRangeAdvice");

  // Coordinates for the cities available in the dashboard
  const myanmarCityCoordinates = {
    Yangon: { latitude: 16.8409, longitude: 96.1735 },
    Mandalay: { latitude: 21.9588, longitude: 96.0891 },
    Naypyidaw: { latitude: 19.7633, longitude: 96.0785 },
    Bago: { latitude: 17.3360, longitude: 96.4797 },
    Mawlamyine: { latitude: 16.4905, longitude: 97.6283 },
    Pathein: { latitude: 16.7792, longitude: 94.7321 },
    Taunggyi: { latitude: 20.7892, longitude: 97.0378 },
    Myitkyina: { latitude: 25.3833, longitude: 97.4000 },
    Sittwe: { latitude: 20.1500, longitude: 92.9000 },
    Monywa: { latitude: 22.1086, longitude: 95.1358 }
  };

  // These are example dashboard alert thresholds, not official warning categories.
  const heatAlertThresholds = {
    heatWarning: 35,
    extremeHeat: 40
  };

  const defaultPersonalHeatSettings = {
    enabled: true,
    threshold: 35,
    days: 3
  };

  let selectedCountry = "Myanmar";
  let selectedCity = "Yangon";
  let selectedTemperatureUnit = "celsius";
  let heatMonitoringData = null;
  let temperatureTrendChart = null;
  let localClockInterval = null;
  let personalHeatSettings = loadPersonalHeatSettings();

  function loadPersonalHeatSettings() {
    try {
      const savedSettings = localStorage.getItem("sunnrPersonalHeatSettings");
      if (!savedSettings) return { ...defaultPersonalHeatSettings };

      const parsedSettings = JSON.parse(savedSettings);
      const combinedSettings = { ...defaultPersonalHeatSettings, ...parsedSettings };

      if (
        typeof combinedSettings.enabled !== "boolean" ||
        typeof combinedSettings.threshold !== "number" ||
        !Number.isFinite(combinedSettings.threshold) ||
        combinedSettings.threshold < 30 ||
        combinedSettings.threshold > 50 ||
        ![1, 3, 7].includes(combinedSettings.days)
      ) {
        return { ...defaultPersonalHeatSettings };
      }

      return combinedSettings;
    } catch (error) {
      console.error("Could not load personal heat settings:", error);
      return { ...defaultPersonalHeatSettings };
    }
  }

  function saveDashboardPreferences() {
    localStorage.setItem("sunnrCountry", selectedCountry);
    localStorage.setItem("sunnrCity", selectedCity);
    localStorage.setItem("sunnrUnit", selectedTemperatureUnit);
    if (browserAlertCheckbox) {
      localStorage.setItem("sunnrAlerts", String(browserAlertCheckbox.checked));
    }
  }

  function loadDashboardPreferences() {
    const savedCountry = localStorage.getItem("sunnrCountry");
    const savedCity = localStorage.getItem("sunnrCity");
    const savedUnit = localStorage.getItem("sunnrUnit");
    const savedBrowserAlerts = localStorage.getItem("sunnrAlerts");

    if (savedCountry === "Myanmar") selectedCountry = savedCountry;
    if (savedCity && myanmarCityCoordinates[savedCity]) selectedCity = savedCity;
    if (savedUnit === "fahrenheit") selectedTemperatureUnit = "fahrenheit";
    if (browserAlertCheckbox) browserAlertCheckbox.checked = savedBrowserAlerts === "true";
  }

  function getCityDateString(dateValue, timezone) {
    const dateParts = new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone || "Asia/Yangon", year: "numeric", month: "2-digit", day: "2-digit"
    }).formatToParts(dateValue || new Date());
    const dateValues = {};
    dateParts.forEach(function (part) { dateValues[part.type] = part.value; });
    return `${dateValues.year}-${dateValues.month}-${dateValues.day}`;
  }

  function shiftDateString(dateString, dayOffset) {
    const dateValue = new Date(`${dateString}T12:00:00Z`);
    dateValue.setUTCDate(dateValue.getUTCDate() + dayOffset);
    return dateValue.toISOString().slice(0, 10);
  }

  function loadCityOptions() {
    if (!countrySelect || !citySelect) return;

    countrySelect.innerHTML = '<option value="Myanmar">Myanmar</option>';
    countrySelect.value = selectedCountry;
    citySelect.innerHTML = "";

    Object.keys(myanmarCityCoordinates).forEach(function (cityName) {
      const cityOption = document.createElement("option");
      cityOption.value = cityName;
      cityOption.textContent = cityName;
      citySelect.appendChild(cityOption);
    });

    citySelect.value = selectedCity;
  }

  function convertTemperatureFromCelsius(celsiusTemperature) {
    if (selectedTemperatureUnit === "fahrenheit") {
      return (celsiusTemperature * 9 / 5) + 32;
    }
    return celsiusTemperature;
  }

  function formatTemperature(celsiusTemperature) {
    return Math.round(convertTemperatureFromCelsius(celsiusTemperature));
  }

  // Temperature differences do not use the +32 offset used for temperatures.
  function convertTemperatureDifferenceFromCelsius(difference) {
    return selectedTemperatureUnit === "fahrenheit" ? difference * 9 / 5 : difference;
  }

  function formatTemperatureWithUnit(celsiusTemperature, decimalPlaces) {
    const places = Number.isInteger(decimalPlaces) ? decimalPlaces : 1;
    return `${convertTemperatureFromCelsius(celsiusTemperature).toFixed(places)}${getSelectedTemperatureUnit()}`;
  }

  function formatTemperatureDifferenceWithUnit(celsiusDifference, decimalPlaces) {
    const places = Number.isInteger(decimalPlaces) ? decimalPlaces : 1;
    const convertedDifference = convertTemperatureDifferenceFromCelsius(celsiusDifference);
    const sign = convertedDifference > 0 ? "+" : "";
    return `${sign}${convertedDifference.toFixed(places)}${getSelectedTemperatureUnit()}`;
  }

  function getSelectedTemperatureUnit() {
    return selectedTemperatureUnit === "celsius" ? "°C" : "°F";
  }

  function getHeatConditionDescription(temperatureInCelsius) {
    if (temperatureInCelsius >= heatAlertThresholds.extremeHeat) return "Extreme heat conditions";
    if (temperatureInCelsius >= heatAlertThresholds.heatWarning) return "High heat conditions";
    if (temperatureInCelsius >= 30) return "Hot conditions";
    return "Moderate temperature conditions";
  }

  async function getHeatMonitoringData() {
    const selectedCityCoordinates = myanmarCityCoordinates[selectedCity];
    if (!selectedCityCoordinates) return;

    if (statusDisplay) statusDisplay.textContent = "Loading the latest temperature information...";

    try {
      const apiUrl = new URL("https://api.open-meteo.com/v1/forecast");
      apiUrl.search = new URLSearchParams({
        latitude: selectedCityCoordinates.latitude,
        longitude: selectedCityCoordinates.longitude,
        current: "temperature_2m,relative_humidity_2m,apparent_temperature",
        daily: "temperature_2m_max,temperature_2m_min,uv_index_max",
        timezone: "auto",
        forecast_days: "7"
      });

      const response = await fetch(apiUrl);
      if (!response.ok) throw new Error("The temperature service returned an error.");

      const receivedHeatData = await response.json();
      heatMonitoringData = receivedHeatData;

      displayCurrentHeatConditions(receivedHeatData);
      displaySelectedCityLocalTime(receivedHeatData.timezone);
      displaySevenDayTemperatureOutlook(receivedHeatData.daily);
      displayHeatAlerts(receivedHeatData);
      displayTemperatureTrendChart(receivedHeatData.daily);
      displayWeeklyTemperatureSummary(receivedHeatData.daily);
      displayHeatPreparationAdvice(receivedHeatData.daily);
      checkPersonalHeatForecast(receivedHeatData, selectedCity);
      if (historicalDateInput && !historicalDateInput.value) {
        historicalDateInput.max = shiftDateString(getCityDateString(new Date(), receivedHeatData.timezone), -6);
        historicalDateInput.value = shiftDateString(getCityDateString(new Date(), receivedHeatData.timezone), -7);
      } else if (historicalDateInput) {
        historicalDateInput.max = shiftDateString(getCityDateString(new Date(), receivedHeatData.timezone), -6);
      }
      fetchForecastAccuracy(receivedHeatData.timezone);

      if (statusDisplay) {
        statusDisplay.textContent = `Latest temperature data for ${selectedCity}, ${selectedCountry}.`;
      }
    } catch (error) {
      console.error("Heat monitoring data error:", error);
      if (statusDisplay) {
        statusDisplay.textContent = "Temperature information is temporarily unavailable. Please try again later.";
      }
    }
  }

  function displayCurrentHeatConditions(data) {
    const currentConditions = data.current;
    const dailyConditions = data.daily;

    if (locationDisplay) locationDisplay.textContent = `${selectedCity}, ${selectedCountry}`;
    if (currentTemperatureDisplay) currentTemperatureDisplay.textContent = formatTemperature(currentConditions.temperature_2m);
    if (currentTemperatureUnitDisplay) currentTemperatureUnitDisplay.textContent = getSelectedTemperatureUnit();
    if (heatConditionDisplay) heatConditionDisplay.textContent = getHeatConditionDescription(currentConditions.temperature_2m);
    if (feelsLikeDisplay) feelsLikeDisplay.textContent = formatTemperature(currentConditions.apparent_temperature);
    if (feelsLikeUnitDisplay) feelsLikeUnitDisplay.textContent = getSelectedTemperatureUnit();
    if (humidityDisplay) humidityDisplay.textContent = `${currentConditions.relative_humidity_2m}%`;
    if (uvIndexDisplay) uvIndexDisplay.textContent = dailyConditions.uv_index_max[0] ?? "n/a";
    if (todayMaximumTemperatureDisplay) {
      todayMaximumTemperatureDisplay.textContent = `${formatTemperature(dailyConditions.temperature_2m_max[0])}${getSelectedTemperatureUnit()}`;
    }
    if (updatedDisplay) {
      const updateTime = new Date(currentConditions.time);
      updatedDisplay.textContent = `Updated at ${updateTime.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}`;
    }
    if (temperatureOutlookLocation) temperatureOutlookLocation.textContent = `${selectedCity}, ${selectedCountry}`;

    // The calculator always uses Celsius so its comparison stays accurate even in Fahrenheit display mode.
    if (currentTemperatureInput) {
      currentTemperatureInput.value = Number(dailyConditions.temperature_2m_max[0]).toFixed(1);
    }
  }

  function displaySelectedCityLocalTime(timezone) {
    if (!localTimeDisplay || !dateDisplay) return;

    function updateCityClock() {
      const currentMoment = new Date();
      localTimeDisplay.textContent = new Intl.DateTimeFormat("en-GB", {
        timeZone: timezone, hour: "2-digit", minute: "2-digit", second: "2-digit"
      }).format(currentMoment);
      dateDisplay.textContent = new Intl.DateTimeFormat("en-GB", {
        timeZone: timezone, weekday: "long", day: "numeric", month: "long", year: "numeric"
      }).format(currentMoment);
    }

    updateCityClock();
    if (localClockInterval) clearInterval(localClockInterval);
    localClockInterval = setInterval(updateCityClock, 1000);
  }

  function displaySevenDayTemperatureOutlook(dailyData) {
    if (!temperatureOutlookContainer) return;
    temperatureOutlookContainer.innerHTML = "";

    dailyData.time.forEach(function (forecastDate, dayIndex) {
      const dateObject = new Date(`${forecastDate}T12:00:00`);
      const weekdayName = dateObject.toLocaleDateString("en-GB", { weekday: "long" });
      const shortDate = dateObject.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
      const maximumTemperature = dailyData.temperature_2m_max[dayIndex];
      const minimumTemperature = dailyData.temperature_2m_min[dayIndex];

      const forecastCard = document.createElement("article");
      forecastCard.className = "forecast-day";
      forecastCard.innerHTML = `
        <p class="forecast-day-name">${weekdayName}</p>
        <p class="forecast-day-date">${shortDate}</p>
        <i class="bi bi-thermometer-sun forecast-weather-icon" aria-hidden="true"></i>
        <p class="forecast-description">${getHeatConditionDescription(maximumTemperature)}</p>
        <div class="forecast-temperatures">
          <span>${formatTemperature(maximumTemperature)}${getSelectedTemperatureUnit()}</span>
          <span>${formatTemperature(minimumTemperature)}${getSelectedTemperatureUnit()}</span>
        </div>
        <p class="forecast-description">High / Low</p>
      `;
      temperatureOutlookContainer.appendChild(forecastCard);
    });
  }

  function displayHeatAlerts(data) {
    if (!heatAlertList || !heatAlertCount) return;
    heatAlertList.innerHTML = "";

    const heatAlerts = [];
    const currentTemperatureInCelsius = data.current.temperature_2m;

    if (currentTemperatureInCelsius >= heatAlertThresholds.extremeHeat) {
      heatAlerts.push({
        type: "danger",
        title: "Extreme heat conditions",
        message: "The current temperature has reached the dashboard's example extreme-heat threshold. Reduce heat exposure and follow official local safety guidance."
      });
    } else if (currentTemperatureInCelsius >= heatAlertThresholds.heatWarning) {
      heatAlerts.push({
        type: "warning",
        title: "High temperature warning",
        message: "The current temperature has reached the dashboard's example heat-warning threshold. Stay hydrated and plan outdoor activities carefully."
      });
    }

    data.daily.time.forEach(function (forecastDate, dayIndex) {
      const predictedMaximum = data.daily.temperature_2m_max[dayIndex];

      if (predictedMaximum >= heatAlertThresholds.extremeHeat) {
        heatAlerts.push({
          type: "danger",
          title: `Extreme heat may occur on ${forecastDate}`,
          message: `The predicted maximum temperature is ${formatTemperature(predictedMaximum)}${getSelectedTemperatureUnit()}. Prepare for very hot conditions.`
        });
      } else if (predictedMaximum >= heatAlertThresholds.heatWarning) {
        heatAlerts.push({
          type: "warning",
          title: `High temperatures expected on ${forecastDate}`,
          message: `The predicted maximum temperature is ${formatTemperature(predictedMaximum)}${getSelectedTemperatureUnit()}. Consider limiting strenuous outdoor activity during the hottest hours.`
        });
      }
    });

    heatAlertCount.textContent = `${heatAlerts.length} ${heatAlerts.length === 1 ? "alert" : "alerts"}`;

    if (heatAlerts.length === 0) {
      heatAlertList.innerHTML = `
        <div class="weather-alert-empty">
          <i class="bi bi-check-circle" aria-hidden="true"></i>
          <p>No temperatures in this outlook have reached the dashboard's example heat-alert thresholds.</p>
        </div>
      `;
      return;
    }

    heatAlerts.forEach(function (heatAlert) {
      const heatAlertCard = document.createElement("article");
      heatAlertCard.className = `weather-alert-card ${heatAlert.type}`;
      const alertTitle = document.createElement("h3");
      const alertMessage = document.createElement("p");
      const alertContent = document.createElement("div");
      const alertIcon = document.createElement("div");
      const iconElement = document.createElement("i");
      const alertTag = document.createElement("span");

      alertTitle.textContent = heatAlert.title;
      alertMessage.textContent = heatAlert.message;
      alertContent.append(alertTitle, alertMessage);
      iconElement.className = "bi bi-thermometer-sun";
      iconElement.setAttribute("aria-hidden", "true");
      alertIcon.className = "weather-alert-icon";
      alertIcon.appendChild(iconElement);
      alertTag.className = "weather-alert-tag";
      alertTag.textContent = heatAlert.type;

      heatAlertCard.append(alertIcon, alertContent, alertTag);
      heatAlertList.appendChild(heatAlertCard);
    });

    if (browserAlertCheckbox && browserAlertCheckbox.checked) {
      showAutomaticHeatPopup(heatAlerts);
    }
  }

  function showAutomaticHeatPopup(heatAlerts) {
    const severeHeatAlert = heatAlerts.find(function (alertItem) {
      return alertItem.type === "danger";
    });
    if (!severeHeatAlert) return;

    const popupStorageKey = `sunnrHeatPopup_${selectedCity}_${new Date().toDateString()}`;
    if (localStorage.getItem(popupStorageKey)) return;

    window.alert(`SUNNR Heat Warning\n\n${severeHeatAlert.title}\n\n${severeHeatAlert.message}`);
    localStorage.setItem(popupStorageKey, "true");
  }

  function displayTemperatureTrendChart(dailyData) {
    if (!temperatureChartCanvas) return;
    if (typeof Chart === "undefined") {
      console.error("Chart.js has not loaded.");
      return;
    }

    const chartDayLabels = dailyData.time.map(function (forecastDate) {
      return new Date(`${forecastDate}T12:00:00`).toLocaleDateString("en-GB", { weekday: "short" });
    });

    if (temperatureTrendChart) temperatureTrendChart.destroy();

    temperatureTrendChart = new Chart(temperatureChartCanvas, {
      type: "line",
      data: {
        labels: chartDayLabels,
        datasets: [
          {
            label: "Maximum temperature",
            data: dailyData.temperature_2m_max.map(convertTemperatureFromCelsius),
            borderColor: "#ffd700",
            backgroundColor: "rgba(255, 215, 0, 0.10)",
            fill: true,
            tension: 0.4
          },
          {
            label: "Minimum temperature",
            data: dailyData.temperature_2m_min.map(convertTemperatureFromCelsius),
            borderColor: "#83bfff",
            backgroundColor: "rgba(131, 191, 255, 0.08)",
            fill: true,
            tension: 0.4
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { labels: { color: "#f3eddd" } }
        },
        scales: {
          x: {
            ticks: { color: "#f3eddd" },
            grid: { color: "rgba(243, 237, 221, 0.08)" }
          },
          y: {
            ticks: {
              color: "#f3eddd",
              callback: function (axisValue) {
                return `${axisValue}${getSelectedTemperatureUnit()}`;
              }
            },
            grid: { color: "rgba(243, 237, 221, 0.08)" }
          }
        }
      }
    });
  }

  function displayWeeklyTemperatureSummary(dailyData) {
    if (!weeklyTemperatureSummary) return;

    let highestPredictedTemperature = dailyData.temperature_2m_max[0];
    let hottestForecastDate = dailyData.time[0];
    let lowestPredictedTemperature = dailyData.temperature_2m_min[0];
    let coolestForecastDate = dailyData.time[0];

    for (let dayIndex = 1; dayIndex < dailyData.time.length; dayIndex++) {
      if (dailyData.temperature_2m_max[dayIndex] > highestPredictedTemperature) {
        highestPredictedTemperature = dailyData.temperature_2m_max[dayIndex];
        hottestForecastDate = dailyData.time[dayIndex];
      }
      if (dailyData.temperature_2m_min[dayIndex] < lowestPredictedTemperature) {
        lowestPredictedTemperature = dailyData.temperature_2m_min[dayIndex];
        coolestForecastDate = dailyData.time[dayIndex];
      }
    }

    const hottestDayLabel = new Date(`${hottestForecastDate}T12:00:00`).toLocaleDateString("en-GB", {
      weekday: "long", day: "numeric", month: "short"
    });
    const coolestDayLabel = new Date(`${coolestForecastDate}T12:00:00`).toLocaleDateString("en-GB", {
      weekday: "long", day: "numeric", month: "short"
    });

    weeklyTemperatureSummary.innerHTML = `
      <div class="weekly-summary">
        <i class="bi bi-thermometer-sun" aria-hidden="true"></i>
        <p>The highest predicted temperature this week is <strong>${formatTemperature(highestPredictedTemperature)}${getSelectedTemperatureUnit()}</strong> on <strong>${hottestDayLabel}</strong>. The lowest predicted temperature is <strong>${formatTemperature(lowestPredictedTemperature)}${getSelectedTemperatureUnit()}</strong> on <strong>${coolestDayLabel}</strong>.</p>
      </div>
    `;
  }

  function getPreparationAdviceForRange(rangeKey) {
    const adviceByRange = {
      below30: { title: "Warm conditions — stay comfortable", message: "Keep drinking water through the day, choose breathable clothing and take breaks if you feel overheated. Check the forecast before long outdoor activities." },
      "30-34": { title: "Hot conditions — plan ahead", message: "Carry drinking water, use shade, wear lightweight loose clothing and avoid unnecessary strenuous activity during the hottest part of the afternoon. Check on anyone who may struggle in the heat." },
      "35-37": { title: "Very hot conditions — reduce exposure", message: "Move outdoor exercise and demanding tasks to cooler hours. Take frequent shade or cool-room breaks, drink water regularly and never leave children or pets in parked vehicles." },
      "38-39": { title: "Intense heat — keep cool", message: "Limit time outdoors during peak afternoon heat. Stay in the coolest available place, take regular cooling breaks and check on older adults, young children and people with health vulnerabilities. Follow local heat alerts." },
      "40plus": { title: "Extreme heat — take extra care", message: "Avoid strenuous outdoor activity where possible and stay in a cool, shaded or air-conditioned place. Drink water regularly, check on others and seek urgent medical help for confusion, fainting or signs of heatstroke." }
    };
    return adviceByRange[rangeKey] || adviceByRange.below30;
  }

  function getPreparationRangeForTemperature(temperature) {
    if (temperature >= 40) return "40plus";
    if (temperature >= 38) return "38-39";
    if (temperature >= 35) return "35-37";
    if (temperature >= 30) return "30-34";
    return "below30";
  }

  function displayInteractivePreparationGuide(dailyData) {
    if (!dailyData || !preparationOutlook || !preparationRangeAdvice) return;
    const todayTemperature = heatMonitoringData.current.temperature_2m;
    const todayHighTemperature = dailyData.temperature_2m_max[0];
    const weeklyHighTemperature = Math.max(...dailyData.temperature_2m_max);
    const hottestDayIndex = dailyData.temperature_2m_max.indexOf(weeklyHighTemperature);
    const hottestDay = new Date(`${dailyData.time[hottestDayIndex]}T12:00:00`).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "short" });

    preparationOutlook.innerHTML = `<p>It is currently <strong>${formatTemperature(todayTemperature)}${getSelectedTemperatureUnit()}</strong> in ${selectedCity}. Today's forecast high is <strong>${formatTemperature(todayHighTemperature)}${getSelectedTemperatureUnit()}</strong>. Over the next seven days, temperatures may reach <strong>${formatTemperature(weeklyHighTemperature)}${getSelectedTemperatureUnit()}</strong> on <strong>${hottestDay}</strong>.</p>`;

    const selectedRange = preparationRangeSelect && preparationRangeSelect.value !== "auto"
      ? preparationRangeSelect.value
      : getPreparationRangeForTemperature(weeklyHighTemperature);
    const advice = getPreparationAdviceForRange(selectedRange);
    const rangeLabels = {
      below30: `Below ${formatTemperature(30)}${getSelectedTemperatureUnit()}`,
      "30-34": `${formatTemperature(30)}–${formatTemperature(34)}${getSelectedTemperatureUnit()}`,
      "35-37": `${formatTemperature(35)}–${formatTemperature(37)}${getSelectedTemperatureUnit()}`,
      "38-39": `${formatTemperature(38)}–${formatTemperature(39)}${getSelectedTemperatureUnit()}`,
      "40plus": `${formatTemperature(40)}${getSelectedTemperatureUnit()} and above`
    };
    preparationRangeAdvice.innerHTML = `<span class="preparation-range-label">${rangeLabels[selectedRange]}</span><h3>${advice.title}</h3><p>${advice.message}</p>`;
  }

  function displayHeatPreparationAdvice(dailyData) {
    if (!heatPreparationAdvice) return;
    heatPreparationAdvice.innerHTML = "";
    displayInteractivePreparationGuide(dailyData);

    const heatAdviceItems = [
      { icon: "bi-droplet", title: "Keep water nearby", message: "Drink water regularly throughout the day, especially when spending time in warm environments." },
      { icon: "bi-house", title: "Find cooler spaces", message: "Use shade, good ventilation or a cooler indoor space during the hottest hours." },
      { icon: "bi-sun", title: "Protect yourself outdoors", message: "Wear lightweight clothing, use sun protection and take breaks in the shade." }
    ];
    const weeklyMaximum = Math.max(...dailyData.temperature_2m_max);
    if (weeklyMaximum >= 35) {
      heatAdviceItems.push({ icon: "bi-people", title: "Check on others", message: "Check that children, older adults and people more affected by heat can stay cool and access drinking water." });
    }
    heatAdviceItems.forEach(function (adviceItem) {
      const adviceCard = document.createElement("article");
      adviceCard.className = "preparation-card";
      const adviceIcon = document.createElement("i");
      adviceIcon.className = `bi ${adviceItem.icon}`;
      adviceIcon.setAttribute("aria-hidden", "true");
      const adviceTitle = document.createElement("h3");
      adviceTitle.textContent = adviceItem.title;
      const adviceMessage = document.createElement("p");
      adviceMessage.textContent = adviceItem.message;
      adviceCard.append(adviceIcon, adviceTitle, adviceMessage);
      heatPreparationAdvice.appendChild(adviceCard);
    });
  }

  async function fetchHistoricalDailyHigh(dateString) {
    const coordinates = myanmarCityCoordinates[selectedCity];
    const apiUrl = new URL("https://archive-api.open-meteo.com/v1/archive");
    apiUrl.search = new URLSearchParams({
      latitude: coordinates.latitude,
      longitude: coordinates.longitude,
      start_date: dateString,
      end_date: dateString,
      daily: "temperature_2m_max",
      timezone: "auto"
    });
    const response = await fetch(apiUrl);
    if (!response.ok) throw new Error("Historical temperature data could not be loaded.");
    const data = await response.json();
    const value = data.daily && data.daily.temperature_2m_max && data.daily.temperature_2m_max[0];
    if (typeof value !== "number") throw new Error("No historical daily high was returned for this date.");
    return value;
  }

  async function fetchForecastAccuracy(timezone) {
    if (!accuracyStatus || !accuracyTableBody) return;

    accuracyStatus.textContent = `Comparing recent one-day-ahead forecasts with the historical reference for ${selectedCity}...`;
    accuracyTableBody.innerHTML = '<tr><td colspan="4">Loading comparison data...</td></tr>';

    try {
      const today = getCityDateString(new Date(), timezone);
      // Use a completed date range to reduce the chance that archive data is not ready.
      const endDate = shiftDateString(today, -6);
      const startDate = shiftDateString(today, -12);
      const coordinates = myanmarCityCoordinates[selectedCity];

      const historicalUrl = new URL("https://archive-api.open-meteo.com/v1/archive");
      historicalUrl.search = new URLSearchParams({
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
        start_date: startDate,
        end_date: endDate,
        daily: "temperature_2m_max",
        timezone: "auto"
      });

      // Previous-day forecast values are requested as hourly data, then reduced to a daily high.
      const previousRunUrl = new URL("https://previous-runs-api.open-meteo.com/v1/forecast");
      previousRunUrl.search = new URLSearchParams({
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
        start_date: startDate,
        end_date: endDate,
        hourly: "temperature_2m_previous_day1",
        timezone: "auto"
      });

      const responses = await Promise.all([fetch(historicalUrl), fetch(previousRunUrl)]);
      if (!responses[0].ok || !responses[1].ok) {
        const details = await Promise.all(responses.map(async function (response) {
          if (response.ok) return "OK";
          return `${response.status}: ${await response.text()}`;
        }));
        throw new Error(details.join(" | "));
      }

      const datasets = await Promise.all(responses.map(function (response) {
        return response.json();
      }));

      const referenceData = datasets[0].daily;
      const forecastData = datasets[1].hourly;
      if (!referenceData || !forecastData || !forecastData.time) {
        throw new Error("The comparison service did not return the expected temperature data.");
      }

      const referenceByDate = {};
      referenceData.time.forEach(function (date, index) {
        referenceByDate[date] = referenceData.temperature_2m_max[index];
      });

      const forecastByDate = {};
      forecastData.time.forEach(function (time, index) {
        const date = time.slice(0, 10);
        const temperature = forecastData.temperature_2m_previous_day1[index];
        if (typeof temperature === "number") {
          if (forecastByDate[date] === undefined || temperature > forecastByDate[date]) {
            forecastByDate[date] = temperature;
          }
        }
      });

      const comparisons = [];
      Object.keys(forecastByDate).forEach(function (date) {
        const forecastValue = forecastByDate[date];
        const referenceValue = referenceByDate[date];
        if (typeof referenceValue === "number") {
          comparisons.push({
            date: date,
            forecast: forecastValue,
            reference: referenceValue,
            difference: forecastValue - referenceValue
          });
        }
      });

      if (!comparisons.length) {
        throw new Error("There are no matching forecast and reference days available yet.");
      }

      const meanAbsoluteError = comparisons.reduce(function (sum, item) {
        return sum + Math.abs(item.difference);
      }, 0) / comparisons.length;
      const meanBias = comparisons.reduce(function (sum, item) {
        return sum + item.difference;
      }, 0) / comparisons.length;

      accuracyMae.textContent = `${convertTemperatureDifferenceFromCelsius(meanAbsoluteError).toFixed(1)}${getSelectedTemperatureUnit()}`;
      accuracyBias.textContent = formatTemperatureDifferenceWithUnit(meanBias);
      accuracyDays.textContent = String(comparisons.length);
      accuracyTableBody.innerHTML = "";

      comparisons.forEach(function (item) {
        const row = document.createElement("tr");
        const values = [
          new Date(`${item.date}T12:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "short" }),
          formatTemperatureWithUnit(item.forecast),
          formatTemperatureWithUnit(item.reference),
          formatTemperatureDifferenceWithUnit(item.difference)
        ];
        values.forEach(function (value) {
          const cell = document.createElement("td");
          cell.textContent = value;
          row.appendChild(cell);
        });
        accuracyTableBody.appendChild(row);
      });

      accuracyStatus.textContent = `Compared ${comparisons.length} matching days for ${selectedCity} (${startDate} to ${endDate}). A smaller average difference means the forecast was closer to the historical reference during this sample.`;
    } catch (error) {
      console.error("Forecast accuracy comparison error:", error);
      accuracyStatus.textContent = "The forecast comparison could not be completed. Try again later; historical archives may have a short publication delay.";
      accuracyTableBody.innerHTML = '<tr><td colspan="4">Comparison data is currently unavailable.</td></tr>';
      accuracyMae.textContent = "--";
      accuracyBias.textContent = "--";
      accuracyDays.textContent = "0";
    }
  }

  function displayPersonalHeatSettings() {
    if (!personalHeatAlertsEnabledInput || !personalHeatThresholdInput || !personalHeatDaysInput) return;

    personalHeatAlertsEnabledInput.checked = personalHeatSettings.enabled;
    personalHeatThresholdInput.value = String(Math.round(convertTemperatureFromCelsius(personalHeatSettings.threshold)));
    personalHeatThresholdInput.min = selectedTemperatureUnit === "celsius" ? "30" : "86";
    personalHeatThresholdInput.max = selectedTemperatureUnit === "celsius" ? "50" : "122";

    const thresholdLabel = document.querySelector('label[for="personalHeatThreshold"]');
    if (thresholdLabel) {
      thresholdLabel.textContent = `Temperature threshold (${getSelectedTemperatureUnit()})`;
    }

    personalHeatDaysInput.value = String(personalHeatSettings.days);
  }

  async function requestBrowserNotificationPermission() {
    if (!("Notification" in window)) return false;
    if (Notification.permission === "granted") return true;
    if (Notification.permission === "denied") return false;
    const permissionResult = await Notification.requestPermission();
    return permissionResult === "granted";
  }

  async function savePersonalHeatSettings() {
    const enteredThreshold = Number(personalHeatThresholdInput.value);
    const selectedThreshold = selectedTemperatureUnit === "fahrenheit"
      ? (enteredThreshold - 32) * 5 / 9
      : enteredThreshold;
    const selectedForecastDays = Number(personalHeatDaysInput.value);

    if (!Number.isFinite(enteredThreshold) || selectedThreshold < 30 || selectedThreshold > 50) {
      personalHeatSettingsStatus.textContent = selectedTemperatureUnit === "fahrenheit"
        ? "Please enter a temperature between 86°F and 122°F."
        : "Please enter a temperature between 30°C and 50°C.";
      return;
    }
    if (![1, 3, 7].includes(selectedForecastDays)) {
      personalHeatSettingsStatus.textContent = "Please select a valid forecast period.";
      return;
    }

    personalHeatSettings = {
      enabled: personalHeatAlertsEnabledInput.checked,
      threshold: selectedThreshold,
      days: selectedForecastDays
    };
    localStorage.setItem("sunnrPersonalHeatSettings", JSON.stringify(personalHeatSettings));

    if (!personalHeatSettings.enabled) {
      personalHeatSettingsStatus.textContent = "Personal heat alerts are disabled. Your settings have been saved.";
      return;
    }

    const permissionWasGranted = await requestBrowserNotificationPermission();
    personalHeatSettingsStatus.textContent = permissionWasGranted
      ? "Your settings are saved and browser notifications are allowed."
      : "Your settings are saved, but browser notifications are blocked. Check your browser's site permissions.";

    if (heatMonitoringData) checkPersonalHeatForecast(heatMonitoringData, selectedCity);
  }

  function checkPersonalHeatForecast(data, cityName) {
    if (!personalHeatSettings.enabled || !data || !data.daily) return;

    const numberOfForecastDays = Math.min(
      personalHeatSettings.days,
      data.daily.time.length,
      data.daily.temperature_2m_max.length
    );

    for (let dayIndex = 0; dayIndex < numberOfForecastDays; dayIndex++) {
      const predictedMaximumTemperature = data.daily.temperature_2m_max[dayIndex];
      if (predictedMaximumTemperature >= personalHeatSettings.threshold) {
        sendPersonalHeatNotification(cityName, data.daily.time[dayIndex], predictedMaximumTemperature);
      }
    }
  }

  function sendPersonalHeatNotification(cityName, forecastDate, predictedTemperature) {
    if (!("Notification" in window) || Notification.permission !== "granted") return;

    const notificationStorageKey = `sunnrHeatNotification_${cityName}_${forecastDate}_${personalHeatSettings.threshold}`;
    if (localStorage.getItem(notificationStorageKey)) return;

    new Notification("SUNNR Personal Heat Alert", {
      body: `${cityName}: the forecast maximum is ${formatTemperatureWithUnit(predictedTemperature)} on ${forecastDate}. Your alert threshold is ${formatTemperatureWithUnit(personalHeatSettings.threshold, 0)}.`,
      tag: notificationStorageKey
    });
    localStorage.setItem(notificationStorageKey, "true");
  }

  function compareTemperatures() {
    const previousTemperature = Number(previousTemperatureInput.value);
    const currentTemperature = Number(currentTemperatureInput.value);

    if (previousTemperatureInput.value.trim() === "" || !Number.isFinite(previousTemperature)) {
      temperatureChangeResult.textContent = "Please enter a valid previous temperature first.";
      return;
    }
    if (currentTemperatureInput.value.trim() === "" || !Number.isFinite(currentTemperature)) {
      temperatureChangeResult.textContent = "The current temperature has not loaded yet. Please wait for the dashboard.";
      return;
    }

    const temperatureDifference = currentTemperature - previousTemperature;
    const absoluteDifference = Math.abs(convertTemperatureDifferenceFromCelsius(temperatureDifference)).toFixed(1);

    if (temperatureDifference > 0) {
      temperatureChangeResult.textContent = `Today's forecast high is ${absoluteDifference}${getSelectedTemperatureUnit()} higher than the selected day's historical high.`;
    } else if (temperatureDifference < 0) {
      temperatureChangeResult.textContent = `Today's forecast high is ${absoluteDifference}${getSelectedTemperatureUnit()} lower than the selected day's historical high.`;
    } else {
      temperatureChangeResult.textContent = "Today's forecast high matches the selected day's historical high.";
    }
  }

  function updateTemperatureUnitButtons() {
    if (celsiusButton) celsiusButton.classList.toggle("active", selectedTemperatureUnit === "celsius");
    if (fahrenheitButton) fahrenheitButton.classList.toggle("active", selectedTemperatureUnit === "fahrenheit");
  }

  function refreshTemperatureDisplays() {
    if (!heatMonitoringData) {
      displayPersonalHeatSettings();
      return;
    }
    displayCurrentHeatConditions(heatMonitoringData);
    displaySevenDayTemperatureOutlook(heatMonitoringData.daily);
    displayTemperatureTrendChart(heatMonitoringData.daily);
    displayWeeklyTemperatureSummary(heatMonitoringData.daily);
    displayHeatPreparationAdvice(heatMonitoringData.daily);
    displayHeatAlerts(heatMonitoringData);
    displayPersonalHeatSettings();
    fetchForecastAccuracy(heatMonitoringData.timezone);
    if (temperatureChangeResult && temperatureChangeResult.textContent && previousTemperatureInput && currentTemperatureInput && previousTemperatureInput.value !== "") {
      compareTemperatures();
    }
  }

  // Event listeners
  if (countrySelect) {
    countrySelect.addEventListener("change", function () {
      selectedCountry = countrySelect.value;
      saveDashboardPreferences();
      getHeatMonitoringData();
    });
  }

  if (citySelect) {
    citySelect.addEventListener("change", function () {
      selectedCity = citySelect.value;
      saveDashboardPreferences();
      getHeatMonitoringData();
    });
  }

  if (celsiusButton) {
    celsiusButton.addEventListener("click", function () {
      selectedTemperatureUnit = "celsius";
      saveDashboardPreferences();
      updateTemperatureUnitButtons();
      refreshTemperatureDisplays();
    });
  }

  if (fahrenheitButton) {
    fahrenheitButton.addEventListener("click", function () {
      selectedTemperatureUnit = "fahrenheit";
      saveDashboardPreferences();
      updateTemperatureUnitButtons();
      refreshTemperatureDisplays();
    });
  }

  if (browserAlertCheckbox) {
    browserAlertCheckbox.addEventListener("change", function () {
      saveDashboardPreferences();
      if (browserAlertCheckbox.checked) {
        window.alert("SUNNR heat pop-up alerts are now enabled.");
      }
    });
  }

  if (testBrowserAlertButton) {
    testBrowserAlertButton.addEventListener("click", function () {
      window.alert("SUNNR Heat Alert Test\n\nYour browser pop-up alert is working.");
    });
  }

  if (savePersonalHeatSettingsButton) {
    savePersonalHeatSettingsButton.addEventListener("click", savePersonalHeatSettings);
  }

  if (testPersonalHeatAlertButton) {
    testPersonalHeatAlertButton.addEventListener("click", async function () {
      const enteredThreshold = Number(personalHeatThresholdInput.value);
      const selectedThreshold = selectedTemperatureUnit === "fahrenheit"
        ? (enteredThreshold - 32) * 5 / 9
        : enteredThreshold;
      if (!Number.isFinite(enteredThreshold) || selectedThreshold < 30 || selectedThreshold > 50) {
        personalHeatSettingsStatus.textContent = selectedTemperatureUnit === "fahrenheit"
          ? "Please enter a temperature between 86°F and 122°F."
          : "Please enter a temperature between 30°C and 50°C.";
        return;
      }

      const simulatedTemperature = Math.min(selectedThreshold + 2, 50);
      if (!("Notification" in window)) {
        window.alert(`SUNNR Heat Alert Demo\n\nSimulated temperature: ${formatTemperatureWithUnit(simulatedTemperature)}.`);
        return;
      }

      try {
        const permissionGranted = await requestBrowserNotificationPermission();
        if (permissionGranted) {
          new Notification("SUNNR Personal Heat Alert — Demo", {
            body: `Demo forecast: ${formatTemperatureWithUnit(simulatedTemperature)}. This is above your ${formatTemperatureWithUnit(selectedThreshold, 0)} alert threshold. Stay hydrated and reduce heat exposure.`,
            tag: "sunnr-heat-notification-demo"
          });
          personalHeatSettingsStatus.textContent = "Demo heat alert notification sent successfully!";
        } else {
          window.alert("Please allow notifications for this website in your browser settings, then try again.");
          personalHeatSettingsStatus.textContent = "Browser notifications are not allowed yet.";
        }
      } catch (error) {
        console.error("Demo notification error:", error);
        window.alert("Unable to show the demo notification. Please check your browser settings.");
      }
    });
  }

  if (fetchHistoricalTemperatureButton) {
    fetchHistoricalTemperatureButton.addEventListener("click", async function () {
      const selectedDate = historicalDateInput ? historicalDateInput.value : "";
      if (!selectedDate) { historyFetchStatus.textContent = "Please choose a date first."; return; }
      if (selectedDate >= getCityDateString(new Date(), heatMonitoringData ? heatMonitoringData.timezone : "Asia/Yangon")) {
        historyFetchStatus.textContent = "Choose a date before today to fetch historical data."; return;
      }
      historyFetchStatus.textContent = `Fetching the daily high for ${selectedCity}...`;
      try {
        const historicalHigh = await fetchHistoricalDailyHigh(selectedDate);
        previousTemperatureInput.value = historicalHigh.toFixed(1);
        historyFetchStatus.textContent = `Loaded ${formatTemperatureWithUnit(historicalHigh)} for ${selectedCity} on ${selectedDate}.`;
      } catch (error) {
        console.error("Historical temperature error:", error);
        historyFetchStatus.textContent = error.message;
      }
    });
  }

  if (preparationRangeSelect) {
    preparationRangeSelect.addEventListener("change", function () {
      if (heatMonitoringData) displayInteractivePreparationGuide(heatMonitoringData.daily);
    });
  }

  if (calculateTemperatureChangeButton) {
    calculateTemperatureChangeButton.addEventListener("click", compareTemperatures);
  }

  // Start the dashboard
  loadDashboardPreferences();
  loadCityOptions();
  displayPersonalHeatSettings();
  updateTemperatureUnitButtons();
  getHeatMonitoringData();

  // Close the mobile navigation after a link is selected.
  const mainNavbar = document.getElementById("mainNavbar");
  const mainNavbarLinks = document.querySelectorAll("#mainNavbar .nav-link");
  if (mainNavbar && window.bootstrap) {
    mainNavbarLinks.forEach(function (navigationLink) {
      navigationLink.addEventListener("click", function () {
        if (mainNavbar.classList.contains("show")) {
          window.bootstrap.Collapse.getOrCreateInstance(mainNavbar).hide();
        }
      });
    });
  }
})();
