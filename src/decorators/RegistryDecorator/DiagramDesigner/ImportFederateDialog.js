/*globals define, $, EpicEditor*/
/*jshint browser:true*/
/**
 * @author U{Gabor Pap<macpapszi@gmail.com>}
 */

define(['js/util',
    'js/Constants',
    'text!./ImportFederateDialog.html',
    'css!./ImportDialog.css',
    'css!./ImportFederateDialog.css'
], function (Util,
             CONSTANTS,
             ImportFederateDialogTemplate
) {
    'use strict';

    var ImportFederateDialog,
        INT_ATTRIBUTES = ["Order", "LogLevel", "EnableLogging", "Delivery"],
        PARAM_ATTRIBUTES = ["Hidden", "ParameterType"];

    /**
     * ImportFederateDialog Constructor
     * Insert dialog modal into body and initialize editor with
     * customized options
     */
    ImportFederateDialog = function () {
        // Get Modal Template node for Editor Dialog and append it to body
        this._dialog = $(ImportFederateDialogTemplate);
        this._dialog.appendTo($(document.body));

        // Get element nodes
        this._el = this._dialog.find('.modal-body').first();
        this._dialogHeader = this._dialog.find('#dialogHeader').first();
        this._btnImport = this._dialog.find('.btn-import').first();
        this._btnOk = this._dialog.find('.btn-ok').first();
        this._dialogMessage = this._dialog.find('#dialogMessage').first();
        this._ioContainer = this._dialog.find('#ioContainer').first();
        this._inputTable = this._ioContainer.find('#inputTable').first();
        this._outputTable = this._ioContainer.find('#outputTable').first();

        this.importStruct = null;
        this.objectsByKind = null;
        this.existingInteractionNodes = null;
        this.federateObj = null;
        this.nodeObj = null;
        this.client = null;
        this.core = null;

        this.status = 'INITIAL';
    };

    /**
     * Initialize ImportFederateDialog by creating EpicEditor in Bootstrap modal
     * window and set event listeners on its subcomponents like save button. Notice
     * EpicEditor is created but not loaded yet. The creation and loading of editor
     * are seperated due to the reason decorator component is not appended to DOM within
     * its own domain.
     * @param  {String}     versionNumber  versionNumber to be rendered in editor initially
     * @param  {Function}   saveCallback   Callback function after click save button
     * @return {void}
     */
    ImportFederateDialog.prototype.initialize = function (client, nodeObj, importStruct, callback) {
        var self = this,
            objects,
            rootObject,
            rootGUID,
            result,
            pluginContext = client.getCurrentPluginContext(
                "FindObjects",
                nodeObj._id
            );

        this.client = client;
        this.nodeObj = nodeObj;
        this.importStruct = importStruct;
        this.status = 'INITIAL';

        rootObject = self.importStruct['__ROOT_OBJECT__'] || {};
        objects = self.importStruct['__OBJECTS__'] || {};
        if (rootObject){
            rootGUID = rootObject['GUID'];
        }
        if (rootGUID && objects[rootGUID]) {
            this.federateObj = objects[rootGUID] || null;
        }
        if (this.federateObj){
            this._dialogHeader.text('Import ' + this.federateObj.attributes['name'])
        }

        // Initialize Modal and append it to main DOM
        this._dialog.modal({show: false});

        //hook up event handlers
        this._dialog.on('hide.bs.modal', function(event) {
            if (callback) {
                callback.call(null, result);
            }
        });

        // Event listener on click for OK button
        this._btnImport.on('click', function (event) {
            event.stopPropagation();
            event.preventDefault();

            // Call import federate
            var importPluginCtx = client.getCurrentPluginContext(
                "ImportFromRegistry",
                self.nodeObj._id
            );

            importPluginCtx.pluginConfig = {
                'action': 'CREATE_NEW',
                'object': self.federateObj,
                'objectKind': 'federate',
                'existingInteractionNodes': self.existingInteractionNodes,
                'objectsByKind': self.objectsByKind,
                'core': self.core,
                'activeNode': self.activeNode,
                'rootNode': self.rootNode,
                'META': self.META
            };

            self.client.runBrowserPlugin(
                "ImportFromRegistry",
                importPluginCtx,
                function(err, result) {
                    if (err) {
                        self.status = 'IMPORT_ERROR';
                    } else {
                        // Display import status
                        self.status = 'IMPORT_SUCCESS';
                    }
                    self._updateUI();
                }
            );
        });

        // Event listener on click for OK button
        this._btnOk.on('click', function (event) {
            self._dialog.modal('hide');

            event.stopPropagation();
            event.preventDefault();
        });

        this._updateUI();

        pluginContext.pluginConfig = {
            'objectKinds': ['Interaction', 'Federate', 'Parameter']
        };
        this.client.runBrowserPlugin(
            "FindObjects",
            pluginContext,
            function(err, result) {
                if (err) {
                    // Log error somehow
                } else {
                    self.objectsByKind = result.objectsByKind;
                    self.core = result.core;
                    self.rootNode = result.rootNode;
                    self.activeNode = result.activeNode;
                    self.META = result.META;
                    self._processObjects();
                    self._updateUI();
                }
            }
        );
    };

    ImportFederateDialog.prototype._checkInteraction = function(
        interaction,
        parametersById,
        objects,
        containerObject,
        isBase
    ) {
        if (interaction == null){
            return null;
        }
        if (containerObject.hasOwnProperty(interaction.attributes.name)){
            return containerObject[interaction.attributes.name];
        }
        var self = this,
            gmeNode,
            newObject = {},
            errors = [],
            attributeValue,
            attributeName,
            parameters,
            parametersByName = {},
            paramName,
            childrenPaths,
            paramNode, newParamObj,
            i,j;

        for (var k in interaction) newObject[k] = interaction[k];
        newObject['status'] = 'OK';
        newObject['gmeNode'] = null;
        newObject['selected'] = true;
        newObject['isBase'] = isBase;

        if (interaction.hasOwnProperty("__INTERACTION_BASE__")){
            newObject["base"] = self._checkInteraction(
                objects[interaction["__INTERACTION_BASE__"]["GUID"]] || null,
                parametersById,
                objects,
                containerObject,
                true
            )
        }

        gmeNode = self.existingInteractionNodes[interaction.attributes['name']];
        if (gmeNode){
            newObject['gmeNode'] = gmeNode;

            // check interaction attributes first
            for (i = 0; i < INT_ATTRIBUTES.length; i++){
                attributeName = INT_ATTRIBUTES[i];
                attributeValue = self.core.getAttribute(gmeNode, attributeName);
                if (interaction.attributes[attributeName] != attributeValue){
                    errors.push('Attribute ' + attributeName +
                        '\'s the existing value is ' + attributeValue +
                        ' instead of ' + interaction.attributes[attributeName]);
                }
            }

            // now check parameters
            parameters = interaction['parameters'];
            parameters.map(function(param){
                parametersByName[param['name']] = param;
            });
            childrenPaths = self.core.getChildrenPaths(gmeNode);
            if (parameters.length != childrenPaths.length){
                errors.push('The number of parameters does not match, ' +
                    'existing number is ' + childrenPaths.length +
                    ' instead of ' + parameters.length
                )
            } else {
                for (i=0; i < childrenPaths.length; i++){
                    paramNode = parametersById[childrenPaths[i]];
                    paramName = self.core.getAttribute(paramNode, 'name');
                    newParamObj = parametersByName[paramName] || {};
                    for (j = 0; j < PARAM_ATTRIBUTES.length; j++){
                        attributeName = PARAM_ATTRIBUTES[j];
                        attributeValue = self.core.getAttribute(paramNode, attributeName);
                        if (attributeValue != newParamObj[attributeName]){
                            errors.push('Parameter ' + paramName +
                                '\'s attribute ' + attributeName +
                            ': existing value is ' + attributeValue +
                            ' instead of ' + newParamObj[attributeName]);
                        }
                    }
                }
            }

            if (errors.length > 0){
                newObject['status'] = 'Error';
                newObject['errors'] = errors;
                newObject['selected'] = false;
            }
        }

        containerObject[interaction.attributes.name] = newObject;
        return newObject;
    };
    
    ImportFederateDialog.prototype._processObjects = function () {
        var self = this,
            parametersById = {},
            objects,
            interactionName,
            interactionObj,
            paramPath;

        self.existingInteractionNodes = {};
        // Process existing interactions
        if (self.core && self.objectsByKind){
            if (self.objectsByKind['Interaction']){
                self.objectsByKind['Interaction'].map(function(interaction){
                    interactionName = self.core.getAttribute(interaction, "name");
                    self.existingInteractionNodes[interactionName] = interaction;
                });
            }
            if (self.objectsByKind['Parameter']){
                self.objectsByKind['Parameter'].map(function(param){
                    paramPath = self.core.getPath(param);
                    parametersById[paramPath] = param;
                });
            }
        }

        // Process interactions from federate to be imported
        // and compare them to existing ones to detect conflicts
        if (self.federateObj){
            objects = self.importStruct['__OBJECTS__'] || {};
            self.federateObj.resolvedInputs = {};
            self.federateObj.resolvedOutputs = {};

            self.federateObj.inputs.map(function(obj){
                interactionObj = objects[obj['GUID']] || null;
                self._checkInteraction(
                    interactionObj,
                    parametersById,
                    objects,
                    self.federateObj.resolvedInputs,
                    false
                );
            });

            self.federateObj.outputs.map(function(obj){
                interactionObj = objects[obj['GUID']] || null;
                self._checkInteraction(
                    interactionObj,
                    parametersById,
                    objects,
                    self.federateObj.resolvedOutputs,
                    false
                );
            });
        }
        self.status = 'PROCESSED';

    };

    ///////////////////////////////////////////////////////////////////////////
    // UI Related
    ///////////////////////////////////////////////////////////////////////////

    ImportFederateDialog.prototype._renderIO = function(ioMap, target) {
        var self = this,
            checkBox;

        target.empty();
        Object.keys(ioMap)
            .sort()
            .forEach(function (key, _) {
                if (ioMap[key]['isBase'] == false) {
                    var row = $('<tr/>').appendTo(target);
                    var statusCell = $('<td/>').appendTo(row);
                    var cell = $('<td/>').text(key).appendTo(row);
                    if (ioMap[key]['status'] == 'OK') {
                        //statusCell.attr('class', 'fa fa-check');
                        checkBox = $('<input>', {
                            type: "checkbox",
                            class: "importBox",
                            id: key,
                            checked: true
                        }).appendTo(statusCell);

                    } else {
                        statusCell.attr('class', 'status-error fa fa-exclamation');
                        cell.attr('title', ioMap[key]['errors'].join('\n'));
                        cell.attr('class', 'status-error');
                    }
                }
            });
        target.on("click", "input[type='checkbox']", function() {
            ioMap[this.id].selected = this.checked;
        });
    };

    ImportFederateDialog.prototype._renderIOs = function(){
        var self = this;

        this._renderIO(self.federateObj.resolvedInputs, self._inputTable);
        this._renderIO(self.federateObj.resolvedOutputs, self._outputTable);
    };

    ImportFederateDialog.prototype._updateUI = function () {
        var self = this;

        if (self.status == 'INITIAL'){
            self._dialogMessage.text("Loading information");
            self._dialogMessage.addClass("message");
            self._dialogMessage.show();
            self._ioContainer.hide();
            self._btnOk.hide();
            self._btnImport.hide();
        }
        if (self.status == 'PROCESSED'){
            self._dialogMessage.hide();
            self._renderIOs();
            self._btnOk.hide();
            self._btnImport.show();
            self._ioContainer.show();
        }
        if (self.status == 'IMPORT_SUCCESS'){
            self._dialogMessage.text("Federate was imported");
            self._dialogMessage.addClass("success");
            self._dialogMessage.addClass("message");
            self._dialogMessage.show();
            self._btnOk.show();
            self._btnImport.hide();
        }
        if (self.status == 'IMPORT_ERROR'){
            self._dialogMessage.text("There was an error");
            self._dialogMessage.addClass("error");
            self._dialogMessage.addClass("message");
            self._dialogMessage.show();
            self._btnOk.show();
            self._btnImport.hide();
        }
    };

    ImportFederateDialog.prototype.show = function () {
        var self = this;
        self._dialog.modal('show');
    };

    return ImportFederateDialog;
});
