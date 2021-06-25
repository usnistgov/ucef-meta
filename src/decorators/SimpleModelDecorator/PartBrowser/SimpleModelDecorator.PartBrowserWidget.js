/*globals define, _, DEBUG, $*/
/*eslint-env browser*/

/**
 * Generated by DecoratorGenerator
 */


define([
    'js/Constants',
    'js/NodePropertyNames',
    'js/Widgets/PartBrowser/PartBrowserWidget.DecoratorBase',
    'js/Widgets/DiagramDesigner/DiagramDesignerWidget.Constants',
    'text!../DiagramDesigner/SimpleModelDecorator.DiagramDesignerWidget.html',
    'css!../DiagramDesigner/SimpleModelDecorator.DiagramDesignerWidget.css',
    'css!./SimpleModelDecorator.PartBrowserWidget.css'
], function (CONSTANTS,
             nodePropertyNames,
             PartBrowserWidgetDecoratorBase,
             DiagramDesignerWidgetConstants,
             SimpleModelDecoratorDiagramDesignerWidgetTemplate) {

    'use strict';

    var DECORATOR_ID = 'SimpleModelDecoratorPartBrowserWidget';

    function SimpleModelDecoratorPartBrowserWidget(options) {
        var opts = _.extend({}, options);

        PartBrowserWidgetDecoratorBase.apply(this, [opts]);

        this.logger.debug('SimpleModelDecoratorPartBrowserWidget ctor');
    }

    _.extend(SimpleModelDecoratorPartBrowserWidget.prototype, PartBrowserWidgetDecoratorBase.prototype);
    SimpleModelDecoratorPartBrowserWidget.prototype.DECORATORID = DECORATOR_ID;

    /*********************** OVERRIDE DiagramDesignerWidgetDecoratorBase MEMBERS **************************/

    SimpleModelDecoratorPartBrowserWidget.prototype.$DOMBase = (function () {
        var el = $(SimpleModelDecoratorDiagramDesignerWidgetTemplate);
        //use the same HTML template as the SimpleModelDecorator.DiagramDesignerWidget
        //but remove the connector DOM elements since they are not needed in the PartBrowser
        el.find('.' + DiagramDesignerWidgetConstants.CONNECTOR_CLASS).remove();
        return el;
    })();

    SimpleModelDecoratorPartBrowserWidget.prototype.beforeAppend = function () {
        this.$el = this.$DOMBase.clone();

        //find name placeholder
        this.skinParts.$name = this.$el.find('.name');

        this._renderContent();
    };

    SimpleModelDecoratorPartBrowserWidget.prototype.afterAppend = function () {
    };

    SimpleModelDecoratorPartBrowserWidget.prototype._renderContent = function () {
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

    SimpleModelDecoratorPartBrowserWidget.prototype.update = function () {
        this._renderContent();
    };

    return SimpleModelDecoratorPartBrowserWidget;
});
