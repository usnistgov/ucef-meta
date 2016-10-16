define([
    'plugin/PluginConfig',
    'text!./metadata.json',
    'plugin/PluginBase',
    'webgme-to-json/webgme-to-json',
    'text!./BasePackage.pm.json',
    'q'
], function (
    PluginConfig,
    pluginMetadata,
    PluginBase,
    webgmeToJSON,
    baseMap,
    Q) {
    'use strict';

    pluginMetadata = JSON.parse(pluginMetadata);
    baseMap        = JSON.parse(baseMap);

    /**
     * Initializes a new instance of ExportToDB.
     * @class
     * @augments {PluginBase}
     * @classdesc This class represents the plugin ExportToDB.
     * @constructor
     */
    var ExportToDB = function () {
        // Call base class' constructor.
        PluginBase.call(this);
        this.pluginMetadata = pluginMetadata;
    };

    /**
     * Metadata associated with the plugin. Contains id, name, version, description, icon, configStructue etc.
     * This is also available at the instance at this.pluginMetadata.
     * @type {object}
     */
    ExportToDB.metadata = pluginMetadata;

    // Prototypical inheritance from PluginBase.
    ExportToDB.prototype = Object.create(PluginBase.prototype);
    ExportToDB.prototype.constructor = ExportToDB;

    ExportToDB.prototype.notify = function(level, msg) {
	var self = this;
	var prefix = self.projectId + '::' + self.projectName + '::' + level + '::';
	if (level=='error')
	    self.logger.error(msg);
	else if (level=='debug')
	    self.logger.debug(msg);
	else if (level=='info')
	    self.logger.info(msg);
	else if (level=='warning')
	    self.logger.warn(msg);
	self.createMessage(self.activeNode, msg, level);
	self.sendNotification(prefix+msg);
    };

    /**
     * Main function for the plugin to execute. This will perform the execution.
     * Notes:
     * - Always log with the provided logger.[error,warning,info,debug].
     * - Do NOT put any user interaction logic UI, etc. inside this method.
     * - callback always has to be called even if error happened.
     *
     * @param {function(string, plugin.PluginResult)} callback - the result callback
     */
    ExportToDB.prototype.main = function (callback) {
        var self = this;
        self.result.success = false;

        self.updateMETA({});

	console.log(baseMap);

	// What did the user select for our configuration?
	var currentConfig = self.getCurrentConfig();
	self.savePathMap = currentConfig.savePathMap;

	if (self.savePathMap)
	    self.notify('info', "Saving path map as well");

	var nodeName = self.core.getAttribute(self.activeNode, 'name');
	
	webgmeToJSON.notify = function(level, msg) {}

	// don't resolve pointers and children, keep webgmeNodes as part of the JSON.
	webgmeToJSON.loadModel(self.core, self.activeNode, false, true)
	    .then(function(model) {
		self.model = model;
		var dataBase = self.processModel(); // convert to the DB format
		return self.blobClient.putFile(
		    nodeName+'.db.json',
		    JSON.stringify(dataBase, null, 2));
	    })
	    .then(function(hash) {
		self.result.addArtifact(hash);
		if (self.savePathMap) {
		    return self.blobClient.putFile(
			nodeName + '.pm.json',
			JSON.stringify(self.model._PathToRef, null, 2));
		}
	    })
	    .then(function(hash) {
		if (hash)
		    self.result.addArtifact(hash);
		self.result.setSuccess(true);
		callback(null, self.result);
	    })
	    .catch(function(err) {
        	self.notify('error', err);
		self.result.setSuccess(false);
		callback(err, self.result);
	    })
		.done();
    };

    // NOTE: When this plugin is converted to export single objects
    //  (e.g. single COA or single Federate), the pointers and such
    //  that go outside the object's tree will need to be converted
    //  into shared object references.  This means that the pointers
    //  will need to be followed and checked to see if the referenced
    //  object exists in the shared object repository.  If not, the
    //  exporter should throw an error indicating that dependent
    //  objects have not been shared yet.  Conversely, these patterns
    //  will need to be thought through to see how these dependencies
    //  between shared objects should be managed (if they should) and
    //  how they can be checked and verified.
    //
    //  Otherwise, we must make the stipulation that all shared
    //  objects are self-contained and have no references to outside
    //  objects.
    ExportToDB.prototype.processModel = function() {
	var self = this;
	// THIS FUNCTION HANDLES CREATION OF SOME CONVENIENCE MEMBERS
	// FOR SELECT OBJECTS IN THE MODEL

	// Need to create:
	//  - GUIDs for all objects (for now)
	//    - will be handled by DB intf
	//  - Versions for relevant objects (for now)
	//    - will be handled by DB intf
	//  - __OBJECTS__ list
	//    - will be handled by DB intf
	//  - <type> lists of GUID references
	//    - will be handled by DB intf

	//  - dummy users and organizations?
	//    - will be handled by other subsystems
	//  - dummmy docker images and repositories?
	//    - will be handled by other subsystems

	// Need to convert:
	//  - federations to heirarchical federates
	//    - actually has to be done
	//  - all objects to __OBJECTS__ notation from example.js
	//    - actually has to be done
	//  - poitners to GUID references
	//    - will have to see exactly how this works, where we
	//      really get GUIDs from

	// for testing, need the structure that would be in the database
	self.initDB();

	var objectPaths = Object.keys(self.model.objects);
	// go through all objects and transform pointers to be RefSpecs
	objectPaths.map(function(objPath) {
	    var obj = self.model.objects[objPath];
	    self.processPointers(obj);
	});

	// these all update the model._DB with the relevant items
	objectPaths.map(function(objPath) {
	    var obj = self.model.objects[objPath];
	    if (self.core.isTypeOf(obj.node, self.META.InteractionBase))
		self.transformInteraction(obj);
	    else if (self.core.isTypeOf(obj.node, self.META.Federate))
		self.transformFederate(obj);
	});

	// now that we have (ALL) the interactions and federates, we
	// can make sure the federate dependencies can be captured
	objectPaths.map(function(objPath) {
	    var obj = self.model.objects[objPath];
	    if (self.core.isTypeOf(obj.node, self.META.StaticInteractionPublish)) {
		self.resolvePublishers(obj);
	    }
	    else if (self.core.isTypeOf(obj.node, self.META.StaticInteractionSubscribe)) {
		self.resolveSubscribers(obj);
	    }
	    else if (self.core.isTypeOf(obj.node, self.META.COA)) {
		self.transformCOA(obj);
	    }
	    else if (self.core.isTypeOf(obj.node, self.META.Experiment)) {
		self.extractExperiments(obj);
	    }
	});

	// now that we've transformed the model, get rid of the
	// original data
	var db = self.model._DB;

	// need for testing since we will need these other objects
	self.buildDummyObjects(db);

	return db;
    };

    ExportToDB.prototype.initDB = function() {
	var self = this;
	self.model._DB = {
	    "__OBJECTS__": {},
	    "Federates": [],
	    "COAs": [],
	    "Experiments": [],
	    "Interactions": [],
	};
	// convert GME Path to DB Ref structure
	self.model._PathToRef = Object.assign({}, baseMap); 
    };

    ExportToDB.prototype.getRefObject = function(path) {
	var self = this;
	var refObj = self.model._PathToRef[path];
	if (!refObj) { // need to make one
	    refObj = {
		GUID: self.generateGUID(),  // wouldn't actually happen in the plugin
		version: self.generateVersion()
	    };
	    self.model._PathToRef[path] = refObj;
	}
	return refObj;
    };

    ExportToDB.prototype.makeDBObject = function(original, obj, type) {
	// makes the object in the database and returns a reference object
	var self = this;
	var refObj = self.getRefObject(original.path);
	obj.GUID = refObj.GUID;
	obj.version = refObj.version;
	if (!self.model._DB.__OBJECTS__[obj.GUID])
	    self.model._DB.__OBJECTS__[obj.GUID] = {};
	self.model._DB.__OBJECTS__[obj.GUID][obj.version] = obj;
	self.model._DB[type].push(refObj);
	return refObj;
    };

    ExportToDB.prototype.processPointers = function(obj) {
	var self = this;
	// this function handles conversion from webgme pointers to
	// database pointers; this means that pointers don't go to
	// paths, they go to database references.
	// pointers contains name -> path mappings
	var ptrNames = Object.keys(obj.pointers);
	ptrNames.map(function(ptrName) {
	    var ptrPath = obj.pointers[ptrName];
	    obj.pointers[ptrName] = self.getRefObject(ptrPath);
	});
    };

    ExportToDB.prototype.transformParameter = function(obj) {
	var self = this;
	// converts from the generic representation we have here
	// to the specific representation given in example.js
	if (obj == null)
	    return null;
	var newObj = {
	    name: obj.name,
	    type: obj.attributes.ParameterType,
	    hidden: obj.attributes.Hidden
	};
	return newObj;
    };

    ExportToDB.prototype.transformParameters = function(obj) {
	var self = this;
	var parameters = [];
	obj.childPaths.map(function(childPath) {
	    var childObj = self.model.objects[childPath];
	    var childNode = childObj.node;
	    if (self.core.isTypeOf(childNode, self.META.Parameter)) {
		parameters.push(self.transformParameter(childObj));
	    }
	});
	return parameters;
    };

    ExportToDB.prototype.transformFederate = function(obj) {
	var self = this;
	// converts from the generic representation we have here
	// to the specific representation given in example.js
	if (obj == null)
	    return null;
	var newObj = {};
	newObj.__FEDERATE_BASE__ = obj.type;
	var attrNames = Object.keys(obj.attributes);
	attrNames.map(function(attrName) {
	    newObj[attrName] = obj.attributes[attrName];
	});
	// capture any child federates that may exist
	newObj.federates = self.makeAndReturnChildFederates(obj);
	// set the type based on whether it contains feds or not:
	if (newObj.federates.length) {
	    newObj.__FEDERATE_TYPE__ = "not directly deployable";
	}
	else {
	    newObj.__FEDERATE_TYPE__ = "directly deployable";
	}
	// capture any parameters that may exist
	newObj.parameters = self.transformParameters(obj);
	// initialize the inputs (interaction subscribe) and outputs (interaction publish)
	newObj.inputs = [];
	newObj.outputs = [];
	// add any missing keys needed by schema
	var addedKeys = ['documentation', 'repository'];
	addedKeys.map(function(key) {
	    newObj[key] = "No " +key + " exists yet.";
	});
	var refObj = self.makeDBObject(obj, newObj, 'Federates');
	return refObj;
    };

    ExportToDB.prototype.makeAndReturnChildFederates = function(obj) {
	// recursive function to make all heirarchical federates
	var self = this;
	var newFeds = []; // will contain the list of references to any child feds
	obj.childPaths.map(function(childPath) {
	    var childObj = self.model.objects[childPath];
	    var childNode = childObj.node;
	    if (self.core.isTypeOf(childNode, self.META.Federate)) {
		var refObj = self.transformFederate(childObj);
		if (newObj) {
		    newFeds.push(refObj);
		}
	    }
	});
	return newFeds; // list of references to new objects
    };
    
    ExportToDB.prototype.resolvePublishers = function(obj) {
	var self = this;
	var fedRef = obj.pointers.src;  // will have been converted to refObj
	var intRef = obj.pointers.dst;
	var fedObj = self.model._DB.__OBJECTS__[fedRef.GUID][fedRef.version];
	fedObj.outputs.push(intRef);
    };

    ExportToDB.prototype.resolveSubscribers = function(obj) {
	var self = this;
	var intRef = obj.pointers.src;
	var fedRef = obj.pointers.dst;
	var fedObj = self.model._DB.__OBJECTS__[fedRef.GUID][fedRef.version];
	fedObj.inputs.push(intRef);
    };

    ExportToDB.prototype.transformInteraction = function(obj) {
	var self = this;
	if (obj == null)
	    return null;
	var newObj = {};
	if (obj.pointers.base)
	    newObj.__INTERACTION_BASE__ = obj.pointers.base;
	else
	    newObj.__INTERACTION_BASE__ = obj.type; 
	var attrNames = Object.keys(obj.attributes);
	attrNames.map(function(attrName) {
	    newObj[attrName] = obj.attributes[attrName];
	});
	// get parameters here:
	newObj.parameters = self.transformParameters(obj);
	var refObj = self.makeDBObject(obj, newObj, 'Interactions');
	return refObj;
    };

    ExportToDB.prototype.transformCOA = function(obj) {
	var self = this;
	if (obj == null)
	    return null;
	var newObj = {};
	var attrNames = Object.keys(obj.attributes);
	attrNames.map(function(attrName) {
	    newObj[attrName] = obj.attributes[attrName];
	});
	// need to refactor this code now that we're not resolving the pointers and such
	// add all children here:
	newObj.childObjects = {};
	obj.childPaths.map(function(childPath) {
	    newObj.childObjects[childPath] = Object.assign({}, self.model.objects[childPath]);
	    newObj.childObjects[childPath].node = undefined;
	});
	var refObj = self.makeDBObject(obj, newObj, 'COAs');
	return refObj;
    };

    ExportToDB.prototype.extractExperiments = function(obj) {
    };

    ExportToDB.prototype.buildDummyObjects = function(db) {
	db.Projects = [];
	db.Users = [];
	db.Organizations = [];
	db.Repositories = [];
	db.Builds = [];
	db.Executions = [];
	db['Docker Images'] = [];
    };

    ExportToDB.prototype.generateGUID = function() {
	var d = new Date().getTime();
	if(window.performance && typeof window.performance.now === "function"){
            d += performance.now(); //use high-precision timer if available
	}
	var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = (d + Math.random()*16)%16 | 0;
            d = Math.floor(d/16);
            return (c=='x' ? r : (r&0x3|0x8)).toString(16);
	});
	return uuid;
    };

    ExportToDB.prototype.generateVersion = function(version) {
	return (version || '1.0') + '.1';
    };

    return ExportToDB;
});
