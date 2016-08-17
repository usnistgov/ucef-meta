/**
 * 
 */

define([], function () {
    'use strict';

    /**
     * Initializes a new instance of JSONLDExport.
     * @class
     * @augments {PluginBase}
     * @classdesc This class represents the plugin JSONLDExport.
     * @constructor
     */
    var withModelTraverser  = function () {


        this.getVisitorFuncName = this.getVisitorFuncName || function(nodeType){
            var self = this,
                visitorName = 'generalVisitor';
            if(nodeType){
                visitorName = 'visit_'+ nodeType;
            }
            self.logger.debug('Genarated visitor Name: ' + visitorName);
            return visitorName;   
        }

        this.getPostVisitorFuncName = this.getPostVisitorFuncName || function(nodeType){
            var self = this,
                visitorName = 'generalPostVisitor';
            if(nodeType){
                visitorName = 'post_visit_'+ nodeType;
            }
            self.logger.debug('Genarated post-visitor Name: ' + visitorName);
            return visitorName;
            
        }

       this.getChildSorterFunc = this.getChildSorterFunc || function(nodeType, self){
            var self = this,
                visitorName = 'generalChildSorter';

            var generalChildSorter = function(a, b) {

                //a is less than b by some ordering criterion : return -1;         
                //a is greater than b by the ordering criterion: return 1;
                // a equal to b:
                return 0;
            };
            return generalChildSorter;
            
        }

        this.excludeFromVisit = this.excludeFromVisit || function(node){
            var self = this,
                exclude = false;

            return exclude;

        }

        this.visitAllChildrenFromRootContainer = function ( rootNode, callback ) {
            var self = this,
                error = '',
                context = {},
                counter,
                counterCallback;


            counter = {
                visits: 1
            };
            counterCallback = function ( err ) {
                error = err ? error + err : error;
                counter.visits -= 1;
                if ( counter.visits === 0 ) {
                    try{
                        var ret = self['ROOT_post_visitor'](rootNode, context);
                    }catch(err){
                        self.logger.debug('No post visitor function for ' + self.core.getAttribute(rootNode,'name'));
                    }
                    callback( error === '' ? undefined : error );
                    return;
                }
                if(err){
                    callback( error );
                    return;
                }
            };
            try{
                var ret = self['ROOT_visitor'](rootNode, context);
                if(ret['error']){
                    callback( error === '' ? undefined : error );
                    return;
                }else{
                    context = ret['context'];
                }
            }catch(err){
                self.logger.debug('No visitor function for ' + self.core.getAttribute(rootNode,'name'));
            }

            self.visitAllChildrenRec( rootNode, context, counter, counterCallback );
        };

        this.visitAllChildrenRec = function ( node, context, counter, callback ) {
             var self = this;

              

            if (self.excludeFromVisit(node)){
                callback(null, context);
                return;
            }

            self.core.loadChildren( node, function ( err, children ) {
                var i,
                    atModelNodeCallback,
                    doneModelNodeCallback,
                    doneVisitChildCallback,
                    nodeType,
                    sorterFunc,
                    childsToVisit = children.length;
                if ( err ) {
                    callback( 'loadChildren failed for ' + self.core.getAttribute( node, 'name' ) );
                    return;
                }

                counter.visits -= 1;
            
                doneModelNodeCallback = function ( err, ctx ) {
                    if ( err ) {
                        callback( err );
                    }else{
                        callback(null);
                    }
                    return
                };

                if ( childsToVisit === 0 ) {
                    if(node !== self.rootNode){
                        self.doneModelNode(node,context,doneModelNodeCallback);
                    }else{
                        doneModelNodeCallback(null);
                    }
                    return;
                }

                counter.visits += children.length;

                if(node !== self.rootNode){
                    nodeType = self.core.getAttribute( self.getMetaType( node ), 'name' );
                }

                sorterFunc = self.getChildSorterFunc(nodeType, self);
                if(sorterFunc){
                    children.sort(sorterFunc);
                }

                doneVisitChildCallback = function(err){
                    if(err){
                        callback( err );
                        return; 
                    }

                    childsToVisit -= 1;
                    if ( childsToVisit === 0 ) {
                        if(node !== self.rootNode){
                            self.doneModelNode(node,context,doneModelNodeCallback);
                        }else{
                            doneModelNodeCallback(null);
                        }
                        return;
                    } 
                }

                atModelNodeCallback = function ( childNode ) {
                    return function ( err, ctx ) {
                        if ( err ) {
                            callback( err );
                            return;
                        }
                        self.visitAllChildrenRec( childNode, ctx, counter, doneVisitChildCallback );
                    };
                };
                for ( i = 0; i < children.length; i += 1 ) {
                    self.atModelNode( children[ i ], node, self.cloneCtx(context), atModelNodeCallback( children[ i ] ) );
                }
            } );
        };

        this.atModelNode = function ( node, parent, context, callback ) {
            var self = this,
                nodeType = self.core.getAttribute( self.getMetaType( node ), 'name' ),
                nodeName = self.core.getAttribute( node, 'name' ),
                ret = null;

            try{
                self.logger.debug('atNode: ' + nodeName);
                ret = self[self.getVisitorFuncName(nodeType)](node, parent, context);
                if(ret['error']){
                    callback( ret['error'] === '' ? undefined : ret['error'] );
                    return;
                }else{
                    callback(null, ret['context']);
                    return;
                }

            }catch(err){
                if(err.message == 'self[self.getVisitorFuncName(...)] is not a function'){
                    //self.logger.debug('No visitor function for ' + nodeType);
                }else{
                    callback(err);
                    return;
                }
            }
            callback(null, context);
            return;

        };

        this.doneModelNode = function ( node, context, callback ) {
            var self = this,
                nodeType = self.core.getAttribute( self.getMetaType( node ), 'name' ),
                nodeName = self.core.getAttribute( node, 'name' ),
                ret = null;

            try{
                self.logger.debug('doneNode: ' + nodeName);
                ret = self[self.getPostVisitorFuncName(nodeType)](node, context);
                if(ret['error']){
                    callback( ret['error'] === '' ? undefined : ret['error'] );
                    return;
                }else{
                    callback(null, ret['context']);
                    return;
                }

            }catch(err){
                if(err.message == 'self[self.getPostVisitorFuncName(...)] is not a function'){
                     //self.logger.debug('No post visitor function for ' + nodeType);
                }else{
                    callback(err);
                }
               
            }
            callback(null, context);
            return;

        };

        this.cloneCtx = function (obj) {
            if (null == obj || "object" != typeof obj) return obj;
            var copy = obj.constructor();
            for (var attr in obj) {
                if (obj.hasOwnProperty(attr)) copy[attr] = obj[attr];
            }
            return copy;
        }
    };

 return withModelTraverser;

});