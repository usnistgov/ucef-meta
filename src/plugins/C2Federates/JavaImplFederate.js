define([
    'common/util/ejs',
    'C2Core/MavenPOM',
    'C2Federates/Templates/Templates'
], function (
    ejs,
    MavenPOM,
    TEMPLATES
) {

    'use strict';

    var JavaImplFederateExporter = function () {
        var self = this,
            implOutFilePath,
            implOutResPath,
            implDirSpec,
            implDirPath;

        this.federateTypes = this.federateTypes || {};
        this.federateTypes['JavaImplFederate'] = {
            includeInExport: false,
            longName: 'JavaImplFederate',
            init: function () {

                if (self.javaImplFedInitDone) {
                    return;
                }

                var dirPath = self.projectName + '-java-federates/';
                implDirSpec = {
                    federation_name: self.projectName,
                    artifact_name: "impl",
                    language: "java"
                };

                implDirPath = dirPath + ejs.render(self.directoryNameTemplate, implDirSpec);
                console.log('implDirPath=' + implDirPath);
                implOutFilePath = implDirPath + MavenPOM.mavenJavaPath;
                console.log('implOutFilePath=' + implOutFilePath);

                implOutResPath = implDirPath + MavenPOM.mavenResourcePath;
                console.log('implOutResPath=' + implOutResPath);
                self.projectName = self.core.getAttribute(self.rootNode, 'name');

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
                self.javaImplFedInitDone = true;
            }
        };

        this.visit_JavaImplFederate = function (node, parent, context) {
            var self = this,
                nodeType = self.core.getAttribute(self.getMetaType(node), 'name');

            self.logger.info('Visiting a JavaImplFederate');

            if(!self.java_implPOM){
                self.java_implPOM = new MavenPOM(self.javaPOM);
                self.java_implPOM.artifactId = ejs.render(self.directoryNameTemplate, implDirSpec);
                self.java_implPOM.version = self.project_version;
                self.java_implPOM.packaging = "jar";
            }

            context['javaimplfedspec'] = self.createJavaImplFederateCodeModel();
            context['javaimplfedspec']['groupId'] = self.mainPom.groupId.trim();
            context['javaimplfedspec']['artifactId'] = ejs.render(self.directoryNameTemplate, implDirSpec);
            context['javaimplfedspec']['projectName'] = self.projectName;
            context['javaimplfedspec']['projectVersion'] = self.project_version;
            context['javaimplfedspec']['cpswtVersion'] = self.getCurrentConfig().cpswtVersion;
            context['javaimplfedspec']['porticoPOM']['artifactId'] = self.porticoPOM.artifactId;
            context['javaimplfedspec']['porticoPOM']['groupId'] = self.porticoPOM.groupId;
            context['javaimplfedspec']['porticoPOM']['version'] = self.porticoPOM.version;
            context['javaimplfedspec']['porticoPOM']['scope'] = self.porticoPOM.scope;
            context['javaimplfedspec']['classname'] = self.core.getAttribute(node, 'name');
            context['javaimplfedspec']['simname'] = self.projectName;
            context['javaimplfedspec']['configFile'] = self.core.getAttribute(node, 'name') + 'Config.json';
            context['javaimplfedspec']['timeconstrained'] = self.core.getAttribute(node, 'TimeConstrained');
            context['javaimplfedspec']['timeregulating'] = self.core.getAttribute(node, 'TimeRegulating');
            context['javaimplfedspec']['lookahead'] = self.core.getAttribute(node, 'Lookahead');
            context['javaimplfedspec']['step'] = self.core.getAttribute(node, 'Step');
            context['javaimplfedspec']['asynchronousdelivery'] = self.core.getAttribute(node, 'EnableROAsynchronousDelivery');
            context['javaimplfedspec']['bindAddress'] = self.getCurrentConfig().bindAddress.trim();

            self.javafederateName[self.core.getPath(node)] = self.core.getAttribute(node, 'name');

            self.federates[self.core.getPath(node)] = context['javaimplfedspec'];

            return {
                context: context
            };
        };

        this.post_visit_JavaImplFederate = function (node, context) {
            var self = this,
                renderContext = context['javaimplfedspec']
                

            var fedPathDir = implDirPath + "/" + self.core.getAttribute(node, 'name')        
            var outFileName = fedPathDir + MavenPOM.mavenJavaPath + "/"+renderContext['simname'] + "/" + self.core.getAttribute(node, 'name') + ".java"

            // set the SOM.xml outpit directory
            var feder = self.federateInfos[self.core.getPath(node)];
            if (feder) {
                feder.directory = fedPathDir + "/conf/";
            }

            renderContext['allobjectdata'] = renderContext['publishedobjectdata'].concat(renderContext['subscribedobjectdata']);
            renderContext['allinteractiondata'] = renderContext['publishedinteractiondata'].concat(renderContext['subscribedinteractiondata']);

            //Add impl POM from template
            self.fileGenerators.push(function (artifact, callback) {
                self.logger.debug('Rendering template to file: ' + implDirPath + '/pom.xml');

                //artifact.addFile(fedPathDir + "/"+'pom.xml', ejs.render(TEMPLATES['java/federateimpl_pom.xml.ejs'], renderContext), function (err) {
                artifact.addFile(fedPathDir + "/"+'pom.xml', ejs.render(TEMPLATES['java/federateimpl_uberpom.xml.ejs'], renderContext), function (err) {
                    if (err) {
                        callback(err);
                        return;
                    } else {
                        callback();
                    }
                });
            });

            self.fileGenerators.push(function (artifact, callback) {

                self.logger.debug('Rendering template to file: ' + context['javafedspec']['outFileName']);

                renderContext.moduleCollection.push(renderContext.classname);
                renderContext['publishedinteractiondata'] = context['javaimplfedspec']['publishedinteractiondata'];
                renderContext['publishedobjectdata'] = context['javaimplfedspec']['publishedobjectdata'];

                artifact.addFile(context['javafedspec']['outFileName'], ejs.render(TEMPLATES['java/federatebase.java.ejs'], renderContext), function (err) {
                    if (err) {
                        callback(err);
                        return;
                    } else {
                        callback();
                    }
                });
            });

            self.fileGenerators.push(function (artifact, callback) {

                self.logger.debug('Rendering template to file: ' + outFileName);

                artifact.addFile(outFileName, ejs.render(TEMPLATES['java/federateimpl.java.ejs'], renderContext), function (err) {
                    if (err) {
                        callback(err);
                        return;
                    } else {
                        callback();
                    }
                });
            });

            //Add federate RTi.rid file
            self.fileGenerators.push(function (artifact, callback) {
                artifact.addFile(fedPathDir + '/RTI.rid', ejs.render(TEMPLATES['java/rti.rid.ejs'], renderContext), function (err) {
                    if (err) {
                        callback(err);
                        return;
                    } else {
                        callback();
                    }
                });
            });

            //Add federate config file
            self.fileGenerators.push(function (artifact, callback) {
                artifact.addFile(fedPathDir + '/conf/' + renderContext.configFile, ejs.render(TEMPLATES['java/federate-config.json.ejs'], renderContext), function (err) {
                    if (err) {
                        callback(err);
                        return;
                    } else {
                        callback();
                    }
                });
            });

            //Add impl log config from template
            self.fileGenerators.push(function (artifact, callback) {
                artifact.addFile(fedPathDir + '/conf/log4j2.xml', ejs.render(TEMPLATES['java/log4j2.xml.ejs'], self), function (err) {
                    if (err) {
                        callback(err);
                        return;
                    } else {
                        callback();
                    }
                });
            });

            return {
                context: context
            };
        };

        this.postAllVisits = function(context) {

            self.fileGenerators.push(function (artifact, callback) {
                if (!context.federates) {
                    callback();
                    return;
                }
                context["artifactId"]= ejs.render(self.directoryNameTemplate, implDirSpec);
                artifact.addFile(implDirPath + '/pom.xml', ejs.render(TEMPLATES['java/federateimpl_pom.xml.ejs'], context), function (err) {
                    if (err) {
                        callback(err);
                        return;
                    } else {
                        callback();
                    }
                });
            });

             return {
                context: context
            };      
        };


        this.createJavaImplFederateCodeModel = function () {
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
                porticoPOM: {},
                helpers: {},
                ejs: ejs,
                moduleCollection: [],
                TEMPLATES: TEMPLATES
            };
        }
        this.javaImplCodeModel = this.createJavaImplFederateCodeModel();

    }

    return JavaImplFederateExporter;
});
