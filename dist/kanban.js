(function () {/*
*   @type javascript
*   @name config.js
*   @copy Copyright 2015 Harry Phillips
*/

/*global define: true, clone: true */

define('config',[],function () {
    
    
    // self references the instantiated config class
    // pointer references the config object
    var self, pointer;
    
    // config class
    function Config(obj) {
        // set reference to this instance
        self = this;
        
        this.defaultObj = clone(obj);
        this.defaultObj.reset = this.reset;
        obj.reset = this.reset;
        
        this.obj = obj;
        pointer = this.obj;
    }
    
    // set config to default values
    Config.prototype.reset = function () {
        // iterate and check each property
        var i;
        for (i in self.obj) {
            if (self.obj.hasOwnProperty(i)) {
                // is a default prop?
                if (!self.defaultObj[i]) {
                    // this is a new prop - unset it
                    delete self.obj[i];
                }
                
                // set to default
                self.obj[i] = self.defaultObj[i];
            }
        }
    };
    
    // internal cloning function
    function clone(obj) {
        var copy,
            attr,
            len,
            i;

        // handle dates
        if (obj instanceof Date) {
            copy = new Date();
            copy.setTime(obj.getTime());
            return copy;
        }

        // handle arrays
        if (obj instanceof Array) {
            copy = [];
            len = obj.length;
            i = 0;

            // recursive copy
            for (i; i < len; i += 1) {
                copy[i] = clone(obj[i]);
            }

            return copy;
        }

        // handle objects
        if (obj instanceof Object) {
            copy = {};

            // recursive copy
            for (attr in obj) {
                if (obj.hasOwnProperty(attr)) {
                    copy[attr] = clone(obj[attr]);
                }
            }

            return copy;
        }

        // handle simple types
        if (typeof obj === "string"
                || typeof obj === "number"
                || typeof obj === "boolean") {
            copy = obj;
            return copy;
        }
    }
    
    // construct the config instance once only
    pointer = pointer || new Config({
        appName: "kbs",
        appFullname: "Kanban",
        version: "1.3.0",
        enabled: true,
        mode: "dev",
//        offline: true,
        httpToken: "Fw43Iueh87aw7",
        theme: "default",
        test: false,
        logs: {
            enabled: true,
            gui: true,
            contexts: true,
            contextFlag: "context:",
            obj2buffer: false,
            filter: false
        },
        gui: {
            enabled: true,
            autorefresh: true,
            wallpaper: "",
            parallax: {
                enabled: false,
                factor: 100
            },
            console: {
                state: "kbs-closed",
                autoscroll: true,
                icons: {
                    save: "file-text",
                    clear: "trash",
                    toggle: "terminal",
                    close: "times",
                    destroy: "unlink",
                    example: "plus-circle",
                    benchmark: "tachometer",
                    settings: "cogs",
                    expand: "caret-square-o-right",
                    toggleObjs: "list-alt"
                },
                benchmark: {
                    amount: 10000
                }
            },
            modals: {
                behaviour: {
                    modalHopping: true
                }
            }
        },
        interactor: {
            enabled: true,
            observe: false
        },
        events: {
            silent: false
        },
        cookies: {
            enabled: true,
            prefix: "__kbs_"
        },
        routes: {
            console: {
                save: "endpoint/SaveBuffer.php"
            }
        },
        tooltips: {
            save: "Save the output buffer to text file",
            clear: "Clear all logs",
            toggle: "GUI Console State",
            close: "Close the console",
            destroy: "Destroy this console instance",
            benchmark: "Run the benchmark",
            settings: "Edit Kanban settings",
            toggleObjs: "Toggle object logs display"
        }
    }).obj;
    
    // return the instance
    return pointer;
});

/*
*   @type javascript
*   @name events.js
*   @copy Copyright 2015 Harry Phillips
*/

/*jslint devel: true */

/*global define: true */

/*
*   TODO:
*   + Always pass the event name to the handler,
*     try to do this without disrupting passed parameters
*/

define('main/components/events',['config'], function (config) {
    
    
    function Events() {
        this.topics = {};
    }
    
    // subscribe/create event topic
    Events.prototype.subscribe = function (event, handler) {
        if (!this.topics[event]) {
            // create a event topic
            this.topics[event] = [];
        }
        
        // apply handler to event
        this.topics[event].push(handler);
    };
    
    // unsubscribe a handler from a topic
    Events.prototype.unsubscribe = function (event, handler) {
        var list = this.topics[event],
            object = false,
            len = list.length,
            i = 0;
        
        // not a name - we need to do object comparison
        // we shouldn't need to do deep comparison,
        // the handlers *should* refer to the same object
        // in memory
        if (typeof handler !== "string") {
            object = true;
        }
        
        // check names of all handlers
        for (i; i < len; i += 1) {
            // remove handler from array and return
            if (object) {
                if (handler === list[i]) {
                    list.splice(list.indexOf(i), 1);
                    return;
                }
            } else {
                if (list[i].name === handler) {
                    list[i].splice(list.indexOf(i), 1);
                    return;
                }
            }
        }
    };
    
    // publish event with data
    Events.prototype.publish = function (event, data) {
        if (!this.topics[event]) {
            if (!config.events.silent) {
                throw new Error("Event '" + event + "' does not exist!");
            }
            return;
        }
        
        // publish data to all event handlers
        var i;
        for (i = 0; i < this.topics[event].length; i += 1) {
            this.topics[event][i](data, event);
        }
        
        // make data an object if it isn't already so
        // so we can log it nicely
        if (typeof data !== "object") {
            data = {
                "data": data
            };
        }
    };
    
    return new Events();
});
/*
*   @type javascript
*   @name status.js
*   @copy Copyright 2015 Harry Phillips
*/

/*global define: true */

define('main/components/status',{
    app: false,
    interactor: {
        taskDetailsExpanded: false
    },
    gui: false,
    console: false,
    modal: false
});
/*
*   @type javascript
*   @name buffer.js
*   @copy Copyright 2015 Harry Phillips
*/

/*global define: true */

define('main/components/buffer',[],function () {
    
    
    var global = [];
    
    // buffer constructor
    function Buffer(predef) {
        // push to Buffer global 'global'
        global.push(predef || "");
        
        // set the index of our buffer
        this.index = global.length - 1;
    }
    
    // write a value to buffer
    Buffer.prototype.writeToBuffer = function (value) {
        // get index
        var buffer = this.index;
        
        // add to string buffer
        if (typeof global[buffer] === "string") {
            global[buffer] += value;
            return;
        }
        
        // add to array buffer
        if (global[buffer] instanceof Array) {
            global[buffer].push(value);
            return;
        }
    };
    
    // remove a value from buffer
    Buffer.prototype.removeFromBuffer = function (value) {
        var buffer = this.index,
            position;
        
        // string buffer
        if (typeof global[buffer] === "string") {
            global[buffer] = global[buffer].replace(value, "");
            return;
        }
        
        // array buffer
        if (global[buffer] instanceof Array) {
            position = global[buffer].indexOf(value);
            global[buffer].splice(position, 1);
            return;
        }
    };
    
    // return the buffer
    Buffer.prototype.getBuffer = function () {
        return global[this.index];
    };
    
    // return the global buffer
    Buffer.prototype.getGlobalBuffer = function () {
        return global;
    };
    
    // clear the buffer
    Buffer.prototype.clearBuffer = function () {
        var buffer = this.index;
        
        // nullify buffer
        global[buffer] = null;
        
        // generate new buffer
        global[buffer] = "";
    };
    
    return Buffer;
});
/*
*   @type javascript
*   @name cache.js
*   @copy Copyright 2015 Harry Phillips
*/

/*global define: true */

define('main/components/cache',['main/components/buffer'], function (Buffer) {
    
    
    // cache object
    var cache = {
        app: new Buffer(),
        console: new Buffer()
    };
    
    return cache;
});
/*
*   @type javascript
*   @name cookies.js
*   @copy Copyright 2015 Harry Phillips
*/

/*global define: true */

define('main/components/cookies',['config'], function (config) {
    
    
    // cookies class
    function Cookies() {}
    
    // get a cookie by name
    Cookies.prototype.get = function (name) {
        var cname = config.cookies.prefix + name + "=",
            cookies = document.cookie.split(';'),
            cookie,
            i;

        for (i = 0; i < cookies.length; i += 1) {
            cookie = cookies[i];

            while (cookie.charAt(0) === ' ') {
                cookie = cookie.substring(1);
            }
            
            // return contents of cookie
            if (cookie.indexOf(cname) === 0) {
                return cookie.substring(cname.length, cookie.length);
            }
        }

        return "";
    };
    
    // set a cookie
    Cookies.prototype.set = function (name, value, days) {
        var expires, date;

        if (days) {
            date = new Date();
            date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
            expires = "; expires=" + date.toGMTString();
        } else {
            expires = "";
        }

        // write cookie
        document.cookie =
            config.cookies.prefix + name +
            "=" + value + expires + "; path=/";
    };
    
    // delete a cookie
    Cookies.prototype.del = function (name) {
        this.set(name, "", -1);
    };
    
    // returns true if a cookie by name exists
    Cookies.prototype.exists = function (name) {
        var cookie = this.get(name);
        return cookie !== "" && cookie !== null && cookie !== undefined;
    };
    
    return Cookies;
});
/*
*   @type javascript
*   @name util.js
*   @copy Copyright 2015 Harry Phillips
*/

/*global define: true */

define(
    'main/components/util',[
        'config',
        'main/components/events',
        'main/components/status',
        'main/components/cache',
        'main/components/cookies',
        'main/components/buffer'
    ],
    function (
        config,
        events,
        status,
        cache,
        Cookies,
        Buffer
    ) {
        

        // util class
        function Util() {}
        
        // set instance for internal references
        var util = new Util(),
            instance;
            
        // refresh/reload the page
        Util.prototype.refresh = function (delay) {
            if (typeof delay !== "undefined") {
                setTimeout(function () {
                    location.reload();
                }, delay);
            } else {
                location.reload();
            }
        };
        
        // amend zeros to a number until a length is met
        Util.prototype.zerofy = function (num, len) {
            while (num.toString().length < (len || 2)) {
                num = '0' + num;
            }

            return num;
        };

        // amend spaces to a string/number until a length is met
        Util.prototype.spacify = function (str, len) {
            if (typeof str !== "string") {
                str = str.toString();
            }

            while (str.length < len) {
                str = " " + str;
            }

            return str;
        };

        // returns current time as formatted string
        Util.prototype.ftime = function () {
            var time = new Date(),

                hours = util.zerofy(time.getHours()),
                minutes = util.zerofy(time.getMinutes()),
                seconds = util.zerofy(time.getSeconds()),
                millis = util.zerofy(time.getMilliseconds(), 3);

            return hours + ":" + minutes + ":" + seconds + "." + millis;
        };

        // returns current date as formatted string
        Util.prototype.fdate = function () {
            var time = new Date(),

                year = util.zerofy(time.getFullYear(), 4),
                month = util.zerofy(time.getMonth(), 2),
                date = util.zerofy(time.getDate(), 2);

            return year + "-" + month + "-" + date;
        };

        // escapes regex meta characters from a string
        Util.prototype.escapeRegEx = function (str) {
            var result;
            
            // escape
            result = String(str)
                .replace(/([\-()\[\]{}+?*.$\^|,:#<!\\])/g, '\\$1')
                .replace(/\x08/g, '\\x08');

            return result;
        };
            
        // run a series/array of functions
        Util.prototype.execAll = function (array, data) {
            var i = 0,
                len = array.length;
            
            // loop and run if a function is found
            for (i; i < len; i += 1) {
                if (util.isFunction(array[i])) {
                    array[i](data);
                }
            }
        };
        
        // cookie lib
        Util.prototype.cookie = new Cookies();
        
        // checks if obj is a Node
        Util.prototype.isNode = function (obj) {
            return obj.constructor.name === "Node";
        };
        
        // checks if input is a dom element
        Util.prototype.isDomElement = function (obj) {
            return (
                (typeof window.HTMLElement === "object") ?
                        obj instanceof window.HTMLElement :
                        obj &&
                            typeof obj === "object" &&
                            obj !== null &&
                            obj.nodeType === 1 &&
                            typeof obj.nodeName === "string"
            );
        };
        
        // parse a html string into DOM element
        Util.prototype.parseHTML = function (html) {
            var element = document.createElement("div");
            element.innerHTML = html;
            return element;
        };
        
        // checks if input is a date object
        Util.prototype.isDate = function (obj) {
            if (typeof obj === "undefined") {
                return false;
            }
            return obj instanceof Date;
        };
        
        // checks if input is an array
        Util.prototype.isArray = function (obj) {
            if (typeof obj === "undefined") {
                return false;
            }
            return obj instanceof Array || obj.constructor.name === "Array";
        };
        
        // checks if input is an object
        Util.prototype.isObject = function (obj) {
            if (
                typeof obj === "undefined" ||
                    util.isArray(obj)
            ) {
                return false;
            }
            
            return obj instanceof Object;
        };
            
        // check if input is a function
        Util.prototype.isFunction = function (obj) {
            return typeof obj === "function";
        };
        
        // checks if input is a string
        Util.prototype.isString = function (obj) {
            if (typeof obj === "undefined") {
                return false;
            }
            return typeof obj === "string";
        };
        
        // checks if input is a number
        Util.prototype.isNumber = function (obj) {
            if (typeof obj === "undefined") {
                return false;
            }
            return typeof obj === "number";
        };
        
        // checks if input is a boolean (strictly of boolean type)
        Util.prototype.isBoolean = function (obj) {
            if (typeof obj === "undefined") {
                return false;
            }
            return typeof obj === "boolean";
        };
            
        // capitilise the first letter of every word in string
        // doesn't support multiple whitespaces currently
        Util.prototype.capitilise = function (string) {
            var words = string.split(" "),
                len = words.length,
                i = 0,
                ch;
            
            // make every word capitilised
            for (i; i < len; i += 1) {
                ch = words[i].charAt(0).toUpperCase();
                words[i] = ch + words[i].slice(1);
            }
            
            // return words separated by one space
            return words.join(" ");
        };

        // returns true or the index
        Util.prototype.contains = function (host, target, strict) {
            var i = 0,
                occs = [],
                regex,
                chk,
                temp;
            
            // make sure target and host are defined
            if (typeof host === "undefined" || host === "") {
                // throw an error if host is undefined
                throw new Error("Could not determine a contained value, " +
                               "haystack object is undefined!");
            }
            
            if (typeof target === "undefined" || target === "") {
                return false;
            }
            
            // checker function
            chk = function (host, target) {
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

            // default strict to false
            strict = strict || false;

            // is target an array of targets?
            if (util.isArray(target)) {
                for (i = 0; i < target.length; i += 1) {
                    temp = chk(host, target[i]);
                    if (temp !== false) {
                        return temp;
                    }
                }
            } else {
                return chk(host, target);
            }
            
            return false;
        };
        
        // swap values in array at specified indexes
        Util.prototype.swap = function (array, i, j) {
            // save array[i]
            // so we can assign to array[j]
            var tmp = array[i];
            
            // swap values
            array[i] = array[j];
            array[j] = tmp;
        };
        
        // clone an object of type Array, Object or Date
        // will also copy simple types (string, boolean etc)
        // WILL BREAK WITH CYCLIC OBJECT REFERENCES!
        Util.prototype.clone = function (obj) {
            var copy,
                attr,
                len,
                i;
            
            // handle dates
            if (util.isDate(obj)) {
                copy = new Date();
                copy.setTime(obj.getTime());
                return copy;
            }
            
            // handle arrays
            if (util.isArray(obj)) {
                copy = [];
                len = obj.length;
                i = 0;
                
                // recursive copy
                for (i; i < len; i += 1) {
                    copy[i] = util.clone(obj[i]);
                }
                
                return copy;
            }
            
            // handle objects
            if (util.isObject(obj)) {
                copy = {};
                
                // recursive copy
                for (attr in obj) {
                    if (obj.hasOwnProperty(attr)) {
                        copy[attr] = util.clone(obj[attr]);
                    }
                }
                     
                return copy;
            }
            
            // handle simple types
            if (util.isString(obj)
                    || util.isNumber(obj)
                    || util.isBoolean(obj)) {
                copy = obj;
                return copy;
            }
            
            // error if uncaught type
            util.log(
                "error",
                "Couldn't clone object of unsupported type: " +
                    typeof obj
            );
        };
        
        // merge two objects
        Util.prototype.merge = function (one, two, overwrite) {
            var i,
                exists;
            
            // loop through all two's props
            // and push into one
            for (i in two) {
                if (two.hasOwnProperty(i)) {
                    exists = typeof one[i] !== "undefined";
                    
                    if (!exists || (exists && overwrite)) {
                        if (util.isObject(two[i])) {
                            util.merge(one[i], two[i], overwrite);
                        } else {
                            one[i] = two[i];
                        }
                    }
                }
            }
            
            return one;
        };

        // serialise a data structure
        Util.prototype.serialise = function (object, json) {
            var index,
                result,
                length,
                props,
                value,
                separate = false;
            
            // default to json usage
            json = json || true;
            
            // this should capture simple types
            // e.g. strings and numbers
            result = object;
            
            // serialise object
            if (util.isObject(object)) {
                if (json) {
                    result = JSON.stringify(object);
                } else {
                    result = "{";
                    props = util.listProperties(object);
                    separate = true;

                    // add each element to result string
                    for (index in object) {
                        if (object.hasOwnProperty(index)) {
                            // add object value?
                            result += index + ":" +
                                util.serialise(object[index], json);

                            // if is last element
                            if (props.indexOf(index) === props.length - 1) {
                                separate = false;
                            }

                            // separate?
                            if (separate) {
                                result += ", ";
                            }
                        }
                    }

                    result += "}";
                }
            }
            
            // serialise array
            if (util.isArray(object)) {
                index = 0;
                length = object.length;
                result = "[";
                
                // add each element to result string
                for (index; index < length; index += 1) {
                    separate = index > 0 && index !== length;
                    
                    // need to separate?
                    if (separate) {
                        result += ", ";
                    }
                    
                    value = object[index];
                    
                    // push to result
                    if (util.isString(value)) {
                        result += "'" + value + "'";
                    } else if (util.isNumber(value)) {
                        result += value;
                    } else {
                        result += util.serialise(value, json);
                    }
                }
                     
                result += "]";
            }
            
            // wrap string with '
            if (util.isString(object)) {
                return "'" + result + "'";
            }
            
            return result;
        };
        
        // unserialise a data structure
        Util.prototype.unserialise = function (string, json) {
            var result,
                parts,
                index,
                length,
                props;
            
            // default to json usage
            json = json || true;
            
            // parse an array from string
            function parseArray(str) {
                var result = [],
                    nstruct = new RegExp(/(\[)|(\{)/g),
                    estruct = new RegExp(/(\])|(\})/g),
                    instr = false,
                    strch,
                    value = "",
                    eov,
                    len,
                    ch,
                    pch,
                    depth = 0,
                    i = 0;
                
                // clean up the string
                str = str.replace(/\s,*/g, "");
                str = str.replace(/,\s*/g, ",");
                str = str.substring(1, str.length - 1);
                
                len = str.length;
                
                // walk through string and pick up values
                do {
                    // get chars
                    pch = str.charAt(i - 1);
                    ch = str.charAt(i);
                    
                    // check if string
                    if (ch === "'" || ch === '"') {
                        if (pch !== "\\" && ch === strch) {
                            if (instr && ch === strch) {
                                instr = false;
                                strch = "";
                            } else if (!instr) {
                                instr = true;
                                strch = ch;
                            }
                        }
                    }
                  
                    // new structure - increase depth
                    if (nstruct.test(ch) && !instr) {
                        depth += 1;
                    }
                    
                    // end of structure - decrease depth
                    if (estruct.test(ch) && !instr) {
                        depth -= 1;
                    }
                    
                    // end of value flag
                    eov = ((ch === "," || estruct.test(ch))
                           && !depth
                           && !instr);
                    
                    if (eov || i === len) {
                        result.push(util.unserialise(value, json));
                        value = "";
                    } else {
                        // add char to current value
                        value += ch;
                    }
                    
                    // next char
                    i += 1;
                } while (i <= len);
                
                return result;
            }
            
            // parse an object from string (not json)
            function parseObject(str) {
                var original = str,
                    result = {},
                    index = 0,
                    wrkstr,
                    ch;
                
                // clean the string
                str = str.replace(/(:\s)/g, ":");
                str = str.replace(/(\s\{)/g, "{");
                str = str.replace(/(\{\s)/g, "{");
                str = str.replace(/(\s\})/g, "}");
                str = str.replace(/(\}\s)/g, "}");
                
                // TODO(harry): write an object parser...
                
                return result;
            }
            
            // parse a string
            function parseString(str) {
                var quote = /(')|(")/g;
                
                // get value between quotes
                if (str.charAt(0).match(quote) &&
                        str.charAt(str.length - 1).match(quote)) {
                    str = str.substring(1, str.length - 1);
                } else {
                    // assume number if no quotes
                    str = Number(str);
                }
                
                return str;
            }
            
            // this should capture simple types
            result = string;
            
            // catch numbers and already parsed values
            if (util.isNumber(string) ||
                    util.isObject(string) ||
                    util.isArray(string)) {
                return string;
            }
            
            // serialised array
            if (string.charAt(0) === "[") {
                return parseArray(string);
            }
            
            // serialised object
            if (string.charAt(0) === "{") {
                if (json) {
                    return JSON.parse(string);
                } else {
                    return parseObject(string);
                }
            }
            
            // catch uncaught strings
            if (util.isString(string)) {
                return parseString(string);
            }
            
            return result;
        };
        
        // return an array of properties on an object
        Util.prototype.listProperties = function (obj) {
            var list = [],
                index;
            
            if (!util.isObject(obj)) {
                return;
            }
            
            for (index in obj) {
                if (obj.hasOwnProperty(index)) {
                    list.push(index);
                }
            }
            
            return list;
        };
        
        // log wrapper
        Util.prototype.log = function (context, type, msg, opt) {
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
                ctxFlag = config.logs.contextFlag,
                ctxDelFlag = config.logs.contextClearFlag;

            // process arguments into an actual array
            for (param in arguments) {
                if (arguments.hasOwnProperty(param)) {
                    args.push(arguments[param]);
                }
            }
            
            // adjust args if no context
            function ctxArgsAdjust() {
                // adjust arg vars
                opt = msg;
                msg = type;
                type = context;
            }
            
            // check and process context
            if (config.logs.contexts) {
                // contexts enabled
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
                    } else if (context.indexOf(ctxDelFlag) !== -1) {
                        // we have a request to clear a context
                        // preserve the delete flag so console knows
                        args.shift();
                    } else {
                        ctxArgsAdjust();
                        context = util.log.currentContext;
                    }
                } else {
                    ctxArgsAdjust();
                    context = util.log.currentContext;
                }
            } else {
                // check if we were passed a context
                // remove it, shift and continue
                if (context.indexOf(ctxFlag) !== -1) {
                    // remove the context
                    args.shift();
                } else {
                    // adjust if no context passed
                    ctxArgsAdjust();
                }
                
                // disabled contexts
                context = false;
                subcontext = false;
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
        
        // current logging context
        Util.prototype.log.currentContext = util.log.currentContext || false;
        
        // begin a continuous logging context
        Util.prototype.log.beginContext = function (context) {
            // return if disabled
            if (!config.logs.contexts) {
                return;
            }
            
            if (context.indexOf(config.logs.contextFlag) !== -1) {
                util.log("error", "You shouldn't pass the context flag " +
                               "when using beginContext()");
                return;
            }
            
            util.log.currentContext = context;
        };
        
        // end a continuous logging context
        Util.prototype.log.endContext = function () {
            util.log.currentContext = false;
        };
        
        // clear/remove a logging context
        Util.prototype.log.clearContext = function (context) {
            events.publish("gui/contexts/clear", context);
        };
            
        // logging aliases
        Util.prototype.debug = function () {};
        Util.prototype.warn = function () {};
        Util.prototype.error = function () {};
        
        // create instance
        instance = new Util();
        util.log("+ util.js loaded");

        return instance;
    }
);

/*
*   @type javascript
*   @name repository.js
*   @copy Copyright 2015 Harry Phillips
*/

/*global define: true */

define('main/components/repository',[],function () {
    
    
    var repo = {
        
    };
    
    return repo;
});
/*
*   @type javascript
*   @name counter.js
*   @copy Copyright 2015 Harry Phillips
*/

/*global define: true */

define('main/components/counter',[],function () {
    
    
    function Counter(target, callback) {
        var value = 0,
            executed = false;
        
        this.target = target;
        this.exec = callback;
        
        Object.defineProperty(this, "count", {
            get: function () {
                return value;
            },
            set: function (newvalue) {
                value = newvalue;
                
                if (value >= target && !executed) {
                    executed = true;
                    this.exec();
                }
            }
        });
    }
    
    return Counter;
});
/*
*   @type javascript
*   @name http.js
*   @copy Copyright 2015 Harry Phillips
*/

/*global define: true */

define(
    'main/components/http',[
        'config',
        'main/components/util',
        'main/components/counter'
    ],
    function (config, util, Counter) {
        

        // instance pointer
        var self, token = config.httpToken;

        // construct a http request
        function Http(params) {
            // props
            this.url = params.url;
            this.method = params.method || "GET";
            this.async = params.async || true;
            this.data = params.data;

            // handlers
            this.callbacks = {};
            this.callbacks.success = params.success || function () {};
            this.callbacks.fail = params.fail || function () {};

            // set pointer
            self = this;

            // auto send
            if (params.send) {
                this.send(this.data);
            }
        }

        // build encoded data string
        Http.prototype.encodeData = function (data) {
            var encodedString = "",
                i;

            for (i in data) {
                if (data.hasOwnProperty(i)) {
                    encodedString += i + "=" + data[i] + "&";
                }
            }

            // append token
            if (token) {
                encodedString += "kbstoken=" + token;
            }

            return encodedString;
        };

        // send request
        Http.prototype.send = function () {
            // new request
            var xml = new XMLHttpRequest();

            // open
            xml.open(this.method, this.url, this.async);

            // set content type
            xml.setRequestHeader("Content-Type",
                                 "application/x-www-form-urlencoded");

            xml.onreadystatechange = function () {
                if (this.readyState === 4) {
                    if (this.status === 200 && this.status < 400) {
                        // success
                        util.log("debug", "HTTP 200: " + self.url);
                        self.callbacks.success(this.responseText);
                    } else {
                        // failure
                        util.log("debug", "HTTP " + this.status + ": " + self.url);
                        self.callbacks.fail(this.responseText);
                    }
                }
            };

            // send
            xml.send(self.encodeData(self.data));

            // nullify
            xml = null;
        };

        return Http;
    }
);
/*
*   @type javascript
*   @name node.js
*   @copy Copyright 2015 Harry Phillips
*/

/*global define: true */

define(
    'main/components/node',['config', 'main/components/util'],
    function (config, util) {
        
        
        // node constructor
        function Node(type, classes, id) {
            // check if passed an HTML node
            if (util.isDomElement(type)) {
                this.element = type;
            } else {
                // set props
                this.settings = {
                    type: type,
                    classes: classes,
                    id: id
                };

                // create element
                this.element = document.createElement(type);
                this.element.className = classes || "";

                if (id) {
                    this.element.id = id;
                }
            }
        }
        
        // show node
        Node.prototype.show = function () {
            this.element.style.display = "block";
        };
        
        // hide node
        Node.prototype.hide = function () {
            this.element.style.display = "none";
        };
        
        // fade in node
        Node.prototype.fadeIn = function (args) {
            if (typeof window.jQuery === "undefined") {
                this.show();
            }
            
            // jquery fade in
            window.jQuery(this.element).fadeIn(args);
        };
        
        // fade out node
        Node.prototype.fadeOut = function (args) {
            if (typeof window.jQuery === "undefined") {
                this.hide();
                return;
            }
            
            // jquery fade out
            window.jQuery(this.element).fadeOut(args);
        };
        
        // return current element id
        Node.prototype.getId = function () {
            return this.element.id;
        };
        
        // return current element classes
        Node.prototype.getClasses = function () {
            return this.element.className;
        };
        
        // return if node has a class
        Node.prototype.hasClass = function (name) {
            var i, len,
                found = false;
            
            // is there an array of names to check?
            if (util.isArray(name)) {
                len = name.length;
                for (i = 0; i < len; i += 1) {
                    if (this.element.className.indexOf(name[i]) !== -1) {
                        found = true;
                    }
                }
            } else {
                if (this.element.className.indexOf(name) !== -1) {
                    found = true;
                }
            }
            
            return found;
        };
        
        // add class(es) to node
        Node.prototype.addClass = function (classes) {
            if (this.element.className === "") {
                // no previous classes
                this.element.className = classes;
            } else {
                // add whitespace
                this.element.className += " " + classes;
            }
        };

        // remove class(es) from node
        Node.prototype.removeClass = function (classes) {
            // declarations
            var curr = this.element.className,
                newclass,
                i,
                
                remove = function (name) {
                    if (curr.indexOf(" " + name) !== -1) {
                        newclass = curr.replace(" " + name, "");
                    } else if (curr.indexOf(name + " ") !== -1) {
                        newclass = curr.replace(name + " ", "");
                    } else {
                        newclass = curr.replace(name, "");
                    }
                };
            
            // check if array or single string
            if (util.isArray(classes)) {
                // preserve current classes
                newclass = curr;
                
                // remove all classes
                for (i = 0; i < classes.length; i += 1) {
                    remove(classes[i]);
                }
            } else {
                remove(classes);
            }
            
            // set new classes
            this.element.className = newclass;
        };
        
        // set class(es) to node
        // removes all other classes
        Node.prototype.setClass = function (classes) {
            this.element.className = classes;
        };
        
        // css rule changes
        Node.prototype.css = function (rule, property) {
            var rules = rule.split("-"),
                i;
            
            // if more than one piece to rule name
            if (rules.length > 1) {
                // capitilise names after first name
                for (i = 1; i < rules.length; i += 1) {
                    rules[i] = util.capitilise(rules[i]);
                }
            }
            
            // join to form new rule
            rule = rules.join("");
            
            // set 
            this.element.style[rule] = property;
        };
        
        // get parent node
        Node.prototype.parent = function () {
            return this.element.parentNode;
        };
        
        // add a child to node
        Node.prototype.addChild = function (child) {
            // check if node is an instance of class Node
            if (child.constructor === Node || child instanceof Node) {
                this.element.appendChild(child.element);
                return;
            }
            
            // just a HTML node, append
            this.element.appendChild(child);
        };

        // create and add child to node
        Node.prototype.createChild = function (type, classes, id) {
            var child = new Node(type, classes, id);
            this.addChild(child.element);
            return child;
        };
        
        // detach from parent
        Node.prototype.detach = function () {
            this.element.parentNode.removeChild(this.element);
        };
        
        // (re)attach to parent
        Node.prototype.attach = function () {
            this.element.parentNode.appendChild(this.element);
        };
        
        // delete and reset node and it's children
        Node.prototype.destroy = function () {
            this.parent().removeChild(this.element);
            this.element = null;
        };
        
        // find a child element within our element tree
        Node.prototype.find = function (selector) {
            var nodeList = this.element.querySelectorAll(":scope > " + selector),
                len = nodeList.length,
                results = [],
                i = 0;
            
            // convert to node
            for (i; i < len; i += 1) {
                results.push(new Node(nodeList[i]));
            }
            
            return results;
        };
        
        // clone node instance and return
        Node.prototype.clone = function () {
            var clone = new Node(
                this.settings.type,
                this.getClasses(),
                this.getId()
            );
            
            // nullify the new node element and clone this
            clone.element = null;
            clone.element = this.element.cloneNode();
            
            return clone;
        };
        
        // focus on node
        Node.prototype.focus = function () {
            this.element.focus();
            return this;
        };
        
        // set attribute to node
        Node.prototype.attr = function (name, value) {
            if (typeof value === "undefined") {
                return this.element.getAttribute(name);
            }
            
            this.element.setAttribute(name, value);
            return this;
        };
        
        // write or return node text
        Node.prototype.text = function (text, clear) {
            if (typeof text === "undefined") {
                return this.element.textContent
                    || this.element.value;
            }
            
            if (clear) {
                this.element.textContent = "";
                this.element.value = "";
            }
            
            text = document.createTextNode(text);
            this.addChild(text);
            return this;
        };
        
        // set value of a node
        Node.prototype.val = function (value) {
            if (typeof value === "undefined") {
                return this.element.value;
            }
            
            this.element.value = value;
            return this;
        };
        
        // Node event listeners
        Node.prototype.on = function (event, listener) {
            this.element.addEventListener(event, listener);
            return this;
        };
        
        // write node to specified element
        // mostly used when function chaining node fn's
        Node.prototype.writeTo = function (element) {
            if (typeof element === "undefined") {
                return;
            }
            
            element.appendChild(this.element);
        };
        
        return Node;
    }
);
/*
*   @type javascript
*   @name viewloader.js
*   @copy Copyright 2015 Harry Phillips
*/

/*global define: true */

define('main/components/viewloader',['require'],function (require) {
    
    
    // view loader class
    function ViewLoader() {}
    
    // load and return a view
    ViewLoader.prototype.load = function (view, callback) {
        require(["main/views/" + view], function (mod) {
            callback(mod);
        });
    };
    
    return ViewLoader;
});
/*
*   @type javascript
*   @name modal.js
*   @copy Copyright 2015 Harry Phillips
*/

/*global define: true */

/*
*   TODO
*   + Incorporate a config object to modify how modals react to
*     multiple modals at once.
*     (e.g. Auto-closing a modal on opening
*     of another, moving modals around the screen to show more than
*     one at a time perhaps?)
*
*   + Dynamic modal event handler attachment
*
*   + Modal event fires should be done in one function call
*/

define(
    'main/ui/modal',[
        'config',
        'main/components/util',
        'main/components/events',
        'main/components/status',
        'main/components/http',
        'main/components/node',
        'main/components/viewloader'
    ],
    function (config,
        util, events,
        status, Http,
        Node, ViewLoader) {
        
        
        // event logger
        function event_log(modal, event) {
            util.log(
                "context:gui/modals",
                "log",
                "Modal '" + modal.viewName + "' " +
                    "event '" + event + "' fired"
            );
        }
        
        // global/shared variables
        var gui,
            vloader = new ViewLoader(),
            ctrl;
        
        /* ModalController Class
        ---------------------------------------------*/
        function ModalController() {
            // modal objects/arrays
            this.list = {};
            this.openModals = [];
            this.queuedModals = [];
            
            // create logging context
            this.applyContext();
            
            // create events and process queue
            // on close and destruction
            events.subscribe("gui/modal/init", event_log);
            events.subscribe("gui/modal/load", event_log);
            events.subscribe("gui/modal/open", event_log);
            events.subscribe("gui/modal/close", event_log);
            events.subscribe("gui/modal/destruct", event_log);
            events.subscribe("gui/modal/confirm", event_log);
            events.subscribe("gui/modal/proceed", event_log);
            events.subscribe("gui/modal/cancel", event_log);
            
            // queue processing
            events.subscribe(
                "gui/modal/close",
                this.processQueue.bind(this)
            );
            events.subscribe(
                "gui/modal/destruct",
                this.processQueue.bind(this)
            );
        }
        
        // apply gui/modals logging context
        ModalController.prototype.applyContext = function () {
            events.subscribe("gui/loaded", function () {
                util.log(
                    "context:gui/modals",
                    "buffer",
                    "log-buffer: GUI-MODALS"
                );
            });
        };
        
        // add a new modal instance
        ModalController.prototype.addModal = function (modal) {
            this.list[modal.viewName] = modal;
        };
        
        // remove a modal instance
        ModalController.prototype.removeModal = function (modal) {
            delete this.list[modal.viewName || modal];
        };
        
        // adds a modal to the queue
        ModalController.prototype.addToQueue = function (modal) {
            // make sure not already in queue and not open
            if (this.isQueued(modal) || this.isOpen(modal)) {
                return;
            }
            
            // close current and open recent request
            // reopen the current modal when the new one
            // is closed
            if (this.getBehaviour("modalHopping")) {
                var prevModal = this.getModalByName(this.openModals[0]),
                    handler = function () {
                        // open the previously active modal
                        prevModal.open();
                        
                        // unsubscribe from the event
                        // to prevent more than on call
                        modal.off("close", handler);
                    };
                
                // close the active modal
                prevModal.close();
                
                // open the new modal and attach
                // a close handler to reopen the prev modal
                modal.open();
                modal.on("close", handler);
                         
                return;
            }
            
            // default behaviour - queded until current modal
            // has been closed
            this.queuedModals.push(modal.viewName || modal);
        };
        
        // removes a modal from the queue
        ModalController.prototype.removeFromQueue = function (modal) {
            var array = this.queuedModals,
                index = array.indexOf(modal.viewName || modal);
            
            this.queuedModals.splice(index, 1);
        };
        
        // adds a modal to the opened modals array
        ModalController.prototype.addToOpened = function (modal) {
            this.openModals.push(modal.viewName || modal);
        };
        
        // removes a modal from the opened modals array
        ModalController.prototype.removeFromOpened = function (modal) {
            var array = this.openModals,
                index = array.indexOf(modal.viewName || modal);
            
            this.openModals.splice(index, 1);
        };
        
        // begin processing the modal queue
        ModalController.prototype.processQueue = function () {
            var opened = this.openModals,
                queued = this.queuedModals,
                modal = queued[0];
            
            // check if there are no open modals
            // and there is at least one in queue
            if (!opened.length && queued.length) {
                // get modal and init
                modal = this.getModalByName(queued[0]);
                modal.init();
                
                // remove from queue
                this.removeFromQueue(modal);
            }
        };
        
        // checks if a modal is open
        ModalController.prototype.isOpen = function (modal) {
            modal = modal.viewName || modal;
            return this.openModals.indexOf(modal) !== -1;
        };
        
        // checks if a modal is queued
        ModalController.prototype.isQueued = function (modal) {
            modal = modal.viewName || modal;
            return this.queuedModals.indexOf(modal) !== -1;
        };
        
        // returns a modal by view name
        ModalController.prototype.getModalByName = function (name) {
            return this.list[name];
        };
        
        // checks if a modal exists
        ModalController.prototype.exists = function (name) {
            var exists = false,
                modal = this.getModalByName(name);
            
            // check definition
            if (typeof modal !== "undefined" && modal !== null) {
                exists = true;
            }
            
            return exists;
        };
        
        // checks a behaviour setting
        ModalController.prototype.getBehaviour = function (name) {
            return config.gui.modals.behaviour[name];
        };
        
        // modal controller instance
        ctrl = new ModalController();
        
        /* Modal Class
        ---------------------------------------------*/
        function Modal(view, params) {
            // default params
            params = params || {init: true};
            
            // return current instance
            // if already exists
            if (ctrl.exists(view)) {
                var modal = ctrl.getModalByName(view);
                
                // check if call to init
                if (params.init) {
                    modal.init();
                }
                
                return modal;
            }
            
            // store props
            this.viewName = view;
            this.params = params;
            this.inited = false;
            this.loaded = false;
            
            // setup event
            this.createEvents();
            
            // create and hide node
            this.node = new Node("div", "kbs-modal kbs-" + view);
            this.node.hide();
            
            // view element
            this.view = null;
            
            // this should fix the 'this' refs
            // for when our methods are called
            // by external modules
            this.init = this.rInit.bind(this);
            this.open = this.rOpen.bind(this);
            this.close = this.rClose.bind(this);
            this.destroy = this.rDestroy.bind(this);
            
            // set modal event handlers
            this.applyHandlers(params);
            
            // load view and init
            params.init = params.init || true;
            this.load((params.init) ? this.init : function () {});
            
            // add modal to controller
            ctrl.addModal(this);
        }
        
        // setup and create modal events
        Modal.prototype.createEvents = function () {
            var i,
                emptyfn = function () {};
            
            // modal event names
            this.eventName = {
                init: "gui/modal/" + this.viewName + "/init",
                open: "gui/modal/" + this.viewName + "/open",
                close: "gui/modal/" + this.viewName + "/close",
                destruct: "gui/modal/" + this.viewName + "/destruct",
                load: "gui/modal/" + this.viewName + "/load",
                confirm: "gui/modal/" + this.viewName + "/confirm",
                proceed: "gui/modal/" + this.viewName + "/proceed",
                cancel: "gui/modal/" + this.viewName + "/cancel"
            };
            
            // loop through events and create them
            for (i in this.eventName) {
                if (this.eventName.hasOwnProperty(i)) {
                    events.subscribe(this.eventName[i], emptyfn);
                }
            }
        };
        
        // load view into modal
        Modal.prototype.load = function (callback) {
            var self = this,
                view;
            
            // make sure can't load twice!
            this.loaded = true;
            
            vloader.load(
                "modals/" + this.viewName,
                function (mod) {
                    // get new view
                    view = mod.createView([gui, self]);
                    
                    // set view to modal
                    self.view = view;
                    self.title = view.title;
                    
                    // publish
                    events.publish("gui/modal/load", self);
                    events.publish(self.eventName.load, self);
                    
                    // run callback
                    if (util.isFunction(callback)) {
                        callback();
                    }
                }
            );
        };
        
        // attach an event handler to modal
        Modal.prototype.on = function (event, handler) {
            try {
                events.subscribe(
                    this.eventName[event],
                    handler
                );
            } catch (e) {
                util.log(
                    "error",
                    "Modal handler attachment failed with: " +
                        e.message
                );
            }
        };
        
        // remove an event handler from modal
        Modal.prototype.off = function (event, handler) {
            try {
                events.unsubscribe(
                    this.eventName[event],
                    handler
                );
            } catch (e) {
                util.log(
                    "error",
                    "Modal handler removal failed with: " +
                        e.message
                );
            }
        };
        
        // trigger a modal event with data
        Modal.prototype.trigger = function (event, data) {
            events.publish(this.eventName[event], data);
        };
        
        // init modal
        Modal.prototype.rInit = function () {
            if (this.inited) {
                // skip build and open
                this.open();
                return;
            }
            
            // declarations
            var modal = this.node,
                title = modal.createChild(
                    "h2",
                    "kbs-modal-title"
                ),
                close = modal.createChild(
                    "i",
                    "fa fa-times kbs-modal-closed"
                ),
                content = modal.createChild(
                    "p",
                    "kbs-modal-content"
                );
            
            // set content and append to gui
            title.text(this.title);
            close.on("click", this.close);
            content.addChild(this.view);
            gui.addChild(modal);
            
            // flag inited
            this.inited = true;
            
            // publish
            events.publish("gui/modal/init", this);
            events.publish(this.eventName.init, this);
            
            // open
            this.open();
        };
        
        // handler/listener application for modal
        Modal.prototype.applyHandlers = function () {
            var
                // instance ref
                self = this,
            
                // error handler
                err = function (event) {
                    // warning
                    util.log(
                        "warn",
                        "Modal '" + self.viewName + "' " +
                            "event '" + event + "' " +
                            "ran but didn't have a handler!"
                    );
                },
                
                // modal params
                params = this.params;

            // attach modal event handlers
            this.on("confirm", params.confirm || function () {
                err("confirm");
            });
            
            this.on("cancel", params.cancel || function () {
                err("cancel");
            });

            this.on("proceed", params.proceed || function () {
                err("proceed");
            });
        };
        
        // opens the modal
        Modal.prototype.rOpen = function () {
            // if a modal is already open
            if (ctrl.openModals.length) {
                ctrl.addToQueue(this);
                return;
            }
            
            // make sure we have inited
            if (!this.inited) {
                this.init();
                return;
            }
            
            // add this modal to the open modals array
            ctrl.addToOpened(this);
            
            // show overlay and node
            gui.tree.main.overlay.fadeIn();
            this.node.fadeIn();
            
            // publish
            events.publish("gui/modal/open", this);
            events.publish(this.eventName.open, this);
        };
        
        // closes the modal
        Modal.prototype.rClose = function () {
            // hide overlay and node
            gui.tree.main.overlay.hide();
            this.node.hide();
            
            // remove from controller opened modals
            ctrl.removeFromOpened(this);
            
            // publish
            events.publish("gui/modal/close", this);
            events.publish(this.eventName.close, this);
        };
        
        // destroys a modal instance
        Modal.prototype.rDestroy = function () {
            // check if open
            if (ctrl.isOpen(this)) {
                this.rClose();
            }
            
            // reset inited flag
            this.inited = false;
            
            // remove from ctrl modal array
            ctrl.removeModal(this);
            
            // publish
            events.publish("gui/modal/destruct", this);
            events.publish(this.eventName.destruct, this);
        };
        
        // set gui instance
        Modal.prototype.setInstance = function (instance) {
            gui = instance;
        };
        
        // get controller instance
        Modal.prototype.getController = function () {
            return ctrl;
        };
        
        return Modal;
    }
);

/*
*   @type javascript
*   @name configurator.js
*   @copy Copyright 2015 Harry Phillips
*/

/*global define: true */

define(
    'main/components/configurator',[
        "config",
        "main/components/util",
        "main/ui/modal"
    ],
    function (config, util, Modal) {
        

        var self, modded = {};
        
        // configurator class
        function Configurator() {
            self = this;
            this.modal = null;
            this.launchModal = this.rLaunchModal.bind(this);
        }
        
        // get user config object from cookie
        Configurator.prototype.getUserData = function () {
            var cookie = util.cookie.get("settings"),
                data = util.unserialise(cookie);
            
            return data || {};
        };
        
        // get user config object string
        Configurator.prototype.getUserCookie = function () {
            return util.cookie.get("settings");
        };
        
        // get formatted user config object string
        Configurator.prototype.getFormattedUserCookie = function () {
            return JSON.stringify(modded, null, 4);
        };
        
        // check for and load existing user config data
        Configurator.prototype.loadExisting = function () {
            var data = this.getUserData(),
                parsed;
            
            if (data) {
                util.log("loading existing user config");
                modded = data;
                util.merge(config, data, true);
                return;
            }
        };
        
        // return list of modified properties
        Configurator.prototype.modifiedProperties = function () {
            var list = [],
                prop;
            
            // form an array of prop names
            for (prop in modded) {
                if (modded.hasOwnProperty(prop)) {
                    list.push(prop);
                }
            }
            
            return list;
        };
        
        // launch the configurator ui
        Configurator.prototype.rLaunchModal = function () {
            // initialise the modal
            if (this.modal) {
                this.modal.init();
            } else {
                this.modal = new Modal("userConfig", {init: true});
            }
        };

        // finds a config setting from a selector string e.g. "gui/console/state"
        // will get config.gui.console.state
        Configurator.prototype.get = function (selector) {
            var i = 0,
                segments = selector.split("/"),
                value = config,
                len = segments.length;

            // iterate through segments
            for (i; i < len; i += 1) {
                // get segment value
                value = value[segments[i]];
            }

            return value;
        };

        // set/create a config value
        Configurator.prototype.set = function (selector, value) {
            var segments = selector.split("/"),
                len = segments.length,
                got = config,
                i = 0,
                tree = modded,
                parent,
                parentName;

            // if a simple selector
            if (len === 1) {
                // update config
                config[selector] = value;
                
                // update mofified prop list
                modded[selector] = value;
                
                // update user prefs cookie
                util.cookie.set(
                    "settings",
                    util.serialise(modded)
                );
                
                return config[selector];
            }

            // more complex selector build tree to
            // target value and get reference to parent
            // config object
            for (i; i < len; i += 1) {
                // if second to last segment, set as parent ref
                if (i === len - 2) {
                    parent = got[segments[i]];
                    parentName = segments[i];
                }
                
                // set ref for next loop
                got = got[segments[i]];
                
                // build tree for merging with config
                if (i !== len - 1) {
                    tree[segments[i]] = tree[segments[i]] || {};
                    tree = tree[segments[i]];
                } else {
                    tree[segments[i]] = value;
                }
            }

            // set values in config, modified
            // prop list and user cookie
            
            // set value to config config
            parent[segments[len - 1]] = value;
            
            // update user prefs cookie
            util.cookie.set(
                "settings",
                util.serialise(modded)
            );
            
            return parent[segments[len - 1]];
        };

        // reset config to default state
        Configurator.prototype.reset = function () {
            // reset config object
            config.reset();
            
            // delete user settings cookie
            util.cookie.del("settings");
            
            // refresh page
            location.reload();
        };

        return Configurator;
    }
);

/*
*   @type javascript
*   @name bugherd.js
*   @copy Copyright 2015 Harry Phillips
*/

/*global define: true */

/*jslint nomen: true*/

define(
    'main/components/bugherd',[
        'config',
        'main/components/util',
        'main/components/cache',
        'main/components/status',
        'main/components/node'
    ],
    function (config, util, cache, status, Node) {
        
        
        // bugherd's global api
        var bh = window.bugherd,
            $ = window.jQuery,
            interactor,
            gui;
        
        /* Class Definitions
        ------------------------------------------*/
        // task api controller
        function TaskController(base) {
            this.api = bh.application.tasksCollection;
            this.baseApi = base;
            this.setSeverityStyle = this.rSetSeverityStyle.bind(this);
            this.setAllSeverityStyles = this.rSetAllSeverityStyles.bind(this);
            this.periodicallySetSeverityStyles = this.rPeriodicallySetSeverityStyles.bind(this);
        }
        
        // bugherd api wrapper
        function BugHerd(interInstance, guiInstance) {
            // set instances
            interactor = interInstance;
            gui = guiInstance;
            
            this.api = bh;
            this.tasks = new TaskController(this);
        }
        
        /* TaskController Prototype
        ------------------------------------------*/
        TaskController.prototype.init = function () {
            // setup task event listeners
            this.applyHandlers();
            this.periodicallySetSeverityStyles();
        };
        
        TaskController.prototype.applyHandlers = function () {
            // event logger
            var
                self = this,
                bh = this.baseApi,
                
                // event logging
                eventLog = function (task, type, msg) {
                    // pull attributes
                    var user = task.attributes.requester_name,
                        id = task.attributes.local_task_id,
                        
                        // status
                        prevStatusId = task._previousAttributes.status_id,
                        statusId = task.attributes.status_id,
                        prevStatus = bh.getStatusFromId(prevStatusId),
                        status = bh.getStatusFromId(statusId),
                        
                        // severity
                        severityId = task.attributes.priority_id,
                        severity = bh.getPriorityFromId(severityId),
                        
                        message;

                    // format message with values
                    message = msg.replace("${user}", user);
                    message = message.replace("${id}", id);
                    message = message.replace("${prevStatus}", prevStatus);
                    message = message.replace("${status}", status);
                    message = message.replace("${severity}", severity);
                    
                    util.log(
                        "context:bugherd",
                        type,
                        task,
                        message
                    );

                    // set the recent task
                    cache.RECENT_TASK = task;
                };
            
            // task creation
            this.on("add", function (event) {
                eventLog(
                    event,
                    "okay",
                    "Task '#${id}' created by '${user}'"
                );
            });
            
            // task deletion
            this.on("remove", function (event) {
                eventLog(
                    event,
                    "warn",
                    "Task '#${id}' was deleted"
                );
                
                // if task is expanded
                if (status.interactor.taskDetailsExpanded) {
                    // task is deleted task
                    if (parseInt(interactor.activeTask, 10) === event.attributes.local_task_id) {
                        interactor.closeTask();
                    }
                }
            });
            
            // on task refresh
            this.on("refresh", function (event) {
                eventLog(
                    event,
                    "info",
                    "Task '#${id}' refreshed"
                );
                
                self.setSeverityStyle(event.attributes.id);
            });
            
            // task status updates
            this.on("change:status_id", function (event) {
                eventLog(
                    event,
                    "info",
                    "Task '#${id}' moved from " +
                        "'${prevStatus}' to '${status}'"
                );
                
                self.setSeverityStyle(event.attributes.id);
            });
            
            // task severity updates
            this.on("change:priority_id", function (event) {
                eventLog(
                    event,
                    "info",
                    "Task '#${id}' set to '${severity}'"
                );
                
                self.setSeverityStyle(event.attributes.id);
            });
        };
        
        // apply a handler to a bugherd task event
        TaskController.prototype.on = function (event, handler) {
            this.api.on(event, handler);
        };
        
        // apply a tasks severity style to its body
        TaskController.prototype.rSetSeverityStyle = function (task) {
            var severity;
            
            task = new Node(document.querySelector("#task_" + task));
            severity = task.find(".task-severity");
            
            if (severity.length) {
                severity = severity[0]
                    .element
                    .className
                    .replace("task-severity", "")
                    .replace(/\s/g, "");

                task.addClass(severity);
            }
        };
        
        // apply severity styles to all tasks
        TaskController.prototype.rSetAllSeverityStyles = function () {
            var tasks = document.querySelectorAll(".task"),
                len = tasks.length,
                i = 0,
                id;
            
            for (i; i < len; i += 1) {
                id = tasks[i].id.replace("task_", "");
                
                if (id) {
                    this.setSeverityStyle(id);
                }
            }
        };
        
        // periodically apply severity styles to all tasks
        TaskController.prototype.rPeriodicallySetSeverityStyles = function () {
            var first = true,
                count = $(".task").length,
                sortId = bh.application.attributes.sortAttribute,
                self = this,
                loop = function () {
                    var newCount = $(".task").length,
                        newSortId = bh.application.attributes.sortAttribute;
                    
                    // if new or old tasks
                    if (newCount !== count || newSortId !== sortId || first) {
                        self.setAllSeverityStyles();
                        first = false;
                    }
                    
                    setTimeout(loop, 1000);
                };
            
            loop();
        };
        
        /* BugHerd Prototype
        ------------------------------------------*/
        // init the bugherd api wrapper
        BugHerd.prototype.init = function () {
            this.tasks.init();
            this.applyContext();
            this.applyHandlers();
        };
        
        // apply handlers/listeners
        BugHerd.prototype.applyHandlers = function () {
            
        };
        
        // apply bugherd api logging context
        BugHerd.prototype.applyContext = function () {
            util.log(
                "context:bugherd",
                "buffer",
                "log-buffer: BUGHERD-API"
            );
        };
        
        // apply a handler to bugherd taskCollection event
        BugHerd.prototype.on = function (event, handler) {
            bh.application.on(event, handler);
        };
        
        // returns status name from id
        BugHerd.prototype.getStatusFromId = function (id) {
            var status,
                map = {
                    "null": "feedback",
                    "0": "backlog",
                    "1": "todo",
                    "2": "doing",
                    // obviously 3 was set free
                    "4": "done",
                    "5": "archive"
                };
            
            return map[id];
        };
        
        // returns priority/severity name from id
        BugHerd.prototype.getPriorityFromId = function (id) {
            var priority,
                map = {
                    "0": "not set",
                    "1": "critical",
                    "2": "important",
                    "3": "normal",
                    "4": "minor"
                };
            
            return map[id];
        };
        
        // returns all tasks for the current project
        BugHerd.prototype.tasks = function () {
            return bh.application.tasksCollection.models;
        };
        
        return BugHerd;
    }
);
/*
*   @type javascript
*   @name router.js
*   @copy Copyright 2015 Harry Phillips
*/

/*global define: true */

define('main/components/router',['config'], function (config) {
    
    
    return {
        // return a route to a component controller
        getRoute: function (component, fn) {
            return window.KBS_BASE_URL + config.routes[component][fn];
        }
    };
});
/*
*   @type javascript
*   @name console.js
*   @copy Copyright 2015 Harry Phillips
*/

/*global define: true */

define(
    'main/ui/console',[
        'config',
        'main/components/util',
        'main/components/events',
        'main/components/http',
        'main/components/status',
        'main/components/router',
        'main/components/cache',
        'main/components/node',
        'main/components/configurator',
        'main/ui/modal'
    ],
    function (
        config,
        util,
        events,
        Http,
        status,
        router,
        cache,
        Node,
        Configurator,
        Modal
    ) {
        
            
        // instance pointers
        var self, gui,
            configurator;
        
        // console constructor
        function Console(instance) {
            // check if gui logging is enabled
            if (!config.logs.gui) {
                return;
            }
            
            // set a self pointer to this
            self = this;
            
            // make sure we have a gui instance
            if (typeof instance === "undefined") {
                throw new Error("No GUI instance passed to Console");
            }
            
            // set gui and build the tree
            gui = instance;
            this.buildNodeTree();
            
            // log contexts
            this.setContexts();
            
            // setup context clearance event
            events.subscribe("gui/contexts/clear", function (context) {
                self.clearContext(context);
            });
            
            // update console status
            events.publish("kbs/status", {
                component: "console",
                status: true
            });
        }
        
        // console logging contexts
        Console.prototype.setContexts = function () {
            // make sure not to overwrite existing
            if (this.contexts) {
                return;
            }
            
            // set log context array
            this.contexts = {
                def: self.wrapper.cons.out.element
            };
        };
        
        // get a logging context
        Console.prototype.getContext = function (context) {
            if (!config.logs.contexts) {
                return this.contexts.def;
            }
            
            return this.contexts[context];
        };
        
        // add a logging context
        Console.prototype.createContext = function (context, element) {
            // return if disabled
            if (!config.logs.contexts) {
                return;
            }
            
            // declarations
            var logContext;
            
            // make sure not already defined
            if (this.contexts[context]) {
                util.log("error", "Log context: '" + context +
                         "' is already defined");
            }
            
            if (util.isNode(element)) {
                logContext = element.createChild("div", "kbs-log-context", context);
            } else {
                // manually append new Node
                logContext = new Node("div", "kbs-log-context", "kbs-ctx-" + context);
                element.appendChild(logContext.element);
            }
            
            // apply to global contexts
            this.contexts[context] = logContext.element;
            
            return element;
        };
            
        // clear/remove a logging context
        Console.prototype.clearContext = function (context) {
            var index;
            
            // don't allow clearing of def context
            if (context === "def") {
                return;
            }
            
            delete self.contexts[context];
        };
        
        // console output
        Console.prototype.write = function (args) {
            // declarations
            var context = self.getContext("def"),
                contextParent,
                
                log = new Node("div", "kbs-log-node kbs-" + args.type),
                txt = document.createTextNode(args.msg),
                
                objwrap = new Node("pre", "kbs-object"),
                objexp = new Node("i", "fa fa-" +
                      self.getIcon("expand") +
                      " kbs-object-expand"),
                objtxt,
                
                doCreateContext = false,
                i = 0;
            
            // check for context param
            if (args.context) {
                if (args.subcontext) {
                    // check if subcontext exists
                    if (self.getContext(args.subcontext)) {
                        context = self.getContext(args.subcontext);
                    } else {
                        context = self.getContext(args.context);
                        doCreateContext = args.subcontext;
                    }
                } else {
                    // get or create new context
                    if (self.getContext(args.context)) {
                        context = self.getContext(args.context);
                    } else {
                        // write log then create context with its node
                        doCreateContext = args.context;
                    }
                }
            }

            // write message to log node
            log.addChild(txt);
            
            // write object to log node
            if (args.obj) {
                objtxt = document.createTextNode(args.obj);
                
                // object node expansion
                objexp.element.onclick = function (event) {
                    // elements
                    var btn = event.target,
                        parent = btn.parentNode;
                    
                    // check state
                    if (util.contains(
                            parent.className,
                            "kbs-expand"
                        )) {
                        // shrink
                        parent.className =
                            parent.className.replace(" kbs-expand", "");
                        
                        btn.className =
                            btn.className.replace(" kbs-rotate", "");
                    } else {
                        // expand
                        parent.className += " kbs-expand";
                        btn.className += " kbs-rotate";
                    }
                };
                
                objwrap.addChild(objexp.element);
                objwrap.addChild(objtxt);
                log.addChild(objwrap.element);
            }
            
            // check if test node within exec node
            if (context.parentNode) {
                contextParent = context.parentNode.className;
                if ((args.type.match(/(test)|(buffer)/)) &&
                        util.contains(contextParent, "kbs-exec")) {
                    log.addClass("kbs-log-closed");
                }
            }
                
            // write to context
            context.appendChild(log.element);
            
            // create context with new log node
            // if set to create
            if (doCreateContext) {
                self.createContext(doCreateContext, log.element);
            }

            // scroll to log
            self.scrollToElement(log.element);
        };
        
        // create toolbar widget
        Console.prototype.createTool = function (tool) {
            var toolbar = this.wrapper.constools,
                icon;
            
            if (typeof toolbar === "undefined") {
                throw new Error("Could not create new tool, no toolbar!");
            }

            icon = this.getIcon(tool);
            toolbar[tool] = toolbar.createChild(
                "i",
                "fa fa-" + icon + " kbs-tool kbs-" + tool
            );
            toolbar[tool].element.title = config.tooltips[tool] || "";

            return toolbar[tool];
        };
        
        // get toolbar widget icon from config
        Console.prototype.getIcon = function (tool) {
            return config.gui.console.icons[tool] || "plus";
        };
        
        // open console
        Console.prototype.open = function () {
            self.wrapper.removeClass("kbs-closed");
            self.wrapper.addClass("kbs-open");
        };
        
        // close console
        Console.prototype.close = function () {
            self.wrapper.removeClass("kbs-open");
            self.wrapper.addClass("kbs-closed");
        };
        
        // scrolls to an element inside the console
        Console.prototype.scrollToElement = function (element) {
            // scroll to element in console
            var cons = self.wrapper.cons.element;
            cons.scrollTop = element.offsetTop;
        };
            
        // toggle object logs
        Console.prototype.toggleObjectLogs = function () {
            var objs = document.querySelectorAll(".kbs-object"),
                displayed,
                len = objs.length,
                i = 0;

            // hide the nodes
            for (i; i < len; i += 1) {
                displayed = objs[i].style.display !== "none";
                objs[i].style.display = (displayed) ? "none" : "block";
            }
        };
         
        // clear output
        Console.prototype.clear = function () {
            var cons = self.wrapper.cons.element,
                out = self.wrapper.cons.out.element,
                start = new Date().getTime(),
                deltaTime,
                count = 0;

            // detach
            cons.removeChild(out);

            // remove all logs
            while (out.firstChild) {
                count += 1;
                out.removeChild(out.firstChild);
            }

            // reattach
            cons.appendChild(out);
            
            // bench
            deltaTime = new Date().getTime() - start;
            util.log("okay", "cleared " + count + " logs in " + deltaTime + " ms");
            
            // clear buffer
            cache.console.clearBuffer();
        };
        
        // save the output buffer to a text file on the local system
        Console.prototype.save = function (filename) {
            // declarations
            var time = util.ftime(),
                date = util.fdate(),
                buffer = cache.console.getBuffer(),
                req;
            
            util.log.beginContext("log/save");
            util.log("info", "saving log buffer...");
            
            // setup request
            req = new Http({
                url: router.getRoute("console", "save"),
                method: "POST",
                send: true,
                data: {
                    type: "log",
                    date: date,
                    buffer: buffer
                },
                success: function (response) {
                    util.log("context:log/save", "okay", response);
                    util.log.endContext();
                    util.log.clearContext("log/save");
                }
            });
        };
        
        // destroy console instance (irreversible)
        Console.prototype.destroy = function () {
            var
                modalTitle = "Destroy the Console instance?",
                modalMsg = "Confirm destruction of the GUI Console? ",
                modal = new Modal("destructConsole", {
                    init: true,
                    confirm: function () {
                        var parent = self.wrapper.cons.parent(),
                            child = self.wrapper.cons.element;
                        
                        // destroy console node
                        parent.removeChild(child);
                        
                        // set console status
                        status.console = false;
                        
                        // clear the log buffer
                        cache.console.clearBuffer();
                        
                        // add disabled class to cons-box
                        self.wrapper.addClass("kbs-disabled");
                        
                        // destroy the modal
                        modal.destroy();
                    },
                    cancel: function () {
                        modal.destroy();
                    }
                });
        };
        
        // build the console
        Console.prototype.buildNodeTree = function () {
            // declarations
            var
                connection = (window.KBS_BASE_URL.indexOf("localhost") !== -1) ?
                        "local" : "remote",
            
                // console nodes
                wrapper,
                consclass,
                constools,
                constitle,
                titlenode,
                cons,
                consout,
                consicon,
                
                cfgmodal;

            // console wrapper
            consclass = "kbs-cons-box " + config.gui.console.state;
            this.wrapper = wrapper = gui.createChild("div", consclass);
            
            if (!config.logs.enabled) {
                wrapper.addClass("kbs-disabled");
            }

            // console toolbar
            constools = wrapper.constools =
                wrapper.createChild("div", "kbs-cons-toolbar");

            // add a title to the toolbar
            constitle = constools.constitle =
                constools.createChild("div", "kbs-cons-title");

            titlenode = document.createTextNode(config.appFullname +
                    " v" + config.version + " - " + connection);
            constitle.addChild(titlenode);
            
            // tools for console
            if (config.logs.enabled) {
                // console toggle state tool
                this.createTool("toggle")
                    .element.onclick = function () {
                        var closed = wrapper.hasClass("kbs-closed"),
                            full = wrapper.hasClass("kbs-full");

                        // if not closed and not full screen
                        if (!closed && !full) {
                            // make full screen
                            wrapper.addClass("kbs-full");
                        }

                        // if in full screen
                        if (full) {
                            // shrink
                            wrapper.removeClass("kbs-full");
                        }

                        // if closed
                        if (closed) {
                            // open
                            self.open();
                        }
                    };
                
                // save tool - only on localhost base url's
                if (window.KBS_BASE_URL.indexOf("localhost") !== -1) {
                    this.createTool("save").on(
                        "click",
                        self.save
                    );
                }
                
                // benchmark tool
                this.createTool("benchmark").on(
                    "click",
                    self.benchmark
                );
                
                // toggle object log tool
                this.createTool("toggleObjs").on(
                    "click",
                    self.toggleObjectLogs
                );
                
                // console destructor tool
                this.createTool("destroy").on(
                    "click",
                    self.destroy
                );
                
                // clear tool
                this.createTool("clear").on(
                    "click",
                    self.clear
                );
            }
            
            // configurator tool
            configurator = new Configurator();
            this.createTool("settings").on(
                "click",
                configurator.launchModal
            );
            
            // if logs enabled, add a close tool
            if (config.logs.enabled) {
                // close tool
                this.createTool("close").on(
                    "click",
                    self.close
                );
            }
                
            // console
            wrapper.cons = cons =
                wrapper.createChild("div", "kbs-cons");
            
            // check if logs are disabled
            if (!config.logs.enabled) {
                // disable console
                cons.hide();
            }

            // console output
            consout = cons.out = cons.createChild("div", "kbs-cons-out");

            // return wrapper element
            return wrapper;
        };
            
        // benchmarks the generation of log nodes
        Console.prototype.benchmark = function () {
            var cons = self.wrapper.cons.element,
                out = self.wrapper.cons.out.element,
                amount = config.gui.console.benchmark.amount,
                start = new Date().getTime(),
                deltaTime,
                deltaSpeed,
                result,
                i = 0;

            // new benchmark context
            util.log("context:benchmark", "exec", "executing benchmark...");
            util.log.beginContext("benchmark");
            
            // detach
            cons.removeChild(out);
            
            // log specified amount
            util.log("context:benchmark/output", "buffer", "benchmark output...");
            while (i <= amount) {
                util.log("context:benchmark/output", "debug", "log #" + i);
                i += 1;
            }

            // reattach
            cons.appendChild(out);

            // get results
            deltaTime = new Date().getTime() - start;
            deltaSpeed = Math.floor(amount / deltaTime * 1000);
            result = "Logged " + amount + " messages in " + deltaTime + "ms";
            
            // log delta time
            util.log(
                "context:benchmark",
                "okay",
                result
            );
            
            // log delta speed
            util.log(
                "okay",
                deltaSpeed + " logs per second."
            );
            
            // clear the benchmark context
            util.log.endContext();
            self.clearContext("benchmark");
        };
        
        return Console;
    }
);
/*
*   @type javascript
*   @name gui.js
*   @copy Copyright 2015 Harry Phillips
*/

/*jslint devel: true */

/*global define: true */

define(
    'main/ui/gui',[
        'config',
        'main/components/util',
        'main/components/events',
        'main/components/counter',
        'main/components/configurator',
        'main/components/node',
        'main/ui/console',
        'main/ui/modal'
    ],
    function (
        config,
        util,
        events,
        Counter,
        Configurator,
        Node,
        Console,
        Modal
    ) {
        

        // instance pointer
        var self,
            configurator = new Configurator();

        util.log("+ gui.js loaded");

        // gui constructor
        function GUI() {
            // set pointer
            self = this;

            // pass our instance to Modal closure
            Modal.prototype.setInstance(this);
            
            // modals api
            this.setModalApi();
            
            // tree and console
            this.tree = this.buildNodeTree();
            this.console = new Console(this);

            // init
            this.init();

            // update gui status
            events.publish("kbs/status", {
                component: "gui",
                status: true
            });
        }

        // initialise gui
        GUI.prototype.init = function () {
            var
                // loader
                loader = new Counter((config.offline) ? 2 : 3, function () {
                    events.publish("gui/loaded");
                }),

                // create link elements
                mainlink = document.createElement("link"),
                themelink = document.createElement("link"),
                falink = document.createElement("link"),

                // create urls
                mainurl = window.KBS_BASE_URL +
                "css/main.css",

                themeurl = window.KBS_BASE_URL +
                "css/themes/" + (config.theme || "default") + ".css",

                faurl = "//maxcdn.bootstrapcdn.com/font-awesome/" +
                "4.3.0" +
                "/css/font-awesome.min.css",

                // attach gui element and publish loaded event
                publish = function () {
                    // attach gui when styles have loaded
                    document.body.appendChild(self.tree.main.element);
                    util.log("context:gui/init", "+ attached gui tree");

                    // run event listeners
                    self.runEventListeners();
                    
                    // attach wallpaper
                    self.loadWallpaper();

                    // publish the loaded event
                    events.publish("kbs/loaded");
                };

            // events setup
            if (config.gui.enabled) {
                // gui logging
                if (config.logs.gui) {
                    events.subscribe("gui/log", this.console.write);
                }

                // gui load event listener
                events.subscribe("gui/loaded", publish);
            }

            // props
            mainlink.rel = "stylesheet";
            themelink.rel = "stylesheet";
            falink.rel = "stylesheet";

            mainlink.href = mainurl;
            themelink.href = themeurl;
            falink.href = faurl;
            
            themelink.id = "kbs-theme-link";

            // gui init log context
            util.log("context:gui/init", "info", "Initialising GUI...");

            // main css link events
            mainlink.onload = function () {
                util.log("context:gui/init", "+ main.css loaded");
                loader.count += 1;
            };

            mainlink.onerror = function () {
                loader.count += 1;
                throw new Error("main.css failed to load!");
            };

            // theme css link events
            themelink.onload = function () {
                var themename = self.getThemeName();
                
                util.log("context:gui/init", "+ theme '" + themename + "' loaded");
                loader.count += 1;
            };

            themelink.onerror = function () {
                loader.count += 1;
                util.log("error", "theme '" +
                                self.getThemeName() +
                                "' failed to load!");
            };

            // font-awesome css link events
            falink.onload = function () {
                util.log("context:gui/init", "+ font-awesome.css loaded");
                loader.count += 1;
            };

            falink.onerror = function () {
                loader.count += 1;
                throw new Error("font-awesome.css failed to load!");
            };

            // write out to document
            if (!config.offline) {
                document.head.appendChild(falink);
            }
            document.head.appendChild(mainlink);
            document.head.appendChild(themelink);
        };
            
        // return current theme name or theme name from url
        GUI.prototype.getThemeName = function (url) {
            var themelink = document.getElementById("kbs-theme-link"),
                name = url || themelink.href;
            
            name = name.replace(
                window.KBS_BASE_URL +
                    "css/themes/",
                ""
            );
            
            name = name.replace(".css", "");
            
            return name;
        };
            
        // return to configured theme
        GUI.prototype.resetTheme = function () {
            self.loadTheme(config.theme || "theme");
        };
            
        // set theme
        GUI.prototype.loadTheme = function (theme) {
            var themelink = document.getElementById("kbs-theme-link"),
                node = new Node(themelink);
            
            // remove .css if found
            theme = theme.replace(".css", "");
            
            // set theme
            node.attr(
                "href",
                window.KBS_BASE_URL +
                    "css/themes/" + theme + ".css"
            );
            
            // update config
            configurator.set("theme", theme);
        };
            
        // remove current theme
        GUI.prototype.unloadTheme = function () {
            var themelink = document.getElementById("kbs-theme-link"),
                node = new Node(themelink);
            
            node.attr("href", "");
        };
            
        // load wallpaper
        GUI.prototype.loadWallpaper = function (url) {
            var el = new Node(document.getElementById("kanbanBoard"));
            
            url = url || config.gui.wallpaper;
            url = "url('" + url + "')";
            
            el.css("background-image", url);
        };

        // build gui node tree
        GUI.prototype.buildNodeTree = function () {
            // create tree and nodes
            var tree = {}, main;

            // create nodes
            tree.main = main = new Node("div", "kbs-gui");
            main.overlay = main.createChild("div", "kbs-overlay");

            return tree;
        };

        // run event listeners
        GUI.prototype.runEventListeners = function () {
            util.log("context:gui/init", "+ running event listeners");
            
            // handle log node of type 'exec' clicks
            var out = this.console.wrapper.cons.out.element,
                current,
                togglables;

            // set togglables based on context state
            togglables = (config.logs.contexts) ?
                    [
                        "kbs-exec",
                        "kbs-test",
                        "kbs-buffer"
                    ] : "";

            // bind a click handler to the console out
            out.onclick = function (event) {
                current = new Node(event.target);
                if (current.hasClass(togglables)) {
                    if (!current.hasClass("kbs-log-closed")) {
                        // we need to close the block
                        current.addClass("kbs-log-closed");
                    } else {
                        // we need to open the block
                        current.removeClass("kbs-log-closed");
                    }
                }
            };
        };
            
        // modal api / dynamic properties
        GUI.prototype.setModalApi = function () {
            this.modals = Modal.prototype.getController();
        };


        // add a child node to the gui
        GUI.prototype.addChild = function (node) {
            this.tree.main.addChild(node);
        };

        // create a child and add to the gui
        GUI.prototype.createChild = function (type, classes, id) {
            var node = new Node(type, classes, id);
            this.addChild(node);
            return node;
        };

        // return the current gui instance
        GUI.prototype.getCurrentInstance = function () {
            return self;
        };

        // return gui
        return GUI;
    }
);
    

/*
*   @type javascript
*   @name interactor.js
*   @copy Copyright 2015 Harry Phillips
*/

/*global define: true, MutationObserver: true */

define(
    'main/ui/interactor',[
        'config',
        'main/components/util',
        'main/components/events',
        'main/components/status',
        'main/components/node',
        'main/ui/modal'
    ],
    function (
        config,
        util,
        events,
        status,
        Node,
        Modal
    ) {
        

        // declarations
        var $,
            self,
            inited = false,
            gui;

        // interactor constructor
        function Interactor(instance) {
            util.log(
                "context:inter/init",
                "info",
                "Initialising Interactor..."
            );
            
            // set references
            self = this;
            gui = instance;
            
            this.activeTask = null;
            
            // initialise
            this.init();
        }

        // initialise the interactor
        Interactor.prototype.init = function () {
            if (inited) {
                return;
            }
            
            // check jquery
            if (typeof window.jQuery !== "undefined") {
                // get
                $ = window.jQuery;
            } else {
                // no jquery, log error
                util.log(
                    "context:inter/init",
                    "error",
                    "Interactor could not initialise, jQuery not found!"
                );

                // and exit interactor
                return;
            }

            // apply elements and styling
            this.applyElements();
            this.applyHandlers();
            this.applyStyles();
            this.applyContext();
            this.applyHash();
            
            inited = true;
        };
            
        // returns if an object is or is apart of a task element
        Interactor.prototype.isTask = function (element) {
            // get jquery object
            if (!element instanceof $) {
                element = $(element);
            }
            
            element = element.closest("[id^=task_]");
            
            return (element.length) ? element : false;
        };
        
        // get the wrapper task element from a component
        Interactor.prototype.getTaskFromComponent = function (component) {
            return component.closest("[id^=task_]");
        };

        // expand the currently active task or a specified task id
        Interactor.prototype.openTask = function (localId) {
            util.log(
                "context:interactor",
                "Opening task #" + localId + "..."
            );
            
            this.activeTask = localId;
            
            if (typeof localId === "undefined") {
                this.expandTaskDetails();
                return;
            }
            
            // get global id
            this.findGlobalId(localId, function (task) {
                // once found - click the task
                task.trigger("click");
            });
        };

        // close the currently expanded task
        Interactor.prototype.closeTask = function () {
            this.shrinkTaskDetails();
        };

        // expands the task details panel
        Interactor.prototype.expandTaskDetails = function () {
            if (!$(".panelDetail").is(":visible")) {
                return;
            }
            
            // check current status
            if (status.interactor.taskDetailsExpanded) {
                return;
            }
            
            this.activeTask = this.findLocalIdFromDetails();
            util.log("context:interactor", "active task: #" + this.activeTask);
            
            // show overlay
            $(".kbs-overlay").show();
            
            // add expansion class
            $(".taskDetails").hide().addClass("kbs-details-expand");
            
            // show elements
            setTimeout(function () {
                $(".taskDetails, .kbs-details-closed").fadeIn();
            
                // trigger a resize event
                // so BugHerd can set the content height
                $(window).trigger("resize");
            }, 250);
            
            // set status
            status.interactor.taskDetailsExpanded = true;
        };

        // shrinks the task details panel
        Interactor.prototype.shrinkTaskDetails = function () {
            var task = $(".taskDetails"),
                overlay = $(".kbs-overlay"),
                btn = $(".kbs-details-closed");
            
            if (!status.interactor.taskDetailsExpanded) {
                return;
            }
            
            this.activeTask = null;
            
            // hide elements
            task.removeClass("kbs-details-expand");
            btn.fadeOut();
            overlay.fadeOut();
            
            // set status
            status.interactor.taskDetailsExpanded = false;
        };
            
        // perform a task search
        Interactor.prototype.searchForTask = function (localId, callback) {
            var search = $(".VS-search-inner input"),
                event = $.Event("keydown"),
                clear = $("div.VS-icon:nth-child(4)"),
                facet,
                result;
            
            util.log(
                "context:interactor",
                "Searching for task #" + localId
            );
            
            // down arrow
            event.keyCode = 40;
            
            // focus and nav to id
            search
                .focus()
                .trigger(event) // created
                .trigger(event) // filter
                .trigger(event); // id - bingo!
            
            // return key
            event.keyCode = 13;
            
            // press enter key to select id
            search.focus().trigger(event);
            
            // enter localId into input
            facet = $(".search_facet_input");
            facet
                .val(localId)
                .trigger("keydown");

            setTimeout(function () {
                // press enter
                facet.trigger(event);
            
                setTimeout(function () {
                    // callback with task
                    callback($(".task"));
                    
                    // unfocus from search
                    document.activeElement.blur();
                    
                    setTimeout(function () {
                        // clear search field
                        $("div.VS-icon:nth-child(4)").trigger("click");
                        document.activeElement.blur();
                    }, 1000);
                }, 500);
            });
        };

        // find a global task id from a local task id
        Interactor.prototype.findGlobalId = function (localId, callback) {
            // declarations
            var tasks = $(".task-id, .taskID"),
                child,
                parent,
                globalId,
                errModal,
                errMsg,
                check = function (index) {
                    if ($(this)[0].textContent === localId.toString()) {
                        child = $(this);
                    }
                };

            // get current task id if none passed
            if (typeof localId === "undefined") {
                localId = $(".local_task_id")[0].textContent;
            }
            
            // find the right task
            tasks.each(check);

            // if nothing found - perform a task search (async!)
            if (typeof child === "undefined") {
                if (typeof callback === "undefined") {
                    util.log(
                        "context:interactor",
                        "error",
                        "Couldn't find global id for task #" + localId +
                            ". Provide a callback function to allow " +
                            "async task searches!"
                    );
                    return;
                }
                
                // async search for task - calls callback with result
                this.searchForTask(localId, function (task) {
                    if (self.findLocalIdFromTask(task) === localId) {
                        callback(task);
                    } else {
                        errMsg = "Couldn't find task #" + localId;
                        
                        util.log(
                            "context:interactor",
                            "error",
                            errMsg
                        );
                        
                        errModal = new Modal("taskNotFound", {
                            init: true,
                            id: localId,
                            confirm: function () {
                                // close the err modal
                                errModal.close();
                                
                                // re-open search task
                                errModal
                                    .getController()
                                    .getModalByName("searchTask")
                                    .open();
                            },
                            cancel: function () {
                                errModal.close();
                            }
                        });
                    }
                });
                
                return;
            }
            
            // if found without asyn search - get and return
            parent = child.closest(".task");
            globalId = parent[0].id.replace("task_", "");

            // run callback with task/parent if defined
            if (callback) {
                callback(parent);
            }
            
            return globalId;
        };
            
        // find a local task id from a global task id
        Interactor.prototype.findLocalId = function (globalId) {
            return $("#task_" + globalId).find(".task-id, .taskID").text();
        };
            
            
        // find a global task id from task element
        Interactor.prototype.findGlobalIdFromTask = function (task) {
            var parent = task.closest(".task"),
                globalId = parent[0].id.replace("task_", "");
            
            return globalId;
        };
            
        // find a local task id from task element
        Interactor.prototype.findLocalIdFromTask = function (task) {
            var parent = task.closest(".task"),
                localId = task.find(".task-id, .taskID").text();
            
            return localId;
        };
            
        // find a local task id from task details
        Interactor.prototype.findLocalIdFromDetails = function () {
            var parent = $(".taskDetails"),
                localId = parent.find(".local_task_id");
            
            return localId.text() || localId.val();
        };
            
        // navigate the ui to a specified task board
        Interactor.prototype.navigateTo = function (board) {
            var nav = $("#nav-" + board.toLowerCase());
            
            // make sure is valid view
            if (nav.length) {
                nav.trigger("click");
            } else {
                util.log(
                    "context:interactor",
                    "error",
                    "Failed to navigate to: '" + board + "'"
                );
            }
        };
            
        // return current hash
        Interactor.prototype.getHash = function () {
            return window.location.hash;
        };
            
        // apply hash command
        Interactor.prototype.parseHash = function () {
            var hash = this.getHash(),
                href = window.location.href,
                hashId;
            
            util.log(
                "context:hash",
                "parsing new hash: " + hash
            );

            // prefixed
            if (hash === "#open") {
                // check if prefixed
                if (href.indexOf("tasks/") !== -1) {
                    hashId = parseInt(href.split("tasks/")[1], 10);

                    // open
                    if (hashId) {
                        this.openTask(hashId);
                    }
                }
            }

            // suffixed
            hashId = parseInt(hash.replace("#open", ""), 10);

            if (hashId) {
                this.openTask(hashId);
            }
        };

        // append elements to bugherd ui
        Interactor.prototype.applyElements = function () {
            // declarations
            var taskExpander,
                taskContractor,
                taskSearch;
            
            util.log(
                "context:inter/init",
                "+ appending elements to bugherd"
            );

            // task expander list element
            taskExpander = new Node("li");
            
            // task expander anchor element
            taskExpander.createChild("a")
                .text("Search Task")
                .on("click", function (event) {
                    taskSearch = new Modal("searchTask", {
                        init: true,
                        proceed: function (localId) {
                            if (!localId) {
                                // return if no id passed
                                return;
                            }
                            
                            taskSearch.close();
                            self.openTask(localId);
                        }
                    });
                });
            
            // task contractor/close button
            taskContractor = new Node("div", "kbs-details-closed");
            taskContractor.createChild("i", "fa fa-times");
            taskContractor.on("click", function (event) {
                self.closeTask();
            });
            
            // write
            taskExpander.writeTo($(".nav.main-nav")[0]);
            taskContractor.writeTo($("body")[0]);
        };
            
        // apply event handlers
        Interactor.prototype.applyHandlers = function () {
            util.log(
                "context:inter/init",
                "+ applying handlers to bugherd"
            );
            
            // delegate clicks on app wrapper
            $(".app-wrap").on("click", function (event) {
                var target = $(event.target),
                    task = self.isTask(target);
                
                if (task) {
                    self.expandTaskDetails();
                }
            });
            
            // on document mouse move - apply parallax to wallpaper
            // if there is one
            if (config.gui.wallpaper && config.gui.parallax.enabled) {
                var move = false,
                    frame = setInterval(function () {
                        move = (move) ? false : true;
                    }, 32),
                    fc;
                
                $("body").on("mousemove", function (event) {
                    fc = config.gui.parallax.factor;
                    
                    if (move) {
                        var deltaX = -(event.pageX / fc),
                            deltaY = -(event.pageY / fc);

                        $("#kanbanBoard").css(
                            "background-position",
                            deltaX + "px " + deltaY + "px"
                        );
                    }
                });
            }
        };

        // apply new styling to bugherd ui
        Interactor.prototype.applyStyles = function () {
            util.log(
                "context:inter/init",
                "+ applying styles to bugherd"
            );
            
            // apply wallpaper
            $(".pane-center .pane-content").css("background-image", config.gui.wallpaper);

            // add a margin to user nav to accompany console controls
            $(".nav.user-menu").css("margin-right", "10px");
            
            // overhaul theme specifics
            if (gui.getThemeName().indexOf("DOS") !== -1) {
                // change VS search icon to use fa
                $(".VS-icon-search").append("<i class=\"fa fa-search\"></i>");
                $(".VS-icon-search").css("top", "8px");

                // change VS cancel icon to use fa
                $(".VS-icon-cancel").append("<i class=\"fa fa-times\"></i>");
                $(".VS-icon-cancel").css("top", "8px");
            }
        };
            
        // apply interactor logging context / output
        Interactor.prototype.applyContext = function () {
            util.log(
                "context:inter/init",
                "+ applying interactor context"
            );
            util.log(
                "context:interactor",
                "buffer",
                "log-buffer: INTERACTOR"
            );
        };
            
        // apply hash lookup and event listeners
        Interactor.prototype.applyHash = function () {
            util.log(
                "context:inter/init",
                "+ applying hash parser"
            );
            
            var hash,
                href = window.location.href,
                hashId;
            
            util.log("context:hash", "buffer", "log-buffer: HASH");
            
            // open task if hash is prefixed
            // or suffixed with a task
            if (this.getHash()) {
                setTimeout(function () {
                    self.parseHash();
                }, 500);
            }
            
            // listening for hash events
            $(window).on("hashchange", function (event) {
                util.log(
                    "context:hash",
                    "hash changed: " + self.getHash()
                );
                
                self.parseHash();
            });
            
            if (this.getHash()) {
                util.log("context:hash", "found hash: " + this.getHash());
            }
        };

        return Interactor;
    }
);
/*
*    @type javascript test
*    @name main.test.js
*    @copy Copyright 2015 Harry Phillips
*/

/*global define: true */

define(
    'test/main.test',[
        'require',
        'main/components/util'
    ],
    function (require, util) {
        

        // instance pointer
        var self;

        // test controller constructor
        function TestController() {
            // modules
            this.modules = [
                "components/util",
                "components/events"
            ];
        }

        // executes a test
        TestController.prototype.exec = function (test) {
            // log
            util.log(
                "context:test/" + test,
                "exec",
                "executing test: \"" + test + "\"..."
            );

            // run
            require([window.KBS_BASE_URL + "src/test/" + test + ".test.js"]);
        };

        // executes all tests in the configured modules array
        TestController.prototype.execAll = function () {
            // declarations
            var len = this.modules.length,
                i = 0;

            // execute all
            for (i; i < len; i += 1) {
                this.exec(this.modules[i]);
            }
        };

        return new TestController();
    }
);
/*
*   @type javascript
*   @name init.js
*   @copy Copyright 2015 Harry Phillips
*/

/*global define: true */

/*
*   TODO
*   + Add a comments interface/modal (with a spellchecker? Preview post?)
*
*   + A place for Kanban tools? Not attached to the console toolbar?
*
*   + Add a repository/deposit component for storing instances of Kanban objects,
*     making them globally accessible within Kanban. Should remove the
*     need to pass instances between function calls.
*
*   + Add a modal to view screenshots instead of opening in a new tab
*
*   + Monitor status of all components and defer kbs/loaded event until
*     all components have finished initialising, more reliable than hard coding
*     the event fire (maybe combine with the repository/deposit component?)
*
*   + Allow searching of tasks by meta data such as references, browser and
*     version etc. Maybe allowing pulling into a local file?? Would require
*     local sourcing... possibly.
*
*   + Just discovered a very in-depth and exposed API under window.bugherd
*     this opens up a LOT of possibilities...
*
*   + Possibly add more info about the task to expanded details? Such as
*     the last updated at and update by etc?
*/

define(
    'main/init',[
        'config',
        'main/components/util',
        'main/components/events',
        'main/components/status',
        'main/components/cache',
        'main/components/repository',
        'main/components/http',
        'main/components/configurator',
        'main/components/bugherd',
        'main/ui/gui',
        'main/ui/interactor',
        'test/main.test'
    ],
    function KanbanInitialise(
        config,
        util,
        events,
        status,
        cache,
        repo,
        Http,
        Configurator,
        BugHerd,
        GUI,
        Interactor,
        tests
    ) {
        

        // components
        var kanban, end, gui, interactor, settings, bugherd;

        /* end of init call
        ------------------------------------------------------*/
        end = function () {
            // get performance delta
            window.KBS_DELTA_TIME =
                (new Date().getTime() - window.KBS_START_TIME) + "ms";

            // log
            util.log(
                "okay",
                kanban,
                "Kanban initialised in " +
                    window.KBS_DELTA_TIME
            );

            // expose the api if in dev mode
            if (config.mode === "dev") {
                window[config.appName] = kanban;
            }

            // expose logging api to window.log
            if (typeof window.log === "undefined") {
                window.log = util.log;
            }

            // update app status
            events.publish("kbs/status", {
                component: "app",
                status: true
            });

            // tests
            if (config.test) {
                tests.execAll();
            }
        };
            
        /* initialise
        ------------------------------------------------------*/
        // wait for kbs loaded event
        events.subscribe("kbs/loaded", end);
            
        // get a new configurator and load data
        try {
            settings = new Configurator();
            settings.loadExisting();
        } catch (configuratorException) {
            util.log(
                "error",
                "Configurator failed to initialise " +
                    " cleanly. Exception thrown in " +
                    configuratorException.fileName + " at line " +
                    configuratorException.lineNumber + ". Error: " +
                    configuratorException.message
            );
        }

        // check if disabled
        if (!config.enabled) {
            return;
        }

        // subscribe to status updates
        events.subscribe("kbs/status", function (data) {
            status[data.component] = data.status;
        });

        // initialise gui first so log buffer is constructed
        try {
            if (config.gui.enabled) {
                gui = new GUI();
            }
        } catch (guiException) {
            util.log(
                "error",
                "GUI failed to initialise " +
                    " cleanly. Exception thrown in " +
                    guiException.fileName + " at line " +
                    guiException.lineNumber + ". Error: " +
                    guiException.message
            );
        }

        // initialise interactor
        try {
            if (config.interactor.enabled) {
                interactor = new Interactor(gui);
            }
        } catch (interactorException) {
            util.log(
                "error",
                "Interactor failed to initialise " +
                    " cleanly. Exception thrown in " +
                    interactorException.fileName + " at line " +
                    interactorException.lineNumber + ". Error: " +
                    interactorException.message
            );
        }
            
        // initialise the bugherd api wrapper
        try {
            bugherd = new BugHerd(interactor, gui);
            bugherd.init();
        } catch (bugherdException) {
            util.log(
                "error",
                "BugHerd API failed to initialise " +
                    " cleanly. Exception thrown in " +
                    bugherdException.fileName + " at line " +
                    bugherdException.lineNumber + ". Error: " +
                    bugherdException.message
            );
        }

        // kbs data/api object
        kanban = {
            version: config.version,
            interactor: interactor,
            status: status,
            cache: cache,
            config: config,
            events: events,
            util: util,
            gui: gui,
            configurator: settings,
            repo: repo,
            Api: {
                "Configurator": Configurator,
                "Interactor": Interactor,
                "GUI": GUI,
                "BugHerd": BugHerd,
                "Http": Http
            }
        };
    }
);

/*
*   @type javascript
*   @name kanban.js
*   @copy Copyright 2015 Harry Phillips
*/

(function (window) {
    
    
    var require = window.require,
        deposit = document.getElementById("kbs-deposit").classList;
    
    // process deposited values
    window.KBS_GLOBAL_SET = (deposit[0] === "true") ? true : false;
    window.KBS_START_TIME = deposit[1];
    window.KBS_DELTA_TIME = "";
    window.KBS_BASE_URL = deposit[2];
    
    require.config({
        paths: {
            main: window.KBS_BASE_URL + "src/main",
            test: window.KBS_BASE_URL + "src/test"
        }
    });
    
    // launch when window is loaded
    window.onload = function () {
        window.KBS_START_TIME = new Date().getTime();
        require(['main/init']);
    };
}(window));
define("kanban", function(){});

}());