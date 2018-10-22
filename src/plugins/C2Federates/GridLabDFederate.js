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

    var GridLabDFederateExporter = function () {
        var gridlabdArtifactId = "gridlabd-federate",
            gridlabdGroupId = "gov.nist.hla.gridlabd",
            gridlabdVersion = "1.0.0-SNAPSHOT";

        this.federateTypes['GridLabDFederate'] = {
            includeInExport: false
        };

    	this.visit_GridLabDFederate = function(node, parent, context) {
            var self = this,
                nodeType = self.core.getAttribute( self.getMetaType(node), 'name' );

            context['gldfedspec'] = {};
            context['gldfedspec']['projectName'] = self.projectName;
            context['gldfedspec']['projectVersion'] = self.project_version;
            context['gldfedspec']['classname'] = self.core.getAttribute(node, 'name');
            context['gldfedspec']['lookahead'] = self.core.getAttribute(node, 'Lookahead');
            context['gldfedspec']['step'] = self.core.getAttribute(node, 'Step');
            context['gldfedspec']['bindAddress'] = self.getCurrentConfig().bindAddress.trim();
            context['gldfedspec']['jarfile'] = gridlabdArtifactId + "-" + gridlabdVersion + ".jar";

            self.federates[self.core.getPath(node)] = context['gldfedspec'];

            return {context: context};
        };

        this.post_visit_GridLabDFederate = function(node, context) {
            var self = this,
                renderContext = context['gldfedspec'],
                moduleName = renderContext['classname'],
                configDirectory = moduleName + "/conf";

            // set the SOM.xml outpit directory
            var feder = self.federateInfos[self.core.getPath(node)];
            if (feder) {
                feder.directory = moduleName + "/conf/";
            }

            // reference to the GridLAB-D wrapper
            var gridlabdPOM = new MavenPOM();
            gridlabdPOM.artifactId = gridlabdArtifactId;
            gridlabdPOM.groupId = gridlabdGroupId;
            gridlabdPOM.version = gridlabdVersion;

            // pom.xml that fetches the resources required to run the GridLAB-D federate
            // the maven-dependency-plugin will pull in the GridLAB-D wrapper code
            // the maven-resources-plugin will pull in the FederatesExporter FOM.xml file
            var gldHelperPOM = new MavenPOM(self.mainPom);
            gldHelperPOM.artifactId = moduleName;
            gldHelperPOM.version = renderContext['projectVersion'];
            gldHelperPOM.dependencies.push(gridlabdPOM);
            gldHelperPOM.plugins.push({
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

            // generate the pom.xml that fetches the GridLAB-D federate code and resources
            self.fileGenerators.push(function (artifact, callback) {
                artifact.addFile(moduleName + "/pom.xml", self._jsonToXml.convertToString(gldHelperPOM.toJSON()), function(err) {
                    if (err) {
                        callback(err);
                        return;
                    } else {
                        callback();
                    }
                });
            });

            // generate the script that runs the GridLAB-D federate
            self.fileGenerators.push(function (artifact, callback) {
                artifact.addFile(moduleName + "/run.sh", ejs.render(TEMPLATES['java/gridlabd-run.sh.ejs'], renderContext), function(err) {
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

            // generate the GridLAB-D federate configuration file
            self.fileGenerators.push(function (artifact, callback) {
                artifact.addFile(configDirectory + "/" + moduleName + ".json", ejs.render(TEMPLATES['java/gridlabd-config.json.ejs'], renderContext), function (err) {
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
    return GridLabDFederateExporter;
});
