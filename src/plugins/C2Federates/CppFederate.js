define(
  [
    'ejs',
    'C2Core/MavenPOM',
    'C2Federates/Templates/Templates',
    'C2Federates/CppRTI',
    'C2Federates/CppImplFederate'
  ],
  function(
    ejs,
    MavenPOM,
    TEMPLATES,
    CppRTI,
    CppImplFederate
  ) {
    'use strict';

    /***********************************************************************/

    /* CppFederateExporter (function-valued variable of top-level function object)

    Returned Value: none

    Called By: FederatesExporter in FederatesExporter.js

    The top-level function returns this function.

    */

    function CppFederateExporter() {

      var self = this;
      var baseDirSpec;
      var baseOutFilePath;

      CppRTI.call(this);
      CppImplFederate.call(this);

      /***********************************************************************/

      this.federateTypes = this.federateTypes || {};

      this.federateTypes.CppFederate = {
        includeInExport: false,
        longName: 'CppFederate',
        init: function() {
          var baseDirBasePath; // string
          var baseDirPath;     // string

          self.initCppRTI();
          self.initCppImplFederate();

          baseDirBasePath = 'cpp-federates/';
          baseDirSpec = {
            federation_name: self.projectName,
            artifact_name: "base",
            language:"cpp"
          };
          baseDirPath = baseDirBasePath + ejs.render(self.directoryNameTemplate, baseDirSpec);
          baseOutFilePath = baseDirPath;
          if (!self.cpp_federateBasePOM) {
            self.cpp_federateBasePOM = new MavenPOM();
            self.cpp_federateBasePOM.groupId = 'org.cpswt';
            self.cpp_federateBasePOM.artifactId = 'SynchronizedFederate';
            self.cpp_federateBasePOM.version = self.cpswt_version;
            self.cpp_federateBasePOM.packaging = "nar";
          }
        } // closes init function

      }; // closes setting this.federateTypes['CppFederate']

      /***********************************************************************/

      /* visit_CppFederate

      Returned Value: a "{context: context}" object

      Called By: This may be called by functions that call a function whose
                name is made by concatentating 'visit_' with other strings.
                The getVisitorFuncName function in FederatesExporter makes
                function names that way.

      This does not appear to be called unless the node type name is
      CppFederate.  It is defined if CppFederateExporter is called, which
      happens in FederatesExporter.js.

      */

      this.visit_CppFederate = function(node, parent, context) {

        var self;
        var fedspec;

        self = this;

        // Set up project POM files on visiting the first CPP Federate
        // cppPOM is used in CppRTI.js
        if (!self.cppPOM) {
          self.cppPOM = new MavenPOM(self.mainPom);
          self.cppPOM.artifactId = ""; // value changes
          self.cppPOM.version = self.project_version;
          self.cppPOM.packaging = "nar";
        }

        fedspec = self.createCppFederateCodeModel();
        fedspec.classname = self.core.getAttribute(node, 'name');
        fedspec.simname = self.projectName;
        fedspec.timeconstrained = self.core.getAttribute(node, 'TimeConstrained');
        fedspec.timeregulating = self.core.getAttribute(node, 'TimeRegulating');
        fedspec.lookahead = self.core.getAttribute(node, 'Lookahead');
        fedspec.asynchronousdelivery = self.core.getAttribute(node, 'EnableROAsynchronousDelivery');

        context.cppfedspec = fedspec;

        self.visit_CppImplFederate(node, parent, context);
        self.federates[self.core.getPath(node)] = fedspec;

        return {context:context};
      };

      /***********************************************************************/

      /* post_visit_CppFederate

      Returned Value: a context object

      Called By: post_visit_Federate

      This is called in post_visit_Federate (in GenericFederate.js) when the
      nodeType in that function is CppFederate. The name of this function
      in that case is formed by concatenating 'post_visit_' and
      'CppFederate' rather than by using 'post_visit_CppFederate'.

      This adds information to the context itself and by calling
      post_visit_CppImplFederate (in CppImplFederate.js). The call to
      post_visit_CppImplFederate also generates code.

      The cppModel and hppModel contain only those properties that are used
      in cppTemplate and hppTemplate, respectively.

      */

      this.post_visit_CppFederate = function(node, context) {

        var self;
        var federateName;
        var renderContext;

        self = this;
        federateName = self.core.getAttribute(node, 'name');
        renderContext = context.cppfedspec;

        self.fileGenerators.push(

          function(artifact, callback) {
            var fullPath;
            var cppTemplate;
            var hppTemplate;
            var cppCode;
        	  var hppCode;
	          var cppModel;
	          var hppModel;

	          cppModel = {
              asynchronousdelivery: renderContext.asynchronousdelivery,
	            classname: renderContext.classname,
	            publishedinteractiondata: renderContext.publishedinteractiondata,
	            subscribedinteractiondata: renderContext.subscribedinteractiondata,
	            publishedobjectdata: renderContext.publishedobjectdata,
	            subscribedobjectdata: renderContext.subscribedobjectdata,
	            timeconstrained: renderContext.timeconstrained,
	            timeregulating: renderContext.timeregulating
	          };
	
        	  hppModel = {
              allinteractiondata: renderContext.publishedinteractiondata.concat(renderContext.subscribedinteractiondata),
	            allobjectdata: renderContext.publishedobjectdata.concat(renderContext.subscribedobjectdata),
	            classname: renderContext.classname,
	            lookahead: renderContext.lookahead,
	            publishedinteractiondata: renderContext.publishedinteractiondata
	          };
	
            fullPath = federateName + "/src/main/c++/" + federateName + "Base.cpp";
            cppTemplate = TEMPLATES['cpp/federate.cpp.ejs'];
            cppCode = ejs.render(cppTemplate, cppModel);
            self.logger.info("calling addFile for " + fullPath + " in post_visit_CppFederate of CppFederate.js");
            artifact.addFile(
              fullPath,
              cppCode,
              function (err) {
                if (err) {
                  callback(err);
                  return;
                }
              }
            );
	
            fullPath = federateName + "/src/main/include/" + federateName + "Base.hpp";
            hppTemplate = TEMPLATES['cpp/federate.hpp.ejs'];
            hppCode = ejs.render(hppTemplate, hppModel);
            self.logger.info("calling addFile for " + fullPath + " in post_visit_CppFederate of CppFederate.js");
            artifact.addFile(
              fullPath,
              hppCode,
              function (err) {
                if (err) {
                  callback(err);
                  return;
                } else {
                  callback();
                  return;
                }
              }
            );
          }
        );
        return self.post_visit_CppImplFederate(node, context);
      };

      /***********************************************************************/

      this.createCppFederateCodeModel = function() {
        return {
          allinteractiondata: [],
          allobjectdata: [],
          asynchronousdelivery: false,
          classname: "",
          lookahead: null,
          publishedinteractiondata: [],
          publishedobjectdata: [],
          simname: "",
          subscribedinteractiondata: [],
          subscribedobjectdata: [],
          timeconstrained: false,
          timeregulating: false,
          helpers:{}
        };
      };

      /***********************************************************************/

    } // end of setting CppFederateExporter function variable

    /***********************************************************************/

    return CppFederateExporter;
  }
);
