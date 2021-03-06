define([], function () {
    'use strict';

    var CPNFederateExporter  = function () {
    	
    	this.federateTypes = this.federateTypes || {};
    	this.federateTypes['CPNFederate'] = {
    		includeInExport: false,
    		longName: 'CPNFederate',
            dependencies: []
    	};

        this.cpnPlaces = {};

	    this.visit_CPNFederate = function(node, parent, context){
	    	var self = this,
	    		nodeType = self.core.getAttribute( self.getMetaType( node ), 'name' );

	        self.logger.info('Visiting a CPNFederate');
            var cpn = {
                '@_cpnfile': self.core.getAttribute(node, 'CPNFile'),
                '@_lookahead': self.core.getAttribute(node, 'Lookahead'),
                '@step': self.core.getAttribute(node, 'Step'),
                '@ration': self.core.getAttribute(node, 'CPNTimeRatio'),
                'input': [],
                'output': [],
                'monitor': []
            };

            var cpn_doc ={
                cpn: cpn
            };

            self.federates[self.core.getPath(node)] = cpn;

            context['CPNDoc'] = cpn_doc;
            context['parent'] = cpn['monitor'];

	        return {context:context};
	    };

        this.visit_Place = function(node, parent, context){
            var self = this,
                nodeType = self.core.getAttribute( self.getMetaType( node ), 'name' ),
                place = {'@name': self.core.getAttribute(node, 'name')};
                
            context['parent'].push(place);  
            self.cpnPlaces[self.core.getPath(node)] = place;

            self.logger.info('Visiting a CPN/Place');

            return {context:context};
        };

        this.post_visit_CPNFederate = function(node, context){
            var self = this,
            outFileName;

            self.logger.debug(self._jsonToXml.convertToString( context['CPNDoc']));
            outFileName = "CPN/" + self.core.getAttribute(node, 'name') + ".xml"

            self.fileGenerators.push(function(artifact, callback){
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

        this.visit_StaticInteractionPublishFromCPNPlace = function(node, parent, context){
            var self = this,
            publication = {
                type: 'output',
                port: self.core.getPointerPath(node,'src'),
                interaction: self.core.getPointerPath(node,'dst'),
                federate: self.calculateParentPath(self.core.getPointerPath(node,'src'))
            },
            nodeAttrNames = self.core.getAttributeNames(node);

            for ( var i = 0; i < nodeAttrNames.length; i += 1 ) {
                publication[nodeAttrNames[i]] = self.core.getAttribute( node, nodeAttrNames[i]);
            }   
            
            publication['handler'] = function(federate, interaction){
                if(federate[publication['type']] && self.cpnPlaces[publication.port]){
                    federate[publication['type']].push({
                        '@interaction': interaction.fullName,
                        '@place': self.cpnPlaces[publication.port]['@name']
                    });
                }
            }

            if(context['pubsubs']){
                context['pubsubs'].push(publication);
            }
            return {context:context};
        }

        this.visit_StaticInteractionSubscribeToCPNPlace = function(node, parent, context){
            var self = this,
            subscription = {
                type: 'input',
                interaction: self.core.getPointerPath(node,'src'),
                port: self.core.getPointerPath(node,'dst'),
                federate: self.calculateParentPath(self.core.getPointerPath(node,'dst'))
            },
            nodeAttrNames = self.core.getAttributeNames(node);

            for ( var i = 0; i < nodeAttrNames.length; i += 1 ) {
                subscription[nodeAttrNames[i]] = self.core.getAttribute( node, nodeAttrNames[i]);
            }   

            subscription['handler'] = function(federate, interaction){
                if(federate[subscription['type']] && self.cpnPlaces[subscription.port]){
                    federate[subscription['type']].push({
                        '@interaction': interaction.fullName,
                        '@place': self.cpnPlaces[subscription.port]['@name']
                    });
                }
            }

            if(context['pubsubs']){
                context['pubsubs'].push(subscription);
            }
            return {context:context};
        }

    };
    return CPNFederateExporter;

});