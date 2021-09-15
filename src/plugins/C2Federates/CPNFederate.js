/**

*/

define
([],
 function ()
 {
    'use strict';
    var CPNFederateExporter;          // function variable

/* ******************************************************************* */

/* CPNFederateExporter */
/** (function-valued variable of top-level function object)<br><br>

Returned Value: none<br><br>

Called By: FederatesExporter in FederatesExporter.js<br><br>

This is the primary function for a CPN federate.<br><br>

The top-level function returns this function.<br>

*/

    CPNFederateExporter = function()
    {
      var visit_CPNFederate;                          // function variable
      var visit_Place;                                // function variable
      var post_visit_CPNFederate;                     // function variable
      var visit_StaticInteractionPublishFromCPNPlace; // function variable
      var visit_StaticInteractionSubscribeToCPNPlace; // function variable

      this.federateTypes = this.federateTypes || {};
      this.federateTypes['CPNFederate'] = {includeInExport: false,
                                           longName: 'CPNFederate',
                                           dependencies: []};
      this.cpnPlaces = {};

/* ******************************************************************* */

/* visit_CPNFederate */
/** (function-valued variable of CPNFederateExporter)<br><br>

Returned Value: a modified context object<br><br>

Called By: atModelNode in ModelTraverserMixin.js in C2Core<br><br>

This is the visitor function for a CPN federate.<br><br>

The top-level function returns this function.<br>

*/

      visit_CPNFederate = function(            /* ARGUMENTS */
       /** node to be processed                */ node,
       /** parent of node                      */ parent,
       /** context object that may be modified */ context)
      {
        var self;
        var nodeType;
        var cpn;
        var cpn_doc;

        self = this;
        nodeType = self.core.getAttribute(self.getMetaType(node), 'name');
        cpn = {'@_cpnfile': self.core.getAttribute(node, 'CPNFile'),
               '@_lookahead': self.core.getAttribute(node, 'Lookahead'),
               '@step': self.core.getAttribute(node, 'Step'),
               '@ration': self.core.getAttribute(node, 'CPNTimeRatio'),
               'input': [],
               'output': [],
               'monitor': []};
        cpn_doc = {cpn: cpn};
        self.federates[self.core.getPath(node)] = cpn;
        context['CPNDoc'] = cpn_doc;
        context['parent'] = cpn['monitor'];
        return {context:context};
      };
      this.visit_CPNFederate = visit_CPNFederate;

/* ******************************************************************* */

/* visit_Place */
/** (function-valued variable of CPNFederateExporter)<br><br>

Returned Value: a modified context object<br><br>

Called By: ModelTraverserMixin.js in C2Core<br><br>

This is the visitor function for a CPN place.<br>

*/
      visit_Place = function(                  /* ARGUMENTS */
       /** node to be processed                */ node,
       /** parent of node                      */ parent,
       /** context object that may be modified */ context)
      {
        var self;
        var nodeType;
        var place;

        self = this,
        nodeType = self.core.getAttribute( self.getMetaType( node ), 'name' ),
        place = {'@name': self.core.getAttribute(node, 'name')};
        context['parent'].push(place);  
        self.cpnPlaces[self.core.getPath(node)] = place;
        return {context:context};
      }; // end visit_Place
      this.visit_Place = visit_Place;

/* ******************************************************************* */

/* post_visit_CPNFederate */
/** (function-valued variable of CPNFederateExporter)<br><br>

Returned Value: a modified context object<br><br>

Called By: ModelTraverserMixin.js in C2Core<br><br>

This is the post visitor function for a CPN federate.<br>

*/
      post_visit_CPNFederate = function(       /* ARGUMENTS */
       /** node to be processed                */ node,
       /** context object that may be modified */ context)
      {
        var self;
        var outFileName;

        self = this;
        outFileName = "CPN/" + self.core.getAttribute(node, 'name') + ".xml"
        self.fileGenerators.push(function(
         artifact,
         callback)
        {
          self.logger.info('calling addFile for ' + outFileName +
                           ' in post_visit_CPNFederate of CPNFederate.js');
          artifact.addFile(outFileName,
                           self._jsonToXml.convertToString(context['CPNDoc']),
                           function(err)
                           {if (err) {callback(err); return;}
                             else {callback();}}
                           );
        });          
        return {context:context};
      }; // end post_visit_CPNFederate
      this.post_visit_CPNFederate = post_visit_CPNFederate;

/* ******************************************************************* */

/* visit_StaticInteractionPublishFromCPNPlace */
/** (function-valued variable of CPNFederateExporter)<br><br>

Returned Value: a modified context object<br><br>

Called By: ModelTraverserMixin.js in C2Core<br><br>

This is the visitor function for a StaticInteractionPublish in a CPN federate.<br>

*/
      visit_StaticInteractionPublishFromCPNPlace = function( /* ARGUMENTS */
       /** node to be processed                              */ node,
       /** parent of node                                    */ parent,
       /** context object that may be modified               */ context)
      {
        var self;
        var publication;
        var nodeAttrNames;
        var i;

        self = this;
        publication =
        {type: 'output',
         port: self.core.getPointerPath(node,'src'),
         interaction: self.core.getPointerPath(node,'dst'),
         federate: self.calculateParentPath(self.core.
                                            getPointerPath(node,'src'))
        };
        nodeAttrNames = self.core.getAttributeNames(node);
        for (i = 0; i < nodeAttrNames.length; i += 1 )
          {
            publication[nodeAttrNames[i]] =
              self.core.getAttribute( node, nodeAttrNames[i]);
         }

        publication['handler'] = function(
         federate,
         interaction)
        {
          if (federate[publication['type']] &&
              self.cpnPlaces[publication.port])
            {
              federate[publication['type']].push({
                '@interaction': interaction.fullName,
                    '@place': self.cpnPlaces[publication.port]['@name']
                    });
            }
        }

        if (context['pubsubs'])
          {
            context['pubsubs'].push(publication);
          }
        return {context:context};
      }; // end visit_StaticInteractionPublishFromCPNPlace
      this.visit_StaticInteractionPublishFromCPNPlace =
      visit_StaticInteractionPublishFromCPNPlace;

/* ******************************************************************* */

/* visit_StaticInteractionSubscribeToCPNPlace */
/** (function-valued variable of CPNFederateExporter)<br><br>

Returned Value: a modified context object<br><br>

Called By: ModelTraverserMixin.js in C2Core<br><br>

This is the visitor function for a StaticInteractionSubscribe in a CPN federate.<br>

*/
      visit_StaticInteractionSubscribeToCPNPlace = function( /* ARGUMENTS */
       /** node to be processed                              */ node,
       /** parent of node                                    */ parent,
       /** context object that may be modified               */ context)
      {
        var self;
        var subscription;
        var nodeAttrNames;
        var i;

        self = this;
        subscription = {type: 'input',
                        interaction: self.core.getPointerPath(node,'src'),
                        port: self.core.getPointerPath(node,'dst'),
                        federate: self.calculateParentPath(self.core.
                                                 getPointerPath(node,'dst'))};
        nodeAttrNames = self.core.getAttributeNames(node);
        for (i = 0; i < nodeAttrNames.length; i += 1)
          {
            subscription[nodeAttrNames[i]] =
              self.core.getAttribute( node, nodeAttrNames[i]);
          }
        subscription['handler'] = function(
         federate,
         interaction)
        {
          if (federate[subscription['type']] &&
              self.cpnPlaces[subscription.port])
            {
              federate[subscription['type']].
              push({'@interaction': interaction.fullName,
                    '@place': self.cpnPlaces[subscription.port]['@name']
                    });
            }
        }

        if (context['pubsubs'])
          {
            context['pubsubs'].push(subscription);
          }
        return {context:context};
      }; // end visit_StaticInteractionSubscribeToCPNPlace
      this.visit_StaticInteractionSubscribeToCPNPlace =
      visit_StaticInteractionSubscribeToCPNPlace;

/* ******************************************************************* */

    }; // end CPNFederateExporter
    return CPNFederateExporter;
 });
