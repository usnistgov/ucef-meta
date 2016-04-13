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
    	var self = this,
            baseOutFilePath,
            baseDirSpec;
        
        JavaRTI.call(this);

        this.federateTypes = this.federateTypes || {};
    	this.federateTypes['JavaFederate'] = {
    		includeInExport: false,
    		longName: 'JavaFederate',
            init: function(){
                self.initJavaRTI();

                if(self.javaFedInitDone){
                    return;
                }

                var baseDirBasePath = 'java-federates/';
                baseDirSpec = {federation_name: self.projectName, artifact_name: "base", language:"java"};
                var baseDirPath =  baseDirBasePath + ejs.render(self.directoryNameTemplate, baseDirSpec);

                baseOutFilePath = baseDirPath + MavenPOM.mavenJavaPath; 
                if(!self.java_federateBasePOM){
                    self.java_federateBasePOM = new MavenPOM();
                    self.java_federateBasePOM.groupId = 'org.c2w'
                    self.java_federateBasePOM.artifactId = 'federate-base';
                    self.java_federateBasePOM.version = self.c2w_version;   
                }
                
                //Add sim POM generator
                self.fileGenerators.push(function(artifact, callback){
                    if(!self.javaPOM){
                        callback();
                        return;
                    }
                    artifact.addFile( self.javaPOM.directory + '/pom.xml', self._jsonToXml.convertToString( self.javaPOM.toJSON() ), function (err) {
                        if (err) {
                            callback(err);
                            return;
                        }else{
                            callback();
                        }
                    });
                });
                
                
                //Add base POM generator
                self.fileGenerators.push(function(artifact, callback){
                    if(!self.java_basePOM){
                        callback();
                        return;
                    }
                    artifact.addFile(baseDirPath + '/pom.xml', self._jsonToXml.convertToString( self.java_basePOM.toJSON() ), function (err) {
                        if (err) {
                            callback(err);
                            return;
                        }else{
                            callback();
                        }
                    });
                });

                self.javaFedInitDone = true;
            }
    	};

    	this.visit_JavaFederate = function(node, parent, context){
            var self = this,
                nodeType = self.core.getAttribute( self.getMetaType( node ), 'name' );

            self.logger.info('Visiting a JavaFederate');

            //Setup project POM files on visiting the first Java Federate
            if(!self.javaPOM){
                self.javaPOM = new MavenPOM(self.mainPom);
                self.javaPOM.artifactId = self.projectName + "-java";
                self.javaPOM.directory = "java-federates";
                self.javaPOM.version = self.project_version;
                self.javaPOM.addMavenCompiler('1.5');
                self.javaPOM.packaging = "pom";
            }   

            if(!self.java_basePOM){
                self.java_basePOM = new MavenPOM(self.javaPOM);
                self.java_basePOM.artifactId = ejs.render(self.directoryNameTemplate, baseDirSpec);
                self.java_basePOM.version = self.project_version;
                self.java_basePOM.packaging = "jar";
                self.java_basePOM.dependencies.push(self.java_rtiPOM);
                self.java_basePOM.dependencies.push(self.java_federateBasePOM);
            }

            context['javafedspec'] = self.createJavaFederateCodeModel();
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
                outFileName = baseOutFilePath + "/" +renderContext['simname'] + "/" + self.core.getAttribute(node, 'name') + "Base.java";
            
            self.fileGenerators.push(function(artifact, callback){
                renderContext['allobjectdata'] = renderContext['publishedobjectdata'].concat(renderContext['subscribedobjectdata']);
                renderContext['allinteractiondata'] = renderContext['publishedinteractiondata'].concat(renderContext['subscribedinteractiondata'])
                
                self.logger.debug('Rendering template to file: ' + outFileName);
                artifact.addFile(outFileName, ejs.render(TEMPLATES['federate.java.ejs'], renderContext), function (err) {
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

        this.createJavaFederateCodeModel = function(){
            return {
                simname: "",
                melderpackagename: null,
                classname: "",
                isnonmapperfed: true,
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
        this.javaCodeModel = this.createJavaFederateCodeModel();

    }

    return JavaFederateExporter;
});