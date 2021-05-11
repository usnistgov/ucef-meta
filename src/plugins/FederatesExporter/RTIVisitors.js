/*

Modified by T. Kramer

Reformatted in C style, as far as possible.

This is executed automatically at the beginning of
FederatesExporter.js and DeploymentExporter.js in the first stages of
running the "define" at the top level of that file. The result of the
execution is that the RTIVisitors argument in the function of the
"define" is defined as a function.

The RTIVisitors function is then called at the
"RTIVisitors.call(this);" lines of FederatesExporter.js and
DeploymentExporter.js when the FederatesExporter or DeploymentExporter
function starts to execute.

The result of calling the RTIVisitors function is that four
functions are defined as properties of the FederatesExporter or
DeploymentExporter function (which is also an object). The lines of
this function that begin the definitions of the four functions are:

this.visit_Interaction = function(node, parent, context)
this.visit_Object = function(node, parent, context)
this.visit_Parameter = function(node, parent, context)
this.visit_Attribute = function(node, parent, context)

The "this" above is either the FederatesExporter function in
FederatesExporter.js or the DeploymentExporter function in
DeploymentExporter.js.

These functions are called in the atModelNode function of
ModelTraverserMixin.js (at ret = ...).  The "parent" argument is not
used in any of the functions, but is needed to be a placeholder in the
arguments. All of the visit_XXX functions (many of which are defined
elsewhere but are called from atModelNode) take the arguments (node,
parent, context). They are called by constructing the name by
concatenating 'visit_' with the name of the type of node.

*/

