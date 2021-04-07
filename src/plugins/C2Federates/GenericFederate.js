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

/* ******************************************************************* */

     this.visit_FOMSheet = function(node, parent, context)
     {
       var self = this;

       self.fom_sheets[self.core.getPath(node)] = node;
       context['parent'] = {};
       context['pubsubs'] = [];
       return {context:context};
     } // end visit_FOMSheet

/* ******************************************************************* */

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
     } // end post_visit_FOMSheet

/* ******************************************************************* */
     
     this.visit_FedIntPackage = function(node, parent, context)
     {
       return {context:context};
     }

/* ******************************************************************* */
     
     this.post_visit_FedIntPackage = function(node, context)
     {
       return {context:context};
     }

/* ******************************************************************* */

   }; //  end of setting GenericFederateExporter function variable

/* ******************************************************************* */
   
   return GenericFederateExporter;
 });
