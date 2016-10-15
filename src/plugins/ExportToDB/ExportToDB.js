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

	// don't resolve pointers, don't keep webgmeNodes as part of the JSON.
	webgmeToJSON.loadModel(self.core, self.activeNode, false, false)
	    .then(function(model) {
		return self.blobClient.putFile(nodeName+'.json', JSON.stringify(model.objects, null, 2));
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

    return ExportToDB;
});
