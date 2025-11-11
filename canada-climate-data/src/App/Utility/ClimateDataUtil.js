
import * as turf from '@turf/turf';

const maxRecurseCount = 100

export default class ClimateDataUtil 
{
  static data = {
    stations : null
  }

 // Method to get the closest station to a given latitude and longitude
 static async getClosestStation(inputLat, inputLng, ignoreIdsList = [], recurseCount = 0) {
  // Create a Turf point for the input coordinates
  const inputPoint = turf.point([inputLng, inputLat]);

  // Track the closest station and minimum distance
  let closestStation = null;
  let minDistance = Infinity;

  // Loop through all stations and calculate the distance
  this.data.stations.forEach((station) => {
    // Create a Turf point for the station coordinates
    const stationPoint = turf.point([station.lng, station.lat]);

    // Calculate the distance between the input and the station (in kilometers by default)
    const distance = turf.distance(inputPoint, stationPoint, { units: "kilometers" });

    // Check if this station is closer and not being ignored
    if (distance < minDistance && !ignoreIdsList.includes(station.climateId)) {
      minDistance = distance;
      closestStation = station;
    }
  });
  
  const stationActive = await this.stationActive(closestStation.climateId)
  if (!stationActive && recurseCount < maxRecurseCount){
    ignoreIdsList.push(closestStation.climateId)
    recurseCount++
    // use recursion to find active station
    return this.getClosestStation(inputLat, inputLng, ignoreIdsList, recurseCount)
  }

  localStorage.setItem('closestStation', JSON.stringify(closestStation))

  // Return the closest station and the distance
  return closestStation ? { station: closestStation, distance: minDistance.toFixed(2) } : null;
  }

  // does the station have daily data for the last three years
  static async stationActive(climateId)
  {    
    const stationData = await this.fetchStationPreviousYears(climateId,3)    
    return stationData.features.length > 0
  }

  // start and end date of format YYYY-MM-DD
  static async getStationDailyRain(climateId, startDate, endDate)
  {
    let dailyRain = null
    
    try {
      const data = await this.fetchWeatherData(climateId, startDate, endDate)
      if (data && data.features) {
        console.log("✅ Weather Data:", data);
      } else {
        console.log("❌ No data available or an error occurred.");
      }
    } 
    catch(err)
    {
      console.error("Error fetching weather data:", err);
    }

    return dailyRain
  }

  static fetchStationPreviousYears(climateId, years)
  {
    const endDate = new Date(); // Today's date
    const startDate = new Date();
    startDate.setFullYear(endDate.getFullYear() - years); // Go back X years (inclusive of current year)
  
    const startDateString = startDate.toISOString().split('T')[0]
    const endDateString = endDate.toISOString().split('T')[0]
    
    return this.fetchWeatherData(climateId, startDateString, endDateString);
  }
  
  static async getStations()
  {
    // using local storage, should do some cache breaking later
    let stations = JSON.parse(localStorage.getItem('weatherStations'))
    if (stations){
      console.log("fetching stations");
      
      // Await the fetchStations() call to get the resolved data
      let stationData = await this.fetchStations();
      console.log(stationData);
      
      stations = stationData.features.map((feature) => {
        return {
          climateId : feature.properties.CLIMATE_IDENTIFIER,
          id : feature.properties.STN_ID,
          name : feature.properties.STATION_NAME,
          lng : feature.geometry.coordinates[0],
          lat : feature.geometry.coordinates[1],
        }
      })
      localStorage.setItem('weatherStations', JSON.stringify(stations))
    }
    else {
      console.log("stations fetched from local storage");
    }
    this.data.stations = stations

    console.log(stations);
    
  }

  static async fetchWeatherData(climateId, startDate, endDate) {
    // Base URL for the API
    const baseUrl = "https://api.weather.gc.ca/collections/climate-daily/items";
  
    // Format the URL with provided parameters                                                                                // can | as ID|ID
    const url = `${baseUrl}?CLIMATE_IDENTIFIER=${climateId}&datetime=${startDate}/${endDate}&sortby=PROVINCE_CODE,STN_ID,LOCAL_DATE&f=json&limit=150000`;
  
    return this.fetchURL(url)
  }

  static async downloadWeatherData(climateId, startDate, endDate) {
    console.log("Download data attempt");
    
    // Base URL for the API
    const baseUrl = "https://api.weather.gc.ca/collections/climate-daily/items";
  
    // Format the URL with provided parameters                                                                                // can | as ID|ID
    const url = `${baseUrl}?CLIMATE_IDENTIFIER=${climateId}&datetime=${startDate}/${endDate}&sortby=PROVINCE_CODE,STN_ID,LOCAL_DATE&f=csv&limit=150000`;
  
    return this.fetchDownloadURL(url)
  }
  
  
  static async fetchStations() {
    // Base URL for the API

    const url = "https://api.weather.gc.ca/collections/climate-stations/items?f=json&limit=10000&PROV_STATE_TERR_CODE=BC&properties=CLIMATE_IDENTIFIER,STATION_NAME,STN_ID,LATITUDE,LONGITUDE";
    return this.fetchURL(url)
  }

  static async fetchURL(url)
  { 
    try {
      // Make the API request
      const response = await fetch(url);

      // Check for successful response
      if (!response.ok) {
        throw new Error(`Error fetching data: ${response.statusText}`);
      }

      // Parse the JSON response
      const data = await response.json();

      // Return the API response data
      return data;
    } catch (error) {
      console.error("Error:", error.message);
      return null;
    }
  }

  static async fetchDownloadURL(url)
  {
    try {
      // Make the API request
      const response = await fetch(url);
      
      // Check for successful response
      if (!response.ok) {
        throw new Error(`Error fetching data: ${response.statusText}`);
      }
      window.open(response.url);
      
    } catch (error) {
      console.error("Error:", error.message);
      return null;
    }
  }

}