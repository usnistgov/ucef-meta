'use strict';

var config = require('./config.webgme'),
	path = require('path'),
    validateConfig = require('webgme/config/validator');


// Add/overwrite any additional settings here
config.server.port = 8088;
//config.server.port = 80
config.mongo.uri = 'mongodb://127.0.0.1:27017/c2webgme';

config.requirejsPaths['webgme-to-json'] = "./node_modules/webgme-to-json/"

config.visualization.decoratorPaths.push('./src/decorators');

config.seedProjects.enable = true;
config.seedProjects.allowDuplication = true;
config.seedProjects.defaultProject = "BasicCASIM";
config.seedProjects.basePaths = [path.join(__dirname, '../seeds')];

config.client.log.level = 'debug';


config.plugin.allowServerExecution = true


validateConfig(config);
module.exports = config;
