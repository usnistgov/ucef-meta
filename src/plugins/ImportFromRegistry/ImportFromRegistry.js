/*globals define*/
/*jshint node:true, browser:true*/

/**
 * Generated by PluginGenerator 1.7.0 from webgme on Tue Jan 24 2017 15:36:09 GMT-0600 (CST).
 * A plugin that inherits from the PluginBase. To see source code documentation about available
 * properties and methods visit %host%/docs/source/PluginBase.html.
 */

define([
    'plugin/PluginConfig',
    'text!./metadata.json',
    'plugin/PluginBase',
    'js/RegistryKeys',
    'common/util/guid'
], function (
    PluginConfig,
    pluginMetadata,
    PluginBase,
    REG_KEYS,
    generateGuid) {
    'use strict';

    var INT_ATTRIBUTES = ["name", "Order", "LogLevel", "EnableLogging", "Delivery"],
        PARAM_ATTRIBUTES = ["name", "Hidden", "ParameterType"];

    var OBJ_ATTRIBUTES = ["name", "LogLevel", "EnableLogging"],
    
    pluginMetadata = JSON.parse(pluginMetadata);
    var callback = null;

    /**
     * Initializes a new instance of ImportFromRegistry.
     * @class
     * @augments {PluginBase}
     * @classdesc This class represents the plugin ImportFromRegistry.
     * @constructor
     */
    var ImportFromRegistry = function () {
        // Call base class' constructor.
        PluginBase.call(this);
        this.pluginMetadata = pluginMetadata;
    };

    /**
     * Metadata associated with the plugin. Contains id, name, version, description, icon, configStructue etc.
     * This is also available at the instance at this.pluginMetadata.
     * @type {object}
     */
    ImportFromRegistry.metadata = pluginMetadata;

    // Prototypical inheritance from PluginBase.
    ImportFromRegistry.prototype = Object.create(PluginBase.prototype);
    ImportFromRegistry.prototype.constructor = ImportFromRegistry;

    ImportFromRegistry.prototype.notify = function (level, msg) {
        var self = this;
        var prefix = self.projectId + '::' + self.projectName + '::' + level + '::';
        if (level == 'error')
            self.logger.error(msg);
        else if (level == 'debug')
            self.logger.debug(msg);
        else if (level == 'info')
            self.logger.info(msg);
        else if (level == 'warning')
            self.logger.warn(msg);
        self.createMessage(self.activeNode, msg, level);
        self.sendNotification(prefix + msg);
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
    ImportFromRegistry.prototype.main = function (cb) {
        // Use self to access core, project, result, logger etc from PluginBase.
        // These are all instantiated at this point.
        var self = this;

        self.action = this._currentConfig['action'] || "CREATE_NEW";
        self.object = this._currentConfig['object'] || {};
        self.objectKind = this._currentConfig['objectKind'] || "federate";
        self.existingInteractions = this._currentConfig['existingInteractions'] || {};
        self.objectsByKind = this._currentConfig['objectsByKind'] || {};

        //Pass in things like core, rootNode, activeNode and META from previous plugin

        self.core = this._currentConfig['core'] || self.core;
        self.rootNode = this._currentConfig['rootNode'] || self.rootNode;
        self.activeNode = this._currentConfig['activeNode'] || self.activeNode;
        self.META = this._currentConfig['META'] || self.META;
        self.multiplier = this._currentConfig['multiplier'];
        self.container = self.activeNode;

        if (self.multiplier < 0){
            self.multiplier = 0
        }
        if (self.multiplier > 100){
            self.multiplier = 100;
        }

        self.postProcesses = 0;

        if (self.objectKind == 'federate'){
            this.importFederate();
        }

        self.finalize();
        callback = cb;
    };

    ImportFromRegistry.prototype.finalize = function(){
        var self = this;

        if (self.postProcesses == 0) {
            // This will save the changes. If you don't want to save;
            // exclude self.save and call callback directly from this scope.
            self.save('ImportFromRegistry updated model.')
                .then(function () {
                    self.result.setSuccess(true);
                    callback(null, self.result);
                })
                .catch(function (err) {
                    // Result success is false at invocation.
                    callback(err, self.result);
                });
        }
    };

    ImportFromRegistry.prototype.upsertInteraction = function(
        interactionObj, isInput, federateNode){
        var self = this,
            connectionNode,
            attributeName,
            i,
            attributeValue;

        if (interactionObj != null && interactionObj.status == 'OK'){
            if (interactionObj.gmeNode == null) {
                // This interaction does not exists yet, so let's create it

                // Upsert base interaction and use that
                var baseInteraction = self.upsertInteraction(
                    interactionObj["base"],
                    isInput,
                    null
                );
                interactionObj.gmeNode = self.core.createNode({
                    parent: self.container,
                    base:baseInteraction
                });

                // Set attributes
                for (i = 0; i < INT_ATTRIBUTES.length; i++) {
                    attributeName = INT_ATTRIBUTES[i];
                    self.core.setAttribute(
                        interactionObj.gmeNode,
                        attributeName,
                        interactionObj.attributes[attributeName]);
                }

                // Create parameters and set their attributes when needed
                self.postProcesses += 1;
                self.core.loadChildren(interactionObj.gmeNode, function (err, children) {
                    if (err) {
                        // Something went wrong!
                        // Handle the error and return.
                    }
                    var parameters = interactionObj['parameters'],
                        paramObj,
                        paramNode,
                        existingParameters = {},
                        paramName,
                        i, j;

                    for (i = 0; i < children.length; i += 1) {
                        paramNode = children[i];
                        paramName = self.core.getAttribute(paramNode, 'name');
                        existingParameters[paramName] = paramNode;
                    }

                    parameters.map(function(param){
                        if (!existingParameters.hasOwnProperty(param['name'])){
                            paramObj = self.core.createNode({
                                parent: interactionObj.gmeNode,
                                base: self.META['Parameter']
                            });
                        } else {
                            paramObj = existingParameters[param['name']];
                        }
                        for (j = 0; j < PARAM_ATTRIBUTES.length; j++) {
                            attributeName = PARAM_ATTRIBUTES[j];
                            attributeValue = self.core.setAttribute(
                                paramObj,
                                attributeName,
                                param[attributeName]
                            );
                        }
                    });

                    self.postProcesses -= 1;
                    self.finalize();
                });

            }
            if (federateNode != null){
                if (interactionObj.gmeNode) {
                    // Connect federate node and interaction node
                    // Only works if they are contained in the same parent???
                    if (isInput){
                        // Create connection node
                        connectionNode = self.core.createNode(
                            {parent: self.container,
                                base:self.META['StaticInteractionSubscribe']}
                        );

                        // Set source and destination
                        self.core.setPointer(connectionNode, 'src', interactionObj.gmeNode);
                        self.core.setPointer(connectionNode, 'dst', federateNode);
                    } else {
                        // Create connection node
                        connectionNode = self.core.createNode({
                            parent: self.container,
                            base:self.META['StaticInteractionPublish']
                        });

                        // Set source and destination
                        self.core.setPointer(connectionNode, 'src', federateNode);
                        self.core.setPointer(connectionNode, 'dst', interactionObj.gmeNode);
                    }
                    interactionObj.gmeConnection = connectionNode;
                }
            }
        }

        if (interactionObj!=null)
        return interactionObj.gmeNode;
        else 
        return null

    };

    ImportFromRegistry.prototype.upsertObject = function(
        interactionObj, isInput, federateNode){
        var self = this,
            connectionNode,
            attributeName,
            i,
            attributeValue;

        if (interactionObj != null && interactionObj.status == 'OK'){
            if (interactionObj.gmeNode == null) {
                // This interaction does not exists yet, so let's create it

                // Upsert base interaction and use that
                var baseInteraction = self.upsertObject(
                    interactionObj["base"],
                    isInput,
                    null
                );
                if( baseInteraction == null){
                    baseInteraction = self.META['Object']
                }

                interactionObj.gmeNode = self.core.createNode({
                    parent: self.container,
                    base:baseInteraction
                });

                // Set attributes
                for (i = 0; i < OBJ_ATTRIBUTES.length; i++) {
                    attributeName = OBJ_ATTRIBUTES[i];
                    if(attributeName != null)
                    {
                    self.core.setAttribute(
                        interactionObj.gmeNode,
                        attributeName,
                        interactionObj.attributes[attributeName]);
                    }
                    
                }

                

                // Create parameters and set their attributes when needed
                self.postProcesses += 1;
                self.core.loadChildren(interactionObj.gmeNode, function (err, children) {
                    if (err) {
                        // Something went wrong!
                        // Handle the error and return.
                    }
                    var parameters = interactionObj['parameters'],
                        paramObj,
                        paramNode,
                        existingParameters = {},
                        paramName,
                        i, j;

                    for (i = 0; i < children.length; i += 1) {
                        paramNode = children[i];
                        paramName = self.core.getAttribute(paramNode, 'name');
                        existingParameters[paramName] = paramNode;
                    }

                    parameters.map(function(param){
                        if (!existingParameters.hasOwnProperty(param['name'])){
                            paramObj = self.core.createNode({
                                parent: interactionObj.gmeNode,
                                base: self.META['Parameter']
                            });
                        } else {
                            paramObj = existingParameters[param['name']];
                        }






                      var param_attr=  Object.keys(param)
                      param_attr.map(function(p_attr){
                            if(p_attr!= null){
                                attributeValue = self.core.setAttribute(
                                paramObj,
                                attributeName,
                                param[p_attr]
                            );
                            }
                      })
                    });

                    self.postProcesses -= 1;
                    self.finalize();
                });

            }
            if (federateNode != null){
                if (interactionObj.gmeNode) {
                    // Connect federate node and interaction node
                    // Only works if they are contained in the same parent???
                    if (isInput){
                        // Create connection node
                        connectionNode = self.core.createNode(
                            {parent: self.container,
                                base:self.META['StaticObjectSubscribe']}
                        );

                        // Set source and destination
                        self.core.setPointer(connectionNode, 'src', interactionObj.gmeNode);
                        self.core.setPointer(connectionNode, 'dst', federateNode);
                    } else {
                        // Create connection node
                        connectionNode = self.core.createNode({
                            parent: self.container,
                            base:self.META['StaticObjectPublish']
                        });

                        // Set source and destination
                        self.core.setPointer(connectionNode, 'src', federateNode);
                        self.core.setPointer(connectionNode, 'dst', interactionObj.gmeNode);
                    }
                    interactionObj.gmeConnection = connectionNode;
                }
            }
        }

        // return interactionObj.gmeNode;

        if (interactionObj!=null)
        return interactionObj.gmeNode;
        else 
        return null

    };




    ImportFromRegistry.prototype.importFederate = function(){
        var self = this,
            federateNode,
            federateNodes = [],
            baseType = 'Federate',
            fedNameSuffix = 1,
            loopCount = 0;

        if (self.object){
            // Create federate
            baseType = self.object['__FEDERATE_BASE__'] || 'Federate';
            while (loopCount <= self.multiplier){
                if (self.multiplier > 0) {
                    federateNode = self.core.createNode(
                       {parent: self.container, base:self.META[baseType]});
                    federateNodes.push(federateNode);

                    // Add attributes
                    var attrNames = Object.keys(self.object.attributes);
                    attrNames.map(function (attrName) {
                        var attrValue = self.object.attributes[attrName];
                        if (attrName == 'name'){
                            attrValue = attrValue + "_" + fedNameSuffix;
                        }
                        self.core.setAttribute(
                            federateNode,
                            attrName,
                            attrValue);
                    });

                    fedNameSuffix++;
                }

                // Add new connections
                // For now assume all the interactions are in the local context
                // Also assume that they all exist
                var inputNames = Object.keys(self.object.resolvedInputs);
                inputNames.map(function (inputName) {
                    // Improvement: Only import selected interactions
                    if (self.object.resolvedInputs[inputName].selected){
                        self.upsertInteraction(
                            self.object.resolvedInputs[inputName],
                            true,
                            federateNode
                        );
                    }
                });

                var outputNames = Object.keys(self.object.resolvedOutputs);
                outputNames.map(function (outputName) {
                    if (self.object.resolvedOutputs[outputName].selected) {
                        self.upsertInteraction(
                            self.object.resolvedOutputs[outputName],
                            false,
                            federateNode
                        );
                    }
                });

                var inputObjectNames = Object.keys(self.object.resolvedObjectInputs);
                inputObjectNames.map(function (inputName) {
                    // Improvement: Only import selected interactions
                    if (self.object.resolvedObjectInputs[inputName].selected){
                        self.upsertObject(
                            self.object.resolvedObjectInputs[inputName],
                            true,
                            federateNode
                        );
                    }
                });

                var outputObjectNames = Object.keys(self.object.resolvedObjectOutputs);
                outputObjectNames.map(function (outputName) {
                    if (self.object.resolvedObjectOutputs[outputName].selected) {
                        self.upsertObject(
                            self.object.resolvedObjectOutputs[outputName],
                            false,
                            federateNode
                        );
                    }
                });



                loopCount++;
                // Makes right no. of loops when multiplier is 0 or > 0
                if (loopCount == 1 && self.multiplier > 0) {
                    loopCount++;
                }
            }


            // Create new crosscut
            // Copy & update registry
            var ccRegistry = JSON.parse(JSON.stringify(
                self.core.getRegistry(self.container, REG_KEYS.CROSSCUTS) || []
            ));
            var ccId = "Crosscut_" + generateGuid();
            var ccDesc = {
                SetID: ccId,
                order: ccRegistry.length,
                title: self.object.attributes.name + " Crosscut"
            };
            ccRegistry.push(ccDesc);

            self.core.setRegistry(self.container, REG_KEYS.CROSSCUTS, ccRegistry);
            self.core.createSet(self.container, ccId);

            // Add members to the crosscut
            for (i = 0; i < federateNodes.length; i++) {
                self.core.addMember(self.container, ccId, federateNodes[i]);
            }

            inputNames.map(function (inputName) {
                if (self.object.resolvedInputs[inputName].selected){
                    var interaction = self.object.resolvedInputs[inputName];
                    self.core.addMember(self.container, ccId, interaction.gmeNode);
                    if (self.multiplier > 0) {
                        self.core.addMember(self.container, ccId, interaction.gmeConnection);
                    }
                }
            });
            outputNames.map(function (inputName) {
                if (self.object.resolvedOutputs[inputName].selected){
                    var interaction = self.object.resolvedOutputs[inputName];
                    self.core.addMember(self.container, ccId, interaction.gmeNode);
                    if (self.multiplier > 0) {
                        self.core.addMember(self.container, ccId, interaction.gmeConnection);
                    }
                }
            });



            inputObjectNames.map(function (inputName) {
                if (self.object.resolvedObjectInputs[inputName].selected){
                    var interaction = self.object.resolvedObjectInputs[inputName];
                    self.core.addMember(self.container, ccId, interaction.gmeNode);
                    if (self.multiplier > 0) {
                        self.core.addMember(self.container, ccId, interaction.gmeConnection);
                    }
                }
            });
            outputObjectNames.map(function (inputName) {
                if (self.object.resolvedObjectOutputs[inputName].selected){
                    var interaction = self.object.resolvedObjectOutputs[inputName];
                    self.core.addMember(self.container, ccId, interaction.gmeNode);
                    if (self.multiplier > 0) {
                        self.core.addMember(self.container, ccId, interaction.gmeConnection);
                    }
                }
            });
        }
    };

    return ImportFromRegistry;
});
