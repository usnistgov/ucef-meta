/*

Modified by T. Kramer

Reformatted in C style, as far as possible.
dst = destination, src = source

This is executed automatically at the beginning of
FederatesExporter.js and DeploymentExporter.js in the first stages of
running the "define" at the top level of that file. The result of the
execution is that the PubSubVisitors argument in the function of the
"define" is defined as a function.

The PubSubVisitors function is then called at the
"PubSubVisitors.call(this);" line of FederatesExporter.js and
DeploymentExporter.js when the FederatesExporter or DeploymentExporter
function starts to execute.

The result of calling the PubSubVisitors function is that six
functions are defined as properties of the FederatesExporter or
DeploymentExporter function (which is also an object). The lines of
this function that begin the definitions of the six functions are:

   this.visit_StaticInteractionPublish(node, parent, context)
   this.visit_StaticInteractionSubscribe(node, parent, context)
   this.visit_StaticObjectPublish(node, parent, context)
   this.visit_StaticObjectSubscribe(node, parent, context)
   this.visit_StaticObjectAttributePublish(node, parent, context)
   this.visit_StaticObjectAttributeSubscribe(node, parent, context)

The "this" above is either the FederatesExporter function in
FederatesExporter.js or the DeploymentExporter function in
DeploymentExporter.js.

These functions are called in the atModelNode function
of ModelTraverserMixin.js (at ret = ...).  The "parent"
argument is not used in any of the functions, but is needed to be a
placeholder in the arguments. All of the visit_XXX functions (many of
which are defined elsewhere but are called from atModelNode) take the
arguments (node, parent, context). They are called by constructing
the name by concatenating 'visit_' with the name of the type of node.

The last two functions are called in (at least) the deployment exporter
if there are crosscuts.

The createMessage function is defined in cpswt-meta/node_modules/webgme/
node_modules/webgme-engine/src/plugin/PluginBase.js . When createMessage
runs it packages the message (its second argument) inside a larger
pluginMessage along with other data and then does
    this.result.addMessage(pluginMessage);
which apparently just adds a message for the user to the result.

*/

