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
    
/***********************************************************************/

/* JavaFederateExporter (function-valued variable of top-level function object)

Returned Value: none

Called By: FederatesExporter in FederatesExporter.js

The top-level function returns this function.

*/
    
    JavaFederateExporter = function()
    {
      var self = this;
      var finalContext;

      JavaRTI.call(this);
      this.federateTypes = this.federateTypes || {};

/***********************************************************************/

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

/***********************************************************************/

      JavaImplFederate.call(this);
      finalContext = {};
       
/***********************************************************************/

/* visit_JavaFederate

Returned Value: a "{context: context}" object returned by
                visit_JavaImplFederate

Called By: visit_MapperFederate in MapperFederate.js 
           This may also be called by functions that call a function whose
           name is made by concatentating 'visit_' with other strings.
           The getVisitorFuncName function in FederatesExporter makes
           function names that way.

This does not appear to be called unless the node type name is JavaFederate.
In visit_MapperFederate it is called only if it is defined. It is defined
if JavaFederateExporter is called, which happens in FederatesExporter.js.

*/

      this.visit_JavaFederate = function(node, parent, context)
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

        fedspec = self.createJavaFederateCodeModel();
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

/***********************************************************************/

/* post_visit_JavaFederate

Returned Value: a context object

Called By: post_visit_Federate

This is called in post_visit_Federate (in GenericFederate.js) when the
nodeType in that function is JavaFederate. The name of this function
in that case is formed by concatenating 'post_visit_' and
'JavaFederate' rather than by using 'post_visit_JavaFederate'.

This adds information to the context by calling
post_visit_JavaBaseFederate (in JavaBaseFederate.js) and
post_visit_JavaImplFederate (in JavaImplFederate.js). The call to
post_visit_JavaImplFederate also generates code for 6 files.

*/
      
      this.post_visit_JavaFederate = function(node, context)
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

/***********************************************************************/

      this.createJavaFederateCodeModel = function()
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

/***********************************************************************/

      this.javaCodeModel = this.createJavaFederateCodeModel();

/***********************************************************************/

    }; // end of setting JavaFederateExporter function variable
    
/***********************************************************************/

    return JavaFederateExporter;
 });
