define([], function () {
    'use strict';

    var MavenPOM  = function () {
    	this.groupId = '';
    	this.artifactId = '';
    	this.version = '';
    	this.packaging = '';	
    	this.name = '';
    	this.parent = null;
    	this.projects = [];
    }

    MavenPOM.prototype.constructor = MavenPOM;    

    MavenPOM.prototype.toJSON = function(verbose){
    	var model = {
    		'@xmlns': 'http://maven.apache.org/POM/4.0.0',
    		'@xmlns:xsi': 'http://www.w3.org/2001/XMLSchema-instance',
    		'@xsi:schemaLocation': 'http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd'
    	};
    	if(verbose){
    		model['modelVersion'] = {'#text': '4.0.0'};
    	}
    	if(this.parent){
    		model['parent'] = {
    			'groupId': {'#text': this.parent.groupId},
    			'artifactId': {'#text': this.parent.artifactId},
    			'version': {'#text': this.parent.version}
    		}
    	}
    	if(this.groupId){
			model['groupId'] = {'#text': this.groupId};
    	}
    	if(this.artifactId){
			model['artifactId'] = {'#text': this.artifactId};
    	}
    	if(this.version){
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

    	return {
    		'project': model
    	};	
    }

    return MavenPOM;

});