/**

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

*/

define([], function()
 {
    'use strict';
    var withModelTraverser;

/* ******************************************************************* */

/* withModelTraverser */
/** (function-valued variable of top-level function object)<br><br>

Returned Value: none<br><br>

Called By: Called automatically when ModelTraverserMixin is used in
the top-level function of a define (in FederatesExporter.js and
DeploymentExporter.js)<br><br>

This traverses and processes a model tree.<br>

*/

    withModelTraverser = function()
    {
      var getChildSorterFunc;                //function variable
      var excludeFromVisit;                  //function variable
      var visitAllChildrenFromRootContainer; //function variable
      var visitAllChildrenRec;               //function variable
      var cloneCtx;                          //function variable
      var atModelNode;                       //function variable
      var doneModelNode;                     //function variable

/* ******************************************************************* */

/* getChildSorterFunc */
/** (function-valued variable of withModelTraverser)<br><br>

Returned Value: a comparer function that can be passed to a generic
sorting routine<br><br>

Called By: passedToLoad (in visitAllChildrenRec)<br><br>

This is a comparer function to be passed to a sorting routine. The comparer
takes pointers to two things (a and b) of unspecified type and implements
the rules:<br>
  If the name of a is less than the name of b, return -1.<br>
  Otherwise, if the name of a is greater than the name of b, return 1.<br>
  Otherwise, return 0.<br><br>

Since the things being tested must return something for
core.getAttribute(thing, 'name'), this works when the things are nodes.
In that case, the names are strings, so this is returns case-sensitive
alphabetical comparison by name for nodes.<br><br>

This is a very strange function because it does not use either of its
arguments. The self argument is overridden by a var also named self. Also,
the name is strange because this returns a comparer, not a sorter.<br>

*/

      getChildSorterFunc = function( /* ARGUMENTS */
       /** argument not used         */ nodeType, 
       /** argument not used ()      */ self)     
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
      }; //end getChildSorterFunc
      this.getChildSorterFunc = this.getChildSorterFunc || getChildSorterFunc;

/* ******************************************************************* */

/* excludeFromVisit */
/** (function-valued variable of withModelTraverser)<br><br>

Returned Value: false<br><br>

Called By: this.visitAllChildrenRec<br><br>

This function is defined also in FederatesExporter.js and
DeploymentExporter.js (and possibly elsewhere).<br>

*/

      excludeFromVisit = function(              /* ARGUMENTS */
       /** node to be tested for exclusion      */ node)
      {
        var exclude = false;
        return exclude;
      } // end excludeFromVisit

/* If this.excludeFromVisit is not already defined, it is set to
excludeFromVisit.
*/

      this.excludeFromVisit = this.excludeFromVisit || excludeFromVisit;

/* ******************************************************************* */

/* visitAllChildrenFromRootContainer */
/** (function-valued variable of withModelTraverser)<br><br>

Returned Value: none<br><br>

Called By:<br>
  FederatesExporter.prototype.main in FederatesExporter.js<br>
  DeploymentExporter.Prototype.main in DeploymentExporter.js<br>
  and maybe other functions<br><br>

This processes the children of the root node.

The context variable declared here is passed around extensively and gets
properties added to it in many places. It gets cloned in loadChildren, so
that each child has its own version.<br>

*/

      visitAllChildrenFromRootContainer = function( /* ARGUMENTS */
       /** root node from which to start visit      */ rootNode,
       /** function to call if error                */ callback)
      {
        var self = this;
        var error = '';
        var context = {};          // initialization of model used extensively
        var counter = {visits: 1}; 
        var counterCallback;       // function variable

/* ******************************************************************* */

/* counterCallback */
/** (function-valued variable of visitAllChildrenFromRootContainer)<br><br>

Returned Value: none<br><br>

Called By: not called directly, passed as callback to visitAllChildrenRec<br><br>

This decrements counter.visits and takes action when that reaches zero.<br><br>

First, this subtracts 1 from counter.visits.<br><br>

Then, if counter.visits is now 0, (which indicates completion), then this
calls self['ROOT_post_visitor'] and ignores any error. Then it calls
the callback (an argument passed to visitAllChildrenFromRootContainer)
using as an argument [the current value of error with the err argument
appended]. Then it returns.<br><br>

Otherwise, if the err argument is not nullish, this calls callback as
described above.<br><br>

Otherwise, this does nothing more.<br><br>

self['ROOT_post_visitor'] is undefined, so the "try" will always fail
and might be removed. It seems to have been included to prepare for needing
a function that does some additional processing after all the children
have been visited (possibly involving the rootNode), but no need arose.<br>

*/

        counterCallback = function(      /* ARGUMENTS */
         /** an error message or nullish */ err)
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
                  // catch here in order to continue
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
        }; // end counterCallback

/* ******************************************************************* */
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
      }; // end visitAllChildrenFromRootContainer
      this.visitAllChildrenFromRootContainer =
      visitAllChildrenFromRootContainer;

/* ******************************************************************* */

/* visitAllChildrenRec */
/**  (function-valued variable of withModelTraverser)<br><br>

Returned Value: none<br><br>

Called By:<br>
  visitAllChildrenFromRootContainer<br>
  visitAllChildrenRec (recursively in atModelNodeChildCallback)<br><br>

By calling atModelNodeChildCallback, which calls visitAllChildrenRec
recursively, this processes the tree of children with the node
argument at the top.<br><br>

When this is called from visitAllChildrenFromRootContainer the context is
the one in that function. When this is called recursively, the context is
a copy of the context from the caller.<br><br>

The same counter (which is the counter object built in
visitAllChildrenFromRootContainer) is used in all calls to this function.<br><br>

When this is called from visitAllChildrenFromRootContainer the
callback is the counterCallback function. When this is called recursively,
the callback is the doneVisitChildCallback function.<br><br>

This function is complex. Since the function is recursive, the
atModelNodeChildCallback, doneModelNodeCallback, and
doneVisitChildCallback functions are being defined each time this
function is called. Those functions use variables that are not passed
as arguments and may have different values each time the functions are
defined.<br><br>

CPSWT and CPSWTMeta have a null base, they are their own metaTypes, and
the metaType is not an attribute, so setting nodeMetaTypeName needs
special handling for them.<br><br>

The call to self.core.loadChildren is not executing the function that
is passed to it immediately. Rather, loadChildren appears to making a
queue of such functions, adding the most recent functions at the end
of the queue. loadChildren then takes the first function off the front
of the queue and executes it.<br>

Likely "Rec" in the name means recursive.<br><br>

*/

      visitAllChildrenRec = function(    /* ARGUMENTS */
       /** node that may have children   */ node,
       /** a context, see above          */ context,
       /** counter object, see above     */ counter,
       /** callback function, see above  */ callback)
      {
        var self = this;
        var nodeName;         // name of node
        var nodeMetaTypeName; // name of metaType of node
        var passedToLoad;     // function passed to core.loadChildren

/* ******************************************************************* */

/* passedToLoad */
/** (function-valued variable of visitAllChildrenRec)<br><br>

Returned Value:  none<br><br>

Called By: not called directly, passed as callback to core.loadChildren<br><br>

Presumably, loadChildren provides the children argument by getting the
children of the node, and executes passedToLoad.<br>

*/        
        passedToLoad = function(         /* ARGUMENTS */
         /** an error message or nullish */ err,
         /** child nodes of a node       */ children)
        {
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

/* ******************************************************************* */

/* doneModelNodeCallback */
/** (function-valued variable of passedToLoad)<br><br>

Called By:<br>
  passedToLoad<br>
  doneVisitChildCallback<br>
  also passed to doneModelNode in call from doneVisitChildCallback<br><br>

  This is called when processing of the node has been completed.
  It calls the callback that is the last argument to visitAllChildrenRec.<br>

*/
          doneModelNodeCallback = function( /* ARGUMENTS */
           /** error message or nullish     */ err,
           /** context (not used)           */ ctx)
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
            }; // end doneModelNodeCallback

/* ******************************************************************* */

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
              return;
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

/* ******************************************************************* */

/* doneVisitChildCallback */
/**  (function-valued variable of passedToLoad)<br><br>

Returned Value: none<br><br>

Called By: not called directly, passed as callback to visitAllChildrenRec<br>

*/          
          doneVisitChildCallback = function( /* ARGUMENTS */
           /** error message or nullish      */ err)
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
          }; // end doneVisitChildCallback

/* ******************************************************************* */

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
        }; // end passedToLoad

