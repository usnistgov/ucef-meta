'use strict';

var config = require('./config.webgme'),
    validateConfig = require('webgme/config/validator');

// Add/overwrite any additional settings here
config.server.port = 8088;
config.mongo.uri = 'mongodb://127.0.0.1:27017/c2webgme';

validateConfig(config);
module.exports = config;