#!/usr/bin/env bash

# Runs the complete set of template combiners.
# Necessary for WebGME to work properly.  
# Must be run when ever there has been a change to an *.ejs file.
echo =================================================
echo Rebuilding templates.
echo =================================================
DIR=`pwd`
cd src/plugins/C2Federates/Templates
node combine_templates.js
cd $DIR
cd src/plugins/DeploymentExporter/Templates
node combine_templates.js
cd $DIR
cd src/plugins/RunFederation/Templates
node combine_templates.js
cd $DIR
