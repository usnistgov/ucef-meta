/**

JavaRTI.js is used in the define of:
 C2Federates/MapperFederate.js and
 C2Federates/JavaFederate.js

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
    var JavaRTIFederateExporter;   // function variable
    var javaObjectTraverserCheck;      // function variable
    var javaInteractionTraverserCheck; // function variable

/* ******************************************************************* */

/* javaObjectTraverserCheck */
/** (function-valued variable of top-level function object)<br><br>

Returned Value: none<br><br>

Called By:<br>
  javaRenderToFile (object is objectRoot)<br>
  renderNotCoreObjectToFile (object is objectRoot)<br>
  javaObjectTraverserCheck (recursively)<br><br>

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
maySubscribe values set appropriately.<br>

*/

    javaObjectTraverserCheck = function(             /* ARGUMENTS */
     /** (object) data in FederateInfos for federate */ federate,
     /** (object) object to process                  */ object)
    {
      var objectPubSub;
      var parentPubSub;

      object.children.forEach(function(child)
      {
        javaObjectTraverserCheck(federate, child);
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

/* ******************************************************************* */

/* javaInteractionTraverserCheck */
/** (function-valued variable of top-level function object)<br><br>

Returned Value: none<br><br>

Called By:<br>
  renderNotCoreInteractionToFile<br>
  javaInteractionTraverserCheck (recursively)<br><br>

This adds entries to the pubSubInteractions of a federate for all ancestors
of interactions that already have entries.<br><br>

By calling itself recursively, this goes through the interaction tree
(from top down) but builds the pubSubInteractions from bottom up.<br><br>

If an interaction is on the pubSubInteractions of the federate but its
parent is not, an entry for the parent of the interaction is added to
the pubSubInteractions; the entry represents that the parent neither
publishes or subscribes. If the parent publishes or subscribes, an
entry for the parent will have been made previously in PubSubVisitors.<br><br>

The final effect is that any interaction that is an ancestor of any
interaction originally put on the pubSubInteractions in PubSubVisitors
is also on pubSubInteractions.<br>

*/
    javaInteractionTraverserCheck = function(        /* ARGUMENTS */
     /** (object) data in federateInfos for federate */ federate,
     /** (object) interaction to process             */ interaction)
    {
      interaction.children.forEach(function (child)
      {
        javaInteractionTraverserCheck(federate, child);
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

/* ******************************************************************* */

/* JavaRTIFederateExporter */
/** (function-valued variable of top-level function object)<br><br>

Returned Value: none<br><br>

Called By: Called automatically when JavaRTI is called
(in JavaFederate.js and MapperFederate.js)<br><br>

This is the primary function for Java RTI (Real Time Interface).<br>


*/
    JavaRTIFederateExporter = function()
    {
      var createJavaRTICodeModel; // function
      var initJavaRTI;            // function

/* ******************************************************************* */

/* initJavaRTI */
/** (function-valued variable of JavaRTIFederateExporter)<br><br>

Returned Value: none<br><br>

Called By:<br>
  JavaFederateExporter (in JavaFederate.js)<br>
  MapperFederateExporter (in MapperFederate.js)<br><br>

This defines the functions that generate Java code.<br><br>

*/
      initJavaRTI = function()
      {
        var coreDirPath;                        // string
        var coreDirSpec;                        // object
        var coreOutFilePath;                    // string
        var corePackagePath;                    // array
        var corePackagePathStr;                 // string
        var foundationDirBasePath;              // string
        var eventsDirPath;                      // string
        var eventsDirSpec;                      // object
        var eventsOutFilePath;                  // string
        var foundationPOM;                      // object
        var javaEventsPomGenerator;             // function
        var javaInteractionRootGenerator;       // function
        var javaMoreOtherInteractionsGenerator; // function
        var javaMoreOtherObjectsGenerator;      // function
        var javaObjectRootGenerator;            // function
        var javaOtherInteractionsGenerator;     // function
        var javaOtherObjectsGenerator;          // function
        var javaPomGenerator;                   // function
        var javaRenderToFile;                   // function
        var renderContext;                      // object
        var renderNotCoreInteractionToFile;     // function
        var renderNotCoreObjectToFile;          // function
        var self;                               // the caller of JavaRTI
        var simDirBasePath;                     // string
        var simDirPath;                         // string
        var simDirSpec;                         // object
        var simOutFilePath;                     // string

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

        // This lists all the nodes in the BasePackage of the webGME model
        // other than ObjectRoot and InteractionRoot. All of them except
        // FederateObject are interactions.
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

/* ******************************************************************* */

/* javaRenderToFile */
/** (function-valued variable of initJavaRTI)<br><br>

Returned Value: none<br><br>

Called By:<br>
  renderNextObjectInCore (which is also the callback argument)<br>
  renderNextInteractionInCore (which is also the callback argument)<br><br>

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
        javaRenderToFile = function(            /* ARGUMENTS */
         /** full file name of file to write    */ outFilePath,
         /** true = interaction, false = object */ isInteraction,
         /** object from which to draw data     */ model,
         /** array of file generating functions */ artifact,
         /** function to call if error or done  */ callback)
        {
          var context;
          var packagePath;
          var fullPath;
          var oattr;
          var datamemberList;
          var template;
          var javaCode;
          var remaining;
          var federId;
          var feder;
          var federJavaCode;
          var groupId;

          context = self.createJavaRTICodeModel();
          packagePath = outFilePath + "/" +
            (self.javaCorePackageOISpecs.hasOwnProperty(model.name) ?
             self.javaCorePackageOISpecs[model.name]['simname'] :
             self.projectName);
          fullPath = packagePath + '/' + model.name +'.java';
          context.isinteraction = isInteraction;
          context.simname = self.projectName;
          context.classname = model.name;
          context.codeclassname = (model.codeName || model.name);
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
              groupId = self.getCurrentConfig().groupId.trim();

              if (self.callObjectTraverser)
                {
                  self.callObjectTraverser = false;
                  for (federId in self.federateInfos)
                    {
                      feder = self.federateInfos[federId];
                      self.objectRoots.forEach(function(objectRoot)
                      {
                        javaObjectTraverserCheck(feder, objectRoot);
                      });
                    }
                }
              // Set remaining by counting how many will be written.
              remaining = 0;
              for (federId in self.federateInfos)
                {
                  feder = self.federateInfos[federId];
                  if (!feder.generateCode)
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
                  if (!feder.generateCode)
                    continue;
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
                        feder.name.toLowerCase() + "/rti/" +
                        (model.codeName || model.name) + ".java";
                      self.logger.info('calling addFile for ' + fullPath +
                                       ' in javaRenderToFile of JavaRTI.js');
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
            { // caller is not the FederatesExporter
              self.logger.info('calling addFile for ' + fullPath +
                               ' in javaRenderToFile of JavaRTI.js');
              artifact.addFile(fullPath, javaCode, callback);
            }
        }; // end javaRenderToFile

/* ******************************************************************* */

/* renderNotCoreObjectToFile */
/** (function-valued variable of initJavaRTI)<br><br>

Returned Value: none<br><br>

Called By:<br>
  javaMoreOtherObjectsGenerator<br><br>

This renders a not-core object to a java file for each federate that
has a publish or subscribe connection to the object.<br><br>

The "model" argument is the model originally constructed from a webgme
node in RTIVisitors.js. The model has the following properties:<br>
 attributes<br>
 basePath<br>
 basename<br>
 children<br>
 codeName (CodeGeneratedName, may be undefined)<br>
 id<br>
 isroot<br>
 name<br>
 parameters<br>

*/
        renderNotCoreObjectToFile = function(       /* ARGUMENTS */
         /** full file name of file to write        */ outFilePath,
         /** data model from which to generate code */ model,
         /** array of file generating functions     */ artifact,
         /** function to call if error or done      */ callback)
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
          context.codeclassname = (model.codeName || model.name);
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
                        javaObjectTraverserCheck(feder, objectRoot);
                      });
                    }
                }
              groupId = self.getCurrentConfig().groupId.trim();
              for (federId in self.federateInfos)
                {
                  feder = self.federateInfos[federId];
                  if ((feder.generateCode == true) &&
                      (model.id in feder.pubSubObjects) &&
                      (feder.metaType == 'JavaFederate'))
                    {
                      federJavaCode = "package " + groupId + "." +
                        feder.name.toLowerCase() + ".rti;\n" + javaCode;
                      fullPath = feder.name + "/src/main/java/" +
                        groupId.replace(/[.]/g, "/") + "/" +
                        feder.name.toLowerCase() + "/rti/" +
                        (model.codeName || model.name) + ".java";
                      self.logger.info('calling addFile for ' + fullPath +
                                       ' in renderNotCoreObjectToFile' +
                                       ' of JavaRTI.js');
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
              self.logger.info('calling addFile for ' + fullPath +
                               ' in renderNotCoreObjectToFile of JavaRTI.js');
              artifact.addFile(fullPath, javaCode, callback);
            }
        }; // end renderNotCoreObjectToFile

/* ******************************************************************* */

/* renderNotCoreInteractionToFile */
/** (function-valued variable of initJavaRTI)<br><br>

Returned Value: none<br><br>

Called By:<br>
  javaMoreOtherInteractionsGenerator<br><br>

This renders a not-core interaction to a java file for each federate
that has a publish or subscribe connection to the interaction.<br>

*/
        renderNotCoreInteractionToFile = function(  /* ARGUMENTS */
         /** full file name of file to write        */ outFilePath,
         /** data model from which to generate code */ model,
         /** array of file generating functions     */ artifact,
         /** function to call in case of error      */ callback)
        {
          var context;
          var packagePath;
          var fullPath;
          var oattr;
          var template;
          var javaCode;
          var remaining;
          var federId;
          var feder;
          var federJavaCode;
          var groupId;

          context = self.createJavaRTICodeModel();
          packagePath = outFilePath + "/" +
            (self.javaCorePackageOISpecs.hasOwnProperty(model.name) ?
             self.javaCorePackageOISpecs[model.name]['simname'] :
             self.projectName);
          fullPath = packagePath + '/' + model.name +'.java';
          context.isinteraction = true;
          context.simname = self.projectName;
          context.classname = model.name;
          context.codeclassname = (model.codeName || model.name);
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
              if (self.callInteractionTraverser)
                {
                  self.callInteractionTraverser = false;
                  for (federId in self.federateInfos)
                    {
                      feder = self.federateInfos[federId];
                      self.interactionRoots.forEach(function(intRoot)
                      {
                        javaInteractionTraverserCheck(feder, intRoot);
                      });
                    }
                }
              groupId = self.getCurrentConfig().groupId.trim();
              for (federId in self.federateInfos)
                {
                  feder = self.federateInfos[federId];
                  if ((feder.generateCode == true) &&
                      (model.id in feder.pubSubInteractions) &&
                      (feder.metaType == 'JavaFederate'))
                    {
                      federJavaCode = "package " + groupId + "." +
                        feder.name.toLowerCase() + ".rti;\n" + javaCode;
                      fullPath = feder.name + "/src/main/java/" +
                        groupId.replace(/[.]/g, "/") + "/" +
                        feder.name.toLowerCase() + "/rti/" +
                        (model.codeName || model.name) + ".java";
                      self.logger.info('calling addFile for ' + fullPath +
                                       ' in renderNotCoreInteractionToFile' +
                                       ' of JavaRTI.js');
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
              self.logger.info('calling addFile for ' + fullPath + ' in ' +
                               'renderNotCoreInteractionToFile of JavaRTI.js');
              artifact.addFile(fullPath, javaCode, callback);
            }
        }; // end renderNotCoreInteractionToFile

/* ******************************************************************* */

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

/* ******************************************************************* */

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

/* ******************************************************************* */

/* javaPomGenerator */
/** (function-valued variable of initJavaRTI)<br><br>

Returned Value: none<br><br>

Called By: ?<br><br>

If generating export packages, this adds to corefileGenerators a POM
generator using the coreDirPath and self.corePOM.toJSON().<br>

*/
            javaPomGenerator = function(           /* ARGUMENTS */
             /** array of generated files          */ artifact,
             /** function to call if error or done */ callback)
            {
              var xmlCode;
              var fullPath;

              fullPath = coreDirPath + '/pom.xml';
              xmlCode =
                self._jsonToXml.convertToString(self.corePOM.toJSON());
              self.logger.info('calling addFile for ' + fullPath + ' in ' +
                               'initJavaRTI of JavaRTI.js');
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
            }; // end javaPomGenerator
            self.corefileGenerators.push(javaPomGenerator);

/* ******************************************************************* */

/* javaEventsPomGenerator */
/** (function-valued variable of initJavaRTI)<br><br>

Returned Value: none<br><br>

Called By: ?<br><br>

If generating export packages, this adds to corefileGenerators a POM
generator using the eventsDirPath and self.java_core_rtiPOM.toJSON().<br>

*/

            javaEventsPomGenerator = function(     /* ARGUMENTS */
             /** array of generated files          */ artifact,
             /** function to call if error or done */ callback)
            {
              var xmlCode;
              var fullPath;

              fullPath = eventsDirPath + '/pom.xml';
              xmlCode =
                self._jsonToXml.convertToString(self.java_core_rtiPOM.toJSON());
              self.logger.info('calling addFile for ' + fullPath + ' in ' +
                               'initJavaRTI of JavaRTI.js');
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
            }; // end javaEventsPomGenerator
            self.corefileGenerators.push(javaEventsPomGenerator);

/* ******************************************************************* */

/* javaInteractionRootGenerator */
/** (function-valued variable of initJavaRTI)<br><br>

Returned Value: none<br><br>

Called By: ?<br><br>

If generating export packages, this adds to the corefileGenerators a
function that generates an InteractionRoot.java file and an
InteractionRootInterface.java file.<br><br>

When the added function executes, the second artifact.addFile adds the
InteractionRootInterface.java file only if there is no error generating
the InteractionRoot.java file.<br>

*/
            javaInteractionRootGenerator = function( /* ARGUMENTS */
             /** array of generated files            */ artifact,
             /** function to call if error or done   */ callback)
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
              template = TEMPLATES['java/classroot.java.ejs'];
              xmlCode = ejs.render(template, {isinteraction: true});
              self.logger.info('calling addFile for ' + fullPath + ' in ' +
                               'initJavaRTI of JavaRTI.js');
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
              xmlCode = ejs.render(template, {isinteraction: true});
              self.logger.info('calling addFile for ' + fullPath + ' in ' +
                               'initJavaRTI of JavaRTI.js');
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
            }; // end javaInteractionRootGenerator
            self.corefileGenerators.push(javaInteractionRootGenerator);

/* ******************************************************************* */

/* javaObjectRootGenerator */
/** (function-valued variable of initJavaRTI)<br><br>

Returned Value: none<br><br>

Called By: ?<br><br>

If generating export packages, this adds to the corefileGenerators a
function that generates an ObjectRoot.java file and an
ObjectRootInterface.java file.<br><br>

When the added function executes, the second artifact.addFile adds the
ObjectRootInterface.java file only if there is no error generating the
ObjectRoot.java file.<br>

*/

            javaObjectRootGenerator = function(    /* ARGUMENTS */
             /** array of generated files          */ artifact,
             /** function to call if error or done */ callback)
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
              template = TEMPLATES['java/classroot.java.ejs'];
                xmlCode = ejs.render(template, {isinteraction: false});
              self.logger.info('calling addFile for ' + fullPath + ' in ' +
                               'initJavaRTI of JavaRTI.js');
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
              template = TEMPLATES['java/interfaceroot.java.ejs'];
              xmlCode = ejs.render(template, {isinteraction: false});
              self.logger.info('calling addFile for ' + fullPath + ' in ' +
                               'initJavaRTI of JavaRTI.js');
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
            }; // end javaObjectRootGenerator
            self.corefileGenerators.push(javaObjectRootGenerator);

/* ******************************************************************* */

/* javaOtherObjectsGenerator */
/** (function-valued variable of initJavaRTI)<br><br>

Returned Value: none<br><br>

Called By: ?<br><br>

If generating export packages, this adds to the core file generators a
function that prints a java file for each object in self.objects
whose name is a property in self.javaCorePackageOISpecs. Those are the
objects in the BasePackage in the webGME model.<br><br>

When the added function executes, the javaRenderToFile function and
the renderNextObjectInCore function call each other until all the
selected objects are processed.<br>

*/

            javaOtherObjectsGenerator = function(  /* ARGUMENTS */
             /** array of generated files          */ artifact,
             /** function to call if error or done */ callback)
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
                        javaRenderToFile(eventsOutFilePath, false, nextObj,
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
            }; // end push function
            self.corefileGenerators.push(javaOtherObjectsGenerator);

/* ******************************************************************* */

/* javaOtherInteractionsGenerator */
/** (function-valued variable of initJavaRTI)<br><br>

Returned Value: none<br><br>

Called By: ?<br><br>

If generating export packages, this adds to the core file generators a
function that prints a java file for each interaction in self.interactions
whose name is a property in self.javaCorePackageOISpecs.<br><br>

When the added function executes, the javaRenderToFile function and
the renderNextInteractionInCore function call each other until all the
selected interactions are processed.<br>

*/

            javaOtherInteractionsGenerator = function( /* ARGUMENTS */
             /** array of generated files              */ artifact,
             /** function to call if error or done     */ callback)
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
                        javaRenderToFile(eventsOutFilePath, true,
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
            }; // end javaOtherInteractionsGenerator
            self.corefileGenerators.push(javaOtherInteractionsGenerator);
          } // closes if (self.generateExportPackages)

// end FOUNDATION RTI

/* ******************************************************************* */

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

/* ******************************************************************* */

/* javaMoreOtherObjectsGenerator
/** (function-valued variable of initJavaRTI)<br><br>

Returned Value: none<br><br>

Called By: ?<br><br>

This adds to the file generators a function that prints zero to many
java files for each object in self.objects whose name is not a
property in self.javaCorePackageOISpecs.<br>

*/
        javaMoreOtherObjectsGenerator = function( /* ARGUMENTS */
         /** array of generated files             */ artifact,
         /** function to call if error or done    */ callback)
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
                  renderNotCoreObjectToFile(simOutFilePath, objToRender,
                                            artifact, callback);
                }
            }
          callback();
          return;
        }; // end javaMoreOtherObjectsGenerator
        self.fileGenerators.push(javaMoreOtherObjectsGenerator);

