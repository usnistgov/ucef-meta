define
([
  'ejs',
  'C2Core/MavenPOM',
  'C2Federates/Templates/Templates'],
 function(ejs,
          MavenPOM,
          TEMPLATES)
 {
    'use strict';
    var JavaImplFederateExporter;

/* ******************************************************************* */

/* JavaImplFederateExporter */
/** (function-valued variable of top-level function object)<br><br>

Returned Value: none<br><br>

Called By: JavaFederateExporter in JavaFederate.js<br><br>

This is the java implementation federate exporter.<br><br>

The top-level function returns this function.<br>

*/

    JavaImplFederateExporter = function()
    {
      var self;
      var createJavaImplFederateCodeModel; // function
      var javaCheckBack;                   // function
      var visit_JavaImplFederate;          // function
      var post_visit_JavaImplFederate;     // function

      self = this;

/* ******************************************************************* */

/* javaCheckBack */
/** (function-valued variable of JavaImplFederateExporter)<br><br>

Returned Value: none<br><br>

Called By: the five generator functions in post_visit_CppImplFederate<br><br>

If there is an error, this calls the callback with the error message
as an argument; otherwise, this calls the callback with no arguments.<br>

*/
      javaCheckBack = function(              /* ARGUMENTS */
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

      this.federateTypes = this.federateTypes || {};
      this.federateTypes.JavaImplFederate =
      {includeInExport: false,
       longName: 'JavaImplFederate',
       init: function()
             {
               if (self.javaImplFedInitDone)
                 {
                   return;
                 }
               self.projectName = self.core.getAttribute(self.rootNode, 'name');
               self.javaImplFedInitDone = true;
             }
      };

/* ******************************************************************* */

/* visit_JavaImplFederate */
/** (function-valued variable of JavaImplFederateExporter)<br><br>

Returned Value: a "{context: context}" object<br><br>

Called By: visit_JavaFederate (in JavaFederate.js)<br><br>

This builds the context object and embeds it in an object by itself as the
value of the "context" property.<br>

*/

      visit_JavaImplFederate = function(             /* ARGUMENTS */
       /** a java federate node                      */ node,
       /** the parent of the node                    */ parent,
       /** a data object from which to generate code */ context)
      {
        var self;
        var nodeType;
        var fedspec;

        self = this;
        nodeType = self.core.getAttribute(self.getMetaType(node), 'name');
        fedspec = createJavaImplFederateCodeModel();
        context.javaimplfedspec = fedspec;
        fedspec.groupId = self.getCurrentConfig().groupId.trim();
        fedspec.projectName = self.projectName;
        fedspec.projectVersion = self.project_version;
        fedspec.cpswtVersion = self.getCurrentConfig().cpswtVersion;
        fedspec.snapshotUrl = self.getCurrentConfig().repositoryUrlSnapshot;
        fedspec.releaseUrl = self.getCurrentConfig().repositoryUrlRelease;
        fedspec.porticoPOM.artifactId = self.porticoPOM.artifactId;
        fedspec.porticoPOM.groupId = self.porticoPOM.groupId;
        fedspec.porticoPOM.version = self.porticoPOM.version;
        fedspec.porticoPOM.scope = self.porticoPOM.scope;
        fedspec.classname = self.core.getAttribute(node, 'name');
        fedspec.jarfile =
           fedspec.classname + '-' + fedspec.projectVersion + '.jar';
        fedspec.simname = self.projectName;
        fedspec.configFile = self.core.getAttribute(node, 'name') + '.json';
        fedspec.timeconstrained =
           self.core.getAttribute(node, 'TimeConstrained');
        fedspec.timeregulating =
           self.core.getAttribute(node, 'TimeRegulating');
        fedspec.lookahead = self.core.getAttribute(node, 'Lookahead');
        fedspec.step = self.core.getAttribute(node, 'Step');
        fedspec.asynchronousdelivery =
           self.core.getAttribute(node, 'EnableROAsynchronousDelivery');
        fedspec.bindAddress = self.getCurrentConfig().bindAddress.trim();
        self.javafederateName[self.core.getPath(node)] =
           self.core.getAttribute(node, 'name');
         self.federates[self.core.getPath(node)] = fedspec;
         return {context: context};
      };
      this.visit_JavaImplFederate = visit_JavaImplFederate;

/* ******************************************************************* */

/* post_visit_JavaImplFederate */
/** (function-valued variable of CppImplFederateExporter)<br><br>

Returned Value: an object with a context property whose value is the
context argument<br><br>

Called By: post_visit_JavaFederate (in JavaFederate.js)<br><br>

This modifies context.javaimplfedspec (aliased to renderContext) and
builds eight file generators. The code string in five of the file
generators is built using renderContext.<br>
 - federate pom generator<br>
 - federate base java generator<br>
 - federate java generator<br>
 - federate build script generator<br>
 - federate run script generator<br>
 - federate RTI.rid generator<br>
 - federate config file generator<br>
 - impl log config generator<br>

*/
      post_visit_JavaImplFederate = function(        /* ARGUMENTS */
       /** a C++ federate node                       */ node,
       /** a data object from which to generate code */ context)
      {
        var self;
        var renderContext;
        var fedPathDir;
        var outFileName;
        var feder;
        var groupPath;

        self = this;
        groupPath = self.getCurrentConfig().groupId.trim().replace(/[.]/g, '/');
        renderContext = context.javaimplfedspec;
        fedPathDir = self.core.getAttribute(node, 'name');
        outFileName = fedPathDir + '/src/main/java/' + groupPath + '/' +
                      self.core.getAttribute(node, 'name').toLowerCase() +
                      '/' + self.core.getAttribute(node, 'name') + '.java';
        // set the SOM.xml output directory
        feder = self.federateInfos[self.core.getPath(node)];
        if (feder)
          {
            feder.directory = fedPathDir + '/conf/';
          }
        renderContext.allobjectdata = renderContext.publishedobjectdata.
                                  concat(renderContext.subscribedobjectdata);
        renderContext.allinteractiondata =
            renderContext.publishedinteractiondata.
               concat(renderContext.subscribedinteractiondata);

/* ******************************************************************* */

        // Add impl POM generator from template
        self.fileGenerators.push(function(artifact, callback)
        {
          var xmlCode;
          var fullPath;
          var template;

          fullPath = fedPathDir + '/' + 'pom.xml';
          template = TEMPLATES['java/federateimpl_uberpom.xml.ejs'];
          xmlCode = ejs.render(template, renderContext);
          self.logger.info('calling addFile for ' + fullPath + ' in post_' +
                           'visit_JavaImplFederate of JavaImplFederate.js');
          artifact.addFile(fullPath, xmlCode,
                           function(err) {javaCheckBack(err, callback);});
        });

/* ******************************************************************* */

/* 

Add generator that prints a file whose name ends in Base.java

The file name (in context.javafedspec.outFileName) is constructed
in the post_visit_JavaFederate function in JavaFederate.js.

*/
        self.fileGenerators.push(function(artifact, callback)
        {
          var javaCode;
          var template;
          var fullPath;

          fullPath = context.javafedspec.outFileName;
          renderContext.moduleCollection.push(renderContext.classname);
          template = TEMPLATES['java/federatebase.java.ejs'];
          javaCode = ejs.render(template, renderContext);
          self.logger.info('calling addFile for ' + fullPath + ' in post_' +
                           'visit_JavaImplFederate of JavaImplFederate.js');
          artifact.addFile(fullPath, javaCode,
                           function(err) {javaCheckBack(err, callback);});
        });

/* ******************************************************************* */

        // This prints a file whose name ends in .java

        self.fileGenerators.push(function(artifact, callback)
        {
          var javaCode;
          var template;
          var fullPath;

          fullPath = outFileName;
          template = TEMPLATES['java/federateimpl.java.ejs'];
          javaCode = ejs.render(template, renderContext);
          self.logger.info('calling addFile for ' + fullPath + ' in post_' +
                           'visit_JavaImplFederate of JavaImplFederate.js');
          artifact.addFile(outFileName, javaCode,
                           function(err) {javaCheckBack(err, callback);});
        });

/* ******************************************************************* */

        // Add federate build script generator
        self.fileGenerators.push(function(artifact, callback)
        {
          var bashScript;
          var fullPath;
          var template;

          fullPath = fedPathDir + '/build.sh';
          template = TEMPLATES['common/mvn-install.sh.ejs'];
          bashScript = ejs.render(template, {});
          self.logger.info('calling addFile for ' + fullPath + ' in post_' +
                           'visit_JavaImplFederate of JavaImplFederate.js');
          artifact.addFile(fullPath, bashScript,
                           function(err) {javaCheckBack(err, callback);});
        });

/* ******************************************************************* */

        //Add federate run script generator
        self.fileGenerators.push(function(artifact, callback)
        {
          var bashScript;
          var fullPath;
          var template;
          var model;

          model = {classname: renderContext.classname,
                   jarfile: renderContext.jarfile};
          fullPath = fedPathDir + '/run.sh';
          template = TEMPLATES['java/java-run.sh.ejs'];
          bashScript = ejs.render(template, model);
          self.logger.info('calling addFile for ' + fullPath + ' in post_' +
                           'visit_JavaImplFederate of JavaImplFederate.js');
          artifact.addFile(fullPath, bashScript,
                           function(err) {javaCheckBack(err, callback);});
        });

/* ******************************************************************* */

        // Add federate RTI.rid file generator
        self.fileGenerators.push(function(artifact, callback)
        {
          var rtiCode;
          var fullPath;
          var template;

          fullPath = fedPathDir + '/RTI.rid';
          template = TEMPLATES['common/rti.rid.ejs'];
          rtiCode = ejs.render(template,
                               {bindAddress: renderContext.bindAddress});
          self.logger.info('calling addFile for ' + fullPath + ' in post_' +
                           'visit_JavaImplFederate of JavaImplFederate.js');
          artifact.addFile(fullPath, rtiCode,
                           function(err) {javaCheckBack(err, callback);});
        });

/* ******************************************************************* */

        // Add federate config file generator
        self.fileGenerators.push(function(artifact, callback)
        {
          var jsonCode;
          var fullPath;
          var template;
          var model;

          model = {classname: renderContext.classname,
                   lookahead: renderContext.lookahead,
                   projectName: renderContext.projectName,
                   step: renderContext.step};
          fullPath = fedPathDir + '/conf/' + renderContext.configFile;
          template = TEMPLATES['java/federate-config.json.ejs'];
          jsonCode = ejs.render(template, model);
          self.logger.info('calling addFile for ' + fullPath + ' in post_' +
                           'visit_JavaImplFederate of JavaImplFederate.js');
          artifact.addFile(fullPath, jsonCode,
                           function(err) {javaCheckBack(err, callback);});
        });

/* ******************************************************************* */

        // Add impl log config generator from template
        self.fileGenerators.push(function(artifact, callback)
        {
          var xmlCode;
          var fullPath;
          var template;

          fullPath = fedPathDir + '/conf/log4j2.xml';
          template = TEMPLATES['common/log4j2.xml.ejs']
          xmlCode = ejs.render(template, {});
          self.logger.info('calling addFile for ' + fullPath + ' in post_' +
                           'visit_JavaImplFederate of JavaImplFederate.js');
          artifact.addFile(fullPath, xmlCode,
                           function(err) {javaCheckBack(err, callback);});
        });

/* ******************************************************************* */

        return {context: context}; // context object does not appear used
      }; // end post_visit_JavaImplFederate
      this.post_visit_JavaImplFederate = post_visit_JavaImplFederate;

/* ******************************************************************* */

/* createJavaImplFederateCodeModel */
/** (function-valued variable of JavaImplFederateExporter)<br><br>

Returned Value: a "{context: context}" object<br><br>

Called By: visit_JavaImplFederate<br><br>

This creates the initial version of the fedspec in the context model.<br>

*/

      createJavaImplFederateCodeModel = function()
      {
        return {simname: '',
                melderpackagename: null,
                classname: '',
                isnonmapperfed: true,
                timeconstrained: false,
                timeregulating: false,
                lookahead: null,
                asynchronousdelivery: false,
                publishedinteractiondata: [],
                subscribedinteractiondata: [],
                allinteractiondata: [],
                publishedobjectdata: [],
                subscribedobjectdata: [],
                allobjectdata: [],
                porticoPOM: {},
                helpers: {},
                ejs: ejs,
                moduleCollection: [],
                TEMPLATES: TEMPLATES};
      };

/* ******************************************************************* */

    } // end JavaImplFederateExporter

/* ******************************************************************* */

    return JavaImplFederateExporter;
 }); // end define
