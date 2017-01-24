/*globals define, _*/
/*jshint browser: true, camelcase: false*/
/**
 * This decorator inherits from the ModelDecorator.DiagramDesignerWidget.
 * With no changes to the methods - it will functions just like the ModelDecorator.
 *
 * For more methods see the ModelDecorator.DiagramDesignerWidget.js in the webgme repository.
 *
 * @author pmeijer / https://github.com/pmeijer
 */

define([
    'js/Constants',
    'decorators/ModelDecorator/DiagramDesigner/ModelDecorator.DiagramDesignerWidget',
    './PublishDialog',
    './ImportDialog',
    'jquery',
    'underscore'
], function (
    CONSTANTS,
    ModelDecoratorDiagramDesignerWidget,
    PublishDialog,
    ImportDialog) {

    'use strict';

    var RegistryDecorator,
        DECORATOR_ID = 'RegistryDecorator',
        REGISTRY_SHARE_BTN = $('<i class="glyphicon glyphicon-share text-meta" title="Share in Registry" />'),
        REGISTRY_IMPORT_BTN = $('<i class="glyphicon glyphicon-import text-meta" title="Import from Registry" />');

    RegistryDecorator = function (options) {
        var opts = _.extend({}, options);

        ModelDecoratorDiagramDesignerWidget.apply(this, [opts]);

        this._skinParts = {};

        this.logger.debug('RegistryDecorator ctor');
    };

    RegistryDecorator.prototype = Object.create(ModelDecoratorDiagramDesignerWidget.prototype);
    RegistryDecorator.prototype.constructor = RegistryDecorator;
    RegistryDecorator.prototype.DECORATORID = DECORATOR_ID;

    RegistryDecorator.prototype.on_addTo = function () {
        var self = this,
            client = this._control._client,
            nodeObj = client.getNode(this._metaInfo[CONSTANTS.GME_ID]),
            metaTypeId = nodeObj.getMetaTypeId(),
            metaType = client.getNode(metaTypeId),
            metaName = metaType.getAttribute('name');

        //render text-editor based META editing UI piece
        if (metaName.match('Federate$')){
            this._skinParts.$ShareDialogBtn = REGISTRY_SHARE_BTN.clone();
            this.$el.append(this._skinParts.$ShareDialogBtn);

            this._skinParts.$ShareDialogBtn.on('click', function (event) {
                if (self.hostDesignerItem.canvas.getIsReadOnlyMode() !== true) {
                    self._showPublishDialog();
                }

                event.stopPropagation();
                event.preventDefault();
            });

        } else if (metaName == 'FOMSheet'){
            this._skinParts.$ImportDialogBtn = REGISTRY_IMPORT_BTN.clone();
            this.$el.append(this._skinParts.$ImportDialogBtn);

            this._skinParts.$ImportDialogBtn.on('click', function (event) {
                if (self.hostDesignerItem.canvas.getIsReadOnlyMode() !== true) {
                    self._showImportDialog();
                }

                event.stopPropagation();
                event.preventDefault();
            });

        }

        this.logger.debug('This node was added to the canvas', nodeObj);

        // Call the base-class method..
        ModelDecoratorDiagramDesignerWidget.prototype.on_addTo.apply(this, arguments);
    };

    RegistryDecorator.prototype.destroy = function () {
        ModelDecoratorDiagramDesignerWidget.prototype.destroy.apply(this, arguments);
    };

    RegistryDecorator.prototype.update = function () {
        var client = this._control._client,
            nodeObj = client.getNode(this._metaInfo[CONSTANTS.GME_ID]);

        this.logger.debug('This node is on the canvas and received an update event', nodeObj);

        ModelDecoratorDiagramDesignerWidget.prototype.update.apply(this, arguments);
    };

    /**
     * Initialize Share Dialog
     * @return {void}
     */
    RegistryDecorator.prototype._showPublishDialog = function () {
        var self = this;
        var client = this._control._client;
        var nodeObj = client.getNode(this._metaInfo[CONSTANTS.GME_ID]);
        var publishDialog = new PublishDialog();

        // Initialize with documentation attribute and save callback function
        publishDialog.initialize(
            client,
            nodeObj,
            function (publishResult) {
                try {
                } catch (e) {
                    self.logger.error('Something went wrong while publishing object');
                }
            }
        );

        publishDialog.show();
    };

    /**
     * Initialize Share Dialog
     * @return {void}
     */
    RegistryDecorator.prototype._showImportDialog = function () {
        var self = this;
        var client = this._control._client;
        var nodeObj = client.getNode(this._metaInfo[CONSTANTS.GME_ID]);
        var importDialog = new ImportDialog();

        // Initialize with documentation attribute and save callback function
        importDialog.initialize(
            client,
            nodeObj,
            function (importResult) {
                try {
                    self.$doc.empty();
                    self.$doc.append($(marked(text)));
                } catch (e) {
                    self.logger.error('Something went wrong while publishing object');
                }
            }
        );

        importDialog.show();
    };


    return RegistryDecorator;
});