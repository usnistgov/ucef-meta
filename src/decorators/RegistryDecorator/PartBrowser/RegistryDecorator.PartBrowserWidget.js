/*globals define, _, DEBUG, $*/
/*eslint-env browser*/

/**
 * @author rkereskenyi / https://github.com/rkereskenyi
 */

 
define([
    'js/Constants',
    'js/NodePropertyNames',
    'js/Widgets/PartBrowser/PartBrowserWidget.DecoratorBase',
    'js/Widgets/DiagramDesigner/DiagramDesignerWidget.Constants',
    'text!../DiagramDesigner/RegistryDecorator.DiagramDesignerWidget.html',
    'css!../DiagramDesigner/RegistryDecorator.DiagramDesignerWidget.css',
    'css!./RegistryDecorator.PartBrowserWidget.css'
], function (CONSTANTS,
             nodePropertyNames,
             PartBrowserWidgetDecoratorBase,
             DiagramDesignerWidgetConstants,
             RegistryDecoratorDiagramDesignerWidgetTemplate) {

    'use strict';

    var RegistryDecoratorPartBrowserWidget,
        __parent__ = PartBrowserWidgetDecoratorBase,
        DECORATOR_ID = 'RegistryDecoratorPartBrowserWidget';

    RegistryDecoratorPartBrowserWidget = function (options) {
        var opts = _.extend({}, options);

        __parent__.apply(this, [opts]);

        this.logger.debug('RegistryDecoratorPartBrowserWidget ctor');
    };

    _.extend(RegistryDecoratorPartBrowserWidget.prototype, __parent__.prototype);
    RegistryDecoratorPartBrowserWidget.prototype.DECORATORID = DECORATOR_ID;

    /*********************** OVERRIDE DiagramDesignerWidgetDecoratorBase MEMBERS **************************/

    RegistryDecoratorPartBrowserWidget.prototype.$DOMBase = (function () {
        var el = $(RegistryDecoratorDiagramDesignerWidgetTemplate);
        //use the same HTML template as the RegistryDecorator.DiagramDesignerWidget
        //but remove the connector DOM elements since they are not needed in the PartBrowser
        el.find('.' + DiagramDesignerWidgetConstants.CONNECTOR_CLASS).remove();
        return el;
    })();

    RegistryDecoratorPartBrowserWidget.prototype.beforeAppend = function () {
        this.$el = this.$DOMBase.clone();

        //find name placeholder
        this.skinParts.$name = this.$el.find('.name');

        this._renderContent();
    };

    RegistryDecoratorPartBrowserWidget.prototype.afterAppend = function () {
    };

    RegistryDecoratorPartBrowserWidget.prototype._renderContent = function () {
        var client = this._control._client,
            nodeObj = client.getNode(this._metaInfo[CONSTANTS.GME_ID]);

        //render GME-ID in the DOM, for debugging
        if (DEBUG) {
            this.$el.attr({'data-id': this._metaInfo[CONSTANTS.GME_ID]});
        }

        if (nodeObj) {
            this.skinParts.$name.text(nodeObj.getAttribute(nodePropertyNames.Attributes.name) || '');
        }
    };

    RegistryDecoratorPartBrowserWidget.prototype.update = function () {
        this._renderContent();
    };

    return RegistryDecoratorPartBrowserWidget;
});
