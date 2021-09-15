/**

File modified and reformatted in C style, as far as possible.

In this file, the functions defined in the "define" arguments are
executed by calls such as, for example, PubSubVisitors.call(this),
which in a sane language would be written as this.call(PubSubVisitors).

A separate XML file is generated for each Federate in a project.

*/

define
([
  'text!./metadata.json',
  'plugin/PluginBase',
  'ejs',
  'C2Core/ModelTraverserMixin',
  'C2Core/xmljsonconverter',
  'C2Core/MavenPOM',
  'FederatesExporter/PubSubVisitors',
  'FederatesExporter/RTIVisitors',
  'FederatesExporter/Templates/Templates',
  'C2Federates/GenericFederate',
  'C2Federates/JavaFederate',
  'C2Federates/MapperFederate',
  'C2Federates/CppFederate',
  'C2Federates/OmnetFederate',
  'C2Federates/CPNFederate',
  'C2Federates/GridLabDFederate',
  'C2Federates/TRNSYSFederate',
  'C2Federates/LabVIEWFederate'],
 function (pluginMetadata,
           PluginBase,
           ejs,
           ModelTraverserMixin,
           JSON2XMLConverter,
           MavenPOM,
           PubSubVisitors,
           RTIVisitors,
           TEMPLATES,
           GenericFederate,
           JavaFederate,
           MapperFederate,
           CppFederate,
           OmnetFederate,
           CPNFederate,
           GridLabDFederate,
           TRNSYSFederate,
           LabVIEWFederate)
 {
    'use strict';
    var FederatesExporter;          // function variable
    var addEndJoinResign;           // function variable
    var buildScriptGenerator;       // function variable
    var calculateParentPath;        // function variable
    var excludeFromVisit;           // function variable
    var fomGenerator;               // function variable
    var interactionTraverserCheck;  // function variable
    var interactionTraverserXml;    // function variable
    var makeVariablesModel;         // function variable
    var objectTraverserCheck;       // function variable
    var objectTraverserXml;         // function variable
    var processInteraction;         // function variable
    var prototypeMain;              // function variable
    var ROOT_visitor;               // function variable

    pluginMetadata = JSON.parse(pluginMetadata);

/* ******************************************************************* */

/* FederatesExporter */
/** (function-valued variable of top-level function object)<br><br>

Returned Value: none<br><br>

Called By: ?<br><br>

This is the top-level function for the federates exporter.<br><br>

While it is running, this builds the following data structures that
are queried in the process of generating files.<br><br>

federateTypes<br>
-------------<br><br>

The federateTypes object is set to an empty object here and is populated
by functions in C2Federates. It gets an entry for each type of federate
according to the language of the federate.<br><br>

federateInfos<br>
-------------<br><br>

The federateInfos object collects information for each federate.
federateInfos uses federate ids as property names and has the form<br><br>

{federateId1: value1, federateId2: value2, ...}.<br><br>

The value corresponding to a federateId is an object of the form<br>
{name: federateName,<br>
 metaType: federateMetaType,<br>
 generateCode: boolean,<br>
 directory: directoryPath,<br>
 pubSubObjects:<br>
  {objectId1: objectData1, objectId2: objectData2, ...},<br>
 pubSubInteractions:<br>
  {interactId1: interactData1, interactId2: interactData2, ...}}<br><br>

The directory property is set in JavaImplFederate.js and in
CppImplFederate.js. It is used in this file in the fomGenerator
function. It is also is used elsewhere.<br><br>

Empty federateInfos are built in PubSubVisitors.js. The name,
metaType, and generateCode properties are set in
ModelTraverserMixin.js. The metaType property is not used in this file
but is used in JavaRTI.js. The generateCode property is used in this
file and in JavaRTI.js.<br><br>

The interactData values have the form:<br><br>

{publish: n, subscribe: m} where n and m are each either 1 or 0,
meaning yes and no. The interactData values are used in an obvious way in
interactionTraverserXml to set the sharingXml of the interaction to
one of Publish, Subscribe, PublishSubscribe, or Neither.<br><br>

The objectData values have the form:<br><br>

{publish: n, mayPublish: p, subscribe: m, maySubscribe: q, attribs: attribData}<br>
where n, m, p and q are each either 1 or 0, meaning yes and no.<br>
publish means definitely publish. mayPublish means maybe publish.<br><br>

attribData is entered only in the case of crosscuts and has the form<br>
{attId1: attData1, attId2: attData2 ...}<br><br>

The attData have the form {publish: s, subscribe: t} where s and t are
each either 1 or 0, meaning yes and no. The attribData is entered only
for attributes found in visit_StaticObjectAttributePublish.<br><br>

The objectData values are used in objectTraverserXml to set the
sharingXml of the object to one of Publish, Subscribe,
PublishSubscribe, or Neither.<br><br>

For publishing, an object should Publish if any of the following apply:<br>
 (1) it has a publish relation with the federate<br>
     (call it a type P object) or<br>
 (2) it is an ancestor of a type P object and has an own attribute<br>
     (call it a type Q object)<br>
 (3) it has an own attribute that publishes to the federate in a<br>
     crosscut (call it a type R object)<br>
All ancestors of any of the three types must be included in the XML
whether or not they publish.<br><br>

For a type P object, publish and mayPublish are both set to 1 when the
publish relation is examined.<br><br>

For a type Q object that is not also type P, publish is always
0, but mayPublish will be set to 1 in objectTraverserCheck if any
descendant has mayPublish set to 1.<br><br>

For a type R object that is not also P, publish and mayPublish are
both set to 0 when the crosscut publish relation for an attribute of
the object is examined (so that the object and its ancestors will be
included in the output). Also when that relation is examined,
information that the attribute should be published for the federate
is stored in the attribute.<br><br>

For subscribing, the situation is exactly analogous to publishing.<br><br>

Notice that pubSubInteractions and pubSubObjects of a federate have
the same name and same structure as the pubSubInteractions and
pubSubObjects of the deployment exporter. This enables using the six
visit_XXX functions in PubSubVisitors.js for both exporters.<br><br>

The value in federateInfos for a federateId is initialized where
the federate is first encountered. That may be in any of three places:<br><br>

(1) the atModelNode function defined in C2Core/ModelTraverserMixin.js.
If initialized here, the pubSubObjects and pubSubInteractions are both
empty objects. If a federateInfo for a federate has already been
created when the federate is encountered in this function, the name
and metaType of the federate are added to the data (since they will be
missing).<br><br>

(2) one of the four visit_StaticXXX functions defined in
PubSubVisitors.js.  If initialized here, (i) some data will be put
into either the pubSubObjects or the pubSubInteractions and (ii) the
federate name will be set to null since it is not available. If a
federateInfo for a federate has already been created when the federate
is encountered in a visit_StaticXXX function, some data will be put
into either the pubSubObjects or the pubSubInteractions.<br><br>

(3) one of the two visit_StaticObjectAttributeXXX functions defined in
PubSubVisitors.js.<br><br>

See the documentation of objectTraverserCheck and
interactionTraverserCheck regarding how additional items are added to
pubSubInteractions and pubSubObjects.<br><br>

The pubSubInteractions and pubSubObjects of a federate are used in the
objectTraverserXml and interactionTraverserXml functions to set the
values for sharing that are put into the output XML file for the
federate. For objects, the data for the federate in each attribute of
the object (if there is any) is also used, and the three rules given
above are followed.<br><br>

endJoinResigns<br>
--------------<br><br>

The endJoinResigns object uses interaction ids as property names; the
value corresponding to a name is a pointer to the interaction. The
endJoinResigns are built in the visit_Interaction function of
RTIVisitors.js (where the required information is available). The
interactions put into endJoinResigns are those whose name is one of:
SimEnd, FederateJoinInteraction, FederateResignInteraction. The
endJoinResigns are used in the fomGenerator function to add those
interactions to those to be be included in an XML fom file for a
federate. The publish and subscribe values for interactions in the
endJoinResigns are set in the addEndJoinResign function.<br><br>

visitorNames<br>
------------<br><br>

The visitorNames object uses metaType names as property names; the
value corresponding to a name is the name of the visitor function for
the named metaType. The visitorNames object is used to select the
visit function to run for a given metaType.<br><br>

postVisitorNames (completely analogous to visitorNames)<br>
----------------<br><br>

The postVisitorNames object uses metaType names as property names; the
value corresponding to a name is the name of the postVisitor function
for the named metaType. The postVisitorNames object is used to select
the postVisit function to run for a given metaType.<br><br>

This does not deal with a GatewayFederate. When a visit_GatewayFederate
function is written, its name will need to be added to the visitorNames.<br>

*/
    FederatesExporter = function()
    {
      var feder;

      this.federateTypes = this.federateTypes || {}; // see documentation above
      this.federateInfos = {}; // see documentation above
      this.endJoinResigns = {};  // see documentation above
      this.visitorNames =
        {Attribute: 'visit_Attribute',
         ComplexMappingConnection: 'visit_ComplexMappingConnection',
         CPNFederate: 'visit_CPNFederate',
         CppFederate: 'visit_CppFederate',
         CppImplFederate: 'visit_CppImplFederate',
         C2WInteractionRoot: 'visit_Interaction',
         FedIntPackage: 'visit_FedIntPackage',
         FOMSheet: 'visit_FOMSheet',
         GridLabDFederate: 'visit_GridLabDFederate',
         Interaction: 'visit_Interaction',
         JavaFederate: 'visit_JavaFederate',
         JavaImplFederate: 'visit_JavaImplFederate',
         LabVIEWFederate: 'visit_LabVIEWFederate',
         MapperFederate: 'visit_MapperFederate',
         Object: 'visit_Object',
         ObjectRoot: 'visit_Object',
         OmnetFederate: 'visit_OmnetFederate',
         Parameter: 'visit_Parameter',
         Place: 'visit_Place',
         SimpleMappingConnection: 'visit_SimpleMappingConnection',
         StaticInteractionPublish: 'visit_StaticInteractionPublish',
         StaticInteractionPublishFromCPNPlace:
            'visit_StaticInteractionPublishFromCPNPlace',
         StaticInteractionSubscribe: 'visit_StaticInteractionSubscribe',
         StaticInteractionSubscribeToCPNPlace:
            'visit_StaticInteractionSubscribeToCPNPlace',
         StaticObjectAttributePublish: 'visit_StaticObjectAttributePublish',
         StaticObjectAttributeSubscribe:
            'visit_StaticObjectAttributeSubscribe',
         StaticObjectPublish: 'visit_StaticObjectPublish',
         StaticObjectSubscribe: 'visit_StaticObjectSubscribe',
         TRNSYSFederate: 'visit_TRNSYSFederate'
        }; // see documentation above
      this.postVisitorNames =
        {
         CPNFederate: 'post_visit_CPNFederate',
         CppFederate: 'post_visit_CppFederate',
         CppImplFederate: 'post_visit_CppImplFederate',
         FedIntPackage: 'post_visit_FedIntPackage',
         FOMSheet: 'post_visit_FOMSheet',
         GridLabDFederate: 'post_visit_GridLabDFederate',
         JavaFederate: 'post_visit_JavaFederate',
         JavaImplFederate: 'post_visit_JavaImplFederate',
         LabVIEWFederate: 'post_visit_LabVIEWFederate',
         MapperFederate: 'post_visit_MapperFederate',
         OmnetFederate: 'post_visit_OmnetFederate',
         TRNSYSFederate: 'post_visit_TRNSYSFederate'
        }; // see documentation above
      this.callObjectTraverser = true;
      this.callInteractionTraverser = true;
      PluginBase.call(this);
      ModelTraverserMixin.call(this);
      PubSubVisitors.call(this);
      RTIVisitors.call(this);
      GenericFederate.call(this);
      JavaFederate.call(this);
      MapperFederate.call(this);
      CppFederate.call(this);
      OmnetFederate.call(this);
      CPNFederate.call(this);
      GridLabDFederate.call(this);
      TRNSYSFederate.call(this);
      LabVIEWFederate.call(this);      

      this.mainPom = new MavenPOM();
      this._jsonToXml = new JSON2XMLConverter.Json2xml();
      this._xmlToJson = new JSON2XMLConverter.Xml2json();
      this.pluginMetadata = pluginMetadata;
    }; // end FederatesExporter

/* ******************************************************************* */

    // Prototypal inheritance from PluginBase.
    FederatesExporter.prototype = Object.create(PluginBase.prototype);
    FederatesExporter.prototype.constructor = FederatesExporter;
    FederatesExporter.metadata = pluginMetadata;

/* ******************************************************************* */

/*  addEndJoinResign */
/** (function-valued variable of top-level function object)<br><br>

Returned Value: none<br><br>

Called By: fomGenerator<br><br>

This adds an entry to the pubSubInteractions for any interaction named
SimEnd, FederateResignInteraction, or FederateJoinInteraction.<br>

*/
    addEndJoinResign = function( /* ARGUMENTS    */
     /** (string) name of the interaction to add */ name,
     /** (object) interaction data to add to     */ pubSubInteractions,
     /** (string) id of the interation to add    */ id)
    {
      if (name == 'SimEnd')
        {
          if (pubSubInteractions[id])
            {
              pubSubInteractions[id].subscribe = 1;
            }
          else
            {
              pubSubInteractions[id] = {publish: 0,
                                        subscribe: 1};
            }
        }
      else if ((name == 'FederateResignInteraction') ||
               (name == 'FederateJoinInteraction'))
        {
          if (pubSubInteractions[id])
            {
              pubSubInteractions[id].publish = 1;
            }
          else
            {
              pubSubInteractions[id] = {publish: 1,
                                        subscribe: 0};
            }
        }
    };

/* ******************************************************************* */

/* objectTraverserCheck */
/** (function-valued variable of top-level function object)<br><br>

Returned Value: none<br><br>

Called By:<br>
  anonyomous fom generator in FederatesExporter.prototype.main<br>
  objectTraverserCheck (recursively)<br><br>

This adds entries to the pubSubObjects of a federate for all ancestors
of objects that already have entries.<br><br>

In this documentation, "object" means object in the WebGME sense, not
object in the JavaScript sense.<br><br>

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

This function is identical to objectTraverserCheck in JavaRTI.js. It
would be nice to have only one, but that requires figuring out where
to put it and how to refererence it.<br>

*/

    objectTraverserCheck = function( /* ARGUMENTS    */
     /** (object) data in FederateInfos for federate */ federate,
     /** (object) object to process                  */ object)
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

/* ******************************************************************* */

/* objectTraverserXml */
/** (function-valued variable of top-level function object)<br><br>

Returned Value: a string of XML representing the object and its
descendants<br><br>

Called By:<br>
  anonyomous fom generator in FederatesExporter.prototype.main<br>
  objectTraverserXml (recursively)<br><br>

This is a recursive function that builds the XML for objects in a
federate.<br><br>

The function takes (1) information about a federate, (2) an object
that may have children (which are also objects), and (3) a string of
blank space to use for indenting.<br><br>

The function begins by creating an objModel. The objModel is given the
same name and attributes as the object and is given children that are
XML code built by a recursive call to the function on the children of
the object.  Information for printing XML is added to the data for
each attribute of the object. Data regarding "sharing" for the XML is
derived from the federate information and the attribute data.<br><br>

Then XML for the objModel is generated from the objModel (and saved)
by calling ejs.render using the fedfile_simobject_xml XML Template.<br><br>

Crosscuts are Publish or Subscribe links from a federate directly to
an attribute of an object. Crosscuts are handled by putting entries
for crosscuts (only) into the attribs property of the object data for
a federate. The code for crosscuts is mostly in the great big "else"
near the end of the function, but there is also code dealing with
crosscuts in two places before that. Setting the printFor property of
an attribute allows it to be printed (by fedfile_simobject_xml.ejs)
even when the attribute is an inherited property. The printFor
property is set back to 0 there so the attribute won't necessarily be
printed for the same object in the XML file for some other federate.<br><br>

NOTE: An alternative to using the printFor attribute would be to
create a deferredPubSubs property of the federate. When a crosscut hit
an inherited attribute A of an object D, an entry would be made in the
deferredPubSubs recording the id of A and the type of sharing. When an
object C is deciding how to set sharing for an own attribute B, a
check of the deferredPubSubs would be made to see if an attribute with
the id of B is recorded. If so, B is A, and the sharing of B would be
set taking into account the sharing given in the deferredPubSubs
entry.<br>

*/

    objectTraverserXml = function( /* ARGUMENTS      */
     /** (object) data in federateInfos for federate */ federate,
     /** (object) object to process                  */ object,
     /** (string) indentation space                  */ space)
    {
      var objModel;
      var objPuBSub;
      var hasOwn;

      objModel = {name: object.name,
                  sharingXml: 0,
                  indent: space,
                  attributes: object.attributes,
                  children: []};

      objPuBSub = federate.pubSubObjects[object.id];
      hasOwn = 0;
      // The attributes in the objModel are the attributes of the object.
      // Properites of attributes not related to XML generation are not
      // modified, but properties of attributes related to XML generation
      // are assigned as follows.
      objModel.attributes.forEach(function(attr)
      {
        if (!attr.inherited)
          {
            attr.deliveryXml = ((attr.delivery === "reliable") ?
                                "HLAreliable" : "HLAbestEffort");
            attr.orderXml = ((attr.order === "timestamp") ?
                             "TimeStamp" : "Receive");
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
                    attr.printFor = objModel.name; 
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
            (child.id in federate.pubSubObjects))
          {
            objModel.children.push
              (objectTraverserXml(federate, child, space + "    "));
          }
      });
      // now generate XML for the parent if on pubSubObjects
      if (object.id in federate.pubSubObjects)
        {
          return ejs.render(TEMPLATES["fedfile_simobject_xml.ejs"], objModel);
        }
    };

/* ******************************************************************* */

/* interactionTraverserCheck */
/** (function-valued var of top-level function object)<br><br>

Returned Value: none<br><br>

Called By:<br>
  anonyomous fom generator in FederatesExporter.prototype.main<br>
  interactionTraverserCheck (recursively)<br><br>

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
is also on pubSubInteractions.<br><br>

This function is identical to interactionTraverserCheck in CppRTI.js and
JavaRTI.js. It would be nice to have only one, but that requires
figuring out where to put it and how to refererence it.<br>

*/
    interactionTraverserCheck = function( /* ARGUMENTS */
     /** (object) data in federateInfos for federate   */ federate,
     /** (object) interaction to process               */ interaction)
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

/* ******************************************************************* */

/* interactionTraverserXml */
/** (function-valued var of top-level function object)<br><br>

Returned Value: a string of XML representing the interaction and its
                descendants<br><br>

Called By:<br>
  anonyomous fom generator in FederatesExporter.prototype.main<br>
  interactionTraverserXml (recursively)<br><br>

This is a recursive function that builds the XML for interactions in a
federate.<br><br>

The function takes information about a federate and takes an interaction
that may have children (which are also interactions).<br><br>

The function begins by creating an intModel. The intModel is given the
same name and parameters as the interaction and is given children that are
XML code built by a recursive call to the function on the children of
the interaction.  The intModel is also given other properties needed for
generating XML.<br><br>

Then XML for the intModel is generated from the intModel (and saved)
by calling ejs.render using the fedfile_siminteraction_xml XML Template.<br>

*/
    interactionTraverserXml = function( /* ARGUMENTS */
     /** (object) data in federateInfos for federate */ federate,
     /** (object) interaction to process             */ interaction,
     /** (string) indentation space                  */ space)
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
      intPubSub = federate.pubSubInteractions[interaction.id];
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
      interaction.children.forEach(function (child)
      {
        if (child.id in federate.pubSubInteractions)
          {
            intModel.children.push
              (interactionTraverserXml(federate, child, space + "    "));
          }
      });

      // now generate XML for the parent if on pubSubInteractions
      if (interaction.id in federate.pubSubInteractions)
        {
          return ejs.render(TEMPLATES["fedfile_siminteraction_xml.ejs"],
                            intModel);
        }
    };

/* ******************************************************************* */

/* buildScriptGenerator */
/** (function-valued variable of top-level function object)<br><br>

Returned Value: none<br><br>

Called By: finishExport<br><br>

This builds a file generator for a top-level build script that compiles
all of the individual generated federates.<br>

*/
    buildScriptGenerator = function( /* ARGUMENTS */
     /** the FederatesExporter function object    */ fedEx)
    {
      fedEx.fileGenerators.push(function (artifact, callback)
      {
        var template = TEMPLATES['build-all.sh.ejs'];
        var fullPath = 'build-all.sh';
        var bashScript = ejs.render(template, {dummy: 0});
        fedEx.logger.info('calling addFile for ' + fullPath +
                          ' in buildScriptGenerator of FederatesExporter.js');
        artifact.addFile(fullPath, bashScript,
                         function (err)
                         {if (err) {callback(err); return;}
                          else {callback();}}
                        );
      });
    };

/* ******************************************************************* */

/* processInteraction */
/** (function-valued variable of top-level function object)<br><br>

Returned Value: none<br><br>

Called By:<br>
  makeVariablesModel<br>
  processInteraction (recursively)<br><br>

By calling itself recursively, this processes all the interactions in a
nest of interactions and adds data to the variables model.

For an element that might or might not occur multiple times, a
check is made of whether it is represented by an array. If the element
exists but is not an array, it is put into an array for further
processing.<br><br>

When this is called by makeVariablesModel, the longName is
"InteractionRoot.C2WInteractionRoot", and the parentameters is an
empty array.<br>

*/

    processInteraction = function( /* ARGUMENTS */
      /** an interaction                        */ interact,
      /** model of variables, enhanced here     */ variablesModel,
      /** inheritance hierarchy in string       */ longName,
      /** usually all parameters of parent      */ parentameters)
    {
      var n;
      var inters;
      var parameters;
      var parameter;
      var inn;
      var out;
      var thisLongName;
      var typeName;

      if ((interact.name['#text'] == "FederateJoinInteraction") ||
          (interact.name['#text'] == "FederateResignInteraction") ||
          (interact.name['#text'] == "SimulationControl"))
        return;
      thisLongName = longName + '.' + interact.name['#text'];
      if (interact.parameter)
        {
          if (Array.isArray(interact.parameter))
            {
              parameters = interact.parameter.concat(parentameters);
            }
          else
            {
              parameters = [];
              parameters.push(interact.parameter);
              parameters = parameters.concat(parentameters);
            }
        }
      else
        {
          parameters = parentameters;
        }
      if (interact.interactionClass)
        {
          if (Array.isArray(interact.interactionClass))
            {
              inters = interact.interactionClass;
            }
          else
            {
              inters = [];
              inters.push(interact.interactionClass);
            }
          inters.forEach(function(inter)
            {
              processInteraction(inter, variablesModel,
                                 thisLongName, parameters);
            });
        }
      out = ((interact.sharing['#text'] == "Publish") ||
             (interact.sharing['#text'] == "PublishSubscribe"));
      inn  = ((interact.sharing['#text'] == "Subscribe") ||
              (interact.sharing['#text'] == "PublishSubscribe"));
      if (!inn && !out)
        return;
      for (n = 0; n < parameters.length; n++)
        {
          parameter = parameters[n];
          typeName = parameter.dataType['#text'];
          if ((typeName != "double") &&
              (typeName != "long") &&
              (typeName != "short") &&
              (typeName != "int") &&
              (typeName != "float") &&
              (typeName != "boolean"))
            continue;
          if (inn)
            {
              variablesModel.inputs.push({name: parameter.name['#text'],
                    hlaClass: thisLongName});
            }
          if (out)
            {
              variablesModel.outputs.push({name: parameter.name['#text'],
                    hlaClass: thisLongName});
            }
        }
    };

/* ******************************************************************* */

/* makeVariablesModel */
/** (function-valued variable of top-level function object)<br><br>

Returned Value: none<br><br>

Called By: fomGenerator<br><br>

This makes the variables model from the json model of interactions.<br><br>

See documentation of processInteraction regarding making sure inters
is an array.<br>

*/

    makeVariablesModel = function( /* ARGUMENTS */
      /** model to build                        */ variablesModel,
      /** json model of interactions            */ interactions)
    {
      var c2w;      // C2WInteractionRoot
      var longName; // "InteractionRoot.C2WInteractionRoot"
      var inters;   // interactions derived from C2WInteractionRoot

      variablesModel.inputs = [];
      variablesModel.outputs = [];
      longName = "InteractionRoot.C2WInteractionRoot";
      c2w = interactions.interactionClass.interactionClass;
      if (!c2w || (c2w.name['#text'] != "C2WInteractionRoot"))
        {
          callback("C2WInteractionRoot missing from interactions");
          return;
        }
      if (c2w.interactionClass)
        {
          if (Array.isArray(c2w.interactionClass))
            {
              inters = c2w.interactionClass;
            }
          else
            {
              inters = [];
              inters.push(c2w.interactionClass);
            }
          inters.forEach (function(inter)
            {
              processInteraction(inter, variablesModel, longName, []);
            });
        }
      variablesModel.inputs.sort();
      variablesModel.outputs.sort();
    };

/* ******************************************************************* */

/* fomGenerator */
/** (function-valued variable of top-level function object)<br><br>

Returned Value: none<br><br>

Called By: finishExport<br><br>

This builds a file generator that generates a separate fom file for each
federate in a project and generates a Variables.json file for each
federate of type TRNSYS. Both the fom file and the variables file are
generated from data in the federate's fomModelXml, which is built
first.<br><br>

When _xmlToJson.convertFromString runs:<br>
- If an element with a given name occurs twice or more in a row,
   the json model has an array of objects for the occurrences.<br>
- If the element occurs only once, the json model has a single object.<br><br>

Where fedEx.objectRoots.forEach is called, objectTraverserXml will
return undefined if there is no XML for objects. In that case,
objectsXml will have length 1, but objectsXml[0] will be undefined.<br><br>

The call to the callback function with no argument evidently triggers
printing all the files that have been put into the artifact. If callback
is called each time around the loop below, a zip file is generated each
time containing one more fom file than the preceding zip file. Hence
that call can be made only once. In addition, webGME complains if
callback is called more than once.<br><br>

The "remaining" variable keeps track of the number of federates in
fedEx.federateInfos that have not yet been processed so that it will be
clear when to call the callback.<br>

*/
    fomGenerator = function( /* ARGUMENTS      */
     /** the FederatesExporter function object */ fedEx)
    {
      var today = new Date();
      var year = today.getFullYear();
      var month = (1 + today.getMonth());
      var day = today.getDate();
      var dateString = (year + "-" + ((month < 10) ? "0" : "") + month +
                        "-" + ((day < 10) ? "0" : "") + day);
      var fomModelXml;      // model from which to generate XML
      var federId;          // id of federate  
      var feder;            // data for federate in federateInfos
      var endJoinResignId;  // id of a 
      var directory;        // directory for a federate
      var endJoinResign;
      var remaining;
      var code;
      var fullPath;
      var template;
      var interactionsJson; // fomModelXml.interactionsXml converted to json
      var variablesModel;   // model of variables built from interactionsJson

      remaining = 0;
      for (federId in fedEx.federateInfos)
        {
          feder = fedEx.federateInfos[federId];
          if (feder.generateCode)
            remaining++;
        }
      fedEx.fileGenerators.push(function(artifact, callback)
      {
        for (federId in fedEx.federateInfos)
          {
            feder = fedEx.federateInfos[federId];
            if (feder.generateCode)
              remaining--;
            else
              continue;
            directory = feder.directory || 'som/';
            fomModelXml =
              {federateName: feder.name,
               projectName: fedEx.projectName,
               version: fedEx.getCurrentConfig().exportVersion.trim(),
               pocOrg: fedEx.mainPom.groupId,
               dateString: dateString,
               objectsXml: [],
               interactionsXml: []};
            fedEx.interactionRoots.forEach(function (interactionRoot)
            {
              for (endJoinResignId in fedEx.endJoinResigns)
                {
                  endJoinResign = fedEx.endJoinResigns[endJoinResignId];
                  addEndJoinResign(endJoinResign.name,
                                   feder.pubSubInteractions, endJoinResignId);
                }
              interactionTraverserCheck(feder, interactionRoot);
              fomModelXml.interactionsXml.push
                (interactionTraverserXml(feder, interactionRoot, "    "));
            });
            fedEx.objectRoots.forEach(function(objectRoot)
            {
              //objectTraverserCheck(feder, objectRoot);
              fomModelXml.objectsXml.push
                (objectTraverserXml(feder, objectRoot, "    "));
            });
            if (feder.metaType == "TRNSYSFederate")
              { // add Variables.json
                interactionsJson =
                  fedEx._xmlToJson.convertFromString(fomModelXml.
                                                     interactionsXml[0]);
                variablesModel = {};
                makeVariablesModel(variablesModel, interactionsJson);
                fullPath = directory + 'Variables.json';
                template = TEMPLATES['variables.ejs'];
                code = ejs.render(template, variablesModel);
                fedEx.logger.info('calling addFile for ' + fullPath +
                                  ' in fomGenerator of FederatesExporter.js');
                artifact.addFile(fullPath, code,
                                 function (err)
                                 {if (err) {callback(err); return;}}
                                 );
              }
            // add fom XML files to artifact
            fullPath = directory + feder.name + '.xml';
            template = TEMPLATES['fedfile.xml.ejs'];
            code = ejs.render(template, fomModelXml);
            fedEx.logger.info('calling addFile for ' + fullPath +
                              ' in fomGenerator of FederatesExporter.js');
            artifact.addFile(fullPath, code,
                             (remaining ?
                              function (err) // there are more
                              {if (err) {callback(err); return;}} :
                              function (err) // last one
                              {if (err) {callback(err); return;}
                                else {callback();}}
                              )
                            );
          } // end for
      }); // end push
    }; // end fomGenerator

/* ******************************************************************* */

/* prototypeMain */
/** (function-valued variable of top-level function object)<br><br>

Returned Value: none<br><br>

Called By: ?<br><br>

This is the main function for the plugin to execute; it will perform
the execution<br><br>

This is called by an unknown function when executing the federates
exporter is triggered.

Use self to access core, project, result, etc from PluginBase;
these are all instantiated at this point.<br><br>

The callback always has to be called even if an error happened.<br>

*/
    prototypeMain = function( /* ARGUMENTS                         */
     /** {function(string, plugin.PluginResult)} callback function */ callback)
    {
      var self = this;            // federates exporter function
      var feder;                  // for-in variable
      var generateFiles;          // function
      var numberOfFileGenerators; // counter used in generateFiles function
      var finishExport;           // function
      var saveAndReturn;          // function

      self.logger.enabled = true;
      self.fileGenerators = [];
      self.corefileGenerators = [];
      self.fom_sheets = {};
      self.interactions = {};
      self.interactionRoots = [];
      self.objects      = {};
      self.objectRoots = [];
      self.attributes   = {};
      self.federates = {};
      self.javafederateName = {};
      self.fedFilterMap = {};
      self.fedFilterMap["MAPPER_FEDERATES"] = "MAPPER";
      self.fedFilterMap["NON-MAPPER_FEDERATES"] = "NON_MAPPER";
      self.fedFilterMap["BOTH"] = "ORIGIN_FILTER_DISABLED";
      self.fedFilterMap["SELF"] = "SELF";
      self.fedFilterMap["NON-SELF"] = "NON_SELF";

      self.projectName = self.core.getAttribute(self.rootNode, 'name');
      self.project_version =
      self.getCurrentConfig().exportVersion.trim() +
      (self.getCurrentConfig().isRelease ? "" : "-SNAPSHOT");
      self.cpswt_version = self.getCurrentConfig().cpswtVersion.trim();
      self.directoryNameTemplate=
      '<%=federation_name%><%=artifact_name?"-"+artifact_name:""%><%=language?"-"+language:""%>';
      self.generateExportPackages =
        self.getCurrentConfig().generateExportPackages;
      self.mainPom.artifactId = self.projectName + "-root";
      self.mainPom.version = self.project_version;
      self.mainPom.packaging = "pom";
      self.mainPom.groupId = self.getCurrentConfig().groupId.trim();
      self.mainPom.addRepository(
        {
           'id': 'archiva.internal',
           'name': 'Internal Release Repository',
           'url': self.getCurrentConfig().repositoryUrlRelease.trim()
        });

      self.mainPom.addSnapshotRepository(
        {
           'id': 'archiva.snapshots',
           'name': 'Internal Snapshot Repository',
           'url': self.getCurrentConfig().repositoryUrlSnapshot.trim()
        });
      self.getCurrentConfig().includedFederateTypes.trim().split(" ").
        forEach(function(e)
          {
            if (self.federateTypes.hasOwnProperty(e))
              {
                self.federateTypes[e].includeInExport = true;
                if (self.federateTypes[e].hasOwnProperty('init'))
                  {
                    self.federateTypes[e].init.call(self); 
                  }
              }
          }); // end forEach

/* ******************************************************************* */

/* generateFiles */
/** (function-valued variable of prototypeMain)<br><br>

Returned Value: none<br><br>

Called By:<br>
  finishExport<br>
  generateFiles (recursively)<br><br>

This generates the text of files to be included in the output. It executes
one file generating function on each recursive call.<br>

*/      

      generateFiles = function( /* ARGUMENTS                 */
       /** (object) holding the text of files                */ artifact,
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

/* saveAndReturn */
/** (function-valued variable of prototypeMain)<br><br>

Returned Value: none<br><br>

Called By: finishExport<br><br>

This calls saveAllArtifacts to save all the files that have been
generated.<br><br>

It uses the self variable from FederatesExporter.prototype.main.<br>

*/      

      saveAndReturn = function( /* ARGUMENTS     */
       /** (string)  an error string or null (?) */ err)
      {
        var errorRaised;
        var i;
        var msg;
        var idx;
        var artifactMsg;
        var buildURL;

        errorRaised = false;
        for (i = 0; i < self.result.getMessages().length; i++)
          {
            msg = self.result.getMessages()[i];
            if (msg.severity == 'error')
              {
                errorRaised = true;
              }
          }
        if (!errorRaised)
          {
            self.blobClient.saveAllArtifacts(function (err, hashes)
            {
              if (err)
                {
                  callback(err, self.result);
                  return;
                }
              for (idx = 0; idx < hashes.length; idx++)
                {
                  self.result.addArtifact(hashes[idx]);
                  artifactMsg =
                    'Code package ' +
                    self.blobClient.artifacts[idx].name +
                    ' was generated with id:[' + hashes[idx] + ']';
                  self.createMessage(null, artifactMsg );
                };
              self.result.setSuccess(true);
              callback(null, self.result);
              return;
            });
          }
        else
          {
            self.result.setSuccess(false);
            callback(null, self.result);
            return;
          }
      }; // end saveAndReturn

/* ******************************************************************* */

/* finishExport */
/** (function-valued variable of FederatesExporter.prototype.main)<br><br>

Returned Value: none unless there is an error<br><br>

Called By: anonymous function used as an argument to
  visitAllChildrenFromRootContainer<br><br>

After all nodes have been visited, this function uses the data structures
that have been built to generate and export files.<br>

*/      

      finishExport = function( /* ARGUMENTS     */
       /** (string) an error string or null (?) */ err)
      {
        var artifact;
        var coreArtifact;

        artifact =
          self.blobClient.createArtifact
            (self.projectName.trim().replace(/\s+/g,'_') + '_generated');
        fomGenerator(self);
        buildScriptGenerator(self);
        if (self.generateExportPackages)
          {
            coreArtifact =
              self.blobClient.createArtifact('generated_Core_Files');
          }
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
              numberOfFileGenerators = self.corefileGenerators.length;
              if (self.generateExportPackages &&
                  numberOfFileGenerators > 0)
                {
                  generateFiles(coreArtifact,
                                self.corefileGenerators, function(err)
                    {
                      if (err)
                        {
                          callback(err, self.result);
                          return;
                        }
                      saveAndReturn();
                      return;
                    });
                }
              else
                {
                  saveAndReturn();
                  return;
                }
            });
          }
        else
          {
            self.result.setSuccess(true);
            callback(null, self.result);
          } 
      }; // end finishExport

