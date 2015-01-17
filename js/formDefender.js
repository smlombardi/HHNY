        // Avoid `console` errors in browsers that lack a console and setup Object.create
(function(window, undefined) {
    var method;
    var noop = function noop() {};
    var methods = [
        'assert', 'clear', 'count', 'debug', 'dir', 'dirxml', 'error',
        'exception', 'group', 'groupCollapsed', 'groupEnd', 'info', 'log',
        'markTimeline', 'profile', 'profileEnd', 'table', 'time', 'timeEnd',
        'timeStamp', 'trace', 'warn'
    ];
    var length = methods.length;
    var console = (window.console = window.console || {});

    while (length--) {
        method = methods[length];

        // Only stub undefined methods.
        if (!console[method]) {
            console[method] = noop;
        }
    }

    // Object.create
    if (typeof Object.create !== "function") { 
            Object.create = (function() {
            var F = function () {};
            return function (o) {
                F.prototype = o;
                return new F();
            }
        }());
    }
}(window));

//formDefender
(function($, window, document, undefined) {
    var $formDefender,
        trim  = $.trim,
        inArr = $.inArray,
        isArr = $.isArray,
        isEmptyObj = $.isEmptyObject,
        log = console.log,
        push = Array.prototype.push,
        hasOwnProp = (function () {
            var ownProp = Object.prototype.hasOwnProperty;
            return function (obj, prop) {
                return ownProp.call(obj, prop);
            };
        }()),
        noSpaces = function (val) {
         return val && typeof val === "string" ? val.replace(/\s+/g, "") : ""; 
        },
        
        //Constructor
        formDefender = {
            init : function (options, elem, plugin) {
                var self         = this;
                self.elem        = elem;
                self.plugin      = plugin;
                self.O           = options; 
                self.setupErrors = {};
                self.logErrors   = !!self.O.debug ? {} : undefined;

                //populate this object with all final settings
                self.Master      = { };

                //setup object functions and utility methods
                self.util().setUpConfig().vFuncsMap();

                //init setup function
                if ( !self.setUp() ) return false;
                
            },

            setUp : function () {
                var self = this, elems, bind, prop;

                //init setup configurations
                self.setUpConfig
                    .init()
                    .useDefaults()
                    .setupElems();


                if (self.util.noErrors()) {
                    elems = self.Master.elems;
                    bind  = self.util.bind;

                    if (!!self.Master.placeHolders && typeof self.util.placeHolders === "object") {
                        self.util.placeHolders.setup();
                    }

                    //determine if valid swap values exist.
                    self.util.swapValuesOnSubmit();

                    //determine if relational node exists for display errors
                    //(data-err)
                    self.util.relErrNodes(self.Master.elems.required);

                    //bind submit button and its submit conditions.
                    bind.submitBtn();

                    //setup event delegation for elems
                    //(focus/blur events will be bound to the form and delegated)
                    bind.delegateEvents((function() {
                        var prop, _elems = elems.required;
                        for (prop in _elems) {
                            if (hasOwnProp(_elems, prop)) {
                                // _elems[prop].addClass(className);
                                _elems[prop].attr("data-delegate", true);
                            }
                        };
                        return "[data-delegate]";
                    }()));
                }

                //exec debug mode.    
                if (self.logErrors) self.util.debugMode();
                //die if we have errors.
                return self.util.noErrors();
            }
        };

        //------------------
        //utility functions
        formDefender.util = function () {
            var self = this;

            this.util = {
                isNode : function (node, addError, returnNode) {
                    var _node = (function() {
                            var test = function (_test) {
                                if (_test.length > 0) {
                                   foundElem = _test;
                                   return true; 
                                }
                                return false;
                            }, foundElem;

                            if (test(self.elem.find("[name='"+node+"']"))) return foundElem;
                            if (test(self.elem.find(node))) return foundElem;
                            if (test($(node))) return foundElem;
                            return false;
                        }()), 
                        check = _node.length > 0;



                    if (!check && addError) {
                        if(self.util.isBlank(node)) node = "(empty string)"
                        self.util.addError(node, {
                            valueGiven : node,
                            error : " '"+node+"' " + "was not found in the DOM"
                        });
                    }

                    return !!returnNode && !!check ? _node : check;
                },

                relErrNodes : function (elems) {
                    var prop, relErrNode;
                    for (prop in elems) {
                        if (hasOwnProp(elems, prop)) {
                            relErrNode = self.elem.find("[data-err='" +elems[prop].attr('name')+ "']");
                            if (relErrNode.length > 0) {
                                elems[prop].data("relErrNode", relErrNode );
                            }
                        }
                    }
                },

                parseElems : function (obj, addError) {
                    var prop, node, vFunc, custMsg, tmp, 
                        map = self.vFuncsMap,
                        failure,
                        _data_,
                        _final_ = []; //obj will be redefined to this value that will contain jObjects

                    //handle single nodes    
                    if (typeof obj[0] === "string") {

                        prop =  obj[1][obj[0]];

                        node = self.util.isNode(prop, true, true);

                        if (node) obj[1][obj[0]] = node;

                        return true;
                    }      

                    //handle object that contains elems that have configs.
                    for (prop in obj) {
                        if (hasOwnProp(obj, prop)) {

                            failure = [];

                            //isNode will report false node on its own.
                            node = self.util.isNode(prop, true, true);
                            if (!node) {
                                failure.push("node");
                                continue;
                            } 

                            //ensure that configuration is not blank.
                            //if so report and move on.
                            if (self.util.isBlank(obj[prop])) {
                                self.util.addError(prop,{
                                    valueGiven : "None",
                                    error : "Element configuration cannot be blank"
                                });
                                continue;
                            }
                            else {
                                if (obj[prop].indexOf(",") < 0) {
                                    tmp = [trim(obj[prop]).toLowerCase(), ""];
                                }
                                else {
                                    tmp = obj[prop].split(",");
                                    tmp = [trim(tmp[0]).toLowerCase(), trim(tmp[1])];
                                }
                            }

                            vFunc   = hasOwnProp(map, tmp[0]) ? map[tmp[0]].func : false;

                            if (!vFunc || typeof vFunc !== "function") {
                                self.util.addError("vFunc", {
                                    valueGiven : tmp[0],
                                    error : " '"+tmp[0] +"' " + "was not found in the vFuncs map"
                                });
                                failure.push("vFunc");
                                continue;
                            }

                            custMsg = self.util.isBlank(tmp[1].toLowerCase()) ? map[tmp[0]].defErrMsg : tmp[1];

                            if (!custMsg) {
                                self.util.addError(tmp[0], {
                                    valueGiven : tmp[0],
                                    error : "Check custom message or its default value is missing"
                                });
                                failure.push("custMsg");
                                continue;
                            }

                            //success :)
                            //construct the nodes data object and attach to it.
                            if (failure.length <= 0) {
                                _data_ = {};
                                _data_.msg   = custMsg;
                                _data_.vFunc = vFunc;
                                node.data("_data_", _data_);
                                obj[prop] = node;
                            }
                        }
                    }
                
                    return true;
                },

                isBlank : function (s) {
                    return noSpaces(s).length <= 0;
                },

                isntBlank : function (s) {
                    return noSpaces(s).length > 0;
                },

                hasOptionsSet : function (defArr,uOpt) {
                    return inArr(trim(uOpt), defArr) >= 0;
                },

                swapValuesOnSubmit : function () {
                    var swapObj = self.O.swapValuesOnSubmit, prop, elem, val,
                        elems = [];

                    if (typeof swapObj !== "object" || isEmptyObj(swapObj)) {
                        self.util.swapValuesOnSubmit = undefined;
                        return;
                    } 

                    for (prop in swapObj) {
                        if (hasOwnProp(swapObj, prop)) {

                            elem = self.util.isNode(trim(prop), undefined, true);
                            val  = trim(swapObj[prop]);

                            if (!elem || self.util.isBlank(val)) continue;
                            else {
                                elems.push({
                                    node : elem,
                                    swapVal : val
                                });
                            }
                        }
                    }

                    if (elems.length <= 0) {
                        self.util.swapValuesOnSubmit = undefined;
                        return;
                    }

                    self.util.swapValuesOnSubmit = function () {
                        var len = elems.length, i = 0, elem;

                        for (; i < len; i += 1) {
                            elem = elems[i];
                            elem.node.val( elem.swapVal );
                        }
                    };
                },

                placeHolders : function (val) {
                    if (typeof val !== "boolean" || !val) {
                        self.util.placeHolders = undefined;
                        return false;
                    }

                    if (!!val) {
                        self.util.placeHolders = {
                            apply : function (elem) {
                                var ph = elem.data("placeholder");
                                if(ph !== false) elem.val(ph);
                            },
                            isShown : function (elem) {
                                var ph = elem.data("placeholder");
                                return (ph !== false)  && trim(elem.val()) === trim(ph);
                            },
                            setup : function () {
                                var elems = self.elem.find("[data-placeholder]"),
                                    util  = self.util,
                                    utilPH = util.placeHolders,
                                    apply = utilPH.apply,
                                    bindOptionalElem = utilPH.bindOptionalElem;

                                if (elems.length > 0) {
                                    elems.each(function() {
                                        var $this = $(this);

                                        apply($this);

                                        if (!($this.data("_data_"))) {
                                            bindOptionalElem($this);
                                        }
                                    });
                                }
                            },
                            bindOptionalElem : function (elem) {
                                var util = self.util,
                                    utilPH = self.util.placeHolders;
                                elem.on({
                                    focusin : function () {
                                        var $this = $(this);
                                        if (utilPH.isShown($this)) $this.val("");
                                    },
                                    focusout : function () {
                                        var $this = $(this);
                                        if (util.isBlank($this.val())) utilPH.apply($this);
                                    }
                                });
                            }
                        };

                        return true;
                    }

                    return false;
                },

                matchRegex : function (regex, val) {
                    return self.util.isntBlank(val) ? regex.test(noSpaces(val)) : false;
                },

                addError : function (name, msg, prop) {
                   if (!prop) self.setupErrors[name] = msg;
                   else self.setupErrors[prop][name] = obj;
                },

                debugMode : function () {
                    var setupErrors = !isEmptyObj(self.setupErrors) ? self.setupErrors : "No Errors Found",

                        masterObj   = !isEmptyObj(self.Master) ? self.Master : "Master Is Empty { }";

                        //console.log setup errors object
                        log("<SetupErrorsObject>");
                        log(setupErrors);
                        log("</SetupErrorsObject>");

                        log("\n\n//----------------------\n\n");

                        //console.log master object
                        log("<MasterObject>");
                        log(masterObj);
                        log("</MasterObject>");

                    return;
                },

                addSetting : function (name, obj, prop) {
                    if (!prop) self.Master[name] = obj;
                    else self.Master[prop][name] = obj;
                },

                noErrors : function () {
                    return isEmptyObj(self.setupErrors);
                },

                submitEventCheck : function (btn) {
                    return btn.data("hover"); //bool
                },

                submitForm : function () {
                    var form = self.elem,
                        submitElem = form.find("[name='submit']"),
                        detectIdOfSubmit = form.find("#submit");

                    if (self.Master.submitAction) {
                        form.attr("action", self.Master.submitAction);
                    }

                    if (typeof self.util.swapValuesOnSubmit === "function") {
                        self.util.swapValuesOnSubmit();
                    }

                    if (submitElem.length > 0) {
                        submitElem.attr("name", "");
                    }

                    if (detectIdOfSubmit.length > 0) {
                        detectIdOfSubmit.attr("id","");
                    }

                    form.trigger("submit");

                    return;
                },

                validateAllFields : function () {
                    var elems  = self.Master.elems.required,
                        elem,
                        util = self.util,
                        errUtil = util.formErr,
                        errors = [],
                        err_len,
                        prop;

                    for (prop in elems) {
                        if (hasOwnProp(elems, prop)) {
                            elem = elems[prop];

                            if (!util.validateField(elem)) {
                                errUtil.apply(elem);
                                errors.push(prop);
                            }
                        }
                    }

                    err_len = errors.length;


                    self.Master.totalErrors = err_len > 0 ? err_len : 0;

                    //succeed if errors array is empty
                    return self.Master.totalErrors <= 0;
                },

                validateField : function (elem) {
                    var check, 
                        _data_ = elem.data("_data_"),
                        errCSS = self.Master.errorCSS,
                        successCSS = self.Master.successCSS,
                        val = trim(elem.val()),
                        collection = self.elem.find("[name='"+elem.attr("name")+"']"),
                        isNamedCollection = (collection && collection.length > 1) || collection[0].getAttribute("type") == "checkbox";

                    if(self.util.placeHolders && self.util.placeHolders.isShown(elem)) {
                        elem.val("");
                    }

                    if (val === trim(_data_.msg) && elem.length <= 1 && !isNamedCollection) check = false;
                    else {
                        if (isNamedCollection) {
                            check = _data_.vFunc( trim(elem.val()), collection);
                        }
                        else {
                            check = _data_.vFunc(trim(elem.val()));
                        }
                    }

                    //flag with success
                    if(successCSS && !!check) {
                        if (elem.data("relErrNode")) {
                            elem.data("relErrNode")
                                .removeClass(errCSS)
                                .text("");
                            if (isNamedCollection) {
                                collection.addClass(successCSS);
                                if (errCSS) collection.removeClass(errCSS);
                            } 
                            else {
                                elem.addClass(successCSS);
                                if (errCSS) elem.removeClass(errCSS);
                            } 
                        }
                        else if (isNamedCollection) {
                            if(errCSS) collection.removeClass(errCSS);
                            collection.addClass(successCSS);
                        }
                        else {
                            if(errCSS) elem.removeClass(errCSS);
                            elem.addClass(successCSS);
                        } 
                        
                    }
                    else if (!!check) {
                        if (elem.data("relErrNode")) {
                            elem.data("relErrNode")
                                .text("");
                        }
                    }

                    if (errCSS && !check) {
                        if (elem.data("relErrNode")) {
                            elem.data("relErrNode").addClass(errCSS);

                            if (isNamedCollection) {
                                collection.addClass(errCSS);
                                if (successCSS) collection.removeClass(successCSS);
                            } 
                            else {
                                elem.addClass(errCSS);
                                if (successCSS) elem.removeClass(successCSS);
                            } 
                        }
                        else if (isNamedCollection){
                            if (successCSS) collection.removeClass(successCSS);
                            collection.addClass(errCSS);
                        }
                        else {
                            if (successCSS) elem.removeClass(successCSS);
                            elem.addClass(errCSS);
                        } 
                    }

                    return check;
                },

                prepareSubmission : function () {
                    var beforeSubmit = self.Master.beforeSubmit,
                        len, i;

                    if (!self.Master.beforeSubmit || self.Master.beforeSubmit.length <= 0) {
                        return true;
                    }
                    else {
                        len = beforeSubmit.length;
                        i   = 0;

                        for (; i < len; i += 1) {
                            if (typeof beforeSubmit[i] !== "function") {
                                log("#" + i + " item in beforeSubmit is not a function");
                                return false;
                            }
                            // call cb and pass in our form elem 
                            if (!beforeSubmit[i](self.elem)) return false;
                            else continue;
                        }
                    }

                    return true; // all functions returned true.
                },

                notify : function () {
                    var msg = self.Master.alertMsg,
                        numVar = "{num}";
                        
                    if (msg.indexOf(numVar) > -1) {
                        msg = msg.replace(numVar, self.Master.totalErrors);
                    }

                    alert(msg);
                }
            };

            this.util.bind = {
                submitBtn : function () {
                    var util = self.util,
                        submitBtn = self.Master.elems.submitBtn,
                        alertMsg = self.Master.alertMsg ? self.Master.alertMsg : undefined;

                        if (self.Master.alertMsg) {
                            submitBtn.data("alertMsg", self.util.notify);
                        }

                    self.Master.elems.submitBtn.on({
                        click : function (e) {
                            var $this = $(this);
                            
                            //make sure elem is hovered
                            if (!util.submitEventCheck($this)) return false;

                            if (util.validateAllFields()) {

                                if (util.prepareSubmission()) {
                                    util.submitForm();
                                }
                            }
                            else {
                                if (alertMsg) $this.data("alertMsg")();
                            }

                            e.preventDefault();
                            return false;
                        },

                        mouseenter : function () {
                            $(this).data("hover", true);
                        },

                        mouseleave : function () {
                             $(this).data("hover", false);
                        }
                    });
                },

                delegateEvents : function (elemList) {
                    var util = self.util,
                        formErr = util.formErr,
                        placeHolders = typeof util.placeHolders !== "object" ? false : util.placeHolders;

                    self.elem.on({
                        focusin : function (e) {
                            var $this = $(this),
                                errCSS = self.Master.errorCSS,
                                successCSS = self.Master.successCSS;

                            if ((placeHolders && placeHolders.isShown($this)) ||  util.formErr.isShown($this)) {
                                if (errCSS) $this.removeClass(errCSS);
                                if (successCSS) $this.removeClass(successCSS);
                                $this.val("");
                            }

                        },
                        focusout : function (e) {
                            var $this = $(this),
                                val   = trim($this.val()),
                                PH    = $this.data("placeholder"),
                                errCSS = self.Master.errorCSS,
                                successCSS = self.Master.successCSS;

                            if (util.isntBlank(val) && !util.validateField($this)) {
                                formErr.apply($this);
                            }
                            else if (util.isBlank(val) && placeHolders && PH) {
                                if (errCSS) $this.removeClass(errCSS);
                                if (successCSS) $this.removeClass(successCSS);
                                placeHolders.apply($this);
                            }
                            else if (util.isBlank(val) && !PH && !util.validateField($this)) {
                                formErr.apply($this);
                            }
                        },

                        change : function (e) {
                            var $this = $(this),
                                errCSS = self.Master.errorCSS,
                                successCSS = self.Master.successCSS,
                                collection = self.elem.find("[name='"+$this.attr("name")+"']"),
                                isNamedCollection = collection && collection.length > 1 || collection[0].getAttribute("type") == "checkbox",

                                nodename = e.target.nodeName;

                            if (nodename === "SELECT") {
                                $this.trigger("focusout");
                                return;
                            }

                            if (isNamedCollection && !util.validateField($this)) {
                                formErr.apply(collection, true);
                            }
                            
                        }
                    }, elemList);
                }
            };

            this.util.formErr = {
                apply : function (elem, collection) {
                    var errCSS = self.Master.errorCSS,
                        successCSS = self.Master.successCSS;

                    if (elem.data("relErrNode")) {
                        elem.data("relErrNode").text( elem.data("_data_").msg );
                        if (successCSS) elem.removeClass(successCSS);
                    }
                    else {
                        if(!(elem.length > 1) && !collection) {
                            elem.val( elem.data("_data_").msg );
                        }
                    }
                    
                },
                isShown : function (elem) {
                    return trim(elem.val()) === elem.data("_data_").msg;
                }
            };

            return this;
        };

        //---------------------------
        // setup functions w/defaults.
        formDefender.setUpConfig = function () {
            var self = this, 
                config,

                //helper
                processOptions = function (prop, userOpt, option) {
                    var passed;
                    if ( callOptionFunc(userOpt, option) ) {
                        self.util.addSetting(prop, userOpt);
                        passed = true;
                    }
                    else {
                        self.util.addError(prop, {
                            valueGiven : userOpt,
                            possibleValues : option.opt,
                            error : "Incorrect Value(s) Given",
                            req : option.req,
                            def : option.def
                        });
                        passed = false;
                    }
                    return passed;
                },

                //helper
                callOptionFunc = function (userOpt, option) {
                    var len, i;

                    //if option.func is an array of funcs, loop through and call them.
                    if (isArr(option.func)) {
                        len = option.func.length;
                        i = 0;
                        for (; i < len; i += 1) {
                            if (typeof option.func[i] === "function") {
                                if (option.opt) {
                                    if (!option.func[i](option.opt, userOpt)) return false;
                                    continue;
                                }
                                else {
                                    if (!option.func[i](userOpt)) return false;
                                    continue;
                                }
                            }
                        }

                        return true;
                    }

                    return option.opt ? option.func(option.opt, userOpt) : option.func(userOpt);
                };

            config = this.setUpConfig = {}; //redefine.

            //setup function.
            config.init = function () {
                var prop,

                    options = self.setUpConfig.options, 
                    option,

                    userOpts = self.O,
                    userOpt;

                //loop through config settings (exclude elems)
                for (prop in options) {
                    if (options.hasOwnProperty(prop)) {

                        option  = options[prop]; //object literal
                        userOpt = userOpts[prop]; //value that user passed

                        //if param is req and not passed in
                        if (!!option.req && !hasOwnProp(userOpts, prop)) {
                            self.util.addError(prop, {
                                valueGiven : "None",
                                possibleValues : !!option.opt ? option.opt : "None Specified",
                                error : "Required Argument(s) Not Passed",
                                req : option.req,
                                def : option.def
                            });
                            continue;
                        }
                        //if param was passed in
                        else if (userOpt !== undefined) {
                            //has options to compare against
                            if (!!option.opt) {
                                if (!processOptions(prop, userOpt, option)) continue;
                            }
                            if (callOptionFunc(userOpt, option)){
                                self.util.addSetting(prop, userOpt);
                            }
                            else {
                                self.util.addError(prop, {
                                    valueGiven : userOpt,
                                    possibleValues : !!option.opt ? option.opt : "None Specified",
                                    error : "Incorrect Value Supplied",
                                    req : option.req,
                                    def : option.def
                                });
                                continue;
                            }

                            // if formatting array of functions exists 
                            // loop through and reformat
                            if (hasOwnProp(option, "format") && isArr(option.format)) {
                                (function(){
                                    var i = 0,
                                        funcList = option.format,
                                        len = funcList.length;

                                    for (; i < len; i += 1) {
                                        if (typeof funcList[i] !== "function") continue;
                                        self.util.addSetting(prop, funcList[i](userOpt) );
                                    }
                                }())
                            }
                        }
                        //param was not passed for value and it's not req
                        else {
                            self.util.addError(prop, {
                                valueGiven : "None",
                                possibleValues : !!option.opt ? option.opt : "None Specified",
                                error : "No Value Supplied",
                                req : option.req,
                                def : option.def
                            });
                            continue;
                        }
                    }
                }

                return self.setUpConfig;
            };

            //loop through errors and insert default values for optional settings.
            //errors referring to required elements will remain.
            config.useDefaults = function () {
                var prop, error, errors = self.setupErrors;

                for (prop in errors) {
                    if (errors.hasOwnProperty(prop)) {
                        error = errors[prop];

                        if (!error.req && (error.def || typeof error.def === "boolean" )) {
                            self.util.addSetting(prop, error.def);
                            delete errors[prop];
                        }
                        else if (!error.req) {
                            delete errors[prop];
                        }
                    }
                } 
                return self.setUpConfig;
            };

            //main config option w/settings and defaults
            config.options = {

                beforeSubmit : {
                    req  : false,
                    func : isArr
                },

                submitAction : {
                    req  : false,
                    func : self.util.isntBlank
                },

                alertMsg : {
                    req : false,
                    func : self.util.isntBlank
                },

                placeHolders : {
                    req  : false,
                    def  : false,
                    func : self.util.placeHolders
                },

                errorCSS : {
                    req : false,
                    def  : false,
                    func : self.util.isntBlank,
                    format : [
                        function (str) {
                            return str[0] === "." ? str.slice(1) : str;
                        }
                    ]
                },

                successCSS : {
                    req : false,
                    def  : false,
                    func : self.util.isntBlank,
                    format : [
                        function (str) {
                            return str[0] === "." ? str.slice(1) : str;
                        }
                    ]
                }
            };

            //setup function for form elements.
            config.setupElems =  function () {
                var prop, 
                    elem, 
                    elems = self.setUpConfig.elems,
                    userOpt = self.O.elems,
                    masterElems,
                    failedElems = [],
                    tmp;

                // add elems object to master
                if (!self.Master.elems) {
                    masterElems = self.Master.elems = {};
                } 

                //check if req elems are set along with their types
                //add to error or master object
                for (prop in elems) {
                    if (hasOwnProp(elems, prop)) {
                        elem = elems[prop];

                        if (!!elem.req) {

                            //user did not supply required field(s) for elems
                            if (!hasOwnProp(userOpt, prop)) {
                                self.util.addError(prop, {
                                    valueGiven : "None",
                                    error : "Required Argument Not Passed",
                                    req : elem.req
                                });
                                failedElems.push(prop);
                                continue;
                            }
                            //user supplied incorrect type for argument
                            else if (typeof userOpt[prop] !== elem.type) {
                                self.util.addError(prop, {
                                    valueGiven : userOpt[prop],
                                    error : "Incorrect Type Given",
                                    req : elem.req,
                                    typeExpected : elem.type,
                                    typeGiven : typeof userOpt[prop]
                                });
                                failedElems.push(prop);
                                continue;
                            }
                            //req properties were defined and the correct types were given
                            else {
                                self.util.addSetting(prop, userOpt[prop], "elems");
                            }
                        }
                        //property is not required
                        else {
                            if (hasOwnProp(userOpt,prop)) {
                                if (typeof userOpt[prop] === elem.type) {
                                    self.util.addSetting(prop, userOpt[prop], "elems");
                                }
                                else {
                                    self.util.addError(prop, {
                                        valueGiven : userOpt[prop],
                                        error : "Incorrect Type Given To Optional Value",
                                        req : elem.req,
                                        typeExpected : elem.type,
                                        typeGiven : typeof userOpt[prop]
                                    });
                                    failedElems.push(prop);
                                    continue;
                                }
                            }
                        }
                    }
                } //end loop

                //no failed elems( required and optional values must not fail ). proceed.
                //transform values to nodes, create and store data object on each elem
                if (failedElems.length <= 0) {
                    for (prop in masterElems) {
                        if (hasOwnProp(masterElems, prop)) {

                            //call config.elem func and pass in the user's value
                            //second param tells function to add error to setupErrors
                            //funcs return a boolean
                            tmp = typeof masterElems[prop] === "string" ? [prop, masterElems] : masterElems[prop];

                            if (!elems[prop].func( tmp, true )) continue;
                        }
                    }
                }

                return self.setUpConfig;
            };

            //form elements and their corresponding setup funcs.
            config.elems = {

                submitBtn : {
                    req : true,
                    func : self.util.parseElems,
                    type : "string"
                },

                required : {
                    req : true,
                    func : self.util.parseElems,
                    type : "object"
                }
            };
            
            return this;
        };

        
        //-------------------------
        // validation funcions map.
        formDefender.vFuncsMap = function () {
            var self = this;

            this.vFuncsMap = {
                string : {
                    defErrMsg : "Please Fill Out This Field",
                    func : function (val) {
                        return self.util.isntBlank(val);
                    }
                },

                dropdown : {
                    defErrMsg : "Please Fill Out This Field",
                    func : function (val) {
                        return self.util.isntBlank(val);
                    }
                },

                email : {
                    defErrMsg : "Please Enter A Valid Email Address",
                    func : function (val) {
                        var rgx = /^((([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+(\.([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+)*)|((\x22)((((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(([\x01-\x08\x0b\x0c\x0e-\x1f\x7f]|\x21|[\x23-\x5b]|[\x5d-\x7e]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(\\([\x01-\x09\x0b\x0c\x0d-\x7f]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]))))*(((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(\x22)))@((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))$/i;
                        return self.util.matchRegex(rgx, val);
                    }
                },

                phone : {
                    defErrMsg : "Please Enter A Valid Phone Number",
                    func : function (val) {
                        var rgx = /^(1-?)?(\([2-9]\d{2}\)|[2-9]\d{2})-?[2-9]\d{2}-?\d{4}$/;
                        return self.util.matchRegex(rgx, val);
                    }
                },

                zip : {
                    defErrMsg : "Please Enter A Valid Zip Code",
                    func : function (val) {
                        var rgx = /^\d{5}([\-]\d{4})?$/;
                        return self.util.matchRegex(rgx, val);
                    }
                },

                postal : {
                    defErrMsg : "Please Enter A Valid Postal Code",
                    func : function (val) {
                        var rgx = /^[ABCEGHJKLMNPRSTVXY]\d[ABCEGHJKLMNPRSTVWXYZ]( )?\d[ABCEGHJKLMNPRSTVWXYZ]\d$/;
                        return self.util.matchRegex(rgx, val.toUpperCase());
                    }
                },

                radio : {
                    defErrMsg : "Please Select An Option",
                    func : function (val, nodes) {
                        var checked = false;
                            nodes.each(function(){
                                if ( $(this).is(":checked") ) {
                                    checked = true;
                                    return false;
                                }
                            });
                        return checked;
                    }
                },

                check : {
                    defErrMsg : "Please Select An Option",
                    func : function (val, nodes) {

                        var checked = false;

                            nodes.each(function(){

                                if ( $(this).is(":checked") ) {
                                    checked = true;
                                    return false;
                                }

                            });

                        return checked;
                    }
                }
            }

            return this;
        };

       //---------------------------
       // add formDefender to jQuery Prototype
       $formDefender = $.fn.formDefender = function (options) {
            return this.each(function(){
                ( Object.create( formDefender ) ).init(options, $(this), $formDefender);
            });
        };
        
}(jQuery, window, document)); 
