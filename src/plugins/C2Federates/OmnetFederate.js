define
([
  'ejs',
  'C2Core/MavenPOM',
  'C2Federates/Templates/Templates',
  'C2Federates/CppRTI'],
 function (ejs,
           MavenPOM,
           TEMPLATES,
           CppRTI)
 {
    'use strict';
    var OmnetFederateExporter; // function variable

/***********************************************************************/

/* OmnetFederateExporter (function-valued variable of top-level function object)

Returned Value: none

Called By: FederatesExporter in FederatesExporter.js

The top-level function returns this function.

*/
    
    OmnetFederateExporter = function()
    {
      var self = this;
      var omnetOutFilePath;
      var omnetDirSpec;
       
      CppRTI.call(this);

      this.federateTypes = this.federateTypes || {};

/***********************************************************************/

      this.federateTypes['OmnetFederate'] =
        {
          includeInExport: false,
          longName: 'OmnetFederate',
          init: function()
          {
            var omnetDirBasePath;
            var omnetDirPath;
            var fullPath;
            
            self.initCppRTI();
            omnetDirBasePath = 'cpp-federates/';
            omnetDirSpec = {federation_name: self.projectName,
                            artifact_name: "omnet", language:"cpp"};
            omnetDirPath = omnetDirBasePath +
                          ejs.render(self.directoryNameTemplate, omnetDirSpec);
            omnetOutFilePath = omnetDirPath;
            self.omnet_federateBasePOM = new MavenPOM();
            self.omnet_federateBasePOM.groupId = 'org.cpswt'
            self.omnet_federateBasePOM.artifactId = 'OmnetFederate';
            self.omnet_federateBasePOM.version = self.cpswt_version;   
            self.omnet_federateBasePOM.packaging = "nar";
            if (!self.cpp_federateBasePOM)
              {
                self.cpp_federateBasePOM = new MavenPOM();
                self.cpp_federateBasePOM.groupId = 'org.cpswt';
                  self.cpp_federateBasePOM.artifactId = 'SynchronizedFederate';
                self.cpp_federateBasePOM.version = self.cpswt_version;   
                self.cpp_federateBasePOM.packaging = "nar";
              }
            self.omnet_basePOM = null; //will be set by model visitor
            //Add base POM generator
            self.fileGenerators.push(function(artifact, callback)
            {
              if (!self.omnet_basePOM)
                {
                  callback();
                  return;
                }
              fullPath = omnetDirPath + '/pom.xml';
              self.logger.info('calling addFile for ' + fullPath + ' in ' +
                               'OmnetFederateExporter of OmnetFederate.js');
              artifact.addFile(fullPath,
                               self._jsonToXml.
                                 convertToString(self.omnet_basePOM.toJSON()),
                               function(err)
                               {if (err) {callback(err); return;}
                                else {callback(); return;}}
                              );
            });
            
          } // end of init function
        }; // end of federateTypes['OmnetFederate']

/***********************************************************************/

      this.visit_OmnetFederate = function(node, parent, context)
      {
        var self = this;
        var nodeType = self.core.getAttribute(self.getMetaType(node), 'name');

        //Set up project POM files on visiting the first Mapper Federate
        if (!self.cppPOM)
          {
            self.cppPOM = new MavenPOM(self.mainPom);
            self.cppPOM.artifactId = self.projectName + "-cpp";
            self.cppPOM.directory = "cpp-federates";
            self.cppPOM.version = self.project_version;
            self.cppPOM.packaging = "pom";
            self.cppPOM.name = self.projectName + ' C++ root';
          }
        if (!self.omnet_basePOM)
          {
            self.omnet_basePOM = new MavenPOM(self.cppPOM);
            self.omnet_basePOM.artifactId =
              ejs.render(self.directoryNameTemplate, omnetDirSpec);
            self.omnet_basePOM.version = self.project_version;
            self.omnet_basePOM.packaging = "nar";
            self.omnet_basePOM.dependencies.push(self.cpp_rtiPOM);
            self.omnet_basePOM.dependencies.push(self.omnet_federateBasePOM);
            self.omnet_basePOM.dependencies.push(self.cpp_federateBasePOM);
          }  
        context['omnetfedspec'] = self.createOmnetFederateCodeModel();
        context['omnetfedspec']['classname'] =
          self.core.getAttribute(node, 'name');
        context['omnetfedspec']['simname'] = self.projectName;
        context['omnetfedspec']['projectname'] = self.projectName;
        context['omnetfedspec']['timeconstrained'] =
          self.core.getAttribute(node, 'TimeConstrained');
        context['omnetfedspec']['timeregulating'] =
          self.core.getAttribute(node, 'TimeRegulating');
        context['omnetfedspec']['lookahead'] =
          self.core.getAttribute(node, 'Lookahead');
        context['omnetfedspec']['asynchronousdelivery'] =
          self.core.getAttribute(node, 'EnableROAsynchronousDelivery');
        self.federates[self.core.getPath(node)] = context['omnetfedspec'];
        return {context:context};
      }; // end of visit_OmnetFederate

/***********************************************************************/

      this.post_visit_OmnetFederate = function(node, context)
      {
        var self = this;
        var renderContext = context['omnetfedspec'];
        //var fileName = self.core.getAttribute(node, 'name') + "FilterInit";
        //TODO: Enable multiple Filter per project
        var fileName = self.projectName + "FilterInit";
        var outFileName = omnetOutFilePath + MavenPOM.mavenCppPath +
                          "/" + fileName + ".cpp";

        self.fileGenerators.push(function(artifact, callback)
        {
          var cppModel;
            
          if (self.omnet_filterGenerated)
            {
              callback();
              return;
            }
          renderContext['allobjectdata'] =
            renderContext['publishedobjectdata'].
              concat(renderContext['subscribedobjectdata']);
          renderContext['allinteractiondata'] =
            renderContext['publishedinteractiondata'].
            concat(renderContext['subscribedinteractiondata']);
          self.logger.info('calling addFile for ' + outFileName + ' in ' +
                           'post_visit_OmnetFederate of OmnetFederate.js');
          cppModel = {projectname: renderContext.projectname,
                      subscribedinteractiondata:
                      renderContext.subscribedinteractiondata};
          artifact.addFile(outFileName,
                           ejs.render(TEMPLATES['cpp/omnetfilter.cpp.ejs'],
                                      cppModel),
                           function(err)
                           {
                             if (err)
                               {
                                 callback(err);
                                 return;
                               }
                             else
                               {
                                 outFileName = omnetOutFilePath +
                                   MavenPOM.mavenIncludePath + "/" +
                                   fileName + ".h";
                                 self.logger.info('calling addFile for ' +
                                            outFileName + ' in ' +
                                            'post_visit_OmnetFederate of ' +
                                            'OmnetFederate.js');
                                 artifact.addFile(outFileName,
                                                  ejs.render(TEMPLATES['cpp/omnetfilter.hpp.ejs'],
                                                             {projectname: renderContext.projectname}),
                                                  function(err)
                                                  {
                                                    if(err)
                                                      {
                                                        callback(err);
                                                        return;
                                                      }
                                                    else
                                                      {
                                                        self.omnet_filterGenerated = true;
                                                        callback();
                                                        return;
                                                      }
                                                  });
                                 return;
                               }
                           });
        });
                    
        return {context:context};
      }; // end of post_visit_OmnetFederate

/***********************************************************************/

      this.createOmnetFederateCodeModel = function()
      {
        return {simname: "",
                projectname: "",
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
                TEMPLATES:TEMPLATES
               };
      }
/***********************************************************************/

    } // end of OmnetFederateExporter function

/***********************************************************************/

    return OmnetFederateExporter;
});
