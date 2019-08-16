/*

JavaRTI.js is used in the define of:
 C2Federates/MapperFederate.js and
 C2Federates/JavaFederate.js

*/

define
([
  'common/util/ejs',
  'C2Core/MavenPOM',
  'C2Federates/Templates/Templates'],
 function (ejs,
           MavenPOM,
           TEMPLATES)
 {
    'use strict';
    var JavaRTIFederateExporter;   // function variable
    var objectTraverserCheck;      // function variable
    var interactionTraverserCheck; // function variable

/***********************************************************************/

/* objectTraverserCheck

Returned Value: none

Called By:
  renderToFile (object is objectRoot)
  renderNotCoreObjectToFile (object is objectRoot)
  objectTraverserCheck (recursively)

In this documentation, "object" means object in the WebGME sense, not
object in the JavaScript sense.

This adds entries to the pubSubObjects of a federate for all ancestors
of objects that already have entries.

For each object, object.basePath is the id of the parent of the object.

First, this calls itself recursively on the children of the
object. Since this is transmitting information from children to
parents, the children have to be processed first. By calling itself
recursively, this goes through the object tree (from top down) but
builds the pubSubObjects of the federate from bottom up.

Then, if the object is not objectRoot and the object.id is in the
pubSubObjects of the given federate, the object is selected for
further processing.

For each selected object:

A. If the parent publishes or subscribes to the federate, an entry in
federate.pubSubObjects for the parent will have been made previously
in PubSubVisitors, and in that case:

A1. If the object's mayPublish of its entry is not zero, the parent's
mayPublish of its entry is set to 1, and
A2. If the object's maySubscribe of its entry is not zero, the parent's
maySubscribe of its entry is set to 1.

B. Otherwise, a new entry in the federate.pubSubObjects is created for the
parent in which the parent's publish and subscribe are set to 0 and the
parent's mayPublish and maySubscribe are set to the object's values.

The final effect is that any object that is an ancestor of any object
originally put on the federate.pubSubObjects in PubSubVisitors is also
on federate.pubSubObjects, with its publish, subscribe, mayPublish, and
maySubscribe values set appropriately.

This function is identical to objectTraverserCheck in
FederatesExporter.js. It would be nice to have only one, but that requires
figuring out where to put it and how to refererence it. Using
self.objectTraverserCheck in this file does not work.

*/

    objectTraverserCheck = function( /* ARGUMENTS                           */
     federate,               /* (object) data in FederateInfos for federate */
     object)                 /* (object) object to process                  */
    {
      var objectPubSub;
      var parentPubSub;

      object.children.forEach(function(child)
      {
        objectTraverserCheck(federate, child);
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
    };

/***********************************************************************/

/* interactionTraverserCheck (function-valued var of top-level function object)

Returned Value: none

Called By:
  renderNotCoreInteractionToFile
  interactionTraverserCheck (recursively)

This adds entries to the pubSubInteractions of a federate for all ancestors
of interactions that already have entries.

By calling itself recursively, this goes through the interaction tree
(from top down) but builds the pubSubInteractions from bottom up.

If an interaction is on the pubSubInteractions of the federate but its
parent is not, an entry for the parent of the interaction is added to
the pubSubInteractions; the entry represents that the parent neither
publishes or subscribes. If the parent publishes or subscribes, an
entry for the parent will have been made previously in PubSubVisitors.

The final effect is that any interaction that is an ancestor of any
interaction originally put on the pubSubInteractions in PubSubVisitors
is also on pubSubInteractions.

This function is identical to interactionTraverserCheck in
FederatesExporter.js. It would be nice to have only one, but that
requires figuring out where to put it and how to refererence it.

*/
    interactionTraverserCheck = function( /* ARGUMENTS                       */
     federate,                /* (object) data in federateInfos for federate */
     interaction)             /* (object) interaction to process             */
    {
      interaction.children.forEach(function (child)
      {
        interactionTraverserCheck(federate, child);
      });
      if (interaction.name != 'InteractionRoot')
        {
          if ((interaction.id in federate.pubSubInteractions) &&
              !(interaction.basePath in federate.pubSubInteractions))
            {
              federate.pubSubInteractions[interaction.basePath] =
                {publish: 0,
                 subscribe: 0};
            }
        }
    };

/***********************************************************************/
    
/* JavaRTIFederateExporter

Returned Value: none

Called By: Called automatically when JavaRTI is called (in MapperFederate.js)

*/
    JavaRTIFederateExporter = function()
    {

/***********************************************************************/

/* initJavaRTI

Returned Value: none

Called By: MapperFederateExporter (in MapperFederate.js)

*/
      this.initJavaRTI = function()
      {
        var coreDirPath;                    // string
        var coreDirSpec;                    // object
        var coreOutFilePath;                // string
        var corePackagePath;                // array
        var corePackagePathStr;             // string
        var foundationDirBasePath;          // string
        var eventsDirPath;                  // string
        var eventsDirSpec;                  // object
        var eventsOutFilePath;              // string
        var foundationPOM;                  // object
        var renderContext;                  // object
        var renderNotCoreInteractionToFile; // function
        var renderNotCoreObjectToFile;      // function
        var renderToFile;                   // function
        var self;                           // the caller of JavaRTI
        var simDirBasePath;                 // string
        var simDirPath;                     // string
        var simDirSpec;                     // object
        var simOutFilePath;                 // string

        self = this;
        corePackagePath = ["org", "cpswt", "hla"];
        corePackagePathStr = corePackagePath.join('.');
        renderContext = {ejs: ejs, 
                         TEMPLATES: TEMPLATES,
                         isinteraction: true,
                         package: corePackagePath.join(".")};
        if (self.javaRTIInitDone)
          {
            return;
          }

        self.javaCorePackageOISpecs =
               {C2WInteractionRoot: {simname: corePackagePathStr},
                SimulationControl: {simname: corePackagePathStr},
                SimEnd: {simname: corePackagePathStr},
                SimPause: {simname: corePackagePathStr},
                SimResume: {simname: corePackagePathStr},
                SimLog: {simname: corePackagePathStr},
                HighPrio: {simname: corePackagePathStr},
                MediumPrio: {simname: corePackagePathStr},
                LowPrio: {simname: corePackagePathStr},
                VeryLowPrio: {simname: corePackagePathStr},
                FederateObject: {simname: corePackagePathStr,
                                 hlaclassname: 'ObjectRoot.Manager.Federate'},
                FederateJoinInteraction: {simname: corePackagePathStr},
                FederateResignInteraction: {simname: corePackagePathStr},
                OutcomeBase: {simname: corePackagePathStr},
                ActionBase: {simname: corePackagePathStr}
               };

/***********************************************************************/

/* renderToFile

Returned Value: none

Called By:
  renderNextObjectInCore (which is also the callback argument)
  renderNextInteractionInCore (which is also the callback argument)

This function calls its caller when the function that is the last
argument to addFile executes. Thus, this function and the caller call
each other until the caller runs out of models. This function
should not be called for a model unless it is certain that addFile
will be called; otherwise, the callback will not occur.
  
*/
        renderToFile = function(
         outFilePath,   // full file name of file to write
         isInteraction, // true = interaction, false = object
         model,         
         artifact,      // array of file generating functions
         callback)
        {
          var context;
          var packagePath;
          var fullPath;
          var oattr;
          var datamemberList;
          var template;
          var javaCode;
          
          context = self.createJavaRTICodeModel();
          packagePath = outFilePath + "/" +
            (self.javaCorePackageOISpecs.hasOwnProperty(model.name) ?
             self.javaCorePackageOISpecs[model.name]['simname'] :
             self.projectName);
          fullPath = packagePath + '/' + model.name +'.java';
          context.isinteraction = isInteraction;
          context.simname = self.projectName;
          context.classname = model.name;
          context.hlaclassname = model.fullName;
          context.parentclassname = model.isroot ? "" : model.basename;
          context.isc2winteractionroot = model.isroot && isInteraction;

          //Override with core specs
          if (self.javaCorePackageOISpecs.hasOwnProperty(model.name))
            {
              for (oattr in self.javaCorePackageOISpecs[model.name])
                {
                  if (self.javaCorePackageOISpecs[model.name].
                      hasOwnProperty(oattr))
                    {
                      context[oattr] =
                        self.javaCorePackageOISpecs[model.name][oattr];
                    }
                }
            }

          datamemberList = [];
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
          
          template = TEMPLATES['java/class.java.ejs'];
          javaCode = ejs.render(template, context);
          if (self.federateInfos)
            { // only the FederatesExporter has federateInfos
              var remaining;
              var federId;
              var feder;
              var federJavaCode;
              var groupId;

              groupId = self.getCurrentConfig().groupId.trim();

              if (self.callObjectTraverser)
                {
                  self.callObjectTraverser = false;
                  for (federId in self.federateInfos)
                    {
                      feder = self.federateInfos[federId];
                      self.objectRoots.forEach(function(objectRoot)
                      {
                        objectTraverserCheck(feder, objectRoot);
                      });
                    }
                }
              // Set remaining by counting how many will be written.
              remaining = 0;
              for (federId in self.federateInfos)
                {
                  feder = self.federateInfos[federId];
                  if ((isInteraction &&
                       (model.id in feder.pubSubInteractions)) ||
                      (!isInteraction &&
                       (model.id in feder.pubSubObjects)))
                    {
                      remaining++;
                    }
                }
              for (federId in self.federateInfos)
                {
                  feder = self.federateInfos[federId];
                  if ((isInteraction &&
                       (model.id in feder.pubSubInteractions)) ||
                      (!isInteraction &&
                       (model.id in feder.pubSubObjects)))
                    {
                      remaining--;
                      federJavaCode = "package " + groupId + "." +
                        feder.name.toLowerCase() + ".rti;\n" + javaCode;
                      fullPath = feder.name + "/src/main/java/" +
                        groupId.replace(/[.]/g, "/") + "/" +
                        feder.name.toLowerCase() + "/rti/" + model.name +
                        ".java";
                      console.log('calling addFile for: ' + fullPath);
                      artifact.addFile(fullPath, federJavaCode,
                                       (remaining ?
                                        function (err) // there are more
                                        {if (err) {callback(err); return;}} :
                                        function (err) // last one
                                        {if (err) {callback(err); return;}
                                          else {callback();}}
                                        )
                                       );
                    }
                }
            }
          else
            {
              console.log('calling addFile for: ' + fullPath);
              artifact.addFile(fullPath, javaCode, callback);
            }
        }; // end renderToFile
        
/***********************************************************************/

/* renderNotCoreObjectToFile

Returned Value: none

Called By:
  anonymous function pushed onto the fileGenerators in initJavaRTI

This renders a not-core object to a java file for each federate that
has a publish or subscribe connection to the object.
  
*/
        renderNotCoreObjectToFile = function(
         outFilePath,   // full file name of file to write
         model,         // data model from which to generate code
         artifact,      // array of file generating functions
         callback)      // function to call in case of error
        {
          var context;
          var packagePath;
          var fullPath;
          var oattr;
          var template;
          var javaCode;
          
          context = self.createJavaRTICodeModel();
          packagePath = outFilePath + "/" +
            (self.javaCorePackageOISpecs.hasOwnProperty(model.name) ?
             self.javaCorePackageOISpecs[model.name]['simname'] :
             self.projectName);
          fullPath = packagePath + '/' + model.name +'.java';
          context.isinteraction = false;
          context.simname = self.projectName;
          context.classname = model.name;
          context.hlaclassname = model.fullName;
          context.parentclassname = model.isroot ? "" : model.basename;
          context.isc2winteractionroot = false;

          //Override with core specs
          if (self.javaCorePackageOISpecs.hasOwnProperty(model.name))
            {
              for (oattr in self.javaCorePackageOISpecs[model.name])
                {
                  if (self.javaCorePackageOISpecs[model.name].
                      hasOwnProperty(oattr))
                    {
                      context[oattr] =
                        self.javaCorePackageOISpecs[model.name][oattr];
                    }
                }
            }
          model.attributes.forEach(function(att)
          {
            context.alldatamembers.push(att);
            if (!att.inherited)
              {
                context.datamembers.push(att);
              }
          });
          
          template = TEMPLATES['java/class.java.ejs'];
          javaCode = ejs.render(template, context);
          if (self.federateInfos)
            { // only the FederatesExporter has federateInfos
              var federId;
              var feder;
              var federJavaCode;
              var groupId;

              if (self.callObjectTraverser)
                {
                  self.callObjectTraverser = false;
                  for (federId in self.federateInfos)
                    {
                      feder = self.federateInfos[federId];
                      self.objectRoots.forEach(function(objectRoot)
                      {
                        objectTraverserCheck(feder, objectRoot);
                      });
                    }
                }
              groupId = self.getCurrentConfig().groupId.trim();
              for (federId in self.federateInfos)
                {
                  feder = self.federateInfos[federId];
                  if ((model.id in feder.pubSubObjects) &&
                      (feder.metaType == 'JavaFederate'))
                    {
                      federJavaCode = "package " + groupId + "." +
                        feder.name.toLowerCase() + ".rti;\n" + javaCode;
                      fullPath = feder.name + "/src/main/java/" +
                        groupId.replace(/[.]/g, "/") + "/" +
                        feder.name.toLowerCase() + "/rti/" + model.name +
                        ".java";
                      console.log('calling addFile for: ' + fullPath);
                      artifact.addFile(fullPath, federJavaCode,
                                       function (err)
                                       {
                                         if (err)
                                           {
                                             callback(err);
                                             return;
                                           }
                                       });
                    }
                }
            }
          else
            {
              console.log('calling addFile for: ' + fullPath);
              artifact.addFile(fullPath, javaCode, callback);
            }
        }; // end renderNotCoreObjectToFile
        
/***********************************************************************/

/* renderNotCoreInteractionToFile

Returned Value: none

Called By:
  anonymous function pushed onto the fileGenerators in initJavaRTI

This renders a not-core interaction to a java file for each federate
that has a publish or subscribe connection to the interaction.
  
*/
        renderNotCoreInteractionToFile = function(
         outFilePath,   // full file name of file to write
         model,         // data model from which to generate code
         artifact,      // array of file generating functions
         callback)      // function to call in case of error
        {
          var context;
          var packagePath;
          var fullPath;
          var oattr;
          var template;
          var javaCode;
          
          context = self.createJavaRTICodeModel();
          packagePath = outFilePath + "/" +
            (self.javaCorePackageOISpecs.hasOwnProperty(model.name) ?
             self.javaCorePackageOISpecs[model.name]['simname'] :
             self.projectName);
          fullPath = packagePath + '/' + model.name +'.java';
          context.isinteraction = true;
          context.simname = self.projectName;
          context.classname = model.name;
          context.hlaclassname = model.fullName;
          context.parentclassname = model.isroot ? "" : model.basename;
          context.isc2winteractionroot = model.isroot;

          //Override with core specs
          if (self.javaCorePackageOISpecs.hasOwnProperty(model.name))
            {
              for (oattr in self.javaCorePackageOISpecs[model.name])
                {
                  if (self.javaCorePackageOISpecs[model.name].
                      hasOwnProperty(oattr))
                    {
                      context[oattr] =
                        self.javaCorePackageOISpecs[model.name][oattr];
                    }
                }
            }
          model.parameters.forEach(function(param)
          {
            context.alldatamembers.push(param);
            if (!param.inherited)
              {
                context.datamembers.push(param);
              }
          });
          
          template = TEMPLATES['java/class.java.ejs'];
          javaCode = ejs.render(template, context);
          if (self.federateInfos)
            { // only the FederatesExporter has federateInfos
              var remaining;
              var federId;
              var feder;
              var federJavaCode;
              var groupId;

              if (self.callInteractionTraverser)
                {
                  self.callInteractionTraverser = false;
                  for (federId in self.federateInfos)
                    {
                      feder = self.federateInfos[federId];
                      self.interactionRoots.forEach(function(intRoot)
                      {
                        interactionTraverserCheck(feder, intRoot);
                      });
                    }
                }
              groupId = self.getCurrentConfig().groupId.trim();
              for (federId in self.federateInfos)
                {
                  feder = self.federateInfos[federId];
                  if ((model.id in feder.pubSubInteractions) &&
                      (feder.metaType == 'JavaFederate'))
                    {
                      federJavaCode = "package " + groupId + "." +
                        feder.name.toLowerCase() + ".rti;\n" + javaCode;
                      fullPath = feder.name + "/src/main/java/" +
                        groupId.replace(/[.]/g, "/") + "/" +
                        feder.name.toLowerCase() + "/rti/" + model.name +
                        ".java";
                      console.log('calling addFile for: ' + fullPath);
                      artifact.addFile(fullPath, federJavaCode,
                                       function (err)
                                       {
                                         if (err)
                                           {
                                             callback(err);
                                             return;
                                           }
                                       });
                    }
                }
            }
          else
            {
              console.log('calling addFile for: ' + fullPath);
              artifact.addFile(fullPath, javaCode, callback);
            }
        }; // end renderNotCoreInteractionToFile
        
/***********************************************************************/
        
/*
   
Begin FOUNDATION RTI

*/        
            
        foundationDirBasePath = 'java/';
        coreDirSpec = {federation_name: "root",
                       artifact_name: "",
                       language: ""};
        coreDirPath = foundationDirBasePath +
                      ejs.render(self.directoryNameTemplate, coreDirSpec);
        coreOutFilePath = coreDirPath + MavenPOM.mavenJavaPath;
        eventsDirSpec = {federation_name: "base-events",
                         artifact_name: "",
                         language: ""};
        eventsDirPath = foundationDirBasePath +
                        ejs.render(self.directoryNameTemplate, eventsDirSpec);
        eventsOutFilePath = eventsDirPath + MavenPOM.mavenJavaPath;

        foundationPOM = new MavenPOM();
        foundationPOM.artifactId = "cpswt-core";
        foundationPOM.groupId = "org.cpswt";
        foundationPOM.version  = self.cpswt_version;

        self.corePOM = new MavenPOM(foundationPOM);
        self.corePOM.artifactId = "root";
        self.corePOM.groupId = "org.cpswt";
        self.corePOM.version = self.cpswt_version;
        self.corePOM.packaging = "jar";

        self.java_core_rtiPOM = new MavenPOM(foundationPOM);
        self.java_core_rtiPOM.artifactId = "base-events";
        self.java_core_rtiPOM.version = self.cpswt_version;
        self.java_core_rtiPOM.packaging = "jar";
        self.java_core_rtiPOM.dependencies.push(self.corePOM);
        
/***********************************************************************/

/*

For the federates exporter, in the following "if", the
self.generateExportPackages is set to
self.getCurrentConfig().generateExportPackages, which is obtained from
the metadata.json file for the federates exporter. generateExportPackages
is currently set to false in that file.

All of the actions in the "if" are "push" actions adding generators to
the corefileGenerators. CppRTI.js has the same sort of conditional
code for putting generators in the corefileGenerators. Hence,
currently, no core files are generated. The finishExport function in
FederatesExporter.js runs the corefileGenerators if there are any, but
currently there are none.

*/
        if (self.generateExportPackages)
          {

/***********************************************************************/

/*

If generating export packages, add to corefileGenerators a POM generator
using the coreDirPath and self.corePOM.toJSON()

*/
            self.corefileGenerators.push(function(artifact, callback)
            {
              var xmlCode;
              var fullPath;

              fullPath = coreDirPath + '/pom.xml';
              xmlCode =
                self._jsonToXml.convertToString(self.corePOM.toJSON());
              console.log('calling addFile for: ' + fullPath);
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
                                   }
                               });
            });

/***********************************************************************/

/*

If generating export packages, add to corefileGenerators a POM generator
using the eventsDirPath and self.java_core_rtiPOM.toJSON()

*/

            self.corefileGenerators.push(function(artifact, callback)
            {
              var xmlCode;
              var fullPath;

              fullPath = eventsDirPath + '/pom.xml';
              xmlCode =
                self._jsonToXml.convertToString(self.java_core_rtiPOM.toJSON());
              console.log('calling addFile for: ' + fullPath);
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
                                   }
                               });
            });

/***********************************************************************/

/*

If generating export packages, add to the corefileGenerators a function
that generates an InteractionRoot.java file and an
InteractionRootInterface.java file.

When the added function executes, the second artifact.addFile adds the
InteractionRootInterface.java file only if there is no error generating
the InteractionRoot.java file.

*/
            self.corefileGenerators.push(function(artifact, callback)
            {
              var fullPath;
              var xmlCode;
              var template;
              
              if (!self.javaPOM)
                {
                  callback();
                  return;
                }
              fullPath = coreOutFilePath + "/" + corePackagePath.join("/") +
                "/" + 'InteractionRoot.java';
              renderContext['isinteraction'] = true;
              template = TEMPLATES['java/classroot.java.ejs'];
              xmlCode = ejs.render(template, renderContext);
              console.log('calling addFile for: ' + fullPath);
              artifact.addFile(fullPath, xmlCode,
                               function (err)
                               {
                                 if (err)
                                   {
                                     callback(err);
                                     return;
                                   }
                               });
              fullPath = coreOutFilePath + "/" + corePackagePath.join("/") +
                         "/" + 'InteractionRootInterface.java';
              template = TEMPLATES['java/interfaceroot.java.ejs'];
              console.log('calling addFile for: ' + fullPath);
              xmlCode = ejs.render(template, renderContext);
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
            });
                
/***********************************************************************/

/*

If generating export packages, add to the corefileGenerators a
function that generates an ObjectRoot.java file and an
ObjectRootInterface.java file.

When the added function executes, the second artifact.addFile adds the
ObjectRootInterface.java file only if there is no error generating the
ObjectRoot.java file.

*/

            self.corefileGenerators.push(function(artifact, callback)
            {
              var fullPath;
              var xmlCode;
              var template;
              
              if (!self.javaPOM)
                {
                  callback();
                  return;
                }
              fullPath = coreOutFilePath + "/" +
                         corePackagePath.join("/") + "/" +
                         'ObjectRoot.java';
              renderContext.isinteraction = false;
              template = TEMPLATES['java/classroot.java.ejs'];
              xmlCode = ejs.render(template, renderContext);
              console.log('calling addFile for: ' + fullPath);
              artifact.addFile(fullPath, xmlCode,
                               function (err)
                               {
                                 if (err)
                                   {
                                     callback(err);
                                     return;
                                   }
                               });
              fullPath = coreOutFilePath + "/" + corePackagePath.join("/") +
                         "/" + 'ObjectRootInterface.java';
              template = TEMPLATES['java/interfaceroot.java.ejs']
              xmlCode = ejs.render(template, renderContext)
              console.log('calling addFile for: ' + fullPath);
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
            });

/***********************************************************************/

/* 

If generating export packages, add to the core file generators a
function that prints a java file for each object in self.objects
whose name is a property in self.javaCorePackageOISpecs.

When the added function executes, the renderToFile function defined
above and the renderNextObjectInCore function defined here call each
other until all the selected objects are processed.

*/

            self.corefileGenerators.push(function(artifact, callback)
            {
              var objToRender;
              var renderNextObjectInCore;
              var nextObj;
              var oid;

              if (!self.javaPOM)
                {
                  callback();
                  return;
                }
              objToRender = [];

              /* start define renderNextObjectInCore function */
              renderNextObjectInCore = function(err)
              {
                if (err)
                  {
                    callback(err);
                  }
                else
                  {
                    nextObj = objToRender.pop();
                    if (nextObj)
                      {
                        console.log("calling renderToFile for core object");
                        renderToFile(eventsOutFilePath, false, nextObj,
                                     artifact, renderNextObjectInCore);
                      }
                    else
                      {
                        callback();
                        return;
                      }
                  }
              };
              /* end define renderNextObjectInCore function */

              for (oid in self.objects)
                {
                  if (self.objects[oid].name != "ObjectRoot" &&
                      self.javaCorePackageOISpecs.
                        hasOwnProperty(self.objects[oid].name))
                    {
                      objToRender.push(self.objects[oid]);
                    }
                }
              renderNextObjectInCore();
            });

/***********************************************************************/

/* 

If generating export packages, add to the core file generators a
function that prints a java file for each interaction in self.interactions
whose name is a property in self.javaCorePackageOISpecs.

When the added function executes, the renderToFile function defined
above and the renderNextInteractionInCore function defined here call each
other until all the selected interactions are processed.

*/
        
            self.corefileGenerators.push(function(artifact, callback)
            {
              var intToRender;
              var renderNextInteractionInCore;
              var iid;
              
              if (!self.javaPOM)
                {
                  callback();
                  return;
                }
              intToRender = [];
              
              /* start define renderNextInteractionInCore function */
              renderNextInteractionInCore = function(err)
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
                        console.log("calling renderToFile for core interaction");
                        renderToFile(eventsOutFilePath, true,
                                     nextInteraction, artifact,
                                     renderNextInteractionInCore);
                      }
                    else
                      {
                        callback();
                        return;
                      }
                  }
              };
              /* end define renderNextInteractionInCore function */

              for (iid in self.interactions)
                {
                  if (self.interactions[iid].name != "InteractionRoot" &&
                      self.javaCorePackageOISpecs.
                        hasOwnProperty(self.interactions[iid].name))
                    {
                      intToRender.push(self.interactions[iid]);
                    }
                }
              renderNextInteractionInCore();
            });
          } // end if (self.generateExportPackages)

