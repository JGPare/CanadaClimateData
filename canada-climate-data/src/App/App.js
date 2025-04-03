import ClimateMapViewModel from "./ViewModels/ClimateMapViewModel"
import ClimateMapView from "./Views/ClimateMapView"


export default class App
{
  constructor()
  {
    this.vm = new ClimateMapViewModel()
    this.view = new ClimateMapView(this.vm)
    this.loaded()
  }

  loaded()
  {
    this.vm.loaded()
  }
}