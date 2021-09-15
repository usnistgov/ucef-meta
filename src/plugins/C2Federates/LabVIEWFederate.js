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

    var LabVIEWFederateExporter;

/* ******************************************************************* */

/* LabVIEWFederateExporter */
/** (function-valued variable of top-level function object)<br><br>

Returned Value: none<br><br>

Called By: FederatesExporter in FederatesExporter.js<br><br>

This is the primary function for a LabVIEW federate.<br><br>

The top-level function returns this function.<br>

*/

    LabVIEWFederateExporter = function ()
    {
      var labviewArtifactId = "labview-federate";
      var labviewGroupId = "gov.nist.hla";
      var labviewVersion = "1.0.0-SNAPSHOT";
      var labViewCheckBack;           // function
      var visit_LabVIEWFederate;      // function
      var post_visit_LabVIEWFederate; // function

/* ******************************************************************* */

/* labViewCheckBack */
/** (function-valued variable of LabVIEWFederateExporter)<br><br>

Returned Value: none<br><br>

Called By: the six generator functions in post_visit_LabVIEWFederate<br><br>

If there is an error, this calls the callback with the error message
as an argument; otherwise, this calls the callback with no arguments.<br>

*/

      labViewCheckBack = function(           /* ARGUMENTS */
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

      this.federateTypes['LabVIEWFederate'] = {includeInExport: false};

/* ******************************************************************* */

/* visit_LabVIEWFederate */
/** (function-valued variable of LabVIEWFederateExporter)<br><br>

Returned Value: a "{context: context}" object<br><br>

Called By: atModelNode in modelTraverserMixin.js in C2Core<br><br>

This is the visitor function for a LabVIEW federate. It builds
the context object.<br>

*/

      visit_LabVIEWFederate = function(              /* ARGUMENTS */
       /** a LabVIEW federate node                   */ node,
       /** the parent of the node                    */ parent,
       /** a data object from which to generate code */ context)
      {
        var self;
        var nodeType;

        self = this;
        nodeType = self.core.getAttribute( self.getMetaType(node), 'name' );
        context['labviewfedspec'] = {};
        context['labviewfedspec']['groupId'] = self.mainPom.groupId.trim();
        context['labviewfedspec']['projectName'] = self.projectName;
        context['labviewfedspec']['projectVersion'] = self.project_version;
        context['labviewfedspec']['classname'] =
          self.core.getAttribute(node, 'name');
        context['labviewfedspec']['lookahead'] =
          self.core.getAttribute(node, 'Lookahead');
        context['labviewfedspec']['step'] =
          self.core.getAttribute(node, 'Step');
        context['labviewfedspec']['bindAddress'] =
          self.getCurrentConfig().bindAddress.trim();
        context['labviewfedspec']['rootdir'] =
          self.getCurrentConfig().codebaseDirectory.trim();
        context['labviewfedspec']['jarfile'] =
          labviewArtifactId + "-" + labviewVersion + ".jar";
        context['labviewfedspec']['labviewPOM'] = {};
        context['labviewfedspec']['labviewPOM']['artifactId'] =
          labviewArtifactId;
        context['labviewfedspec']['labviewPOM']['groupId'] = labviewGroupId;
        context['labviewfedspec']['labviewPOM']['version'] = labviewVersion;
        self.federates[self.core.getPath(node)] = context['labviewfedspec'];
        return {context: context};
      };
      this.visit_LabVIEWFederate = visit_LabVIEWFederate;

/* ******************************************************************* */

/* post_visit_LabVIEWFederate */
/** (function-valued variable of LabVIEWFederateExporter)<br><br>

Returned Value: a context object<br><br>

Called By: doneModelNode in ModelTraverserMixin.js<br><br>

This is the post visitor function for a LabVIEW federate node.
It adds file generators for:<br>
 - the pom.xml that fetches the LabVIEW federate code and resources<br>
 - the script that installs the LabVIEW federate<br>
 - the script that runs the LabVIEW federate<br>
 - the Portico configuration file<br>
 - the LabVIEW federate configuration file<br>
 - the log4j2 configuration file<br><br>

This is called in doneModelNode in ModelTraverserMixin.js when the
nodeMetaTypeName in that function is LabVIEWFederate.<br>

*/

      post_visit_LabVIEWFederate = function(         /* ARGUMENTS */
       /** a LabVIEW federate node                   */ node,
       /** a data object from which to generate code */ context)
      {
        var self = this;
        var renderContext = context['labviewfedspec'];
        var moduleName = renderContext['classname'];
        var configDirectory = moduleName + "/conf";
        var feder;

        // set the SOM.xml output directory
        feder = self.federateInfos[self.core.getPath(node)];
        if (feder)
          {
            feder.directory = moduleName + "/conf/";
          }

        // TODO rework MavenPOM.js for a more robust solution to
        // link the module
        self.mainPom.projects.push({'directory': moduleName});

        // generate the pom.xml that fetches the LabVIEW federate code
        // and resources
        self.fileGenerators.push(function (artifact, callback)
        {
          var code;
          var fullPath;
          var template;
          var model;

          model = {groupId: renderContext.groupId,
                   labviewPOMartifactId: renderContext.labviewPOM.artifactId,
                   labviewPOMgroupId: renderContext.labviewPOM.groupId,
                   labviewPOMversion: renderContext.labviewPOM.version,
                   projectVersion: renderContext.projectVersion,
                   rootdir: renderContext.rootdir};
          fullPath = moduleName + "/pom.xml";
          template = TEMPLATES['labview/labview-pom.xml.ejs'];
          code = ejs.render(template, model);
          self.logger.info('calling addFile for ' + fullPath + ' in post_' +
                           'visit_LabVIEWFederate of LabVIEWFederate.js');
          artifact.addFile(fullPath, code, 
                           function(err) {labViewCheckBack(err, callback);});
        });

        // generate the script that installs the LabVIEW federate
        self.fileGenerators.push(function (artifact, callback)
        {
          var code;
          var fullPath;
          var template;

          fullPath = moduleName + "/build.sh";
          template = TEMPLATES['common/mvn-install.sh.ejs'];
          code = ejs.render(template, {});
          self.logger.info('calling addFile for ' + fullPath + ' in post_' +
                           'visit_LabVIEWFederate of LabVIEWFederate.js');
          artifact.addFile(fullPath, code,
                           function(err) {labViewCheckBack(err, callback);});
        });

        // generate the script that runs the LabVIEW federate
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
                           'visit_LabVIEWFederate of LabVIEWFederate.js');
          artifact.addFile(fullPath, code,
                           function(err) {labViewCheckBack(err, callback);});
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
                           'visit_LabVIEWFederate of LabVIEWFederate.js');
          artifact.addFile(fullPath, code,
                           function(err) {labViewCheckBack(err, callback);});
        });

        // generate the LabVIEW federate configuration file
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
          template = TEMPLATES['labview/labview-config.json.ejs'];
          code = ejs.render(template, model);
          self.logger.info('calling addFile for ' + fullPath + ' in post_' +
                           'visit_LabVIEWFederate of LabVIEWFederate.js');
          artifact.addFile(fullPath, code,
                           function(err) {labViewCheckBack(err, callback);});
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
                           'visit_LabVIEWFederate of LabVIEWFederate.js');
          artifact.addFile(fullPath, code,
                           function(err) {labViewCheckBack(err, callback);});
        });

        return {context: context};
      }; // end post_visit_LabVIEWFederate
      this.post_visit_LabVIEWFederate = post_visit_LabVIEWFederate;

/* ******************************************************************* */

    }; // end LabVIEWFederateExporter

/* ******************************************************************* */

    return LabVIEWFederateExporter;
}); // end define
