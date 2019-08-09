define
([
  'common/util/ejs',
  'C2Core/MavenPOM',
  'C2Federates/Templates/Templates',
  'C2Federates/JavaBaseFederate',
  'C2Federates/JavaImplFederate'],
 function (ejs,
           MavenPOM,
           TEMPLATES,
           JavaBaseFederate,
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
      var finalContext;
      JavaBaseFederate.call(this);
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
        var nodeType; // set here but not used here, may be useless
  
        self = this;
        nodeType = self.core.getAttribute(self.getMetaType(node), 'name');
        self.logger.info('Visiting the JavaFederates');
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

        this.visit_JavaBaseFederate(node, parent, context);
        return this.visit_JavaImplFederate(node, parent, context);
      };

/***********************************************************************/

      this.post_visit_JavaFederate = function(node, context)
      {
        this.post_visit_JavaBaseFederate(node, context);
        finalContext = this.post_visit_JavaImplFederate(node, context);
        return finalContext;
      };

/***********************************************************************/

    }; // end of setting JavaFederateExporter function variable
    
/***********************************************************************/

    return JavaFederateExporter;
 });
