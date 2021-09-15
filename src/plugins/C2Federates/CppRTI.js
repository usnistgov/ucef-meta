/**

CppRTI.js is used in the define of:
  C2Federates/CppFederate.js.
  C2Federates/OmnetFederate.js.

*/

define
([
  'ejs',
  'C2Core/MavenPOM',
  'C2Federates/Templates/Templates'],
 function (ejs,
           MavenPOM,
           TEMPLATES)
 {
    'use strict';
    var CppRTIFederateExporter;       // function variable
    var cppObjectTraverserCheck;      // function variable

/* ******************************************************************* */

/* cppObjectTraverserCheck */
/** (function-valued variable of top-level function object)<br><br>

Returned Value: none<br><br>

Called By:<br>
  cppRenderToFile (object is objectRoot)<br>
  cppObjectTraverserCheck (recursively)<br><br>

This adds entries to the pubSubObjects of a federate for all ancestors
of objects that already have entries.<br><br>

In this documentation, "object" means object in the WebGME sense, not
object in the JavaScript sense.<br><br>

For each object, object.basePath is the id of the parent of the object.<br><br>

First, this calls itself recursively on the children of the
object. Since this is transmitting information from children to
parents, the children have to be processed first. By calling itself
recursively, this goes through the object tree (from top down) but
builds the pubSubObjects of the federate from bottom up.<br><br>

Then, if the object is not objectRoot and the object.id is in the
pubSubObjects of the given federate, the object is selected for
further processing.<br><br>

For each selected object:<br><br>

A. If the parent publishes or subscribes to the federate, an entry in
federate.pubSubObjects for the parent will have been made previously
in PubSubVisitors, and in that case:<br><br>

A1. If the object's mayPublish of its entry is not zero, the parent's
mayPublish of its entry is set to 1, and<br>
A2. If the object's maySubscribe of its entry is not zero, the parent's
maySubscribe of its entry is set to 1.<br><br>

B. Otherwise, a new entry in the federate.pubSubObjects is created for the
parent in which the parent's publish and subscribe are set to 0 and the
parent's mayPublish and maySubscribe are set to the object's values.<br><br>

The final effect is that any object that is an ancestor of any object
originally put on the federate.pubSubObjects in PubSubVisitors is also
on federate.pubSubObjects, with its publish, subscribe, mayPublish, and
maySubscribe values set appropriately.<br><br>

This function is identical to objectTraverserCheck in
FederatesExporter.js.<br>

*/

    cppObjectTraverserCheck = function(              /* ARGUMENTS */
     /** (object) data in FederateInfos for federate */ federate, 
     /** (object) object to process                  */ object)
    {
      var objectPubSub;
      var parentPubSub;

      object.children.forEach(function(child)
      {
        cppObjectTraverserCheck(federate, child);
      });
      if (object.name != 'ObjectRoot' &&
          (object.id in federate.pubSubObjects))
        {
          objectPubSub = federate.pubSubObjects[object.id];
          if (object.basePath in federate.pubSubObjects)
            {
              parentPubSub = federate.pubSubObjects[object.basePath];
              if (objectPubSub.mayPublish)
                {
                  parentPubSub.mayPublish = 1;
                }
              if (objectPubSub.maySubscribe)
                {
                  parentPubSub.maySubscribe = 1;
                }
            }
          else
            {
              federate.pubSubObjects[object.basePath] =
                {publish: 0,
                 subscribe: 0,
                 mayPublish: objectPubSub.mayPublish,
                 maySubscribe: objectPubSub.maySubscribe};
            }
        }
    }; // end cppObjectTraverserCheck

/* ******************************************************************* */

/* CppRTIFederateExporter */
/** (function-valued variable of top-level function object)<br><br>

Returned Value: none<br><br>

Called By: Called automatically when CppRTI is called (in CppFederate.js)<br><br>

This is the primary function for C++ RTI (Real Time Interface).<br>

*/
    CppRTIFederateExporter = function()
    {
      var initCppRTI; // function variable

/* ******************************************************************* */

/* initCppRTI */
/** (function-valued variable of CppRTIFederateExporter)<br><br>

Returned Value: none<br><br>

Called By:<br>
  CppFederateExporter (in CppFederate.js)<br>
  OmnetFederateExporter (in OmnetFederate.js)<br><br>

This defines the functions that generate C++ code.<br>

*/

      initCppRTI = function()
      {
        var coreDirPath;                       // string
        var coreDirSpec;                       // object
        var coreOutIncFilePath;                // string
        var coreNamespace;                     // string
        var coreOutSrcFilePath;                // string
        var cppInteractionRootGenerator;       // function
        var cppMoreOtherInteractionsGenerator; // function
        var cppMoreOtherObjectsGenerator;      // function
        var cppOtherInteractionsGenerator;     // function
        var cppOtherObjectsGenerator;          // function
        var cppObjectRootGenerator;            // function
        var cppPomGenerator;                   // function
        var cppRenderToFile;                   // function
        var C2WLoggingPOM;                     // object
        var foundationDirBasePath;             // string
        var porticoPOM;                        // object
        var renderContext;                     // object
        var self;                              // the caller of CppRTI
        var simDirBasePath;                    // string
        var simDirPath;                        // string
        var simDirSpec;                        // object

        self = this;
        coreNamespace = "c2w_hla";
        renderContext = {ejs:ejs,
                         isinteraction: true,
                         TEMPLATES:TEMPLATES,
                         package: coreNamespace};
        if (self.cppRTIInitDone)
          {
            return;
          }
        // This lists all the nodes in the BasePackage of the webGME model
        // other than ObjectRoot and InteractionRoot. All of them except
        // FederateObject are interactions.
        self.cppCorePackageOISpecs =
               {C2WInteractionRoot: coreNamespace,
                SimulationControl: coreNamespace,
                SimEnd: coreNamespace,
                SimPause: coreNamespace,
                SimResume: coreNamespace,
                SimLog: coreNamespace,
                HighPrio: coreNamespace,
                MediumPrio: coreNamespace,
                LowPrio: coreNamespace,
                VeryLowPrio: coreNamespace,
                FederateObject: coreNamespace,
                FederateJoinInteraction: coreNamespace,
                FederateResignInteraction: coreNamespace,
                OutcomeBase: coreNamespace,
                ActionBase: coreNamespace
               };

/* ******************************************************************* */

/* cppRenderToFile */
/** (function-valued variable of initCppRTI)<br><br>

Returned Value: none<br><br>

Called By:<br>
  renderNextObject<br>
  renderNextMoreObject<br>
  renderNextInteraction<br>
  renderNextMoreInteraction<br><br>

This generates a code string for a single object or interaction that
is represented by the "model" argument. The code string is put into a
file-like thingy for each federate that has generateCode set to true
and uses the object or interaction.<br><br>

This function calls its caller when the function that is the last
argument to addFile executes. Thus, this function and the caller call
each other until the caller runs out of models. This function
should not be called for a model unless it is certain that addFile
will be called; otherwise, the callback will not occur.<br>

*/
        cppRenderToFile = function(                 /* ARGUMENTS */
         /** full file name of file to write        */ outFilePath,
         /** true = interaction, false = object     */ isInteraction,
         /** data model from which to generate code */ model,
         /** array of generated files               */ artifact,
         /** function to call if error or done      */ callback)
        {
          var context;
          var fullPath;
          var datamemberList;
          var cppTemplate;
          var hppTemplate;
          var cppCode;
          var hppCode;
          var remaining;
          var federId;
          var feder;
          var groupId;
          var cjTypeMap;
          var cjArgumentTypeMap;

          cjTypeMap = {"String"  : "std::string",
                       "int"     : "int",
                       "long"    : "long",
                       "short"   : "short",
                       "byte"    : "char",
                       "char"    : "char",
                       "double"  : "double",
                       "float"   : "float",
                       "boolean" : "bool"};
          cjArgumentTypeMap = {"String"  : "const std::string &",
                               "int"     : "int",
                               "long"    : "long",
                               "short"   : "short",
                               "byte"    : "char",
                               "char"    : "char",
                               "double"  : "double",
                               "float"   : "float",
                               "boolean" : "bool"};
          context = 
          {alldatamembers : [],
           codeclassname : (model.codeName || model.name),
           cppjavaArgumentTypeMap : cjArgumentTypeMap,
           cppjavaTypeMap : cjTypeMap,
           datamembers : [],
           hlaclassname : model.fullName,
           isc2winteractionroot : model.isroot && isInteraction,
           isinteraction : isInteraction,
           parentclassname : model.isroot ? "" : model.basename,
           TEMPLATES : TEMPLATES
          };
          if (isInteraction)
            {
              datamemberList = model.parameters;
            }
          else
            {
              datamemberList = model.attributes;
            }
          datamemberList.forEach(function(paratt)
          {
            context.alldatamembers.push(paratt);
            if (!paratt.inherited)
              {
                context.datamembers.push(paratt);
              }
          });

          cppTemplate = TEMPLATES['cpp/class.cpp.ejs'];
          cppCode = ejs.render(cppTemplate, context);
          hppTemplate = TEMPLATES['cpp/class.hpp.ejs'];
          hppCode =  ejs.render(hppTemplate, context);
          if (self.federateInfos)
            { // only the FederatesExporter has federateInfos
              groupId = self.getCurrentConfig().groupId.trim();

              if (self.callObjectTraverser)
                {
                  self.callObjectTraverser = false;
                  for (federId in self.federateInfos)
                    {
                      feder = self.federateInfos[federId];
                      self.objectRoots.forEach(function(objectRoot)
                      {
                        cppObjectTraverserCheck(feder, objectRoot);
                      });
                    }
                }
              // Set remaining by counting how many will be written.
              remaining = 0;
              for (federId in self.federateInfos)
                {
                  feder = self.federateInfos[federId];
                  if ((!feder.generateCode) ||
                      (feder.metaType != 'CppFederate'))
                    continue;
                  if ((isInteraction &&
                       (model.id in feder.pubSubInteractions)) ||
                      (!isInteraction &&
                       (model.id in feder.pubSubObjects)))
                    {
                      remaining++;
                    }
                }
              if (remaining == 0)
                { // no federate needing code uses the object or interaction
                  callback();
                }
              for (federId in self.federateInfos)
                {
                  feder = self.federateInfos[federId];
                  if ((!feder.generateCode) ||
                      (feder.metaType != 'CppFederate'))
                    continue;
                  if ((isInteraction &&
                       (model.id in feder.pubSubInteractions)) ||
                      (!isInteraction &&
                       (model.id in feder.pubSubObjects)))
                    {
                      remaining--;
                      fullPath = feder.name + "/src/main/c++/rti/" +
                            (model.codeName || model.name) + ".cpp";
                      self.logger.info("calling addFile for " + fullPath +
                                       " in cppRenderToFile of CppRTI.js");
                      artifact.addFile(fullPath, cppCode,
                                       function (err)
                                       {if (err) {callback(err); return;}});
                      fullPath = feder.name + "/src/main/include/rti/" +
                                 (model.codeName || model.name) + ".hpp";
                      self.logger.info("calling addFile for " + fullPath +
                                       " in cppRenderToFile of CppRTI.js");
                      artifact.addFile(fullPath, hppCode,
                                       (remaining ?
                                        function (err) // there are more
                                        {if (err) {callback(err); return;}} :
                                        function (err) // last one
                                        {if (err) {callback(err); return;}
                                          else {callback();}})
                                      );
                    }
                }
            }
          else  // caller is not the FederatesExporter - is this necessary?
            {
              fullPath = outFilePath + MavenPOM.mavenCppPath + '/' +
                         model.name +'.cpp';
              artifact.addFile(fullPath, cppCode,
                               function(err)
                               {if (err) {callback(err); return;}});
              fullPath = outFilePath + MavenPOM.mavenIncludePath + '/' +
                         model.name +'.hpp';
              artifact.addFile(fullPath, hppCode, callback);
            }
        }; // end cppRenderToFile

/* ******************************************************************* */

/*

Begin FOUNDATION RTI

*/        

        foundationDirBasePath = 'cpp/';
        coreDirSpec = {federation_name: "rti-base",
                       artifact_name: "", language:""};
        coreDirPath = foundationDirBasePath +
                      ejs.render(self.directoryNameTemplate, coreDirSpec);
        coreOutSrcFilePath = coreDirPath + MavenPOM.mavenCppPath;
        coreOutIncFilePath = coreDirPath + MavenPOM.mavenIncludePath;

        porticoPOM = new MavenPOM();
        porticoPOM.artifactId = "portico-hla13-cpp";
        porticoPOM.groupId = "org.cpswt";
        porticoPOM.version = "1.0.0";
        porticoPOM.packaging = "nar";

        C2WLoggingPOM = new MavenPOM();
        C2WLoggingPOM.artifactId = "C2WConsoleLogger";
        C2WLoggingPOM.groupId = "org.cpswt";
        C2WLoggingPOM.version = self.cpswt_version;
        C2WLoggingPOM.packaging = "nar";

        self.cpp_corePOM = new MavenPOM();
        self.cpp_corePOM.groupId = "org.cpswt";
        self.cpp_corePOM.artifactId = "rti-base-cpp";
        self.cpp_corePOM.version = self.cpswt_version;
        self.cpp_corePOM.packaging = "nar";
        self.cpp_corePOM.dependencies.push(porticoPOM);
        self.cpp_corePOM.dependencies.push(C2WLoggingPOM);

/* ******************************************************************* */

/*

For the federates exporter, in the following "if", the
self.generateExportPackages is set to
self.getCurrentConfig().generateExportPackages, which is obtained from
the metadata.json file for the federates exporter. generateExportPackages
is currently set to false in that file.

All of the actions in the "if" are "push" actions adding generators to
the corefileGenerators. JavaRTI.js has the same sort of conditional
code for putting generators in the corefileGenerators.  Hence,
currently, no core files are generated. The finishExport function in
FederatesExporter.js runs the corefileGenerators if there are any, but
currently there are none.

*/
        if (self.generateExportPackages)
          {

/* ******************************************************************* */

/* cppPomGenerator */
/** (function-valued variable of initCppRTI)<br><br>

Returned Value: none<br><br>

Called By: ?<br><br>

If generating export packages, this adds to corefileGenerators a POM
generator using the coreDirPath and self.corePOM.toJSON().<br>

*/
            cppPomGenerator = function(            /* ARGUMENTS */
             /** array of generated files          */ artifact,
             /** function to call if error or done */ callback)
            {
              var xmlCode;
              var fullPath;

              fullPath = coreDirPath + '/pom.xml';
              xmlCode =
                self._jsonToXml.convertToString(self.cpp_corePOM.toJSON());
              artifact.addFile(fullPath, xmlCode ,
                               function (err)
                               {
                                 if (err)
                                   {
                                     callback(err);
                                     return;
                                   }
                                 else
                                   {
                                     callback();
                                   }
                               });
            }; // end cppPomGenerator
            self.corefileGenerators.push(cppPomGenerator);

/* ******************************************************************* */

/* cppInteractionRootGenerator */
/** (function-valued variable of initCppRTI)<br><br>

Returned Value: none<br><br>

Called By: ?<br><br>

If generating export packages, this adds to corefileGenerators<br>
- an interaction root C++ code file generator using the
  coreOutSrcFilePath, and<br>
- an interaction root C++ header file generator using the
  coreOutIncFilePath.<br>

*/
            cppInteractionRootGenerator = function( /* ARGUMENTS */
             /** array of generated files           */ artifact,
             /** function to call if error or done  */ callback)
            {
              var fullPath;
              var xmlCode;
              var template;

              fullPath = coreOutSrcFilePath + '/InteractionRoot.cpp';
              template = TEMPLATES['cpp/classroot.cpp.ejs'];
              xmlCode = ejs.render(template, {isinteraction: true});
              artifact.addFile(fullPath, xmlCode,
                               function (err)
                               {
                                 if (err)
                                   {
                                     callback(err);
                                     return;
                                   }
                               });
              fullPath = coreOutIncFilePath + '/InteractionRoot.hpp';
              template = TEMPLATES['cpp/classroot.hpp.ejs'];
              xmlCode = ejs.render(template, {isinteraction: true});
              artifact.addFile(fullPath, template,
                               function (err)
                               {
                                 if (err)
                                   {
                                     callback(err);
                                     return;
                                   }
                                 else
                                   {
                                     callback();
                                     return;
                                   }
                               });
            }; // end cppInteractionRootGenerator
            self.corefileGenerators.push(cppInteractionRootGenerator);

/* ******************************************************************* */

/* cppObjectRootGenerator */
/** (function-valued variable of initCppRTI)<br><br>

Returned Value: none<br><br>

Called By: ?<br><br>

If generating export packages, this adds to corefileGenerators<br>
- an object root C++ code file generator using the
  coreOutSrcFilePath, and<br>
- an object root C++ header file generator using the
  coreOutIncFilePath.<br><br>

When the added function executes, the second artifact.addFile adds the
ObjectRoot.hpp file only if there is no error generating the
ObjectRoot.cpp file.<br>

*/

            cppObjectRootGenerator = function(     /* ARGUMENTS */
             /** array of generated files          */ artifact,
             /** function to call if error or done */ callback)
            {
              var fullPath;
              var xmlCode;
              var template;

              fullPath = coreOutSrcFilePath + '/ObjectRoot.cpp';
              template = TEMPLATES['cpp/classroot.cpp.ejs'];
              xmlCode = ejs.render(template, {isinteraction: false});
              artifact.addFile(fullPath, xmlCode,
                               function (err)
                               {
                                 if (err)
                                   {
                                     callback(err);
                                     return;
                                   }
                               });
              fullPath = coreOutIncFilePath + '/ObjectRoot.hpp';
              template = TEMPLATES['cpp/classroot.hpp.ejs'];
              xmlCode = ejs.render(template, {isinteraction: false});
              artifact.addFile(fullPath, xmlCode,
                               function (err)
                               {
                                 if (err)
                                   {
                                     callback(err);
                                     return;
                                   }
                                 else
                                   {
                                     callback();
                                     return;
                                   }
                               });
            }; // end cppObjectRootGenerator
            self.corefileGenerators.push(cppObjectRootGenerator);

/* ******************************************************************* */

/* cppOtherObjectsGenerator */
/** (function-valued variable of initCppRTI)<br><br>

Returned Value: none<br><br>

Called By: ?<br><br>

If generating export packages, this adds to the core file generators a
function that prints a C++ file for each object in self.objects whose
name is a property in cppCorePackageOISpecs.<br><br>

When the added function executes, the cppRenderToFile function and the
renderNextObject function call each other until all the selected
objects are processed.<br>

*/

            cppOtherObjectsGenerator = function(   /* ARGUMENTS */
             /** array of generated files          */ artifact,
             /** function to call if error or done */ callback)
            {
              var objToRender;
              var renderNextObject;
              var oid;

              if (!self.cppPOM)
                {
                  callback();
                  return;
                }
                objToRender = [];

/* ******************************************************************* */

/* renderNextObject */
/** (function-valued variable of cppOtherObjectsGenerator)<br><br>

Returned Value: none<br><br>

Called By: cppOtherObjectsGenerator<br><br>

This renders one Object to a file.<br>

*/

              renderNextObject = function(  /* ARGUMENTS */
               /** error message or nullish */ err)
              {
                var nextObj;

                if (err)
                  {
                    callback(err);
                  }
                else
                  {
                    nextObj = objToRender.pop();
                    if (nextObj)
                      {
                        cppRenderToFile(coreDirPath, false, nextObj,
                                        artifact, renderNextObject);
                      }
                    else
                      {
                        callback();
                        return;
                      }
                  }
              }; // end renderNextObject

/* ******************************************************************* */

              for (oid in self.objects)
                {
                  if (self.objects[oid].name != "ObjectRoot" &&
                      self.cppCorePackageOISpecs.
                        hasOwnProperty(self.objects[oid].name))
                    {
                      objToRender.push(self.objects[oid]);
                    }
                }
              renderNextObject();
            }; // end cppOtherObjectsGenerator
            self.corefileGenerators.push(cppOtherObjectsGenerator);

/* ******************************************************************* */

/* cppOtherInteractionsGenerator */
/** (function-valued variable of initCppRTI)<br><br>

Returned Value: none<br><br>

Called By: ?<br><br>

If generating export packages, this adds to the core file generators a
function that prints a C++ file for each interaction in self.interactions
whose name is a property in self.cppCorePackageOISpecs.<br><br>

When the added function executes, the cppRenderToFile function and the
renderNextInteraction function call each other until all the selected
interactions are processed.<br>

*/

            cppOtherInteractionsGenerator = function( /* ARGUMENTS */
             /** array of generated files             */ artifact,
             /** function to call if error or done    */ callback)
            {
              var intToRender;
              var renderNextInteraction;
              var iid;

              if (!self.cppPOM)
                {
                  callback();
                  return;
                }
                intToRender = [];

/* ******************************************************************* */

/* renderNextInteraction */
/** (function-valued variable of cppOtherInteractionsGenerator)<br><br>

Returned Value: none<br><br>

Called By: cppOtherInteractionsGenerator<br><br>

This renders one Interaction to a file.<br>

*/

              renderNextInteraction = function( /* ARGUMENTS */
               /** error message or nullish     */ err)
              {
                var nextInteraction;

                if (err)
                  {
                    callback(err);
                  }
                else
                  {
                    nextInteraction = intToRender.pop();
                    if (nextInteraction)
                      {
                        cppRenderToFile(coreDirPath, true, nextInteraction,
                                        artifact, renderNextInteraction);
                      }
                    else
                      {
                        callback();
                        return;
                      }
                  }
              }; // end renderNextInteraction

/* ******************************************************************* */

              for (iid in self.interactions)
                {
                  if(self.interactions[iid].name != "InteractionRoot" &&
                     self.cppCorePackageOISpecs.
                       hasOwnProperty(self.interactions[iid].name))
                    {
                      intToRender.push(self.interactions[iid]);
                    }
                }
              renderNextInteraction();


            }; // end cppOtherInteractionsGenerator
            self.corefileGenerators.push(cppOtherInteractionsGenerator);
          } // closes if (self.generateExportPackages)
// end FOUNDATION RTI

/* ******************************************************************* */

// begin SIM RTI

        simDirBasePath = 'cpp-federates/';
        simDirSpec = {federation_name: self.projectName,
                      artifact_name: "rti",
                      language:"cpp"};
        simDirPath =  simDirBasePath + ejs.render(self.directoryNameTemplate,
                                                  simDirSpec);  
        self.cpp_rtiPOM = new MavenPOM(); //Parent to be set serialization time.
        self.cpp_rtiPOM.artifactId =
          ejs.render(self.directoryNameTemplate, simDirSpec)
        self.cpp_rtiPOM.version = self.cpswt_version;
        self.cpp_rtiPOM.packaging = "nar";
        self.cpp_rtiPOM.dependencies.push(self.cpp_corePOM);

/* ******************************************************************* */

/* cppMoreOtherObjectsGenerator */
/** (function-valued variable of initCppRTI)<br><br>

Returned Value: none<br><br>

Called By: ?<br><br>

This adds to the file generators a function that prints a C++ file for
each object in self.objects whose name is not a property in
cppCorePackageOISpecs.<br><br>

When the added function executes, the cppRenderToFile function and the
renderNextMoreObject function call each other until all the selected
objects are processed.<br>

*/

        cppMoreOtherObjectsGenerator = function( /* ARGUMENTS */
         /** array of generated files            */ artifact,
         /** function to call if error or done   */ callback)
        {
          var objToRender;
          var renderNextMoreObject;
          var oid;

          if (!self.cppPOM)
            {
              callback();
              return;
            }
          objToRender = [];

/* ******************************************************************* */

/* renderNextMoreObject */
/** (function-valued variable of cppMoreOtherObjectsGenerator)<br><br>

Returned Value: none<br><br>

Called By: cppMoreOtherObjectsGenerator<br><br>

This renders one Object to a file.<br>

*/

          renderNextMoreObject = function( /* ARGUMENTS */
           /** error message or nullish    */ err)
          {
            var nextObj;

            if (err)
              {
                callback(err);
              }
            else
              {
                nextObj = objToRender.pop();
                if (nextObj)
                  {
                    cppRenderToFile(simDirPath, false, nextObj, artifact,
                                    renderNextMoreObject);
                  }
                else
                  {
                    callback();
                    return;
                  }
              }
          }; // end renderNextMoreObject

/* ******************************************************************* */

          for (oid in self.objects)
            {
              if(self.objects[oid].name != "ObjectRoot" &&
                 !self.cppCorePackageOISpecs.
                   hasOwnProperty(self.objects[oid].name) )
                {
                  objToRender.push(self.objects[oid]);
                }
            }
          renderNextMoreObject();
        }; // end cppMoreOtherObjectsGenerator
        self.fileGenerators.push(cppMoreOtherObjectsGenerator);

/* ******************************************************************* */

/* cppMoreOtherInteractionsGenerator */
/** (function-valued variable of initCppRTI)<br><br>

Returned Value: none<br><br>

Called By: ?<br><br>

This adds to the file generators a function that prints a cpp file for
each interaction in self.interactions whose name is not a property in
self.cppCorePackageOISpecs.<br><br>

When the added function executes, the cppRenderToFile function and the
renderNextMoreInteraction function call each other until all the
selected interactions are processed.<br>

*/

        cppMoreOtherInteractionsGenerator = function( /* ARGUMENTS */
         /** array of generated files                 */ artifact,
         /** function to call if error or done        */ callback)
        {
          var intToRender;
          var renderNextMoreInteraction;
          var iid;

          if (!self.cppPOM)
            {
              callback();
              return;
            }
          intToRender = [];

/* ******************************************************************* */

/* renderNextMoreInteraction */
/** (function-valued variable of cppMoreOtherInteractionsGenerator)<br><br>

Returned Value: none<br><br>

Called By: cppMoreOtherInteractionsGenerator<br><br>

This renders one Interaction to a file.<br>

*/

          renderNextMoreInteraction = function( /* ARGUMENTS */
           /** error message or nullish         */ err)
            {
              var nextInteraction;

              if (err)
                {
                  callback(err);
                }
              else
                {
                  nextInteraction = intToRender.pop();
                  if (nextInteraction)
                    {
                      cppRenderToFile(simDirPath, true, nextInteraction,
                                      artifact, renderNextMoreInteraction);
                    }
                  else
                    {
                      callback();
                      return;
                    }
                }
            }; // end renderNextMoreInteraction

/* ******************************************************************* */

          for (iid in self.interactions)
            {
              if(self.interactions[iid].name != "InteractionRoot" &&
                 !self.cppCorePackageOISpecs.
                   hasOwnProperty(self.interactions[iid].name) )
                {
                  intToRender.push(self.interactions[iid]);
                }
            }
          renderNextMoreInteraction();
        }; // end cppMoreOtherInteractionsGenerator
        self.fileGenerators.push(cppMoreOtherInteractionsGenerator);
  // end SIM RTI

/* ******************************************************************* */

        self.cppRTIInitDone = true;
      }; // end initCppRTI
      this.initCppRTI = initCppRTI;

/* ******************************************************************* */

    }; // end CppRTIFederateExporter

    return CppRTIFederateExporter;
 }); // end define
