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

    var JavaRTIFederateExporter  = function () {

        this.initJavaRTI = function(){
            var self = this,
                corePackagePath = ["c2w","hla"],
                corePackagePathStr = corePackagePath.join('.'),
                renderContext = {
                    ejs: ejs, 
                    TEMPLATES: TEMPLATES,
                    isinteraction: true,
                    package: corePackagePath.join(".")
                };

            if(self.javaRTIInitDone){
                return;
            }

            self.javaCorePackageOISpecs = {
                'C2WInteractionRoot': {simname: corePackagePathStr},
                'SimulationControl': {simname: corePackagePathStr},
                'SimEnd': {simname: corePackagePathStr},
                'SimPause': {simname: corePackagePathStr},
                'SimResume': {simname: corePackagePathStr},
                'SimLog': {simname: corePackagePathStr},
                'HighPrio': {simname: corePackagePathStr},
                'MediumPrio': {simname: corePackagePathStr},
                'LowPrio': {simname: corePackagePathStr},
                'VeryLowPrio': {simname: corePackagePathStr},
                'FederateObject': {simname: corePackagePathStr, hlaclassname: 'ObjectRoot.Manager.Federate'},
                'FederateJoinInteraction': {simname: corePackagePathStr},
                'FederateResignInteraction': {simname: corePackagePathStr},
            };


            var renderToFile = function(outFilePath, isinteraction, model, artifact, callback){
                var context = self.createJavaRTICodeModel(),
                    packagePath = outFilePath + "/" + (self.javaCorePackageOISpecs.hasOwnProperty(model.name) ? self.javaCorePackageOISpecs[model.name]['simname'] : self.projectName),
                    fullPath = packagePath + '/' + model.name +'.java';
                context.isinteraction = isinteraction;
                context.simname = self.projectName;
                context.classname = model.name;
                context.hlaclassname = model.fullName;
                context.parentclassname = model.isroot ? "" : model.basename;
                context.isc2winteractionroot = model.isroot && isinteraction;

                //Override with core specs
                if(self.javaCorePackageOISpecs.hasOwnProperty(model.name)){
                    for(var oattr in self.javaCorePackageOISpecs[model.name]){
                        if(self.javaCorePackageOISpecs[model.name].hasOwnProperty(oattr)){
                            context[oattr] = self.javaCorePackageOISpecs[model.name][oattr];
                        }
                    }
                }

                var datamemeberList = [];
                if(isinteraction){
                    datamemeberList = model['parameters'];
                }else{
                    datamemeberList = model['attributes'];
                }

                datamemeberList.forEach(function(param){
                    context.alldatamembers.push(param);
                    if(!param.inherited){
                        context.datamembers.push(param);
                    }
                });

                self.logger.debug('Rendering template to file: ' + fullPath);
                artifact.addFile(fullPath , ejs.render(TEMPLATES['class.java.ejs'], context), callback);
            }  
        
            //
            // FOUNDATION RTI - Begin
            //        
            
            var foundationDirBasePath = 'java/',
                coreDirSpec = {federation_name: "root", artifact_name: "", language:""},
                coreDirPath = foundationDirBasePath + ejs.render(self.directoryNameTemplate, coreDirSpec),
                coreOutFilePath = coreDirPath + MavenPOM.mavenJavaPath,
                eventsDirSpec = {federation_name: "base-events", artifact_name: "", language:""},
                eventsDirPath = foundationDirBasePath + ejs.render(self.directoryNameTemplate, eventsDirSpec),
                eventsOutFilePath = eventsDirPath + MavenPOM.mavenJavaPath;

            var foundationPOM = new MavenPOM();
            foundationPOM.artifactId = "cpswt-core";
            foundationPOM.groupId = "org.cpswt";
            foundationPOM.version  = self.cpswt_version;

            self.corePOM = new MavenPOM(foundationPOM);
            self.corePOM.artifactId = "root";
            self.corePOM.groupId = "org.cpswt";
            self.corePOM.version = self.cpswt_version;
            self.corePOM.packaging = "jar";

            self.java_core_rtiPOM = new MavenPOM(foundationPOM);
            self.java_core_rtiPOM.artifactId = "base-events";
            self.java_core_rtiPOM.version = self.cpswt_version;
            self.java_core_rtiPOM.packaging = "jar";
            self.java_core_rtiPOM.dependencies.push(self.corePOM);

            if(self.generateExportPackages){
                //Add core POM generator
                self.corefileGenerators.push(function(artifact, callback){
                    artifact.addFile(coreDirPath + '/pom.xml', self._jsonToXml.convertToString(self.corePOM.toJSON()), function (err) {
                        if (err) {
                            callback(err);
                            return;
                        }else{
                            callback();
                        }
                    });
                });

                //Add sim POM generator
                self.corefileGenerators.push(function(artifact, callback){
                    artifact.addFile(eventsDirPath + '/pom.xml', self._jsonToXml.convertToString(self.java_core_rtiPOM.toJSON()), function (err) {
                        if (err) {
                            callback(err);
                            return;
                        }else{
                            callback();
                        }
                    });
                });

                self.corefileGenerators.push(function(artifact, callback){
                    if(!self.javaPOM){
                        callback();
                        return;
                    }
                    var fullPath = coreOutFilePath + "/" + corePackagePath.join("/") + "/" + 'InteractionRoot.java';
                    renderContext['isinteraction'] = true;
                    self.logger.debug('Rendering template to file: ' + fullPath);
                    artifact.addFile(fullPath, ejs.render(TEMPLATES['classroot.java.ejs'], renderContext), function (err) {
                        if (err) {
                            callback(err);
                            return;
                        }else{
                            fullPath = coreOutFilePath + "/" + corePackagePath.join("/") + "/" + 'InteractionRootInterface.java';
                            self.logger.debug('Rendering template to file: ' + fullPath);
                            artifact.addFile(fullPath, ejs.render(TEMPLATES['interfaceroot.java.ejs'], renderContext), function (err) {
                                if (err) {
                                    callback(err);
                                    return;
                                }else{
                                    callback();
                                    return;
                                }
                            });
                        }
                    });
                });          
                
                self.corefileGenerators.push(function(artifact, callback){
                    if(!self.javaPOM){
                        callback();
                        return;
                    }

                    var fullPath = coreOutFilePath + "/" + corePackagePath.join("/") + "/" + 'ObjectRoot.java';
                    renderContext['isinteraction'] = false;
                    self.logger.debug('Rendering template to file: ' + fullPath);
                    artifact.addFile(fullPath, ejs.render(TEMPLATES['classroot.java.ejs'], renderContext), function (err) {
                        if (err) {
                            callback(err);
                            return;
                        }else{
                            fullPath = coreOutFilePath + "/" + corePackagePath.join("/") + "/" + 'ObjectRootInterface.java';
                            self.logger.debug('Rendering template to file: ' + fullPath);
                            artifact.addFile(fullPath, ejs.render(TEMPLATES['interfaceroot.java.ejs'], renderContext), function (err) {
                                if (err) {
                                    callback(err);
                                    return;
                                }else{
                                    callback();
                                    return;
                                }
                            });
                        }
                    });
                });

                self.corefileGenerators.push(function(artifact, callback){
                    if(!self.javaPOM){
                        callback();
                        return;
                    }

                    var objToRender = [],
                    renderNextObject = function(err){
                        if(err){
                            callback(err);
                        }else{
                            var nextObj = objToRender.pop();
                            if(nextObj){
                                renderToFile(eventsOutFilePath, false, nextObj, artifact, renderNextObject);                                    
                            }else{
                                callback();
                                return;
                            }
                        }
                    };

                    for(var oid in self.objects){
                        if(self.objects[oid].name != "ObjectRoot" && self.javaCorePackageOISpecs.hasOwnProperty(self.objects[oid].name)){
                            objToRender.push(self.objects[oid]);
                        }
                    }

                    renderNextObject();
                });

                self.corefileGenerators.push(function(artifact, callback){
                    if(!self.javaPOM){
                        callback();
                        return;
                    }
                    var intToRender = [],
                    renderNextInteraction = function(err){
                        if(err){
                            callback(err);
                        }else{
                            var nextInteraction = intToRender.pop();
                            if(nextInteraction){
                                renderToFile(eventsOutFilePath, true, nextInteraction, artifact, renderNextInteraction);                                    
                            }else{
                                callback();
                                return;
                            }
                        }
                    };

                    for(var iid in self.interactions){
                        if(self.interactions[iid].name != "InteractionRoot" && self.javaCorePackageOISpecs.hasOwnProperty(self.interactions[iid].name)){
                            intToRender.push(self.interactions[iid]);
                        }
                    }
                    renderNextInteraction();
                });
            }
            //
            // FOUNDATION RTI - End
            //

            //
            // SIM RTI - Begin
            //

            var simDirBasePath = 'java-federates/',
                simDirSpec = {federation_name: self.projectName, artifact_name: "rti", language:"java"},
                simDirPath =  simDirBasePath + ejs.render(self.directoryNameTemplate, simDirSpec),
                simOutFilePath = simDirPath + MavenPOM.mavenJavaPath; 
        
            self.java_rtiPOM = new MavenPOM(); //Parent to be set serialization time.
            self.java_rtiPOM.artifactId = ejs.render(self.directoryNameTemplate, simDirSpec);
            self.java_rtiPOM.version = self.project_version;
            self.java_rtiPOM.packaging = "jar";
            self.java_rtiPOM.dependencies.push(self.java_core_rtiPOM);

            //Add sim POM generator
            self.fileGenerators.push(function(artifact, callback){
                if(!self.javaPOM){
                    callback();
                    return;
                }
                //Set the parent now that it exists
                self.java_rtiPOM.setParentPom(self.javaPOM);

                artifact.addFile(simDirPath + '/pom.xml', self._jsonToXml.convertToString(self.java_rtiPOM.toJSON()), function (err) {
                    if (err) {
                        callback(err);
                        return;
                    }else{
                        callback();
                    }
                });
            });

            self.fileGenerators.push(function(artifact, callback){
                if(!self.javaPOM){
                    callback();
                    return;
                }
                var objToRender = [], 
                renderNextObject = function(err){
                    if(err){
                        callback(err);
                    }else{
                        var nextObj = objToRender.pop();
                        if(nextObj){
                            renderToFile(simOutFilePath, false, nextObj, artifact, renderNextObject);                                    
                        }else{
                            callback();
                            return;
                        }
                    }
                };

                for(var oid in self.objects){
                    if(self.objects[oid].name != "ObjectRoot" && !self.javaCorePackageOISpecs.hasOwnProperty(self.objects[oid].name)){
                        objToRender.push(self.objects[oid]);
                    }
                }

                renderNextObject();

            });

            self.fileGenerators.push(function(artifact, callback){
                if(!self.javaPOM){
                    callback();
                    return;
                }
                var intToRender = [],
                renderNextInteraction = function(err){
                    if(err){
                        callback(err);
                    }else{
                        var nextInteraction = intToRender.pop();
                        if(nextInteraction){
                            renderToFile(simOutFilePath, true, nextInteraction, artifact, renderNextInteraction);                                    
                        }else{
                            callback();
                            return;
                        }
                    }
                };

                for(var iid in self.interactions){
                    if(self.interactions[iid].name != "InteractionRoot" && !self.javaCorePackageOISpecs.hasOwnProperty(self.interactions[iid].name)){
                        intToRender.push(self.interactions[iid]);
                    }
                }
                renderNextInteraction();
            });
        
            //
            // SIM RTI - End
            // 

            self.javaRTIInitDone = true;
        }

        this.createJavaRTICodeModel = function(){
            return {
                simname: "",
                classname: "",
                parentclassname: "",
                hlaclassname: "",
                isinteraction: false,
                isc2winteractionroot: false,
                datamembers: [],
                alldatamembers: [],
                
                helpers:{
                    primitive2object: function(type){
                        var typeMap = {
                            "String"  : "String",
                            "int"     : "Integer",
                            "long"    : "Long",
                            "short"   : "Short",
                            "byte"    : "Byte",
                            "char"    : "Character",
                            "double"  : "Double",
                            "float"   : "Float",
                            "boolean" : "Boolean"};
                        return typeMap[type];
                    },
                    supplied: function(type, name){
                        var typeMap = {
                            "String"  : "get_" + name + "()",
                            "int"     : "Integer.toString(get_" + name +"())",
                            "long"    : "Long.toString(get_" + name +"())",
                            "short"   : "Short.toString(get_" + name +"())",
                            "byte"    : "Byte.toString(get_" + name +"())",
                            "char"    : "Character.toString(get_" + name +"())",
                            "double"  : "Double.toString(get_" + name +"())",
                            "float"   : "Float.toString(get_" + name +"())",
                            "boolean" : "Boolean.toString(get_" + name +"())"
                        }
                        return typeMap[type];
                    },
                    set: function(type){
                        var typeMap = {
                            "String"  : "val",
                            "int"     : "Integer.parseInt(val)",
                            "long"    : "Long.parseLong(val)",
                            "short"   : "Short.parseShort(val)",
                            "byte"    : "Byte.parseByte(val)",
                            "char"    : "val.charAt(0)",
                            "double"  : "Double.parseDouble(val)",
                            "float"   : "Float.parseFloat(val)",
                            "boolean" : "Boolean.parseBoolean(val)"
                        }
                        return typeMap[type];
                    },
                    get: function(type, name){
                        var typeMap = {
                            "String"  : "get_" + name + "()",
                            "int"     : "new Integer(get_" + name +"())",
                            "long"    : "new Long(get_" + name +"())",
                            "short"   : "new Short(get_" + name +"())",
                            "byte"    : "new Byte(get_" + name +"())",
                            "char"    : "new Character(get_" + name +"())",
                            "double"  : "new Double(get_" + name +"())",
                            "float"   : "new Float(get_" + name +"())",
                            "boolean" : "new Boolean(get_" + name +"())"
                        }
                        return typeMap[type];
                    },
                    initialvalue: function(type){
                        var typeMap = {
                            "String"  : '""',
                            "int"     : "0",
                            "long"    : "0",
                            "short"   : "0",
                            "byte"    : "0",
                            "char"    : "\\000",
                            "double"  : "0",
                            "float"   : "0",
                            "boolean" : "false",
                            default   : ""
                        }
                        return typeMap[type];
                    }
                },
                ejs:ejs, 
                TEMPLATES:TEMPLATES
            };
        }
    }

    return JavaRTIFederateExporter;
});