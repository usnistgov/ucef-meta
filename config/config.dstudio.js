'use strict';

var config = require('./config.webgme'),
	path = require('path'),
    validateConfig = require('webgme/config/validator');


// The paths can be loaded from the webgme-setup.json
config.plugin.basePaths.push(__dirname + '/../src/plugins');
config.visualization.decoratorPaths.push(__dirname + '/../src/decorators');
config.visualization.panelPaths.push(__dirname + '/../node_modules/webgme-codeeditor/src/visualizers/panels');
// allow server side execution
config.plugin.allowServerExecution = true
// Visualizer descriptors
config.visualization.visualizerDescriptors.push(__dirname + '/../src/visualizers/Visualizers.json');

config.visualization.decoratorPaths.push('./src/decorators');
config.seedProjects = {
            enable: true,
            allowDuplication: true, //requires mongodb >= 2.6
            defaultProject: 'BasicCASIM',
            basePaths: [path.join(__dirname, '../seeds')]
        };

config.client.log.level = 'debug';

// Add requirejs paths
config.requirejsPaths = {
  'CodeEditor': 'panels/CodeEditor/CodeEditorPanel',
  'panels': './src/visualizers/panels',
  'widgets': './src/visualizers/widgets',
  'c2wtng': './src/common',
  'C2Core': './src/plugins/C2Core',
  'FederatesExporter': './src/plugins/FederatesExporter',
  'DeploymentExporter': './src/plugins/DeploymentExporter',
  'C2Federates': './src/plugins/C2Federates',
  'RunFederation':'./src/plugins/RunFederation',
  'panels/CodeEditor': './node_modules/webgme-codeeditor/src/visualizers/panels/CodeEditor',
  'widgets/CodeEditor': './node_modules/webgme-codeeditor/src/visualizers/widgets/CodeEditor',
   "combinatorics": './node_modules/js-combinatorics/',
   'webgme-to-json':"./node_modules/webgme-to-json/"
};



// Enable Authentication
config.authentication.enable = true;
config.authentication.inferredUsersCanCreate = true;
config.authentication.allowGuests = false;
config.authentication.allowUserRegistration = false;

config.authentication.logInUrl = 'https://cps-vo.org/group/CPSWTTE/c2wtte-meta';
config.authentication.logOutUrl = 'https://cps-vo.org/group/CPSWTTE/c2wtte-meta';

config.authentication.jwt.privateKey ='/home/ubuntu/token_keys/private_key';
config.authentication.jwt.publicKey = '/home/ubuntu/token_keys/public_key';

/*config.server.log.transports = [{
			transportType: 'File',
			options: {
				name: 'error-file',
				filename: './server-debug.log',
				level: 'debug',
				handleExceptions: true,
				json: false
			}}];*/
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
