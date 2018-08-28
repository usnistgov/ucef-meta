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

The result of calling the RTISubVisitors function is that four
functions are defined as properties of the FederatesExporter or
DeploymentExporter function (which is also an object). The lines of
this function that begin the definitions of the four functions are:

this.visit_Interaction = function(node, parent, context)
this.visit_Parameter = function(node, parent, context)
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
    console.log("beginning of function in 'define' in RTIVisitors.js");
    console.log("defining RTIVisitors");

    var RTIVisitors  = function()
    {
      console.log("executing RTIVisitors");

/***********************************************************************/

/* this.visit_Interaction

Returned Value: a context object whose context property is the context
  argument, possibly with data added.

Called By: See notes at top.

This processes data for an Interaction.

*/
      console.log("defining this.visit_Interaction");
      this.visit_Interaction = function(node, parent, context)
      {
        var self = this,
        nodeType = self.core.getAttribute(self.getMetaType(node), 'name'),
        nodeBaseName = self.core.getAttribute(node.base, 'name'),
        nodeBasePath = self.core.getPointerPath(node, 'base'),
        nodeName = self.core.getAttribute(node, 'name'),
        nodePath = self.core.getPath(node),
        interaction = {},
        nameFragments = [nodeName];

        console.log("executing visit_Interaction");
        if (self.interactions[nodePath])
          {
            interaction = self.interactions[nodePath];
          }
        else
          {
            self.interactions[nodePath] = interaction;
          }
        interaction['name'] = self.core.getAttribute(node, 'name');
        interaction['id'] = nodePath;
        interaction['basePath'] = self.core.getPointerPath(node, 'base');
        interaction['basename'] = nodeBaseName;
        interaction['delivery'] = self.core.getAttribute(node, 'Delivery');
        interaction['order'] = self.core.getAttribute(node, 'Order');
        interaction['inputPlaceName'] = "";
        interaction['outputPlaceName'] = "";
        interaction['parameters'] = [];
        interaction['children'] = interaction['children'] || [];
        interaction['isroot'] = node.base == self.META['Interaction'];
        interaction['isMapperPublished'] = false;
        
        var nextBase = node.base;
        while (nextBase != self.META['Interaction'])
          {
            nameFragments.push(self.core.getAttribute(nextBase, 'name'));
            nextBase = nextBase.base;
          }
        
        //Check: Interaction is derived form C2WInteractionRoot
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
      console.log("defining this.visit_Parameter");
      this.visit_Parameter = function(node, parent, context)
      {
        var self = this;
        console.log("executing visit_Parameter");
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

This processes data for an Object.

*/
       console.log("defining this.visit_Object");
      this.visit_Object = function(node, parent, context)
      {
        var self = this,
        object = {},
        nodeBasePath = self.core.getPointerPath(node, 'base'),
        nodeBaseName = self.core.getAttribute(node.base, 'name'),
        nodeName = self.core.getAttribute(node, 'name'),
        nameFragments = [nodeName];

	console.log("executing visit_Object");
        if (self.objects[self.core.getPath(node)])
          {
            object = self.objects[self.core.getPath(node)];
          }
        else
          {
            self.objects[self.core.getPath(node)] = object;
          }
        object['name'] = self.core.getAttribute(node, 'name');
        object['id'] = self.core.getPath(node);
        object['basePath'] = self.core.getPointerPath(node, 'base'); //added
        object['basename'] = nodeBaseName;
        object['attributes'] = [];
        object['parameters'] = object['attributes'];
        object['children'] = object['children'] || [];
        object['isroot'] = node.base == self.META['Object'];
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
        var nextBase = node.base;
        while (nextBase != self.META['Object'])
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
      console.log("defining this.visit_Attribute");
      this.visit_Attribute = function(node, parent, context)
      {
        var self = this;
	var attribute;
	console.log("executing this.visit_Attribute");
        attribute =
          {
            name: self.core.getAttribute(node,'name'),
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

      console.log("finished executing RTIVisitors");
    };

    console.log("end of function in 'define' in RTIVisitors.js");
    return RTIVisitors;   
 });