// end FOUNDATION RTI

/***********************************************************************/

// begin SIM RTI

        simDirBasePath = self.projectName + '-java-federates/';
        simDirSpec = {federation_name: self.projectName,
                      artifact_name: "rti",
                      language:"java"};
        simDirPath =  simDirBasePath + ejs.render(self.directoryNameTemplate,
                                                  simDirSpec);
        simOutFilePath = simDirPath + MavenPOM.mavenJavaPath; 

        self.java_rtiPOM = new MavenPOM(); //Parent set at serialization time.
        self.java_rtiPOM.artifactId =
          ejs.render(self.directoryNameTemplate, simDirSpec);
        self.java_rtiPOM.version = self.project_version;
        self.java_rtiPOM.packaging = "jar";
        self.java_rtiPOM.dependencies.push(self.java_core_rtiPOM);

/***********************************************************************/

/*

this adds to the file generators a function that prints zero to many
java files for each object in self.objects whose name is not a
property in self.javaCorePackageOISpecs.

*/
        self.fileGenerators.push(function(artifact, callback)
        {
          var objToRender;
          var objId;
          
          if (!self.javaPOM)
            {
              callback();
              return;
            }
          for (objId in self.objects)
            {
              objToRender = self.objects[objId];
              if (objToRender.name != "ObjectRoot" &&
                  !self.javaCorePackageOISpecs.
                     hasOwnProperty(objToRender.name))
                {
                  console.log("calling renderNotCoreObjectToFile");
                  renderNotCoreObjectToFile(simOutFilePath, objToRender,
                                            artifact, callback);
                }
            }
          callback();
          return;
        });
        
