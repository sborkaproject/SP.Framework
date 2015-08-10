/*
 * SP Framework
 * VERSION: 1.021
 * DATE: 2015-08-10
 * 
 * @author: Hauts, misha@sborkaproject.com
 *
 *
 * jQuery.controlImageLoading is a custom modification of jquery.waitforimages.js
 * Thanks to alexanderdickson
 * https://github.com/alexanderdickson/waitforimages
 */

;(function () {
    var eventNamespace = 'controlImageLoading';
    var testProps = {
        deep: {
            props: ['backgroundImage', 'listStyleImage', 'borderImage', 'borderCornerImage', 'cursor'],
            attrs: ['srcset']
        },
        quick: {
            props: ['backgroundImage'],
            attrs: ['srcset']
        }
    }
    var matchUrl = /url\(\s*(['"]?)(.*?)\1\s*\)/g;
    var imageEvents = 'load.' + eventNamespace + ' error.' + eventNamespace;

    $.fn.controlImageLoading = function (finishedCallback, eachCallback, deepTest) {
        var nativeElement = this[0];
        var imageDatas = [];
        var $testElements = this.first().find('*').addBack();
        var totalTestElements = $testElements.length;

        var props = deepTest ? testProps.deep : testProps.quick;
        var hasImageProperties = props.props;
        var hasImageAttributes = props.attrs;
        var totalImageProperties = hasImageProperties.length;
        var totalImageAttributes = hasImageAttributes.length;

        for (var j = 0; j < totalTestElements; j++) {
            var $element = $testElements.eq(j);
            var element = $element[0];
            if ($element[0].tagName.toLowerCase() == 'img') {
                var src = $element.attr('src');
                if (src && src != '') {
                    imageDatas.push({
                        src: src,
                        element: element
                    });
                }
            }
            for (var i = 0; i < totalImageProperties; i++) {
                var property = hasImageProperties[i];
                var propertyValue = $element.css(property);
                if (propertyValue) {
                    var match;
                    while (match = matchUrl.exec(propertyValue)) {
                        imageDatas.push({
                            src: match[2],
                            element: element
                        });
                    }
                }
            }
            if (deepTest) {
                for (var i = 0; i < totalImageAttributes; i++) {
                    var attribute = hasImageAttributes[i];
                    var attributeValue = $element.attr(attribute);
                    if (attributeValue) {
                        var attributeValues = attributeValue.split(',');
                        var totalAttributeValues = attributeValues.length;
                        for (var t = 0; t < totalAttributeValues; t++) {
                            imageDatas.push({
                                src: $.trim(attributeValue[t]).split(' ')[0],
                                element: element
                            });
                        }
                    }
                }
            }
        }
        var imageDatasLength = imageDatas.length;
        var resultElements = [];
        if (imageDatasLength == 0) {
            finishedCallback.call(nativeElement);
        } else {
            var imageDatasLoaded = 0;
            for (var j = 0; j < imageDatasLength; j++) {
                var image = new Image();
                image.imageData = imageDatas[j];
                image.onload = image.onerror = function(e) {
                    imageDatasLoaded++;
                    eachCallback.apply(this.imageData.element, [imageDatasLoaded, imageDatasLength, typeof e == 'undefined' ? true : (e.type == 'load')])
                    if (imageDatasLoaded == imageDatasLength) {
                        finishedCallback.call(nativeElement);
                    }
                    this.onload = this.onerror = null;
                }
                image.src = image.imageData.src;
                resultElements.push(image.imageData.element)
            }
        }
        return resultElements;
    };
})();

;(function () {

    var U = 'undefined';
    var O = 'object';

    var internals = {

        VERSION: '1.020 [02.07.2015]',

        previousSP: window.SP,
        created: false,
        debugMode: false,
        started: false,
        startPage: null,
        startPageArgs: null,
        imageCollectedHandler: null,
        imageProgressHandler: null,
        imagesLoaded: false,
        windowLoaded: false,
        modulesByStates: {},
        passedStates: [],
        pageStarted: false,
        constructed: false,

        sayHello: function () {
            var symbols = ['☭', '★', '✪', '✫', '✌', '♚', '♛', '✍', '☢'];
            var symbol = symbols[Math.floor(Math.random() * symbols.length)];
            var styled = function (size, color) {
                return 'font-size:' + size + 'px;color:' + color + ';';
            }
            window.console.log('%c' + symbol, styled(48, '#DC143C'));
            window.console.log('%cSborka Project', styled(39, '#DC143C'));
            window.console.log('%cSP Framework v' + internals.VERSION + '\n\n', styled(17, '#11161F'));
        },
        log: function (message, color, forced) {
            try {
                if (internals.debugMode || forced) {
                    var messages = internals.isArray(message) ? message : [message];
                    var totalMessages = messages.length;
                    var now = internals.now().toFixed(2);
                    var prefixLength = now.length;
                    var arrow = ' ➙ '
                    var prefix = '';
                    while (prefixLength) {
                        prefix = ' ' + prefix;
                        prefixLength--
                    }
                    var stylesString = 'font-size: 11px; color: ' + (typeof color == 'undefined' ? '#666666' : color) + '; font-style: italic;'
                    window.console.log('🕒 %c' + now + arrow + messages[0], stylesString)
                    for (var k = 1; k < totalMessages; k++) {
                        window.console.log('%c   ' + prefix + arrow + messages[k], stylesString)
                    }
                }
            } catch (e) {
                internals.debugMode = false;
            }
        },
        error: function (message, forced) {
            internals.log(message, '#ff0000', forced);
        },
        inform: function (message, forced) {
            internals.log(message, '#579e6a', forced);
        },
        warn: function (message, forced) {
            internals.log(message, '#ff7700', forced);
        },
        cloneObjectPropsTo: function (cloneFrom, cloneTo, safeMode) {
            if (typeof cloneTo != O) {
                cloneTo = {};
            }
            if (typeof cloneFrom != O) {
                return cloneTo;
            }
            for (var i in cloneFrom) {
                if(safeMode){
                    if(typeof cloneTo[i] != 'undefined'){
                        internals.error('SiteController already has property \'' + i + '\'!')
                    }
                }
                cloneTo[i] = cloneFrom[i];
            }
            return cloneTo;
        },
        createInstance: function (name, props, lock, addEventDispatching ) {
            var result = internals.cloneObjectPropsTo(props, eval('new (function ' + name + '(){})()'));
            if(addEventDispatching){
                this.createEventDispatcher( result );
            }
            if (lock) {
                if (Object.seal) {
                    Object.seal(result);
                }
            }
            return result
        },
        capitalizeFirstLetter: function (string) {
            return string.charAt(0).toUpperCase() + string.slice(1);
        },
        createName: function (string) {
            return internals.capitalizeFirstLetter($.trim(string));
        },
        cached: function () {
            var cached = initialize('SiteController', true);
            internals.cached = function () {
                return cached;
            }
            return internals.cached();
        },
        sortByInitPriority: function (array) {
            array.sort(function (a, b) {
                return b.initPriority - a.initPriority
            });
        },
        isArray: function (testArray) {
            return Object.prototype.toString.call(testArray) === '[object Array]';
        },
        now: function () {
            if (window['performance'] && window['performance']['now']) {
                internals.now = function () {
                    return window.performance.now()
                }
            } else {
                internals.now = function () {
                    return +(new Date())
                }
            }
            return internals.now();
        },
        argsToArray: function (args) {
            return Array.prototype.slice.call(args)
        },
        createEventDispatcher : function( target ){
            var listeners = {};
            target.listeners = listeners;
            target.addEventListener = function(type, callback, scope) {
                if(typeof listeners[type] == 'undefined' ){
                    listeners[type] = [];
                }
                var list = listeners[type];
                list.push({
                    callback: callback,
                    scope: scope
                })
                return this;
            };
            target.removeEventListener = function(type, callback) {
                var list = listeners[type];
                if (list) {
                    var i = list.length;
                    while (--i > -1) {
                        if (list[i].callback === callback) {
                            list.splice(i, 1);
                            return this;
                        }
                    }
                }
                return this;
            };
            target.removeEventListeners = function(type){
                listeners[type] = null;
                return this;
            }
            target.hasEventListeners = function(type){
                return typeof listeners[type] != 'undefined';
            }
            target.hasEventListener = function(type, callback){
                var list = listeners[type];
                if (list) {
                    var i = list.length;
                    while (--i > -1) {
                        if (list[i].callback === callback) {
                            return true;
                        }
                    }
                }
                return false;
            }                     
            target.dispatchEvent = function(type, props) {
                var list = listeners[type];
                if (list) {
                    props = props || {};
                    props.type = type;
                    var event = internals.createInstance('Event', props);                    
                    var i = list.length;
                    while (--i > -1) {
                        var listener = list[i];
                        if (listener) {
                            listener.callback.apply(listener.scope, [event]);
                        }
                    }
                }
                return this;
            };
            return target;
        }
    }

    function SP(){}
    SP.prototype.current = internals.cached();

    SP.prototype.create = function (name, debugMode, skipWindowScope) {
        if (internals.created) {
            return internals.error('SP instance \'' + this.current.name + '\' is already created!');
        }
        internals.created = true;
        internals.debugMode = debugMode ? true : false;
        var cached = this.current;
        this.current = initialize(name, skipWindowScope);

        function mix(cachedIn, writeTo) {
            var totalElements = cachedIn.all.length;
            for (var i in cachedIn) {
                var prop = cachedIn[i];
                for (var k = 0; k < totalElements; k++) {
                    var cachedElement = cachedIn.all[k];
                    if (cachedElement === prop) {
                        writeTo[i] = cachedElement;
                        writeTo.all.push(cachedElement);
                    }
                }
            }
        }

        mix(cached.elements, this.current.elements);
        mix(cached.pages, this.current.pages);
        mix(cached.modules, this.current.modules);

        if (debugMode) {
            internals.sayHello();
        }
        return this.current;
    }

    // Core:
    function initialize(name, skipWindowScope) {
        name = typeof name == U ? 'SiteController' : internals.createName(name);
        var SiteController = internals.createInstance(name, {
            name: name,

            // States
            states: internals.createInstance('States', {
                INIT: 'init',
                DOM_READY: 'dom-ready',
                WINDOW_LOADED: 'window-loaded',
                IMAGES_LOADED: 'images-loaded'
            }, true),

            // Custom:
            customs: internals.createInstance('Customs'),
            events: internals.createInstance('Events'),

            // Utils
            utils: internals.createInstance('Utils', {
                createInstance: function (name, props, lock) {
                    return internals.createInstance(name, props, lock)
                },
                capitalizeFirstLetter: function (string) {
                    return internals.capitalizeFirstLetter(string)
                },

                log: function () {
                    internals.log(internals.argsToArray(arguments), true);
                },
                error: function () {
                    internals.error(internals.argsToArray(arguments), true);
                },
                warn: function () {
                    internals.warn(internals.argsToArray(arguments), true);
                },
                inform: function () {
                    internals.inform(internals.argsToArray(arguments), true);
                },

                shim: function (context, method, args, silent) {
                    return function () {
                        SiteController.utils.testApply(context, method, args, silent);
                    }
                },
                delegate: function (context, method) {
                    return function () {
                        method.apply(context, internals.argsToArray(arguments));
                    }
                },
                onceDelegate: function (context, method, args, silent) {
                    var called = false;
                    return function () {
                        if (called) {
                            return;
                        }
                        called = true;
                        SiteController.utils.testApply(context, method, args, silent);
                    }
                },
                testApply: function (context, method, args, silent) {
                    if (typeof method == 'function') {
                        args = typeof args == U ? [] : (SiteController.utils.isArray(args) ? args : [args]);
                        if (silent) {
                            try {
                                method.apply(context, args);
                            } catch (e) {}
                        } else {
                            method.apply(context, args);
                        }
                    }
                },
                isArray: function (testArray) {
                    return internals.isArray(testArray)
                },
                now: function () {
                    return internals.now()
                },
                hideElementShim: function (element) {
                    return function () {
                        $(element).hide();
                    }
                },
                removeElementShim: function (element) {
                    return function () {
                        $(element).remove();
                    }
                },
                getType: function (obj) {
                    return ({}).toString.call(obj).match(/\s([a-z|A-Z]+)/)[1].toLowerCase();
                },
                cubicProgress: function (value) {
                    value = value < 0 ? 0 : (value > 1 ? 1 : value);
                    value /= 1 / 2;
                    if (value < 1) {
                        return 1 / 2 * value * value * value;
                    }
                    value -= 2;
                    return 1 / 2 * (value * value * value + 2);
                },
                argsToArray: function () {
                    return internals.argsToArray(arguments);
                },
                createEventDispatcher: function( target ){
                    return internals.createEventDispatcher( target )
                }
            }),

            // Pages
            pages: internals.createInstance('Pages', {
                runCurrent: function () {
                    if (internals.pageStarted) {
                        return internals.error('Page already started')
                    }
                    internals.pageStarted = true;
                    if (internals.startPage && internals.startPage.init) {
                        SiteController.utils.testApply(internals.startPage, internals.startPage.init, internals.startPageArgs);
                    }
                },
                all: [],
                add: function (pageName, constructor, prototypeObject, classModificator) {
                    pageName = internals.createName(pageName);
                    internals.log('Add page: ' + pageName);
                    if (typeof this[pageName] != U) {
                        internals.error('Page ' + pageName + ' already added!');
                        return this[pageName];
                    }
                    var newPage = internals.createInstance(SiteController.utils.capitalizeFirstLetter(pageName), {
                        init: function (arguments) {
                            if (this.inited) {
                                return internals.error('Page already inited: ' + moduleName)
                            }
                            internals.log('Page init: ' + pageName);
                            this.inited = true;
                            internals.cloneObjectPropsTo(prototypeObject, this);
                            SiteController.utils.testApply(this, constructor, arguments);
                            return this;
                        },
                        name: pageName
                    }, false, true);
                    this[pageName] = newPage;
                    SiteController.utils.testApply(newPage, classModificator);
                    this.all.push(newPage);
                    return newPage;
                }
            }),

            // Modules
            modules: internals.createInstance('Modules', {
                all: [],
                add: function (moduleName, constructor, prototypeObject, initState, initPriority) {
                    moduleName = internals.createName(moduleName);
                    initPriority = typeof initPriority == 'number' ? initPriority : 0
                    internals.log('Add module: ' + moduleName + ', init state: ' + (typeof initState == U ? '[no init state]' : initState) + ', init priority: ' + initPriority);
                    if (typeof this[moduleName] != U) {
                        internals.error('Module ' + moduleName + ' already added!');
                        return this[moduleName];
                    }
                    var newModule = internals.createInstance(SiteController.utils.capitalizeFirstLetter(moduleName), {
                        init: function () {
                            if (this.inited) {
                                return internals.error('Module already inited: ' + moduleName)
                            }
                            internals.log('Module init: ' + moduleName);
                            this.inited = true;
                            internals.cloneObjectPropsTo(prototypeObject, this);
                            SiteController.utils.testApply(this, constructor, internals.argsToArray(arguments));
                            return this;
                        },
                        name: moduleName,
                        initPriority: initPriority
                    }, false, true);
                    this[moduleName] = newModule;
                    if (typeof initState != U) {
                        modulesByStates = internals.modulesByStates[initState];
                        if (typeof modulesByStates == U) {
                            internals.modulesByStates[initState] = modulesByStates = [];
                        }
                        modulesByStates.push(newModule);
                    }
                    this.all.push(newModule);

                    if ($.inArray(initState, internals.passedStates) > -1) {
                        internals.warn('Module ' + moduleName + ' initState already passed!');
                        newModule.init();
                    }
                    return newModule;
                },
                initAll: function () {
                    var totalModules = this.all.length;
                    internals.sortByInitPriority(this.all)
                    for (var k = 0; k < totalModules; k++) {
                        var module = this.all[k];
                        if (!module.inited) {
                            module.init();
                        }
                    }
                }
            }),

            // Elements:
            elements: internals.createInstance('Elements', {
                all: [],
                addElemented: function( elementsSelector, elementName, constructor, prototypeObject, classModificator ){
                    var elementClass = SiteController.elements.add(elementName, constructor, prototypeObject, classModificator)
                    SiteController.modules.add(elementName + 'Starter', function(){
                        var $elements = $(elementsSelector);
                        var totalElements = $elements.length;
                        for(var k=0; k<totalElements; k++){
                            new elementClass($elements.eq(k))
                        }
                    }, null, SiteController.states.DOM_READY)
                },
                add: function (elementName, constructor, prototypeObject, classModificator) {
                    elementName = internals.createName(elementName);
                    internals.log('Add element: ' + elementName);
                    if (typeof this[elementName] != U) {
                        internals.error('Element ' + elementName + ' already added!');
                        return this[elementName];
                    }
                    elementCodeString = '(function(){return function ' + elementName + '(){internals.log(\'Creating new element: \' + elementName);SiteController.utils.testApply(this, constructor, Array.prototype.slice.call(arguments));}})()';
                    var newElement = eval(elementCodeString);

                    internals.cloneObjectPropsTo(prototypeObject, newElement.prototype);
                    newElement.name = newElement.prototype.name = elementName

                    this[elementName] = newElement;
                    this.all.push(newElement)

                    SiteController.utils.testApply(newElement, classModificator)

                    return newElement;
                }
            }),

            // Methods:
            start: function (startPage) {
                if (internals.started) {
                    return internals.error('Site already started!')
                }
                internals.started = true;

                if (typeof startPage == 'string') {
                    startPage = this.pages[startPage];
                } else if(typeof startPage == 'function'){
                    startPage = internals.createInstance('InlinePageController', {
                        init: startPage
                    })
                }

                internals.startPage = startPage;
                internals.startPageArgs = Array.prototype.slice.call(arguments, 1);

                this.$window = $(window);
                this.$document = $(document);

                function launchNextState(state) {
                    internals.inform('Next state: ' + state);
                    var modulesByStates = internals.modulesByStates[state];

                    if (SiteController.utils.isArray(modulesByStates) && modulesByStates.length) {
                        var totalModulesByStates = modulesByStates.length;
                        internals.sortByInitPriority(modulesByStates);

                        for (var k = 0; k < totalModulesByStates; k++) {
                            var module = modulesByStates[k];
                            if (!module.inited) {
                                module.init();
                            }
                        }
                        internals.modulesByStates[state] = [];
                    }

                    internals.passedStates.push(state);
                    SiteController.utils.testApply(SiteController, internals.constructor, [state]);
                }

                function switchState(state) {
                    if (state == SiteController.states.INIT || state == SiteController.states.IMAGES_LOADED) {
                        launchNextState(state);

                    } else if (state == SiteController.states.DOM_READY) {
                        this.$html = $('html');
                        this.$body = $('body');
                        launchNextState(state);

                        var collectedImagedElements = this.$body.controlImageLoading(function() {
                            internals.imagesLoaded = true;
                            if (internals.windowLoaded) {
                                switchState.apply(SiteController, [SiteController.states.IMAGES_LOADED]);
                            }
                        }, function (loaded, total, success) {
                            SiteController.utils.testApply(SiteController, internals.imageProgressHandler, [loaded / total, this, success]);
                        }, true)

                        SiteController.utils.testApply(SiteController, internals.imageCollectedHandler, [collectedImagedElements]);

                    } else if (state == SiteController.states.WINDOW_LOADED) {
                        launchNextState(state)
                        internals.windowLoaded = true;
                        if (internals.imagesLoaded) {
                            switchState.apply(SiteController, [SiteController.states.IMAGES_LOADED]);
                        }
                    }
                }
                $(SiteController.utils.shim(this, switchState, [SiteController.states.DOM_READY]));

                this.$window.load(SiteController.utils.shim(this, switchState, [SiteController.states.WINDOW_LOADED]));
                switchState.apply(this, [SiteController.states.INIT])
            },
            construct: function (constructor, prototypeObject, imageCollectedHandler, imageProgressHandler) {
                if (internals.constructed) {
                    return internals.error('Site already constructed!')
                }
                internals.constructed = true;
                internals.constructor = constructor;
                internals.imageCollectedHandler = imageCollectedHandler;
                internals.imageProgressHandler = imageProgressHandler;
                internals.cloneObjectPropsTo(prototypeObject, this, true);
            }
        }, false, true);
        if (!skipWindowScope) {
            window[name] = SiteController;
        }
        return SiteController;
    }

    var SPInstance = new SP();
    SP.prototype.noConflict = function () {
        window.SP = internals.previousSP;
        return SPInstance;
    }
    SPInstance.VERSION = internals.VERSION;

    window.SP = SPInstance;
})();