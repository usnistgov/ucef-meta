/*globals define, _*/
/*jshint browser: true, camelcase: false*/
/**
 * @author pmeijer / https://github.com/pmeijer
 */

define([
    'decorators/ModelDecorator/ModelDecorator',
    './DiagramDesigner/RegistryDecorator.DiagramDesignerWidget',
    './PartBrowser/RegistryDecorator.PartBrowserWidget'
], function (ModelDecorator, RegistryDecoratorDiagramDesignerWidget, RegistryDecoratorPartBrowserWidget) {

    'use strict';

    var RegistryDecorator,
        DECORATOR_ID = 'RegistryDecorator';

    RegistryDecorator = function (params) {
        var opts = _.extend({loggerName: this.DECORATORID}, params);

        ModelDecorator.apply(this, [opts]);

        this.logger.debug('RegistryDecorator ctor');
    };

    _.extend(RegistryDecorator.prototype, ModelDecorator.prototype);
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