/*globals define, $, EpicEditor*/
/*jshint browser:true*/
/**
 * @author U{Gabor Pap<macpapszi@gmail.com>}
 */

define(['js/util',
    'js/Constants',
    'text!./ImportDialog.html',
    'js/Utils/ComponentSettings',
    './ImportFederateDialog',
    'c2wtng/datatables',
    'css!./PublishDialog.css',
    'css!./ImportDialog.css',
    'css!c2wtng/datatables.css'
], function (Util,
             CONSTANTS,
             ImportDialogTemplate,
             ComponentSettings,
             ImportFederateDialog,
             DataTable
) {
    'use strict';

    var ImportDialog,
        REGISTRY_ACCESS_SETTINGS = 'RegistryAccessSettings',
        registryAccessSettings = {
            registryURL:"https://vulcan.isis.vanderbilt.edu",
            username:"username",
            serviceToken:""
        },
        COLUMNS = [
            { title: "Name" , bSortable: false },
            { title: "Type" , bSortable: false },
            { title: "Version" , bSortable: false },
            { title: "Description" , bSortable: false },
            { title: "Released" , bSortable: false },
            { title: "Actions" ,
                bSortable: false,
                data: null,
                defaultContent: "<button>Import</button>" }
        ],
        DISPLAY_LENGTH = 20;

    /**
     * ImportDialog Constructor
     * Insert dialog modal into body and initialize editor with
     * customized options
     */
    ImportDialog = function () {
        // Get Modal Template node for Editor Dialog and append it to body
        this._dialog = $(ImportDialogTemplate);
        this._dialog.appendTo($(document.body));

        // Get element nodes
        this._el = this._dialog.find('.modal-body').first();

        this._urlInput = this._el.find('#url').first();
        this._urlGroup = this._el.find('#urlGroup').first();
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
        this._dialogMessage = this._dialog.find('#dialogMessage').first();

        // Filter controls:
        this._typeSelector = this._dialog.find('#typeSelector').first();
        this._nameInput = this._dialog.find('#nameInput').first();
        this._versionSelector = this._dialog.find('#versionSelector').first();

        this._resultContainer = this._el.find('#resultContainer').first();
        this._resultTable = $('#resultsTable').DataTable( {
            columns: COLUMNS,
            bFilter: false,
            bPaginate: false,
            iDisplayLength: DISPLAY_LENGTH
        });

        this.registryURL = "";
        this.serviceToken = "";
        this.registryTools = [];
        this.modelObject = null;
        this.nodeObj = null;
        this.client = null;
        this.facetFields = {};
        this.isEmbedded = false;
        this.sessionId = null;
        this.vulcanSession = null;
    };

    /**
     * Initialize ImportDialog by creating EpicEditor in Bootstrap modal
     * window and set event listeners on its subcomponents like save button. Notice
     * EpicEditor is created but not loaded yet. The creation and loading of editor
     * are seperated due to the reason decorator component is not appended to DOM within
     * its own domain.
     * @param  {String}     versionNumber  versionNumber to be rendered in editor initially
     * @param  {Function}   saveCallback   Callback function after click save button
     * @return {void}
     */
    ImportDialog.prototype.initialize = function (client, nodeObj, importCallback) {
        var self = this,
            importResult = {},
            embeddedIframe = $('#embedded_webgme');

        this.client = client;
        this.nodeObj = nodeObj;

        // Initialize Modal and append it to main DOM
        this._dialog.modal({show: false});

        // Detect if WebGME is embedded in Vulcan
        if (embeddedIframe.context != 'undefined' && embeddedIframe.context.referrer != ''){
            var arr = embeddedIframe.context.referrer.split("/");
            this.isEmbedded = true;
            this.registryURL = arr[0] + "//" + arr[2];
            this.sessionId = $.cookie('_session_id');
            this.vulcanSession = $.cookie('vehicleforge');
        } else {
            ComponentSettings.resolveWithWebGMEGlobal(registryAccessSettings, REGISTRY_ACCESS_SETTINGS);
            this.registryURL = registryAccessSettings.registryURL || '';
            this.serviceToken = registryAccessSettings.serviceToken || '';

            this._urlInput.prop("value", registryAccessSettings.registryURL);
            this._usernameInput.prop("value", registryAccessSettings.username);

            // Event listener on click for Renew Token button
            this._btnRenewToken.on('click', function (event) {
                self._doRenewToken();

                event.stopPropagation();
                event.preventDefault();
            });
        }


        // Filters
        this._toolSelector.on('change', function(event){
            self._doGetResults();
        });

        this._typeSelector.on('change', function(event){
            self._doGetResults();
        });

        this._versionSelector.on('change', function(event){
            self._doGetResults();
        });

        this._resultTable.on( 'click', 'button', function () {
            var data = self._resultTable.row( $(this).parents('tr') ).data();
            self._importObject(data[1], data[6]);
        } );

        // Listener on event when dialog is shown
        // Use callback to show editor after Modal window is shown.
        this._dialog.on('shown.bs.modal', function () {

        });

        // Listener on event when dialog is hidden
        this._dialog.on('hidden.bs.modal', function () {
            self._dialog.empty();
            self._dialog.remove();
        });

        if (registryAccessSettings.serviceToken || this.isEmbedded){
            this._doGetTools();
        }
        this._updateUI();
    };

    ImportDialog.prototype._importObject = function(type, objectId) {
        this._doGetObject(type, objectId);
    };

    ImportDialog.prototype._saveCredentials = function () {
        var self = this;

        registryAccessSettings.registryURL = self.registryURL = this._urlInput.prop("value");
        registryAccessSettings.username = this._usernameInput.prop("value");
        registryAccessSettings.serviceToken = this.serviceToken;
        ComponentSettings.overwriteComponentSettings(REGISTRY_ACCESS_SETTINGS, registryAccessSettings);
    };

    ///////////////////////////////////////////////////////////////////////////
    // UI Related
    ///////////////////////////////////////////////////////////////////////////

    ImportDialog.prototype._renderResults = function() {
        var self = this,
            processedData = [],
            queryResult, processedResult, i, type;

        // Empty the table first:
        this._resultTable.clear();

        for (i=0; i < self.queryResults.length; i++){
            queryResult = self.queryResults[i];
            type = queryResult['type_s'] || '';
            type = type.replace('C2WT ', '');
            processedResult = [];
            processedResult.push(queryResult['name_s'] || '');
            processedResult.push(type);
            processedResult.push(queryResult['version_s'] || '');
            processedResult.push(queryResult['description_s'] || '');
            processedResult.push(queryResult['released_b'] ? 'Yes' : 'No');
            // Add actions like import
            processedResult.push(null);
            processedResult.push(queryResult['id_s'] || '');
            processedData.push(processedResult);
        }

        this._resultTable.rows.add(processedData);
        this._resultTable.draw();
    };

    ImportDialog.prototype._renderToolSelector = function () {
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

    ImportDialog.prototype._updateUI = function () {
        var self = this;

        if (this.isEmbedded){
            this._usernameGroup.hide();
            this._passwordGroup.hide();
            this._registryFooter.hide();
            this._urlGroup.hide();
            this._toolGroup.show();
        } else {
            if (this.serviceToken && this.registryTools.length){
                this._usernameGroup.hide();
                this._passwordGroup.hide();
                this._registryFooter.hide();
                this._toolGroup.show();
            } else {
                this._usernameGroup.show();
                this._passwordGroup.show();
                this._toolGroup.hide();
                this._registryFooter.show();
                this._resultContainer.hide();
            }
        }
        if (this.registryTools.length){
            // re render tool selector
            this._toolSelector.show();
            this._toolDesc.show();
            this._toolMessage.hide();
            this._resultContainer.show();
        } else {
            this._toolSelector.hide();
            this._toolDesc.hide();
            this._toolMessage.text("You do not have any registry tools where you have read access");
            this._toolMessage.addClass("error");
            this._resultContainer.hide();
        }

    };

    ImportDialog.prototype._updateFilters = function() {
        var self = this, i, facetValue;

        if (self.facetFields['version_s'] &&
            this._versionSelector.val() == 'all'){

            this._versionSelector
                .children()
                .remove()
                .end()
                .append('<option selected value="all">All</option>');

            for (i=0; i < self.facetFields['version_s'].length; i+=2){
                facetValue = self.facetFields['version_s'][i];
                this._versionSelector.append(
                    '<option value="'+facetValue+'">'+facetValue+'</option>');
            }
        }
    };

    ImportDialog.prototype._getFilterInfo = function () {
        var filters = {},
            typeValue = this._typeSelector.val(),
            versionValue = this._versionSelector.val();

        if (typeValue != 'all'){
            filters['type'] = typeValue;
        }

        if (versionValue != 'all'){
            filters['version'] = versionValue;
        }

        return JSON.stringify(filters);
    };

    ///////////////////////////////////////////////////////////////////////////
    // AJAX Calls
    ///////////////////////////////////////////////////////////////////////////

    ImportDialog.prototype._doGetResults = function () {
        var self = this;

        // Populate tool information which is an implicit confirmation
        // that the serviceToken is still valid
        var queryURL = this.registryURL + "/registry/query";
        var appConfigId = this._toolSelector.val();
        var data = {
                app_config_id: appConfigId,
                rows: DISPLAY_LENGTH,
                filters: this._getFilterInfo()
            };
        if (this.isEmbedded){
            data["_session_id"] = this.sessionId;
        }else{
            data["service_token"] = registryAccessSettings.serviceToken;
        }
        $.ajax({
            method: "POST",
            url: queryURL,
            data: data,
            dataType: "json",
            xhrFields: {
                withCredentials: true
            },
            headers: {'X-Requested-With': 'XMLHttpRequest'},
            success: function (data) {
                self.queryResults = data["docs"];
                self.facetFields = data["facet_fields"];
                self._dialogMessage.hide();
                self._updateUI();
                self._updateFilters();
                self._renderResults();
            },
            error: function (error) {
                self.showAjaxError(error);
                self._updateUI();
            }
        });
    };

    ImportDialog.prototype._doRenewToken = function () {
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
                error: function (error){
                    self.showAjaxError(error);
                }
            });
        }
    };

    ImportDialog.prototype._doGetTools = function () {
        var self = this;

        // Populate tool information which is an implicit confirmation
        // that the serviceToken is still valid
        var getRegistryToolsURL = this.registryURL + "/registry/get_tools";
        var data = {permission: "read"};
        if (!this.isEmbedded){
            data["service_token"] = registryAccessSettings.serviceToken;
        }
        $.ajax({
            method: "GET",
            url: getRegistryToolsURL,
            data: data,
            dataType: "json",
            xhrFields: {
                withCredentials: true
            },
            headers: {'X-Requested-With': 'XMLHttpRequest'},
            success: function (data) {
                self.registryTools = data["tools"];
                self._dialogMessage.hide();
                self._updateUI();
                self._renderToolSelector();
                self._doGetResults();
            },
            error: function (error) {
                self.showAjaxError(error);
                self.registryTools = [];
                self.serviceToken = "";
                self._updateUI();
            }
        });
    };

    ImportDialog.prototype._doGetObject = function (type, id) {
        var self = this;

        // Populate tool information which is an implicit confirmation
        // that the serviceToken is still valid
        var getRegistryObjectURL = this.registryURL + "/registry/get_object";
        $.ajax({
            method: "GET",
            url: getRegistryObjectURL,
            data: {
                service_token: registryAccessSettings.serviceToken,
                obj_type: type,
                obj_id: id
            },
            dataType: "json",
            xhrFields: {
                withCredentials: true
            },
            headers: {'X-Requested-With': 'XMLHttpRequest'},
            success: function (data) {
                // data is the already parsed JSON file
                // Let's do some heavy lifting

                // We need to gather information to drive a second Dialog
                // For that we need a plugin

                self._showImportFederateDialog(data);
            },
            error: function (error) {
                self.showAjaxError(error);
                self.serviceToken = "";
                self._updateUI();
            }
        });
    };

    ///
    //
    ////

    /**
     * Initialize Import Dialog
     * @return {void}
     */
    ImportDialog.prototype._showImportFederateDialog = function (federateJSON) {
        var self = this;
        var importFederateDialog = new ImportFederateDialog();

        self._dialog.hide();
        // Initialize with documentation attribute and save callback function
        importFederateDialog.initialize(
            self.client,
            self.nodeObj,
            federateJSON,
            function (result) {
                self._dialog.show();
            }
        );

        importFederateDialog.show();
    };

    ImportDialog.prototype.show = function () {
        var self = this;
        self._dialog.modal('show');
    };

    ImportDialog.prototype.showAjaxError = function(error){
        var self = this;

        if (typeof error.readyState !== undefined) {
            if (error.readyState == 0) {
                self._dialogMessage.text("There was a network error");
                self._dialogMessage.addClass("error");
                self._dialogMessage.show();
            }
            if (error.readyState == 4 && error.status == 401) {
                self._dialogMessage.text("The credentials used did not work");
                self._dialogMessage.addClass("error");
                self._dialogMessage.show();
            }
        }
    };

    return ImportDialog;
});
