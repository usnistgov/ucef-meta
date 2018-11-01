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

The first four of these functions are called in the atModelNode function
of ModelTraverserMixin.js (at ret = ...).  The "parent"
argument is not used in any of the functions, but is needed to be a
placeholder in the arguments. All of the visit_XXX functions (many of
which are defined elsewhere but are called from atModelNode) take the
arguments (node, parent, context). They are called by constructing
the name by concatenating 'visit_' with the name of the type of node.

It is not clear whether the last two functions are used anywhere. They
are not called in running the FederatesExporter in the SOMGeneration
project or the SOMGenerationWithObjects project.

*/

define
([],
 function()
 {
   'use strict';
    console.log("beginning of function in 'define' in PubSubVisitors.js");
    console.log("defining PubSubVisitors function");

    var PubSubVisitors = function()
    {
      console.log("executing PubSubVisitors");

/***********************************************************************/

/* this.visit_StaticInteractionPublish

Returned Value: a context object whose context property is the context
  argument, possibly with data added.

Called By: See notes at top.

This processes data for a StaticInteractionPublish.

Where the entry for the interaction is made in pubSubInteractions, a
check is made whether there is already an entry, because it may have
been created in visit_StaticInteractionSubscribe.

*/
      console.log("defining this.visit_StaticInteractionPublish");
      this.visit_StaticInteractionPublish = function(node, parent, context)
      {
        var self = this,
            publication = {interaction: self.core.getPointerPath(node,'dst'),
                           federate: self.core.getPointerPath(node,'src')},
            nodeAttrNames = self.core.getAttributeNames(node);
        console.log("executing visit_StaticInteractionPublish");
        if (!publication.interaction )
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
	  { //only FederatesExporter has pubSubInteractions
	    if (publication.interaction in self.pubSubInteractions)
	      {
		self.pubSubInteractions[publication.interaction].publish = 1;
	      }
	    else
	      {
		self.pubSubInteractions[publication.interaction] =
		{publish: 1,
		 subscribe: 0};
	      }
	  }
        for ( var i = 0; i < nodeAttrNames.length; i += 1 )
          {
            publication[nodeAttrNames[i]] =
              self.core.getAttribute( node, nodeAttrNames[i]);
          }
        publication['handler'] = function(federate, interaction)
        {
          var interactiondata = {name: interaction.name,
                                 fullName: interaction.fullName,
                                 parameters: interaction.parameters,
                                 publishedLoglevel: publication['LogLevel']};
          if (federate['publishedinteractiondata'])
            {
              federate['publishedinteractiondata'].push(interactiondata);
            }
        }
        if (context['pubsubs'])
          {
            context['pubsubs'].push(publication);
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
been created in visit_StaticInteractionPublish.

*/
      console.log("defining this.visit_StaticInteractionSubscribe");
      this.visit_StaticInteractionSubscribe = function(node, parent, context)
      {
        var self = this,
        subscription = {interaction: self.core.getPointerPath(node,'src'),
                        federate: self.core.getPointerPath(node,'dst')},
        nodeAttrNames = self.core.getAttributeNames(node);

      console.log("executing visit_StaticInteractionSubscribe");
        if (!subscription.interaction )
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
	  { //only FederatesExporter has pubSubInteractions
	    if (subscription.interaction in self.pubSubInteractions)
	      {
		self.pubSubInteractions[subscription.interaction].subscribe = 1;
	      }
	    else
	      {
		self.pubSubInteractions[subscription.interaction] =
		{publish: 0,
		 subscribe: 1};
	      }
	  }
        for ( var i = 0; i < nodeAttrNames.length; i += 1 )
          {
            subscription[nodeAttrNames[i]] =
            self.core.getAttribute(node, nodeAttrNames[i]);
          }
        subscription['handler'] = function(federate, interaction)
        { // Interaction might get connected to a Mapper on a
          // different FOMSheet. Resolve correct filter at render time.
          var interactiondata =
            {name: interaction.name,
                   fullName: interaction.fullName,
                   parameters: interaction.parameters,
                   subscribedLoglevel: subscription['LogLevel'],
                   originFedFilter: function()
               {
                 return self.fedFilterMap[subscription['OriginFedFilter']];
               },
                   srcFedFilter: function()
               {
                 return interaction['isMapperPublished'] ?
                 self.fedFilterMap[subscription['SrcFedFilter']] :
                 'SOURCE_FILTER_DISABLED';
               }
            };

          if (federate['subscribedinteractiondata'])
            {
              federate['subscribedinteractiondata'].push(interactiondata);
            }
        }
        if (context['pubsubs'])
          {
            context['pubsubs'].push(subscription);
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
created in visit_StaticObjectSubscribe.

*/
      console.log("defining this.visit_StaticObjectPublish");
      this.visit_StaticObjectPublish = function(node, parent, context)
      {
        var self = this,
        publication = {object: self.core.getPointerPath(node,'dst'),
                       federate: self.core.getPointerPath(node,'src')},
        nodeAttrNames = self.core.getAttributeNames(node);

	console.log("executing visit_StaticObjectPublish");
        if (!publication.object )
          {
            self.createMessage(node,
                 '[ERROR] Invalid dst pointer in StaticObjectPublish!',
                               'error');
          }
        if (!publication.federate)
          {
            self.createMessage(node,
                 '[ERROR] Invalid src pointer in StaticObjectPublish!',
                               'error');
          }
	if (self.pubSubObjects)
	  {// only FederatesExporter has pubSubObjects
	    if (publication.object in self.pubSubObjects) //added
	      {
		self.pubSubObjects[publication.object].publish = 1;
	      }
	    else
	      {
		self.pubSubObjects[publication.object] = {publish: 1,
							  subscribe: 0};
	      }
	  }
        for ( var i = 0; i < nodeAttrNames.length; i += 1 )
          {
            publication[nodeAttrNames[i]] =
            self.core.getAttribute( node, nodeAttrNames[i]);
          }
        publication['handler'] = function(federate, object)
        {
          var objectdata = {name: object.name,
                            fullName: object.fullName,
                            parameters: object.parameters,
                            publishedLoglevel: publication['LogLevel']};
          objectdata['publishedAttributeData']=[];
          objectdata['logPublishedAttributeData'] = [];
          object['attributes'].forEach(function(a)
          {
            objectdata['publishedAttributeData'].push(a);
            if (publication['EnableLogging'])
              {
                objectdata['logPublishedAttributeData'].push(a);
              }
          });
          if (federate['publishedobjectdata'])
            {
              federate['publishedobjectdata'].push(objectdata);
            }
        }
        if (context['pubsubs'])
          {
            context['pubsubs'].push(publication);
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
created in visit_StaticObjectPublish.

*/
      console.log("defining this.visit_StaticObjectSubscribe");
      this.visit_StaticObjectSubscribe = function(node, parent, context)
      {
        var self = this,
            subscription = {object: self.core.getPointerPath(node,'src'),
                            federate: self.core.getPointerPath(node,'dst')},
            nodeAttrNames = self.core.getAttributeNames(node);

	console.log("executing visit_StaticObjectSubscribe");
        if (!subscription.object )
          {
            self.createMessage(node,
                 '[ERROR] Invalid src pointer in StaticObjectSubscribe!',
                               'error');
          }
        if (!subscription.federate)
          {
            self.createMessage(node,
                 '[ERROR] Invalid dst pointer in StaticObjectSubscribe!',
                               'error');
          }
	if (self.pubSubObjects)
	  {// only FederatesExporter has pubSubObjects
	    if (subscription.object in self.pubSubObjects)
	      {
		self.pubSubObjects[subscription.object].subscribe = 1;
	      }
	    else
	      {
		self.pubSubObjects[subscription.object] = {publish: 0,
							   subscribe: 1};
	      }
	  }
        for ( var i = 0; i < nodeAttrNames.length; i += 1 )
          {
            subscription[nodeAttrNames[i]] =
            self.core.getAttribute(node, nodeAttrNames[i]);
          }   
        subscription['handler'] = function(federate, object)
        {
          var objectdata = {name: object.name,
                            fullName: object.fullName,
                            parameters: object.parameters,
                            subscribedLoglevel: subscription['LogLevel']};
          objectdata['subscribedAttributeData'] = [];
          objectdata['logSubscribedAttributeData'] = [];
          object['attributes'].forEach(function(a)
          {
            objectdata['subscribedAttributeData'].push(a);
            if (subscription['EnableLogging'])
              {
                objectdata['logSubscribedAttributeData'].push(a);
              }
          });
          if (federate['subscribedobjectdata'])
            {
              federate['subscribedobjectdata'].push(objectdata);
            }
        }
        if (context['pubsubs'])
          {
            context['pubsubs'].push(subscription);
          }
        return {context:context};
      };

/***********************************************************************/

      console.log("defining this.visit_StaticObjectAttributePublish");
      this.visit_StaticObjectAttributePublish =
      function(node, parent, context)
      {
        var self = this,
        publication =
          {object:
             self.calculateParentPath(self.core.getPointerPath(node,'dst')),
           attribute: self.core.getPointerPath(node,'dst'),
           federate: self.core.getPointerPath(node,'src')
          },
        nodeAttrNames = self.core.getAttributeNames(node);
	console.log("executing visit_StaticObjectAttributeSubscribe");

        if (!publication.object )
          {
            self.createMessage(node,
                '[ERROR] Invalid dst pointer in StaticObjectAttributePublish!',
                               'error');
          }
        if (!publication.attribute )
          {
            self.createMessage(node,
                '[ERROR] Invalid dst pointer in StaticObjectAttributePublish!',
                               'error');
          }
        if (!publication.federate)
          {
            self.createMessage(node,
                '[ERROR] Invalid src pointer in StaticObjectAttributePublish!',
                               'error');
          }
        for (var i = 0; i < nodeAttrNames.length; i++)
          {
            publication[nodeAttrNames[i]] =
            self.core.getAttribute( node, nodeAttrNames[i]);
          }
        publication['handler'] = function(federate, object)
        {
          var objectdata = {name: object.name,
                            publishedLoglevel: publication['LogLevel'],
                            publishedAttributeData: [],
                            logPublishedAttributeData: []};
          
          if (federate['publishedobjectdata'])
            {
              var alreadyRegistered = false;
              federate['publishedobjectdata'].forEach(function(odata)
                  {
                    if (odata.name === objectdata.name)
                      {
                        alreadyRegistered = true;
                        objectdata = odata;
                      }
                  });
              if (!alreadyRegistered)
                {
                  federate['publishedobjectdata'].push(objectdata);
                }
            }
          if (self.attributes[publication.attribute])
            {
              var a = self.attributes[publication.attribute];
              objectdata['publishedAttributeData'].push(a);
              if (publication['EnableLogging'])
                {
                  objectdata['logPublishedAttributeData'].push(a);
                }
            };
        }
        if (context['pubsubs'])
          {
            context['pubsubs'].push(publication);
          }
        return {context:context};
      };

/***********************************************************************/

      console.log("defining this.visit_StaticObjectAttributeSubscribe");
      this.visit_StaticObjectAttributeSubscribe = function(node,parent,context)
      {
        var self = this,
            subscription =
            {object:
               self.calculateParentPath(self.core.getPointerPath(node,'src')),
             attribute: self.core.getPointerPath(node,'src'),
             federate: self.core.getPointerPath(node,'dst')
            },
            nodeAttrNames = self.core.getAttributeNames(node);

	console.log("executing visit_StaticObjectAttributeSubscribe");
        if (!subscription.object )
          {
            self.createMessage(node,
               '[ERROR] Invalid src pointer in StaticObjectAttributeSubscribe!',
                               'error');
          }
        if (!subscription.attribute )
          {
            self.createMessage(node,
               '[ERROR] Invalid src pointer in StaticObjectAttributeSubscribe!',
                               'error');
          }
        if (!subscription.federate)
          {
            self.createMessage(node,
               '[ERROR] Invalid dst pointer in StaticObjectAttributeSubscribe!',
                               'error');
          }
        for (var i = 0; i < nodeAttrNames.length; i++)
          {
            subscription[nodeAttrNames[i]] =
            self.core.getAttribute( node, nodeAttrNames[i]);
          }
        subscription['handler'] = function(federate, object)
        {
          var objectdata = {name: object.name,
                            subscribedLoglevel: subscription['LogLevel'],
                            subscribedAttributeData: [],
                            logSubscribedAttributeData: []};

          if (federate['subscribedobjectdata'])
            {
              var alreadyRegistered = false;
              federate['subscribedobjectdata'].forEach(function(odata)
                {
                  if (odata.name === objectdata.name)
                    {
                      alreadyRegistered = true;
                      objectdata = odata;
                    }
                });
              if (!alreadyRegistered)
                {
                  federate['subscribedobjectdata'].push(objectdata);
                }
            }
          if (self.attributes[subscription.attribute])
            {
              var a = self.attributes[subscription.attribute];
              
              objectdata['subscribedAttributeData'].push(a);
              if (subscription['EnableLogging'])
                {
                  objectdata['logSubscribedAttributeData'].push(a);
                }
            };
        }
        if (context['pubsubs'])
          {
            context['pubsubs'].push(subscription);
          }
        return {context:context};
      };

/***********************************************************************/
      
      console.log("finished executing PubSubVisitors");
    };
    console.log("end of function in 'define' in PubSubVisitors.js");
    return PubSubVisitors;
 });

/***********************************************************************/
