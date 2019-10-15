/*globals define*/
/*jshint node:true, browser:true*/

/**
 * Generated by PluginGenerator 0.14.0 from webgme on Wed Dec 02 2015 15:06:02 GMT-0600 (CST).
 */

define([
    'text!./metadata.json',
    'plugin/PluginBase',
    'ejs',
    'RunFederation/Templates/Templates',
    'c2wtng/modelLoader',
    'c2wtng/remote_utils',
    'q'
	
], function (
    pluginMetadata,
    PluginBase,
    ejs,
    TEMPLATES,
    loader,
    utils,
    Q
	
	) {
    'use strict';

    // fixed vars
    var marathonIP = "129.59.107.73";
    var marathonUser = 'ubuntu';
    var marathonKey = '/home/jeb/.ssh/id_rsa_marathon';

    var marathonUrl = "10.100.0.11";
    var inputfilesServerHost = "10.100.0.11";
    var inputfilesServerPort = 8081;

    var logPathBase = "/mnt/nfs/demo-share/";

    pluginMetadata = JSON.parse(pluginMetadata) 		
    /**
     * Initializes a new instance of RunFederation.
     * @class
     * @augments {PluginBase}
     * @classdesc This class represents the plugin RunFederation.
     * @constructor
     */
    var RunFederation = function () {
        // Call base class' constructor.
        PluginBase.call(this);
        this.pluginMetadata = pluginMetadata;
    };

    // Prototypal inheritance from PluginBase.
    RunFederation.prototype = Object.create(PluginBase.prototype);
    RunFederation.prototype.constructor = RunFederation;

    RunFederation.pluginMetadata = pluginMetadata;

    RunFederation.prototype.notify = function(level, msg) {
	var self = this;
	var prefix = self.projectId + '::' + self.projectName + '::' + level + '::';
	var max_msg_len = 100;
	if (level=='error')
	    self.logger.error(msg);
	else if (level=='debug')
	    self.logger.debug(msg);
	else if (level=='info')
	    self.logger.info(msg);
	else if (level=='warning')
	    self.logger.warn(msg);
	self.createMessage(self.activeNode, msg, level);
	if (msg.length < max_msg_len)
	    self.sendNotification(prefix+msg);
	else {
	    var splitMsgs = utils.chunkString(msg, max_msg_len);
	    splitMsgs.map(function(splitMsg) {
		self.sendNotification(prefix+splitMsg);
	    });
	}
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
    RunFederation.prototype.main = function (callback) {
        // Use self to access core, project, result, logger etc from PluginBase.
        // These are all instantiated at this point.
        var self = this;

        if (typeof WebGMEGlobal !== 'undefined') {
	    var msg = 'You must run this plugin on the server!';
	    self.notify('error', msg);
	    callback(new Error(msg), self.result);
        }

	// make sure it's always unique!
	var timestamp = (new Date()).getTime();
	self.basePath = '/home/vagrant/nistDemo/'+timestamp ;
	self.inputPrefix = self.basePath + '/input/';
	self.outputPrefix = self.basePath + '/output/';

	// What did the user select for our configuration?
	var currentConfig = self.getCurrentConfig();
	self.deploymentFiles = currentConfig.deploymentFiles;
	self.runLocally = currentConfig.runLocally;

        self.projectName = self.core.getAttribute(self.rootNode, 'name');

        var modelNode = self.activeNode;
	self.modelName = self.core.getAttribute(modelNode, 'name');

	self.dockerInfoMap = {
	    'ExecJava': {
		'name': 'cpswt/c2wtcore_v002',
		'tag': '170626'
	    },
	    'CppFed': {
		'name': 'cpswt/c2wtcore_v002',
		'tag': '170626'
	    },
	    'OmnetFed': {
		'name': 'cpswt/c2wtcore_v002',
		'tag': '170626'
	    },
	};

	var path = require('path');
	var filendir = require('filendir');
	self.root_dir = path.join(process.cwd(), 
				  'generated', 
				  self.project.projectId, 
				  self.branchName,
				  'models');

	return loader.loadModel(self.core, modelNode)
	    .then(function(federationModel) {
		self.federationModel = federationModel;
	    })
	    .then(function() {
		return self.renderDockerFile();
	    })
	    .then(function() {
		return self.renderStartScript();
	    })
	    .then(function() {
		return self.createInputsFolder();
	    })
	    .then(function() {
		return self.writeInputs();
	    })
	    .then(function() {
		return self.runSimulation();
	    })
	    .then(function() {
		return self.copyArtifacts();
	    })
	    .then(function() {
		self.result.success = true;
		self.notify('info', 'Simulation Complete.');
		callback(null, self.result);
	    })
	    .catch(function(err) {
		self.notify('error', err);
		self.result.success = false;
		callback(err, self.result);
	    });
    };

    RunFederation.prototype.renderDockerFile = function() {
	// render docker compose file with federate type + shared folder name + command
	var self = this;

	self.fedInfos = [];

	if (self.federationModel.JavaFederate_list) {
	    self.federationModel.JavaFederate_list.map((fed) => {
		self.fedInfos.push({
		    name: fed.name,
		    type: 'ExecJava'
		});
	    });
	}

	if (self.federationModel.CppFederate_list) {
	    self.federationModel.CppFederate_list.map((fed) => {
		self.fedInfos.push({
		    name: fed.name,
		    type: 'CppFed'
		});
	    });
	}
	console.log(self.fedInfos)

	self.dockerFileData = ejs.render(
	    TEMPLATES['dockerFileTemplate.ejs'],
	    {
		cpswtng_archiva_ip: "10.0.2.15",
		inputPrefix: self.inputPrefix,
		outputPrefix: self.outputPrefix,
		fedInfos: self.fedInfos,
		dockerInfoMap: self.dockerInfoMap
	    }
	);
	var path = require('path'),
	filendir = require('filendir'),
	fileName = 'docker-compose.yml';
	
	var deferred = Q.defer();
	filendir.writeFile(path.join(self.basePath, fileName), self.dockerFileData, function(err) {
	    if (err)
		deferred.reject(err);
	    else
		deferred.resolve();
	});
	return deferred.promise;
    };

    RunFederation.prototype.renderStartScript = function() {
	// render docker compose file with federate type + shared folder name + command
	var self = this;

	self.startScriptData = ejs.render(
	    TEMPLATES['startScript.ejs'], {}
	);
    };

    RunFederation.prototype.createInputsFolder = function() {
	var self = this;

	var path = require('path'),
	filendir = require('filendir'),
	fileName = 'start.sh';
	
	var tasks = self.fedInfos.map((fedInfo) => {
	    var deferred = Q.defer();
	    filendir.writeFile(path.join(
		self.inputPrefix + fedInfo.name, fileName), self.startScriptData, function(err) {
		if (err)
		    deferred.reject(err);
		else
		    deferred.resolve();
	    });
	    return deferred.promise;
	});
	return Q.all(tasks)
	    .then(function() {
		var deferred = Q.defer();
		filendir.writeFile(path.join(self.inputPrefix + 'FedManager', fileName), 
				   self.startScriptData, function(err) {
			if (err)
			    deferred.reject(err);
			else
			    deferred.resolve();
		    });
		return deferred.promise;
	    });
    };

    RunFederation.prototype.writeInputs = function() {
	// Copy the user input files (pom + xml + fed) into docker shared folder
	var self = this;
	var fs = require('fs'),
	// path = require('path'),
	unzip = require('unzip'),
	stream = require('stream'),
	fstream = require('fstream');

	return self.blobClient.getMetadata(self.deploymentFiles)
	    .then(function(metaData) {
		self.deploymentFilesName = metaData.name;
		return self.blobClient.getObject(self.deploymentFiles);
	    })
	    .then(function(objBuffer) {
		self.zipBuffer = new Buffer(objBuffer);
		var tasks = self.fedInfos.map((fedInfo) => {
		    var writeStream = fstream.Writer(self.inputPrefix+fedInfo.name);
		    var deferred = Q.defer();
		    writeStream.on('unpipe', () => {
			deferred.resolve();
		    });
		    var bufferStream = new stream.PassThrough();
		    bufferStream.end(self.zipBuffer);
		    bufferStream
			.pipe(unzip.Parse())
			.pipe(writeStream);
		    return deferred.promise;
		});
		return Q.all(tasks);
	    })
	    .then(function() {
		var writeStream = fstream.Writer(self.inputPrefix+'FedManager');
		var deferred = Q.defer();
		writeStream.on('unpipe', () => {
		    deferred.resolve();
		});
		var bufferStream = new stream.PassThrough();
		bufferStream.end(self.zipBuffer);
		bufferStream
		    .pipe(unzip.Parse())
		    .pipe(writeStream);
		return deferred.promise;
	    });
    };

    RunFederation.prototype.runSimulation = function() {
	var self = this;
	var path = require('path');
	var cp = require('child_process');

	self.notify('info', 'Starting Simulation');

	return self.startFederates()
	    .then(function() {
		return self.killFederates();
	    });
    };

    RunFederation.prototype.startFederates = function() {
	// run-cpp-feds.sh
	var self = this;
	var cp = require('child_process');
	var deferred = Q.defer();

	var fedMgr = cp.spawn('bash', [], {cwd:self.basePath});
	fedMgr.stdout.on('data', function (data) {
	    self.logger.error('STDOUT::'+data);
	});
	fedMgr.stderr.on('data', function (error) {
	    self.logger.error('STDERR::'+error);
	});
	fedMgr.on('exit', function (code) {
	    if (code == 0) {
		self.notify('info', 'Started Federates.');
		deferred.resolve(code);
	    }
	    else {
		self.notify('error', 'error code: ' + code);
		deferred.reject('federates:: child process exited with code ' + code);
	    }
	});
	setTimeout(function() {
	    self.notify('info', 'Starting Federates.');
	    fedMgr.stdin.write('sudo docker-compose up\n');
	    fedMgr.stdin.end();
	}, 1000);
	return deferred.promise;
    };

    RunFederation.prototype.killFederates = function() {
	// kill-all.sh
	var self = this;
	var cp = require('child_process');
	var deferred = Q.defer();

	var stopFeds = cp.spawn('bash', [], {cwd:self.basePath});
	stopFeds.stdout.on('data', function (data) {});
	stopFeds.stderr.on('data', function (error) {
	});
	stopFeds.on('exit', function (code) {
	    if (code == 0) {
		self.notify('info', 'Killed all experiment feds.');
		deferred.resolve(code);
	    }
	    else {
		deferred.reject('stopFeds:: child process exited with code ' + code);
	    }
	});
	setTimeout(function() {
	    self.notify('info', 'Killing experiment feds.');
	    //stopFeds.stdin.write('docker stop $(docker ps -a -q)\n');
	    stopFeds.stdin.write('sudo docker-compose down\n');
	    stopFeds.stdin.end();
	}, 1000);
	return deferred.promise;
    };

    RunFederation.prototype.copyArtifacts = function() {
	var self = this;
	self.notify('info', 'Copying output.');
	
	return new Promise(function(resolve, reject) {
	    var zlib = require('zlib'),
	    tar = require('tar'),
	    fstream = require('fstream'),
	    input = self.outputPrefix;

	    var bufs = [];
	    var packer = tar.Pack()
		.on('error', function(e) { reject(e); });

	    var gzipper = zlib.Gzip()
		.on('error', function(e) { reject(e); })
		.on('data', function(d) { bufs.push(d); })
		.on('end', function() {
		    var buf = Buffer.concat(bufs);
		    self.blobClient.putFile('output.tar.gz',buf)
			.then(function (hash) {
			    self.result.addArtifact(hash);
			    resolve();
			})
			.catch(function(err) {
			    reject(err);
			})
			    .done();
		});

	    var reader = fstream.Reader({ 'path': input, 'type': 'Directory' })
		.on('error', function(e) { reject(e); });

	    reader
		.pipe(packer)
		.pipe(gzipper);
	})
	    .then(function() {
		self.notify('info', 'Created archive.');
	    });
    };

    return RunFederation;
});
