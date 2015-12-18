define([], function () {
    'use strict';

    var GenericFederateExporter  = function () {
    	
    	this.federateTypes = this.federateTypes || {};
    	this.federateTypes['CPNFederate'] = {
    		includeInExport: false,
    		longName: 'CPNFederate'
    	};

	    this.visit_CPNFederate = function(node, parent, context){
	    	var self = this,
	    		nodeType = self.core.getAttribute( self.getMetaType( node ), 'name' );

	        self.logger.info('Visiting a CPNFederate');
            var cpn = {
                '@_cpnfile': self.core.getAttribute(node, 'CPNFile'),
                '@_lookahead': self.core.getAttribute(node, 'Lookahead'),
                '@step': self.core.getAttribute(node, 'Step'),
                '@ration': self.core.getAttribute(node, 'CPNTimeRatio'),
                'monitor':[]
            };

            var cpn_doc ={
                cpn: cpn
            };

            context['CPNDoc'] = cpn_doc;
            context['parent'] = cpn['monitor'];

	        return {context:context};
	    };

        this.visit_Place = function(node, parent, context){
            var self = this,
                nodeType = self.core.getAttribute( self.getMetaType( node ), 'name' );

            context['parent'].push({
                '@name': self.core.getAttribute(node, 'name')
            });  
            self.logger.info('Visiting a CPN/Place');

            return {context:context};
        };

        this.post_visit_CPNFederate = function(node, context){
            var self = this,
            outFileName;
            self.logger.debug(self._jsonToXml.convertToString( context['CPNDoc']));
            outFileName = "CPN/" + self.core.getAttribute(node, 'name') + ".xml"
            self.fileGerenrators.push(function(artifact, callback){
                artifact.addFile(outFileName, self._jsonToXml.convertToString( context['CPNDoc']), function (err) {
                    if (err) {
                        callback(err);
                        return;
                    }else{
                        callback();
                    }
                });
            });
                    
            return {context:context};
        };

    };
    return GenericFederateExporter;

});