/*
*   @type javascript
*   @name config.js
*   @copy Copyright 2015 Harry Phillips
*/

/*global define: true */

define('config',{
    appName: "kbs",
    version: 0.9,
    enabled: true,
    mode: "dev",
    offline: false,
    httpToken: "Fw43Iueh87aw7",
//    theme: "black",
//    test: true,
    logs: {
        enabled: true,
        gui: true,
        contextFlag: "context:",
        obj2buffer: false,
        filter: false
    },
    gui: {
        enabled: true,
        autorefresh: true,
        console: {
            state: "kbs-open",
            autoscroll: true,
            icons: {
                save: "file-text",
                clear: "trash",
                toggle: "terminal",
                close: "times",
                destroy: "unlink",
                example: "plus-circle",
                expand: "caret-square-o-right"
            }
        }
    },
    events: {
        silent: false
    },
    routes: {
        console: {
            save: "kanban/endpoint/SaveBuffer.php"
        }
    },
    tooltips: {
        save: "Save the output buffer to text file",
        clear: "Clear all logs",
        toggle: "GUI Console State",
        close: "Close the console",
        destroy: "Destroy this console instance"
    }
});

/*
*   @type javascript
*   @name events.js
*   @copy Copyright 2015 Harry Phillips
*/

/*jslint devel: true */

/*global define: true */