/***********************************************************************/

/*

This adds to the file generators a function that prints zero to many
java files for each interaction in self.interactions whose name is not
a property in self.javaCorePackageOISpecs.

*/

        self.fileGenerators.push(function(artifact, callback)
        {
          var intToRender;
          var intId;
          
          if (!self.javaPOM)
            {
              callback();
              return;
            }
          for (intId in self.interactions)
            {
              intToRender = self.interactions[intId];
              if (intToRender.name != "InteractionRoot" &&
                  !self.javaCorePackageOISpecs.
                     hasOwnProperty(intToRender.name))
                {
                  console.log("calling renderNotCoreInteractionToFile");
                  renderNotCoreInteractionToFile(simOutFilePath, intToRender,
                                                 artifact, callback);
                }
            }
          callback();
          return;
        });
        
// end SIM RTI

/***********************************************************************/

        self.javaRTIInitDone = true;
      } // end initJavaRTI

/***********************************************************************/

/* createJavaRTICodeModel

Returned Value: A large object

Called By: renderToFile

The use of "default" as a property name near the end of this function
may be a problem because "default" is a JavaScript reserved word. However,
code elsewhere may be looking for "default", so it has been left in.

*/
      this.createJavaRTICodeModel = function()
      {
        return {simname: "",
                classname: "",
                parentclassname: "",
                hlaclassname: "",
                isinteraction: false,
                isc2winteractionroot: false,
                datamembers: [],
                alldatamembers: [],
                
                helpers:{
                    primitive2object: function(type)
                    {
                      var typeMap;
                      typeMap = {"String"  : "String",
                                 "int"     : "Integer",
                                 "long"    : "Long",
                                 "short"   : "Short",
                                 "byte"    : "Byte",
                                 "char"    : "Character",
                                 "double"  : "Double",
                                 "float"   : "Float",
                                 "boolean" : "Boolean"};
                      return typeMap[type];
                    },
                    supplied: function(type, name)
                    {
                      var typeMap;
                        typeMap = {
                          "String"  : "get_" + name + "()",
                          "int"     : "Integer.toString(get_" + name +"())",
                          "long"    : "Long.toString(get_" + name +"())",
                          "short"   : "Short.toString(get_" + name +"())",
                          "byte"    : "Byte.toString(get_" + name +"())",
                          "char"    : "Character.toString(get_" + name +"())",
                          "double"  : "Double.toString(get_" + name +"())",
                          "float"   : "Float.toString(get_" + name +"())",
                          "boolean" : "Boolean.toString(get_" + name +"())"};
                      return typeMap[type];
                    },
                    set: function(type)
                    {
                      var typeMap;
                      typeMap = {"String"  : "val",
                                 "int"     : "Integer.parseInt(val)",
                                 "long"    : "Long.parseLong(val)",
                                 "short"   : "Short.parseShort(val)",
                                 "byte"    : "Byte.parseByte(val)",
                                 "char"    : "val.charAt(0)",
                                 "double"  : "Double.parseDouble(val)",
                                 "float"   : "Float.parseFloat(val)",
                                 "boolean" : "Boolean.parseBoolean(val)"};
                      return typeMap[type];
                    },
                    get: function(type, name)
                    {
                      var typeMap;
                      typeMap = {
                        "String"  : "get_" + name + "()",
                        "int"     : "new Integer(get_" + name +"())",
                        "long"    : "new Long(get_" + name +"())",
                        "short"   : "new Short(get_" + name +"())",
                        "byte"    : "new Byte(get_" + name +"())",
                        "char"    : "new Character(get_" + name +"())",
                        "double"  : "new Double(get_" + name +"())",
                        "float"   : "new Float(get_" + name +"())",
                        "boolean" : "new Boolean(get_" + name +"())"};
                      return typeMap[type];
                    },
                    initialvalue: function(type)
                    {
                      var typeMap;
                      typeMap = {"String"  : '""',
                                 "int"     : "0",
                                 "long"    : "0",
                                 "short"   : "0",
                                 "byte"    : "0",
                                 "char"    : "\\000",
                                 "double"  : "0",
                                 "float"   : "0",
                                 "boolean" : "false",
                                 default   : ""};
                        return typeMap[type];
                    }
                },
                ejs: ejs, 
                TEMPLATES: TEMPLATES
            };
      } // end createJavaRTICodeModel function

/***********************************************************************/

    } // end JavaRTIFederateExporter function

    return JavaRTIFederateExporter;
});
