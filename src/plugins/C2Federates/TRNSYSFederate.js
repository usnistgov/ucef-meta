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

/** TRNSYSFederateExporter (function-valued variable of
   top-level function object)

Returned Value: none

Called By: FederatesExporter in FederatesExporter.js

The top-level function returns this function.

*/

    TRNSYSFederateExporter = function()
    {
      var trnsysArtifactId = "trnsys-wrapper";
      var trnsysGroupId = "gov.nist.hla.trnsys";
      var trnsysVersion = "0.1.0-SNAPSHOT";
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

      this.federateTypes['TRNSYSFederate'] = {includeInExport: false};

/* ******************************************************************* */

      this.visit_TRNSYSFederate = function(node, parent, context)
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
      }; // end of visit_TRNSYSFederate function

/* ******************************************************************* */

      this.makeTRNSYSVariables = function(node)
      {
        var self;
        var feder;
        var trnsysVariables;

        self = this;
        feder = self.federateInfos[self.core.getPath(node)];
        trnsysVariables = {};
        return trnsysVariables;
      };

/* ******************************************************************* */

      this.post_visit_TRNSYSFederate = function(node, context)
      {
        var self = this;
        var renderContext = context['trnsysfedspec'];
        var moduleName = renderContext['classname'];
        var configDirectory = moduleName + "/conf";
        var feder;
        var trnsysPOM = new MavenPOM();
        var trnsysHelperPOM = new MavenPOM();
        var trnsysVariables = self.makeTRNSYSVariables(node);

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
                           function(err) {checkBack(err, callback);});
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
                           function(err) {checkBack(err, callback);});
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
                           function(err) {checkBack(err, callback);});
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
                           function(err) {checkBack(err, callback);});
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
                           'visit_TRNSYSFederate of TRNSYSFederate.js');
          artifact.addFile(fullPath, code,
                           function(err) {checkBack(err, callback);});
        });
        return {context: context};
      };
      // end of post_visit_TRNSYSFederate function

/* ******************************************************************* */

    } // end of TRNSYSFederateExporter function

/* ******************************************************************* */

   return TRNSYSFederateExporter;
 }); // end define
