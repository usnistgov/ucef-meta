/*

File completed by unknown programmer (probably H. Neema)

File modified extensively by T. Kramer

File reformatted in C style, as far as possible.

This "define" appears to be intended to be used by any other "define"
that needs to go through all the nodes in a webgme model. It is used
by at least FederatesExporter.js and DeploymentExporter.js.

The atModelNode function gets called for all nodes except those that 
are explicitly excluded. It is specific to the job of the caller and
will need to be modified if called by other than FederatesExporter.js.

It might be useful to move those parts of this function that are
specific to the FederatesExporters out of this function, so that any
caller can use it.

The doneModelNode function

*/

define(
  [],
  function(
  ) {
    'use strict';
    var withModelTraverser;

/***********************************************************************/

/* withModelTraverser

Returned Value: none

Called By: Called automatically when ModelTraverserMixin is used in
the top-level function of a define (in FederatesExporter.js and
DeploymentExporter.js).

*/

    withModelTraverser = function()
    {

/***********************************************************************/

/* this.getChildSorterFunc

Returned Value: a comparer function that can be passed to a generic
sorting routine

Called By: passedToLoad (in visitAllChildrenRec)

If getChildSorterFunc is not already a property of "this",
this defines a this.getChildSorterFunc function that defines a comparer
function to be passed to a sorting routine. The comparer takes pointers
to two things (a and b) of unspecified type and implements the rules:
  If the name of a is less than the name of b, return -1.
  Otherwise, if the name of a is greater than the name of b, return 1.
  Otherwise, return 0.

Since the things being tested must return something for
core.getAttribute(thing, 'name'), this works when the things are nodes.
In that case, the names are strings, so this is returns case-sensitive
alphabetical comparison by name for nodes.

This is a very strange function because it does not use either of its
arguments. Also, the name is strange because this returns a comparer,
not a sorter.

*/

      this.getChildSorterFunc = this.getChildSorterFunc ||
      function(
       nodeType, // argument not used
       self)     // argument not used (overridden by var also named self)
      {
        var self;
        var comparer;

        self = this; // overrides self argument
        comparer = function(a, b)
        {
          var aName = self.core.getAttribute(a,'name');
          var bName = self.core.getAttribute(b,'name');

          if (aName < bName) return -1;
          if (aName > bName) return 1;
          return 0;
        };
        return comparer;
      };

/***********************************************************************/

/* this.excludeFromVisit

Returned Value: none

Called By: this.visitAllChildrenRec
  
If this.excludeFromVisit is not already defined, it is defined to
return false.

This function is defined also in FederatesExporter.js and
DeploymentExporter.js (and possibly elsewhere).

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

The context variable declared here is passed around extensively and gets
properties added to it in many places. It gets cloned in loadChildren, so
that each child has its own version.

*/

      this.visitAllChildrenFromRootContainer = function(rootNode, rootContainerCallback)
      {
        var self = this;
        var error = '';
        var context = {};          // initialization of model used extensively
        var counter = {visits: 1}; 
        var counterCallback;       // function 

/***********************************************************************/

/* counterCallback

Returned Value: none

Called By: this.visitAllChildrenRec

First, this subtracts 1 from counter.visits.

Then, if counter.visits is now 0, (which indicates completion), then this
calls self['ROOT_post_visitor'] and ignores any error. Then it calls
the callback (an argument passed to visitAllChildrenFromRootContainer)
using as an argument [the current value of error with the err argument
appended]. Then it returns.

Otherwise, if the err argument is not nullish, this calls callback as
described above.

Otherwise, this does nothing more.

self['ROOT_post_visitor'] is undefined, so the "try" will always fail
and might be removed. It seems to have been included to prepare for needing
a function that does some additional processing after all the children
have been visited (possibly involving the rootNode), but no need arose.

*/

        counterCallback = function(err)
        {
          counter.visits -= 1;
          if (counter.visits === 0)
            {
              try
                {
                  self['ROOT_post_visitor'](rootNode, context);
                }
              catch(tryErr)
                {
                  // errors from the try are ignored
                }
              error = err ? error + err : error;
              callback(error === '' ? undefined : error);
              return;
            }
          else if (err)
            {
              callback(error + err);
              return;
            }
        }; // end of counterCallback function
        
/***********************************************************************/
        try
          {
            var ret = self['ROOT_visitor'](rootNode, context);
            if (ret['error'])
              {
                rootContainerCallback(error === '' ? undefined : error);
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
  visitAllChildrenRec (recursively in atModelNodeChildCallback) 

Likely "Rec" in the name means recursive.

By calling atModelNodeChildCallback, which calls visitAllChildrenRec
recursively, this processes the tree of children with the node
argument at the top.

When this is called from visitAllChildrenFromRootContainer the context is
the one in that function. When this is called recursively, the context is
a copy of the context from the caller.

The same counter (which is the counter object built in
visitAllChildrenFromRootContainer) is used in all calls to this function.

When this is called from visitAllChildrenFromRootContainer the
callback is the counterCallback function defined above. When this is
called recursively, the callback is the doneVisitChildCallback function
defined below.

This function seems unnecessarily complex. For example, since the
function is recursive, the atModelNodeChildCallback,
doneModelNodeCallback, and doneVisitChildCallback functions are being
defined each time this function is called. However, those functions
use variables that are not passed as arguments and may have different
values each time the functions are defined.

CPSWT and CPSWTMeta have a null base, they are their own metaTypes, and
the metaType is not an attribute, so setting nodeMetaTypeName needs
special handling for them.

The call to self.core.loadChildren is not executing the function that
is passed to it immediately. Rather, loadChildren appears to making a
queue of such functions, adding the most recent functions at the end
of the queue. loadChildren then takes the first function off the front
of the queue and executes it.

*/

      this.visitAllChildrenRec = function( /* ARGUMENTS                    */
       node,                               /* node that may have children  */
       context,                            /* a context, see above         */
       counter,                            /* counter object, see above    */
       callback)                           /* callback function, see above */
      {
        var self = this;
        var nodeName;         // name of node
        var nodeMetaTypeName; // name of metaType of node
        var passedToLoad;     // function passed to core.loadChildren

/***********************************************************************/

/* passedToLoad

Called By: not called directly, passed as callback to core.loadChildren

*/        
        passedToLoad = function(err, children)
        { // Presumably, loadChildren provides the children argument
          // by getting the children of the node, and executes passedToLoad.
          var i;
          var atModelNodeChildCallback; // function variable
          var doneModelNodeCallback;    // function variable
          var doneVisitChildCallback;   // function variable
          var nodeName;                 // name of node
          var nodeMetaTypeName;         // name of metaType of node
          var comparisonFunc;           // function variable
          var childrenToVisit = children.length;

          if (err)
            {
              callback('loadChildren failed for ' +
                       self.core.getAttribute(node, 'name'));
              return;
            }
          counter.visits -= 1;

/***********************************************************************/

/* doneModelNodeCallback (function defined within passedToLoad)

Called By:
  passedToLoad (a few lines down)
  doneVisitChildCallback
  also passed to doneModelNode in call from doneVisitChildCallback

  This is called when processing of the node has been completed.
  It calls the callback that is the last argument to visitAllChildrenRec.

*/
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
            }; // closes doneModelNodeCallback
        
/***********************************************************************/

          if (childrenToVisit === 0)
            { // node has no children
              if (node !== self.rootNode)
                {
                  self.doneModelNode(node, context,
                                     doneModelNodeCallback);
                }
              else
                {
                  doneModelNodeCallback(null);
                }
              return false;
            }
          counter.visits += children.length;
          if (node !== self.rootNode)
            {
              nodeName = self.core.getAttribute(node, 'name');
              nodeMetaTypeName = ((nodeName === 'CPSWT') ? 'CPSWT' :
                                  (nodeName === 'CPSWTMeta') ? 'CPSWTMeta' :
                      self.core.getAttribute(self.getMetaType(node),'name'));
            }
          comparisonFunc = self.getChildSorterFunc(nodeMetaTypeName, self);
          if (comparisonFunc)
            {
              children.sort(comparisonFunc);
            }

/***********************************************************************/

/* doneVisitChildCallback (function defined within passedToLoad)

Called By: not called directly, passed as callback to visitAllChildrenRec

*/          
          doneVisitChildCallback = function(err)
          {
            if (err)
              {
                callback(err);
                return;
              }

            childrenToVisit -= 1;
            if (childrenToVisit === 0)
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
          }; // closes doneVisitChildCallback

/***********************************************************************/
          
          for (i = 0; i < children.length; i += 1)
            {
              atModelNodeChildCallback = function(err, ctx)
              { // definition specific to children[i]
                // used only by being passed to atModelNode, just below
                if (err)
                  {
                    callback(err);
                    return;
                  }
                self.visitAllChildrenRec(children[i], ctx, counter,
                                         doneVisitChildCallback);
              };
              
              self.atModelNode(children[i], node, self.cloneCtx(context),
                               atModelNodeChildCallback);
            }
        }; // closes passedToLoad =

/***********************************************************************/
        
        nodeName = self.core.getAttribute(node, 'name');
        if (self.excludeFromVisit(node))
          {
            nodeMetaTypeName = ((nodeName === 'CPSWT') ? 'CPSWT' :
                                (nodeName === 'CPSWTMeta') ? 'CPSWTMeta' :
                    self.core.getAttribute(self.getMetaType(node),'name'));
            callback(null, context);
            if (nodeMetaTypeName in self.federateTypes)
              {
                counter.visits -= 1;
              }
            return;
          }
        self.core.loadChildren(node, passedToLoad);
      }; // closes this.visitAllChildrenRec =

/***********************************************************************/

/* this.atModelNode

Returned Value: none

Called By: visitAllChildrenRec

This creates the visitorFuncName by calling getVisitorFuncName, which
appends 'visit_' and nodeMetaTypeName (except that if nodeMetaTypeName
ends in 'Federate' it returns 'visit_Federate').  Then this calls
self[visitorFuncName]. However, that function might not exist, so the
call is inside a "try" and if the function does not exist, the error
is catched. If the function exists, it revises the context. In that
case this calls the callback with the revised context and returns. If
the function does not exist, unless there is an unexpected error, this
calls the callback with the original context and returns.

It seems kludgy to execute a statement that is known to be in error
much of the time and recover by catching the error. It would seem
better to test for a known name and call the appropriate function.
Currently, however, new visitor functions may be created without
having to change this function.

If this is called by FederatesExporter, so that federateInfos exists, and
the node type is in the federateTypes of the FederatesExporter, then
 - If there is already an entry in federateInfos for the node,
   the name, metaType, and generateCode are added.
 - If not, a new entry in federateInfos is built for the node.

The only use of the parent argument is for passing to the visitor function.

*/

      this.atModelNode = function(node, parent, context, callback)
      {
        var self;
        var nodeName;
        var nodeMetaTypeName;
        var codeGen;
        var visitorFuncName;
        var id;
        var ret;

        self = this;
        nodeName = self.core.getAttribute(node, 'name');
        nodeMetaTypeName = ((nodeName === 'CPSWT') ? 'CPSWT' :
                            (nodeName === 'CPSWTMeta') ? 'CPSWTMeta' :
                self.core.getAttribute(self.getMetaType(node),'name'));
        codeGen = self.core.getAttribute(node, 'EnableCodeGeneration');
        visitorFuncName = self.getVisitorFuncName(nodeMetaTypeName);
        id;
        ret = null;

        if (self.federateInfos && (nodeMetaTypeName in self.federateTypes))
          {
            id = self.core.getPath(node);
            if (self.federateInfos[id])
              {
                self.federateInfos[id].name = nodeName;
                self.federateInfos[id].metaType = nodeMetaTypeName;
                self.federateInfos[id].generateCode = codeGen;
              }
            else
              {
                self.federateInfos[id] = {name: nodeName,
                                          metaType: nodeMetaTypeName,
                                          generateCode: codeGen,
                                          directory: null,
                                          pubSubObjects: {},
                                          pubSubInteractions: {}};
              }
            if (codeGen != true)
              {
                callback(null, context);
                return;
              }
          }
        try
          {
            ret = self[visitorFuncName](node, parent, context);
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
            if (err.message == 'self[visitorFuncName] is not a function')
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
      }; // closes this.atModelNode=

/***********************************************************************/

/* this.doneModelNode

Returned Value: none This creates the postVisitorFuncName by calling
getPostVisitorFuncName, which appends 'post_visit_' and
nodeMetaTypeName (except that if nodeMetaTypeName ends in 'Federate'
it returns 'post_visit_Federate').  Then this calls
self[postVisitorFuncName]. However, that function might not exist, so
the call is inside a "try" and if the function does not exist, the
error is catched. If the function exists, it revises the context. In
that case this calls the callback with the revised context and
returns. If the function does not exist, unless there is an unexpected
error, this calls the callback with the original context and returns.

It seems kludgy to execute a statement that is known to be in error
much of the time and recover by catching the error. It would seem
better to test for a known name and call the appropriate function.
Currently, however, new visitor functions may be created without
having to change this function.

Called By: doneVisitChildCallback (in an anonymous function in the
call to loadChildren in visitAllChildrenRec)

This is similar to atModelNode. See the documentation of atModelNode (above).

*/
      this.doneModelNode = function(node, context, callback)
      {
        var self = this;
        var nodeName = self.core.getAttribute(node, 'name');
        var nodeMetaTypeName = ((nodeName === 'CPSWT') ? 'CPSWT' :
                                (nodeName === 'CPSWTMeta') ? 'CPSWTMeta' :
                     self.core.getAttribute(self.getMetaType(node),'name'));
        var postVisitorFuncName =
          self.getPostVisitorFuncName(nodeMetaTypeName);
        var ret = null;

        try
          {
            ret = self[postVisitorFuncName](node, context);
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
            if (err.message == 'self[postVisitorFuncName] is not a function')
              {
              }
            else
              {
                callback(err);
              }
          }
        callback(null, context);
        return;
      }; // closes this.doneModelNode =

/***********************************************************************/

/* this.cloneCtx

Returned Value: a copy of an object

Called By: self.core.loadChildren

This makes a copy of an object by first setting the copy to a call to
the constructor of the object and then adding any own properties of the
object.

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

    }; // closes withModelTraverser =
    return withModelTraverser;
 }); // closes function and define
