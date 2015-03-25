/*
*   @type javascript
*   @name console.js
*   @copy Copyright 2015 Harry Phillips
*/

window.define(
    ['config', './util', './events', './status', './node'],
    function (config, util, events, status, Node) {
        'use strict';
        
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
            
            // update console status
            events.publish("kbs/status", {
                component: "console",
                status: true
            });
        }
        
        // console output
        Console.prototype.write = function (args) {
            // get nodes using the self pointer!
            var out = self.wrapper.cons.out.element,
                log = new Node("div", "kbs-log-node kbs-" + args.type),
                txt = document.createTextNode(args.msg),
                objwrap = new Node("pre", "kbs-object"),
                objexp = new Node("i", "fa fa-plus kbs-object-expand"),
                objtxt,
                i = 0;

            // write message to log node
            log.addChild(txt);
            
            // write object to log node
            if (args.obj) {
                objtxt = document.createTextNode(args.obj);
                objexp.element.setAttribute("onclick", "kbsExpandObjectNode(this)");
                objwrap.addChild(objexp.element);
                objwrap.addChild(objtxt);
                log.addChild(objwrap.element);
            }

            // write to output
            out.appendChild(log.element);

            // refresh
            self.refresh();
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
        
        // create toolbar widget
        Console.prototype.createTool = function (toolbar, tool) {
            if (typeof toolbar === "undefined") {
                throw new Error("No toolbar passed to " +
                                "GUI.Console.createTool()");
            }

            var icon;

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

            element.className = classes.replace(" kbs-close", "");

            this.wrapper.constools.constitle.element.style.display = "block";
        };
        
        // close console
        Console.prototype.close = function () {
            var element = this.wrapper.element,
                classes = element.className;

            element.className = classes += " kbs-close";

            this.wrapper.constools.constitle.element.style.display = "none";
        };
        
        // shrink console
        Console.prototype.shrink = function () {};
        
        // make console fullscreen
        Console.prototype.full = function () {};
        
        // refresh console
        Console.prototype.refresh = function () {};
        
        // destroy console instance (irreversible)
        Console.prototype.destroy = function () {
            var confirm = window.prompt("Are you sure you want to destroy the " +
                    "console instance? You will have to refresh the page " +
                    "to recover it.",
                    "Click OK or CANCEL - input not needed");

            if (confirm) {
                this.wrapper.element.parentNode.removeChild(this.wrapper.element);
            }
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
            this.createTool(constools, "toggle").element.onclick = function () {
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

            // destroy tool
            this.createTool(constools, "destroy").element.onclick = function () {
                self.destroy();
            };

            // clear tool
            this.createTool(constools, "clear").element.onclick = function () {
                self.clear();
            };

            // close tool
            this.createTool(constools, "close").element.onclick = function () {
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