/* ******************************************************************* */

/* 

This is a call to the visitAllChildrenFromRootContainer function, which
is defined in ModelTraverserMixin.js. The anonymous function is the second
argument.

*/

      self.visitAllChildrenFromRootContainer(self.rootNode, function(err)
      {
        if (err)
          {
            self.createMessage(null, err, 'error');
            self.result.setSuccess(false);
            callback(null, self.result);
          }
        else
          {
            finishExport(err);
          }
      }); // end function definition and call

/* ******************************************************************* */

    }; // end FederatesExporter.prototype.main

    FederatesExporter.prototype.main = prototypeMain;

/* ******************************************************************* */

/* calculateParentPath */
/** (function-valued variable of top-level function object)<br><br>

Returned Value:  the path with the last entry removed<br><br>

Called By: C2Core/ModelTraverserMixin.js<br><br>

For example, if path is '/a/b/c', this returns '/a/b'.<br>

*/
    calculateParentPath = function( /* ARGUMENTS            */
     /** (string) path to a file or directory e.g. '/a/b/c' */  path)
      {
        var pathElements;

        if (!path)
          {
            return null;
          }
        pathElements = path.split('/');
        pathElements.pop();
        return pathElements.join('/');
      };

      FederatesExporter.prototype.calculateParentPath = calculateParentPath;

