define([
    'common/util/ejs',
	'C2Federates/Templates/Templates'
], function (
    ejs,
	TEMPLATES
) {

    'use strict';

    var JavaFederateExporter  = function () {
    	this.federateTypes = this.federateTypes || {};
    	this.federateTypes['JavaFederate'] = {
    		includeInExport: false,
    		longName: 'JavaFederate'
    	};

    	this.visit_JavaFederate = function(node, parent, context){
	    	var self = this,
	    		nodeType = self.core.getAttribute( self.getMetaType( node ), 'name' );

	        self.logger.info('Visiting a JavaFederate');

            context['javafedspec'] = self.createCodeModeTemplate();
            context['javafedspec']['classname'] =  self.core.getAttribute(node, 'name');

	        return {context:context};
	    };

	    this.post_visit_JavaFederate = function(node, context){
            var self = this,
            outFileName = "src/java/"+ self.core.getAttribute(node, 'name') + ".java";
            self.fileGerenrators.push(function(artifact, callback){
                artifact.addFile(outFileName, ejs.render(TEMPLATES['javafederate.java.ejs'], context['javafedspec']), function (err) {
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

        this.createCodeModeTemplate = function(){
            return {
                simname: "",
                melderpackagename: "",
                classname: "",
                isnonmapperfed: false,
                timeconstrained: false,
                timeregulating: false,
                lookahead: {},
                asynchronousdelivery: false,
                publishedinteractiondata: {},
                subscribedinteractiondata: {},
                allinteractiondata: {},
                publishedobjectdata: {
                    publishedAttributeData: [],
                    logPublishedAttributeData: [],
                    publishedAttributeData: []},
                subscribedobjectdata: {
                    subscribedAttributeData:[],
                    logSubscribedAttributeData:[],
                    subscribedAttributeData: []},
                allobjectdata: {},
                helpers:{}
            };
        }
        this.javaCodeModel = this.createCodeModeTemplate();

    }

    return JavaFederateExporter;
});