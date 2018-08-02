/*

Modified by T. Kramer

Reformatted in C style, as far as possible.

RTIVisitors is called by the FederatesExporter function (around the
6th line of the function) in FederatesExporter.js. The value of "this"
(and, hence, "self" in this function is FederatesExporter. So,
RTIVisitors is populating the interactions property of the
FederatesExporter (lines 43-50)

Where the properties of an interaction are being set (lines 51-62),
the 'name' property is the the type of interaction
(e.g., StaticInteractionPublish).

The nodeType (line 33) is always 'Interaction'. It's value is used only
in a logger.debug statement.

*/

define
([],
 function()
 {
   'use strict';

   var RTIVisitors  = function()
     {
       console.log("in RTIVisitors function");
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

          console.log("in RTIVisitors/visit_Interaction function");
          self.logger.debug('Node ' + nodeName + " is based on " +
                           nodeBaseName + " with meta " + nodeType);
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
       
       this.visit_Parameter = function(node, parent, context)
       {
         var self = this;
         self.logger.debug('Visiting Parameter');
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

       this.visit_Object = function(node, parent, context)
       {
         var self = this,
         object = {},
         nodeBasePath = self.core.getPointerPath(node, 'base'),
         nodeBaseName = self.core.getAttribute(node.base, 'name'),
         nodeName = self.core.getAttribute(node, 'name'),
         nameFragments = [nodeName];
         self.logger.debug('Visiting Object');

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
         object['attributes'] = [];
         object['parameters'] = object['attributes'];
         object['children'] = object['children'] || [];
         object['isroot'] = node.base == self.META['Object'];
         object['basename'] = nodeBaseName;
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

       this.visit_Attribute = function(node, parent, context)
       {
         var self = this,      
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
     };

   return RTIVisitors;   
 });
