# UCEF Metamodel

A Web-based Graphical Modeling Environment (WebGME) metamodel for the Universal Cyber-Physical Systems Environment for Federation (UCEF).

WebGME (https://webgme.org/) is a collaborative environment for the design of domain specific modeling languages and the creation of domain models. This repository defines a WebGME metamodel for the design of High Level Architecture (HLA) federations, and includes a set of WebGME plugins that convert those models into executable Java code.

This repository is meant to be used in conjunction with the UCEF virtual machine available at https://github.com/usnistgov/ucef and cannot be compiled on its own.

## JavaScript Plugin Documentation
A subset of the JavaScript plugins are compatible with JSDoc and HTML documentation can be generated for their functions. This section describes how to generate and access that documentation.

First, install JSDoc. For the UCEF Ubuntu virtual machine, execute `sudo apt-get install -y jsdoc-toolkit`.

Then, generate the HTML documentation using the script `jsdoc.sh` located in the same directory as this readme. This will generate a new directory `jsdoc` that will contain four sub-directories for the different WebGME plugins developed for UCEF. Because the JavaScript is all in the global namespace, each plugin has its own unique directory with its own `index.html` file for its documentation. All of the generated documentation will be in a sub-directory of `jsdoc`.

