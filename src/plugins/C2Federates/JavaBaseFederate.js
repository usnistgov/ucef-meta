/* 

JavaBaseFederate.js is used in the define of:
 JavaFederate.js

*/

define
([
  'common/util/ejs',
  'C2Core/MavenPOM',
  'C2Federates/Templates/Templates',
  'C2Federates/JavaRTI'],
 function (ejs,
           MavenPOM,
           TEMPLATES,
           JavaRTI)
 {

    'use strict';

    var JavaBaseFederateExporter;
    
    JavaBaseFederateExporter = function()
    {
      var self = this;
      var baseDirBasePath;
      var baseOutFilePath;
      var baseDirSpec;

      JavaRTI.call(this);
      this.federateTypes = this.federateTypes || {};

/***********************************************************************/

      this.federateTypes.JavaFederate =
        {includeInExport: false,
         longName: 'JavaBaseFederate',
         init: function()
         {
           var baseDirPath;
           var fullPath;
           var xmlCode;

           self.initJavaRTI();
           if (self.javaFedInitDone)
             {
               return;
             }
           baseDirBasePath = self.projectName + '-java-federates/';
           baseDirSpec = {federation_name: self.projectName,
                          artifact_name: "base", language:"java"};
           baseDirPath =  baseDirBasePath +
                          ejs.render(self.directoryNameTemplate, baseDirSpec);
           baseOutFilePath = baseDirPath + MavenPOM.mavenJavaPath; 
           if (!self.java_federateBasePOM)
             {
               self.java_federateBasePOM = new MavenPOM();
               self.java_federateBasePOM.groupId = 'org.cpswt';
               self.java_federateBasePOM.artifactId = 'federate-base';
               self.java_federateBasePOM.version = self.cpswt_version;   
             }
           self.javaFedInitDone = true;
         }
        };

/***********************************************************************/

      this.visit_JavaBaseFederate = function(node, parent, context)
      {
        var self = this,
        nodeType = self.core.getAttribute(self.getMetaType(node), 'name');
        
        self.logger.info('Visiting a JavaBaseFederate');
        
        //Set up project POM files on visiting the first Java Federate
 
        if (!self.java_basePOM)
          {
            self.java_basePOM = new MavenPOM(self.javaPOM);
            self.java_basePOM.artifactId =
              ejs.render(self.directoryNameTemplate, baseDirSpec);
            self.java_basePOM.version = self.project_version;
            self.java_basePOM.packaging = "jar";
            self.java_basePOM.dependencies.push(self.java_rtiPOM);
            self.java_basePOM.dependencies.push(self.java_federateBasePOM);
          }

        context.javafedspec = self.createJavaFederateCodeModel();
        context.javafedspec.classname =
          self.core.getAttribute(node, 'name');
        context.javafedspec.simname = self.projectName;
        context.javafedspec.timeconstrained =
          self.core.getAttribute(node, 'TimeConstrained');
        context.javafedspec.timeregulating =
          self.core.getAttribute(node, 'TimeRegulating');
        context.javafedspec.lookahead =
          self.core.getAttribute(node, 'Lookahead');
        context.javafedspec.asynchronousdelivery =
          self.core.getAttribute(node, 'EnableROAsynchronousDelivery');
        self.federates[self.core.getPath(node)] = context.javafedspec;
        
        return {context:context};
      };

/***********************************************************************/

/* post_visit_JavaBaseFederate

The name of this function is misleading. All this does is add a file
name property (outFileName) to context.javafedspec.
 
Note: baseDirBasePath has / at the end

*/
      this.post_visit_JavaBaseFederate = function(
       node,     // a federate node
       context)  // 
      {
        var self;
        var outFileName;
        var federateName;
        var groupId;
        
        self = this;
        groupId = self.getCurrentConfig().groupId.trim();
        federateName = self.core.getAttribute(node, 'name');
        outFileName = baseDirBasePath + federateName +
                      "/src/main/java/" + groupId.replace(/[.]/g, "/") + "/" +
                      federateName.toLowerCase() + "/" + federateName +
                      "Base.java";
        context.javafedspec.outFileName = outFileName;
        return {context:context};
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
    };

/***********************************************************************/

    return JavaBaseFederateExporter;
 });