/* ******************************************************************* */

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
      }; // end visitAllChildrenRec
      this.visitAllChildrenRec = visitAllChildrenRec;

/* ******************************************************************* */

/* atModelNode */
/** (function-valued variable of withModelTraverser)<br><br>

Returned Value: none<br><br>

Called By: visitAllChildrenRec<br><br>

This processes one node by calling the visitor function for the node, if
there is such a function.<br><br>

If this is called by FederatesExporter, so that federateInfos exists, and
the node type is in the federateTypes of the FederatesExporter, then<br>
 - If there is already an entry in federateInfos for the node,
   the name, metaType, and generateCode are added.<br>
 - If not, a new entry in federateInfos is built for the node.<br><br>

This selects the visitorFuncName from the visitorNames according to
the metaType name of the node. If there is such a visitorFuncName, it
then calls self[visitorFuncName]. If there is an unexpected error,
this calls the callback with the original context and returns.<br><br>

The only use of the parent argument is for passing to the visitor function.<br>

*/

      atModelNode = function(                  /* ARGUMENTS */
       /** node to be processed                */ node,
       /** parent of node                      */ parent,
       /** context object that may be modified */ context,
       /** callback function                   */ callback)
      {
        var self;
        var nodeName;
        var nodeMetaTypeName;
        var visitorFuncName;
        var codeGen;
        var id;
        var ret;

        self = this;
        nodeName = self.core.getAttribute(node, 'name');
        nodeMetaTypeName = ((nodeName === 'CPSWT') ? 'CPSWT' :
                            (nodeName === 'CPSWTMeta') ? 'CPSWTMeta' :
                self.core.getAttribute(self.getMetaType(node),'name'));
        visitorFuncName = self.visitorNames[nodeMetaTypeName];
        codeGen = self.core.getAttribute(node, 'EnableCodeGeneration');
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
        if (visitorFuncName)
          {
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
              callback(err);
              return;
            }
          }
        callback(null, context);
        return;
      }; // closes this.atModelNode=
      this.atModelNode = atModelNode;

