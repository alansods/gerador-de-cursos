// Simplified SCORM 1.2 API
var SCORM = {
    API: null,
    
    // Find SCORM API
    findAPI: function(win) {
        let findAttempts = 0;
        
        while (!win.API && win.parent && win.parent != win && findAttempts < 10) {
            findAttempts++;
            win = win.parent;
        }
        
        return win.API || null;
    },
    
    // Initialize SCORM
    init: function() {
        this.API = this.findAPI(window);
        
        if (this.API) {
            this.API.LMSInitialize("");
            return true;
        }
        
        return false;
    },
    
    // Set value
    setValue: function(param, value) {
        if (this.API) {
            this.API.LMSSetValue(param, value);
        }
    },
    
    // Get value
    getValue: function(param) {
        if (this.API) {
            return this.API.LMSGetValue(param);
        }
        return "";
    },
    
    // Save data
    save: function() {
        if (this.API) {
            this.API.LMSCommit("");
        }
    },
    
    // End session
    terminate: function() {
        if (this.API) {
            this.API.LMSFinish("");
        }
    }
}; 