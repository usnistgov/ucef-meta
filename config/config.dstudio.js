'use strict';

var config = require('./config.webgme'),
	path = require('path'),
    validateConfig = require('webgme/config/validator');


// Enable Authentication
config.authentication.enable = true;
config.authentication.inferredUsersCanCreate = true;
config.authentication.allowGuests = false;
config.authentication.allowUserRegistration = false;

config.authentication.logInUrl = 'http://cps-vo.org/group/CPSWTTE/c2wtte-meta'
config.authentication.logOutUrl = 'http://cps-vo.org/group/CPSWTTE/c2wtte-meta'

config.authentication.jwt.privateKey = path.join(__dirname, '..', '..', 'token_keys', 'private_key');
config.authentication.jwt.publicKey = path.join(__dirname, '..', '..', 'token_keys', 'public_key');



// Add/overwrite any additional settings here
config.server.port = 8088;
//config.server.port = 80
config.mongo.uri = 'mongodb://127.0.0.1:27017/c2webgme';

config.requirejsPaths['webgme-to-json'] = "./node_modules/webgme-to-json/"

config.visualization.decoratorPaths.push('./src/decorators');
config.seedProjects = {
            enable: true,
            allowDuplication: true, //requires mongodb >= 2.6
            defaultProject: 'BasicCASIM',
            basePaths: [path.join(__dirname, '../seeds')]
        };

config.client.log.level = 'debug';


validateConfig(config);
module.exports = config;