/* ******************************************************************* */

/* doneModelNode */
/** (function-valued variable of withModelTraverser)<br><br>

Returned Value: none<br><br>

Called By:<br>
  doneVisitChildCallback<br>
  doneModelNodeCallback<br><br>

This calls the post-visit function for the node if there is one.<br><br>

This asks for the postVisitorFuncName from the postVisitorNames.  If
that name exists, then this calls self[postVisitorFuncName], which
revises the context. In that case this calls the callback with the
revised context and returns, unless there is an unexpected error.<br><br>

Whenever a new post visitor function is created for a specific metaType,
the function name must be made the value of the metaType name property
in the postVisitorNames.<br><br>

This is similar to atModelNode. See the documentation of atModelNode.<br>

*/
      doneModelNode = function(                /* ARGUMENTS */
       /** node to be processed                */ node,
       /** context object that may be modified */ context,
       /** callback function                   */ callback)
      {
        var self;
        var nodeName;
        var nodeMetaTypeName;
        var postVisitorFuncName;
        var ret;

        self = this;
        nodeName = self.core.getAttribute(node, 'name');
        nodeMetaTypeName = ((nodeName === 'CPSWT') ? 'CPSWT' :
                            (nodeName === 'CPSWTMeta') ? 'CPSWTMeta' :
                      self.core.getAttribute(self.getMetaType(node),'name'));
        postVisitorFuncName = self.postVisitorNames[nodeMetaTypeName];
        if (postVisitorFuncName)
          {
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
              callback(err);
            }
          }
        callback(null, context);
        return;
      }; // end doneModelNode
      this.doneModelNode = doneModelNode;

/* ******************************************************************* */

/* cloneCtx */
/** (function-valued variable of withModelTraverser)<br><br>

Returned Value: a copy of an object<br><br>

Called By: self.core.loadChildren<br><br>

This makes a copy of an object by first setting the copy to a call to
the constructor of the object and then adding any own properties of the
object.<br>

*/
      cloneCtx = function(     /* ARGUMENTS */
       /** object to be copied */ obj)
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
      this.cloneCtx = cloneCtx;

/* ******************************************************************* */

    }; // end withModelTraverser
    return withModelTraverser;
 }); // end function and define
