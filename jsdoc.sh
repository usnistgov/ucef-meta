#!/bin/bash
jsdoc -d=jsdoc/C2Core src/plugins/C2Core/*.js
jsdoc -d=jsdoc/C2Federates src/plugins/C2Federates/*.js
jsdoc -d=jsdoc/FederatesExporter src/plugins/FederatesExporter/*.js
jsdoc -d=jsdoc/DeploymentExporter src/plugins/DeploymentExporter/*.js

