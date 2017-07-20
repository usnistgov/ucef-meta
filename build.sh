#!/usr/bin/env bash

# Runs the complete set of template combiners.
# Necessary for WebGME to work properly.  
# Must be run when ever there has been a change to an *.ejs file.
echo =================================================
echo Rebuilding templates.
echo =================================================
DIR=`pwd`
cd src/plugins/C2Federates/Templates
echo "Combining scripts in $(pwd)"
node combine_templates.js > /dev/null 2>&1
cd $DIR
cd src/plugins/DeploymentExporter/Templates
echo "Combining scripts in $(pwd)"
node combine_templates.js > /dev/null 2>&1
cd $DIR
cd src/plugins/RunFederation/Templates
echo "Combining scripts in $(pwd)"
node combine_templates.js > /dev/null 2>&1

echo =================================================
echo Templates generated.
echo =================================================

cd $DIR