define('src/components/events',['config'], function (config) {
    
    
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
            this.topics[event][i](data);
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
*   @name states.js
*   @copy Copyright 2015 Harry Phillips
*/

/*global define: true */

define('src/components/status',{
    app: false,
    gui: false,
    console: false
});
/*
*   @type javascript
*   @name buffer.js
*   @copy Copyright 2015 Harry Phillips
*/

/*global define: true */

define('src/components/buffer',[],function () {
    
    
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
        
        // splice our buffer index from global buffer
        global.splice(buffer, 1);
    };
    
    return Buffer;
});
/*
*   @type javascript
*   @name cache.js
*   @copy Copyright 2015 Harry Phillips
*/

/*global define: true */

define('src/components/cache',['./buffer'], function (Buffer) {
    
    
    // cache object
    var cache = {
        app: new Buffer(),
        console: new Buffer()
    };
    
    return cache;
});
/*
*   @type javascript
*   @name util.js
*   @copy Copyright 2015 Harry Phillips
*/

/*global define: true */

define(
    'src/util',[
        'config',
        './components/events',
        './components/status',
        './components/cache'
    ],
    function (config, events, status, cache) {
        

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

/*
*   @type javascript
*   @name coutner.js
*   @copy Copyright 2015 Harry Phillips
*/

/*global define: true */

define('src/components/counter',[],function () {
    
    
    function Counter(target, callback) {
        var value = 0;
        
        this.target = target;
        this.exec = callback;
        
        Object.defineProperty(this, "count", {
            get: function () {
                return value;
            },
            set: function (newvalue) {
                value = newvalue;
                
                if (value >= target) {
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

define('src/components/http',['config', 'src/util', './counter'], function (config, util, Counter) {
    
    
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
});
/*
*   @type javascript
*   @name interactor.js
*   @copy Copyright 2015 Harry Phillips
*/

/*global define: true */

define('src/interactor',['require'],function (require) {
    
    
    function Interactor() {
        
    }
    
    Interactor.prototype.init = function () {
        
    };
    
    return Interactor;
});
/*
*   @type javascript
*   @name node.js
*   @copy Copyright 2015 Harry Phillips
*/

/*global define: true */

define(
    'src/ui/node',['config'],
    function () {
        
        
        // node constructor
        function Node(type, classes, id) {
            // set props
            this.type = type;
            this.classes = classes;
            this.selector = id;
            
            // create element
            this.element = document.createElement(type);
            this.element.className = classes || "";
            
            if (id) {
                this.element.id = id;
            }
        }

        // add a child to node
        Node.prototype.addChild = function (node) {
            // check if node is an instance of class Node
            if (node.constructor === Node || node instanceof Node) {
                this.element.appendChild(node.element);
                return;
            }
            
            // just a HTML node, append
            this.element.appendChild(node);
        };

        // create and add child to node
        Node.prototype.createChild = function (type, classes, id) {
            var node = new Node(type, classes, id);
            this.addChild(node.element);
            return node;
        };
        
        // delete node and it's children
        Node.prototype.destroy = function () {
            this.element.parentNode.removeChild(this.element);
        };
        
        // clone node instance and return
        Node.prototype.clone = function () {
            var clone = new Node(
                this.type,
                this.classes,
                this.selector
            );
            
            // nullify the new node element and clone this
            clone.element = null;
            clone.element = this.element.cloneNode();
            
            return clone;
        };
        
        return Node;
    }
);
/*
*   @type javascript
*   @name router.js
*   @copy Copyright 2015 Harry Phillips
*/

/*global define: true */

define('src/components/router',['config'], function (config) {
    
    
    return {
        // return a route to a component controller
        getRoute: function (component, fn) {
            return window.KBS_BASE_URL + config.routes[component][fn];
        }
    };
});
/*
*   @type javascript
*   @name modal.js
*   @copy Copyright 2015 Harry Phillips
*/

/*global define: true */

define(
    'src/ui/modal',[
        'config',
        'src/util',
        'src/components/events',
        'src/components/http',
        'src/components/status',
        './node'
    ],
    function (config, util, events, Http, status, Node) {
        

        // instance pointer
        var self, gui;
        
        function Modal(type, instance, params) {
            // set pointer
            self = this;
            
            // check if a type has been passed
            if (typeof type !== "string") {
                // adjust arguments
                params = instance;
                instance = type;
                type = null;
            }
            
            // set props
            gui = instance;
            this.type = type;
            this.node = new Node("div", "kbs-modal");
            this.node.element.style.display = "none";
            
            if (type) {
                this.node.element.className += " kbs-" + type;
            }
            
            this.onConfirm = params.confirm || function () {};
            this.onCancel = params.cancel || function () {};
            
            // text content
            this.title = params.title;
            this.message = params.message;
            
            // initialise
            if (params.init) {
                this.init();
            }
        }
        
        // init and open modal
        Modal.prototype.init = function () {
            // declarations
            var
                title =
                this.node.createChild("h2", "kbs-modal-title"),
                
                message =
                this.node.createChild("p", "kbs-modal-msg"),
                
                close =
                this.node.createChild("i", "fa fa-times kbs-modal-close"),
                
                confirm,
                cancel;
            
            title.element.textContent = this.title;
            message.element.textContent = this.message;
            
            close.element.onclick = function () {
                self.close();
            };
            
            // append components
            this.node.addChild(title);
            this.node.addChild(close);
            this.node.addChild(message);
            
            // add confirm/cancel buttons for prompt modals
            if (this.type === "prompt") {
                // confirm
                confirm = this.node.createChild("span", "kbs-confirm");
                confirm.element.textContent = "confirm";
                confirm.element.onclick = this.onConfirm;
                
                // cancel
                cancel = this.node.createChild("span", "kbs-cancel");
                cancel.element.textContent = "cancel";
                cancel.element.onclick = this.onCancel;
                
                // click event handlers
                
                this.node.addChild(confirm);
                this.node.addChild(cancel);
            }
            
            // add our node to gui
            gui.addChild(this.node.element);
            
            // open the modal
            this.open();
        };
        
        // reveal modal and overlay
        Modal.prototype.open = function () {
            gui.tree.main.overlay.element.style.display = "block";
            this.node.element.style.display = "block";
        };
        
        // close modal and overlay
        Modal.prototype.close = function () {
            gui.tree.main.overlay.element.style.display = "none";
            this.node.element.style.display = "none";
        };
        
        // destroy the modal
        Modal.prototype.destroy = function () {
            gui.tree.main.overlay.element.style.display = "none";
            this.node.element.parentNode.removeChild(this.node.element);
        };

        return Modal;
    }
);
/*
*   @type javascript
*   @name console.js
*   @copy Copyright 2015 Harry Phillips
*/

/*global define: true */

define(
    'src/ui/console',[
        'config',
        'src/util',
        'src/components/events',
        'src/components/http',
        'src/components/status',
        'src/components/router',
        'src/components/cache',
        'src/ui/node',
        'src/ui/modal'
    ],
    function (config, util, events,
               Http, status, router,
               cache, Node, Modal) {
        
        
        // instance pointers
        var self, gui;
        
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
            return this.contexts[context];
        };
        
        // add a logging context
        Console.prototype.createContext = function (context, element) {
            // declarations
            var logContext;
            
            // make sure not already defined
            if (this.contexts[context]) {
                util.log("error", "Log context: '" + context +
                         "' is already defined");
            }
            
            if (util.isNode(element)) {
                // use create proto of Node
                logContext = element.createChild("div", "kbs-log-context");
                logContext.element.id = context;
            } else {
                // manually append new Node
                logContext = new Node("div", "kbs-log-context");
                logContext.element.id = context;
                element.appendChild(logContext.element);
            }
            
            // apply to global contexts
            this.contexts[context] = logContext.element;
            
            return element;
        };
        
        // console output
        Console.prototype.write = function (args) {
            // declarations
            var context = self.getContext("def"),
                log = new Node("div", "kbs-log-node kbs-" + args.type),
                txt = document.createTextNode(args.msg),
                objwrap = new Node("pre", "kbs-object"),
                objexp = new Node("i", "fa fa-" +
                      config.gui.console.icons.expand +
                      " kbs-object-expand"),
                objtxt,
                doCreateContext = false,
                i = 0;
            
            // check for context param
            if (args.context) {
                // check for subcontext
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
                objexp.element.setAttribute("onclick",
                                            "kbsExpandObjectNode(this)");
                objwrap.addChild(objexp.element);
                objwrap.addChild(objtxt);
                log.addChild(objwrap.element);
            }

            // write to context
            context.appendChild(log.element);
            
            // create context with new log node
            // if set to create
            if (doCreateContext) {
                self.createContext(doCreateContext, log.element);
            }

            // refresh
            self.refresh();
        };
        
        // console output to context
        Console.prototype.writeToContext = function (context) {
            // check for context
            if (!this.findLogContext(context)) {
                util.log("error", "Attempt to write to a log context ('" +
                         context +
                         "') which does not exist!");
            }
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
                "fa fa-" + icon + " kbs-tool " +
                    "kbs-" + tool
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
            var element = this.wrapper.element,
                classes = element.className;

            element.className = classes.replace(" kbs-close", " kbs-open");
        };
        
        // close console
        Console.prototype.close = function () {
            var element = this.wrapper.element,
                classes = element.className;

            element.className = classes.replace(" kbs-open", " kbs-close");
        };
        
        // shrink console
        Console.prototype.shrink = function () {};
        
        // make console fullscreen
        Console.prototype.full = function () {};
        
        // refresh console
        Console.prototype.refresh = function () {
            // scroll to bottom of console
            var cons = self.wrapper.cons.element;
            cons.scrollTop = cons.scrollHeight;
        };
         
        // clear output
        Console.prototype.clear = function () {
            var cons = this.wrapper.cons.element,
                out = this.wrapper.cons.out.element,
                start = new Date().getTime(),
                end;

            // detach
            cons.removeChild(out);

            // remove all logs
            while (out.firstChild) {
                out.removeChild(out.firstChild);
            }

            // reattach
            cons.appendChild(out);

            // bench
            end = new Date().getTime() - start;
            util.log("okay", "cleared all logs in " + end + " ms");
        };
        
        // save the output buffer to a text file on the local system
        Console.prototype.save = function (filename) {
            // declarations
            var time = util.ftime(),
                date = util.fdate(),
                buffer = cache.console.getBuffer(),
                
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
                        util.log("okay", response);
                    }
                });
        };
        
        // destroy console instance (irreversible)
        Console.prototype.destroy = function () {
            var
                modalTitle = "Destroy the Console instance?",
                
                modalMsg = "Confirm destruction of the GUI Console? " +
                "(irreversible until refresh).",
                
                modal = new Modal("prompt", gui, {
                    init: true,
                    title: modalTitle,
                    message: modalMsg,
                    confirm: function () {
                        var parent = self.wrapper.element.parentNode,
                            child = self.wrapper.element;
                        
                        // destroy console node
                        parent.removeChild(child);
                        
                        // clear the log buffer
                        cache.console.clearBuffer();
                        
                        // destroy the modal
                        modal.destroy();
                    },
                    cancel: function () {
                        modal.close();
                    }
                });
        };
        
        // build the console
        Console.prototype.buildNodeTree = function () {
            // declarations
            var
                // console nodes
                wrapper,
                consclass,
                constools,
                constitle,
                titlenode,
                cons,
                consout,
                consicon;

            // console wrapper
            consclass = "kbs-cons-box " + config.gui.console.state;
            this.wrapper = wrapper = gui.createChild("div", consclass);

            // console toolbar
            constools = wrapper.constools =
                wrapper.createChild("div", "kbs-cons-toolbar");

            // add a title to the toolbar
            constitle = constools.constitle =
                constools.createChild("div", "kbs-cons-title");

            titlenode = document.createTextNode("Kanban v" + config.version);
            constitle.element.appendChild(titlenode);
            
            // toggle tool
            this.createTool("toggle")
                .element.onclick = function () {
                    var classes = wrapper.element.className,
                        closed = classes.indexOf("kbs-close") !== -1,
                        full = classes.indexOf("kbs-full") !== -1;

                    // if not closed and not full screen
                    if (!closed && !full) {
                        // make full screen
                        wrapper.element.className += " kbs-full";
                    }

                    // if in full screen
                    if (full) {
                        // shrink
                        wrapper.element.className =
                            wrapper.element.className.replace(" kbs-full", "");
                    }

                    // if closed
                    if (closed) {
                        // open
                        self.open();
                    }
                };
            
            // save tool
            this.createTool("save")
                .element.onclick = function () {
                    self.save();
                };

            // destroy tool
            this.createTool("destroy")
                .element.onclick = function () {
                    self.destroy();
                };

            // clear tool
            this.createTool("clear")
                .element.onclick = function () {
                    self.clear();
                };

            // close tool
            this.createTool("close")
                .element.onclick = function () {
                    self.close();
                };

            // console
            wrapper.cons = cons =
                wrapper.createChild("div", "kbs-cons");

            // console output
            consout = cons.out = cons.createChild("div", "kbs-cons-out");

            // return wrapper element
            return wrapper;
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

/*
    TODO:
    
    - Add an array to Node class to store child nodes
    - Add ability to remove child nodes
    - Re-write to support the new node tree structure
*/

define('src/ui/gui',['require','config','src/util','src/components/events','src/interactor','./node','src/components/counter','./console','./modal'],function (require) {
    

    // dependencies
    var
        config = require('config'),
        util = require('src/util'),
        events = require('src/components/events'),
        interactor = require('src/interactor'),
        Node = require('./node'),
        Counter = require('src/components/counter'),
        Console = require('./console'),
        Modal = require('./modal'),
        
        // instance pointer
        self;
    
    util.log("+ gui.js loaded");

    // gui constructor
    function GUI() {
        // set pointer
        self = this;

        // tree and console
        this.tree = this.buildNodeTree();
        this.console = new Console(this);
        
        // test modal!
        this.modal = new Modal(this, {
            init: false,
            title: "Test Modal - Title",
            message: "Test paragraph / modal content."
        });

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
                events.publish("kbs/gui/loaded");
            }),

            // create link elements
            mainlink = document.createElement("link"),
            themelink = document.createElement("link"),
            falink = document.createElement("link"),

            // create urls
            mainurl = window.KBS_BASE_URL + window.KBS_SRC_DIR +
            "css/main.css",
            
            themeurl = window.KBS_BASE_URL + window.KBS_SRC_DIR +
            "css/" + (config.theme || "theme") + ".css",

            faurl = "//maxcdn.bootstrapcdn.com/font-awesome/" +
            "4.3.0" +
            "/css/font-awesome.min.css",

            // attach gui element and publish loaded event
            publish = function () {
                // attach gui when styles have loaded
                document.body.appendChild(self.tree.main.element);
                util.log("context:gui/init", "debug", "+ attached gui tree");
                
                // run event listeners
                self.runEventListeners();
                util.log("context:gui/init", "debug", "+ running event listeners");

                // gui is always last to load - publish loaded event
                util.log("context:gui/init", "debug", "+ publishing 'kbs/loaded'");
                events.publish("kbs/loaded");
            };

        // events setup
        if (config.gui.enabled) {
            // auto refresh
            if (config.gui.autorefresh) {
                events.subscribe("gui/update", this.refresh);
            }

            // gui logging
            if (config.logs.gui) {
                events.subscribe("gui/log", this.console.write);
            }
        
            // gui load event listener
            events.subscribe("kbs/gui/loaded", publish);
        }

        // props
        mainlink.rel = "stylesheet";
        themelink.rel = "stylesheet";
        falink.rel = "stylesheet";

        mainlink.href = mainurl;
        themelink.href = themeurl;
        falink.href = faurl;
        
        // gui init log context
        util.log("context:gui/init", "info", "Initialising GUI...");

        // main css link events
        mainlink.onload = function () {
            util.log("context:gui/init", "debug", "+ main.css loaded");
            loader.count += 1;
        };
        
        mainlink.onerror = function () {
            loader.count += 1;
            throw new Error("main.css failed to load!");
        };

        // theme css link events
        themelink.onload = function () {
            util.log("context:gui/init", "debug", "+ theme.css loaded");
            loader.count += 1;
        };
        
        themelink.onerror = function () {
            loader.count += 1;
            throw new Error("theme.css failed to load!");
        };

        // font-awesome css link events
        falink.onload = function () {
            util.log("context:gui/init", "debug", "+ font-awesome.css loaded");
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

    // build gui node tree
    GUI.prototype.buildNodeTree = function () {
        // create tree and nodes
        var tree = {}, main;

        // create nodes
        tree.main = main = new Node("div", "kbs-gui");
        main.overlay = tree.main.createChild("div", "kbs-overlay");

        return tree;
    };
    
    // run event listeners
    GUI.prototype.runEventListeners = function () {
        // handle log node of type 'exec' clicks
        var out = this.console.wrapper.cons.out.element,
            current;
        
        // bind a click handler to the console out
        out.onclick = function (event) {
            current = event.target;
            if (util.contains(current.className, "kbs-exec") !== false) {
                // we clicked on an exec block
                if (!util.contains(current.className, "kbs-log-close")) {
                    // we need to close the block
                    current.className += " kbs-log-close";
                } else {
                    // we need to open the block
                    current.className =
                        current.className.replace(" kbs-log-close", "");
                }
            }
        };
    };

    // refresh the gui and its child nodes
    GUI.prototype.refresh = function () {
        this.console.refresh();
    };


    // add a child node to the gui
    GUI.prototype.addChild = function (node) {
        this.tree.main.element.appendChild(node);
    };

    // create a child and add to the gui
    GUI.prototype.createChild = function (type, classes, id) {
        var node = new Node(type, classes, id);
        this.tree.main.element.appendChild(node.element);
        return node;
    };
    // benchmarks the generation of 10000 log nodes
    GUI.prototype.benchmark = function () {
        var cons = self.console.wrapper.cons.element,
            out = self.console.wrapper.cons.out.element,
            start = new Date().getTime(),
            end,
            i = 0;

        // detach
        cons.removeChild(out);

        while (i < 10000) {
            util.log("debug", "log #" + i);
            i += 1;
        }

        // reattach
        cons.appendChild(out);

        end = new Date().getTime() - start;
        util.log("debug", "opt: " + end + "ms");
    };
    
    // return the current gui instance
    GUI.prototype.getCurrentInstance = function () {
        return self;
    };

    // return gui
    return GUI;
});
    

/*
*    @type javascript test
*    @name main.test.js
*    @copy Copyright 2015 Harry Phillips
*/

/*global define: true */

define('test/main.test',['require', 'src/util'], function (require, util) {
    
    
    return {
        exec: function (test) {
            util.log('context:test/' + test, 'exec', 'executing test: "' + test + '"...');
            require(['./' + test + '.test']);
        }
    };
});
/*
*   @type javascript
*   @name main.js
*   @copy Copyright 2015 Harry Phillips
*/

/*global define: true */

define(
    'src/main',[
        'config',
        './components/events',
        './util',
        './components/status',
        './components/http',
        './components/cache',
        './ui/gui',
        'test/main.test'
    ],
    function (config, events, util, status, http, cache, GUI, tests) {
        
        
        // declarations
        var kanban, exec, gui;

        // return if kanban is disabled
        if (!config.enabled) {
            return;
        }

        // subscribe to status updates
        events.subscribe("kbs/status", function (data) {
            status[data.component] = data.status;
        });

        // initialise gui
        if (config.gui.enabled) {
            gui = new GUI();
        }

        // execute kanban
        exec = function () {
            // get performance delta
            window.KBS_END_TIME =
                (new Date().getTime() - window.KBS_START_TIME) + "ms";

            // log
            util.log("okay", kanban, "Kanban initialised in " +
                window.KBS_END_TIME);

            // expose the api if in dev mode
            if (config.mode === "dev") {
                window[config.appName] = kanban;
            }

            // update app status
            events.publish("kbs/status", {
                component: "app",
                status: true
            });

            // tests
            if (config.test) {
                tests.exec(['util']);
            }
        };

        // kbs data/api object
        kanban = {
            version: config.version,
            status: status,
            cache: cache,
            config: config,
            events: events,
            http: http,
            util: util,
            gui: gui
        };

        // wait for kbs loaded event
        events.subscribe("kbs/loaded", exec);
    }
);

/*
*   @type javascript
*   @name kanban.js
*   @copy Copyright 2015 Harry Phillips
*/

// check if globals are set
if (!window.KBS_GLOBAL_SET) {
    var KBS_GLOBAL_SET = true,
        
        KBS_START_TIME = new Date().getTime(),
        KBS_END_TIME,

        KBS_BASE_URL = "http://localhost/GitHub/",
        KBS_SRC_DIR = "kanban/";
}

(function (window) {
    
    
    var require = window.require;
    
    require.config({
        paths: {
            src: "src",
            test: "test"
        }
    });
    
    require(['src/main']);
}(window));

// globally exposed functions
function kbsExpandObjectNode(element) {
    
    
    if (element.parentNode.style.height !== "450px") {
        element.parentNode.style.height = "450px";
        element.className += " kbs-rotate";
    } else {
        element.parentNode.style.height = "150px";
        element.className = element.className.replace("kbs-rotate", "");
    }
};
define("kanban", function(){});

