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

/* ******************************************************************* */

/** GridLabFederateExporter (function-valued variable of
   top-level function object)

Returned Value: none

Called By: FederatesExporter in FederatesExporter.js

The top-level function returns this function.

*/
    
    GridLabDFederateExporter = function()
    {
      var gridlabdArtifactId = "gridlabd-federate";
      var gridlabdGroupId = "gov.nist.hla.gridlabd";
      var gridlabdVersion = "1.0.0-SNAPSHOT";
      var checkBack;

/* ******************************************************************* */
      
      checkBack = function(err, callBack)
      {
        if (err)
          {
            callBack(err);
            return;
          }
        else
          {
            callBack();
          }
      };

/* ******************************************************************* */
      
      this.federateTypes['GridLabDFederate'] = {includeInExport: false};

/* ******************************************************************* */
     
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

/* ******************************************************************* */

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
          var code;
          var fullPath;

          fullPath = moduleName + "/pom.xml";
          code = self._jsonToXml.convertToString(gldHelperPOM.toJSON());
          self.logger.info('calling addFile for ' + fullPath + ' in post_' +
                           'visit_GridLabDFederate of GridLabDFederate.js');
          artifact.addFile(fullPath, code,
                           function(err) {checkBack(err, callback);});
        });

        // generate the script that builds the GridLAB-D federate
        self.fileGenerators.push(function (artifact, callback)
        {
          var code;
          var fullPath;
          var template;

          fullPath = moduleName + "/build.sh";
          template = TEMPLATES['common/mvn-install.sh.ejs'];
          code = ejs.render(template, {});
          self.logger.info('calling addFile for ' + fullPath + ' in post_' +
                           'visit_GridLabDFederate of GridLabDFederate.js');
          artifact.addFile(fullPath, code,
                           function(err) {checkBack(err, callback);});
        });

        // generate the script that runs the GridLAB-D federate
        self.fileGenerators.push(function (artifact, callback)
        {
          var code;
          var fullPath;
          var template;
          var model;

          model = {classname: renderContext.classname,
                   jarfile: renderContext.jarfile};
          fullPath = moduleName + "/run.sh";
          template = TEMPLATES['common/run.sh.ejs'];
          code = ejs.render(template, model);
          self.logger.info('calling addFile for ' + fullPath + ' in post_' +
                           'visit_GridLabDFederate of GridLabDFederate.js');
          artifact.addFile(fullPath, code,
                           function(err) {checkBack(err, callback);});
        });

        // generate the Portico configuration file
        self.fileGenerators.push(function (artifact, callback)
        {
          var code;
          var fullPath;
          var template;

          fullPath = moduleName + '/RTI.rid';
          template = TEMPLATES['common/rti.rid.ejs'];
          code = ejs.render(template,
                            {bindAddress: renderContext.bindAddress});
          self.logger.info('calling addFile for ' + fullPath + ' in post_' +
                           'visit_GridLabDFederate of GridLabDFederate.js');
          artifact.addFile(fullPath, code,
                           function(err) {checkBack(err, callback);});
        });

        // generate the GridLAB-D federate configuration file
        self.fileGenerators.push(function (artifact, callback)
        {
          var code;
          var fullPath;
          var template;
          var model;

          model = {classname: renderContext.classname,
                   lookahead: renderContext.lookahead,
                   projectName: renderContext.projectName,
                   step: renderContext.step};
          fullPath = configDirectory + "/" + moduleName + ".json";
          template = TEMPLATES['java/gridlabd-config.json.ejs'];
          code = ejs.render(template, model);
          self.logger.info('calling addFile for ' + fullPath + ' in post_' +
                           'visit_GridLabDFederate of GridLabDFederate.js');
          artifact.addFile(fullPath, code,
                           function(err) {checkBack(err, callback);});
        });

        // generate the log4j2 configuration file
        self.fileGenerators.push(function (artifact, callback)
        {
          var code;
          var fullPath;
          var template;

          fullPath = configDirectory + "/log4j2.xml";
          template = TEMPLATES['common/log4j2.xml.ejs'];
          code = ejs.render(template, {});
          self.logger.info('calling addFile for ' + fullPath + ' in post_' +
                           'visit_GridLabDFederate of GridLabDFederate.js');
          artifact.addFile(fullPath, code,
                           function(err) {checkBack(err, callback);});
        });

        return {context: context};
      }; // end of post_visit_GridLabDFederate function

/* ******************************************************************* */

    }; // end of setting GridLabDFederateExporter function variable

/* ******************************************************************* */

   return GridLabDFederateExporter;
 }); // end define
