// this makes it easier to import leaflet with all it's plugins and styles
// without having to copy all these lines to the top of multiple files
import L from 'leaflet';

// plugins
import './mapsrc/plugins/L.Control.MousePosition.js'
// styles
import './mapsrc/plugins/L.Control.MousePosition.css'
import './mapsrc/leaflet.css'

export default L;