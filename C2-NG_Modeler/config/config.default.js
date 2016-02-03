'use strict';

var config = require('./config.webgme'),
	path = require('path'),
    validateConfig = require('webgme/config/validator');


// Add/overwrite any additional settings here
config.server.port = 8088;
config.mongo.uri = 'mongodb://127.0.0.1:27017/c2webgme';

config.visualization.decoratorPaths.push('./src/decorators');
config.seedProjects = {
            enable: true,
            allowDuplication: true, //requires mongodb >= 2.6
            defaultProject: 'BasicCASIM',
            basePaths: [path.join(__dirname, '../seeds')]
        };

validateConfig(config);
module.exports = config;