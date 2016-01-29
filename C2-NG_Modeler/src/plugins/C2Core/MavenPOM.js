define([], function () {
    'use strict';

    var MavenPOM  = function (parentPom) {
    	this.groupId = '';
    	this.artifactId = '';
    	this.version = '';
    	this.packaging = '';	
    	this.name = '';
    	this.parent = null;
    	this.projects = [];
        this.dependencies = [];
        if(parentPom){
            this.parent = parentPom;
            this.groupId = parentPom.groupId;
        }
    }

    MavenPOM.prototype.constructor = MavenPOM;    

    MavenPOM.prototype.toJSON = function(verbose){
    	var model = {
    		'@xmlns': 'http://maven.apache.org/POM/4.0.0',
    		'@xmlns:xsi': 'http://www.w3.org/2001/XMLSchema-instance',
    		'@xsi:schemaLocation': 'http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd'
    	};
    	//if(verbose){
    		model['modelVersion'] = {'#text': '4.0.0'};
    	//}
    	if(this.parent){
    		model['parent'] = {
    			'groupId': {'#text': this.parent.groupId},
    			'artifactId': {'#text': this.parent.artifactId},
    			'version': {'#text': this.parent.version}
    		}
    	}
    	if(this.groupId && !(this.parent)){
			model['groupId'] = {'#text': this.groupId};
    	}
    	if(this.artifactId){
			model['artifactId'] = {'#text': this.artifactId};
    	}
    	if(this.version && !(this.parent && this.parent.version == this.version)){
			model['version'] = {'#text': this.version};
    	}
    	if(this.packaging){
			model['packaging'] = {'#text': this.packaging};
    	}
    	if(this.name){
			model['name'] = {'#text': this.name};
    	}
    	if(this.description){
			model['description'] = {'#text': this.description};
    	}
    	if(this.url){
			model['url'] = {'#text': this.url};
    	}
    	if(this.licenses){
			model['licenses'] = [];
    	}
        if(this.projects && this.projects.length > 0){
            model['modules']={'module':[]};
            this.projects.forEach(function(proj){
                model['modules']['module'].push({'#text': proj.artifactId});
            });
        }
        if(this.dependencies && this.dependencies.length > 0){
            model['dependencies']={'dependency':[]};
            this.dependencies.forEach(function(dependency){
                model['dependencies']['dependency'].push({
                    'groupId': {'#text': dependency.groupId},
                    'artifactId': {'#text': dependency.artifactId},
                    'version': {'#text': dependency.version}
                });
            });
        }

    	return {
    		'project': model
    	};	
    }

    return MavenPOM;

});