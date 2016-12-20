/*globals define, $, EpicEditor*/
/*jshint browser:true*/
/**
 * @author Qishen Zhang / https://github.com/VictorCoder123
 */

define(['js/util',
    'text!./PublishDialog.html',
    'js/Utils/ComponentSettings',
    'webgme-to-json/webgme-to-json',
    'plugin/PluginResult',
    'css!./PublishDialog.css'
], function (Util,
             PublishDialogTemplate,
             ComponentSettings,
             webgmeToJSON,
             PluginResult) {
    'use strict';

    var PublishDialog,
        REGISTRY_ACCESS_SETTINGS = 'RegistryAccessSettings',
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
        this._btnPublish = this._dialog.find('.btn-publish').first();
        this._btnOk = this._dialog.find('.btn-ok').first();

        this._urlInput = this._el.find('#url').first();
        this._usernameInput = this._el.find('#username').first();
        this._usernameGroup = this._el.find('#usernameGroup').first();
        this._passwordInput = this._el.find('#password').first();
        this._passwordGroup = this._el.find('#passwordGroup').first();
        this._toolGroup = this._el.find('#toolGroup').first();
        this._toolSelector = this._dialog.find('#toolSelector').first();
        this._toolMessage = this._dialog.find('#toolMessage').first();
        this._toolDesc = this._dialog.find('#toolDesc').first();
        this._btnRenewToken = this._dialog.find('.btn-renew-token').first();
        this._registryFooter = this._dialog.find('#registryFooter').first();
        this._dialogMessage = this._dialog.find('#dialogMessage').first()

        this._objectFields = this._el.find('#objectFields').first();
        this._nameInput = this._el.find('#name').first();
        this._versionInput = this._el.find('#versionNumber').first();
        this._descrInput = this._el.find('#description').first();

        this.registryURL = "";
        this.serviceToken = "";
        this.registryTools = null;
        this.modelObject = null;
        this.publishSuccess = false;
        this.nodeObj = null;
        this.client = null;
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
            publishResult = {};

        this.pluginContext = client.getCurrentPluginContext(
            "ExportToRegistry",
            nodeObj._id
        );

        this.client = client;
        this.nodeObj = nodeObj

        var name = nodeObj.getAttribute('name') || '';
        var versionNumber = nodeObj.getAttribute('registryVersion') || '0.0.1';
        var description = nodeObj.getAttribute('description') || '';

        // Initialize Modal and append it to main DOM
        this._dialog.modal({show: false});

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

        this._nameInput.prop("value", name);
        this._versionInput.prop("value", versionNumber);
        this._descrInput.prop("value", description);

        // Event listener on click for PUBLISH button
        this._btnPublish.on('click', function (event) {
            self._doPublishFederate();

            /*if (publishCallback) {
                publishCallback.call(null, publishResult);
            }*/

            // Only close dialog when publish was successful and object were updated
            // self._dialog.modal('hide');
            event.stopPropagation();
            event.preventDefault();
        });

        // Event listener on click for OK button
        this._btnOk.on('click', function (event) {
            if (publishCallback) {
                publishCallback.call(null, publishResult);
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

        if (registryAccessSettings.serviceToken){
            this._doGetTools();
        }
        this._updateUI();

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
            });
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

        if (this.serviceToken && this.registryTools != null){
            this._usernameGroup.hide();
            this._passwordGroup.hide();
            this._registryFooter.hide();
            this._toolGroup.show();
            if (this.registryTools.length){
                // re render tool selector
                this._renderToolSelector();
                this._toolSelector.show();
                this._toolDesc.show();
                this._toolMessage.hide();
                this._objectFields.show();
                if (this.modelObject != null){
                    this._btnPublish.show();
                } else {
                    this._btnPublish.hide();
                }
                if (this.publishSuccess){
                    this._btnPublish.hide();
                    this._btnOk.show();
                } else{
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
            this._usernameGroup.show();
            this._passwordGroup.show();
            this._toolGroup.hide();
            this._registryFooter.show();
            this._objectFields.hide();
            this._btnPublish.hide();
            this._btnOk.hide();
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
        $.ajax({
            method: "GET",
            url: getRegistryToolsURL,
            data: {
                service_token: registryAccessSettings.serviceToken,
                permission: "write"
            },
            dataType: "json",
            headers: {'X-Requested-With': 'XMLHttpRequest'},
            success: function (data) {
                self.registryTools = data["tools"];
                self._updateUI();
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
                self.registryTools = null;
                self.serviceToken = "";
                self._updateUI();
            }
        });
    };

    PublishDialog.prototype._updateModelObject = function() {
        this.modelObject.__ROOT_OBJECT__['name'] = this._nameInput.val();
        this.modelObject.__ROOT_OBJECT__['version'] = this._versionInput.val();
        this.modelObject.__ROOT_OBJECT__['description'] = this._descrInput.val();
    }

    PublishDialog.prototype._doPublishFederate = function () {
        var self = this;

        // Populate tool information which is an implicit confirmation
        // that the serviceToken is still valid
        var publishFederateURL = this.registryURL + "/registry/publish_federate";
        var appConfigId = this._toolSelector.val();
        var name = this._nameInput.val();
        var version = this._versionInput.val();
        var description = this._descrInput.val();

        this._updateModelObject();

        var registryJSON = JSON.stringify(this.modelObject, null, 2);
        $.ajax({
            method: "POST",
            url: publishFederateURL,
            data: {
                service_token: registryAccessSettings.serviceToken,
                app_config_id: appConfigId,
                name: name,
                version: version,
                description: description,
                registry_json: registryJSON
            },
            dataType: "json",
            headers: {'X-Requested-With': 'XMLHttpRequest'},
            success: function (data) {
                self.publishSuccess = true;
                data['registry_url'] = self.registryURL;
                self.client.setAttribute(self.nodeObj._id, 'RegistryInfo', JSON.stringify(data, null, 2));
                self._dialogMessage.text("Object was published successfully");
                self._dialogMessage.addClass("success");
                self._dialogMessage.removeClass("error");
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
    };

    /**
     * Show actual text editor in its container by loading EpicEditor, this method
     * must be put into listener's callback function because its container is not appended
     * into DOM at this point and load() cannot access other DOM elements.
     * @return {void}
     */
    PublishDialog.prototype.show = function () {
        var self = this;
        self._dialog.modal('show');
    };

    return PublishDialog;
});