/* ******************************************************************* */

/* excludeFromVisit */
/** (function-valued variable of top-level function object)<br><br>

Returned Value: true or false<br><br>

Called By: visitAllChildrenRec (in ModelTraverserMixin.js)<br><br>

A node that is not the root node is excluded from being visited if any
of the following is true<br>
- its metatype is 'Language [C2WT]'<br>
- its metatype is 'CPSWT.CPSWTMeta.Language [C2WT]'<br>
- its metatype has not been included in the metatypes to be exported<br>
- EnableCodeGeneration is set to false for its metatype<br><br>

In C2Core/ModelTraverserMixin.js, this.excludeFromVisit is set to this
function.<br>

*/

    excludeFromVisit = function( /* ARGUMENTS */
     /** a webGME node to test for being excluded      */ node)
    {
      var self;
      var exclude;
      var nodeName;
      var nodeMetaTypeName;

      self = this;
      exclude = false;

      if (self.rootNode != node)
        {
          nodeName = self.core.getAttribute(node, 'name');
          nodeMetaTypeName = ((nodeName === 'CPSWT') ? 'CPSWT' :
                              (nodeName === 'CPSWTMeta') ? 'CPSWTMeta' :
                self.core.getAttribute(self.getMetaType(node),'name'));
          exclude = exclude 
            || self.isMetaTypeOf(node, self.META['Language [C2WT]'])
            || self.isMetaTypeOf(node,
                        self.META['CPSWT.CPSWTMeta.Language [CPSWT]'])
            || (self.federateTypes.hasOwnProperty(nodeMetaTypeName) &&
                !self.federateTypes[nodeMetaTypeName].includeInExport)
            || ((nodeMetaTypeName in self.federateTypes) &&
                !self.core.getAttribute(node, 'EnableCodeGeneration'));
        }
      return exclude;
    }; // end excludeFromVisit

    FederatesExporter.prototype.excludeFromVisit = excludeFromVisit;

/* ******************************************************************* */

/* ROOT_Visitor */
/** (function-valued variable of top-level function object)<br><br>

Returned Value:  a context object as shown in the function<br><br>

Called By: C2Core/ModelTraverserMixin.js (for the ROOT node)<br><br>

This builds the starting context object, which is enhanced in many
functions.<br><br>

This function does not use any information from the node.<br>

*/

    ROOT_visitor = function(/* ARGUMENTS */
     /** a webGME ROOT node              */ node)
    {
      var self = this;
      var root = {"@id": 'model:' + '/root',
                  "@type": "gme:root",
                  "model:name": self.projectName,
                  "gme:children": []};
      return {context:{parent: root}};
    };

    FederatesExporter.prototype.ROOT_visitor = ROOT_visitor;

/* ******************************************************************* */

    return FederatesExporter;
 }); // end define
