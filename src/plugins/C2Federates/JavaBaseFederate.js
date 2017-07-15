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

    var JavaBaseFederateExporter  = function () {
        var self = this,
            baseOutFilePath,
            baseDirSpec;

         JavaRTI.call(this);

        this.federateTypes = this.federateTypes || {};
        this.federateTypes['JavaFederate'] = {
            includeInExport: false,
            longName: 'JavaBaseFederate',
            init: function(){
                self.initJavaRTI();

                if(self.javaFedInitDone){
                   return;
                }

               var baseDirBasePath = 'java-federates/';
               baseDirSpec = {federation_name: self.projectName, artifact_name: "base", language:"java"};
               var baseDirPath =  baseDirBasePath + ejs.render(self.directoryNameTemplate, baseDirSpec);
               console.log('baseDirPath=' + baseDirPath);
               baseOutFilePath = baseDirPath + MavenPOM.mavenJavaPath; 


                if(!self.java_federateBasePOM){
                    self.java_federateBasePOM = new MavenPOM();
                    self.java_federateBasePOM.groupId = 'org.cpswt'
                    self.java_federateBasePOM.artifactId = 'federate-base';
                    self.java_federateBasePOM.version = self.cpswt_version;   
                }             
                
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

        this.visit_JavaBaseFederate = function(node, parent, context){

           var self = this,
                nodeType = self.core.getAttribute( self.getMetaType( node ), 'name' );

            self.logger.info('Visiting a JavaBaseFederate');

            //Setup project POM files on visiting the first Java Federate
 
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

        this.post_visit_JavaBaseFederate = function(node, context){

            var self = this,
                renderContext = context['javafedspec'],
                outFileName = baseOutFilePath + "/" +renderContext['simname'] + "/" + self.core.getAttribute(node, 'name') + "Base.java";
                context['javafedspec']['outFileName'] = outFileName;
                    
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

    return JavaBaseFederateExporter;
});