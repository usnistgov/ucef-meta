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
    'js/RegistryKeys',
    'js/Constants',
    'decorators/ModelDecorator/DiagramDesigner/ModelDecorator.DiagramDesignerWidget',
    './PublishDialog',
    'jquery',
    'underscore'
], function (
    REGISTRY_KEYS,
    CONSTANTS,
    ModelDecoratorDiagramDesignerWidget,
    PublishDialog) {

    'use strict';

    var RegistryDecorator,
        DECORATOR_ID = 'RegistryDecorator',
        REGISTRY_SHARE_BTN = $('<i class="glyphicon glyphicon-share text-meta" title="Share in Registry" />');

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
            nodeObj = client.getNode(this._metaInfo[CONSTANTS.GME_ID]);

        // TODO: choose dialog based on Node Type

        //render text-editor based META editing UI piece
        this._skinParts.$ShareDialogBtn = REGISTRY_SHARE_BTN.clone();
        this.$el.append(this._skinParts.$ShareDialogBtn);

        // Load EpicEditor on click
        this._skinParts.$ShareDialogBtn.on('click', function (event) {
            if (self.hostDesignerItem.canvas.getIsReadOnlyMode() !== true) {
                self._showPublishDialog();
            }

            event.stopPropagation();
            event.preventDefault();
        });

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
     * Initialize Dialog and Editor creation
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
                    self.$doc.empty();
                    self.$doc.append($(marked(text)));
                } catch (e) {
                    self.logger.error('Something went wrong while publishing object');
                }
            }
        );

        publishDialog.show();
    };


    return RegistryDecorator;
});