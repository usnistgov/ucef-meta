/*globals define, _*/
/*jshint browser: true*/
/**
 * This decorator inherits from the ModelDecorator.PartBrowserWidget.
 * With no changes to the methods - it will functions just like the ModelDecorator.
 *
 * For more methods see the ModelDecorator.PartBrowserWidget.js in the webgme repository.
 *
 * @author pmeijer / https://github.com/pmeijer
 */

define(
    [
        'js/Constants',
        'js/NodePropertyNames',
        'decorators/ModelDecorator/PartBrowser/ModelDecorator.PartBrowserWidget',
        'jquery',
        'underscore'
    ],
    function (
        CONSTANTS,
        nodePropertyNames,
        ModelDecoratorPartBrowserWidget
    ) {

        'use strict';

        var RegistryDecoratorPartBrowserWidget,
            DECORATOR_ID = 'RegistryDecoratorPartBrowserWidget';

        RegistryDecoratorPartBrowserWidget = function (options) {
            var opts = _.extend({}, options);

            ModelDecoratorPartBrowserWidget.apply(this, [opts]);

            this.logger.debug('RegistryDecoratorPartBrowserWidget ctor');
        };

        _.extend(RegistryDecoratorPartBrowserWidget.prototype, ModelDecoratorPartBrowserWidget.prototype);
        RegistryDecoratorPartBrowserWidget.prototype.DECORATORID = DECORATOR_ID;

        /*********************** OVERRIDE DiagramDesignerWidgetDecoratorBase MEMBERS **************************/

        RegistryDecoratorPartBrowserWidget.prototype.beforeAppend = function () {
            this.$el = this.$DOMBase.clone();

            //find name placeholder
            this.skinParts.$name = this.$el.find('.name');
            this._renderContent();
        };

        RegistryDecoratorPartBrowserWidget.prototype.afterAppend = function () {
            ModelDecoratorPartBrowserWidget.prototype.afterAppend.apply(this, arguments);
        };

        RegistryDecoratorPartBrowserWidget.prototype.update = function () {
            this._renderContent();
        };

        RegistryDecoratorPartBrowserWidget.prototype._renderContent = function () {
            var client = this._control._client,
                nodeObj = client.getNode(this._metaInfo[CONSTANTS.GME_ID]);

            //render GME-ID in the DOM, for debugging
            if (DEBUG) {
                this.$el.attr({'data-id': this._metaInfo[CONSTANTS.GME_ID]});
            }

            if (nodeObj) {
                this.name = nodeObj.getAttribute(nodePropertyNames.Attributes.name);
                this.skinParts.$name.text(this.name || '');
            }

            this._updateColors();
        };

        return RegistryDecoratorPartBrowserWidget;
    }
);