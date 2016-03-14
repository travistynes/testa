G.Utils.MessageBox.create = function(id) {
    var box = {
        mbox: $("#" + id), // jquery reference to the message container by it's id.
        messages: [],
        maxMessages: 10,
        HIGHLIGHT: 0,
        SYSTEM: 1,
        WARN: 2
    };
    
    box.init = function() {
        // Clear the target container in case it had anything in it previously.
        this.mbox.html("");
    };
    
    box.info = function(msg) {
        this.add(msg);
    };
    
    box.highlight = function(msg) {
        this.add(msg, this.HIGHLIGHT);
    };
    
    box.system = function(msg) {
        this.add(msg, this.SYSTEM);
    };
    
    box.warn = function(msg) {
        this.add(msg, this.WARN);
    };
    
    box.add = function(msg, type) {
        // Wrap message in div with settings for the message type.
        var cls = "";
        if(type === this.HIGHLIGHT) {
            cls = "message-highlight";
        } else if(type === this.SYSTEM) {
            cls = "message-system";
        } else if(type === this.WARN) {
            cls = "message-warning";
        } else {
            cls = "message";
        }
        
        var m = "<div class='" + cls + "'>" + msg + "</div><br>";
        
        // Add it to the message list.
        this.messages.push(m);
        
        // Purge old messages.
        this.purge();
        
        // Update message box display.
        var html = "";
        for(var a = 0; a < this.messages.length; a++) {
            html += this.messages[a];
        }
        
        this.mbox.html(html);
    };
    
    box.purge = function() {
        // Remove excess messages.
        if(this.messages.length > this.maxMessages) {
            this.messages.splice(0, 1);
        }
    };
    
    // Initialize before returning.
    box.init();
    
    return box;
};