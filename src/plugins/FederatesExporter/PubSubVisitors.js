/*

Modified by T. Kramer

Reformatted in C style, as far as possible.
probably dst = destination, src = source

The var PubSubVisitors defines six functions (some have sub-functions):
   this.visit_StaticInteractionPublish(node, parent, context)
   this.visit_StaticInteractionSubscribe(node, parent, context)
   this.visit_StaticObjectPublish(node, parent, context)
   this.visit_StaticObjectSubscribe(node, parent, context)
   this.visit_StaticObjectAttributePublish(node, parent, context)
   this.visit_StaticObjectAttributeSubscribe(node, parent, context)

As called, the "this" is the FederatesExporter in FederatesExporter.js.

The first four of these functions are called in the atModelNode function
of ModelTraverserMixin.js (at ret = ...).  The "parent"
argument is not used in any of the functions, but is needed to be a
placeholder in the arguments. All of the visit_XXX functions (many of
which are defined elsewhere but are called from atModelNode take the
arguments (node, parent, context). They are called by constructing
the name by concatenating 'visit_' with the name of the type of node.

It is not clear whether the last two functions are used anywhere.

*/

define
([],
 function ()
 {
   'use strict';

    var PubSubVisitors  = function ()
      {
	console.log("in PubSubVisitors function");
        this.visit_StaticInteractionPublish = function(node, parent, context)
	{
	  var self = this,
	  publication = {interaction: self.core.getPointerPath(node,'dst'),
			 federate: self.core.getPointerPath(node,'src')},
	  nodeAttrNames = self.core.getAttributeNames(node);

	  console.log("in PubSubVisitors/visit_StaticInteractionPublish function");
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
	  self.pubSubInteractions.push(publication.interaction); //added
	  for ( var i = 0; i < nodeAttrNames.length; i += 1 )
	    {
                publication[nodeAttrNames[i]] =
		self.core.getAttribute( node, nodeAttrNames[i]);
            }
	  publication['handler'] = function(federate, interaction)
	  {
	    var interactiondata = {name: interaction.name,
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
        }

        this.visit_StaticInteractionSubscribe = function(node, parent, context)
	{
	  var self = this,
	  subscription = {interaction: self.core.getPointerPath(node,'src'),
			  federate: self.core.getPointerPath(node,'dst')},
	  nodeAttrNames = self.core.getAttributeNames(node);

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
	  self.pubSubInteractions.push(subscription.interaction); //added
	  for ( var i = 0; i < nodeAttrNames.length; i += 1 )
	    {
	      subscription[nodeAttrNames[i]] =
	      self.core.getAttribute(node, nodeAttrNames[i]);
            }
	  subscription['handler'] = function(federate, interaction)
	  { //* Interaction might get connected to a Mapper on a
	    //* different FOMSheet. Resolve correct filter at render time.
	    var interactiondata =
	    {name: interaction.name,
	     subscribedLoglevel: subscription['LogLevel'],
	     originFedFilter: function()
	       {
		 return self.fedFilterMap [subscription['OriginFedFilter']];
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
        }

        this.visit_StaticObjectPublish = function(node, parent, context)
	{
	  var self = this,
	  publication = {object: self.core.getPointerPath(node,'dst'),
			 federate: self.core.getPointerPath(node,'src')},
	  nodeAttrNames = self.core.getAttributeNames(node);

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
	  for ( var i = 0; i < nodeAttrNames.length; i += 1 )
	    {
	      publication[nodeAttrNames[i]] =
	      self.core.getAttribute( node, nodeAttrNames[i]);
            }
	  publication['handler'] = function(federate, object)
	  {
	    var objectdata = {name: object.name,
			      publishedLoglevel: publication['LogLevel']};
	    objectdata['publishedAttributeData']=[];
	    objectdata['logPublishedAttributeData'] = [];
	    object['attributes'].forEach(function(a)
	      {
		objectdata['publishedAttributeData'].push(a);
		if(publication['EnableLogging'])
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
        }

        this.visit_StaticObjectSubscribe = function(node, parent, context)
	{
	  var self = this,
	  subscription = {object: self.core.getPointerPath(node,'src'),
			  federate: self.core.getPointerPath(node,'dst')},
	  nodeAttrNames = self.core.getAttributeNames(node);

	  if(!subscription.object )
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
	  for ( var i = 0; i < nodeAttrNames.length; i += 1 )
	    {
	      subscription[nodeAttrNames[i]] =
	      self.core.getAttribute(node, nodeAttrNames[i]);
            }   
	  subscription['handler'] = function(federate, object)
	  {
	    var objectdata = {name: object.name,
			      subscribedLoglevel: subscription['LogLevel'],};
                objectdata['subscribedAttributeData']=[];
                objectdata['logSubscribedAttributeData']=[];

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
        }

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
	  for ( var i = 0; i < nodeAttrNames.length; i += 1 )
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
		if(publication['EnableLogging'])
		  {
		    objectdata['logPublishedAttributeData'].push(a);
		  }
	      };
	  }
	  if(context['pubsubs'])
	    {
	      context['pubsubs'].push(publication);
            }
	  return {context:context};
        }

        this.visit_StaticObjectAttributeSubscribe =
	  function(node, parent, context)
	{
	  var self = this,
	  subscription =
	  {object:
	   self.calculateParentPath(self.core.getPointerPath(node,'src')),
	   attribute: self.core.getPointerPath(node,'src'),
	   federate: self.core.getPointerPath(node,'dst')
	  },
	  nodeAttrNames = self.core.getAttributeNames(node);

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
	  for ( var i = 0; i < nodeAttrNames.length; i += 1 )
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
        }
      };
    return PubSubVisitors;
 });
