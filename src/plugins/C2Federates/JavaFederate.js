define
([
  'ejs',
  'C2Core/MavenPOM',
  'C2Federates/Templates/Templates',
  'C2Federates/JavaRTI',
  'C2Federates/JavaImplFederate'],
 function (ejs,
           MavenPOM,
           TEMPLATES,
           JavaRTI,
           JavaImplFederate)
 {
    'use strict';
    var JavaFederateExporter; // function variable

/* ******************************************************************* */

/* JavaFederateExporter */
/** (function-valued variable of top-level function object)<br><br>

Returned Value: none<br><br>

Called By: FederatesExporter in FederatesExporter.js<br><br>

This is the primary function for a Java federate.<br><br>

The top-level function returns this function.<br>

*/

    JavaFederateExporter = function()
    {
      var self = this;
      var finalContext;
      var createJavaFederateCodeModel; // function
      var visit_JavaFederate;          // function
      var post_visit_JavaFederate;     // function

      JavaRTI.call(this);
      this.federateTypes = this.federateTypes || {};

/* ******************************************************************* */

      this.federateTypes.JavaFederate =
        {includeInExport: false,
         longName: 'JavaFederate',
         init: function()
         {
           var fullPath;
           var xmlCode;

           self.initJavaRTI();
           if (self.javaFedInitDone)
             {
               return;
             }
           self.javaFedInitDone = true;
         }
        };

/* ******************************************************************* */

      JavaImplFederate.call(this);
      finalContext = {};

/* ******************************************************************* */

/* visit_JavaFederate */
/** (function-valued variable of JavaFederateExporter)<br><br>

Returned Value: a "{context: context}" object returned by
                visit_JavaImplFederate<br><br>

Called By:<br>
  visit_MapperFederate in MapperFederate.js<br>
  atModelNode in ModelTraverserMixin.js<br><br>

This is the visitor function for a Java federate.<br>

*/

      visit_JavaFederate = function(            /* ARGUMENTS */
       /** node to be processed                */ node,
       /** parent of node                      */ parent,
       /** context object that may be modified */ context)
      {
        var self;
        var fedspec;

        self = this;

        //Set up project POM files on visiting the first Java Federate
        if (!self.javaPOM)
          {
            self.javaPOM = new MavenPOM(self.mainPom);
            self.javaPOM.artifactId = self.projectName + "-java-federates";
            self.javaPOM.directory = self.projectName + "-java-federates";
            self.javaPOM.version = self.project_version;
            self.javaPOM.addMavenCompiler(self.getCurrentConfig().
                                          mavenCompilerPluginJavaVersion);
            self.javaPOM.packaging = "pom";
            self.javaPOM.dependencies.push(self.porticoPOM);
          }
        if (!self.porticoPOM)
          {  
            self.porticoPOM = new MavenPOM();
            self.porticoPOM.artifactId = "portico";
            self.porticoPOM.groupId = "org.porticoproject";
            // Set the portico Release Version
            self.porticoPOM.version =
              self.getCurrentConfig().porticoReleaseNum;
            self.porticoPOM.scope = "provided";
          }

        fedspec = createJavaFederateCodeModel();
        context.javafedspec = fedspec;
        fedspec.classname = self.core.getAttribute(node, 'name');
        fedspec.simname = self.projectName;
        fedspec.timeconstrained =
          self.core.getAttribute(node, 'TimeConstrained');
        fedspec.timeregulating =
          self.core.getAttribute(node, 'TimeRegulating');
        fedspec.lookahead = self.core.getAttribute(node, 'Lookahead');
        fedspec.asynchronousdelivery =
          self.core.getAttribute(node, 'EnableROAsynchronousDelivery');
        self.federates[self.core.getPath(node)] = fedspec;

        return this.visit_JavaImplFederate(node, parent, context);
      };
      this.visit_JavaFederate = visit_JavaFederate;

/* ******************************************************************* */

/* post_visit_JavaFederate */
/** (function-valued variable of JavaFederateExporter)<br><br>

Returned Value: a context object<br><br>

Called By: doneModelNode in ModelTraverserMixin.js<br><br>

This is the post visitor function for a Java federate node.<br><br>

This is called in doneModelNode in ModelTraverserMixin.js when the
nodeMetaTypeName in that function is JavaFederate.<br><br>

This adds information to the context by calling
post_visit_JavaImplFederate (in JavaImplFederate.js). The call to
post_visit_JavaImplFederate also generates code for 6 files.<br>

*/

      post_visit_JavaFederate = function(             /* ARGUMENTS */
       /** a java federate node                      */ node,
       /** a data object from which to generate code */ context)
      {
        var outFileName;
        var federateName;
        var groupId;

        groupId = self.getCurrentConfig().groupId.trim();
        federateName = self.core.getAttribute(node, 'name');
        outFileName = federateName +
                      "/src/main/java/" + groupId.replace(/[.]/g, "/") + "/" +
                      federateName.toLowerCase() + "/" + federateName +
                      "Base.java";
        context.javafedspec.outFileName = outFileName;
        finalContext = this.post_visit_JavaImplFederate(node, context);
        return finalContext;
      };
      this.post_visit_JavaFederate = post_visit_JavaFederate;

/* ******************************************************************* */

/* createJavaFederateCodeModel */
/** (function-valued variable of JavaFederateExporter)<br><br>

Returned Value: an object with dummy values<br><br>

Called By: visit_JavaFederate<br><br>

This creates the initial version of the fedspec in the context model.<br>

*/
      createJavaFederateCodeModel = function()
      {
         return {simname: "",
                melderpackagename: null,
                classname: "",
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
                helpers:{},
                ejs:ejs,
                TEMPLATES:TEMPLATES};
      };

/* ******************************************************************* */

    }; // end JavaFederateExporter

/* ******************************************************************* */

    return JavaFederateExporter;
 });
