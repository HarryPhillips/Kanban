/*
*   @type javascript
*   @name util.js
*   @auth Harry Phillips
*/

window.define(['config', './events'], function (config, events) {
    'use strict';
    
    var util = {};
    
    // amend zeros to a number until a length is met
    util.zerofy = function (num, len) {
        while (num.toString().length < (len || 2)) {
            num = '0' + num;
        }

        return num;
    };
    
    // amend spaces to a string/number until a length is met
    util.spacify = function (str, len) {
        if (typeof str !== "string") {
            str = str.toString();
        }
        
        while (str.length < len) {
            str = " " + str;
        }
        
        return str;
    };

    // returns current time as formatted string
    util.ftime = function () {
        var time = new Date(),

            hours = util.zerofy(time.getHours()),
            minutes = util.zerofy(time.getMinutes()),
            seconds = util.zerofy(time.getSeconds()),
            millis = util.zerofy(time.getMilliseconds(), 3);

        return hours + ":" + minutes + ":" + seconds + "." + millis;
    };
    
    // escapes regex meta characters from a string
    util.escapeRegEx = function (str) {
        var result;

        result =
            String(str).replace(/([\-()\[\]{}+?*.$\^|,:#<!\\])/g, '\\$1');

        result = result.replace(/\x08/g, '\\x08');

        return result;
    };

    // checks if input is an array
    util.isArray = function () {};

    // returns true or the index
    util.contains = function (host, target, strict) {
        var i = 0,
            occs = [],
            regex;
        
        // default strict to false
        strict = strict || false;
        
        // if not strict - use indexOf to find substring
        if (!strict) {
            return host.indexOf(target) !== -1;
        }
        
        // escape regex meta chars from target before generating a new RegEx
        target = util.escapeRegEx(target);
        
        // regex will match whole word of target only
        regex = new RegExp("(\\W|^)" + target + "(\\W|$)");
        
        // is host an array?
        if (util.isArray(host)) {
           // add to occurences array
            while (i < host.length) {
                if (regex.test(host[i])) {
                    occs.push(i);
                }
                i += 1;
            }
            
            // return index(es)
            return (occs.length === 0) ? false :
                    (occs.length > 1) ? occs : occs[0];
        } else if (regex.test(host)) {
            return true;
        }
        
        return false;
    };

    // log wrapper
    util.log = function (type, msg, opt) {
        // check if logs are enabled
        if (!config.logs.enabled) {
            return;
        }
        
        // declarations
        var i = 0, param, args = [],
            filter = config.logs.filter,
            output = [],
            str = "",
            object = false,
            guistr = "",
            objstr = "";
        
        // process arguments into an actual array
        for (param in arguments) {
            if (arguments.hasOwnProperty(param)) {
                args.push(arguments[param]);
            }
        }
        
        // check and process args
        if (args.length > 2) {
            // given all params
            if (typeof msg === 'object') {
                object = msg;
                msg = opt;
            }
        } else if (args.length > 1) {
            // given 2 params
            if (typeof type === 'object') {
                // not passed a type
                // passed an object and an msg
                // adjust params appropriately
                object = type;
                type = "log";
            } else if (typeof msg === 'object') {
                // passed a typed object log
                object = msg;
                msg = "";
            }
        } else {
            // given 1 param
            // adjust params
            msg = type;
            type = 'log';
            
            // check if msg is object
            if (typeof msg === 'object') {
                // passed a typed object log
                object = msg;
                msg = "";
            }
        }

        // check if we need to filter the type
        if (filter) {
            // apply filter
            if (util.contains(filter, type, true)) {
                return;
            }
        }
        
        // format and push output
        str += "[" + config.appName + "] ";
        str += util.ftime();
        str += util.spacify("[" + type + "]", 8) + ":> ";
        str += msg;
        output.push(str);
        
        // log to gui if enabled
        if (config.logs.gui) {
            // convert obj to a json string for gui logging
            if (object) {
                objstr = "Object " + JSON.stringify(object, null, 4);
            }
            
            guistr = str.replace(/\s/g, "&nbsp;");
            
            events.publish("gui/log", {
                msg: guistr,
                type: type,
                obj: objstr
            });
        }
        
        // validate the type only after filter application
        // and str build to allow filtering of
        // non-standard types
        if (!window.console[type]) {
            type = "log";
        }
        
        // push object to output if exists
        if (object) {
            output.push(object);
        }

        // write outputs to console
        while (i < output.length) {
            window.console[type](output[i]);
            i += 1;
        }
    };
    
    util.log("+ util.js loaded");

    return util;
});