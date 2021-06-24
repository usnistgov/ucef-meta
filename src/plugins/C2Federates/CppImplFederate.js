define(
  [
    'ejs',
    'C2Core/MavenPOM',
    'C2Federates/Templates/Templates'
  ],
  function(
    ejs,
    MavenPOM,
    TEMPLATES
  ) {
    'use strict';

    /***********************************************************************/

    /* CppImplFederateExporter (function-valued variable of top-level function obj)

    Returned Value: none

    Called By: CppFederateExporter in CppFederate.js

    The top-level function returns this function.

    */

    function CppImplFederateExporter() {

      var self;
      var implDirectoryPath;
      var checkBack;

      self = this;

      /***********************************************************************/

      checkBack = function(err, callBack) {

        if (err) {
          callBack(err);
          return;
        } else {
          callBack();
        }

      };

      /***********************************************************************/

      /* initCppImplFederate

      Returned Value: none

      Called By: ?

      In CppFederateExporter in CppFederate.js, this.federateTypes.CppFederate
      is set to an object one whose properties is init. The value of init is an
      anonymous function that includes a call to self.initCppImplFederate.

      */

      this.initCppImplFederate = function() {

        var self;
        var baseDirectoryPath;
        var implDirectorySpec;

        self = this;

        if (self.cppImplFederateInitDone) {
          return;
        }

        baseDirectoryPath = 'cpp-federates/';

        implDirectorySpec = {
          federation_name: self.projectName,
          artifact_name: "impl",
          language: "cpp"
        };

        implDirectoryPath = baseDirectoryPath + ejs.render(self.directoryNameTemplate, implDirectorySpec);

        self.cpp_federateImplPOM = new MavenPOM();
        self.cpp_federateImplPOM.groupId = self.mainPom.groupId.trim();
        self.cpp_federateImplPOM.artifactId = self.projectName + "-impl-cpp";
        self.cpp_federateImplPOM.version = self.project_version;
        self.cpp_federateImplPOM.packaging = "nar";
        self.cpp_federateImplPOM.addNarPlugin("executable");

        self.cppImplFederateInitDone = true;
      }; // end initCppImplFederate

      /***********************************************************************/

      /* visit_CppImplFederate

      Returned Value: a "{context: context}" object

      Called By: visit_CppFederate (in CppFederate.js)

      */

      this.visit_CppImplFederate = function(node, parent, context) {

        var outFileName;

        return {
          context: context
        };

      };

      /***********************************************************************/

      /* post_visit_CppImplFederate

      Returned Value: an object with a context property whose value is the
      context argument.

      Called By: post_visit_CppFederate (in CppFederate.js)

      This modifies context.cppfedspec and builds three file generators.

      */

      this.post_visit_CppImplFederate = function(node, context) {

        var self;
        var renderContext;
        var implPOM;
        var fedPathDir;
        var outFileNameStart;
        var feder;
        var groupPath;

        self = this;

        groupPath = self.getCurrentConfig().groupId.trim().replace(/[.]/g, "/");

        renderContext = context.cppfedspec;

        implPOM = new MavenPOM(self.cpp_federateImplPOM);
        implPOM.groupId = self.cpp_federateImplPOM.groupId;
        implPOM.artifactId = renderContext.simname + "-" + renderContext.classname + "-cpp";
        implPOM.version = self.cpp_federateImplPOM.version;
        implPOM.packaging = "nar";
        implPOM.directory = renderContext.classname;

        fedPathDir = self.core.getAttribute(node, 'name');

        outFileNameStart = fedPathDir + "/src/main/";

        // set the SOM.xml output directory
        feder = self.federateInfos[self.core.getPath(node)];
        if (feder) {
          feder.directory = fedPathDir + "/conf/";
        }

        /***********************************************************************/

        // Add federate POM generator
        self.fileGenerators.push(
          function(artifact, callback) {

            var xmlPOM;
            var fullPath;
            var template;
            var groupIdName;
            var cppPOM;

            groupIdName = self.mainPom.groupId + "." + fedPathDir.toLowerCase();

            cppPOM = {
              groupId: groupIdName,
              artifactId: fedPathDir,
              version: self.mainPom.version,
              packaging: "nar"
            }

            template = TEMPLATES['cpp/cppfedbase_pom.xml.ejs'];

            xmlPOM = ejs.render(template, cppPOM);

            fullPath = fedPathDir + "/pom.xml";

            self.logger.info("calling addFile for " + fullPath + " in " + "post_visit_CppImplFederate of CppImplFederate.js");

            artifact.addFile(
              fullPath,
              xmlPOM,
              function(err) {

                checkBack(err, callback);
              }
            );

          }
        );

        /***********************************************************************/

        // Add federate header file generator
        // For the SOMGenerationWithCpp project, this is writing the file
        // CppFederate1/src/main/include/CppFederate1.hpp
        self.fileGenerators.push(
          function(artifact, callback) {

            var hppCode;
            var fullPath;
            var template;
            var model;

            model = {
              classname: renderContext.classname,
              interaction_data: renderContext.interaction_data,
              object_data: renderContext.object_data,
              publishedinteractiondata: renderContext.publishedinteractiondata,
              publishedobjectdata: renderContext.publishedobjectdata,
              subscribedinteractiondata: renderContext.subscribedinteractiondata,
              subscribedobjectdata: renderContext.subscribedobjectdata
            };

            template = TEMPLATES['cpp/federateimpl.hpp.ejs'];

            hppCode = ejs.render(template, model);

            fullPath = outFileNameStart + "include/" + fedPathDir + ".hpp";

            self.logger.info("calling addFile for " + fullPath + " in post_visit_CppImplFederate of CppImplFederate.js");

            artifact.addFile(
              fullPath,
              hppCode,
              function(err) {

                checkBack(err, callback);

              }
            );

          }
        );

        /***********************************************************************/

        // Add federate cpp file generator
        // For the SOMGenerationWithCpp project, this is writing the file
        // CppFederate1/src/main/c++/CppFederate1.cpp

        self.fileGenerators.push(
          function(artifact, callback) {

            var cppCode;
            var fullPath;
            var template;
        	  var model;

	          model = {
              classname: renderContext.classname,
		          publishedinteractiondata: renderContext.publishedinteractiondata,
		          publishedobjectdata: renderContext.publishedobjectdata,
		          subscribedinteractiondata: renderContext.subscribedinteractiondata,
		          subscribedobjectdata: renderContext.subscribedobjectdata
            };

            template = TEMPLATES['cpp/federateimpl.cpp.ejs'];

            cppCode = ejs.render(template, model);

            fullPath = outFileNameStart + "c++/" + fedPathDir + ".cpp";

            self.logger.info("calling addFile for " + fullPath + " in post_visit_CppImplFederate of CppImplFederate.js");

            artifact.addFile(
              fullPath,
              cppCode,
              function(err) {
                checkBack(err, callback);
              }
            );

          }
        );

        /***********************************************************************/

        // Add federate build file generator
        self.fileGenerators.push(
          function(artifact, callback) {

            var scriptCode;
            var fullPath;
            var template;

            template = TEMPLATES['cpp/mvn-package-install.sh.ejs'];

            scriptCode = ejs.render(template, {});

            fullPath = fedPathDir + '/build.sh';

            self.logger.info("calling addFile for " + fullPath + " in " + "post_visit_CppImplFederate of CppImplFederate.js");

            artifact.addFile(
              fullPath,
              scriptCode,
              function(err) {

                checkBack(err, callback);

              }
            );

          }
        );

/***********************************************************************/

// Add federate version cpp file

        self.fileGenerators.push(
          function(artifact, callback) {
            var cppCode;
            var fullPath;
            var template;
            var cppPOM;

            cppPOM = {
              simname: self.projectName,
              version: self.project_version
            };

            template = TEMPLATES['cpp/federate_ver.cpp.ejs'];

            cppCode = ejs.render(template, cppPOM);

            fullPath = fedPathDir + "/src/main/c++/federate_version.cpp";

            self.logger.info("calling addFile for " + fullPath + " in " + "post_visit_CppImplFederate of CppImplFederate.js");

            artifact.addFile(
              fullPath,
              cppCode,
              function(err) {

                checkBack(err, callback);

              }
            );

          }
        );


/***********************************************************************/

        return {
          context:
          context
        };

      }; // end of post_visit_CppImplFederate function

    } // end of CppImplFederateExporter function

/***********************************************************************/

    return CppImplFederateExporter;

  }
); // end define

