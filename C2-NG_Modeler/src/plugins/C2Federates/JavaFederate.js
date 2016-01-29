define([
    'common/util/ejs',
    'C2Core/MavenPOM',
	'C2Federates/Templates/Templates',
    'C2Federates/JavaRTI'
], function (
    ejs,
    MavenPOM,
	TEMPLATES,
    JavaRTI
) {

    'use strict';

    var JavaFederateExporter  = function () {
    	var self = this;
        
        JavaRTI.call(this);

        this.federateTypes = this.federateTypes || {};
    	this.federateTypes['JavaFederate'] = {
    		includeInExport: false,
    		longName: 'JavaFederate',
            init: function(){
                self.initRTI();

                self.federateBasePOM = new MavenPOM();
                self.federateBasePOM.groupId = 'org.c2w'
                self.federateBasePOM.artifactId = 'federate-base';
                self.federateBasePOM.version = "0.0.1" + (self.getCurrentConfig().isRelease ? "" : "-SNAPSHOT");    

                self.basePOM = new MavenPOM(self.mainPom);
                self.basePOM.artifactId = self.projectName + '_base';
                self.basePOM.version = "0.0.1" + self.getCurrentConfig().isRelease ? "" : "-SNAPSHOT";
                self.basePOM.packaging = "jar";
                self.basePOM.dependencies.push(self.rtiPOM);
                self.basePOM.dependencies.push(self.federateBasePOM);
                self.mainPom.projects.push(self.basePOM);

                //Add base POM generator
                self.fileGerenrators.push(function(artifact, callback){
                    artifact.addFile(self.projectName + '_base/pom.xml', self._jsonToXml.convertToString( self.basePOM.toJSON() ), function (err) {
                        if (err) {
                            callback(err);
                            return;
                        }else{
                            callback();
                        }
                    });
                });
            }
    	};

    	this.visit_JavaFederate = function(node, parent, context){
            var self = this,
                nodeType = self.core.getAttribute( self.getMetaType( node ), 'name' );

            self.logger.info('Visiting a JavaFederate');

            context['javafedspec'] = self.createCodeModeTemplate();
            context['javafedspec']['classname'] = self.core.getAttribute(node, 'name');
            context['javafedspec']['simname'] = self.projectName;
            context['javafedspec']['timeconstrained'] = self.core.getAttribute(node, 'TimeConstrained');
            context['javafedspec']['timeregulating'] = self.core.getAttribute(node, 'TimeRegulating');
            context['javafedspec']['lookahead'] = self.core.getAttribute(node, 'Lookahead');
            context['javafedspec']['asynchronousdelivery'] = self.core.getAttribute(node, 'EnableROAsynchronousDelivery');

            self.federates[self.core.getPath(node)] = context['javafedspec'];

            return {context:context};
        };

        this.post_visit_JavaFederate = function(node, context){
            var self = this,
                renderContext = context['javafedspec'],
                outFileName = self.projectName + "_base/src/main/java/"+ renderContext['simname'] + "/" + self.core.getAttribute(node, 'name') + "Base.java";
            
            self.fileGerenrators.push(function(artifact, callback){
                artifact.addFile(outFileName, ejs.render(TEMPLATES['javafederate.java.ejs'], renderContext), function (err) {
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
                melderpackagename: null,
                classname: "",
                isnonmapperfed: false,
                timeconstrained: false,
                timeregulating: false,
                lookahead: null,
                asynchronousdelivery: false,
                publishedinteractiondata: [],
                subscribedinteractiondata: [],
                allinteractiondata: [],
                publishedobjectdata: [],
                subscribedobjectdata: [],
                allobjectdata: [],
                helpers:{},
                ejs:ejs, 
                TEMPLATES:TEMPLATES
            };
        }
        this.javaCodeModel = this.createCodeModeTemplate();

    }

    return JavaFederateExporter;
});