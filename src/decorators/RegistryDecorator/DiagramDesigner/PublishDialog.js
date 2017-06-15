/*globals define, $, EpicEditor*/
/*jshint browser:true*/
/**
 * @author @author U{Gabor Pap<macpapszi@gmail.com>}
 */

define(['js/util',
    'js/Constants',
    'text!./PublishDialog.html',
    'js/Utils/ComponentSettings',
    'css!./PublishDialog.css'
], function (Util,
             CONSTANTS,
             PublishDialogTemplate,
             ComponentSettings) {
    'use strict';

    var PublishDialog,
        REGISTRY_ACCESS_SETTINGS = 'RegistryAccessSettings',
        REGISTRY_CONFIG = "Registry",
        registryAccessSettings = {
            registryURL:"https://vulcan.isis.vanderbilt.edu",
            username:"username",
            serviceToken:""
        };

    /**
     * PublishDialog Constructor
     * Insert dialog modal into body and initialize editor with
     * customized options
     */
    PublishDialog = function () {
        // Get Modal Template node for Editor Dialog and append it to body
        this._dialog = $(PublishDialogTemplate);
        this._dialog.appendTo($(document.body));

        // Get element nodes
        this._el = this._dialog.find('.modal-body').first();
        this._dialogHeader = this._dialog.find('#dialogHeader').first();
        this._btnPublish = this._dialog.find('.btn-publish').first();
        this._btnOk = this._dialog.find('.btn-ok').first();

        this._registryFields = this._el.find('#registryFields').first();
        this._urlInput = this._el.find('#url').first();
        this._urlGroup = this._el.find('#urlGroup').first();
        this._usernameInput = this._el.find('#username').first();
        this._usernameGroup = this._el.find('#usernameGroup').first();
        this._passwordInput = this._el.find('#password').first();
        this._passwordGroup = this._el.find('#passwordGroup').first();
        this._toolGroup = this._el.find('#toolGroup').first();
        this._toolSelector = this._el.find('#toolSelector').first();
        this._toolMessage = this._el.find('#toolMessage').first();
        this._toolDesc = this._el.find('#toolDesc').first();
        this._btnRenewToken = this._el.find('.btn-renew-token').first();
        this._registryFooter = this._el.find('#registryFooter').first();
        this._dialogMessage = this._el.find('#dialogMessage').first();

        this._objectTypeLegend = this._el.find('#objectTypeLegend');
        this._objectFields = this._el.find('#objectFields').first();
        this._nameInput = this._el.find('#name').first();
        this._versionInput = this._el.find('#versionNumber').first();
        this._descrInput = this._el.find('#description').first();



        this.registryURL = "";
        this.serviceToken = "";
        this.registryTools = [];
        this.modelObject = null;
        this.publishSuccess = false;
        this.nodeObj = null;
        this.client = null;
        this.isEmbedded = false;

        this.config = {"useRemote": true};
    };

    /**
     * Initialize PublishDialog by creating EpicEditor in Bootstrap modal
     * window and set event listeners on its subcomponents like save button. Notice
     * EpicEditor is created but not loaded yet. The creation and loading of editor
     * are seperated due to the reason decorator component is not appended to DOM within
     * its own domain.
     * @param  {String}     versionNumber  versionNumber to be rendered in editor initially
     * @param  {Function}   saveCallback   Callback function after click save button
     * @return {void}
     */
    PublishDialog.prototype.initialize = function (client, nodeObj, publishCallback) {
        var self = this,
            metaTypeId = nodeObj.getMetaTypeId(),
            metaType = client.getNode(metaTypeId),
            metaName = metaType.getAttribute('name'),
            embeddedIframe = $('#embedded_webgme');

        this.pluginContext = client.getCurrentPluginContext(
            "ExportToRegistry",
            nodeObj._id
        );

        this.client = client;
        this.nodeObj = nodeObj;

        var headerText = "Publish Object";
        var objectTypeText = "Object";
        if (metaName.match('Federate$')) {
            headerText = "Publish Federate";
            objectTypeText = "Federate";
        }
        this._dialogHeader.text(headerText);
        this._objectTypeLegend.text(objectTypeText);

        var name = nodeObj.getAttribute('name') || '';
        var versionNumber = nodeObj.getAttribute('registryVersion') || '0.0.1';
        var description = nodeObj.getAttribute('description') || '';

        // Initialize Modal and append it to main DOM
        this._dialog.modal({show: false});

        ComponentSettings.resolveWithWebGMEGlobal(this.config, REGISTRY_CONFIG);

        if (this.config.useRemote) {
            // Detect if WebGME is embedded in Vulcan
            if (embeddedIframe.context != 'undefined' && embeddedIframe.context.referrer != '') {
                var arr = embeddedIframe.context.referrer.split("/");
                this.isEmbedded = true;
                this.registryURL = arr[0] + "//" + arr[2];
            } else {

                ComponentSettings.resolveWithWebGMEGlobal(registryAccessSettings, REGISTRY_ACCESS_SETTINGS);
                this.registryURL = registryAccessSettings.registryURL || '';
                this.serviceToken = registryAccessSettings.serviceToken || '';

                this._urlInput.prop("value", registryAccessSettings.registryURL);
                this._usernameInput.prop("value", registryAccessSettings.username);

                // Event listener on click for SAVE button
                this._btnRenewToken.on('click', function (event) {
                    self._doRenewToken();

                    event.stopPropagation();
                    event.preventDefault();
                });
            }
            if (registryAccessSettings.serviceToken || this.isEmbedded){
                this._doGetTools();
            }
        }

        this._nameInput.prop("value", name);
        this._versionInput.prop("value", versionNumber);
        this._descrInput.prop("value", description);

        // Event listener on click for PUBLISH button
        this._btnPublish.on('click', function (event) {
            self._doPublishFederate();

            event.stopPropagation();
            event.preventDefault();
        });

        // Event listener on click for OK button
        this._btnOk.on('click', function (event) {
            if (publishCallback) {
                publishCallback.call(null, {});
            }
            self._dialog.modal('hide');

            event.stopPropagation();
            event.preventDefault();
        });

        // Listener on event when dialog is shown
        // Use callback to show editor after Modal window is shown.
        this._dialog.on('shown.bs.modal', function () {

        });

        // Listener on event when dialog is hidden
        this._dialog.on('hidden.bs.modal', function () {
            self._dialog.empty();
            self._dialog.remove();
        });

        this._updateUI();
        self._dialogMessage.hide();
        this.client.runBrowserPlugin(
            "ExportToRegistry",
            this.pluginContext,
            function(err, result) {
                if (err) {
                    // Log error somehow
                } else {
                    self.modelObject = result.modelObject;
                    self._updateUI();
                }
            }
        );
    };

    ///////////////////////////////////////////////////////////////////////////
    // UI Related
    ///////////////////////////////////////////////////////////////////////////

    PublishDialog.prototype._renderToolSelector = function () {
        var i, option, tool;
        this._toolSelector.empty();

        for (i = 0; i < this.registryTools.length; i++) {
            tool = this.registryTools[i];
            option = $('<option/>', {
                        'value': tool.id,
                        'text': tool.project_name + ' / ' + tool.tool_name
            });
            option.appendTo(this._toolSelector);
            if (i == 0){
                option.attr('selected', 'selected');
            }
        }
    };

    PublishDialog.prototype._updateUI = function () {
        var self = this;

        if (this.config.useRemote) {
            if (this.isEmbedded) {
                this._usernameGroup.hide();
                this._passwordGroup.hide();
                this._registryFooter.hide();
                this._urlGroup.hide();
                this._toolGroup.show();
            } else {
                if (this.serviceToken && this.registryTools.length) {
                    this._usernameGroup.hide();
                    this._passwordGroup.hide();
                    this._registryFooter.hide();
                    this._toolGroup.show();
                } else {
                    this._usernameGroup.show();
                    this._passwordGroup.show();
                    this._toolGroup.hide();
                    this._registryFooter.show();
                    this._objectFields.hide();
                    this._btnPublish.hide();
                    this._btnOk.hide();
                }
            }

            if (this.registryTools.length) {
                // re render tool selector
                this._toolSelector.show();
                this._toolDesc.show();
                this._toolMessage.hide();
                this._objectFields.show();
                if (this.modelObject != null) {
                    this._btnPublish.show();
                } else {
                    this._btnPublish.hide();
                }
                if (this.publishSuccess) {
                    this._btnPublish.hide();
                    this._btnOk.show();
                } else {
                    this._btnPublish.show();
                    this._btnOk.hide();
                }
            } else {
                this._toolSelector.hide();
                this._toolDesc.hide();
                this._toolMessage.text("You do not have any registry tools where you have write access");
                this._toolMessage.addClass("error");
                this._objectFields.hide();
                this._btnPublish.hide();
            }
        } else {
            this._registryFields.hide();
            this._objectFields.show();

            if (this.modelObject != null) {
                this._btnPublish.show();
            } else {
                this._btnPublish.hide();
            }
            if (this.publishSuccess) {
                this._btnPublish.hide();
                this._btnOk.show();
            } else {
                this._btnPublish.show();
                this._btnOk.hide();
            }
        }
    };

    ///////////////////////////////////////////////////////////////////////////
    // AJAX Calls
    ///////////////////////////////////////////////////////////////////////////

    PublishDialog.prototype._saveCredentials = function () {
        var self = this;

        registryAccessSettings.registryURL = self.registryURL = this._urlInput.prop("value");
        registryAccessSettings.username = this._usernameInput.prop("value");
        registryAccessSettings.serviceToken = this.serviceToken;
        ComponentSettings.overwriteComponentSettings(REGISTRY_ACCESS_SETTINGS, registryAccessSettings);
    };

    PublishDialog.prototype._doRenewToken = function () {
        var self = this;
        var renewTokenURL;
        var password = this._passwordInput.prop("value");
        var username = this._usernameInput.prop("value");
        var registryURL = this._urlInput.prop("value");

        if (registryURL &&
            username &&
            password){

            renewTokenURL = registryURL + "/registry/gen_service_token";
            $.ajax({
                method: "POST",
                url: renewTokenURL,
                data: {username: username,
                        password:password,
                        upsert: true},
                dataType: "json",
                headers: {'X-Requested-With': 'XMLHttpRequest'},
                success: function (data) {
                    self.serviceToken = data['service_token'];
                    self._saveCredentials();
                    self._doGetTools();
                    self._dialogMessage.hide();
                    self._updateUI();
                },
                error: function (data){
                    if (typeof data.readyState !== undefined) {
                        if (data.readyState == 0) {
                            self._dialogMessage.text("There was a network error");
                            self._dialogMessage.addClass("error");
                            self._dialogMessage.show();
                        }
                        if (data.readyState == 4 && data.status == 401) {
                            self._dialogMessage.text("The credentials used did not work");
                            self._dialogMessage.addClass("error");
                            self._dialogMessage.show();
                        }
                    }
                    console.log('Failed to renew token');
                }
            });
        }
    };

    PublishDialog.prototype._doGetTools = function () {
        var self = this;

        // Populate tool information which is an implicit confirmation
        // that the serviceToken is still valid
        var getRegistryToolsURL = this.registryURL + "/registry/get_tools";
        var data = {permission: "write"};
        var xhrFields = {};
        if (this.isEmbedded){
            xhrFields['withCredentials'] = true;
        } else {
            data["service_token"] = registryAccessSettings.serviceToken;
        }
        $.ajax({
            method: "GET",
            url: getRegistryToolsURL,
            data: data,
            dataType: "json",
            xhrFields: xhrFields,
            headers: {'X-Requested-With': 'XMLHttpRequest'},
            success: function (data) {
                self.registryTools = data["tools"];
                self._dialogMessage.hide();
                self._updateUI();
                self._renderToolSelector();
            },
            error: function (data) {
                if (typeof data.readyState !== undefined) {
                    if (data.readyState == 0) {
                        self._dialogMessage.text("There was a network error");
                        self._dialogMessage.addClass("error");
                        self._dialogMessage.show();
                    }
                    if (data.readyState == 4 && data.status == 401) {
                        self._dialogMessage.text("The credentials used did not work");
                        self._dialogMessage.addClass("error");
                        self._dialogMessage.show();
                    }
                }
                self.registryTools = [];
                self.serviceToken = "";
                self._updateUI();
            }
        });
    };

    PublishDialog.prototype._updateModelObject = function() {
        this.modelObject.__ROOT_OBJECT__['name'] = this._nameInput.val();
        this.modelObject.__ROOT_OBJECT__['version'] = this._versionInput.val();
        this.modelObject.__ROOT_OBJECT__['description'] = this._descrInput.val();
    };

    PublishDialog.prototype._doPublishFederate = function () {
        var self = this;

        // Populate tool information which is an implicit confirmation
        // that the serviceToken is still valid
        var publishFederateURL = this.registryURL + "/registry/publish_federate";
        var rootNode = this.client.getNode(CONSTANTS.PROJECT_ROOT_ID);
        this._updateModelObject();

        var registryJSON = JSON.stringify(this.modelObject, null, 2);
        if (this.config.useRemote){
            var data = {
                app_config_id: this._toolSelector.val(),
                name: this._nameInput.val(),
                version: this._versionInput.val(),
                description: this._descrInput.val(),
                language_version: rootNode.getAttribute("version") || '0.0.1',
                registry_json: registryJSON
            };
            var xhrFields = {};
            if (this.isEmbedded){
                xhrFields['withCredentials'] = true;
                data["_session_id"] = $.cookie('_session_id');
            } else {
                data["service_token"] = registryAccessSettings.serviceToken;
            }

            $.ajax({
                method: "POST",
                url: publishFederateURL,
                data: data,
                dataType: "json",
                xhrFields: xhrFields,
                headers: {'X-Requested-With': 'XMLHttpRequest'},
                success: function (data) {
                    self.publishSuccess = true;
                    data['registry_url'] = self.registryURL;
                    self.client.setAttribute(self.nodeObj._id, 'RegistryInfo', JSON.stringify(data, null, 2));
                    self._dialogMessage.text("Object was published successfully");
                    self._dialogMessage.addClass("success");
                    self._dialogMessage.removeClass("error");
                    self._dialogMessage.show();
                    self._updateUI();
                },
                error: function (data) {
                    if (typeof data.readyState !== undefined) {
                        if (data.readyState == 4 && typeof data.responseText !== undefined) {
                            var responseJSON = JSON.parse(data.responseText);
                            self._dialogMessage.text(responseJSON.detail);
                            self._dialogMessage.addClass("error");
                            self._dialogMessage.show();
                        }
                    }
                    console.log('Failed to publish');
                }
            });
        } else {
            // Creating the file and then downloading it
            var link = document.createElement('a');
            link.href = 'data:text/plain;charset=utf-8,' + encodeURIComponent(registryJSON);
            link.download = this._nameInput.val() + '.json';
            document.body.appendChild(link);
            link.click();

            self.publishSuccess = true;
            self._dialogMessage.text("Object was published successfully");
            self._dialogMessage.addClass("success");
            self._dialogMessage.removeClass("error");
            self._dialogMessage.show();
            self._updateUI();
        }
    };

    PublishDialog.prototype.show = function () {
        var self = this;
        self._dialog.modal('show');
    };

    return PublishDialog;
});
