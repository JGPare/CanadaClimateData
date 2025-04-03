import EventEmitter from '../Utility/EventEmitter'
import L from '../Utility/leafletPlugin'
import mapResources from "../Resources/mapResources"
import ClimateDataUtil from '../Utility/ClimateDataUtil'

const icons = mapResources.icons

const defaultHome = new L.latLng(50.182, -125.005);
const defaultZoom = 10
const clickModes = {
  none : "none",
  setHome : "setHome",
  setStudy : "setStudy",
}

const stationStatusOptions = {
  search : "search",
  success : "success",
  failed : "failed",
}

const defaultClickMode = clickModes.none

export default class ClimateMapViewModel extends EventEmitter
{
  constructor() 
  {
    super()
    // latLngs
    this.home = this.getLocalItem('home') ?? defaultHome
    this.study = this.getLocalItem('study') ?? null
    
    this.station = null
    this.stationStatus = stationStatusOptions.success
    
    this.zoom = this.getLocalItem('zoom') ?? defaultZoom

    this.homeMarker = null
    this.studyMarker = null
    this.stationMarker = null

    this.dataStart = "2020-01-01"
    this.dataEnd = "2025-01-01"

    this.clickMode = defaultClickMode

    this.setStationData()
  }
  
  loaded()
  {
    this.trigger('homeGot')
    this.homeMarker = this.setHome()
    this.studyMarker = this.setStudy()
    this.trigger('updatedMarkers')
  }

  setZoom(zoom)
  {
    this.zoom = zoom
    if (zoom){
      this.setLocalItem('zoom',this.zoom)
    }
  }

  setClickMode(clickMode)
  {
    this.clickMode = clickMode
  }

  click(latLng)
  {
    switch (this.clickMode) {
      case clickModes.setHome:
        this.home = latLng
        this.homeMarker = this.setHome()
        this.clickMode = defaultClickMode
        this.trigger('resetBtns')
        this.setLocalItem('home',this.home)
        break
      case clickModes.setStudy:
        this.study = latLng
        this.studyMarker = this.setStudy()
        this.clickMode = defaultClickMode
        this.updateStation()
        this.trigger('resetBtns')
        this.setLocalItem('study',this.home)
        break
      default:
          break
    }
  }

  setHome()
  {
    return this.setMarker(this.home, this.homeMarker, icons.home, () => {
      this.setLocalItem('home',this.home)
    })
  }
 
  setStudy()
  {
    return this.setMarker(this.study, this.studyMarker, icons.study, () => {
      this.updateStation()
      this.setLocalItem('study',this.study)
    })
  }

  setMarker(latLng, marker, icon, callback = null, draggable = true)
  {
    if (marker)
    {
      marker.setLatLng([latLng.lat,latLng.lng])
    }
    else {
      marker = new L.marker(latLng, {
        icon: icon,
        draggable: draggable
      })
      if (draggable)
      {
        marker.on('drag', () => { 
          this.setPointFromMarker(latLng,marker)   
        }).on('dragend', () => {
          this.trigger('updatedMarkers')
          if (callback){
            callback()
          }
        })
      }
      this.trigger('addLayer',[marker])
    }
    this.trigger('updatedMarkers')
    return marker
  }

  setPointFromMarker(point, marker)
  {
    const coords = marker.getLatLng()
    point.lat = coords.lat
    point.lng = coords.lng
  }

  goToMarker(marker, zoom=this.zoom)
  {
    if (!marker){
      return
    }
    const coords = marker.getLatLng()
    this.goTo(coords,zoom)
  }

  goTo(coords,zoom=this.zoom)
  {
    if (!coords){
      return
    }
    this.trigger('goTo',[{
      lat : coords.lat, 
      lng : coords.lng, 
      zoom: zoom}])
  }

  async setStationData()
  {
    await ClimateDataUtil.getStations()
    await this.updateStation()
  }

  async updateStation()
  {
    if (this.study){
      this.stationStatus = stationStatusOptions.search
      this.trigger('setStatus')
      const stationObj = await ClimateDataUtil.getClosestStation(this.study.lat, this.study.lng)
      if (stationObj){
        this.station = stationObj.station
        if (this.stationMarker){
          this.trigger('removeLayer',[this.stationMarker])        
        }
        this.stationMarker = L.circleMarker([this.station.lat, this.station.lng], {
          color: 'red',
          radius: 5,
        })
        this.trigger('addLayer',[this.stationMarker])
        this.trigger('updatedMarkers')
        this.stationStatus = stationStatusOptions.success
      }
      else{
        this.station = null
        this.stationStatus = stationStatusOptions.failed
      }
    }
    this.trigger('setStatus')
  }

  downloadData()
  {
    if (this.station){
      ClimateDataUtil.downloadWeatherData(this.station.id,this.dataStart, this.dataEnd)
    }
  }

  getLocalItem(itemName)
  {
    return JSON.parse(localStorage.getItem(itemName))
  }
  
  setLocalItem(itemName, item)
  {
    return localStorage.setItem(itemName, JSON.stringify(item))
  }
}
