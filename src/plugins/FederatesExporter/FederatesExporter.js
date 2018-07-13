/*globals define*/
/*jshint node:true, browser:true*/

/*

Generated by PluginGenerator 0.14.0 from webgme
on Wed Dec 02 2015 15:05:52 GMT-0600 (CST).

Modified by T. Kramer 

*/

define
([
  'text!./metadata.json',
  'plugin/PluginBase',
  'common/util/ejs',
  'C2Core/ModelTraverserMixin',
  'C2Core/xmljsonconverter',
  'C2Core/MavenPOM',
  'FederatesExporter/PubSubVisitors',
  'FederatesExporter/RTIVisitors',
  'FederatesExporter/Templates/Templates',
  'C2Federates/GenericFederate',
  'C2Federates/JavaFederate',
  'C2Federates/MapperFederate',
  'C2Federates/CppFederate',
  'C2Federates/OmnetFederate',
  'C2Federates/CPNFederate'],
 function (pluginMetadata,
	   PluginBase,
	   ejs,
	   ModelTraverserMixin,
	   JSON2XMLConverter,
	   MavenPOM,
	   PubSubVisitors,
	   RTIVisitors,
	   TEMPLATES,
	   GenericFederate,
	   JavaFederate,
	   MapperFederate,
	   CppFederate,
	   OmnetFederate,
	   CPNFederate)
 {
   'use strict';

   // console.log(pluginMetadata);
   pluginMetadata = JSON.parse(pluginMetadata);

   /**
    * Initializes a new instance of FederatesExporter.
    * @class
    * @augments {PluginBase}typ
    * @classdesc This class represents the plugin FederatesExporter.
    * @constructor
    */
   var FederatesExporter = function()
     {
       // Call base class' constructor.
       this.federateTypes = this.federateTypes || {};  
       
       PluginBase.call(this);
       ModelTraverserMixin.call(this);
       PubSubVisitors.call(this);
       RTIVisitors.call(this);
       GenericFederate.call(this);
       JavaFederate.call(this);
       MapperFederate.call(this);
       CppFederate.call(this);
       OmnetFederate.call(this);
       CPNFederate.call(this);
       
       this.mainPom = new MavenPOM();
       this._jsonToXml = new JSON2XMLConverter.Json2xml();
       this.pluginMetadata = pluginMetadata;
     };
   
   // Prototypal inheritance from PluginBase.
   FederatesExporter.prototype = Object.create(PluginBase.prototype);
   FederatesExporter.prototype.constructor = FederatesExporter;
   FederatesExporter.metadata = pluginMetadata;
   
   /**
    * Main function for the plugin to execute. This will perform the execution.
    * Notes:
    * - Always log with the provided logger.[error,warning,info,debug].
    * - Do NOT put any user interaction logic UI, etc. inside this method.
    * - callback always has to be called even if error happened.
    *
    * @param {function(string, plugin.PluginResult)} callback -
    * the result callback
    */
   FederatesExporter.prototype.main = function (callback)
     {
       // Use self to access core, project, result, logger etc from PluginBase.
       // These are all instantiated at this point.
       var self = this,
       generateFiles,           // function
       numberOfFilesToGenerate, // counter
       finishExport,            // function
       saveAndReturn;           // function
       
       self.fileGenerators = [];
       self.corefileGenerators = [];
       self.fom_sheets = {};
       self.interactions = {};
       self.interactionRoots = [];
       self.objects      = {};
       self.objectRoots = [];
       self.attributes   = {};
       self.federates = {};
       self.javafederateName = {};
       self.fedFilterMap = {};
       self.fedFilterMap["MAPPER_FEDERATES"] = "MAPPER";
       self.fedFilterMap["NON-MAPPER_FEDERATES"] = "NON_MAPPER";
       self.fedFilterMap["BOTH"] = "ORIGIN_FILTER_DISABLED";
       self.fedFilterMap["SELF"] = "SELF";
       self.fedFilterMap["NON-SELF"] = "NON_SELF";
       
       self.projectName = self.core.getAttribute(self.rootNode, 'name');
       self.project_version =
         self.getCurrentConfig().exportVersion.trim() +
         (self.getCurrentConfig().isRelease ? "" : "-SNAPSHOT");
       self.cpswt_version = self.getCurrentConfig().cpswtVersion.trim();
       self.directoryNameTemplate=
         '<%=federation_name%><%=artifact_name?"-"+artifact_name:""%><%=language?"-"+language:""%>';
       self.generateExportPackages =
         self.getCurrentConfig().generateExportPackages;
       self.mainPom.artifactId = self.projectName + "-root";
       self.mainPom.version = self.project_version;
       self.mainPom.packaging = "pom";
       self.mainPom.groupId = self.getCurrentConfig().groupId.trim();
       self.mainPom.addRepository(
         {
 	   'id': 'archiva.internal',
	   'name': 'Internal Release Repository',
	   'url': self.getCurrentConfig().repositoryUrlRelease.trim()
	 });
        
       self.mainPom.addSnapshotRepository(
         {
            'id': 'archiva.snapshots',
            'name': 'Internal Snapshot Repository',
            'url': self.getCurrentConfig().repositoryUrlSnapshot.trim()
	 });

        self.getCurrentConfig().includedFederateTypes.trim().split(" ").forEach(function(e)
          {
            if (self.federateTypes.hasOwnProperty(e))
	      {
                self.federateTypes[e].includeInExport = true;
                if (self.federateTypes[e].hasOwnProperty('init'))
		  {
		    self.federateTypes[e].init.call(self); 
		  }
	      }
	  });

        // Using the logger.
        //self.logger.debug('This is a debug message.');
        //self.logger.info('This is an info message.');
        //self.logger.warn('This is a warning message.');
        //self.logger.error('This is an error message.');

        //Add POM generator
        self.fileGenerators.push(function(artifact, callback)
          {
	    artifact.addFile('pom.xml',
			     self._jsonToXml.convertToString(self.mainPom.toJSON() ),
			     function (err)
			       {
				   if (err)
				   {
				       callback(err);
				       return;
				   }
				   else
				   {
				       callback();
				   }
			       });
          });
       
       // This file generator uses a traverser as well as a file writer
	 
       self.fomModel = {federationname: self.projectName,
			version: self.getCurrentConfig().exportVersion.trim(),
			pocOrg: self.mainPom.groupId,
			objects: [],
			dateString: "",
			interactions: []};

       self.fileGenerators.push(function (artifact, callback)
	{ 
	   var interactionTraverser_xml = function (interaction, space)
	     {
	       var intModel = {interaction: interaction,
			       indent: space,
			       parameters: interaction.parameters,
			       children: []};
	       if (interaction.name === "InteractionRoot" ||
		   interaction.name === "C2WInteractionRoot")
		 {
		   interaction.sharing = "Neither";
		 }
	       else
		 {
		   interaction.sharing = "PublishSubscribe";
		 }
	       if (interaction.delivery === "reliable")
		 {
		   interaction.delivery = "HLAreliable";
		 }
	       else
		 {
		   interaction.delivery = "HLAbestEffort";
		 }
	       if (interaction.order === "timestamp")
		 {
		   interaction.order = "TimeStamp";
		 }
	       else
		 {
		   interaction.order = "Receive";
		 }
	       // here interactionTraverser_xml calls itself recursively to
	       // generate XML for the children before generating
	       // XML for the parent
	       interaction.children.forEach(function (child)
	         {
		     intModel.children.
			 push(interactionTraverser_xml(child, space + "  "));
		 });
	       // now generate XML for the parent
	       return ejs.render(TEMPLATES["fedfile_siminteraction_xml.ejs"],
				 intModel);
	     }
	   var today = new Date();
	   var year = today.getFullYear();
	   var month = today.getMonth();
	   var day = today.getDate();
	   self.fomModel.interactions_xml = [];
	   self.fomModel.dateString = year + "-" +
	     ((month < 10) ? "0" : "") + month + "-" +
	     ((day < 10) ? "0" : "") + day;
	   self.interactionRoots.forEach(function (inta)
	     {
		 self.fomModel.interactions_xml.
		   push(interactionTraverser_xml(inta, "  "));
	     });
	   
	   // The objectTraverser_xml is a recursive function that takes
	   // an object of some sort that may have children (which are
	   // objects of the same sort or a similar sort) and builds
	   // an objModel from it. The objModel is given the same name
	   // and attributes as the object and is given children that
	   // are XML code built by a recursive call to itself on the
	   // children of the object.
	   // Then XML for the objModel is generated (and saved) by
	   // calling ejs.render using the fedfile_simobject_xml XML
	   // Template.
	   // The original call to this function is a few lines below
	   // the function definition where fomModel.objects is built
	   // by calling it on each object in objectRoots (which seems
	   // to be expected to have only one member).
	   var objectTraverser_xml = function (object, space)
	     {
	       var objModel = {name: object.name,
			       attributes: object.attributes,
			       indent: space,
			       children: [],
			       sharing: ""};
	       if (object.name === "ObjectRoot")
		 {
		   objModel.sharing = "Neither";
		 }
	       else
		 {
		   objModel.sharing = "PublishSubscribe";
		 }
	       // Some properties of the attributes of the objModel (which
	       // are the attributes of the object) are modified in place
	       // as follows.
	       objModel.attributes.forEach(function (attr)
	         {
		   if (attr.delivery === "reliable")
		     {
		       attr.delivery = "HLAreliable";
		     }
		   else
		     {
		       attr.delivery = "HLAbestEffort";
		     }
		   if (attr.order === "timestamp")
		     {
		       attr.order = "TimeStamp";
		     }
		   else
		     {
		       attr.order = "Receive";
		     }
		 })
	       
	       // here objectTraverser_xml calls itself recursively to
	       // generate XML for the children before generating
	       // XML for the parent
	       object.children.forEach(function (child)
	         { // changed - we do not want to include the FederateObject
		   if (child.name != "FederateObject")
		     {
		       objModel.children.
			 push(objectTraverser_xml(child, space + "  "));
		     }
		 });
	       // now generate XML for the parent
	       return ejs.render(TEMPLATES["fedfile_simobject_xml.ejs"],
				 objModel);
	     }
	   
	   self.fomModel.objects_xml = [];
	   self.objectRoots.forEach(function (obj) // normally is only one root
	     { // add all the XML for objects to fomModel
	       self.fomModel.objects_xml.push(objectTraverser_xml(obj, "  "));
	     });
	     
	   artifact.addFile('fom/' + self.projectName + '.xml',
			    ejs.render(TEMPLATES['fedfile.xml.ejs'],
				       self.fomModel),
			    function (err)
			    {
			      if (err)
				{
				  callback(err);
				  return;
				}
			      else
				{
				  callback();
				}
			    });
	 });
       
     generateFiles = function(artifact, fileGenerators, doneBack)
       {
	 if (numberOfFilesToGenerate > 0)
	   { 
	     fileGenerators[fileGenerators.length -
			    numberOfFilesToGenerate](artifact, function(err)
	       {
		 if (err)
		   {
		     callback(err, self.result);
		     return;
		   }
		 numberOfFilesToGenerate--;
		 if (numberOfFilesToGenerate > 0)
		   {
		     generateFiles(artifact, fileGenerators, doneBack);
		   }
		 else
		   {
		     doneBack();
		   }
	       });                
	   }
	 else
	   {
	     doneBack();
	   }
       }
       
     saveAndReturn = function(err)
       {
	 var errorRaised = false;
	 for(var i = 0; i < self.result.getMessages().length; i++)
	   {
	     var msg = self.result.getMessages()[i];
	     if (msg.severity == 'error')
	       {
		 errorRaised = true;
	       }
	   }
	 if (!errorRaised)
	   {
	     self.blobClient.saveAllArtifacts(function (err, hashes)
               {
		 if (err)
		   {
		     callback(err, self.result);
		     return;
		   }
		 
		 // This will add a download hyperlink in the result-dialog.
		 for (var idx = 0; idx < hashes.length; idx++)
		   {
		     self.result.addArtifact(hashes[idx]);
		     
		     var artifactMsg =
		       'Code package ' +
		       self.blobClient.artifacts[idx].name +
		       ' was generated with id:[' + hashes[idx] + ']';
		     var buildURL =
		       "'http://c2w-cdi.isis.vanderbilt.edu:8080/job/c2w-pull/buildWithParameters?GME_ARTIFACT_ID=" + hashes[idx] + "'";
		     artifactMsg += '<br><a title="Build package..." '+
		       'onclick="window.open(' + buildURL + ', \'Build System\'); return false;">Build artifact..</a>';
		     self.createMessage(null, artifactMsg );
		   };
                    
		 // This will save the changes. If you don't want to save;
		 // exclude self.save and call callback directly from this scope.
		 self.save('FederatesExporter updated model.', function (err)
		   {
		     if (err)
		       {
			 callback(err, self.result);
			 return;
		       }
		     self.result.setSuccess(true);
		     callback(null, self.result);
		     return;
		   });
	       });
	   }
	 else
	   {
	     self.result.setSuccess(false);
	     callback(null, self.result);
	     return;
	   }
       }
       
     finishExport = function(err)
       {
	 var artifact =
	   self.blobClient.createArtifact(self.projectName.trim().
					  replace(/\s+/g,'_') +
					  '_generated');
	 if (self.generateExportPackages)
	   {
	     var coreArtifact =
	       self.blobClient.createArtifact('generated_Core_Files');
	   }
	 numberOfFilesToGenerate = self.fileGenerators.length;
	 if (numberOfFilesToGenerate > 0)
	   {
	     generateFiles(artifact, self.fileGenerators, function(err)
	       {
		 if (err)
		   {
		     callback(err, self.result);
		     return;
		   }
		 numberOfFilesToGenerate = self.corefileGenerators.length;
		 if (self.generateExportPackages &&
		     numberOfFilesToGenerate > 0)
		   {
		     generateFiles(coreArtifact,
				   self.corefileGenerators, function(err)
		       {
			 if (err)
			   {
			     callback(err, self.result);
			     return;
			   }
			 saveAndReturn();
			 return;
                        });
		   }
		 else
		   {
		     saveAndReturn();
		     return;
		   } 
	       });
	   }
	 else
	   {
	     self.result.setSuccess(true);
	     callback(null, self.result);
	   } 
       }
       
       self.visitAllChildrenFromRootContainer(self.rootNode, function(err)
         {
	   if (err)
	     {
	       self.logger.error(err);
	       self.createMessage(null, err, 'error');
	       self.result.setSuccess(false);
	       callback(null, self.result);
	     }
	   else
	     {
	       finishExport(err);
	     }
	 });
       self.postAllVisits(self);
     }; // end of ...prototype.main

   FederatesExporter.prototype.getChildSorterFunc = function(nodeType, self)
     {
        var self = this,
            visitorName = 'generalChildSorter';
        var generalChildSorter = function(a, b)
	  {
            //a is less than b by some ordering criterion : return -1;
            //a is greater than b by the ordering criterion: return 1;
            // a equal to b, than return 0;
            var aName = self.core.getAttribute(a,'name');
            var bName = self.core.getAttribute(b,'name');
            if (aName < bName) return -1;
            if (aName > bName) return 1;
            return 0;
	  };
        return generalChildSorter;
     }
   
   FederatesExporter.prototype.excludeFromVisit =
     function(node)
     {
       var self = this,
       exclude = false;
       
       if (self.rootNode != node)
	 {    
	   var nodeTypeName =
	     self.core.getAttribute(self.getMetaType(node),'name');
	   exclude = exclude 
	     || self.isMetaTypeOf(node, self.META['Language [C2WT]'])
	     || (self.federateTypes.hasOwnProperty(nodeTypeName) &&
		 !self.federateTypes[nodeTypeName].includeInExport);
	 }
       if (exclude)
	  {
	    
	  }
       return exclude;
     }

   FederatesExporter.prototype.getVisitorFuncName =
     function(nodeType)
     {
       var self = this,
       visitorName = 'generalVisitor';
       if (nodeType)
	 {
	   visitorName = 'visit_'+ nodeType;
	   if (nodeType.endsWith('Federate'))
	     {
	       visitorName = 'visit_'+ 'Federate';
	     }
	 }
       return visitorName;   
     }

    FederatesExporter.prototype.getPostVisitorFuncName =
      function(nodeType)
      {
        var self = this,
	visitorName = 'generalPostVisitor';
	
        if (nodeType)
	  {
	    visitorName = 'post_visit_'+ nodeType;
            if (nodeType.endsWith('Federate'))
	      {
                visitorName = 'post_visit_'+ 'Federate';
	      }
	  }
        //self.logger.debug('Generated post-visitor Name: ' + visitorName);
        return visitorName;
    }

    /*
    * Rest of TRAVERSAL CODE:
    * - PubSubVisitors.js
    * - RTIVisitors.js
    * - C2Federates folder for Federate specific vistors
    */

    FederatesExporter.prototype.ROOT_visitor =
      function(node)
      {
        var self = this;
        self.logger.info('Visiting the ROOT');

        var root = {"@id": 'model:' + '/root',
		    "@type": "gme:root",
		    "model:name": self.projectName,
		    "gme:children": []};
        return {context:{parent: root}};
      }
    

    FederatesExporter.prototype.calculateParentPath =
      function(path)
      {
        if (!path)
	  {
            return null;
	  }
        var pathElements = path.split('/');
        pathElements.pop();
        return pathElements.join('/');
      }
    
    return FederatesExporter;
 });
