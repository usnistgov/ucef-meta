define([], function () {
    'use strict';

    var GenericFederateExporter  = function () {
    	
    	this.federateTypes = this.federateTypes || {};
    	this.federateTypes['Federate'] = {
    		includeInExport: false,
    		longName: 'Federate'
    	};

	    this.visit_Federate = function(node, parent, context){
	    	var self = this,
	    		ret = {context:context},
	    		nodeType = self.core.getAttribute( self.getMetaType( node ), 'name' );
	        self.logger.info('Visiting a Federate');

	        self.federates[self.core.getPath(node)] = node;
	        
            if(nodeType != 'Federate'){
    	        try{
                    ret = self['visit_' + nodeType](node, parent, context);
                }catch(err){
                    self.logger.debug('No visitor function for ' + nodeType);
                }
            }

	        return ret;
	    };

        this.post_visit_Federate = function(node, context){
            var self = this,
                ret = {context:context},
                nodeType = self.core.getAttribute( self.getMetaType( node ), 'name' );

            self.logger.info('Post Visiting a Federate');

            if(nodeType != 'Federate'){
                try{
                    ret = self['post_visit_' + nodeType](node, context);
                }catch(err){
                    self.logger.debug('No post-visitor function for ' + nodeType);
                }
            }
            
            return ret;
        }
    };
    return GenericFederateExporter;

});