define
([],
 function()
 {
    'use strict';
    var PubSubVisitors;  //function variable
    var lowerNamer;      //function variable

/***********************************************************************/

/* lowerNamer

Returned Value: string

Called By:
  visit_StaticInteractionPublish
  visit_StaticInteractionSubscribe
  visit_StaticObjectPublish
  visit_StaticObjectSubscribe
  visit_StaticObjectAttributePublish
  visit_StaticObjectAttributeSubscribe

The coname var is the codeName (CodeGeneratedName) of the obint
(object or interaction) if there is one or the name if not. The
returned value is the coname with the first character changed to lower
case.

*/

    lowerNamer = function(obint)
    {
      var coname;
      coname = (obint.codeName || obint.name);
      return (coname.charAt(0).toLowerCase() + coname.slice(1));
    };
    
/***********************************************************************/

    PubSubVisitors = function()
    {

/***********************************************************************/

/* this.visit_StaticInteractionPublish

Returned Value: a context object whose context property is the context
  argument, possibly with data added.

Called By: See notes at top.

This processes data for a StaticInteractionPublish.

Where the entry for the interaction is made in pubSubInts, a check is
made whether there is already an entry, because it may have been
created in visit_StaticInteractionSubscribe.

*/
      this.visit_StaticInteractionPublish =
      function( /* ARGUMENTS                                      */
       node,    /* (webgme node) a StaticInteractionPublish node  */
       parent,  /* (webgme node)? not used                        */
       context) /* (object)                                       */
      {
        var self = this;
        var publication = {interaction: self.core.getPointerPath(node,'dst'),
                           federate: self.core.getPointerPath(node,'src')};
        var nodeAttrNames = self.core.getAttributeNames(node);
        var pubSubInts = 0;
        var federateInfo;
        var i;
        
        if (!publication.interaction)
          {
            self.createMessage(node,
                 '[ERROR] Invalid dst pointer in StaticInteractionPublish!',
                               'error');
          }
        if (!publication.federate)
          {
            self.createMessage(node,
                 '[ERROR] Invalid src pointer in StaticInteractionPublish!',
                               'error');
          }
        if (self.pubSubInteractions)
          { // only DeploymentExporter has pubSubInteractions
            pubSubInts = self.pubSubInteractions;
          }
        
        else if (self.federateInfos)
          { // only FederatesExporter has federateInfos
            federateInfo = self.federateInfos[publication.federate];
            if (!federateInfo)
              {
                self.federateInfos[publication.federate] =
                  {name: null,
                   metaType: null,
                   generateCode: null,
                   directory: null,
                   pubSubObjects: {},
                   pubSubInteractions: {}};
                federateInfo = self.federateInfos[publication.federate];
              }
            pubSubInts = federateInfo.pubSubInteractions;
          }
        if (pubSubInts)
          { // for both DeploymentExporter and FederatesExporter
            if (publication.interaction in pubSubInts)
              {
                pubSubInts[publication.interaction].publish = 1;
              }
            else
              {
                pubSubInts[publication.interaction] = {publish: 1,
                                                       subscribe: 0};
              }
          }
        for (i = 0; i < nodeAttrNames.length; i += 1)
          {
            publication[nodeAttrNames[i]] =
              self.core.getAttribute(node, nodeAttrNames[i]);
          }
        publication.handler = function(federate, interaction)
        {
          var interactiondata =
            {name: interaction.name,
             codeName: interaction.codeName,
             codeNameOrName: (interaction.codeName || interaction.name),
             fullName: interaction.fullName,
             lowerName: lowerNamer(interaction),
             parameters: interaction.parameters,
             publishedLoglevel: publication.LogLevel};
          if (federate.publishedinteractiondata)
            {
              federate.publishedinteractiondata.push(interactiondata);
            }
        };
        if (context.pubsubs)
          {
            context.pubsubs.push(publication);
          }
        return {context:context};
      };

/***********************************************************************/

/* this.visit_StaticInteractionSubscribe

Returned Value: a context object whose context property is the context
  argument, possibly with data added.

Called By: See notes at top.

This processes data for a StaticInteractionSubscribe.

Where the entry for the interaction is made in pubSubInteractions, a
check is made whether there is already an entry, because it may have
been created in another visit_XXX function

*/
      this.visit_StaticInteractionSubscribe =
      function( /* ARGUMENTS                                       */
       node,    /* (webgme node) a StaticInteractionSubscribe node */
       parent,  /* (webgme node)? not used                         */
       context) /* (object)                                        */
      {
        var self = this;
        var subscription = {interaction: self.core.getPointerPath(node,'src'),
                            federate: self.core.getPointerPath(node,'dst')};
        var nodeAttrNames = self.core.getAttributeNames(node);
        var pubSubInts = 0;
        var federateInfo;
        var i;
        
        if (!subscription.interaction)
          {
            self.createMessage(node,
                 '[ERROR] Invalid src pointer in StaticInteractionSubscribe!',
                               'error');
          }
        if (!subscription.federate)
          {
            self.createMessage(node,
                 '[ERROR] Invalid dst pointer in StaticInteractionSubscribe!',
                               'error');
          }
        if (self.pubSubInteractions)
          { // only DeploymentExporter has pubSubInteractions
            pubSubInts = self.pubSubInteractions;
          }
        else if (self.federateInfos)
          { // only FederatesExporter has federateInfos
            federateInfo = self.federateInfos[subscription.federate];
            if (!federateInfo)
              {
                self.federateInfos[subscription.federate] =
                  {name: null,
                   metaType: null,
                   generateCode: null,
                   directory: null,
                   pubSubObjects: {},
                   pubSubInteractions: {}};
                federateInfo = self.federateInfos[subscription.federate];
              }
            pubSubInts = federateInfo.pubSubInteractions;
          }
        if (pubSubInts)
          { // for both DeploymentExporter and FederatesExporter
            if (subscription.interaction in pubSubInts)
              {
                pubSubInts[subscription.interaction].subscribe = 1;
              }
            else
              {
                pubSubInts[subscription.interaction] = {publish: 0,
                                                        subscribe: 1};
              }
          }
        for (i = 0; i < nodeAttrNames.length; i += 1)
          {
            subscription[nodeAttrNames[i]] =
            self.core.getAttribute(node, nodeAttrNames[i]);
          }
        subscription.handler = function(federate, interaction)
        { // Interaction might get connected to a Mapper on a
          // different FOMSheet. Resolve correct filter at render time.
          var interactiondata =
            {name: interaction.name,
             codeName: interaction.codeName,
             codeNameOrName: (interaction.codeName || interaction.name),
             fullName: interaction.fullName,
             lowerName: lowerNamer(interaction),
             parameters: interaction.parameters,
             subscribedLoglevel: subscription.LogLevel,
             originFedFilter: function()
               {
                 return self.fedFilterMap[subscription.OriginFedFilter];
               },
             srcFedFilter: function()
               {
                 return interaction.isMapperPublished ?
                 self.fedFilterMap[subscription.SrcFedFilter] :
                 'SOURCE_FILTER_DISABLED';
               }
            };
          if (federate.subscribedinteractiondata)
            {
              federate.subscribedinteractiondata.push(interactiondata);
            }
        }
        if (context.pubsubs)
          {
            context.pubsubs.push(subscription);
          }
        return {context:context};
      };

/***********************************************************************/

/* this.visit_StaticObjectPublish

Returned Value: a context object whose context property is the context
  argument, possibly with data added.

Called By: See notes at top.

This processes data for a StaticObjectPublish.

Where the entry for the object is made in pubSubObjects, a check is
made whether there is already an entry, because it may have been
created in another visit_XXX function.

*/
      this.visit_StaticObjectPublish =
      function( /* ARGUMENTS                                */
       node,    /* (webgme node) a StaticObjectPublish node */
       parent,  /* (webgme node)? not used                  */
       context) /* (object)                                 */
      {
        var self = this;
        var objId = self.core.getPointerPath(node,'dst');
        var fedId = self.core.getPointerPath(node,'src');
        var publication = {object: objId,
                           federate: fedId};
        var nodeAttrNames = self.core.getAttributeNames(node);
        var pubSubObjs = 0;
        var federateInfo;
        var i;
        
        if (!objId)
          {
            self.createMessage(node,
                 '[ERROR] Invalid dst pointer in StaticObjectPublish!',
                               'error');
          }
        if (!fedId)
          {
            self.createMessage(node,
                 '[ERROR] Invalid src pointer in StaticObjectPublish!',
                               'error');
          }
        if (self.pubSubObjects)
          { // only DeploymentExporter has pubSubObjects
            pubSubObjs = self.pubSubObjects;
          }
        else if (self.federateInfos)
          { // only FederatesExporter has federateInfos
            federateInfo = self.federateInfos[fedId];
            if (!federateInfo)
              {
                self.federateInfos[fedId] =
                  {name: null,
                   metaType: null,
                   generateCode: null,
                   directory: null,
                   pubSubObjects: {},
                   pubSubInteractions: {}};
                federateInfo = self.federateInfos[fedId];
              }
            pubSubObjs = federateInfo.pubSubObjects;
          }
        if (pubSubObjs)
          { // for both DeploymentExporter and FederatesExporter
            if (objId in pubSubObjs)
              {
                pubSubObjs[objId].publish = 1;
                pubSubObjs[objId].mayPublish = 1;
              }
            else
              {
                pubSubObjs[objId] = {publish: 1,
                                     mayPublish: 1,
                                     subscribe: 0,
                                     maySubscribe: 0,
                                     attribs: {}};
              }
          }
        for (i = 0; i < nodeAttrNames.length; i += 1)
          {
            publication[nodeAttrNames[i]] =
            self.core.getAttribute(node, nodeAttrNames[i]);
          }
        publication.handler = function(federate, object)
        {
          var objectdata =
            {name: object.name,
             codeName: object.codeName,
             codeNameOrName: (object.codeName || object.name),
             fullName: object.fullName,
             lowerName: lowerNamer(object),
             parameters: object.parameters,
             publishedLoglevel: publication.LogLevel};
          objectdata.publishedAttributeData = [];
          objectdata.logPublishedAttributeData = [];
          object.attributes.forEach(function(a)
          {
            objectdata.publishedAttributeData.push(a);
            if (publication.EnableLogging)
              {
                objectdata.logPublishedAttributeData.push(a);
              }
          });
          if (federate.publishedobjectdata)
            {
              federate.publishedobjectdata.push(objectdata);
            }
        }
        if (context.pubsubs)
          {
            context.pubsubs.push(publication);
          }
        return {context:context};
      };

/***********************************************************************/

/* this.visit_StaticObjectSubscribe

Returned Value: a context object whose context property is the context
  argument, possibly with data added.

Called By: See notes at top.

This processes data for a StaticObjectSubscribe.

Where the entry for the object is made in pubSubObjects, a check is
made whether there is already an entry, because it may have been
created in another visit_XXX function.

*/
      this.visit_StaticObjectSubscribe =
      function( /* ARGUMENTS                                  */
       node,    /* (webgme node) a StaticObjectSubscribe node */
       parent,  /* (webgme node)? not used                    */
       context) /* (object)                                   */
      {
        var self = this;
        var objId = self.core.getPointerPath(node,'src');
        var fedId = self.core.getPointerPath(node,'dst');
        var subscription = {object: objId,
                            federate: fedId};
        var nodeAttrNames = self.core.getAttributeNames(node);
        var pubSubObjs = 0;
        var federateInfo;
        var i;
        
        if (!objId)
          {
            self.createMessage(node,
                 '[ERROR] Invalid src pointer in StaticObjectSubscribe!',
                               'error');
          }
        if (!fedId)
          {
            self.createMessage(node,
                 '[ERROR] Invalid dst pointer in StaticObjectSubscribe!',
                               'error');
          }
        if (self.pubSubObjects)
          { // only DeploymentExporter has pubSubObjects
            pubSubObjs = self.pubSubObjects;
          }
        else if (self.federateInfos)
          { // only FederatesExporter has federateInfos
            federateInfo = self.federateInfos[fedId];
            if (!federateInfo)
              {
                self.federateInfos[fedId] =
                  {name: null,
                   metaType: null,
                   generateCode: null,
                   directory: null,
                   pubSubObjects: {},
                   pubSubInteractions: {}};
                federateInfo = self.federateInfos[fedId];
              }
            pubSubObjs = federateInfo.pubSubObjects;
          }
        if (pubSubObjs)
          { // for both DeploymentExporter and FederatesExporter
            if (objId in pubSubObjs)
              {
                pubSubObjs[objId].subscribe = 1;
                pubSubObjs[objId].maySubscribe = 1;
              }
            else
              {
                pubSubObjs[objId] = {publish: 0,
                                     mayPublish: 0,
                                     subscribe: 1,
                                     maySubscribe: 1,
                                     attribs: {}};
              }
          }
        for (i = 0; i < nodeAttrNames.length; i += 1)
          {
            subscription[nodeAttrNames[i]] =
              self.core.getAttribute(node, nodeAttrNames[i]);
          }   
        subscription.handler = function(federate, object)
        {
          var objectdata =
            {name: object.name,
             codeName: object.codeName,
             codeNameOrName: (object.codeName || object.name),
             fullName: object.fullName,
             lowerName: lowerNamer(object),
             parameters: object.parameters,
             subscribedLoglevel: subscription.LogLevel};
          objectdata.subscribedAttributeData = [];
          objectdata.logSubscribedAttributeData = [];
          object.attributes.forEach(function(a)
          {
            objectdata.subscribedAttributeData.push(a);
            if (subscription.EnableLogging)
              {
                objectdata.logSubscribedAttributeData.push(a);
              }
          });
          if (federate.subscribedobjectdata)
            {
              federate.subscribedobjectdata.push(objectdata);
            }
        }
        if (context.pubsubs)
          {
            context.pubsubs.push(subscription);
          }
        return {context:context};
      };

/***********************************************************************/

/* this.visit_StaticObjectAttributePublish

Returned Value: a context object whose context property is the context
  argument, possibly with data added.

Called By: See notes at top.

This processes data for a StaticObjectAttributePublish.

Where the entry for the object is made in pubSubObjects, a check is
made whether there is already an entry, because it may have been
created in another visit_XXX function.

*/
      this.visit_StaticObjectAttributePublish =
      function( /* ARGUMENTS                                         */
       node,    /* (webgme node) a StaticObjectAttributePublish node */
       parent,  /* (webgme node)? not used                           */
       context) /* (object)                                          */
      {
        var self = this;
        var fedId = self.core.getPointerPath(node,'src');
        var objId =
          self.calculateParentPath(self.core.getPointerPath(node,'dst'));
        var attrId = self.core.getPointerPath(node,'dst');
        var publication =
          {object: objId,
           attribute: attrId,
           federate: fedId
          };
        var nodeAttrNames = self.core.getAttributeNames(node);
        var pubSubObjs = 0;
        var federateInfo;
        var i;
        
        if (!objId)
          {
            self.createMessage(node,
                '[ERROR] Invalid dst pointer in StaticObjectAttributePublish!',
                               'error');
          }
        if (!attrId)
          {
            self.createMessage(node,
                '[ERROR] Invalid dst pointer in StaticObjectAttributePublish!',
                               'error');
          }
        if (!fedId)
          {
            self.createMessage(node,
                '[ERROR] Invalid src pointer in StaticObjectAttributePublish!',
                               'error');
          }
        if (self.pubSubObjects)
          { // only DeploymentExporter has pubSubObjects
            pubSubObjs = self.pubSubObjects;
          }
        else if (self.federateInfos)
          { // only FederatesExporter has federateInfos
            federateInfo = self.federateInfos[fedId];
            if (!federateInfo)
              {
                self.federateInfos[fedId] =
                  {name: null,
                   metaType: null,
                   generateCode: null,
                   directory: null,
                   pubSubObjects: {},
                   pubSubInteractions: {}};
                federateInfo = self.federateInfos[fedId];
              }
            pubSubObjs = federateInfo.pubSubObjects;
          }
        if (pubSubObjs)
          { // for both DeploymentExporter and FederatesExporter
            if (objId in pubSubObjs)
              {
                if (attrId in pubSubObjs[objId].attribs)
                  {
                    pubSubObjs[objId].attribs[attrId].publish = 1;
                  }
                else
                  {
                    pubSubObjs[objId].attribs[attrId] = {publish: 1,
                                                         subscribe: 0};
                  }
              }
            else
              {
                pubSubObjs[objId] = {publish: 0,
                                     mayPublish: 0,
                                     subscribe: 0,
                                     maySubscribe: 0,
                                     attribs: {}};
                pubSubObjs[objId].attribs[attrId] = {publish: 1,
                                                     subscribe: 0};
              }
          }
        for (i = 0; i < nodeAttrNames.length; i++)
          {
            publication[nodeAttrNames[i]] =
              self.core.getAttribute(node, nodeAttrNames[i]);
          }
        publication.handler = function(federate, object)
        {
          var objectdata =
            {name: object.name,
             codeName: object.codeName,
             codeNameOrName: (object.codeName || object.name),
             fullName: object.fullName,
             lowerName: lowerNamer(object),
             parameters: object.parameters,
             publishedLoglevel: publication.LogLevel,
             publishedAttributeData: [],
             logPublishedAttributeData: []};
          
          if (federate.publishedobjectdata)
            {
              var alreadyRegistered = false;
              federate.publishedobjectdata.forEach(function(odata)
                  {
                    if (odata.name === objectdata.name)
                      {
                        alreadyRegistered = true;
                        objectdata = odata;
                      }
                  });
              if (!alreadyRegistered)
                {
                  federate.publishedobjectdata.push(objectdata);
                }
            }
          if (self.attributes[attrId])
            {
              var a = self.attributes[attrId];
              objectdata.publishedAttributeData.push(a);
              if (publication.EnableLogging)
                {
                  objectdata.logPublishedAttributeData.push(a);
                }
            };
        }
        if (context.pubsubs)
          {
            context.pubsubs.push(publication);
          }
        return {context:context};
      };

/***********************************************************************/

/* this.visit_StaticObjectAttributeSubscribe

Returned Value: a context object whose context property is the context
  argument, possibly with data added.

Called By: See notes at top.

This processes data for a StaticObjectAttributeSubscribe.

Where the entry for the object is made in pubSubObjects, a check is
made whether there is already an entry, because it may have been
created in another visit_XXX function.

*/
      this.visit_StaticObjectAttributeSubscribe =
      function( /* ARGUMENTS                                           */
       node,    /* (webgme node) a StaticObjectAttributeSubscribe node */
       parent,  /* (webgme node)? not used                             */
       context) /* (object)                                            */
      {
        var self = this;
        var fedId = self.core.getPointerPath(node,'dst');
        var objId =
          self.calculateParentPath(self.core.getPointerPath(node,'src'));
        var attrId = self.core.getPointerPath(node,'src');
        var subscription =
            {object: objId,
             attribute: attrId,
             federate: fedId
            };
        var nodeAttrNames = self.core.getAttributeNames(node);
        var pubSubObjs = 0;
        var federateInfo;
        var i;

        if (!objId)
          {
            self.createMessage(node,
               '[ERROR] Invalid src pointer in StaticObjectAttributeSubscribe!',
                               'error');
          }
        if (!attrId)
          {
            self.createMessage(node,
               '[ERROR] Invalid src pointer in StaticObjectAttributeSubscribe!',
                               'error');
          }
        if (!fedId)
          {
            self.createMessage(node,
               '[ERROR] Invalid dst pointer in StaticObjectAttributeSubscribe!',
                               'error');
          }
        if (self.pubSubObjects)
          { // only DeploymentExporter has pubSubObjects
            pubSubObjs = self.pubSubObjects;
          }
        else if (self.federateInfos)
          { // only FederatesExporter has federateInfos
            federateInfo = self.federateInfos[fedId];
            if (!federateInfo)
              {
                self.federateInfos[fedId] =
                  {name: null,
                   metaType: null,
                   generateCode: null,
                   directory: null,
                   pubSubObjects: {},
                   pubSubInteractions: {}};
                federateInfo = self.federateInfos[fedId];
              }
            pubSubObjs = federateInfo.pubSubObjects;
          }
        if (pubSubObjs)
          { // for both DeploymentExporter and FederatesExporter
            if (objId in pubSubObjs)
              {
                if (attrId in pubSubObjs[objId].attribs)
                  {
                    pubSubObjs[objId].attribs[attrId].subscribe = 1;
                  }
                else
                  {
                    pubSubObjs[objId].attribs[attrId] = {publish: 0,
                                                         subscribe: 1};
                  }
              }
            else
              {
                pubSubObjs[objId] = {publish: 0,
                                     mayPublish: 0,
                                     subscribe: 0,
                                     maySubscribe: 0,
                                     attribs: {}};
                pubSubObjs[objId].attribs[attrId] = {publish: 0,
                                                     subscribe: 1};
              }
          }
        for (i = 0; i < nodeAttrNames.length; i++)
          {
            subscription[nodeAttrNames[i]] =
            self.core.getAttribute(node, nodeAttrNames[i]);
          }
        subscription.handler = function(federate, object)
        {
          var objectdata =
            {name: object.name,
             codeName: object.codeName,
             codeNameOrName: (object.codeName || object.name),
             fullName: object.fullName,
             lowerName: lowerNamer(object),
             parameters: object.parameters,
             subscribedLoglevel: subscription.LogLevel,
             subscribedAttributeData: [],
             logSubscribedAttributeData: []};

          if (federate.subscribedobjectdata)
            {
              var alreadyRegistered = false;
              federate.subscribedobjectdata.forEach(function(odata)
                {
                  if (odata.name === objectdata.name)
                    {
                      alreadyRegistered = true;
                      objectdata = odata;
                    }
                });
              if (!alreadyRegistered)
                {
                  federate.subscribedobjectdata.push(objectdata);
                }
            }
          if (self.attributes[attrId])
            {
              var a = self.attributes[attrId];
              
              objectdata.subscribedAttributeData.push(a);
              if (subscription.EnableLogging)
                {
                  objectdata.logSubscribedAttributeData.push(a);
                }
            };
        }
        if (context.pubsubs)
          {
            context.pubsubs.push(subscription);
          }
        return {context:context};
      };

/***********************************************************************/
      
    };
    return PubSubVisitors;
 });

/***********************************************************************/