define
([],
 function()
 {
   'use strict';

    var RTIVisitors;

/***********************************************************************/

    RTIVisitors = function()
    {

/***********************************************************************/

/* this.visit_Interaction

Returned Value: a context object whose context property is the context
  argument, possibly with data added.

Called By: See notes at top.

This processes data for an Interaction. 

*/
      this.visit_Interaction = function(node, parent, context)
      {
        var self = this;
        var nodeType = self.core.getAttribute(self.getMetaType(node), 'name');
        var nodeBaseName =
          (self.core.getAttribute(node.base, 'CodeGeneratedName') ||
           self.core.getAttribute(node.base, 'name'));
        var nodeBasePath = self.core.getPointerPath(node, 'base');
        var nodeName = self.core.getAttribute(node, 'name');
        var nodePath = self.core.getPath(node);
        var interaction = {};
        var fed;
        var nameFragments = [nodeName];

        if (self.interactions[nodePath])
          {
            interaction = self.interactions[nodePath];
          }
        else
          {
            self.interactions[nodePath] = interaction;
          }
        interaction['basename'] = nodeBaseName;
        interaction['basePath'] = self.core.getPointerPath(node, 'base');
        interaction['children'] = interaction['children'] || [];
        interaction['codeName'] =
          self.core.getAttribute(node, 'CodeGeneratedName');
        interaction['delivery'] = self.core.getAttribute(node, 'Delivery');
        interaction['id'] = nodePath;
        interaction['inputPlaceName'] = "";
        interaction['isMapperPublished'] = false;
        interaction['isroot'] = // FIX - remove next line
	   ((node.base == self.META['Interaction']) || // FIX - remove this line
	   (node.base == self.META['CPSWT.CPSWTMeta.Interaction']));
        interaction['name'] = self.core.getAttribute(node, 'name');
        interaction['order'] = self.core.getAttribute(node, 'Order');
        interaction['outputPlaceName'] = "";
        interaction['parameters'] = [];
        if (self.pubSubInteractions)
          {//only DeploymentExporter&FederatesExporter have pubSubInteractions
            if (interaction.name == 'SimEnd')
              {
                if (self.pubSubInteractions[nodePath])
                  {
                    self.pubSubInteractions[nodePath].subscribe = 1;
                  }
                else
                  {
                    self.pubSubInteractions[nodePath] =
                      {publish: 0,
                       subscribe: 1};
                  }
              }
            else if ((interaction.name == 'FederateResignInteraction') ||
                     (interaction.name == 'FederateJoinInteraction'))
              {
                if (self.pubSubInteractions[nodePath])
                  {
                    self.pubSubInteractions[nodePath].publish = 1;
                  }
                else
                  {
                    self.pubSubInteractions[nodePath] =
                      {publish: 1,
                       subscribe: 0};
                  }
              }
          }
        else if (self.endJoinResigns)
          { // only Federates Exporter has endJoinResigns
            if ((interaction.name == 'SimEnd') ||
                (interaction.name == 'FederateResignInteraction') ||
                (interaction.name == 'FederateJoinInteraction'))
              { // need to collect these to add to each federate's XML
                self.endJoinResigns[nodePath] = interaction;
              }
          }

        var nextBase = node.base;
        while ((nextBase != self.META['Interaction']) && //remove this line
	       (nextBase != self.META['CPSWT.CPSWTMeta.Interaction']))
          {
            nameFragments.push(self.core.getAttribute(nextBase, 'name'));
            nextBase = nextBase.base;
          }

        //Check: Interaction is derived from C2WInteractionRoot
        if (nameFragments.length > 1 &&
            nameFragments.indexOf('C2WInteractionRoot') == -1)
          {
            self.createMessage(node, '[ERROR] ' + nodeName +
                               ' is not derived from C2WInteractionRoot!',
                               'error');
          }
        interaction.fullName = nameFragments.reverse().join('.');
        if (self.interactions[nodeBasePath])
          {
            self.interactions[nodeBasePath]['children'].push(interaction);
          }
        else
          {
            if (!interaction['isroot'])
              {
                self.interactions[nodeBasePath] = {children:[interaction]};
              }
            else
              {
                self.interactionRoots.push(interaction);
              }
          }

        if (context.hasOwnProperty('interactions'))
          {
            context['interactions'].push(interaction);
          }
        context['parentInteraction'] = interaction;
        return {context:context};
      }

/***********************************************************************/

/* this.visit_Parameter

Returned Value: a context object whose context property is the context
  argument, possibly with data added.

Called By: See notes at top.

This processes data for a Parameter.

*/
      this.visit_Parameter = function(node, parent, context)
      {
        var self = this;
        if (context.hasOwnProperty('parentInteraction'))
          {
            context['parentInteraction']['parameters'].push(
               {
                 name: self.core.getAttribute(node,'name'),
                 parameterType: self.core.getAttribute(node,'ParameterType'),
                 hidden: self.core.getAttribute(node,'Hidden') === true,
                 position: self.core.getOwnRegistry(node, 'position'),
                 inherited: self.core.getBase(node) !=
                 self.core.getMetaType(node)
               });
          }
        return {context:context};
      }

/***********************************************************************/

/* this.visit_Object

Returned Value: a context object whose context property is the context
  argument, possibly with data added.

Called By: See notes at top.

This is called when a node being processed represents a webgme object. It
processes data for the object.

Among other activities, this makes the primary model of a webgme
object used in the federates exporter as shown a few lines
below. Elsewhere in the JavaScript code, information in models used
for code generation is extracted from the primary model.

*/
      this.visit_Object = function(node, parent, context)
      {
        var self = this;
        var object = {};
        var nodeBasePath = self.core.getPointerPath(node, 'base');
        var nodeBaseName =
          (self.core.getAttribute(node.base, 'CodeGeneratedName') ||
           self.core.getAttribute(node.base, 'name'));
        var nodeName = self.core.getAttribute(node, 'name');
        var nameFragments = [nodeName];
        var nextBase;

        if (self.objects[self.core.getPath(node)])
          {
            object = self.objects[self.core.getPath(node)];
          }
        else
          {
            self.objects[self.core.getPath(node)] = object;
          }
        object['attributes'] = [];
        object['basePath'] = self.core.getPointerPath(node, 'base'); //added
        object['basename'] = nodeBaseName;
        object['children'] = object['children'] || [];
        object['codeName'] = self.core.getAttribute(node, 'CodeGeneratedName');
        object['id'] = self.core.getPath(node);
        object['isroot'] =
	((node.base == self.META['Object']) || // FIX remove this line
	 (node.base == self.META['CPSWT.CPSWTMeta.Object']));
        object['name'] = self.core.getAttribute(node, 'name');
        object['parameters'] = object['attributes'];
        if (self.objects[nodeBasePath])
          {
            self.objects[nodeBasePath]['children'].push(object);
          }
        else
          {
            if (!object['isroot'])
              {
                self.objects[nodeBasePath] = {children:[object]};
              }
            else
              {
                self.objectRoots.push(object);
              }
          }
        nextBase = node.base;
        while ((nextBase != self.META['Object']) && // FIX - remove this line
	       (nextBase != self.META['CPSWT.CPSWTMeta.Object']))
          {
            nameFragments.push(self.core.getAttribute(nextBase, 'name'));
            nextBase = nextBase.base;
          }
        object.fullName = nameFragments.reverse().join('.');
        if (context.hasOwnProperty('objects'))
          {
            context['objects'].push(object);
          }
        context['parentObject'] = object;
        return {context:context};
      }

/***********************************************************************/
      
/* this.visit_Attribute

Returned Value: a context object whose context property is the context
  argument, possibly with data added.

Called By: See notes at top.

This processes data for an Attribute.

*/
      this.visit_Attribute = function(node, parent, context)
      {
        var self = this;
        var attribute;

        attribute =
          {
            name: self.core.getAttribute(node,'name'),
            id: self.core.getPath(node),
            parameterType: self.core.getAttribute(node,'ParameterType'),
            hidden: self.core.getAttribute(node,'Hidden') === true,
            position: self.core.getOwnRegistry(node, 'position'),
            delivery: self.core.getAttribute(node, 'Delivery'),
            order: self.core.getAttribute(node, 'Order'),
            inherited: self.core.getBase(node) !=
            self.core.getMetaType(node)
          };
        if (context.hasOwnProperty('parentObject'))
          {
            context['parentObject']['attributes'].push(attribute);
          }
        self.attributes[self.core.getPath(node)] = attribute;
        return {context:context};
      }

/***********************************************************************/

/* this.visit_C2WInteractionRoot

Returned Value: whatever visit_Interaction returns

Called By: See notes at top.

This processes C2WInteractionRoot.

*/
      this.visit_C2WInteractionRoot = (node, parent, context) => {
        return this.visit_Interaction(node, parent, context);
      };

/***********************************************************************/

/* this.visit_ObjectRoot

Returned Value: whatever visit_Object returns

Called By: See notes at top.

This processes ObjectRoot.

*/

      this.visit_ObjectRoot = (node, parent, context) => {
        return this.visit_Object(node, parent, context);
      };

/***********************************************************************/

    }; // end of RTIVisitors function

    return RTIVisitors;   
 });

/***********************************************************************/
