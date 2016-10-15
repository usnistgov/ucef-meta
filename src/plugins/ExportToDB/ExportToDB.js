define([
    'plugin/PluginConfig',
    'text!./metadata.json',
    'plugin/PluginBase',
    'webgme-to-json/webgme-to-json',
    'q'
], function (
    PluginConfig,
    pluginMetadata,
    PluginBase,
    webgmeToJSON,
    Q) {
    'use strict';

    pluginMetadata = JSON.parse(pluginMetadata);

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

	// What did the user select for our configuration?
	var currentConfig = self.getCurrentConfig();
	self.modelHash = currentConfig.modelHash;

	var nodeName = self.core.getAttribute(self.activeNode, 'name');
	
	webgmeToJSON.notify = function(level, msg) {self.notify(level, msg);}

	// resolve pointers and children, don't keep webgmeNodes as part of the JSON.
	webgmeToJSON.loadModel(self.core, self.activeNode, true, false)
	    .then(function(model) {
		model = self.processModel(model); // convert to the DB format
		return self.blobClient.putFile(nodeName+'.json', JSON.stringify(model, null, 2));
	    })
	    .then(function(hash) {
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

    ExportToDB.prototype.processModel = function(model) {
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
	self.initDB(model);

	self.buildFederateTree(model);
	self.extractParameters(model);
	self.extractInteractions(model);
	self.extractCOAs(model);
	self.extractExperiments(model);
	self.extractConfigurations(model);

	// for testing since we will need these other objects
	self.buildDummyObjects(model);

	// now that we've transformed the model, get rid of the
	// original data
	model = model._DB;
	return model;
    };

    ExportToDB.prototype.initDB = function(model) {
	model._DB = {
	    "__OBJECTS__": {},
	    "projects": [],
	    "Users": [],
	    "organizations": [],
	    "Federates": [],
	    "coas": [],
	    "Experiments": [],
	    "Interactions": [],
	    "Parameters": [],
	    "repositories": [],
	    "builds": [],
	    "executions": [],
	    "Docker Images": []
	}
    };

    ExportToDB.prototype.buildFederateTree = function(model) {
	var self = this;
	// to iterate through the model we need to know exactly
	// what the META is

	console.log(model);
	
	// iterate through all the FOM Sheets in the root node
	model.root.FOMSheet_list.map(function(FOMSheetInfo) {
	    // Need to go through all children of the FOMSheet
	    // which are federates, should refactor a little so
	    // that there is just a single Federate_list which
	    // contains all types of federates.  will require some
	    // further processing.
	    var fedList = []
	    fedList = fedList.concat(FOMSheetInfo.Federate_list);
	    fedList = fedList.concat(FOMSheetInfo.CPNFederate_list);
	    fedList = fedList.concat(FOMSheetInfo.OmnetFederate_list);
	    fedList = fedList.concat(FOMSheetInfo.MapperFederate_list);
	    fedList = fedList.concat(FOMSheetInfo.JavaFederate_list);
	    fedList = fedList.concat(FOMSheetInfo.CppFederate_list);
	    fedList = fedList.concat(FOMSheetInfo.GridlabDFederate_list);
	    fedList.map(function(fedInfo) {
		var newObj = self.transformFederate(fedInfo);
		if (newObj) {
		    newObj.GUID = self.generateGUID(); // wouldn't actually happen in the plugin
		    self.generateVersion(newObj);
		    model._DB.__OBJECTS__[newObj.GUID] = {};
		    model._DB.__OBJECTS__[newObj.GUID][newObj.version] = newObj;
		    model._DB.Federates.push({ GUID: newObj.GUID, version: newObj.version });
		}
	    });
	});
    };

    ExportToDB.prototype.transformFederate = function(obj) {
	// converts from the generic representation we have here
	// to the specific representation given in example.js
	if (obj == null)
	    return null;
	var newObj = {};
	var attrNames = Object.keys(obj.attributes);
	attrNames.map(function(attrName) {
	    newObj[attrName] = obj.attributes[attrName];
	});
	return newObj;
    };

    ExportToDB.prototype.extractParameters = function(model) {
    };

    ExportToDB.prototype.extractInteractions = function(model) {
    };

    ExportToDB.prototype.extractCOAs = function(model) {
    };

    ExportToDB.prototype.extractExperiments = function(model) {
    };

    ExportToDB.prototype.extractConfigurations = function(model) {
    };

    ExportToDB.prototype.buildDummyObjects = function(model) {
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

    ExportToDB.prototype.generateVersion = function(object) {
	object.version = (object.version | '1.0') + '.1';
    };

    return ExportToDB;
});
