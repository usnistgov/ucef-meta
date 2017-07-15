define([], function () {
    'use strict';

    var MavenPOM  = function (parentPom) {
    	this.groupId = '';
    	this.artifactId = '';
    	this.version = '';
    	this.packaging = '';	
    	this.name = '';
        this.description = '';
        this.directory = null;
    	this.parent = null;
        this.properties = {};
    	this.projects = [];
        this.dependencies = [];
        this.repositories = null;
        this.plugins =[];
        if(parentPom){
            this.setParentPom(parentPom);
        }
    }

    MavenPOM.mavenJavaPath = "/src/main/java";
    MavenPOM.mavenCppPath = "/src/main/c++";
    MavenPOM.mavenIncludePath = "/src/main/include";
	MavenPOM.mavenResourcePath = "/src/main/resources";

    MavenPOM.prototype.constructor = MavenPOM;    

    MavenPOM.prototype.setParentPom = function(parentPom){
        if(parentPom){
            this.parent = parentPom;
            this.groupId = parentPom.groupId;
            this.version = parentPom.version;
            parentPom.projects.push(this);
        }
    }

    MavenPOM.prototype.addMavenCompiler = function(javaversion){
        this.plugins.push({
            'groupId': {'#text': 'org.apache.maven.plugins'},
            'artifactId': {'#text': 'maven-compiler-plugin'},
            'version': {'#text': '3.5.1'},
            'configuration':{
                'source': {'#text': javaversion},
                'target': {'#text': javaversion},
            }
        });
    }

    MavenPOM.prototype.addNarPlugin = function(type){
        this.plugins.push({
            'groupId': {'#text': 'com.github.maven-nar'},
            'artifactId': {'#text': 'nar-maven-plugin'},
            'version': {'#text': '${nar-plugin.version}'},
            'libraries':{
                'library':{'type':{'#text': type}}
            }
        });
    }

    MavenPOM.prototype.addRepository = function(params){
        this.repositories = this.repositories || {};
        this.repositories['repository'] = params;
    }

    MavenPOM.prototype.addSnapshotRepository = function(params){
        this.repositories = this.repositories || {};
        this.repositories['snapshotRepository'] = params;
    }

    MavenPOM.prototype.toJSON = function(verbose){
    	var model = {
    		'@xmlns': 'http://maven.apache.org/POM/4.0.0',
    		'@xmlns:xsi': 'http://www.w3.org/2001/XMLSchema-instance',
    		'@xsi:schemaLocation': 'http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd'
    	},
            isEmpty = function (obj) {
            for(var prop in obj) {
                if(obj.hasOwnProperty(prop))
                    return false;
            }

            return true && JSON.stringify(obj) === JSON.stringify({});
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
                if (proj.directory || proj.artifactId) {
                    model['modules']['module'].push({'#text': proj.directory?proj.directory:proj.artifactId});
                }
            });
        }

        if(this.properties && !isEmpty(this.properties) ){
            var hasProperties = false,
                propsJSON = {};
            for(var prop in this.properties) {
                if(this.properties.hasOwnProperty(prop)){
                    hasProperties = true;
                    propsJSON[prop] = {'text': this.properties[prop]};
                }
            }

            if(hasProperties){
                model['properties'] = propsJSON;
            }
        }

        if(this.dependencies && this.dependencies.length > 0){
            model['dependencies']={'dependency':[]};
            this.dependencies.forEach(function(dependency){
                var depModel = {
                    'groupId': {'#text': dependency.groupId},
                    'artifactId': {'#text': dependency.artifactId},
                    'version': {'#text': dependency.version}
                };
                if(dependency['packaging'] && dependency['packaging'] != 'jar'){
                    depModel['type'] =  {'#text': dependency['packaging']};
                }
                if(dependency.scope){
                    depModel['scope'] = {'#text': dependency.scope};
                }
                model['dependencies']['dependency'].push(depModel);
            });
        }

        if(this.repositories){
            model['repositories']={'repository':[]};
            model['distributionManagement']={};
            for(var repoId in this.repositories){
                var repo = this.repositories[repoId],
                repoModel = {
                    'id': {'#text': repo.id || ''},
                    'name': {'#text': repo.name || ''},
                    'url': {'#text': repo.url || ''} 
                };
                model['distributionManagement'][repoId]=[];
                model['distributionManagement'][repoId].push(repoModel);
                 model['repositories']['repository'].push(repoModel);
            }
        }



        if(this.plugins && this.plugins.length > 0){
            model['build'] = {'plugins': {'plugin': this.plugins}};
        }

    	return {
    		'project': model
    	};	
    }

    return MavenPOM;

});