/* ******************************************************************* */

/* javaMoreOtherInteractionsGenerator
/** (function-valued variable of initJavaRTI)<br><br>

Returned Value: none<br><br>

Called By: ?<br><br>

This adds to the file generators a function that prints zero to many
java files for each interaction in self.interactions whose name is not
a property in self.javaCorePackageOISpecs.<br>

*/

        javaMoreOtherInteractionsGenerator = function( /* ARGUMENTS */
         /** array of generated files                  */ artifact,
         /** function to call if error or done         */ callback)
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
                  renderNotCoreInteractionToFile(simOutFilePath, intToRender,
                                                 artifact, callback);
                }
            }
          callback();
          return;
        }; // end javaMoreOtherInteractionsGenerator
        self.fileGenerators.push(javaMoreOtherInteractionsGenerator);

// end SIM RTI

/* ******************************************************************* */

        self.javaRTIInitDone = true;
      }; // end initJavaRTI
      this.initJavaRTI = initJavaRTI;

/* ******************************************************************* */

/* createJavaRTICodeModel */
/** (function-valued variable of JavaRTIFederateExporter)<br><br>

Returned Value: A large object<br><br>

Called By: javaRenderToFile<br><br>

This initializes the java code model.<br><br>

The use of "default" as a property name near the end of this function
may be a problem because "default" is a JavaScript reserved word. However,
code elsewhere may be looking for "default", so it has been left in.<br>

*/
      createJavaRTICodeModel = function()
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
                                 "char"    : "'\\0'",
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
      }; // end createJavaRTICodeModel
      this.createJavaRTICodeModel = createJavaRTICodeModel;

/* ******************************************************************* */

    }; // end JavaRTIFederateExporter

    return JavaRTIFederateExporter;
}); // end define
