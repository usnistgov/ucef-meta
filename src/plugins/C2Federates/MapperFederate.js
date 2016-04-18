define([
    'common/util/ejs',
    'C2Core/MavenPOM',
	'C2Federates/Templates/Templates',
    'C2Federates/JavaRTI',
    'C2Federates/JavaFederate'
], function (
    ejs,
    MavenPOM,
	TEMPLATES,
    JavaRTI,
    JavaFederate
) {

    'use strict';

    var MapperFederateExporter  = function () {
    	var self = this,
            mapperOutFilePath,
            mapperDirSpec;
        
        JavaRTI.call(this);
        JavaFederate.call(this); 

        this.federateTypes = this.federateTypes || {};
    	this.federateTypes['MapperFederate'] = {
    		includeInExport: false,
    		longName: 'MapperFederate',
            init: function(){
                
                if(this.federateTypes['JavaFederate']){
                    this.federateTypes['JavaFederate'].init();
                }else{
                    self.initJavaRTI();  
                }

                var mapperDirBasePath = 'java-federates/';
                mapperDirSpec = {federation_name: self.projectName, artifact_name: "mapper", language:"java"};
                var mapperDirPath =  mapperDirBasePath + ejs.render(self.directoryNameTemplate, mapperDirSpec);

                mapperOutFilePath = mapperDirPath + MavenPOM.mavenJavaPath; 

                if(!self.java_federateBasePOM){
                    self.java_federateBasePOM = new MavenPOM();
                    self.java_federateBasePOM.groupId = 'org.c2w'
                    self.java_federateBasePOM.artifactId = 'federate-base';
                    self.java_federateBasePOM.version = self.c2w_version;  
                } 

                self.java_mapperPOM = null; //will be set by model visitor

                //Add base POM generator
                self.fileGenerators.push(function(artifact, callback){
                    if(!self.java_mapperPOM){
                        callback();
                        return;
                    }

                    artifact.addFile(mapperDirPath + '/pom.xml', self._jsonToXml.convertToString( self.java_mapperPOM.toJSON() ), function (err) {
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

    	this.visit_MapperFederate = function(node, parent, context){
            var self = this,
                nodeType = self.core.getAttribute( self.getMetaType( node ), 'name' );

            self.logger.info('Visiting a MaperFederate');

            //Setup project POM files on visiting the first Mapper Federate
            if(!self.javaPOM){
                self.javaPOM = new MavenPOM(self.mainPom);
                self.javaPOM.artifactId = self.projectName + "-java";
                self.javaPOM.directory = "java-federates";
                self.javaPOM.version = self.project_version;
                self.javaPOM.addMavenCompiler('1.5');
                self.javaPOM.packaging = "pom";
            }

            if(!self.java_mapperPOM){
                self.java_mapperPOM = new MavenPOM(self.javaPOM);
                self.java_mapperPOM.artifactId = ejs.render(self.directoryNameTemplate, mapperDirSpec);
                self.java_mapperPOM.version = self.project_version;
                self.java_mapperPOM.packaging = "jar";
                self.java_mapperPOM.dependencies.push(self.java_rtiPOM);
                self.java_mapperPOM.dependencies.push(self.java_federateBasePOM);
                self.java_mapperPOM.dependencies.push(self.java_basePOM);
            }

            context['mapperfedspec'] = self.createMapperFederateCodeModel();
            context['mapperfedspec']['classname'] = self.core.getAttribute(node, 'name');
            context['mapperfedspec']['simname'] = self.projectName;
            context['mapperfedspec']['step_size'] = parseFloat(self.core.getAttribute(node, 'Step'));
            if(isNaN(context['mapperfedspec']['step_size'])){
                self.createMessage(node, '[ERROR] Cannot parse float attribute Step. ', 'error');
            }
            
            self.federates[self.core.getPath(node)] = context['mapperfedspec'];
            context['parent'] = context['mapperfedspec'];
            context['mappings'] = [];

            if(self.visit_JavaFederate){
                return self.visit_JavaFederate(node, parent, context);
            }else{
                return {context:context};
            }
        };

        var unifiedMappingConnectionVisitor = function(self, node, parent, context){  
            var parentMapper = context['mapperfedspec'],
                parentMapperBase = context['javafedspec'],
            mapping = self.createMappingConnectionsDataModel(),
            nodeAttrNames = self.core.getAttributeNames(node),
            PARSE_FUNCS = {
                "Integer": "Integer.parseInt",
                "int": "Integer.parseInt",
                "Long": "Long.parseLong",
                "long": "Long.parseLong",
                "Double": "Double.parseDouble",
                "double": "Double.parseDouble",
                "Float": "Float.parseFloat",
                "float": "Float.parseFloat",
                "Boolean": "Boolean.parseBoolean",
                "boolean": "Boolean.parseBoolean"
            }

            for ( var i = 0; i < nodeAttrNames.length; i += 1 ) {
                mapping[nodeAttrNames[i]] = self.core.getAttribute( node, nodeAttrNames[i]);
            }   

            mapping['uniqueId'] = mapping['name'].replace(/-/g,'_');
            // See if it is a Simple/Complex MappingConnection
            mapping['isSimpleConn'] = !self.isMetaTypeOf(node, self.META['ComplexMappingConnection']);
            mapping['parentPath'] = self.core.getAttribute( parent.parent, 'name') + "/" + self.core.getAttribute( parent, 'name')

            // Check if it is a direct mapping (no mapping specs provided to )
            if(mapping['mapSpecs']){
                mapping['mappingSpecs'] = mapping['mapSpecs'].trim();
                mapping['isMappingSpecsNotEmpty'] = true;
            }else{
                mapping['isMappingSpecsNotEmpty'] = false;
            }

            if(mapping['guardCondition']){
                mapping['guardCondition'] = mapping['guardCondition'].trim();
                mapping['guardConditionInvalid'] = false;
            }else{
                self.createMessage(node, '[WARNING] The guard condition is empty! Default "return true;" will be used!', 'warning')
                mapping['guardConditionInvalid'] = true;
            }

            mapping['rhs'] = self.core.getPointerPath(node,'dst');
            mapping['lhs'] = self.core.getPointerPath(node,'src');  

            if(!mapping['lhs'] ){
                self.createMessage(node, '[ERROR] Invalid src pointer in MappingConnection!', 'error');
            }
            if(!mapping['rhs']){
                self.createMessage(node, '[ERROR] Invalid dst pointer in MappingConnection!', 'error');
            }          

            // Get LHS and RHS interaction classes
            mapping['handler'] = function(linteraction, rinteraction){
                var lhsIntr = linteraction,
                    rhsIntr = rinteraction;

                rhsIntr['isMapperPublished'] = true;

                mapping['lHSInteractionName'] = lhsIntr.name;
                mapping['rHSInteractionName'] = rhsIntr.name;
                mapping['lHSInteractionParamSize'] = lhsIntr.parameters.length;
                mapping['rHSInteractionParamSize'] = rhsIntr.parameters.length;

                if(!parentMapperBase['publishedinteractiondata'].find(function(element){
                    return element.name && element.name === rhsIntr.name;
                })){
                    parentMapperBase['publishedinteractiondata'].push({
                        name: rhsIntr.name,
                        publishedLoglevel: rhsIntr['LogLevel']

                    });
                }
                if(!parentMapperBase['subscribedinteractiondata'].find(function(element){
                    return element.name && element.name === lhsIntr.name;
                })){
                    parentMapperBase['subscribedinteractiondata'].push({
                        name: lhsIntr.name,
                        subscribedLoglevel: lhsIntr['LogLevel'],
                        //* Interaction might get connected to a Mapper on a different FOMSheet. 
                        //* Resolve correct filter at render time.
                        originFedFilter: function(){
                            return self.fedFilterMap['NON-SELF'];
                        },
                        srcFedFilter: function(){
                            return lhsIntr['isMapperPublished']?self.fedFilterMap['NON-MAPPER_FEDERATES']:'SOURCE_FILTER_DISABLED'
                        }
                        
                    });
                }

                if(mapping['lHSInteractionName'] === "NetworkPacket") {
                    mapping['isMappedInteractionANetworkPacket'] = true;
                } else {
                    mapping['isMappedInteractionANetworkPacket'] = false;
                }

                if(mapping['rHSInteractionName'] === "NetworkPacket") {
                    mapping['isToMapInteractionANetworkPacket'] = true;
                } else {
                    mapping['isToMapInteractionANetworkPacket'] = false;
                }

                if(mapping['isMappedInteractionANetworkPacket'] && mapping['isToMapInteractionANetworkPacket']){
                    mapping['areBothEndsOfMappingANetworkPacket'] = true;
                }else{
                    mapping['areBothEndsOfMappingANetworkPacket'] = false;
                }

                if(!mapping['guardConditionInvalid']){
                    var lhsExp = new RegExp("[$]" + lhsIntr.name, 'g'); //Build RegExp with global match (g) to repalce all.
                    mapping['guardCondition'] = mapping['guardCondition'].replace(lhsExp, "i1");
                }

                if(mapping['isMappingSpecsNotEmpty']){
                    if(mapping['isSimpleConn']){
                        var specs = mapping['mappingSpecs'].split(/[;\n]/)
                        mapping['mappingSpecs'] = "";
                        for(var i = 0; i < specs.length; i++){
                            var spec = specs[i],
                                rhsParam,
                                lhsParam;
                            // Replace RHS param name
                            for(var j = 0; j < rhsIntr.parameters.length; j++){
                                var rhsPar = rhsIntr.parameters[j],
                                    patternString = "\\$" + rhsIntr.name + "\\s*[.]\\s*" + rhsPar.name + "\\s*=\\s*",
                                    patternExp = new RegExp(patternString, 'g'), //Build RegExp with global match (g) to repalce all.
                                    replacementString = "o1.set_" + rhsPar.name,
                                    newSpec = spec.replace(patternExp, replacementString)
                                    if( newSpec !== spec ) {
                                        spec = newSpec;
                                        rhsParam = rhsPar;
                                        break;
                                    }
                            }
                            // Replace LHS param name
                            for(j = 0; j < lhsIntr.parameters.length; j++){
                                var lhsPar = lhsIntr.parameters[j],
                                    patternString = "\\$" + lhsIntr.name + "\\s*[.]\\s*" + lhsPar.name + "(?:\\s*;)*\\s*",
                                    patternExp = new RegExp(patternString, 'g'), //Build RegExp with global match (g) to repalce all.
                                    replacementString = "i1.get_" + lhsPar.name,
                                    newSpec = spec.replace(patternExp, replacementString)
                                    if( newSpec !== spec ) {
                                        spec = newSpec;
                                        lhsParam = lhsPar;
                                        break;
                                    }
                            }

                            // For SimpleMappingConnection, perform data type conversion
                            if( lhsParam && rhsParam ) {
                                if(  rhsParam.parameterType !== lhsParam.parameterType  ) {
                                    if( rhsParam.parameterType === "String" ) {
                                        spec = spec.replace(/(i1[.].*?[(][)])/g, "String.valueOf( $1 )");
                                    } else if(lhsParam.parameterType === "String" ) {
                                        spec = spec.replace(/(i1[.].*?[(][)])/g, PARSE_FUNCS[rhsParam.parameterType] + "( $1 )");
                                    } else {
                                        spec = spec.replace(/(i1[.].*?[(][)])/g, "(" + lhsParam.parameterType + ") $1"); 
                                    }
                                }
                            }

                            mapping['mappingSpecs'] += spec + "\n";
                        }

                    }else{
                        var rhsExp = new RegExp("[$]" + rhsIntr.name, 'g'), //Build RegExp with global match (g) to repalce all.
                            lhsExp = new RegExp("[$]" + lhsIntr.name, 'g'); //Build RegExp with global match (g) to repalce all.
                        mapping['mappingSpecs'] = mapping['mappingSpecs'].replace(rhsExp, "o1"); 
                        mapping['mappingSpecs'] = mapping['mappingSpecs'].replace(lhsExp, "i1"); 
                        mapping['mappingSpecs'] = mapping['mappingSpecs'].replace(/;(?:\s*[\n])*/g, ";\n"); 
                    }
                }   

                if(parentMapper['mappingconnsdata']){
                    parentMapper['mappingconnsdata'].push(mapping);
                }
            }

            if(context['mappings']){
                context['mappings'].push(mapping);
            }

            return {context:context};
        };

        this.visit_SimpleMappingConnection = function(node, parent, context){
            var self = this;
            return unifiedMappingConnectionVisitor(self, node, parent, context);
        };

        this.visit_ComplexMappingConnection = function(node, parent, context){
            var self = this;
            return unifiedMappingConnectionVisitor(self, node, parent, context);  
        };
        

        this.post_visit_MapperFederate = function(node, context){
            var self = this,
                renderContext = context['mapperfedspec'],
                outFileName = mapperOutFilePath + "/" +renderContext['simname'] + "/" + self.core.getAttribute(node, 'name') + ".java";
            
            for(var i = 0; i < context['mappings'].length; i++){
                var mapping = context['mappings'][i];
                if(mapping.lhs && mapping.rhs){
                    if(self.interactions[mapping.lhs] && self.interactions[mapping.rhs]){
                        if(mapping.handler){
                            mapping.handler(self.interactions[mapping.lhs], self.interactions[mapping.rhs]);
                        }
                    }else if(self.objects[mapping.lhs] && self.objects[mapping.rhs]){
                        if(mapping.handler){
                            mapping.handler(self.objects[mapping.lhs], self.objects[mapping.rhs]);
                        }
                    }
                }
            }

            self.fileGenerators.push(function(artifact, callback){
                 
                self.logger.debug('Rendering template to file: ' + outFileName);
                artifact.addFile(outFileName, ejs.render(TEMPLATES['mapperfederate.java.ejs'], renderContext), function (err) {
                    if (err) {
                        callback(err);
                        return;
                    }else{
                        callback();
                    }
                });
            });
                    
            if(self.post_visit_JavaFederate){
                return self.post_visit_JavaFederate(node, context);
            }else{
                return {context:context};
            }
        };

        this.createMapperFederateCodeModel = function(){
            return {
                simname: "",
                classname: "",
                step_size: "",
                mappingconnsdata: [],
                mappingobjectsdata: [],
                helpers:{},
                ejs:ejs, 
                TEMPLATES:TEMPLATES
            };
        }
        this.mapperCodeModel = this.createMapperFederateCodeModel();

        this.createMappingConnectionsDataModel = function(){
            return {
                lHSInteractionName: "",
                rHSInteractionName: "",
                lHSInteractionParamSize: 0,
                rHSInteractionParamSize: 0,
                isSimpleConn: true,
                mappingSpecs: "",
                guardCondition: "",
                uniqueId: "",
                parentPath: "",
                isMappingSpecsNotEmpty: false,
                isMappedInteractionANetworkPacket: false,
                isToMapInteractionANetworkPacket: false,
                areBothEndsOfMappingANetworkPacket: false,
                guardConditionInvalid: true
            };
        }

    }

    return MapperFederateExporter;
});