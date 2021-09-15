/**

Reformatted in C style, as far as possible.

A single XML file is generated for a project.

The pubSubObjects and pubSubInteractions of the deployment exporter
have the same structure as those of a federate in FederatesExporter.js.

*/

define
([
  'text!./metadata.json',
  'plugin/PluginBase',
  'ejs',
  'C2Core/xmljsonconverter',
  'C2Core/ModelTraverserMixin',
  'DeploymentExporter/Templates/Templates',
  'FederatesExporter/RTIVisitors',
  'FederatesExporter/PubSubVisitors',
  'combinatorics/combinatorics',
  'q',
  'superagent'],
 function(pluginMetadata,
          PluginBase,
          ejs,
          JSON2XMLConverter,
          ModelTraverserMixin,
          TEMPLATES,
          RTIVisitors,
          PubSubVisitors,
          combinations,
          Q,
          superagent)
{
    'use strict';
    var addCoaEdge;                   // function variable
    var addCoaNode;                   // function variable
    var calculateParentPath;          // function variable
    var DeploymentExporter;           // function variable
    var excludeFromVisit;             // function variable
    var getDockerDetails;             // function variable
    var interactionTraverser;         // function variable
    var interactionTraverserCheck;    // function variable
    var interactionTraverserXml;      // function variable
    var objectTraverser;              // function variable
    var objectTraverserCheck;         // function variable
    var objectTraverserXml;           // function variable
    var prototypeMain;                // function variable
    var ROOT_visitor;                 // function variable
    var visit_Action;                 // function variable
    var visit_AwaitN;                 // function variable
    var visit_COA;                    // function variable
    var visit_COAException;           // function variable
    var visit_COAFlow;                // function variable
    var visit_COAFlowWithProbability; // function variable
    var visit_COARef;                 // function variable
    var visit_COASequencesGroup;      // function variable
    var visit_Dur;                    // function variable
    var visit_Federate;               // function variable
    var visit_FederateExecution;      // function variable
    var visit_Filter2COAElement;      // function variable
    var visit_Fork;                   // function variable
    var visit_Outcome;                // function variable
    var visit_OutcomeFilter;          // function variable
    var visit_Outcome2Filter;         // function variable
    var visit_ProbabilisticChoice;    // function variable
    var visit_RandomDur;              // function variable
    var visit_SyncPoint;              // function variable
    var visit_TerminateCOA;           // function variable

    pluginMetadata = JSON.parse(pluginMetadata);

/* ******************************************************************* */

/* DeploymentExporter */
/** (function-valued var of top-level function object)<br><br>

Returned Value: none<br><br>

Called By: ?<br><br>

This is the top-level function for the deployment exporter.<br><br>

The visitorNames object is a map from a node type to the name of the
visitor function to call for that node type.<br>

*/

    DeploymentExporter = function() /* NO ARGUMENTS */
    {
      this.federateTypes = // for ModelTraverserMixin.js
        this.federateTypes || {};
      this.pubSubInteractions = {};
      this.pubSubObjects = {};
      this.visitorNames =
        {Action: 'visit_Action',
         Attribute: 'visit_Attribute',
         AwaitN: 'visit_AwaitN',
         COA: 'visit_COA',
         COAException: 'visit_COAException',
         COAFlow: 'visit_COAFlow',
         COAFlowWithProbability: 'visit_COAFlowWithProbability',
         COARef: 'visit_COARef',
         COASequencesGroup: 'visit_COASequencesGroup',
         CPNFederate: 'visit_Federate',
         CppFederate: 'visit_Federate',
         CppImplFederate: 'visit_Federate',
         C2WInteractionRoot: 'visit_Interaction',
         Dur: 'visit_Dur',
         Federate: 'visit_Federate',
         FederateExecution: 'visit_FederateExecution',
         Filter2COAElement: 'visit_Filter2COAElement',
         Fork: 'visit_Fork',
         GatewayFederate: 'visit_Federate',
         GridLabDFederate: 'visit_Federate',
         Interaction: 'visit_Interaction',
         JavaFederate: 'visit_Federate',
         JavaImplFederate: 'visit_Federate',
         LabVIEWFederate: 'visit_Federate',
         MapperFederate: 'visit_Federate',
         ObjectRoot: 'visit_Object',
         OmnetFederate: 'visit_Federate',
         Outcome: 'visit_Outcome',
         OutcomeFilter: 'visit_OutcomeFilter',
         Outcome2Filter: 'visit_Outcome2Filter',
         Parameter: 'visit_Parameter',
         ProbabilisticChoice: 'visit_ProbabilisticChoice',
         RandomDur: 'visit_RandomDur',
         StaticInteractionPublish: 'visit_StaticInteractionPublish',
         StaticInteractionSubscribe: 'visit_StaticInteractionSubscribe',
         StaticObjectAttributePublish: 'visit_StaticObjectAttributePublish',
         StaticObjectAttributeSubscribe:
            'visit_StaticObjectAttributeSubscribe',
         StaticObjectPublish: 'visit_StaticObjectPublish',
         StaticObjectSubscribe: 'visit_StaticObjectSubscribe',
         SyncPoint: 'visit_SyncPoint',
         TerminateCOA: 'visit_TerminateCOA',
         TRNSYSFederate: 'visit_Federate'
        };
      this.postVisitorNames = {};
      PluginBase.call(this);
      ModelTraverserMixin.call(this);
      PubSubVisitors.call(this);
      RTIVisitors.call(this);

      this._jsonToXml = new JSON2XMLConverter.Json2xml();
      this.pluginMetadata = pluginMetadata;
    }; // end DeploymentExporter

/* ******************************************************************* */

    // Prototypal inheritance from PluginBase.
    DeploymentExporter.prototype = Object.create(PluginBase.prototype);
    DeploymentExporter.prototype.constructor = DeploymentExporter;
    DeploymentExporter.metadata = pluginMetadata;

/* ******************************************************************* */

/* objectTraverser */
/** (function-valued var of top-level function object)<br><br>

Returned Value: fed file text for the object and its descendants<br><br>

Called By:
  anonymous fed fom generator in DeploymentExporter.prototype.main<br>
  objectTraverser (recursively)<br><br>

This is a recursive function that generates fed fom text for the object
and its children.<br>

*/
    objectTraverser = function(     /* ARGUMENTS */
     /** (object) object to process */ object)
    {
      var objModel = {name: object.name,
                      attributes: object.attributes,
                      children: []};

      object.children.forEach(function(child)
      {
        objModel.children.push(objectTraverser(child));
      });
      return ejs.render(TEMPLATES["fedfile_simobject.ejs"], objModel);
    };

/* ******************************************************************* */

/* objectTraverserCheck */
/** (function-valued var of top-level function object)<br><br>

Returned Value: none<br><br>

Called By:<br>
  fomGenerator<br>
  objectTraverserCheck (recursively)<br><br>

This adds entries to pubSubObjects for all ancestors of objects that
already have entries.<br><br>

By calling itself recursively, this goes through the object tree (from
top down) but builds the pubSubObjectss from bottom up.<br><br>

For each object that has an entry in the federate.pubSubObjects:<br><br>

  If the parent already has an entry in the federate.pubSubObjects:<br>
    If object has non-zero mayPublish, the parent's mayPublish is
      set to 1.<br>
    If object has non-zero maySubscribe,
      the parent's maySubscribe is set to 1.<br><br>

  Otherwise, a new entry for parent is put into the federate.pubSubObjects
  with publish set to 0, subscribe set to 0, mayPublish set to the object's
  mayPublish and maySubscribe set to the object's maySubscribe.<br><br>

If the parent publishes or subscribes, an entry for the parent will
have been made previously in PubSubVisitors.<br><br>

The final effect is that any object that is an ancestor of any object
originally put on the pubSubObjects in PubSubVisitors is also on
pubSubObjects, with its publish, subscribe, mayPublish, and
maySubscribe values set appropriately.<br>

*/
    objectTraverserCheck = function( /* ARGUMENTS */
     /** the deployment exporter     */ depEx,
     /** (object) object to process  */ object)
    {
      var objectPubSub;
      var parentPubSub;

      object.children.forEach(function (child)
      {
        objectTraverserCheck(depEx, child);
      });
      if ((object.name != 'ObjectRoot') &&
          (object.id in depEx.pubSubObjects))
        {
          objectPubSub = depEx.pubSubObjects[object.id];
          if ((object.basePath in depEx.pubSubObjects))
            {
              parentPubSub = depEx.pubSubObjects[object.basePath];
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
              depEx.pubSubObjects[object.basePath] =
                {publish: 0,
                 subscribe: 0,
                 mayPublish: objectPubSub.mayPublish,
                 maySubscribe: objectPubSub.maySubscribe};
            }
        }
    }; // end objectTraverserCheck

/* ******************************************************************* */

/* objectTraverserXml */
/** (function-valued var of top-level function object)<br><br>

Returned Value: a string of XML representing the object
                and its descendants<br><br>

Called By:<br>
  fomGenerator<br>
  objectTraverserXml (recursively)<br><br>

This is a recursive function that builds the XML for the objects in
the deployment exporter.<br><br>

The function takes (1) a pointer to the deployment exporter, (2) an object
that may have children (which are also objects), and (3) a string of
blank space to use for indenting.<br><br>

The function begins by creating an objModel. The objModel is given the
same name and attributes as the object and is given children that are
XML code built by a recursive call to the function on the children of
the object.  Information for printing XML is added to the data for
each attribute of the object. Data regarding "sharing" for the XML is
derived from the deployment exporter information and the attribute
data.<br><br>

Then XML for the objModel is generated from the objModel (and saved)
by calling ejs.render using the fedfile_simobject_xml XML Template.<br><br>

Crosscuts are Publish or Subscribe links from a federate directly to
an attribute of an object. Crosscuts are handled by putting entries
for crosscuts (only) into the attribs property of the object data for
the deployment exporter. The code for crosscuts is mostly in the great
big "else" near the end of the function, but there is also code dealing
with crosscuts in two places before that. Setting the printIt property
of an attribute allows it to be printed (by fedfile_simobject_xml.ejs)
even when the attribute is an inherited property.<br>

*/

    objectTraverserXml = function(        /* ARGUMENTS */
     /** (object) the deployment exporter */ depEx,
     /** (object) object to process       */ object,
     /** (string) indentation space       */ space)
    {
      var objModel;
      var objPuBSub;
      var hasOwn;

      objModel = {name: object.name,
                  sharingXml: 0,
                  indent: space,
                  attributes: object.attributes,
                  children: []};

      objPuBSub = depEx.pubSubObjects[object.id];
      hasOwn = 0;
      // The attributes in the objModel are the attributes of the object.
      // Properties of attributes not related to XML generation are not
      // modified, but properties of attributes related to XML generation
      // are assigned as follows.
      objModel.attributes.forEach(function(attr)
      {
        attr.deliveryXml = ((attr.delivery === "reliable") ? "HLAreliable" :
                            "HLAbestEffort");
        attr.orderXml = ((attr.order === "timestamp") ? "TimeStamp" :
                         "Receive");
        if (!attr.inherited)
          {
            hasOwn = 1;
          }
      });
      // An object should publish if: (1) the data for it in the
      // federate information says publish or (2) the data says maybe
      // publish and one or more of the object's attributes is an own
      // attribute or (3) the data says there is publish crosscut.
      // Similarly for subscribing.
      if (objPuBSub && (objPuBSub.publish ||
                        (objPuBSub.mayPublish && hasOwn)))
        { // object publishes
          if (objPuBSub.subscribe || (objPuBSub.maySubscribe && hasOwn))
            { // object also subscribes
              objModel.sharingXml = "PublishSubscribe";
              objModel.attributes.forEach(function(attr)
              { // also set sharing for own attributes
                if (!attr.inherited)
                  {
                    attr.sharingXml = "PublishSubscribe";
                  }
              });
            }
          else
            { // object publishes but does not subscribe
              objModel.sharingXml = "Publish";
              objModel.attributes.forEach(function(attr)
              { // also set sharing for own attributes
                if (objPuBSub.attribs && (attr.id in objPuBSub.attribs))
                  { // if crosscut subscribes, upgrade to PublishSubscribe
                    if (objPuBSub.attribs[attr.id].subscribe)
                      {
                        attr.sharingXml = "PublishSubscribe";
                        objModel.sharingXml = "PublishSubscribe";
                      }
                  }
                else if (!attr.inherited)
                  { // otherwise mark the attribute as Publish if not inherited
                    attr.sharingXml = "Publish";
                  }
              });
            }
        }
      else if (objPuBSub && (objPuBSub.subscribe ||
                             (objPuBSub.maySubscribe && hasOwn)))
        { // object subscribes but does not publish
          objModel.sharingXml = "Subscribe";
          objModel.attributes.forEach(function(attr)
          { // also set sharing for own attributes
            if (objPuBSub.attribs && (attr.id in objPuBSub.attribs))
              { // if crosscut publishes, upgrade to PublishSubscribe
                if (objPuBSub.attribs[attr.id].publish)
                  {
                    attr.sharingXml = "PublishSubscribe";
                    objModel.sharingXml = "PublishSubscribe";
                  }
              }
            else if (!attr.inherited)
              { // otherwise mark the attribute as Subscribe if not inherited
                attr.sharingXml = "Subscribe";
              }
          });
        }
      else
        { // object neither publishes nor subscribes; deal with crosscuts
          objModel.sharingXml = "Neither";
          objModel.attributes.forEach(function(attr)
          {
            if (objPuBSub.attribs && (attr.id in objPuBSub.attribs))
              { // attribute is involved in a crosscut
                if (attr.inherited)
                  { // if not own attribute, set values and set flag to print
                    attr.deliveryXml = ((attr.delivery === "reliable") ?
                                        "HLAreliable" : "HLAbestEffort");
                    attr.orderXml = ((attr.order === "timestamp") ?
                                     "TimeStamp" : "Receive");
                    attr.printIt = 1; 
                  }
                if (objPuBSub.attribs[attr.id].publish)
                  { // some crosscut says publish
                    if (objPuBSub.attribs[attr.id].subscribe)
                      { // some other crosscut says subscribe
                        attr.sharingXml = "PublishSubscribe";
                        objModel.sharingXml = "PublishSubscribe";
                      }
                    else
                      { // there is no subscribe crosscut, so Publish
                        attr.sharingXml = "Publish";
                        if (objModel.sharingXml != "PublishSubscribe")
                          { // but do not change if already PublishSubscribe
                            objModel.sharingXml = "Publish";
                          }
                      }
                  }
                else if (objPuBSub.attribs[attr.id].subscribe)
                  { // is subscribe but not publish crosscut, so Subscribe
                    attr.sharingXml = "Subscribe";
                    if (objModel.sharingXml != "PublishSubscribe")
                      { // but do not change if already PublishSubscribe
                        objModel.sharingXml = "Subscribe";
                      }
                  }
              }
            else
              { // no publish, subscribe, or relevant crosscut
                attr.sharingXml = "Neither";
              }
          }); // end of function body and forEach
        } // end of else

      // Here, objectTraverserXml calls itself recursively to
      // generate XML for the children before generating
      // XML for the parent.
      // We do not want to include the FederateObject.
      object.children.forEach(function(child)
      {
        if ((child.name != "FederateObject") &&
            (child.id in depEx.pubSubObjects))
          {
            objModel.children.push
              (objectTraverserXml(depEx, child, space + "    "));
          }
      });
      // now generate XML for the parent if on pubSubObjects
      if (object.id in depEx.pubSubObjects)
        {
          return ejs.render(TEMPLATES["fedfile_simobject_xml.ejs"],
                            objModel);
        }
    }; // end objectTraverserXml

/* ******************************************************************* */

/* interactionTraverser */
/** (function-valued var of top-level function object)<br><br>

Returned Value: fed file text for the interaction and its descendants<br><br>

Called By:<br>
  fomProjectFedGenerator<br>
  interactionTraverser (recursively)<br><br>

This calls itself recursively to generate fed file text for the interaction
and its children.<br>

*/
    interactionTraverser = function(     /* ARGUMENTS */
     /** (object) interaction to process */ interaction)
    {
      var intModel = {interaction: interaction,
                      parameters: interaction.parameters,
                      children: []};
      interaction.children.forEach(function(child)
      {
        intModel.children.push(interactionTraverser(child));
      });
      return ejs.render(TEMPLATES["fedfile_siminteraction.ejs"], intModel);
    };

/* ******************************************************************* */

/* interactionTraverserCheck */
/** (function-valued var of top-level function object)<br><br>

Returned Value: none<br><br>

Called By:<br>
  fomGenerator<br>
  interactionTraverserCheck (recursively)<br><br>

This adds entries to pubSubInteractions for all ancestors of interactions
that already have entries.<br><br>

By calling itself recursively, this goes through the interaction tree
(from top down) but builds the pubSubInteractions from bottom up.<br><br>

If an interaction is on the pubSubInteractions but its parent is not,
an entry for the parent of the interaction is added to the
pubSubInteractions; the entry represents that the parent neither
publishes or subscribes. If the parent publishes or subscribes, an
entry for the parent will have been made previously in
PubSubVisitors.<br><br>

The final effect is that any interaction that is an ancestor of any
interaction originally put on the pubSubInteractions in PubSubVisitors
is also on pubSubInteractions.<br>

*/
    interactionTraverserCheck = function( /* ARGUMENTS */
     /** (object) the deployment exporter */ depEx,
     /** (object) interaction to process  */ interaction)
    {
      interaction.children.forEach(function (child)
      {
        interactionTraverserCheck(depEx, child);
      });
      if (interaction.name != 'InteractionRoot')
        {
          if ((interaction.id in depEx.pubSubInteractions) &&
              !(interaction.basePath in depEx.pubSubInteractions))
            {
              depEx.pubSubInteractions[interaction.basePath] =
                {publish: 0,
                 subscribe: 0};
            }
        }
    };

/* ******************************************************************* */

/* interactionTraverserXml */
/** (function-valued var of top-level function object)<br><br>

Returned Value: a string of XML representing the interaction and its
                descendants<br><br>

Called By:<br>
  fomGenerator<br>
  interactionTraverserXml (recursively)<br><br>

This is a recursive function that builds the XML for interactions in a
federate.<br><br>

The function takes information about the deployment exporter and takes
an interaction that may have children (which are also interactions).<br><br>

The function begins by creating an intModel. The intModel is given the
same name and parameters as the interaction and is given children that are
XML code built by a recursive call to the function on the children of
the interaction.  The intModel is also given other properties needed for
generating XML.<br><br>

Then XML for the intModel is generated from the intModel (and saved)
by calling ejs.render using the fedfile_siminteraction_xml XML Template.<br>

*/
    interactionTraverserXml = function(   /* ARGUMENTS */
     /** (object) the deployment exporter */ depEx,
     /** (object) interaction to process  */ interaction,
     /** (string) indentation space       */ space)
    {
      var intModel;
      var intPubSub;

      intModel = {name: interaction.name,
                  sharingXml: 0,
                  deliveryXml: 0,
                  orderXml: 0,
                  indent: space,
                  parameters: interaction.parameters,
                  children: []};
      intPubSub = depEx.pubSubInteractions[interaction.id];
      if (intPubSub && intPubSub.publish)
        {
          if (intPubSub.subscribe)
            {
              intModel.sharingXml = "PublishSubscribe";
            }
          else
            {
              intModel.sharingXml = "Publish";
            }
        }
      else if (intPubSub && intPubSub.subscribe)
        {
          intModel.sharingXml = "Subscribe";
        }
      else
        {
          intModel.sharingXml = "Neither";
        }
      if (interaction.delivery === "reliable")
        {
          intModel.deliveryXml = "HLAreliable";
        }
      else
        {
          interaction.deliveryXml = "HLAbestEffort";
        }
      if (interaction.order === "timestamp")
        {
          intModel.orderXml = "TimeStamp";
        }
      else
        {
          intModel.orderXml = "Receive";
        }
      // here interactionTraverserXml calls itself recursively to
      // generate XML for the children before generating
      // XML for the parent
      interaction.children.forEach(function(child)
      {
        if (child.id in depEx.pubSubInteractions)
          {
            intModel.children.push
              (interactionTraverserXml(depEx, child, space + "    "));
          }
      });

      // now generate XML for the parent if on pubSubInteractions
      if (interaction.id in depEx.pubSubInteractions)
        {
          return ejs.render(TEMPLATES["fedfile_siminteraction_xml.ejs"],
                            intModel);
        }
    }; // end interactionTraverserXml

/* ******************************************************************* */

/* prototypeMain */
/** (function-valued var of top-level function object)<br><br>

Returned Value: none<br><br>

Called By: ? This is called by an unknown function when executing the
deployment exporter is triggered<br><br>

This is the main function for the plugin to execute; it will perform
the execution.<br><br>

Use self to access core, project, result, logger etc from PluginBase.
These are all instantiated at this point.<br><br>

The callback always has to be called even if an error happened.<br>

*/

    prototypeMain = function(                                  /* ARGUMENTS */
     /** {function(string, plugin.PluginResult)} callback function */ callback)
    {
      var buildCppShGenerator;     // function variable
      var expConfigJsonGenerator;  // function variable
      var expListJsonGenerator;    // function variable
      var expModelJsonGenerator;   // function variable
      var expModelMiscGenerator;   // function variable
      var fedJsonGenerator;        // function variable
      var fedJsonTypeGenerator;    // function variable
      var fedmgrGenerator;         // function variable
      var finishExport;            // function variable
      var fomGenerator;            // function variable
      var fomProjectFedGenerator;  // function variable
      var generateFiles;           // function variable
      var log4j2XmlGenerator;      // function variable
      var NewcoaConfigJsonGenerator; // function variable
      var numberOfFileGenerators;  // counter used in generateFiles function
      var pomGenerator;            // function variable
      var pomModel = {};           // object
      var RTIridGenerator;         // function variable
      var runDefaultGenerator;     // function variable
      var runManagerGenerator;     // function variable
      var self;                    // deployment exporter function

      self = this;
      self.workingDir="/home/ubuntu/file-server";

      self.fileGenerators = [];
      self.fom_sheets = {};
      self.federates = [];
      self.interactions = {};
      self.interactionRoots = [];
      self.objects = {};
      self.objectRoots = [];
      self.attributes = {};

      // Experiment Related
      self.experimentModel = null; // initialized and built later
      self.experimentModelConfig = [ [] ];
      self.experimentPaths = [];

      // COA related
      self.coaNodes = [];
      self.coaEdges = [];
      self.coaPaths = {};
      self.coaPathNode = {};
      self.coaPathEdge = {};

      // COAS related
      self.coasNode = [ [] ];
      self.coasPath = [];

      // COA Sequence
      self.coaSequenceGroup = [ [] ];
      self.coaGroupNodes = [];

      self.experimentsGuid = [ [] ];

      self.projectName = self.core.getAttribute(self.rootNode, 'name');
      self.bindAddress = self.getCurrentConfig().bindAddress.trim();

      pomModel.projectName = self.projectName;
      pomModel.groupId = self.getCurrentConfig().groupId.trim();
      pomModel.projectVersion =
        self.getCurrentConfig().exportVersion.trim() +
        (self.getCurrentConfig().isRelease ? "" : "-SNAPSHOT");
      pomModel.cpswtVersion = self.getCurrentConfig().cpswtVersion;
      pomModel.repositoryUrlSnapshot =
        self.getCurrentConfig().repositoryUrlSnapshot;
      pomModel.repositoryUrlRelease =
        self.getCurrentConfig().repositoryUrlRelease;
      pomModel.federates = self.federates;

      pomModel.porticoPOM = {};
      pomModel.porticoPOM.artifactId = "portico";
      pomModel.porticoPOM.groupId = "org.porticoproject";
      pomModel.porticoPOM.version = self.getCurrentConfig().porticoReleaseNum;
      pomModel.porticoPOM.scope = "provided";

/* ******************************************************************* */

/* pomGenerator */
/** (function-valued var of prototypeMain)<br><br>

Returned Value: none<br><br>

Called By: ?<br><br>

This generates the pom.xml file.<br>

*/

      pomGenerator = function(                              /* ARGUMENTS */
       /** (object) set of files to add to                  */ artifact,
       /** {function(string, plugin.PluginResult)} callback */ callback)
      {
        pomModel['federatesByType'] = {};
        pomModel.federates.forEach(function(fed)
        {
          if (!pomModel['federatesByType'][fed.FederateType])
            {
              pomModel['federatesByType'][fed.FederateType] = [];
            }
          pomModel['federatesByType'][fed.FederateType].push(fed);
        });

        artifact.addFile('pom.xml',
                         ejs.render(TEMPLATES['execution_pom.xml.ejs'],
                                    pomModel),
                         function(err)
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
      }; // end pomGenerator

      // Add the pomGenerator function to the file generators.
      self.fileGenerators.push(pomGenerator);

/* ******************************************************************* */

/* fomProjectFedGenerator */
/** (function-valued var of prototypeMain)<br><br>

Returned Value: none<br><br>

Called By: ?<br><br>

This generates the fomProject.fed file.<br><br>

Processing the objectRoot(s) and the interactionRoot(s) processes all
objects and interactions.  There is normally only one objectRoot and
one interactionRoot.<br>

*/

      fomProjectFedGenerator = function(                    /* ARGUMENTS */
       /** (object) set of files to add to                  */ artifact,
       /** {function(string, plugin.PluginResult)} callback */ callback)
      {
        var fomModelFed =
          {federationname: self.projectName,
           version: self.getCurrentConfig().exportVersion.trim(),
           pocOrg: self.getCurrentConfig().groupId.trim(),
           objects: [],
           interactions: []};

        self.interactionRoots[0].children.forEach(function(inta)
        {
          fomModelFed.interactions.push(interactionTraverser(inta));
        });
        self.objectRoots[0].children.forEach(function(obj)
        {
          fomModelFed.objects.push(objectTraverser(obj));
        });

        artifact.addFile('fom/' + self.projectName + '.fed',
                         ejs.render(TEMPLATES['fedfile.fed.ejs'], fomModelFed),
                         function(err)
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
      }; // end fomProjectFedGenerator

      // Add the fomProjectFedGenerator function to the file generators.
      self.fileGenerators.push(fomProjectFedGenerator);

/* ******************************************************************* */

/* fomGenerator */
/** (function-valued var of prototypeMain)<br><br>

Returned Value: none<br><br>

Called By: ?<br><br>

This generates the XML FOM file.  Processing the objectRoot(s) and the
interactionRoot(s) processes all objects and interactions.  There is
normally only one objectRoot and one interactionRoot.<br>

*/
      fomGenerator = function(                              /* ARGUMENTS */
       /** (object) set of files to add to                  */ artifact,
       /** {function(string, plugin.PluginResult)} callback */ callback)
      {
        var today = new Date();
        var year = today.getFullYear();
        var month = (1 + today.getMonth());
        var day = today.getDate();
        var fomModelXml =
          {federationname: self.projectName,
           version: self.getCurrentConfig().exportVersion.trim(),
           pocOrg: self.getCurrentConfig().groupId.trim(),
           dateString: (year + "-" +
                        ((month < 10) ? "0" : "") + month + "-" +
                        ((day < 10) ? "0" : "") + day),
           objectsXml: [],
           interactionsXml: []};
        self.interactionRoots.forEach(function (interactionRoot)
        {
          interactionTraverserCheck(self, interactionRoot);
          fomModelXml.interactionsXml.push
            (interactionTraverserXml(self, interactionRoot, "    "));
        });
        self.objectRoots.forEach(function(objectRoot)
        {
          objectTraverserCheck(self, objectRoot);
          fomModelXml.objectsXml.push
            (objectTraverserXml(self, objectRoot, "    "));
        });
        // add fom XML to artifact
        artifact.addFile('fom/' + self.projectName + '.xml',
                         ejs.render(TEMPLATES['fedfile.xml.ejs'],
                                    fomModelXml),
                         function(err)
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
      }; // end fomGenerator

      // Add the fomGenerator function to the file generators.
      self.fileGenerators.push(fomGenerator);

/* ******************************************************************* */

/* NewcoaConfigJsonGenerator */
/** (function-valued var of prototypeMain)<br><br>

Returned Value: none<br><br>

Called By: ?<br><br>

This adds the conf/NewcoaConfig.json generator to the file generators.<br>  

*/

      NewcoaConfigJsonGenerator = function(                 /* ARGUMENTS */
       /** (object) set of files to add to                  */ artifact,
       /** {function(string, plugin.PluginResult)} callback */ callback)
      {
        var saveObj = {COAs: {}};

        self.coasPath.forEach(function(obj)
        {
          if (!saveObj.COAs.hasOwnProperty(obj))
            {
              saveObj.COAs[obj] = {nodes: [],
                                   edges: []};
            }
          self.coasNode[obj].forEach(function(nodes)
          {
            if (self.coaPathNode.hasOwnProperty(nodes))
              {
                var tempNode = {};
                tempNode = self.coaPathNode[nodes];
                if (tempNode.nodeType === "Outcome" ||
                    tempNode.nodeType === "Action")
                  {
                    tempNode.interactionName =
                      self.interactions[tempNode.interactionName].fullName;
                  }
                saveObj.COAs[obj].nodes.push(tempNode);
              }
            else if (self.coaPathEdge.hasOwnProperty(nodes))
              {
                self.coaPathEdge[nodes].fromNode =
                  self.coaPaths[self.coaPathEdge[nodes].fromNode];
                self.coaPathEdge[nodes].toNode =
                  self.coaPaths[self.coaPathEdge[nodes].toNode];
                saveObj.COAs[obj].edges.push(self.coaPathEdge[nodes]);
              }
          });
        });

        artifact.addFile('conf/NewcoaConfig.json',
                         JSON.stringify(saveObj.COAs, null, 2),
                         function(err)
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
      }; // end NewcoaConfigJsonGenerator

      // Add the NewcoaConfigJsonGenerator function to the file generators.
      self.fileGenerators.push(NewcoaConfigJsonGenerator);

/* ******************************************************************* */

/* expModelJsonGenerator */
/** (function-valued var of prototypeMain)<br><br>

Returned Value: none<br><br>

Called By: ?<br><br>

This adds a generator of json files to the file generators. For each
path in self.experimentPaths, the generator adds two files. One is
named coaSelection_[experimentmodel.name].json. The other is named
[experimentmodel.name].json. They are put in a directory named
[experimentmodel.name].<br>

*/

      expModelJsonGenerator = function(                     /* ARGUMENTS */
       /** (object) set of files to add to                  */ artifact,
       /** {function(string, plugin.PluginResult)} callback */ callback)
      {
        var response = [];

        if (self.experimentPaths.length != 0)
          {
            self.experimentPaths.forEach(function(objPath)
            {
              var experimentmodel =
                {name: "",
                 exptConfig: {'federateTypesAllowed': [],
                              'expectedFederates': [],
                              'lateJoinerFederates': [],
                              "coaDefinition": 'conf/' + 'NewcoaConfig.json',
                              'coaSelection': '',
                              "terminateOnCOAFinish": false,
                              "COASelectionToExecute":""}
                };
              var experimentmodelcoaselection = {};
              var coa_selection_name = [];
              var required_coa_selection_name = [];
              var coa_selection_nodes = [ [] ];
              var coa_group_comb = [ [] ];
              var cartesianproductarray;
              var cp;
              var cp_array;

              if (self.experimentsGuid.hasOwnProperty(objPath))
                {
                  self.experimentsGuid[objPath].forEach(function(coagroup)
                  {
                    var array = {SelectionName: "",
                                 SelectionID: "",
                                 coaNodes: []};
                    var cmb;
                    var  a;
                    var estr;

                    coa_selection_name = [];
                    self.coaGroupNodes[coagroup.guid].forEach(function(coanode)
                    {
                      coa_selection_name.push(coanode.name);
                      coa_selection_nodes[coanode.name] =
                        coa_selection_nodes[coanode.name] || [];
                      coa_selection_nodes[coanode.name].push(
                                        {Name: coanode.name,
                                         ID: coanode.guid});
                    });                            
                    cmb = combinations.combination(coa_selection_name,
                                                   coagroup.NumCOAsToSelect);
                    while (a = cmb.next())
                      {
                        estr = a.toString();
                        estr = estr.replace(/,/g, "-");
                        coa_group_comb[coagroup.guid] =
                          coa_group_comb[coagroup.guid] || [];
                        coa_group_comb[coagroup.guid].push(estr);
                      }
                  });

                  cartesianproductarray = [ [] ];
                  self.experimentsGuid[objPath].forEach(function(coagroup)
                  {
                    cartesianproductarray.push(coa_group_comb[coagroup.guid]);
                  });

                  cartesianproductarray.shift(1);
                  cp = combinations.cartesianProduct.apply
                    (this, cartesianproductarray);
                  cp_array = cp.toArray();
                  cp_array.forEach(function(a)
                  {
                    var bstr = a.toString();
                    bstr = bstr.replace(/,/g, "-");
                    experimentmodelcoaselection[bstr] =
                      experimentmodelcoaselection[bstr] || [];
                    a.forEach(function(element)
                    {
                      element.split("-").forEach(function(ele)
                      {
                        experimentmodelcoaselection[bstr].push
                          (coa_selection_nodes[ele]);
                      });
                    });
                  });
                } //closes if (self.experimentsGuid.hasOwnProperty(objPath))

              self.experimentModelConfig[objPath].forEach(function(expSet)
              {
                var reference_name =
                  self.core.getAttribute(expSet, "name").split("-")[0];
                experimentmodel.name =
                  self.core.getAttribute(self.core.getParent(expSet), "name");
                experimentmodel.exptConfig.federateTypesAllowed.push
                  (reference_name);
                if (!self.core.getAttribute(expSet, "isLateJoiner"))
                  {
                    experimentmodel.exptConfig.expectedFederates.push(
                          {"federateType": reference_name,
                           "count": self.core.getAttribute(expSet, "count")});
                  }
                else
                  {
                    experimentmodel.exptConfig.lateJoinerFederates.push(
                          {"federateType": reference_name,
                           "count": self.core.getAttribute(expSet, "count")});
                  }
              });

              experimentmodel.exptConfig.coaSelection =
                'conf/' + experimentmodel.name.toLowerCase() +
                '/coaSelection_' + experimentmodel.name.toLowerCase() +
                '.json';
              // This will be the coaselection for the experiment
              artifact.addFile('conf/' + experimentmodel.name.toLowerCase() +
                               '/coaSelection_' +
                               experimentmodel.name.toLowerCase() +
                               '.json',
                               JSON.stringify
                               (experimentmodelcoaselection, null, 2),
                               function(err)
                               {
                                 response.push(err);
                                 if (response.length ==
                                     self.experimentPaths.length)
                                   {
                                     if (response.indexOf(err) == -1)
                                       {
                                         callback(err);
                                       }
                                     else
                                       {
                                         callback();
                                       }
                                   }
                               });
              experimentmodel.exptConfig.COASelectionToExecute =
                Object.keys(experimentmodelcoaselection)[0];
              artifact.addFile('conf/' + experimentmodel.name.toLowerCase() +
                               "/"+ experimentmodel.name.toLowerCase() +
                               '.json',
                               JSON.stringify
                               (experimentmodel.exptConfig, null, 2),
                               function(err)
                               {
                                 response.push(err);
                                 if (response.length ==
                                     self.experimentPaths.length)
                                   {
                                     if (response.indexOf(err) == -1)
                                       {
                                         callback(err);
                                       }
                                     else
                                       {
                                         callback();
                                       }
                                   }
                               });
            }); // closes self.experimentPaths.forEach(function(objPath)
          } // closes if (self.experimentPaths.length != 0)
        else
          {
            callback();
          }
      }; // end expModelJsonGenerator

      // Add the expModelJsonGenerator function to the file generators.
      self.fileGenerators.push(expModelJsonGenerator);

/* ******************************************************************* */

/* expModelMiscGenerator */
/** (function-valued var of prototypeMain)<br><br>

Returned Value: none<br><br>

Called By: ?<br><br>

For each path in self.experimentPaths, this generator adds three files.
The files are put in a directory named [experimentmodel.name]. The files
are named:<br>
 docker-compose.yml<br>
 start.sh<br>
 federatelist.txt<br><br>

The anonymous function passed to getDockerDetails accesses variables
that are in scope at the time expModelGenerator is executed.<br>

*/

      expModelMiscGenerator = function(                     /* ARGUMENTS */
       /** (object) set of files to add to                  */ artifact,
       /** {function(string, plugin.PluginResult)} callback */ callback)
      {
        // call getDockerDetails using anonymous function as argument
        self.getDockerDetails(function(err, DockerDetails)
        {
          var response = [];

          if (err)
            {
              callback(err, self.result);
              return;
            }
          self.inputPrefix = DockerDetails.DIR + '/input/';
          self.outputPrefix = DockerDetails.DIR + '/output/';           
          self.dockerInfoMap =
            {'JavaFederate': {'name': DockerDetails.Java,
                              'profile':"ExecJava"},
             'CppFederate': {'name': DockerDetails.CPP,
                             'profile':"CppFed"},
             'FedManager': {'name': DockerDetails.FedMgr,
                            'profile':"ExecJava"}
            };
          if (self.experimentPaths.length != 0)
            {
              self.experimentPaths.forEach(function (objPath)
              {
                var experimentmodel =
                  {name: "",
                   exptConfig: {'federateTypesAllowed': []}};
                var experimentmodelcoaselection = {};
                self.experimentModelConfig[objPath].forEach(function(expSet)
                {
                  var reference_name; // reference name or experiment name
                  var temp;
                  var DockerImageType;
                  reference_name =
                    self.core.getAttribute(expSet, "name").split("-")[0];
                  experimentmodel.name =
                    self.core.getAttribute(self.core.getParent(expSet), "name");
                  temp =
                    self.federates.filter(function(key)
                    {
                      if (key["name"] == reference_name)
                        {
                          return(key["FederateType"]);
                        }
                    });
                  DockerImageType = temp[0].FederateType;
                  experimentmodel.exptConfig.federateTypesAllowed.push
                    ({name:reference_name,
                      type: DockerImageType,
                      count :self.core.getAttribute(expSet, "count")});
                });

                self.dockerFileData =
                  ejs.render(TEMPLATES['dockerFileTemplate.ejs'],
                             {cpswtng_archiva_ip: DockerDetails.cpswtng_archiva,
                              inputPrefix: self.inputPrefix,
                              outputPrefix: self.outputPrefix,
                              fedInfos: experimentmodel.exptConfig.
                                 federateTypesAllowed,
                              dockerInfoMap: self.dockerInfoMap});

                experimentmodel.exptConfig.COASelectionToExecute =
                  Object.keys(experimentmodelcoaselection)[0];  
                artifact.addFile('conf/' +
                                 experimentmodel.name.toLowerCase() +
                                 "/"+ "docker-compose.yml",
                                 self.dockerFileData,
                                 function(err)
                                 {
                                   response.push(err);
                                   if (response.length ==
                                       self.experimentPaths.length)
                                     {
                                       if (response.indexOf(err) == -1)
                                         {
                                           callback(err);
                                         }
                                       else
                                         {
                                           callback();
                                         }
                                     }
                                 });

                artifact.addFile('conf/' +
                                 experimentmodel.name.toLowerCase() +
                                 "/"+ "start.sh",
                                 ejs.render(TEMPLATES['startScript.ejs'], {}),
                                 function(err)
                                 {
                                   response.push(err);
                                   if (response.length ==
                                       self.experimentPaths.length)
                                     {
                                       if (response.indexOf(err) == -1)
                                         {
                                           callback(err);
                                         }
                                       else
                                         {
                                           callback();
                                         }
                                     }
                                 });

                artifact.addFile('conf/' +
                                 experimentmodel.name.toLowerCase() +
                                 "/"+ "federatelist.txt",
                                 ejs.render(TEMPLATES['federatelist.ejs'],
                                            {
                                            cpswtng_archiva_ip:
                                              DockerDetails.cpswtng_archiva,
                                            inputPrefix: self.inputPrefix,
                                            outputPrefix: self.outputPrefix,
                                            fedInfos:
                                              experimentmodel.exptConfig.
                                                federateTypesAllowed,
                                            dockerInfoMap: self.dockerInfoMap}
                                            ),
                                 function(err)
                                 {
                                   response.push(err)
                                     if (response.length ==
                                         self.experimentPaths.length)
                                       {
                                         if (response.indexOf(err) == -1)
                                           {
                                             callback(err);
                                           }
                                         else
                                           {
                                             callback();
                                           }
                                       }
                                 });
              }); // closes self.experimentPaths.forEach(function (objPath)
            } // closes if (self.experimentPaths.length != 0)
          else
            {
              callback();
            }
        }); // closes call to self.getDockerDetails
      }; // end expModelMiscGenerator

      // Add the expModelMiscGenerator function to the file generators.
      self.fileGenerators.push(expModelMiscGenerator);

/* ******************************************************************* */

/* expListJsonGenerator */
/** (function-valued var of prototypeMain)<br><br>

Returned Value: none<br><br>

Called By: ?<br><br>

This generates a file named experimentlist.json. It is put in the conf
directory.<br>

*/

      expListJsonGenerator = function(                      /* ARGUMENTS */
       /** (object) set of files to add to                  */ artifact,
       /** {function(string, plugin.PluginResult)} callback */ callback)
      {
        var experimentlist = [];
        if (self.experimentPaths.length != 0)
          {
            self.experimentPaths.forEach(function(objPath)
            {
              self.experimentModelConfig[objPath].forEach(function(expSet)
              {
                if (experimentlist.indexOf(self.core.
                      getAttribute(self.core.getParent(expSet), "name") )== -1)
                  {
                    experimentlist.push(self.
                      core.getAttribute(self.core.getParent(expSet), "name"));
                  }
              });
            });
          }

        artifact.addFile('conf/experimentlist.json',
                         JSON.stringify(experimentlist, null, 2),
                         function(err)
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
      }; // end expListJsonGenerator

      // Add the expListJsonGenerator function to the file generators.
      self.fileGenerators.push(expListJsonGenerator);

/* ******************************************************************* */

/* RTIridGenerator */
/** (function-valued var of prototypeMain)<br><br>

Returned Value: none<br><br>

Called By: ?<br><br>

This generates a file named RTI.rid.<br>

*/

      RTIridGenerator = function(                           /* ARGUMENTS */
       /** (object) set of files to add to                  */ artifact,
       /** {function(string, plugin.PluginResult)} callback */ callback)
      {
        artifact.addFile('RTI.rid',
                         ejs.render(TEMPLATES['rti.rid.ejs'], self),
                         function(err)
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
      }; // end RTIridGenerator

      // Add the RTIridGenerator function to the file generators.
      self.fileGenerators.push(RTIridGenerator);

/* ******************************************************************* */

/* log4j2XmlGenerator */
/** (function-valued var of prototypeMain)<br><br>

Returned Value: none<br><br>

Called By: ?<br><br>

This generates a file named log4j2.xml. It is put in the conf directory.<br>

*/

      log4j2XmlGenerator = function(                        /* ARGUMENTS */
       /** (object) set of files to add to                  */ artifact,
       /** {function(string, plugin.PluginResult)} callback */ callback)
      {
        var java_implLog = {};
        java_implLog.projectName = self.projectName;
        artifact.addFile('conf/log4j2.xml',
                         ejs.render(TEMPLATES['log4j2.xml.ejs'],
                                    self),
                         function(err)
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
      }; // end log4j2XmlGenerator

      // Add the log4j2XmlGenerator function to the file generators.
      self.fileGenerators.push(log4j2XmlGenerator);

/* ******************************************************************* */

/* initialize self.experimentModel */

      self.experimentModel = {'script': {'federateTypesAllowed': [],
                                         'expectedFederates': [],
                                         'lateJoinerFederates': []}};

/* ******************************************************************* */

/* expConfigJsonGenerator */
/** (function-valued var of prototypeMain)<br><br>

Returned Value: none<br><br>

Called By: ?<br><br>

This generates a file named experimentConfig.json. It is put in the
conf/default directory.<br>

*/

      expConfigJsonGenerator = function(                    /* ARGUMENTS */
       /** (object) set of files to add to                  */ artifact,
       /** {function(string, plugin.PluginResult)} callback */ callback)
      {
        self.federates.forEach(function(fed)
        {
          self.experimentModel.script.federateTypesAllowed.push(fed.name);
          self.experimentModel.script.expectedFederates.push(
                                                 {"federateType": fed.name,
                                                  "count": 1});
          self.experimentModel.script.lateJoinerFederates.push(
                                                 {"federateType": fed.name,
                                                  "count": 0});
        });
        artifact.addFile('conf/default/experimentConfig.json',
                         JSON.stringify(self.experimentModel.script, null, 2),
                         function(err)
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
      }; // end expConfigJsonGenerator

      // Add the expConfigJsonGenerator function to the file generators.
      self.fileGenerators.push(expConfigJsonGenerator);

/* ******************************************************************* */

/* runDefaultGenerator */
/** (function-valued var of prototypeMain)<br><br>

Returned Value: none<br><br>

Called By: ?<br><br>

This generates a file named run-default.sh.<br>

*/

      runDefaultGenerator = function(                       /* ARGUMENTS */
       /** (object) set of files to add to                  */ artifact,
       /** {function(string, plugin.PluginResult)} callback */ callback)
      {
        var renderContext = {federates: self.federates};

        artifact.addFile('run-default.sh',
                         ejs.render(TEMPLATES['run-default.sh.ejs'],
                                    renderContext),
                         function(err)
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
      }; // end runDefaultGenerator

      // Add the runDefaultGenerator function to the file generators.
      self.fileGenerators.push(runDefaultGenerator);

/* ******************************************************************* */

/* runManagerGenerator */
/** (function-valued var of prototypeMain)<br><br>

Returned Value: none<br><br>

Called By: ?<br><br>

This generates a file named run-manager.sh; that file is a script to
run just the federation manager.<br>

*/

      runManagerGenerator = function(                       /* ARGUMENTS */
       /** (object) set of files to add to                  */ artifact,
       /** {function(string, plugin.PluginResult)} callback */ callback)
      {
        artifact.addFile('run-manager.sh',
                         ejs.render(TEMPLATES['run-manager.sh.ejs'],
                                    {}),
                         function(err)
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
      }; // end runManagerGenerator

      // Add the runManagerGenerator function to the file generators.
      self.fileGenerators.push(runManagerGenerator);

/* ******************************************************************* */

/* buildCppShGenerator */
/** (function-valued var of prototypeMain)<br><br>

Returned Value: none<br><br>

Called By: ?<br><br>

This generates a file named build-cpp.sh; that file is a script to
prepare C++ federates for execution.<br>

*/

      buildCppShGenerator = function(                       /* ARGUMENTS */
       /** (object) set of files to add to                  */ artifact,
       /** {function(string, plugin.PluginResult)} callback */ callback)
      {
        artifact.addFile('build-cpp.sh',
                         ejs.render(TEMPLATES['build-cpp.sh.ejs'],
                                    {}),
                         function(err)
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
      }; // end buildCppShGenerator

      // Add the buildCppShGenerator function to the file generators.
      self.fileGenerators.push(buildCppShGenerator);

/* ******************************************************************* */

/* fedJsonTypeGenerator */
/** (function-valued var of prototypeMain)<br><br>

Returned Value: none<br><br>

Called By: ?<br><br>

This generates a json file for each path in self.experimentPaths.<br><br>

First, the generator builds a federateConfigurations array containing
an entry for each path in self.experimentPaths. Then, for each entry
in federateConfigurations, the generator generates a file named
[federateType].json; the file is put in the conf/<experimentName>
directory.<br><br>

Comments from another programmer (validity unknown)<br><br>

1. Regarding setting the experimentName:
    This is wrong (and also how it's been done everywhere) because a user
    can change the name field. This should use self.core.getPointerPath
    on 'ref' to get the pointer to the federate node. However, I have no
    idea how to get the WebGME node from its string path.<br><br>

2. Regarding the filePath in federateConfiguration
     filePath needs work because if an experiment is
     called 'default' I assume it breaks terribly.<br>

*/

      fedJsonTypeGenerator = function(                      /* ARGUMENTS */
       /** (object) set of files to add to                  */ artifact,
       /** {function(string, plugin.PluginResult)} callback */ callback)
      {
        if (self.experimentPaths.length != 0)
          {
            var response = [];
            var federateConfigurations = [];
            // each element is one configuration file to generate

            var federateLookup = {};
            // to speed up access to federate attributes

            self.federates.forEach(function(federate)
            {
              federateLookup[federate.name] = federate;
            });

            self.experimentPaths.forEach(function(experimentPath)
            {
                self.experimentModelConfig[experimentPath].
                  forEach(function(federateReference)
                  {
                    var experimentName;
                    var federateType;
                    var federateJsonObject;
                    var federateConfiguration;

                    experimentName =
                      self.core.getAttribute(self.core.
                                             getParent(federateReference),
                                             "name");
                   federateType =
                      self.core.getAttribute(federateReference, "name").
                      split("-")[0];

                    federateJsonObject =
                      {"federateRTIInitWaitTimeMs": 200,
                       "federateType": federateType,
                       "federationId": self.projectName,
                       "isLateJoiner": self.core.getAttribute(
                                         federateReference, "isLateJoiner"),
                       "lookAhead": federateLookup[federateType].Lookahead,
                       "stepSize": federateLookup[federateType].Step};
                    federateConfiguration =
                      {"jsonObject": federateJsonObject,
                       "filePath": "conf/" + experimentName.toLowerCase() +
                       "/" + federateType.toLowerCase() + ".json"};
                    federateConfigurations.push(federateConfiguration);
                  });
            }); //closes self.experimentPaths.forEach(function(experimentPath)

            federateConfigurations.forEach(function(configuration)
            {
              artifact.addFile(configuration.filePath,
                               JSON.stringify(configuration.jsonObject,
                                              null, 2),
                               function(err)
                               {
                                 response.push(err);
                                 if (response.length ==
                                     federateConfigurations.length)
                                   {
                                     if (response.indexOf(err) == -1)
                                       {
                                         callback(err);
                                       }
                                     else
                                       {
                                         callback();
                                       }
                                   }
                               });
            });
          } // closes if (self.experimentPaths.length != 0)
        else
          {
            callback();
          }
      }; // end fedJsonTypeGenerator

      // Add the fedJsonTypeGenerator function to the file generators.
      self.fileGenerators.push(fedJsonTypeGenerator);

/* ******************************************************************* */

/* fedJsonGenerator */
/** (function-valued var of prototypeMain)<br><br>

Returned Value: none<br><br>

Called By: ?<br><br>

For each federate, fed, in self.federates, this generates a
configuration file named [fed.name].json; the file is put in the
conf/default directory.<br>

*/

      fedJsonGenerator = function(                          /* ARGUMENTS */
       /** (object) set of files to add to                  */ artifact,
       /** {function(string, plugin.PluginResult)} callback */ callback)
      {
        var FederateJsonModel = {"federateRTIInitWaitTimeMs": 200,
                                 "federateType": "",
                                 "federationId": self.projectName,
                                 "isLateJoiner": false,
                                 "lookAhead": 0.1,
                                 "stepSize": 1.0};
        var response = [];
        self.federates.forEach(function(fed)
        {
          FederateJsonModel.lookAhead = fed.Lookahead;
          FederateJsonModel.stepSize = fed.Step;
          FederateJsonModel.federateType = fed.name;
          artifact.addFile('conf/default/' + fed.name.toLowerCase() + '.json',
                           JSON.stringify(FederateJsonModel, null, 2),
                           function(err)
                           {
                             response.push(err);
                             if (response.length == self.federates.length)
                               {
                                 if (response.indexOf(err) == -1)
                                   {
                                     callback(err);
                                   }
                                 else
                                   {
                                     callback();
                                   }
                               }
                           });
        });
      }; // end fedJsonGenerator

      // Add the fedJsonGenerator function to the file generators.
      self.fileGenerators.push(fedJsonGenerator);

/* ******************************************************************* */

/* fedmgrGenerator */
/** (function-valued var of prototypeMain)<br><br>

Returned Value: none<br><br>

Called By: ?<br><br>

This generates a configuration file named fedmgrconfig.json; the file is
put in the conf directory.<br>

*/

      fedmgrGenerator = function(                           /* ARGUMENTS */
       /** (object) set of files to add to                  */ artifact,
       /** {function(string, plugin.PluginResult)} callback */ callback)
      {
        var fedmgrConfig =
          {'script': {"federateRTIInitWaitTimeMs": 200,
                      "federateType": "FederationManager",
                      "federationId": self.projectName,
                      "isLateJoiner": true,
                      "lookAhead": 0.1,
                      "stepSize": 1.0,
                      "bindHost": "0.0.0.0",
                      "port": 8083,
                      "controlEndpoint": "/fedmgr",
                      "federatesEndpoint": "/federates",
                      "federationEndTime": 0.0,
                      "realTimeMode": true,
                      "fedFile": "fom/" + self.projectName + '.fed',
                      "experimentConfig":
                        "conf/default/experimentConfig.json"}};

        artifact.addFile('conf/fedmgrconfig.json',
                         JSON.stringify(fedmgrConfig.script, null, 2),
                         function(err)
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
      }; // end fedmgrGenerator

      // Add the fedmgrGenerator function to the file generators.
      self.fileGenerators.push(fedmgrGenerator);

/* ******************************************************************* */

/* generateFiles */
/** (function-valued var of prototypeMain)<br><br>

Returned Value: none<br><br>

Called By:<br>
  finishExport<br>
  generateFiles (recursively)<br><br>

This generates the text of files to be included in the output; it executes
one file generating function on each recursive call.<br>

*/

      generateFiles = function(                              /* ARGUMENTS */
       /** (object) set of files to add to                   */ artifact,
       /** (array) of functions that generate files          */ fileGenerators,
       /** (function) to call when done with file generators */ doneBack)
      {
        if (numberOfFileGenerators > 0)
          {
            fileGenerators[fileGenerators.length -
                           numberOfFileGenerators](artifact, function(err)
              {
                if (err)
                  {
                    callback(err, self.result);
                    return;
                  }
                numberOfFileGenerators--;
                if (numberOfFileGenerators > 0)
                  {
                    generateFiles(artifact, fileGenerators, doneBack);
                  }
                else
                  {
                    doneBack();
                  }
              });
          }
        else
          {
            doneBack();
          }
      }; // end generateFiles

/* ******************************************************************* */

/* finishExport */
/** (function-valued var of prototypeMain)<br><br>

Returned Value: none unless there is an error<br><br>

Called By: anonymous function used as an argument to
  visitAllChildrenFromRootContainer<br><br>

After all nodes have been visited, this function uses the data structures
that have been built to generate and export files.<br>

*/
      finishExport = function(                  /* ARGUMENTS */
       /** (string) an error string or null (?) */ err)
      {
        var artifact;
        var idx;
        var artifactMsg;

        if (err)
          {
            return callback(err, self.result);
          }
        artifact =
          self.blobClient.createArtifact
            (self.projectName.trim().replace(/\s+/g, '_') + '_deployment');
        numberOfFileGenerators = self.fileGenerators.length;
        if (numberOfFileGenerators > 0)
          {
            generateFiles(artifact, self.fileGenerators, function(err)
            {
              if (err)
                {
                  callback(err, self.result);
                  return;
                }
              self.blobClient.saveAllArtifacts(function(err, hashes)
              {
                if (err)
                  {
                    callback(err, self.result);
                    return;
                  }
                // Next save all the artifacts to a directory location.
                for (idx = 0; idx < hashes.length; idx++)
                  {
                    self.result.addArtifact(hashes[idx]);
                    artifactMsg = 'Deployment package ' +
                      self.blobClient.artifacts[idx].name +
                      ' was generated with id:[' + hashes[idx] + ']';
                    self.createMessage(null, artifactMsg);
                  };
                self.result.setSuccess(true);
                callback(null, self.result);
              }); //closes self.blobClient.saveAllArtifacts(...)
            }); // closes generateFiles(...)
          }// closes if (numberOfFileGenerators > 0)
        else
          {
            self.result.setSuccess(true);
            callback(null, self.result);
          }
      }; // end finishExport

/* ******************************************************************* */

/** call visitAllChildrenFromRootContainer

This is a call to the visitAllChildrenFromRootContainer function which
is defined in ModelTraverserMixin.js. The anonymous function is the second
argument. It is not clear why the block under "if (err)" differs from
the corresponding block in the FederatesExporter, which calls callback
but does not return it.

*/

      self.visitAllChildrenFromRootContainer(self.rootNode, function(err)
      {
        if (err)
          {
            return callback(err, self.result);
          }
        else
          {
            finishExport(err);
          }
      });

/* ******************************************************************* */

    }; // end prototypeMain

/* ******************************************************************* */

    DeploymentExporter.prototype.main = prototypeMain;

/* ******************************************************************* */

/* getDockerDetails */
/** (function-valued var of top-level function object)<br><br>

Returned Value: whatever deferred.promise.nodeify(callback) returns<br><br>

Called By: expModelMiscGenerator<br><br>

Where this is called, the callback function adds a file generator to the
file generators.<br>

*/

    getDockerDetails = function(                      /* ARGUMENTS */
     /** {function(string, object)} callback function */ callback)
    {
      var deferred;
      var req;

      deferred = Q.defer();
      req = superagent.get(this.blobClient.origin +
                           '/api/componentSettings/DockerDetails');
      if (typeof this.blobClient.webgmeToken === 'string')
        {
          // running on the server; set the token.
          req.set('Authorization', 'Bearer ' + this.blobClient.webgmeToken);
        }
      else
        {
          //running inside browser; cookie will be used at request..
        }

      req.end(function(err, res)
      {
        if (err)
          {
            deferred.reject(err);
          }
        else
          {
            deferred.resolve(res.body);
          }
      });
      return deferred.promise.nodeify(callback);
    }; // end getDockerDetails

    DeploymentExporter.prototype.getDockerDetails = getDockerDetails;

/* ******************************************************************* */

/* visit_FederateExecution */
/** (function-valued var of top-level function object)<br><br>

Returned Value: the context argument padded and possibly changed<br><br>

Called By: atModelNode in ModelTraverserMixin.js if the node being
processed is a FederateExecution node<br><br>

This is the visitor function for a FederateExecution node.<br>

*/

    visit_FederateExecution = function(             /* ARGUMENTS */
     /** (webgme node) a FederateExecution node     */ node,
     /** (webgme node) parent of node               */ parent,
     /** (object) a context object, may be modified */ context)
    {
      var self = this;

      console.log('in visit_FederateExecution');
      if (self.experimentPaths.indexOf(self.core.getGuid(parent)) === -1)
        {
          self.experimentPaths.push(self.core.getGuid(parent));
        }
      self.experimentModelConfig[self.core.getGuid(parent)] =
        self.experimentModelConfig[self.core.getGuid(parent)] || [];
      self.experimentModelConfig[self.core.getGuid(parent)].push(node);
      return {context: context};
    };

    DeploymentExporter.prototype.visit_FederateExecution =
      visit_FederateExecution;

/* ******************************************************************* */

/* addCoaNode */
/** (function-valued var of top-level function object)<br><br>

Returned Value: none<br><br>

Called By:<br>
  DeploymentExporter.prototype.visit_Action<br>
  DeploymentExporter.prototype.visit_Fork<br>
  DeploymentExporter.prototype.visit_ProbabilisticChoice<br>
  DeploymentExporter.prototype.visit_SyncPoint<br>
  DeploymentExporter.prototype.visit_Dur<br>
  DeploymentExporter.prototype.visit_RandomDur<br>
  DeploymentExporter.prototype.visit_AwaitN<br>
  DeploymentExporter.prototype.visit_Outcome<br>
  DeploymentExporter.prototype.visit_OutcomeFilter<br>
  DeploymentExporter.prototype.visit_TerminateCOA<br><br>

This adds properties to the obj argument and to self.<br>

*/

    addCoaNode = function( /* ARGUMENTS */
     /** a webGME node     */ node,
     /** an object         */ obj)
    {
      var self = this;

      obj.name = self.core.getAttribute(node, 'name');
      obj.nodeType = ((obj.name === 'CPSWT') ? 'CPSWT' :
                      (obj.name === 'CPSWTMeta') ? 'CPSWTMeta' :
                      self.core.getAttribute(self.getMetaType(node), 'name'));
      obj.ID = self.core.getGuid(node);
      self.coaNodes.push(obj);
      self.coaPaths[self.core.getPath(node)] = self.core.getGuid(node);
      self.coaPathNode[self.core.getPath(node)] = obj;
    };

    DeploymentExporter.prototype.addCoaNode = addCoaNode;

/* ******************************************************************* */

/* visit_Action */
/** (function-valued var of top-level function object)<br><br>

Returned Value: the context argument padded and possibly changed<br><br>

Called By: atModelNode in ModelTraverserMixin.js if the node being
processed is an Action node<br><br>

This is the visitor function for an action node.<br>

*/

    visit_Action = function(                        /* ARGUMENTS */
     /** (webgme node) an Action node               */ node,
     /** (webgme node)? not used                    */ parent,
     /** (object) a context object, may be modified */ context)
    {
      var self = this;
      var obj = {interactionName: self.core.getPointerPath(node, "ref")};
      var paramValues = self.core.getAttribute(node, 'ParamValues');

      console.log('in visit_Action');
      paramValues.split(" ").forEach(function(param)
      {
        try {obj[param.split('=')[0]] = param.split('=')[1].split('"')[1];}
        catch (err)
          {

          }
      });

      self.addCoaNode(node, obj);
      return {context: context};
    };

    DeploymentExporter.prototype.visit_Action = visit_Action;

/* ******************************************************************* */

/* visit_COARef */
/** (function-valued var of top-level function object)<br><br>

Returned Value: the context argument padded and possibly changed<br><br>

Called By: atModelNode in ModelTraverserMixin.js if the node being
processed is a COARef node<br><br>

This is the visitor function for a COARef node.<br>

*/

    visit_COARef = function(                        /* ARGUMENTS */
     /** (webgme node) a COARef node                */ node,
     /** (webgme node) parent of node               */ parent,
     /** (object) a context object, may be modified */ context)
    {
      var self = this;
      var obj = {};

      console.log('in visit_COARef');
      self.core.loadPointer(node, "ref", function(err, result)
      {
        if (err)
          {
          }
        else
          {
            obj.guid = self.core.getGuid(result);
            obj.name = self.core.getAttribute(result, "name");
            self.coaGroupNodes[self.core.getGuid(parent)] =
              self.coaGroupNodes[self.core.getGuid(parent)] || [];
            self.coaGroupNodes[self.core.getGuid(parent)].push(obj);
          }
      });
      return {context: context};
    };

    DeploymentExporter.prototype.visit_COARef = visit_COARef;

/* ******************************************************************* */

/* visit_COASequencesGroup */
/** (function-valued var of top-level function object)<br><br>

Returned Value: the context argument padded and possibly changed<br><br>

Called By: atModelNode in ModelTraverserMixin.js if the node being
processed is a COASequencesGroup node<br><br>

This is the visitor function for a COASequencesGroup node.<br>

*/

    visit_COASequencesGroup = function(             /* ARGUMENTS */
     /** (webgme node) a COASequencesGroup node     */ node,
     /** (webgme node) parent of node               */ parent,
     /** (object) a context object, may be modified */ context)
    {
      var self = this;
      var obj = {};
      var parentGuid = self.core.getGuid(parent);

      console.log('in visit_COASequencesGroup');
      obj.guid = self.core.getGuid(node);
      obj.name = self.core.getAttribute(node, "name");
      obj.SelectAllCOAsInEachRun =
        self.core.getAttribute(node, "SelectAllCOAsInEachRun");
      obj.NumCOAsToSelect = self.core.getAttribute(node, "NumCOAsToSelect");
      obj.experiment = self.core.getAttribute(parent, "name");
      self.coaSequenceGroup[obj.guid] = self.coaSequenceGroup[obj.guid] || [];
      self.coaSequenceGroup[obj.guid] = obj;
      self.experimentsGuid[parentGuid] = self.experimentsGuid[parentGuid] || [];
      self.experimentsGuid[parentGuid].push(obj);
      return {context: context};
    };

    DeploymentExporter.prototype.visit_COASequencesGroup =
      visit_COASequencesGroup;

/* ******************************************************************* */

/* visit_COA */
/** (function-valued var of top-level function object)<br><br>

Returned Value: the context argument padded and possibly changed<br><br>

Called By: atModelNode in ModelTraverserMixin.js if the node being
processed is a COA node<br><br>

This is the visitor function for a COA node.<br>

*/

    visit_COA = function(                           /* ARGUMENTS */
     /** (webgme node) a COA node                   */ node,
     /** (webgme node)? not used                    */ parent,
     /** (object) a context object, may be modified */ context)
    {
      var self = this;
      var obj = {};

      console.log('in visit_COA');
      self.coasNode[self.core.getAttribute(node, "name")] =
        self.coasNode[self.core.getAttribute(node, "name")] || [];
      self.core.getChildrenPaths(node).forEach(function(path)
      {
        self.coasNode[self.core.getAttribute(node, "name")].push(path);
      });
      if (!self.coasPath[self.core.getAttribute(node, "name")])
        self.coasPath.push(self.core.getAttribute(node, "name"))

    return {context: context};
    };

    DeploymentExporter.prototype.visit_COA = visit_COA;

/* ******************************************************************* */

/* visit_Fork */
/** (function-valued var of top-level function object)<br><br>

Returned Value: the context argument padded and possibly changed<br><br>

Called By : atModelNode in ModelTraverserMixin.js if the node being
processed is a Fork node<br><br>

This is the visitor function for a Fork node.<br>

*/

    visit_Fork = function(                          /* ARGUMENTS */
     /** (webgme node) a Fork node                  */ node,
     /** (webgme node)? not used                    */ parent,
     /** (object) a context object, may be modified */ context)
    {
      var self = this;
      var obj = {isDecisionPoint:
                   self.core.getAttribute(node, 'isDecisionPoint')};

      console.log('in visit_Fork');
      self.addCoaNode(node, obj);
      return {context: context};
    };

    DeploymentExporter.prototype.visit_Fork = visit_Fork;

/* ******************************************************************* */

/* visit_ProbabilisticChoice */
/** (function-valued var of top-level function object)<br><br>

Returned Value: the context argument padded and possibly changed<br><br>

Called By: atModelNode in ModelTraverserMixin.js if the node being
processed is a ProbabilisticChoice node<br><br>

This is the visitor function for a ProbabilisticChoice node.<br>

*/

    visit_ProbabilisticChoice = function(              /* ARGUMENTS */
     /** (webgme node) a ProbabilisticChoice node      */ node,
     /** (webgme node)? not used                       */ parent,
     /** (object) a context object, may be modified    */ context)
    {
      var self = this;
      var obj = {isDecisionPoint:
                 self.core.getAttribute(node, 'isDecisionPoint')};

      console.log('in visit_ProbabilisticChoice');
      self.addCoaNode(node, obj);
      return {context: context};
    };

    DeploymentExporter.prototype.visit_ProbabilisticChoice =
      visit_ProbabilisticChoice;

/* ******************************************************************* */

/* visit_SyncPoint */
/** (function-valued var of top-level function object)<br><br>

Returned Value: the context argument padded and possibly changed<br><br>

Called By:  atModelNode in ModelTraverserMixin.js if the node being
processed is a SyncPoint node<br><br>

This is the visitor function for a SyncPoint node.<br>

*/

    visit_SyncPoint = function(                     /* ARGUMENTS */
     /** (webgme node) a SyncPoint node             */ node,
     /** (webgme node)? not used                    */ parent,
     /** (object) a context object, may be modified */ context)
    {
      var self = this;
      var obj = {time: self.core.getAttribute(node, 'time'),
                 minBranchesToSync:
                   self.core.getAttribute(node, 'minBranchesToSync')};

      console.log('in visit_SyncPoint');
      self.addCoaNode(node, obj);
      return {context: context};
    };

    DeploymentExporter.prototype.visit_SyncPoint = visit_SyncPoint;

/* ******************************************************************* */

/* visit_Dur */
/** (function-valued var of top-level function object)<br><br>

Returned Value: the context argument padded and possibly changed<br><br>

Called By: atModelNode in ModelTraverserMixin.js if the node being
processed is a Dur node<br><br>

This is the visitor function for a Dur node.<br>

*/

    visit_Dur = function(                           /* ARGUMENTS */
     /** (webgme node) a Dur node                   */ node,
     /** (webgme node)? not used                    */ parent,
     /** (object) a context object, may be modified */ context)
    {
      var self = this;
      var obj = {time: self.core.getAttribute(node, 'time')};

      console.log('in visit_Dur');
      self.addCoaNode(node, obj);
      return {context: context};
    };

    DeploymentExporter.prototype.visit_Dur = visit_Dur;

/* ******************************************************************* */

/* visit_RandomDur */
/** (function-valued var of top-level function object)<br><br>

Returned Value: the context argument padded and possibly changed<br><br>

Called By: atModelNode in ModelTraverserMixin.js if the node being
processed is a RandomDur node<br><br>

This is the visitor function for a RandomDur node.<br>

*/

    visit_RandomDur = function(                     /* ARGUMENTS */
     /** (webgme node) a RandomDur node             */ node,
     /** (webgme node)? not used                    */ parent,
     /** (object) a context object, may be modified */ context)
    {
      var self = this;
      var obj = {lowerBound: self.core.getAttribute(node, 'lowerBound'),
                 upperBound: self.core.getAttribute(node, 'upperBound')};

      console.log('in visit_RandomDur');
      self.addCoaNode(node, obj);
      return {context: context};
    };

    DeploymentExporter.prototype.visit_RandomDur = visit_RandomDur;

/* ******************************************************************* */

/* visit_AwaitN */
/** (function-valued var of top-level function object)<br><br>

Returned Value: the context argument padded and possibly changed<br><br>

Called By:  atModelNode in ModelTraverserMixin.js if the node being
processed is a AwaitN node<br><br>

This is the visitor function for an AwaitN node.<br>

*/

    visit_AwaitN = function(                        /* ARGUMENTS */
     /** (webgme node) an AwaitN node               */ node,
     /** (webgme node)? not used                    */ parent,
     /** (object) a context object, may be modified */ context)
    {
      var self = this;
      var obj = {minBranchesToAwait:
                 self.core.getAttribute(node, 'minBranchesToAwait')};

      console.log('in visit_AwaitN');
      self.addCoaNode(node, obj);
      return {context: context};
    };

    DeploymentExporter.prototype.visit_AwaitN = visit_AwaitN;

/* ******************************************************************* */

/* visit_Outcome */
/** (function-valued var of top-level function object)<br><br>

Returned Value: the context argument padded and possibly changed<br><br>

Called By: atModelNode in ModelTraverserMixin.js if the node being
processed is an Outcome node<br><br>

This is the visitor function for an Outcome node.<br>

*/

    visit_Outcome = function(                       /* ARGUMENTS */
     /** (webgme node) an Outcome node              */ node,
     /** (webgme node)? not used                    */ parent,
     /** (object) a context object, may be modified */ context)
    {
      var self = this;
      var obj = {interactionName: self.core.getPointerPath(node, "ref")};

      console.log('in visit_Outcome');
      self.addCoaNode(node, obj);
      return {context: context};
    };

    DeploymentExporter.prototype.visit_Outcome = visit_Outcome;

/* ******************************************************************* */

/* visit_OutcomeFilter */
/** (function-valued var of top-level function object)<br><br>

Returned Value: the context argument padded and possibly changed<br><br>

Called By: atModelNode in ModelTraverserMixin.js if the node being
processed is an OutcomeFilter node<br><br>

This is the visitor function for an OutcomeFilter node.<br>

*/

    visit_OutcomeFilter = function(                 /* ARGUMENTS */
     /** (webgme node) an OutcomeFilter node        */ node,
     /** (webgme node)? not used                    */ parent,
     /** (object) a context object, may be modified */ context)
    {
      var self = this;

      console.log('in visit_OutcomeFilter');
      self.addCoaNode(node, {});
      return {context: context};
    };

    DeploymentExporter.prototype.visit_OutcomeFilter = visit_OutcomeFilter;

/* ******************************************************************* */

/* visit_TerminateCOA */
/** (function-valued var of top-level function object)<br><br>

Returned Value: the context argument, padded and possibly changed<br><br>

Called By: atModelNode in ModelTraverserMixin.js if the node being
processed is a TerminateCOA node<br><br>

This is the visitor function for a TerminateCOA node.<br>

*/

    visit_TerminateCOA = function(                  /* ARGUMENTS */
     /** (webgme node) a TerminateCOA node          */ node,
     /** (webgme node)? not used                    */ parent,
     /** (object) a context object, may be modified */ context)
    {
      var self = this;

      console.log('in visit_TerminateCOA');
      self.addCoaNode(node, {});
      return {context: context};
    };

    DeploymentExporter.prototype.visit_TerminateCOA = visit_TerminateCOA;

/* ******************************************************************* */

/* addCoaEdge */
/** (function-valued var of top-level function object)<br><br>

Returned Value: the context argument padded and possibly changed<br><br>

Called By:<br>
  visit_COAException<br>
  visit_COAFlow<br>
  visit_COAFlowWithProbability<br>
  visit_Filter2COAElement<br>
  visit_Outcome2Filter<br><br>

This adds data an empty or small object and adds the object to coaEdges.<br>

*/

    addCoaEdge = function(                                   /* ARGUMENTS */
     /** (webgme node) a node of the type in the caller name */ node,
     /** an empty or small object, built more here           */ obj)
    {
      var self = this;

      obj.name = self.core.getAttribute(node, 'name');

      obj.type = ((obj.name === 'CPSWT') ? 'CPSWT' :
                  (obj.name === 'CPSWTMeta') ? 'CPSWTMeta' :
                  self.core.getAttribute(self.getMetaType(node), 'name'));
      obj.ID = self.core.getGuid(node);
      obj.flowID = self.core.getAttribute(node, 'flowID');
      obj.fromNode = self.core.getPointerPath(node, 'src');
      obj.toNode = self.core.getPointerPath(node, 'dst');
      self.coaEdges.push(obj);
      self.coaPathEdge[self.core.getPath(node)] = obj;
    };

    DeploymentExporter.prototype.addCoaEdge = addCoaEdge;

/* ******************************************************************* */

/* visit_COAFlow */
/** (function-valued var of top-level function object)<br><br>

Returned Value: the context argument padded and possibly changed<br><br>

Called By: atModelNode in ModelTraverserMixin.js if the node being
processed is a COAFlow node<br><br>

This is the visitor function for a COAFlow node.<br>

*/

    visit_COAFlow = function(                       /* ARGUMENTS */
     /** (webgme node) a COAFlow node               */ node,
     /** (webgme node)? not used                    */ parent,
     /** (object) a context object, may be modified */ context)
    {
      var self = this;

      console.log('in visit_COAFlow');
      self.addCoaEdge(node, {});
      return {context: context};
    };

    DeploymentExporter.prototype.visit_COAFlow = visit_COAFlow;

/* ******************************************************************* */

/* visit_COAFlowWithProbability */
/** (function-valued var of top-level function object)<br><br>

Returned Value: the context argument padded and possibly changed<br><br>

Called By: atModelNode in ModelTraverserMixin.js if the node being
processed is a COAFlowWithProbability node<br><br>

This is the visitor function for a COAFlowWithProbability node.<br>

*/

    visit_COAFlowWithProbability = function(         /* ARGUMENTS */
     /** (webgme node) a COAFlowWithProbability node */ node,
     /** (webgme node)? not used                     */ parent,
     /** (object) a context object, may be modified  */ context)
    {
      var self = this,
      obj = {probability: self.core.getAttribute(node, 'probability')};

      console.log('in visit_COAFlowWithProbability');
      self.addCoaEdge(node, obj);
      return {context: context};
    };

    DeploymentExporter.prototype.visit_COAFlowWithProbability =
      visit_COAFlowWithProbability;

/* ******************************************************************* */

/* visit_Outcome2Filter */
/** (function property of DeploymentExporter.prototype)<br><br>

Returned Value: the context argument padded and possibly changed<br><br>

Called By: atModelNode in ModelTraverserMixin.js if the node being
processed is an Outcome2Filter node<br><br>

This is the visitor function for a Outcome2Filter node.<br>

*/

    visit_Outcome2Filter = function(                /* ARGUMENTS */
     /** (webgme node) an Outcome2Filter node       */ node,
     /** (webgme node)? not used                    */ parent,
     /** (object) a context object, may be modified */ context)
    {
      var self = this;

      console.log('in visit_Outcome2Filter');
      self.addCoaEdge(node, {});
      return {context: context};
    };

    DeploymentExporter.prototype.visit_Outcome2Filter = visit_Outcome2Filter;

/* ******************************************************************* */

/* visit_Filter2COAElement */
/** (function-valued var of top-level function object)<br><br>

Returned Value: the context argument padded and possibly changed<br><br>

Called By: atModelNode in ModelTraverserMixin.js if the node being
processed is a Filter2COAElement node<br><br>

This is the visitor function for a Filter2COAElement node.<br>

*/

    visit_Filter2COAElement = function(             /* ARGUMENTS */
     /** (webgme node) a Filter2COAElement node     */ node,
     /** (webgme node)? not used                    */ parent,
     /** (object) a context object, may be modified */ context)
    {
      var self = this;

      console.log('in visit_Filter2COAElement');
      self.addCoaEdge(node, {});
      return {context: context};
    };

    DeploymentExporter.prototype.visit_Filter2COAElement =
      visit_Filter2COAElement;

    /* ******************************************************************* */

/* visit_COAException */
/** (function-valued var of top-level function object)<br><br>

Returned Value: the context argument padded and possibly changed<br><br>

Called By: atModelNode in ModelTraverserMixin.js if the node being
processed is a COAException node<br><br>

This is the visitor function for a COAException node.<br>

*/

    visit_COAException = function(                  /* ARGUMENTS */
     /** (webgme node) a COAException node          */ node,
     /** (webgme node)? not used                    */ parent,
     /** (object) a context object, may be modified */ context)
    {
      var self = this;

      console.log('in visit_COAException');
      self.addCoaEdge(node, {});
      return {context: context};
    };

    DeploymentExporter.prototype.visit_COAException = visit_COAException;

/* ******************************************************************* */

/* visit_Federate */
/** (function-valued var of top-level function object)<br><br>

Returned Value: the context argument padded and possibly changed<br><br>

Called By: atModelNode in ModelTraverserMixin.js if the node being
processed is a Federate node<br><br>

This is the visitor function for a Federate node.<br>

*/

    visit_Federate = function(                         /* ARGUMENTS */
     /** (webgme node) a Federate node                 */ node,
     /** (webgme node)parent node of the Federate node */ parent,
     /** (object) a context object, may be modified    */ context)
    {
      var self = this;
      var nodeName;
      var ret = {context: context};
      var nodeMetaTypeName;
      var fed;
      var nodeAttrNames;
      var i; // counter in for loop

      nodeName = self.core.getAttribute(node, 'name');
      fed = {name: nodeName};
      nodeMetaTypeName = ((nodeName === 'CPSWT') ? 'CPSWT' :
                          (nodeName === 'CPSWTMeta') ? 'CPSWTMeta' :
                       self.core.getAttribute(self.getMetaType(node),'name'));
      nodeAttrNames = self.core.getAttributeNames(node);
      for (i = 0; i < nodeAttrNames.length; i++)
        {
          fed[nodeAttrNames[i]] =
            self.core.getAttribute(node, nodeAttrNames[i]);
        }
      fed.FederateType = nodeMetaTypeName;
      fed.configFilename = fed.name.toLowerCase() + ".json";
      self.federates.push(fed);
      return ret;
    };

    DeploymentExporter.prototype.visit_Federate = visit_Federate;

/* ******************************************************************* */

/* excludeFromVisit */
/** (function-valued var of top-level function object)<br><br>

Returned Value: true or false<br><br>

Called By: visitAllChildrenRec (in ModelTraverserMixin.js)<br><br>

This returns true if the node is to be excluded and false if the node is not
to be excluded (i.e., the node is to be included).<br><br>

A function named excludeFromVisit is also defined (and called) in
C2Core/ModelTraverserMixin.js.<br>

*/

    excludeFromVisit = function(                  /* ARGUMENTS */
     /** a webGME node to test for being excluded */ node)
    {
      var self = this;

      return (false ||
              self.isMetaTypeOf(node, self.META['Language [C2WT]']) ||
              self.isMetaTypeOf(node,
                                self.META['CPSWT.CPSWTMeta.Language [CPSWT]']));
    }

    DeploymentExporter.prototype.excludeFromVisit = excludeFromVisit;

/* ******************************************************************* */

/* ROOT_Visitor */
/** (function-valued var of top-level function object)<br><br>

Returned Value: a context object as shown in the function<br><br>

Called By: C2Core/ModelTraverserMixin.js (for the ROOT node)<br><br>

This builds the context object used in many functions.
The function does not use any information from the node.<br>

*/

    ROOT_visitor = function( /* ARGUMENTS */
     /** a webGME ROOT node  */ node)
    {
      var self = this;
      var root = {"@id": 'model:' + '/root',
                  "@type": "gme:root",
                  "model:name": self.projectName,
                  "gme:children": []};
      return {context: {parent: root}};
    };

    DeploymentExporter.prototype.ROOT_visitor = ROOT_visitor;


/* ******************************************************************* */

/* calculateParentPath */
/** (function-valued var of top-level function object)<br><br>

Returned Value: the path with the last entry removed<br><br>

Called By: C2Core/ModelTraverserMixin.js<br><br>

This calculates the path to the parent of a thing with a path, such
as a file or directory.

For example, if path is '/a/b/c', this returns '/a/b'.<br>

*/
    calculateParentPath = function(                            /* ARGUMENTS */
       /** (string) path to a file or directory e.g., '/a/b/c' */ path)
    {
      var pathElements;

      if (!path)
        {
          return null;
        }
      pathElements = path.split('/');
      pathElements.pop();
      return pathElements.join('/');
    }

    DeploymentExporter.prototype.calculateParentPath = calculateParentPath;

/* ******************************************************************* */

    return DeploymentExporter;
 });
