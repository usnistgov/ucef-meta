define
([],
 function()
 {
   'use strict';
   var GenericFederateExporter; // function variable
   
   GenericFederateExporter = function()
   {
     this.federateTypes = this.federateTypes || {};
     this.federateTypes['Federate'] = {includeInExport: false,
                                       longName: 'Federate'};
     
/***********************************************************************/

     this.visit_FOMSheet = function(node, parent, context)
     {
       var self = this;

       self.fom_sheets[self.core.getPath(node)] = node;
       context['parent'] = {};
       context['pubsubs'] = [];
       return {context:context};
     }

/***********************************************************************/

     this.post_visit_FOMSheet = function(node, context)
     {
       var self = this;
       var i;
       var pubsub;
       
       for (i = 0; i < context['pubsubs'].length; i++)
         {
           pubsub = context['pubsubs'][i];
           if (pubsub.federate && pubsub.interaction)
             {
               if (self.federates[pubsub.federate] &&
                   self.interactions[pubsub.interaction])
                 {
                   if (pubsub.handler)
                     {
                       pubsub.handler(self.federates[pubsub.federate],
                                      self.interactions[pubsub.interaction]);
                     }
                 }
             }
           else if (pubsub.federate && pubsub.object)
             {
               if (self.federates[pubsub.federate] &&
                   self.objects[pubsub.object])
                 {
                   if (pubsub.handler)
                     {
                       pubsub.handler(self.federates[pubsub.federate],
                                      self.objects[pubsub.object]);
                     }
                 }
             }
         }
       return {context:context};
     }

/***********************************************************************/
     
     this.visit_FedIntPackage = function(node, parent, context)
     {
       return {context:context};
     }

/***********************************************************************/
     
     this.post_visit_FedIntPackage = function(node, context)
     {
       return {context:context};
     }

/***********************************************************************/
     
     this.visit_Federate = function(node, parent, context)
     {
       var self = this;
       var ret = {context:context};
       var nodeType = self.core.getAttribute(self.getMetaType(node), 'name');
       
       self.logger.info('Visiting a Federate');
       self.federates[self.core.getPath(node)] = node;
       if(nodeType != 'Federate')
         {
           try
             {
               ret = self['visit_' + nodeType](node, parent, context);
             }
           catch(err)
             {
               if (err.message ==
                   'self[visit_' + nodeType + '] is not a function')
                 {
                   self.logger.debug('No visitor function for ' + nodeType);
                 }
               else
                 {
                   return {error: err};
                 }
             }
         }
       return ret;
     };

/***********************************************************************/

/* post_visit_Federate

Returned Value:  a "{context: context}" object

Called By: doneModelNode (in ModelTraverserMixin.js)
  This is called only by functions that form the name by concatenating
'post_visit_' with either 'Federate' or nodeType (which obviously must
evaluate to 'Federate'). That includes:
  C2Core/ModelTraverserMixin.js:
  C2Federates/GenericFederate.js
  DeploymentExporter/DeploymentExporter.js

The getPostVisitorFuncName function defined in both 
FederatesExporter/FederatesExporter.js and ModelTraverserMixin.js 

*/
     this.post_visit_Federate = function(node, context)
     {
       var self = this;
       var ret = {context:context};
       var nodeType = self.core.getAttribute(self.getMetaType(node), 'name');

       self.logger.info('Post Visiting a Federate');
       if (nodeType != 'Federate')
         {
           try
             {
               ret = self['post_visit_' + nodeType](node, context);
             }
           catch(err)
             {
               if (err.message ==
                   'self[post_visit_' + nodeType + '] is not a function')
                 {
                   self.logger.debug('No post-visitor function for ' +
                                     nodeType);
                 }
               else
                 {
                   return {error: err};
                 }
             }
         }  
       return ret;
     };
     
/***********************************************************************/

   }; //  end of setting GenericFederateExporter function variable

/***********************************************************************/
   
   return GenericFederateExporter;
});
