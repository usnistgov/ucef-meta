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

/* GridLabDFederateExporter */
/** (function-valued variable of top-level function object)<br><br>

Returned Value: none<br><br>

Called By: FederatesExporter in FederatesExporter.js<br><br>

This is the primary function for a GridLabD federate.<br><br>

The top-level function returns this function.<br>

*/

    GridLabDFederateExporter = function()
    {
      var gridlabdArtifactId = "gridlabd-federate";
      var gridlabdGroupId = "gov.nist.hla.gridlabd";
      var gridlabdVersion = "1.0.0-SNAPSHOT";
      var gridLabdCheckBack;           // function
      var visit_GridLabDFederate;      // function
      var post_visit_GridLabDFederate; // function

/* ******************************************************************* */

/* gridLabdCheckBack */
/** (function-valued variable of GridLabFederateExporter)<br><br>

Returned Value: none<br><br>

Called By: the six generator functions in post_visit_GridLabFederate<br><br>

If there is an error, this calls the callback with the error message
as an argument; otherwise, this calls the callback with no arguments.<br>

*/

      gridLabdCheckBack = function(          /* ARGUMENTS */
       /** an error message or nullish       */ err,
       /** function to call if error or done */ callBack)
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

/* visit_GridLabDFederate */
/** (function-valued variable of GridLabDFederateExporter)<br><br>

Returned Value: a "{context: context}" object<br><br>

Called By: atModelNode in modelTraverserMixin.js in C2Core<br><br>

This is the visitor function for a GridLabD federate. It builds
the context object.<br>

*/

      this.visit_GridLabDFederate = function(        /* ARGUMENTS */
       /** a GridLabD federate node                  */ node,
       /** the parent of the node                    */ parent,
       /** a data object from which to generate code */ context)
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
      }; // end visit_GridLabDFederate

/* ******************************************************************* */

/* post_visit_GridLabDFederate */
/** (function-valued variable of GridLabDFederateExporter)<br><br>

Returned Value: a context object<br><br>

Called By: doneModelNode in ModelTraverserMixin.js<br><br>

This is the post visitor function for a GridLabD federate node.
It adds file generators for:<br>
 - the pom.xml that fetches the GridLabD federate code and resources<br>
 - the script that builds the GridLabD federate<br>
 - the script that runs the GridLabD federate<br>
 - the Portico configuration file<br>
 - the GridLabD federate configuration file<br>
 - the log4j2 configuration file<br><br>

This is called in doneModelNode in ModelTraverserMixin.js when the
nodeMetaTypeName in that function is GridLabDFederate.<br>

*/

      post_visit_GridLabDFederate = function(        /* ARGUMENTS */
       /** a GridLabD federate node                  */ node,
       /** a data object from which to generate code */ context)
      {
        var self = this;
        var renderContext = context['gldfedspec'];
        var moduleName = renderContext['classname'];
        var configDirectory = moduleName + "/conf";
        var feder = self.federateInfos[self.core.getPath(node)];
        var gridlabdPOM = new MavenPOM();
        var gldHelperPOM = new MavenPOM();

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

        // generate the pom.xml that fetches the GridLABD federate code
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
                           function(err) {gridLabdCheckBack(err, callback);});
        });

        // generate the script that builds the GridLABD federate
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
                           function(err) {gridLabdCheckBack(err, callback);});
        });

        // generate the script that runs the GridLABD federate
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
                           function(err) {gridLabdCheckBack(err, callback);});
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
                           function(err) {gridLabdCheckBack(err, callback);});
        });

        // generate the GridLABD federate configuration file
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
                           function(err) {gridLabdCheckBack(err, callback);});
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
                           function(err) {gridLabdCheckBack(err, callback);});
        });

        return {context: context};
      }; // end post_visit_GridLabDFederate
      this.post_visit_GridLabDFederate = post_visit_GridLabDFederate;

/* ******************************************************************* */

    }; // end GridLabDFederateExporter

/* ******************************************************************* */

   return GridLabDFederateExporter;
 }); // end define
