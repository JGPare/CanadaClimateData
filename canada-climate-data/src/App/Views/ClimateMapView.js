import L from '../Utility/leafletPlugin.js';
import $ from "jquery";

// add this in for conditionals where you may want logging later to debug
const debug = true

export default class ClimateMapView
{
  constructor(mapViewModel) 
  {
    this.mapViewModel = mapViewModel    
    this.map = null

    this.getElements()

    this.mapViewModel.on('homeGot', () =>
    {
      if (this.map == null){
        this.setupMap()
      }
      this.mapViewModel.goTo(this.mapViewModel.home)
    })
  }

  getElements()
  {
    this.btnDownload = $("#download-btn")
    this.homeLat = $("#home-lat")
    this.homeLng = $("#home-lng")
    this.studyLat = $("#study-lat")
    this.studyLng = $("#study-lng")
    this.setHomeBtn = $("#set-home-btn")
    this.goHomeBtn = $("#go-home-btn")
    this.setStudyBtn = $("#set-study-btn")
    this.goStudyBtn = $("#go-study-btn")
    this.stationName = $("#station-name")
    this.stationLat = $("#station-lat")
    this.stationLng = $("#station-lng")
    this.startDate = $("#start-date")
    this.endDate = $("#end-date")
    this.statusBar = $("#status-bar")
  }


  setupMap()
  {
    console.log("setting up map");
    
    this.map = L.map('mapdiv', {
      center: this.mapViewModel.home, 
      zoom: this.mapViewModel.zoom 
    });

    this.lyrOSM = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 18,
      maxNativeZoom: 16,
      tileSize: 512,
      zoomOffset: -1,
      keepBuffer: 3,
      updateWhenIdle: false,
      updateWhenZooming: false,
    }).addTo(this.map);
    
    const fwaStreamLayer = L.tileLayer.wms('https://openmaps.gov.bc.ca/geo/pub/wms?', {
      layers: 'pub:WHSE_BASEMAPPING.FWA_STREAM_NETWORKS_SP',
      format: 'image/png',
      transparent: true,
      attribution: 'Data © Government of British Columbia'
    }).addTo(this.map);

    this.ctlMouseposition = L.control.mousePosition().addTo(this.map);
    
    this.startDate.val(this.mapViewModel.dataStart)
    this.endDate.val(this.mapViewModel.dataEnd)

    this.addEventHandles()
  }

  addEventHandles()
  {
    // MAP
    this.map.on('click',(e) => {
      const coords = e.latlng;
      this.mapViewModel.click(coords)
    });

    this.map.on('zoomend',  () => {
      this.mapViewModel.setZoom(this.getZoom())
    });

    // PAGE
    this.setHomeBtn.on('click', (e) => {
      this.setHomeBtn.addClass('selected-btn')
      this.setHomeBtn.removeClass('btn')
      this.mapViewModel.setClickMode('setHome')
    })
    this.setStudyBtn.on('click', (e) => {
      this.setStudyBtn.addClass('selected-btn')
      this.setStudyBtn.removeClass('btn')
      this.mapViewModel.setClickMode('setStudy')
    })

    this.goHomeBtn.on('click', (e) => {
      this.mapViewModel.goTo(this.mapViewModel.home)
    })

    this.goStudyBtn.on('click', (e) => {
      this.mapViewModel.goTo(this.mapViewModel.study)
    })

    this.btnDownload.on('click', (e) =>{
      this.mapViewModel.downloadData()
    })

    this.startDate.on('change', (e) => {
      this.mapViewModel.dataStart = this.startDate.val()
      console.log(this.mapViewModel.dataStart);
      
    })

    this.endDate.on('change', (e) => {
      this.mapViewModel.dataEnd = this.endDate.val()
    })

    this.homeLat.on('change', (e) => {
      this.mapViewModel.home.lat = Number(this.homeLat.val())
      this.mapViewModel.setHome()
    })
    this.homeLng.on('change', (e) => {
      this.mapViewModel.home.lng = Number(this.homeLng.val())
      this.mapViewModel.setHome()
    })
    this.studyLat.on('change', (e) => {
      this.mapViewModel.study.lat = Number(this.studyLat.val())
      this.mapViewModel.setStudy()
    })
    this.studyLng.on('change', (e) => {
      this.mapViewModel.study.lng = Number(this.studyLng.val())
      this.mapViewModel.setStudy()
    })

    // VM
    this.mapViewModel.on('addLayer',(layer) => {
      this.addLayer(layer)
    })
    
    this.mapViewModel.on('removeLayer',(layer) => {
      this.removeLayer(layer)
    })

    this.mapViewModel.on('locate', () => {
      this.map.locate({setView : true})
    })

    this.mapViewModel.on('gotTo', (params) => {
      this.goTo(params.lat, params.lng. params.zoom)
    })

    this.mapViewModel.on('updatedMarkers', () => {
      const home = this.mapViewModel.home
      const study = this.mapViewModel.study
      const station = this.mapViewModel.station      

      this.homeLat.val(home ? home.lat.toFixed(4) : 0)
      this.homeLng.val(home ? home.lng.toFixed(4) : 0)
      this.studyLat.val(study ? study.lat.toFixed(4) : 0)
      this.studyLng.val(study ? study.lng.toFixed(4) : 0)
      this.stationLat.val(station ? station.lat.toFixed(4) : 0)
      this.stationLng.val(station ? station.lng.toFixed(4) : 0)

      this.stationName.val(station ? station.name : 0)
    })

    this.mapViewModel.on('resetBtns', () => {
      this.setHomeBtn.removeClass('selected-btn')
      this.setHomeBtn.addClass('btn')
      this.setStudyBtn.removeClass('selected-btn')
      this.setStudyBtn.addClass('btn')
    })

    this.mapViewModel.on('goTo', (params) =>
    {
      this.goTo(params.lat, params.lng, params.zoom)
    })

    this.mapViewModel.on('setStatus', () => {
      const status = this.mapViewModel.stationStatus
      switch (status) {
        case 'search':
          this.statusBar.addClass('pulse-neutral')
          this.statusBar.removeClass('pulse-success')
          this.statusBar.removeClass('pulse-failed')
          break;
        case 'success':
          this.statusBar.addClass('pulse-success')
          this.statusBar.removeClass('pulse-neutral')
          this.statusBar.removeClass('pulse-failed')
          break;
        case 'failed':
          this.statusBar.addClass('pulse-failed')
          this.statusBar.removeClass('pulse-neutral')
          this.statusBar.removeClass('pulse-success')
          break;
        default:
          break;
      }
    })

  }
  
  addLayer(layer)
  {
    this.map.addLayer(layer)
  }
  
  removeLayer(layer)
  {
    this.map.removeLayer(layer)
  }

  getZoom()
  {
    return this.map.getZoom()
  }

  flyTo(lat,lng,zoom)
  {
    this.map.flyTo([lat,lng],zoom)
  }

  goTo(lat,lng,zoom)
  {
    this.flyTo(
      lat,
      lng,
      zoom
    )
  }
}