/*

File completed by unknown programmer (probably H. Neema)

File modified extensively by T. Kramer 

File reformatted in C style, as far as possible.

This "define" appears to be intended to be used by any other "define"
that needs to go through all the nodes in a webgme model. It is used
by at least FederatesExporter.js and DeploymentExporter.js.

*/

define([], function()
 {
    'use strict';
    /**
     * Initializes a new instance of JSONLDExport.
     * @class
     * @augments {PluginBase}
     * @classdesc This class represents the plugin JSONLDExport.
     * @constructor
     */
    var withModelTraverser = function()
    {
        
/***********************************************************************/

/* this.getVisitorFuncName

Returned Value: a visitor function name

Called By: atModelNode

If this.getVisitorFuncName is already defined (which is possible since
getVisitorFuncName is defined in FederatesExporter.js), the existing
definition is used.

*/

      this.getVisitorFuncName = this.getVisitorFuncName ||
      function(nodeType)
      {
        return (nodeType ? 'visit_'+ nodeType : 'generalVisitor');
      };
      
/***********************************************************************/

/* this.getPostVisitorFuncName

Returned Value: a post_visitor function name

Called By: atModelNode

If this.getPostVisitorFuncName is already defined (which is possible since
getPostVisitorFuncName is defined in FederatesExporter.js), the existing
definition is used.

*/

      this.getPostVisitorFuncName = this.getPostVisitorFuncName ||
      function(nodeType)
      {
        return (nodeType ? 'post_visit_'+ nodeType : 'generaPostlVisitor');
      };
        
/***********************************************************************/

/* this.getChildSorterFunc

Returned Value: 0, 1, or -1 (see below)

Called By: visitAllChildrenRec

This defines the this.getChildSorterFunc function that defines a
function to be passed to a sorting routine. The function to be passed
to a sorting routine takes pointers to two attributes (a and b) and
implements the rules:
  If the name of a is less than the name of b, return -1.
  Otherwise, if the name of a is greater than the name of b, return 1.
  Otherwise, return 0.

This is a very strange function because it does not use either of its
arguments.

*/

      this.getChildSorterFunc = this.getChildSorterFunc ||
      function(
       nodeType, // argument not used
       self)     // argument not used (overridden by var also named self)
      {
        var self;
        var generalChildSorter;

        self = this; // overrides self argument
        var generalChildSorter = function(a, b)
        {
          var aName = self.core.getAttribute(a,'name');
          var bName = self.core.getAttribute(b,'name');
          
          if (aName < bName) return -1;
          if (aName > bName) return 1;
          return 0;
        };
        return generalChildSorter;
      };

/***********************************************************************/

/* this.excludeFromVisit

Returned Value: none

Called By: visitAllChildrenRec
  
If this.excludeFromVisit is not already defined, it is defined to
return false.

This function is defined also in FederatesExporter.js and
DeploymentExporter.js (and possibly elsewhere)

*/

      this.excludeFromVisit = this.excludeFromVisit ||
      function(node)
      {
        var exclude = false;
        return exclude;
      }

/***********************************************************************/

/* this.visitAllChildrenFromRootContainer

Returned Value: none

Called By:
  FederatesExporter.prototype.main in FederatesExporter.js
  DeploymentExporter.Prototype.main in DeploymentExporter.js
  and maybe other functions

*/

      this.visitAllChildrenFromRootContainer = function(rootNode, callback)
      {
        var self = this;
        var error = '';
        var context = {};
        var counter = {visits: 1};
        var counterCallback;

/***********************************************************************/

        counterCallback = function(err)
        {
          error = err ? error + err : error;
          counter.visits -= 1;
          if (counter.visits === 0)
            {
              try
                {
                  var ret = self['ROOT_post_visitor'](rootNode, context);
                }
              catch(err)
                {
                  
                }
              callback(error === '' ? undefined : error);
              return;
            }
          if (err)
            {
              callback(error);
              return;
            }
        };
        
/***********************************************************************/
        try
          {
            var ret = self['ROOT_visitor'](rootNode, context);
            if (ret['error'])
              {
                callback(error === '' ? undefined : error);
                return;
              }
            else
              {
                context = ret['context'];
              }
          }
        catch(err)
          {
            
          }
        self.visitAllChildrenRec(rootNode, context, counter, counterCallback);
      }; // end of visitAllChildrenFromRootContainer function
        
/***********************************************************************/

/* this.visitAllChildrenRec

Returned Value: none

Called By:
  visitAllChildrenFromRootContainer
  visitAllChildrenRec (recursively -- likely "Rec" in the name means recursive) 

By calling atModelNodeCallback, which calls visitAllChildrenRec
recursively, this processes the tree of children with the node
argument at the top.

When this is called from visitAllChildrenFromRootContainer the context is
the one in that function. When this is called recursively, the context is
a copy of the context from the caller.

The same counter (which is the counter object built in
visitAllChildrenFromRootContainer) is used in all calls to this function.

When this is called from visitAllChildrenFromRootContainer the
callback is the counterCallback function defined above. When this is
called recursively, the context is the doneVisitChildCallback function
defined below.

This function seems unnecessarily complex. For example, since the
function is recursive, the doneModelNodeCallback function is being
defined each time this function is called.

*/

      this.visitAllChildrenRec = function( /* ARGUMENTS                    */
       node,                               /* node that may have children  */
       context,                            /* a context, see above         */
       counter,                            /* counter object, see above    */
       callback)                           /* callback function, see above */
      {
        var self = this;
        if (self.excludeFromVisit(node))
          {
            callback(null, context);
            return;
          }
        self.core.loadChildren(node, function(err, children)
        {
          var i,
            atModelNodeCallback,
            doneModelNodeCallback,
            doneVisitChildCallback,
            nodeType,
            sorterFunc,
            childsToVisit = children.length;
          if (err)
            {
              callback('loadChildren failed for ' +
                       self.core.getAttribute(node, 'name'));
              return;
            }
          counter.visits -= 1;
          
/***********************************************************************/
          
          doneModelNodeCallback = function(err, ctx)
            {
              if (err)
                {
                  callback(err);
                }
              else
                {
                  callback(null);
                }
              return
            };
          
/***********************************************************************/
          
          if (childsToVisit === 0)
            {
              if (node !== self.rootNode)
                {
                  self.doneModelNode(node,context,doneModelNodeCallback);
                }
              else
                {
                  doneModelNodeCallback(null);
                }
              return;
            }
          counter.visits += children.length;
          if (node !== self.rootNode)
            {
              nodeType = self.core.getAttribute(self.getMetaType(node), 'name');
            }
          sorterFunc = self.getChildSorterFunc(nodeType, self);
          if (sorterFunc)
            {
              children.sort(sorterFunc);
            }
          
/***********************************************************************/
          
          doneVisitChildCallback = function(err)
          {
            if (err)
              {
                callback(err);
                return; 
              }
            
            childsToVisit -= 1;
            if (childsToVisit === 0)
              {
                if (node !== self.rootNode)
                  {
                    self.doneModelNode(node, context,
                                       doneModelNodeCallback);
                  }
                else
                  {
                    doneModelNodeCallback(null);
                  }
                return;
              } 
          };

/***********************************************************************/
          
          atModelNodeCallback = function(childNode)
          {
            return function(err, ctx)
            {
              if (err)
                {
                  callback(err);
                  return;
                }
              self.visitAllChildrenRec(childNode, ctx, counter,
                                       doneVisitChildCallback);
            };
          };
          
/***********************************************************************/
          
          for (i = 0; i < children.length; i += 1)
            {
              self.atModelNode(children[i], node, self.cloneCtx(context),
                               atModelNodeCallback(children[i]));
            }
        }); // closes function, args, and call to self.core.loadChildren 
      }; // closes function and this.visitAllChildrenRec =

/***********************************************************************/

/* this.atModelNode

Returned Value: none

Called By: visitAllChildrenRec

The following line of the atModeNode function is strange

ret = self[self.getVisitorFuncName(nodeType)](node, parent, context);

because one would expect it to be divided into two parts as follows

  funcName = self.getVisitorFuncName(nodeType);
  ret = self[funcName](node, parent, context);

However, if that is done, the FederatesExporter gives error messages.

It appears that the long line is used because self[funcName] is often
undefined, causing an error. Thus, if the line is split into two
parts, a try and catch would be required for both parts. It might be
better to split it anyway.

Also, it seems kludgy to execute a statement that is known to be in error
much of the time and recover by catching the error. If possible, it would
seem better to test for a known name and call the appropriate function.

If this is called by FederatesExporter, so that federateInfos exists, and
the node type is in the federateTypes of the FederatesExporter, then
 - If a there is already an entry in federateInfos for the node,
   the name, metaType, and generateCode are added.
 - If not, a new entry in federateInfos is built for the node.

*/

      this.atModelNode = function(node, parent, context, callback)
      {
        var self = this;
        var nodeType = self.core.getAttribute(self.getMetaType(node), 'name');
        var nodeName = self.core.getAttribute(node, 'name');
        var codeGen = self.core.getAttribute(node, 'EnableCodeGeneration');
        var id;
        var ret = null;

        if (self.federateInfos && (nodeType in self.federateTypes))
          {
            id = self.core.getPath(node);
            if (self.federateInfos[id])
              {
                self.federateInfos[id].name = nodeName;
                self.federateInfos[id].metaType = nodeType;
                self.federateInfos[id].generateCode = codeGen;
              }
            else
              {
                self.federateInfos[id] = {name: nodeName,
                                          metaType: nodeType,
                                          generateCode: codeGen,
                                          directory: null,
                                          pubSubObjects: {},
                                          pubSubInteractions: {}};
              }
          }
        try
          {
            ret = self[self.getVisitorFuncName(nodeType)](node, parent,
                                                          context);
            if (ret['error'])
              {
                callback((ret['error'] === '') ? undefined : ret['error']);
                return;
              }
            else
              {
                callback(null, ret['context']);
                return;
              }
            
          }
        catch(err)
          {
            if (err.message ==
                'self[self.getVisitorFuncName(...)] is not a function')
              {
              }
            else
              {
                callback(err);
                return;
              }
          }
        callback(null, context);
        return;
      };

/***********************************************************************/

/* this.doneModelNode

Returned Value: none

Called By: doneVisitChildCallback (in an anonymous function in the
call to loadChildren in visitAllChildrenRec)

*/
      this.doneModelNode = function(node, context, callback)
      {
        var self = this,
        nodeType = self.core.getAttribute(self.getMetaType(node), 'name'),
        nodeName = self.core.getAttribute(node, 'name'),
        ret = null;

        try
          {
            ret = self[self.getPostVisitorFuncName(nodeType)](node, context);
            if (ret['error'])
              {
                callback(ret['error'] === '' ? undefined : ret['error']);
                return;
              }
            else
              {
                callback(null, ret['context']);
                return;
              }
          }
        catch(err)
          {
            if (err.message ==
                'self[self.getPostVisitorFuncName(...)] is not a function')
              {
                
              }
            else
              {
                callback(err);
              }
          }
        callback(null, context);
        return;
      };

/***********************************************************************/

/* this.cloneCtx

Returned Value: a copy of an object

Called By: ?

*/
      this.cloneCtx = function(obj)
      {
        var copy;
        if (null == obj || "object" != typeof obj)
          return obj;
        copy = obj.constructor();
        for (var attr in obj)
          {
            if (obj.hasOwnProperty(attr))
              copy[attr] = obj[attr];
          }
        return copy;
      }

/***********************************************************************/

    };
    return withModelTraverser;
 }); // closes function and define
