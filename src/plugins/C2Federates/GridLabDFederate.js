define
([
  'ejs',
  'C2Core/MavenPOM',
  'C2Federates/Templates/Templates'],
 function (ejs,
           MavenPOM,
           TEMPLATES)
 {
   'use strict';
   var GridLabDFederateExporter;
   
   GridLabDFederateExporter = function()
   {
     var gridlabdArtifactId = "gridlabd-federate";
     var gridlabdGroupId = "gov.nist.hla.gridlabd";
     var gridlabdVersion = "1.0.0-SNAPSHOT";
     
     this.federateTypes['GridLabDFederate'] = {includeInExport: false};

/***********************************************************************/
     
     this.visit_GridLabDFederate = function(node, parent, context)
     {
       var self;
       var nodeType;

       self = this;
       nodeType = self.core.getAttribute( self.getMetaType(node), 'name' );
       context['gldfedspec'] = {};
       context['gldfedspec']['projectName'] = self.projectName;
       context['gldfedspec']['projectVersion'] = self.project_version;
       context['gldfedspec']['classname'] =
         self.core.getAttribute(node, 'name');
       context['gldfedspec']['lookahead'] =
         self.core.getAttribute(node, 'Lookahead');
       context['gldfedspec']['step'] = self.core.getAttribute(node, 'Step');
       context['gldfedspec']['bindAddress'] =
         self.getCurrentConfig().bindAddress.trim();
       context['gldfedspec']['jarfile'] =
         gridlabdArtifactId + "-" + gridlabdVersion + ".jar";
       self.federates[self.core.getPath(node)] = context['gldfedspec'];
       return {context: context};
     }; // end of visit_GridLabDFederate function

/***********************************************************************/

     this.post_visit_GridLabDFederate = function(node, context)
     {
       var self = this;
       var renderContext = context['gldfedspec'];
       var moduleName = renderContext['classname'];
       var configDirectory = moduleName + "/conf";
       var feder = self.federateInfos[self.core.getPath(node)];
       var gridlabdPOM = new MavenPOM();
       var gldHelperPOM = new MavenPOM(); // was new MavenPOM(self.mainPom);
       
       // set the SOM.xml output directory
       if (feder)
         {
           feder.directory = moduleName + "/conf/";
         }

       // reference to the GridLAB-D wrapper
       gridlabdPOM.artifactId = gridlabdArtifactId;
       gridlabdPOM.groupId = gridlabdGroupId;
       gridlabdPOM.version = gridlabdVersion;

       // pom.xml that fetches the resources required to run the GridLAB-D
       // federate. The maven-dependency-plugin will pull in the GridLAB-D
       // wrapper code. The maven-resources-plugin will pull in the
       // FederatesExporter FOM.xml file
       gldHelperPOM.groupId = 'org.webgme.guest'; // new
       gldHelperPOM.version = renderContext['projectVersion'];
       gldHelperPOM.artifactId = moduleName;
       gldHelperPOM.dependencies.push(gridlabdPOM);
       gldHelperPOM.plugins.push({
         'groupId': {'#text': 'org.apache.maven.plugins'},
         'artifactId': {'#text': 'maven-dependency-plugin'},
         'version': {'#text': '3.1.1'},
         'executions':
            {'execution':
               {'id': {'#text': 'copy-dependencies'},
                'phase': {'#text': 'package'},
                'goals': {'goal': {'#text': 'copy-dependencies'}},
                'configuration':
                  {'outputDirectory': {'#text': '${project.basedir}'},
                   'overWriteReleases': {'#text': 'true'},
                   'overWriteSnapshots': {'#text': 'true'},
                   'overWriteIfNewer': {'#text': 'true'}
                  }
               }
            }
         });

       // generate the pom.xml that fetches the GridLAB-D federate code
       // and resources
       self.fileGenerators.push(function (artifact, callback)
       {
         artifact.addFile(moduleName + "/pom.xml",
                        self._jsonToXml.convertToString(gldHelperPOM.toJSON()),
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

       // generate the script that builds the GridLAB-D federate
       self.fileGenerators.push(function (artifact, callback)
       {
         artifact.addFile(moduleName + "/build.sh",
                          ejs.render(TEMPLATES['java/mvn-install.sh.ejs'],
                                     renderContext),
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

       // generate the script that runs the GridLAB-D federate
       self.fileGenerators.push(function (artifact, callback)
       {
         artifact.addFile(moduleName + "/run.sh",
                          ejs.render(TEMPLATES['java/gridlabd-run.sh.ejs'],
                                     renderContext),
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

       // generate the Portico configuration file
       self.fileGenerators.push(function (artifact, callback)
       {
         artifact.addFile(moduleName + '/RTI.rid',
                          ejs.render(TEMPLATES['java/rti.rid.ejs'],
                                     renderContext),
                          function (err)
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

       // generate the GridLAB-D federate configuration file
       self.fileGenerators.push(function (artifact, callback)
       {
         artifact.addFile(configDirectory + "/" + moduleName + ".json",
                          ejs.render(TEMPLATES['java/gridlabd-config.json.ejs'],
                                     renderContext),
                          function (err)
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

       // generate the log4j2 configuration file
       self.fileGenerators.push(function (artifact, callback)
       {
         artifact.addFile(configDirectory + "/log4j2.xml",
                          ejs.render(TEMPLATES['java/log4j2.xml.ejs'],
                                     renderContext),
                          function (err)
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

       return {context: context};
     };
     // end of post_visit_GridLabDFederate function

/***********************************************************************/

   } // end of GridLabDFederateExporter function
   
/***********************************************************************/

   return GridLabDFederateExporter;
 }); // end define
