/*globals define, _*/
/*jshint browser: true, camelcase: false*/

/**
 * @author rkereskenyi / https://github.com/rkereskenyi
 */

define([
    'js/Decorators/DecoratorBase',
    './DiagramDesigner/RegistryDecorator.DiagramDesignerWidget',
    './PartBrowser/RegistryDecorator.PartBrowserWidget'
], function (DecoratorBase, RegistryDecoratorDiagramDesignerWidget, RegistryDecoratorPartBrowserWidget) {

    'use strict';

    var RegistryDecorator,
        __parent__ = DecoratorBase,
        __parent_proto__ = DecoratorBase.prototype,
        DECORATOR_ID = 'RegistryDecorator';

    RegistryDecorator = function (params) {
        var opts = _.extend({loggerName: this.DECORATORID}, params);

        __parent__.apply(this, [opts]);

        this.logger.debug('RegistryDecorator ctor');
    };

    _.extend(RegistryDecorator.prototype, __parent_proto__);
    RegistryDecorator.prototype.DECORATORID = DECORATOR_ID;

    /*********************** OVERRIDE DecoratorBase MEMBERS **************************/

    RegistryDecorator.prototype.initializeSupportedWidgetMap = function () {
        this.supportedWidgetMap = {
            DiagramDesigner: RegistryDecoratorDiagramDesignerWidget,
            PartBrowser: RegistryDecoratorPartBrowserWidget
        };
    };

    return RegistryDecorator;
});