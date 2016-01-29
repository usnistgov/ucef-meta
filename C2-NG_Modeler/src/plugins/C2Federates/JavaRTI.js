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

        this.initRTI = function(){
            var self = this,
            corePackagePath = ["c2w","hla"],
            coreOutFilePath = "core/src/main/java/",
            simOutFilePath = self.projectName + "_rti/src/main/java/", 
            renderContext = {
                ejs:ejs, 
                TEMPLATES:TEMPLATES
            };
            renderContext['isinteraction'] = true;
            renderContext['package']= corePackagePath.join(".");

            self.genericInteractionPackage = {
                'C2WInteractionRoot': corePackagePath,
                'SimulationControl': corePackagePath,
                'SimEnd': corePackagePath,
                'SimPause': corePackagePath,
                'SimResume': corePackagePath,
                'SimLog': corePackagePath,
                'HighPrio': corePackagePath,
                'MediumPrio': corePackagePath,
                'LowPrio': corePackagePath,
                'VeryLowPrio': corePackagePath
            };

            var porticoPOM = new MavenPOM();
            porticoPOM.artifactId = "portico";
            porticoPOM.groupId = "org.porticoproject";
            porticoPOM.version = "2.0.2";

            var C2WLoggingPOM = new MavenPOM();
            C2WLoggingPOM.artifactId = "logging";
            C2WLoggingPOM.groupId = "org.c2w";
            C2WLoggingPOM.version = "0.0.1" + (self.getCurrentConfig().isRelease ? "" : "-SNAPSHOT");

            self.corePOM = new MavenPOM(self.mainPom);
            self.corePOM.artifactId = "core";
            self.corePOM.version = "0.0.1" + (self.getCurrentConfig().isRelease ? "" : "-SNAPSHOT");
            self.corePOM.packaging = "jar";
            self.corePOM.dependencies.push(porticoPOM);
            self.corePOM.dependencies.push(C2WLoggingPOM);
            self.mainPom.projects.push(self.corePOM);

            //Add core POM generator
            self.fileGerenrators.push(function(artifact, callback){
                artifact.addFile('core/pom.xml', self._jsonToXml.convertToString( self.corePOM.toJSON() ), function (err) {
                    if (err) {
                        callback(err);
                        return;
                    }else{
                        callback();
                    }
                });
            });


            self.fileGerenrators.push(function(artifact, callback){
                var fullPath = coreOutFilePath + corePackagePath.join("/") + "/" + 'InteractionRoot.java';
                renderContext['isinteraction'] = true;
                artifact.addFile(fullPath, ejs.render(TEMPLATES['classroot.java.ejs'], renderContext), function (err) {
                    if (err) {
                        callback(err);
                        return;
                    }else{
                        fullPath = coreOutFilePath + corePackagePath.join("/") + "/" + 'InteractionRootInterface.java';
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
            
            
            self.fileGerenrators.push(function(artifact, callback){
                var fullPath = coreOutFilePath + corePackagePath.join("/") + "/" + 'ObjectRoot.java';
                renderContext['isinteraction'] = false;
                artifact.addFile(fullPath, ejs.render(TEMPLATES['classroot.java.ejs'], renderContext), function (err) {
                    if (err) {
                        callback(err);
                        return;
                    }else{
                        fullPath = coreOutFilePath + corePackagePath.join("/") + "/" + 'ObjectRootInterface.java';
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

            var renderToFile = function(outFilePath, isinteraction, model, artifact, callback){
                var context = self.createRTICodeModel(),
                packagePath = outFilePath + (self.genericInteractionPackage.hasOwnProperty(model.name) ? self.genericInteractionPackage[model.name] : [self.projectName]).join('/');

                context.isinteraction = isinteraction;
                context.simname = (self.genericInteractionPackage.hasOwnProperty(model.name) ? self.genericInteractionPackage[model.name] : [self.projectName]).join('.');
                context.classname = model.name;
                context.hlaclassname = model.fullName;
                context.parentclassname = model.isroot ? "" : model.basename;
                context.isc2winteractionroot = model.isroot && isinteraction;
                
                model['parameters'].forEach(function(param){
                    context.alldatamembers.push(param);
                    if(!param.hidden){
                        context.datamembers.push(param);
                    }
                });
                self.logger.debug('Rendering template to file: ' + outFilePath + model.name +'.java');
                artifact.addFile( packagePath + '/' + model.name +'.java', ejs.render(TEMPLATES['class.java.ejs'], context), callback);
            }

            self.rtiPOM = new MavenPOM(self.mainPom);
            self.rtiPOM.artifactId = self.projectName + "_rti";
            self.rtiPOM.version = "0.0.1" + (self.getCurrentConfig().isRelease ? "" : "-SNAPSHOT");
            self.rtiPOM.packaging = "jar";
            self.rtiPOM.dependencies.push(self.corePOM);
            self.mainPom.projects.push(self.rtiPOM);

            //Add sim POM generator
            self.fileGerenrators.push(function(artifact, callback){
                artifact.addFile(self.projectName + '_rti/pom.xml', self._jsonToXml.convertToString( self.rtiPOM.toJSON() ), function (err) {
                    if (err) {
                        callback(err);
                        return;
                    }else{
                        callback();
                    }
                });
            });

            self.fileGerenrators.push(function(artifact, callback){
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
                    if(self.objects[oid].name != "ObjectRoot"){
                        objToRender.push(self.objects[oid]);
                    }
                }

                renderNextObject();

            });

            self.fileGerenrators.push(function(artifact, callback){
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
                    if(self.interactions[iid].name != "InteractionRoot"){
                        intToRender.push(self.interactions[iid]);
                    }
                }
                renderNextInteraction();
            });
        }
    	

    	

        this.createRTICodeModel = function(){
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
                            "int"     : "Integer.toString( get_" + name +"() )",
                            "long"    : "Long.toString( get_" + name +"() )",
                            "short"   : "Short.toString( get_" + name +"() )",
                            "byte"    : "Byte.toString( get_" + name +"() )",
                            "char"    : "Character.toString( get_" + name +"() )",
                            "double"  : "Double.toString( get_" + name +"() )",
                            "float"   : "Float.toString( get_" + name +"() )",
                            "boolean" : "Boolean.toString( get_" + name +"() )"
                        }
                        return typeMap[type];
                    },
                    set: function(type){
                        var typeMap = {
                            "String"  : "val",
                            "int"     : "Integer.parseInt( val )",
                            "long"    : "Long.parseLong( val )",
                            "short"   : "Short.parseShort( val )",
                            "byte"    : "Byte.parseByte( val )",
                            "char"    : "val.charAt( 0 )",
                            "double"  : "Double.parseDouble( val )",
                            "float"   : "Float.parseFloat( val )",
                            "boolean" : "Boolean.parseBoolean( val )"
                        }
                        return typeMap[type];
                    },
                    get: function(type, name){
                        var typeMap = {
                            "String"  : "get_" + name + "()",
                            "int"     : "new Integer( get_" + name +"() )",
                            "long"    : "new Long( get_" + name +"() )",
                            "short"   : "new Short( get_" + name +"() )",
                            "byte"    : "new Byte( get_" + name +"() )",
                            "char"    : "new Character( get_" + name +"() )",
                            "double"  : "new Double( get_" + name +"() )",
                            "float"   : "new Float( get_" + name +"() )",
                            "boolean" : "new Boolean( get_" + name +"() )"
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