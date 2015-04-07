/*
*   @type javascript
*   @name util.js
*   @copy Copyright 2015 Harry Phillips
*/

/*global define: true */

define(
    [
        'config',
        './components/events',
        './components/status',
        './components/cache'
    ],
    function (config, events, status, cache) {
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

        // returns current date as formatted string
        util.fdate = function () {
            var time = new Date(),

                year = util.zerofy(time.getFullYear(), 4),
                month = util.zerofy(time.getMonth(), 2),
                date = util.zerofy(time.getDate(), 2);

            return year + "-" + month + "-" + date;
        };

        // escapes regex meta characters from a string
        util.escapeRegEx = function (str) {
            var result;

            result =
                String(str).replace(/([\-()\[\]{}+?*.$\^|,:#<!\\])/g, '\\$1');

            result = result.replace(/\x08/g, '\\x08');

            return result;
        };
        
        // checks if obj is a Node
        util.isNode = function (obj) {
            return obj.constructor.name === "Node";
        };
        
        // checks if input is an array
        util.isArray = function (obj) {
            return obj instanceof Array || obj.constructor === "Array";
        };

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

            // escape regex meta chars from target
            // before generating a new RegEx
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

                if (!strict) {
                    return true;
                } else {
                    // return the index(es)
                    return (occs.length === 0) ? false :
                            (occs.length > 1) ? occs : occs[0];
                }
            } else if (regex.test(host)) {
                return true;
            }

            return false;
        };

        // log wrapper
        util.log = function (context, type, msg, opt) {
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
                subcontext = false,
                guistr = "",
                objstr = "",
                bffstr = "",
                ctxFlag = config.logs.contextFlag;

            // process arguments into an actual array
            for (param in arguments) {
                if (arguments.hasOwnProperty(param)) {
                    args.push(arguments[param]);
                }
            }
            
            // adjust args after context check
            function ctxArgsAdjust() {
                // adjust arg vars
                opt = msg;
                msg = type;
                type = context;
            }
            
            // check context
            if (typeof context === "string") {
                if (context.indexOf(ctxFlag) !== -1) {
                    // we have a valid context param
                    if (util.log.currentContext !== false) {
                        // we have an active context
                        // create a subcontext
                        subcontext = context.replace(ctxFlag, "");
                        context = util.log.currentContext;
                        args.shift();
                    } else {
                        // set new context
                        context = context.replace(ctxFlag, "");
                        args.shift();
                    }
                } else {
                    ctxArgsAdjust();
                    context = util.log.currentContext;
                }
            } else {
                ctxArgsAdjust();
                context = util.log.currentContext;
            }
            
            // check and process args
            if (args.length > 2) {
                // 3 params
                if (typeof msg === 'object') {
                    object = msg;
                    msg = opt;
                }
            } else if (args.length > 1) {
                // given 2 params
                if (typeof type === 'object') {
                    // not passed a type
                    // passed an object and a msg
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
                if (util.contains(filter, type, true) !== false) {
                    return;
                }
            }

            // format and push output
            str += util.ftime();
            str += " [" + (subcontext || context || config.appName) + "]";
            str += " [" + type + "]" + ":> ";
            str += msg;
            output.push(str);

            // create stringified object
            if (object) {
                objstr = "Object " + JSON.stringify(object, null, 4);
            }
            
            // write to buffer
            bffstr = str.replace(/\s/g, " ");
            bffstr = encodeURIComponent(bffstr);
            
            // should write object to buffer?
            if (config.logs.obj2buffer) {
                bffstr += (objstr !== "") ? "\n" + objstr : "";
            } else {
                bffstr += (objstr !== "") ? "\n[object omitted]" : "";
            }
            
            bffstr += "\n";
            cache.console.writeToBuffer(bffstr);
            
            // log to gui if enabled
            if (config.logs.gui && status.console) {
                guistr = str.replace(/\s/g, " ");
                
                // publish the log event with str data
                events.publish("gui/log", {
                    msg: guistr,
                    type: type,
                    obj: objstr,
                    context: context,
                    subcontext: subcontext
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
        
        // current logging context - defaults to false boolean
        util.log.currentContext = util.log.currentContext || false;
        
        // begin a continuous logging context
        util.log.beginContext = function (context) {
            if (context.indexOf(config.logs.contextFlag) !== -1) {
                util.log("error", "You shouldn't pass the context flag " +
                               "when using beginContext()");
                return;
            }
            util.log.currentContext = context;
        };
        
        // end a continuous logging context
        util.log.endContext = function () {
            util.log.currentContext = false;
        };

        util.log("+ util.js loaded");

        return util;
    }
);
