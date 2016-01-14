define([
    'common/util/ejs',
	'C2Federates/Templates/Templates'
], function (
    ejs,
	TEMPLATES
) {

    'use strict';

    var JavaRTIFederateExporter  = function () {
    	this.federateTypes = this.federateTypes || {};
    	this.federateTypes['JavaFederate'] = {
    		includeInExport: false,
    		longName: 'JavaFederate'
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
            outFileName = "src/java/"+ self.core.getAttribute(node, 'name') + ".java";
            self.fileGerenrators.push(function(artifact, callback){
                artifact.addFile(outFileName, ejs.render(TEMPLATES['class.java.ejs'], context['javafedspec']), function (err) {
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
            return {
                simname: "",
                classname: "",
                parentclassname: "",
                hlaclassname: "",
                isinteraction: false,
                isc2winteractionroot: false,
                datamembers: [{name:"dName1", parameterType:"String"},{name:"dName2", parameterType:"String"}],
                alldatamembers: [{name:"dName1", parameterType:"String"},{name:"dName2", parameterType:"String"}],
                
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
                            "String"  : "get_" + name,
                            "int"     : "Integer.toString( " + name +" )",
                            "long"    : "Long.toString( " + name +" )",
                            "short"   : "Short.toString( " + name +" )",
                            "byte"    : "Byte.toString( " + name +" )",
                            "char"    : "Character.toString( " + name +" )",
                            "double"  : "Double.toString( " + name +" )",
                            "float"   : "Float.toString( " + name +" )",
                            "boolean" : "Boolean.toString( " + name +" )"
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
                            "String"  : "get_" + name,
                            "int"     : "new Integer( " + name +" )",
                            "long"    : "new Long( " + name +" )",
                            "short"   : "new Short( " + name +" )",
                            "byte"    : "new Byte( " + name +" )",
                            "char"    : "new Character( " + name +" )",
                            "double"  : "new Double( " + name +" )",
                            "float"   : "new Float( " + name +" )",
                            "boolean" : "new Boolean( " + name +" )"
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
                }
            };
        }
        this.javaCodeModel = this.createCodeModeTemplate();

    }

    return JavaRTIFederateExporter;
});