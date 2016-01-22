define([
    'common/util/ejs',
	'C2Federates/Templates/Templates',
    'C2Federates/JavaRTI'
], function (
    ejs,
	TEMPLATES,
    JavaRTI
) {

    'use strict';

    var JavaFederateExporter  = function () {
    	var self = this;
        
        JavaRTI.call(this);

        this.federateTypes = this.federateTypes || {};
    	this.federateTypes['JavaFederate'] = {
    		includeInExport: false,
    		longName: 'JavaFederate',
            init: function(){
                self.initRTI();
            }
    	};

    	this.visit_JavaFederate = function(node, parent, context){
            var self = this,
                nodeType = self.core.getAttribute( self.getMetaType( node ), 'name' );

            self.logger.info('Visiting a JavaFederate');

            context['javafedspec'] = self.createCodeModeTemplate();
            context['javafedspec']['classname'] =  self.core.getAttribute(node, 'name');

            return {context:context};
        };

        this.post_visit_JavaFederate = function(node, context){
            var self = this,
                outFileName = "src/java/"+ self.core.getAttribute(node, 'name') + ".java",
                renderContext = context['javafedspec'];
            self.fileGerenrators.push(function(artifact, callback){
                artifact.addFile(outFileName, ejs.render(TEMPLATES['class.java.ejs'], renderContext), function (err) {
                    if (err) {
                        callback(err);
                        return;
                    }else{
                        callback();
                    }
                });
            });
                    
            return {context:context};
        };

        this.createCodeModeTemplate = function(){
            /*return {
                simname: "",
                melderpackagename: "",
                classname: "",
                isnonmapperfed: false,
                timeconstrained: false,
                timeregulating: false,
                lookahead: {},
                asynchronousdelivery: false,
                publishedinteractiondata: {},
                subscribedinteractiondata: {},
                allinteractiondata: {},
                publishedobjectdata: {
                    publishedAttributeData: [],
                    logPublishedAttributeData: [],
                    publishedAttributeData: []},
                subscribedobjectdata: {
                    subscribedAttributeData:[],
                    logSubscribedAttributeData:[],
                    subscribedAttributeData: []},
                allobjectdata: {},
                helpers:{}
            };*/
            return {
                simname: "",
                classname: "",
                parentclassname: "",
                hlaclassname: "",
                isinteraction: false,
                isc2winteractionroot: false,
                datamembers: [],
                alldatamembers: [],
                
                helpers:{
                    primitive2object: function(type){
                        var typeMap = {
                            "String"  : "String",
                            "int"     : "Integer",
                            "long"    : "Long",
                            "short"   : "Short",
                            "byte"    : "Byte",
                            "char"    : "Character",
                            "double"  : "Double",
                            "float"   : "Float",
                            "boolean" : "Boolean"};
                        return typeMap[type];
                    },
                    supplied: function(type, name){
                        var typeMap = {
                            "String"  : "get_" + name + "()",
                            "int"     : "Integer.toString( get_" + name +"() )",
                            "long"    : "Long.toString( get_" + name +"() )",
                            "short"   : "Short.toString( get_" + name +"() )",
                            "byte"    : "Byte.toString( get_" + name +"() )",
                            "char"    : "Character.toString( get_" + name +"() )",
                            "double"  : "Double.toString( get_" + name +"() )",
                            "float"   : "Float.toString( get_" + name +"() )",
                            "boolean" : "Boolean.toString( get_" + name +"() )"
                        }
                        return typeMap[type];
                    },
                    set: function(type){
                        var typeMap = {
                            "String"  : "val",
                            "int"     : "Integer.parseInt( val )",
                            "long"    : "Long.parseLong( val )",
                            "short"   : "Short.parseShort( val )",
                            "byte"    : "Byte.parseByte( val )",
                            "char"    : "val.charAt( 0 )",
                            "double"  : "Double.parseDouble( val )",
                            "float"   : "Float.parseFloat( val )",
                            "boolean" : "Boolean.parseBoolean( val )"
                        }
                        return typeMap[type];
                    },
                    get: function(type, name){
                        var typeMap = {
                            "String"  : "get_" + name + "()",
                            "int"     : "new Integer( get_" + name +"() )",
                            "long"    : "new Long( get_" + name +"() )",
                            "short"   : "new Short( get_" + name +"() )",
                            "byte"    : "new Byte( get_" + name +"() )",
                            "char"    : "new Character( get_" + name +"() )",
                            "double"  : "new Double( get_" + name +"() )",
                            "float"   : "new Float( get_" + name +"() )",
                            "boolean" : "new Boolean( get_" + name +"() )"
                        }
                        return typeMap[type];
                    },
                    initialvalue: function(type){
                        var typeMap = {
                            "String"  : '""',
                            "int"     : "0",
                            "long"    : "0",
                            "short"   : "0",
                            "byte"    : "0",
                            "char"    : "\\000",
                            "double"  : "0",
                            "float"   : "0",
                            "boolean" : "false",
                            default   : ""
                        }
                        return typeMap[type];
                    }
                },
                ejs:ejs, 
                TEMPLATES:TEMPLATES
            };
        }
        this.javaCodeModel = this.createCodeModeTemplate();

    }

    return JavaFederateExporter;
});