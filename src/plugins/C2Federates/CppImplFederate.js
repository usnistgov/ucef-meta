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
    var CppImplFederateExporter;

/* ******************************************************************* */

/* CppImplFederateExporter */
/** (function-valued variable of top-level function object)<br><br>

Returned Value: none<br><br>

Called By: CppFederateExporter in CppFederate.js<br><br>

This is the C++ implementation federate exporter.<br><br>

The top-level function returns this function.<br><br>

implDirectoryPath is set in initCppImplFederate, but it does not
appear to be used anywhere.<br>

*/

    CppImplFederateExporter = function()
    {
      var self;
      var cppCheckBack;               // function
      var initCppImplFederate;        // function
      var visit_CppImplFederate;      // function
      var post_visit_CppImplFederate; // function

      self = this;

/* ******************************************************************* */

/* cppCheckBack */
/** (function-valued variable of CppImplFederateExporter)<br><br>

Returned Value: none<br><br>

Called By: the five generator functions in post_visit_CppImplFederate<br><br>

If there is an error, this calls the callback with the error message
as an argument; otherwise, this calls the callback with no arguments.<br>

*/

      cppCheckBack = function(               /* ARGUMENTS */
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

/* initCppImplFederate */
/** (function-valued variable of CppImplFederateExporter)<br><br>

Returned Value: none<br><br>

Called By: ?<br><br>

This initializes the cpp_federateImplPOM.

In CppFederateExporter in CppFederate.js, this.federateTypes.CppFederate
is set to an object one of whose properties is init. The value of init is an
anonymous function that includes a call to self.initCppImplFederate.<br>

*/

      initCppImplFederate = function()
      {
        var self;

        self = this;
        if (self.cppImplFederateInitDone)
          {
            return;
          }
        self.cpp_federateImplPOM = new MavenPOM();
        self.cpp_federateImplPOM.groupId = self.mainPom.groupId.trim();
        self.cpp_federateImplPOM.artifactId = self.projectName + "-impl-cpp";
        self.cpp_federateImplPOM.version = self.project_version;
        self.cpp_federateImplPOM.packaging = "nar";
        self.cpp_federateImplPOM.addNarPlugin("executable");
        self.cppImplFederateInitDone = true;
      }; // end initCppImplFederate

/* ******************************************************************* */

      this.initCppImplFederate = initCppImplFederate;

/* ******************************************************************* */

/* visit_CppImplFederate */
/** (function-valued variable of CppImplFederateExporter)<br><br>

Returned Value: a "{context: context}" object<br><br>

Called By: visit_CppFederate (in CppFederate.js)<br><br>

This just embeds the context argument in an object by itself as the
value of the "context" property.<br>

*/

      visit_CppImplFederate = function(              /* ARGUMENTS */
       /** a C++ federate node                       */ node,
       /** the parent of the node                    */ parent,
       /** a data object from which to generate code */ context)
      {
         return {context:context};
      };
      this.visit_CppImplFederate = visit_CppImplFederate;

/* ******************************************************************* */

/* post_visit_CppImplFederate */
/** (function-valued variable of CppImplFederateExporter)<br><br>

Returned Value: an object with a context property whose value is the
context argument<br><br>

Called By: post_visit_CppFederate (in CppFederate.js)<br><br>

This modifies context.cppfedspec and builds five file generators.<br>
 - federate pom generator<br>
 - federate C++ header file generator<br>
 - federate C++ code file generator<br>
 - federate build file generator<br>
 - federate version cpp file generator<br>

*/
      post_visit_CppImplFederate = function(         /* ARGUMENTS */
       /** a C++ federate node                       */ node,
       /** a data object from which to generate code */ context)
      {
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
        implPOM.artifactId = renderContext.simname + "-" +
                             renderContext.classname + "-cpp";
        implPOM.version = self.cpp_federateImplPOM.version;
        implPOM.packaging = "nar";
        implPOM.directory = renderContext.classname;
        fedPathDir = self.core.getAttribute(node, 'name');
        outFileNameStart = fedPathDir + "/src/main/";
        // set the SOM.xml output directory
        feder = self.federateInfos[self.core.getPath(node)];
        if (feder)
          {
            feder.directory = fedPathDir + "/conf/";
          }

/* ******************************************************************* */

// Add federate POM generator
        self.fileGenerators.push(function(artifact, callback)
        {
          var xmlPOM;
          var fullPath;
          var template;
          var groupIdName;
          var cppPOM;

          groupIdName = self.mainPom.groupId + "." + fedPathDir.toLowerCase();
          cppPOM = {groupId: groupIdName,
                    artifactId: fedPathDir,
                    version: self.mainPom.version,
                    packaging: "nar"}
          template = TEMPLATES['cpp/cppfedbase_pom.xml.ejs'];
          xmlPOM = ejs.render(template, cppPOM);
          fullPath = fedPathDir + "/pom.xml";
          self.logger.info("calling addFile for " + fullPath + " in " +
                           "post_visit_CppImplFederate of CppImplFederate.js");
          artifact.addFile(fullPath, xmlPOM,
                           function(err) {cppCheckBack(err, callback);});
        });

/* ******************************************************************* */

// Add federate header file generator
// For the SOMGenerationWithCpp project, this is writing the file
// CppFederate1/src/main/include/CppFederate1.hpp
        self.fileGenerators.push(function(artifact, callback)
        {
          var hppCode;
          var fullPath;
          var template;
          var model;

          model = {classname: renderContext.classname,
                   interaction_data: renderContext.interaction_data,
                   object_data: renderContext.object_data,
                   publishedinteractiondata:
                     renderContext.publishedinteractiondata,
                   publishedobjectdata: renderContext.publishedobjectdata,
                   subscribedinteractiondata:
                     renderContext.subscribedinteractiondata,
                   subscribedobjectdata: renderContext.subscribedobjectdata};
          template = TEMPLATES['cpp/federateimpl.hpp.ejs'];
          hppCode = ejs.render(template, model);
          fullPath = outFileNameStart + "include/" + fedPathDir + ".hpp";
          self.logger.info("calling addFile for " + fullPath + " in " +
                           "post_visit_CppImplFederate of CppImplFederate.js");
          artifact.addFile(fullPath, hppCode,
                           function(err) {cppCheckBack(err, callback);});
        });

/* ******************************************************************* */

// Add federate cpp file generator
// For the SOMGenerationWithCpp project, this is writing the file
// CppFederate1/src/main/c++/CppFederate1.cpp

        self.fileGenerators.push(function(artifact, callback)
        {
          var cppCode;
          var fullPath;
          var template;
          var model;

          model = {classname: renderContext.classname,
                   publishedinteractiondata:
                     renderContext.publishedinteractiondata,
                   publishedobjectdata:
                     renderContext.publishedobjectdata,
                   subscribedinteractiondata:
                     renderContext.subscribedinteractiondata,
                   subscribedobjectdata: renderContext.subscribedobjectdata};
          template = TEMPLATES['cpp/federateimpl.cpp.ejs'];
          cppCode = ejs.render(template, model);
          fullPath = outFileNameStart + "c++/" + fedPathDir + ".cpp";
          self.logger.info("calling addFile for " + fullPath + " in " +
                           "post_visit_CppImplFederate of CppImplFederate.js");
          artifact.addFile(fullPath, cppCode,
                           function(err) {cppCheckBack(err, callback);});
        });

/* ******************************************************************* */

// Add federate build file generator
        self.fileGenerators.push(function(artifact, callback)
        {
          var scriptCode;
          var fullPath;
          var template;

          template = TEMPLATES['cpp/mvn-package-install.sh.ejs'];
          scriptCode = ejs.render(template, {});
          fullPath = fedPathDir + '/build.sh';
          self.logger.info("calling addFile for " + fullPath + " in " +
                           "post_visit_CppImplFederate of CppImplFederate.js");
          artifact.addFile(fullPath, scriptCode,
                           function(err) {cppCheckBack(err, callback);});
        });

/* ******************************************************************* */

// Add federate version cpp file generator

        self.fileGenerators.push(function(artifact, callback)
        {
          var cppCode;
          var fullPath;
          var template;
          var cppPOM;

          cppPOM = {simname: self.projectName,
                    version: self.project_version};
          template = TEMPLATES['cpp/federate_ver.cpp.ejs'];
          cppCode = ejs.render(template, cppPOM);
          fullPath = fedPathDir + "/src/main/c++/federate_version.cpp";
          self.logger.info("calling addFile for " + fullPath + " in " +
                           "post_visit_CppImplFederate of CppImplFederate.js");
          artifact.addFile(fullPath, cppCode,
                           function(err) {cppCheckBack(err, callback);});
        });

/* ******************************************************************* */

        return {context:context};
      }; // end post_visit_CppImplFederate

/* ******************************************************************* */

      this.post_visit_CppImplFederate = post_visit_CppImplFederate;

    }; // end CppImplFederateExporter

/* ******************************************************************* */

    return CppImplFederateExporter;
}); // end define
