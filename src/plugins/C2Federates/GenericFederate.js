define
([],
 function()
 {
   'use strict';
   var GenericFederateExporter; // function variable

/* ******************************************************************* */

/* GenericFederateExporter */
/** (function-valued variable of top-level function object)<br><br>

Returned Value: none<br><br>

Called By: FederatesExporter in FederatesExporter.js<br><br>

This is the primary function for a generic federate.<br><br>

The top-level function returns this function.<br>

*/
    GenericFederateExporter = function()
    {
      var visit_FOMSheet;           // function
      var post_visit_FOMSheet;      // function
      var visit_FedIntPackage;      // function
      var post_visit_FedIntPackage; // function

      this.federateTypes = this.federateTypes || {};
      this.federateTypes['Federate'] = {includeInExport: false,
                                        longName: 'Federate'};

/* ******************************************************************* */

/* visit_FOMSheet */
/** (function-valued variable of GenericFederateExporter)<br><br>

Returned Value: a modified context object<br><br>

Called By: atModelNode in ModelTraverserMixin.js in C2Core<br><br>

This is the visitor function for a FOM sheet node.<br>

*/
      visit_FOMSheet = function(                     /* ARGUMENTS */
       /** a FOM sheet node                          */ node,
       /** the parent of the node                    */ parent,
       /** a data object from which to generate code */ context)
      {
        var self = this;

        self.fom_sheets[self.core.getPath(node)] = node;
        context['parent'] = {};
        context['pubsubs'] = [];
        return {context:context};
      } // end visit_FOMSheet
      this.visit_FOMSheet = visit_FOMSheet;

/* ******************************************************************* */

/* post_visit_FOMSheet */
/** (function-valued variable of GenericFederateExporter)<br><br>

Returned Value: a modified context object<br><br>

Called By: ModelTraverserMixin.js in C2Core<br><br>

This is the post visitor function for a FOM sheet node.<br>

*/
      post_visit_FOMSheet = function(                /* ARGUMENTS */
       /** a FedIntPackage node                      */ node,
       /** a data object from which to generate code */ context)
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
      this.post_visit_FOMSheet = post_visit_FOMSheet;

/* ******************************************************************* */

/* visit_FedIntPackage */
/** (function-valued variable of GenericFederateExporter)<br><br>

Returned Value: the context argument embedded in a context object<br><br>

Called By: ModelTraverserMixin.js in C2Core<br><br>

This is the visitor function for a FedIntPackage node.<br>

*/
      visit_FedIntPackage = function(                /* ARGUMENTS */
       /** a FedIntPackage node                      */ node,
       /** the parent of the node                    */ parent,
       /** a data object from which to generate code */ context)
      {
        return {context:context};
      }
      this.visit_FedIntPackage = visit_FedIntPackage;

/* ******************************************************************* */

/* post_visit_FedIntPackage */
/** (function-valued variable of GenericFederateExporter)<br><br>

Returned Value: the context argument embedded in a context object<br><br>

Called By: ModelTraverserMixin.js in C2Core<br><br>

This is the post visitor function for a FedIntPackage node.<br>

*/
      post_visit_FedIntPackage = function(           /* ARGUMENTS */
       /** a FedIntPackage node                      */ node,
       /** a data object from which to generate code */ context)
     {
       return {context:context};
     }
      this.post_visit_FedIntPackage = post_visit_FedIntPackage;

/* ******************************************************************* */

   }; //  end of setting GenericFederateExporter function variable

/* ******************************************************************* */

   return GenericFederateExporter;
 });
