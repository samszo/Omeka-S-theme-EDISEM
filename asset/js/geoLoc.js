class Geo {
    
    constructor() {
        this.enabled = true;
        this.options = {
            enableHighAccuracy: true,
            timeout: 1000,
            maximumAge: 0
          };
    
        if ("geolocation" in navigator 
			&& (
				window.location.href.startsWith("http://127.0.0.1:5000") 
				|| window.location.href.startsWith("https")
			)) {
            this.enabled = true;
        }    
    }
    getPosition(cb) {
        if (this.enabled) {
            navigator.geolocation.getCurrentPosition(
                pos=>cb(pos.coords)
                ,err=>{
                    console.warn(`ERREUR (${err.code}): ${err.message}`);
                    cb(null);
                }
                ,this.options);
        } else
            cb(null);
    }
}