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

/** JavaImplFederateExporter (function-valued variable of top-level function obj)

Returned Value: none

Called By: JavaFederateExporter in JavaFederate.js

The top-level function returns this function.

*/
    
    JavaImplFederateExporter = function()
    {
      var self;
      var checkBack;

      self = this;

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

/** visit_JavaImplFederate

Returned Value: a "{context: context}" object

Called By: visit_JavaFederate (in JavaFederate.js)

*/

      this.visit_JavaImplFederate = function(node, parent, context)
      {
        var self;
        var nodeType;
        var fedspec;
         
        self = this;
        nodeType = self.core.getAttribute(self.getMetaType(node), 'name');
        fedspec = self.createJavaImplFederateCodeModel();
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

/* ******************************************************************* */

/** post_visit_JavaImplFederate

Returned Value: an object with a context property whose value is the
context argument.

Called By: post_visit_JavaFederate (in JavaFederate.js)

This modifies context.javaimplfedspec (aliased to renderContext) and
builds six file generators. The code string in five of the file
generators is built using renderContext.

*/
      this.post_visit_JavaImplFederate = function(node, context)
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

        //Add impl POM from template
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
                           function(err) {checkBack(err, callback);});
        });

/* ******************************************************************* */

/**

This prints files with names of the form <federateName>Base.java

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
                           function(err) {checkBack(err, callback);});
        });

/* ******************************************************************* */

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
                           function(err) {checkBack(err, callback);});
        });

/* ******************************************************************* */

        //Add federate build script
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
                           function(err) {checkBack(err, callback);});
        });

/* ******************************************************************* */

        //Add federate run script
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
                           function(err) {checkBack(err, callback);});
        });

/* ******************************************************************* */

        //Add federate RTI.rid file
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
                           function(err) {checkBack(err, callback);});
        });

/* ******************************************************************* */

        //Add federate config file
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
                           function(err) {checkBack(err, callback);});
        });

/* ******************************************************************* */

        //Add impl log config from template
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
                           function(err) {checkBack(err, callback);});
        });

/* ******************************************************************* */

        return {context: context}; // context object does not appear used
      }; // end of post_visit_JavaImplFederate function

/* ******************************************************************* */

      this.createJavaImplFederateCodeModel = function()
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
      }

/* ******************************************************************* */

      this.javaImplCodeModel = this.createJavaImplFederateCodeModel();
    } // end of JavaImplFederateExporter function

/* ******************************************************************* */

    return JavaImplFederateExporter;
 }); // end define
