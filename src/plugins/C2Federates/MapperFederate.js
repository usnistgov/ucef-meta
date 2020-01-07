/* 

MapperFederate.js is used only in FederatesExporter.js

*/

define
([
    'ejs',
    'C2Core/MavenPOM',
    'C2Federates/Templates/Templates',
    'C2Federates/JavaRTI',
    'C2Federates/JavaFederate'],
 function (ejs,
           MavenPOM,
           TEMPLATES,
           JavaRTI,
           JavaFederate)
 {
    'use strict';

    var MapperFederateExporter;
    
    MapperFederateExporter = function()
    {
      var self;
      var mapperOutFilePath;
      var mapperDirSpec;
      var unifiedMappingConnectionVisitor; // function variable
      
      self = this;
      JavaRTI.call(this);
      JavaFederate.call(this); 

      this.federateTypes = this.federateTypes || {};
      this.federateTypes.MapperFederate =
        {includeInExport: false,
         longName: 'MapperFederate',
         init: function()
               {
                 var mapperDirBasePath;
                 var mapperDirPath;
                 var fullPath;
                 var xmlCode;
                  
                 if (this.federateTypes.JavaFederate)
                   {
                     this.federateTypes.JavaFederate.init();
                   }
                 else
                   {
                     self.initJavaRTI();
                   }
                 if (this.federateTypes.JavaImplFederate)
                   {
                     this.federateTypes.JavaImplFederate.init();
                   }
                 mapperDirBasePath = 'java-federates/';
                 mapperDirSpec = {federation_name: self.projectName,
                                  artifact_name: "mapper",
                                  language: "java"};
                 mapperDirPath = mapperDirBasePath +
                        ejs.render(self.directoryNameTemplate, mapperDirSpec);
                 mapperOutFilePath = mapperDirPath + MavenPOM.mavenJavaPath; 
                 if (!self.porticoPOM)
                   {  
                     self.porticoPOM = new MavenPOM();
                     self.porticoPOM.artifactId = "portico";
                     self.porticoPOM.groupId = "org.porticoproject";
                     // Set the portico Release Version
                     self.porticoPOM.version = "2.1.0";
                     self.porticoPOM.scope = "provided";
                   }
                 if (!self.java_federateBasePOM)
                   {
                     self.java_federateBasePOM = new MavenPOM();
                     self.java_federateBasePOM.groupId = 'org.cpswt'
                     self.java_federateBasePOM.artifactId = 'federate-base';
                     self.java_federateBasePOM.version = self.cpswt_version;  
                   } 
                 self.java_mapperPOM = null; //will be set by model visitor
                 
/***********************************************************************/
                 //Add base POM generator
                 self.fileGenerators.push(function(artifact, callback)
                 {
                   if (!self.java_mapperPOM)
                     {
                       callback();
                       return;
                     }
                   self.java_mapperPOM.dependencies.push(self.java_rtiPOM);
                   self.java_mapperPOM.dependencies.
                     push(self.java_federateBasePOM);
                   self.java_mapperPOM.dependencies.push(self.java_basePOM);
                   fullPath = mapperDirPath + '/pom.xml';
                   xmlCode = self._jsonToXml.
                     convertToString(self.java_mapperPOM.toJSON());
                   self.logger.info('calling addFile for ' + fullPath +
                                    ' in MapperFederateExporter' +
                                    ' of MapperFederate.js');
                   artifact.addFile(fullPath, xmlCode,
                                    function(err)
                                    {
                                      if (err)
                                        {
                                          callback(err);
                                          return;
                                        }
                                      else
                                        {
                                          callback();
                                        }
                                    });
                 });
               } // end init function
        }; // end object

/***********************************************************************/

      this.visit_MapperFederate = function(node, parent, context)
      {
        var self;
        var nodeType;
        
        self = this;
        nodeType = self.core.getAttribute(self.getMetaType(node), 'name');
        //Set up project POM files on visiting the first Mapper Federate
        if (!self.javaPOM)
          {
            self.javaPOM = new MavenPOM(self.mainPom);
            self.javaPOM.artifactId = self.projectName + "-java";
            self.javaPOM.directory = "java-federates";
            self.javaPOM.version = self.project_version;
            self.javaPOM.addMavenCompiler('1.8');
            self.javaPOM.packaging = "pom";
            self.javaPOM.dependencies.push(self.porticoPOM);
          }
        if (!self.java_mapperPOM)
          {
            self.java_mapperPOM = new MavenPOM(self.javaPOM);
            self.java_mapperPOM.artifactId =
                 ejs.render(self.directoryNameTemplate, mapperDirSpec);
            self.java_mapperPOM.version = self.project_version;
            self.java_mapperPOM.packaging = "jar";
          }
	self.mapperCodeModel =
	   {simname: self.projectName,
	    classname: self.core.getAttribute(node, 'name'),
	    step_size: parseFloat(self.core. getAttribute(node, 'Step')),
	    mappingconnsdata: [],
	    mappingobjectsdata: [],
	    helpers: {},
	    ejs: ejs, 
	    TEMPLATES: TEMPLATES};
        context.mapperfedspec = self.mapperCodeModel;
        if (isNaN(context.mapperfedspec.step_size))
          {
            self.createMessage(node,
                    '[ERROR] Cannot parse float attribute Step. ', 'error');
          } 
        self.federates[self.core.getPath(node)] = context.mapperfedspec;
        context.parent = context.mapperfedspec;
        context.mappings = [];

        if (self.visit_JavaFederate)
          {
            return self.visit_JavaFederate(node, parent, context);
          }
        else
          {
            return {context:context};
          }
      };

/***********************************************************************/

      unifiedMappingConnectionVisitor = function(self, node, parent, context)
      {  
        var parentMapper = context.mapperfedspec;
        var parentMapperBase = context.javafedspec;
        var nodeGUID = self.core.getGuid(node);
        var mapping = self.createMappingConnectionsDataModel();
        var nodeAttrNames = self.core.getAttributeNames(node);
        var PARSE_FUNCS = {"Integer": "Integer.parseInt",
                           "int": "Integer.parseInt",
                           "Long": "Long.parseLong",
                           "long": "Long.parseLong",
                           "Double": "Double.parseDouble",
                           "double": "Double.parseDouble",
                           "Float": "Float.parseFloat",
                           "float": "Float.parseFloat",
                           "Boolean": "Boolean.parseBoolean",
                           "boolean": "Boolean.parseBoolean"};
        var i;

        for (i = 0; i < nodeAttrNames.length; i++)
          {
            mapping[nodeAttrNames[i]] =
              self.core.getAttribute(node, nodeAttrNames[i]);
          }   
        mapping.uniqueId = nodeGUID.replace(/-/g,'_');
        // See if it is a Simple/Complex MappingConnection
        mapping.isSimpleConn =
          !self.isMetaTypeOf(node, self.META.ComplexMappingConnection);
        mapping.parentPath = self.core.getAttribute(parent.parent, 'name') +
                             "/" + self.core.getAttribute(parent, 'name');
        // Check if it is a direct mapping (no mapping specs provided to)
        if (mapping.mapSpecs)
          {
                mapping.mappingSpecs = mapping.mapSpecs.trim();
                mapping.isMappingSpecsNotEmpty = true;
          }
        else
          {
            mapping.isMappingSpecsNotEmpty = false;
          }
        
        if (mapping.guardCondition)
          {
            mapping.guardCondition = mapping.guardCondition.trim();
            mapping.guardConditionInvalid = false;
          }
        else
          {
            self.createMessage(node, '[WARNING] The guard condition is empty! Default "return true;" will be used!', 'warning');
            mapping.guardConditionInvalid = true;
          }
        mapping.rhs = self.core.getPointerPath(node,'dst');
        mapping.lhs = self.core.getPointerPath(node,'src');  
        if (!mapping.lhs)
          {
              self.createMessage(node,
                '[ERROR] Invalid src pointer in MappingConnection!', 'error');
          }
        if (!mapping.rhs)
          {
              self.createMessage(node,
                '[ERROR] Invalid dst pointer in MappingConnection!', 'error');
          }

/***********************************************************************/

        // Get LHS and RHS interaction classes
        mapping.handler = function(linteraction, rinteraction)
        {
          var lhsIntr = linteraction;
          var rhsIntr = rinteraction;
          var lhsExp;
          var rhsExp;
          var specs;
          var spec;
          var i;
          var j;
          var rhsParam;
          var rhsPar;
          var lhsParam;
          var lhsPar;
          var patternString;
          var patternExp;
          var replacementString;
          var newSpec;
          
          rhsIntr.isMapperPublished = true;
          mapping.lHSInteractionName = lhsIntr.name;
          mapping.rHSInteractionName = rhsIntr.name;
          mapping.lHSInteractionParamSize = lhsIntr.parameters.length;
          mapping.rHSInteractionParamSize = rhsIntr.parameters.length;
          
          if (!parentMapperBase.publishedinteractiondata.
              find(function(element)
                   {
                     return element.name && element.name === rhsIntr.name;
                   }))
            {
              parentMapperBase.publishedinteractiondata.push(
                        {name: rhsIntr.name,
                         publishedLoglevel: rhsIntr.LogLevel});
            }
          
          if (!parentMapperBase.subscribedinteractiondata.
              find(function(element)
                   {
                     return element.name && element.name === lhsIntr.name;
                   }))
            {
              parentMapperBase.subscribedinteractiondata.push(
                        {name: lhsIntr.name,
                         subscribedLoglevel: lhsIntr.LogLevel,
                            // Interaction might get connected to a Mapper on
                            // a different FOMSheet. 
                            // Resolve correct filter at render time.
                         originFedFilter: function()
                            {
                              return self.fedFilterMap['NON-SELF'];
                            },
                         srcFedFilter: function()
                            {
                              return (lhsIntr.isMapperPublished ?
                                    self.fedFilterMap['NON-MAPPER_FEDERATES'] :
                                      'SOURCE_FILTER_DISABLED');
                            }
                        });
            }

          mapping.isMappedInteractionANetworkPacket =
            ((mapping.lHSInteractionName === "NetworkPacket") ? true : false);
          mapping.isToMapInteractionANetworkPacket =
            ((mapping.rHSInteractionName === "NetworkPacket") ? true : false);
          mapping.areBothEndsOfMappingANetworkPacket =
            ((mapping.isMappedInteractionANetworkPacket &&
              mapping.isToMapInteractionANetworkPacket) ? true : false);
          if (!mapping.guardConditionInvalid)
            { //Build RegExp with global match (g) to replace all.
              lhsExp = new RegExp("[$]" + lhsIntr.name, 'g');
              mapping.guardCondition = mapping.guardCondition.replace(lhsExp,
                                                                      "i1");
            }
          if (mapping.isMappingSpecsNotEmpty)
            {
              if (mapping.isSimpleConn)
                {
                  specs = mapping.mappingSpecs.split(/[;\n]/);
                  mapping.mappingSpecs = "";
                  for (i = 0; i < specs.length; i++)
                    {
                      spec = specs[i];
                      // Replace RHS param name
                      for (j = 0; j < rhsIntr.parameters.length; j++)
                        {
                          rhsPar = rhsIntr.parameters[j];
                          patternString = "\\$" + rhsIntr.name +
                            "\\s*[.]\\s*" + rhsPar.name + "\\s*=\\s*";
                          patternExp = new RegExp(patternString, 'g');
                          //Build RegExp with global match (g) to replace all.
                          replacementString = "o1.set_" + rhsPar.name;
                          newSpec = spec.replace(patternExp, replacementString);
                          if (newSpec !== spec)
                            {
                              spec = newSpec;
                              rhsParam = rhsPar;
                              break;
                            }
                        }
                      // Replace LHS param name
                      for (j = 0; j < lhsIntr.parameters.length; j++)
                        {
                          lhsPar = lhsIntr.parameters[j];
                          patternString = "\\$" + lhsIntr.name +
                            "\\s*[.]\\s*" + lhsPar.name + "(?:\\s*;)*\\s*";
                          patternExp = new RegExp(patternString, 'g');
                          //Build RegExp with global match (g) to replace all.
                          replacementString = "i1.get_" + lhsPar.name;
                          newSpec = spec.replace(patternExp, replacementString);
                          if (newSpec !== spec)
                            {
                              spec = newSpec;
                              lhsParam = lhsPar;
                              break;
                            }
                        }
                      // For SimpleMappingConnection, do data type conversion
                      if (lhsParam && rhsParam)
                        {
                          if ( rhsParam.parameterType !==
                               lhsParam.parameterType )
                            {
                              if (rhsParam.parameterType === "String")
                                {
                                  spec = spec.replace(/(i1[.].*?[(][)])/g,
                                                      "String.valueOf($1)");
                                }
                              else if (lhsParam.parameterType === "String")
                                {
                                  spec = spec.replace(/(i1[.].*?[(][)])/g,
                                        PARSE_FUNCS[rhsParam.parameterType] +
                                        "($1)");
                                }
                              else
                                {
                                  spec = spec.replace(/(i1[.].*?[(][)])/g,
                                       "(" + lhsParam.parameterType + ") $1"); 
                                }
                            }
                        }
                      mapping.mappingSpecs += spec + "\n";
                    }

                }
              else
                {
                  rhsExp = new RegExp("[$]" + rhsIntr.name, 'g');
                  //Build RegExp with global match (g) to replace all.
                  lhsExp = new RegExp("[$]" + lhsIntr.name, 'g');
                  //Build RegExp with global match (g) to replace all.
                  mapping.mappingSpecs =
                         mapping.mappingSpecs.replace(rhsExp, "o1"); 
                  mapping.mappingSpecs =
                         mapping.mappingSpecs.replace(lhsExp, "i1"); 
                  mapping.mappingSpecs =
                  mapping.mappingSpecs.replace(/;(?:\s*[\n])*/g, ";\n"); 
                }
            }   
          
          if (parentMapper.mappingconnsdata)
            {
              parentMapper.mappingconnsdata.push(mapping);
            }
        }; // end mapping.handler function

/***********************************************************************/

        if (context.mappings)
          {
            context.mappings.push(mapping);
          }
        return {context:context};
      }; // end unifiedMappingConnectionVisitor function

/***********************************************************************/

      this.visit_SimpleMappingConnection = function(node, parent, context)
      {
        var self = this;
        return unifiedMappingConnectionVisitor(self, node, parent, context);
      };

/***********************************************************************/

      this.visit_ComplexMappingConnection = function(node, parent, context)
      {
        var self = this;
        return unifiedMappingConnectionVisitor(self, node, parent, context);  
      };
        
/***********************************************************************/

      this.post_visit_MapperFederate = function(node, context)
      {
        var self;
        var renderContext;
        var outFileName;
        var i;
        var mapping;
        
        self = this;
        renderContext = context.mapperfedspec;
        outFileName = mapperOutFilePath + "/" + renderContext.simname + "/" +
                      self.core.getAttribute(node, 'name') + ".java";
            
/***********************************************************************/

        for (i = 0; i < context.mappings.length; i++)
          {
            mapping = context.mappings[i];
            if (mapping.lhs && mapping.rhs)
              {
                if (self.interactions[mapping.lhs] &&
                    self.interactions[mapping.rhs])
                  {
                    if (mapping.handler)
                      {
                        mapping.handler(self.interactions[mapping.lhs],
                                        self.interactions[mapping.rhs]);
                      }
                  }
                else if (self.objects[mapping.lhs] &&
                         self.objects[mapping.rhs])
                  {
                    if (mapping.handler)
                      {
                        mapping.handler(self.objects[mapping.lhs],
                                        self.objects[mapping.rhs]);
                      }
                  }
              }
          }

/***********************************************************************/

        self.fileGenerators.push(function(artifact, callback)
        {
          var javaCode;
          var template;

          template = TEMPLATES['java/mapperfederate.java.ejs'];
          javaCode = ejs.render(template, self.mapperCodeMode);
          self.logger.info('calling addFile for ' + outFileName + ' in ' +
                           'post_visit_MapperFederate of MapperFederate.js');
          artifact.addFile(outFileName, javaCode,
                           function(err)
                           {
                             if (err)
                               {
                                 callback(err);
                                 return;
                               }
                             else
                               {
                                 callback();
                               }
                           });
        });
                    
/***********************************************************************/

        if (self.post_visit_JavaFederate)
          {
            return self.post_visit_JavaFederate(node, context);
          }
        else
          {
            return {context:context};
          }
      }; // end of post_visit_MapperFederate function

/***********************************************************************/

      this.createMappingConnectionsDataModel = function()
      {
        return {lHSInteractionName: "",
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
                guardConditionInvalid: true};
      }

/***********************************************************************/

    } // end MapperFederateExporter function

    return MapperFederateExporter;
 }); // end define
