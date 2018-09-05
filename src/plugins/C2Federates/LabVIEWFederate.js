define([
    'common/util/ejs',
    'C2Core/MavenPOM',
	'C2Federates/Templates/Templates'
], function (
    ejs,
    MavenPOM,
	TEMPLATES
) {

    'use strict';

    var LabVIEWFederateExporter = function () {
        var labviewArtifactId = "labview-federate",
            labviewGroupId = "gov.nist.hla",
            labviewVersion = "1.0.0-SNAPSHOT";

    	this.visit_LabVIEWFederate = function(node, parent, context) {
            var self = this,
                nodeType = self.core.getAttribute( self.getMetaType(node), 'name' );

            context['labviewfedspec'] = {};
            context['labviewfedspec']['projectName'] = self.projectName;
            context['labviewfedspec']['projectVersion'] = self.project_version;
            context['labviewfedspec']['classname'] = self.core.getAttribute(node, 'name');
            context['labviewfedspec']['lookahead'] = self.core.getAttribute(node, 'Lookahead');
            context['labviewfedspec']['step'] = self.core.getAttribute(node, 'Step');
            context['labviewfedspec']['bindAddress'] = self.getCurrentConfig().bindAddress.trim();
            context['labviewfedspec']['jarfile'] = labviewArtifactId + "-" + labviewVersion + ".jar";

            self.federates[self.core.getPath(node)] = context['labviewfedspec'];

            return {context: context};
        };

        this.post_visit_LabVIEWFederate = function(node, context) {
            var self = this,
                renderContext = context['labviewfedspec'],
                moduleName = renderContext['classname'],
                configDirectory = moduleName + "/conf";

            // reference to the LabVIEW wrapper
            var labviewPOM = new MavenPOM();
            labviewPOM.artifactId = labviewArtifactId;
            labviewPOM.groupId = labviewGroupId;
            labviewPOM.version = labviewVersion;

            // pom.xml that fetches the resources required to run the LabVIEW federate
            // the maven-dependency-plugin will pull in the LabVIEW wrapper code
            // the maven-resources-plugin will pull in the FederatesExporter FOM.xml file
            var labviewHelperPOM = new MavenPOM(self.mainPom);
            labviewHelperPOM.artifactId = moduleName;
            labviewHelperPOM.version = renderContext['projectVersion'];
            labviewHelperPOM.dependencies.push(labviewPOM);
            labviewHelperPOM.plugins.push({
                    'groupId': {'#text': 'org.apache.maven.plugins'},
                    'artifactId': {'#text': 'maven-dependency-plugin'},
                    'version': {'#text': '3.1.1'},
                    'executions': {
                        'execution': {
                            'id': {'#text': 'copy-dependencies'},
                            'phase': {'#text': 'package'},
                            'goals': {
                                'goal': {'#text': 'copy-dependencies'}
                            },
                            'configuration': {
                                'outputDirectory': {'#text': '${project.basedir}'},
                                'overWriteReleases': {'#text': 'true'},
                                'overWriteSnapshots': {'#text': 'true'},
                                'overWriteIfNewer': {'#text': 'true'}
                            }
                        }
                    }
                });
            labviewHelperPOM.plugins.push({
                    'groupId': {'#text': 'org.apache.maven.plugins'},
                    'artifactId': {'#text': 'maven-resources-plugin'},
                    'version': {'#text': '3.1.0'},
                    'executions': {
                        'execution': {
                            'id': {'#text': 'copy-resources'},
                            'phase': {'#text': 'package'},
                            'goals': {
                                'goal': {'#text': 'copy-resources'}
                            },
                            'configuration': {
                                'outputDirectory': {'#text': '${basedir}/conf'},
                                'resources': {
                                    'resource': {
                                        'directory': {'#text': '${basedir}/../fom'},
                                    }
                                },
                                'overwrite': {'#text': 'false'}
                            }
                        }
                    }
                });

            // generate the pom.xml that fetches the LabVIEW federate code and resources
            self.fileGenerators.push(function (artifact, callback) {
                artifact.addFile(moduleName + "/pom.xml", self._jsonToXml.convertToString(labviewHelperPOM.toJSON()), function(err) {
                    if (err) {
                        callback(err);
                        return;
                    } else {
                        callback();
                    }
                });
            });

            // generate the script that runs the LabVIEW federate
            self.fileGenerators.push(function (artifact, callback) {
                artifact.addFile(moduleName + "/run.sh", ejs.render(TEMPLATES['java/labview-run.sh.ejs'], renderContext), function(err) {
                    if (err) {
                        callback(err);
                        return;
                    } else {
                        callback();
                    }
                });
            });

            // generate the Portico configuration file
            self.fileGenerators.push(function (artifact, callback) {
                artifact.addFile(moduleName + '/RTI.rid', ejs.render(TEMPLATES['java/rti.rid.ejs'], renderContext), function (err) {
                    if (err) {
                        callback(err);
                        return;
                    } else {
                        callback();
                    }
                });
            });

            // generate the LabVIEW federate configuration file
            self.fileGenerators.push(function (artifact, callback) {
                artifact.addFile(configDirectory + "/" + moduleName + ".json", ejs.render(TEMPLATES['java/labview-config.json.ejs'], renderContext), function (err) {
                    if (err) {
                        callback(err);
                        return;
                    } else {
                        callback();
                    }
                });
            });

            // generate the log4j2 configuration file
            self.fileGenerators.push(function (artifact, callback) {
                artifact.addFile(configDirectory + "/log4j2.xml", ejs.render(TEMPLATES['java/log4j2.xml.ejs'], renderContext), function (err) {
                    if (err) {
                        callback(err);
                        return;
                    } else {
                        callback();
                    }
                });
            });

            return {context: context};
        };
    }
    return LabVIEWFederateExporter;
});
