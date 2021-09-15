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

    var TRNSYSFederateExporter;

/* ******************************************************************* */

/* TRNSYSFederateExporter */
/** (function-valued variable of top-level function object)<br><br>

Returned Value: none<br><br>

Called By: FederatesExporter in FederatesExporter.js<br><br>

This is the primary function for a TRNSYS federate.<br><br>

The top-level function returns this function.<br>

*/

    TRNSYSFederateExporter = function()
    {
      var trnsysArtifactId = "trnsys-wrapper";
      var trnsysGroupId = "gov.nist.hla.trnsys";
      var trnsysVersion = "0.1.0-SNAPSHOT";
      var TRNSYSCheckBack;           // function
      var visit_TRNSYSFederate;      // function
      var post_visit_TRNSYSFederate; // function

/* ******************************************************************* */

/* TRNSYSCheckBack */
/** (function-valued variable of TRNSYSFederateExporter)<br><br>

Returned Value: none<br><br>

Called By: the six generator functions in post_visit_TRNSYSFederate<br><br>

If there is an error, this calls the callback with the error message
as an argument; otherwise, this calls the callback with no arguments.<br>

*/

      TRNSYSCheckBack = function(            /* ARGUMENTS */
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

      this.federateTypes['TRNSYSFederate'] = {includeInExport: false};

/* ******************************************************************* */

/* visit_TRNSYSFederate */
/** (function-valued variable of TRNSYSFederateExporter)<br><br>

Returned Value: a "{context: context}" object<br><br>

Called By: atModelNode in modelTraverserMixin.js in C2Core<br><br>

This is the visitor function for a TRNSYS federate. It builds
the context object.<br>

*/

      visit_TRNSYSFederate = function(               /* ARGUMENTS */
       /** a TRNSYS federate node                    */ node,
       /** the parent of the node                    */ parent,
       /** a data object from which to generate code */ context)
      {
        var self;
        var nodeType;

        self = this;
        nodeType = self.core.getAttribute( self.getMetaType(node), 'name' );
        context['trnsysfedspec'] = {};
        context['trnsysfedspec']['projectName'] = self.projectName;
        context['trnsysfedspec']['projectVersion'] = self.project_version;
        context['trnsysfedspec']['classname'] =
          self.core.getAttribute(node, 'name');
        context['trnsysfedspec']['lookahead'] =
          self.core.getAttribute(node, 'Lookahead');
        context['trnsysfedspec']['step'] = self.core.getAttribute(node, 'Step');
        context['trnsysfedspec']['bindAddress'] =
          self.getCurrentConfig().bindAddress.trim();
        context['trnsysfedspec']['jarfile'] =
          trnsysArtifactId + "-" + trnsysVersion + ".jar";
        self.federates[self.core.getPath(node)] = context['trnsysfedspec'];
        return {context: context};
      }; // end visit_TRNSYSFederate
      this.visit_TRNSYSFederate = visit_TRNSYSFederate;

/* ******************************************************************* */

/* post_visit_TRNSYSFederate */
/** (function-valued variable of TRNSYSFederateExporter)<br><br>

Returned Value: a context object<br><br>

Called By: doneModelNode in ModelTraverserMixin.js<br><br>

This is the post visitor function for a TRNSYS federate node.
It adds file generators for:<br>
 - the pom.xml that fetches the TRNSYS federate code and resources<br>
 - the script that builds the TRNSYS federate<br>
 - the script that runs the TRNSYS federate<br>
 - the Portico configuration file<br>
 - the TRNSYS federate configuration file<br>
 - the log4j2 configuration file<br><br>

This is called in doneModelNode in ModelTraverserMixin.js when the
nodeMetaTypeName in that function is TRNSYSFederate.<br>

*/

      post_visit_TRNSYSFederate = function(    /* ARGUMENTS */
       /** node to be processed                */ node,
       /** context object that may be modified */ context)
      {
        var self = this;
        var renderContext = context['trnsysfedspec'];
        var moduleName = renderContext['classname'];
        var configDirectory = moduleName + "/conf";
        var feder;
        var trnsysPOM = new MavenPOM();
        var trnsysHelperPOM = new MavenPOM();
        var trnsysVariables = {};

        // set the SOM.xml output directory
        feder = self.federateInfos[self.core.getPath(node)];
        if (feder)
          {
            feder.directory = moduleName + "/conf/";
          }

        // reference to the TRNSYS wrapper
        trnsysPOM.artifactId = trnsysArtifactId;
        trnsysPOM.groupId = trnsysGroupId;
        trnsysPOM.version = trnsysVersion;

        // pom.xml that fetches the resources required to run the TRNSYS
        // federate. The maven-dependency-plugin will pull in the TRNSYS
        // wrapper code. The maven-resources-plugin will pull in the
        // FederatesExporter FOM.xml file
        trnsysHelperPOM.groupId = 'gov.nist.hla.trnsys';
        trnsysHelperPOM.version = renderContext['projectVersion'];
        trnsysHelperPOM.artifactId = moduleName;
        trnsysHelperPOM.dependencies.push(trnsysPOM);
        trnsysHelperPOM.plugins.push({
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

        // generate the pom.xml that fetches the TRNSYS federate code
        // and resources
        self.fileGenerators.push(function (artifact, callback)
        {
          var code;
          var fullPath;

          fullPath = moduleName + "/pom.xml";
          code = self._jsonToXml.convertToString(trnsysHelperPOM.toJSON());
          self.logger.info('calling addFile for ' + fullPath + ' in post_' +
                           'visit_TRNSYSFederate of TRNSYSFederate.js');
           artifact.addFile(fullPath, code,
                           function(err) {TRNSYSCheckBack(err, callback);});
        });

        // generate the script that builds the TRNSYS federate
        self.fileGenerators.push(function (artifact, callback)
        {
          var code;
          var fullPath;
          var template;

          fullPath = moduleName + "/build.sh";
          template = TEMPLATES['common/mvn-install.sh.ejs'];
          code = ejs.render(template, {});
          self.logger.info('calling addFile for ' + fullPath + ' in post_' +
                           'visit_TRNSYSFederate of TRNSYSFederate.js');
          artifact.addFile(fullPath, code,
                           function(err) {TRNSYSCheckBack(err, callback);});
        });

        // generate the script that runs the TRNSYS federate
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
                           'visit_TRNSYSFederate of TRNSYSFederate.js');
          artifact.addFile(fullPath, code,
                           function(err) {TRNSYSCheckBack(err, callback);});
        });

        // generate the Portico configuration file
        self.fileGenerators.push(function (artifact, callback)
        {
          var code;
          var fullPath;
          var template;

          fullPath = moduleName + "/RTI.rid";
          template = TEMPLATES['common/rti.rid.ejs'];
          code = ejs.render(template,
                            {bindAddress: renderContext.bindAddress});
          self.logger.info('calling addFile for ' + fullPath + ' in post_' +
                           'visit_TRNSYSFederate of TRNSYSFederate.js');
          artifact.addFile(fullPath, code,
                           function(err) {TRNSYSCheckBack(err, callback);});
        });

        // generate the TRNSYS federate configuration file
        self.fileGenerators.push(function (artifact, callback)
        {
          var code;
          var fullPath;
          var template;
          var model;

          model = {classname: renderContext.classname,
                   lookahead: renderContext.lookahead,
                   projectName:renderContext. projectName,
                   step: renderContext.step};
          fullPath = configDirectory + "/" + moduleName + ".json";
          template = TEMPLATES['trnsys/trnsys-config.json.ejs'];
          code = ejs.render(template, model);
          self.logger.info('calling addFile for ' + fullPath + ' in post_' +
                           'visit_TRNSYSFederate of TRNSYSFederate.js');
          artifact.addFile(fullPath, code,
                           function(err) {TRNSYSCheckBack(err, callback);});
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
                           'visit_TRNSYSFederate of TRNSYSFederate.js');
          artifact.addFile(fullPath, code,
                           function(err) {TRNSYSCheckBack(err, callback);});
        });
        return {context: context};
      }; // end post_visit_TRNSYSFederate
      this.post_visit_TRNSYSFederate = post_visit_TRNSYSFederate;

/* ******************************************************************* */

    } // end TRNSYSFederateExporter

/* ******************************************************************* */

   return TRNSYSFederateExporter;
 }); // end define
