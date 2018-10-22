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

        this.federateTypes['LabVIEWFederate'] = {
            includeInExport: false
        };

    	this.visit_LabVIEWFederate = function(node, parent, context) {
            var self = this,
                nodeType = self.core.getAttribute( self.getMetaType(node), 'name' );

            context['labviewfedspec'] = {};
            context['labviewfedspec']['groupId'] = self.mainPom.groupId.trim();
            context['labviewfedspec']['projectName'] = self.projectName;
            context['labviewfedspec']['projectVersion'] = self.project_version;
            context['labviewfedspec']['classname'] = self.core.getAttribute(node, 'name');
            context['labviewfedspec']['lookahead'] = self.core.getAttribute(node, 'Lookahead');
            context['labviewfedspec']['step'] = self.core.getAttribute(node, 'Step');
            context['labviewfedspec']['bindAddress'] = self.getCurrentConfig().bindAddress.trim();
            context['labviewfedspec']['rootdir'] = self.getCurrentConfig().codebaseDirectory.trim();
            context['labviewfedspec']['jarfile'] = labviewArtifactId + "-" + labviewVersion + ".jar";
            context['labviewfedspec']['labviewPOM'] = {};
            context['labviewfedspec']['labviewPOM']['artifactId'] = labviewArtifactId;
            context['labviewfedspec']['labviewPOM']['groupId'] = labviewGroupId;
            context['labviewfedspec']['labviewPOM']['version'] = labviewVersion;

            self.federates[self.core.getPath(node)] = context['labviewfedspec'];

            return {context: context};
        };

        this.post_visit_LabVIEWFederate = function(node, context) {
            var self = this,
                renderContext = context['labviewfedspec'],
                moduleName = renderContext['classname'],
                configDirectory = moduleName + "/conf";

            // set the SOM.xml outpit directory
            var feder = self.federateInfos[self.core.getPath(node)];
            if (feder) {
                feder.directory = moduleName + "/conf/";
            }

            // TODO rework MavenPOM.js for a more robust solution to link the module
            self.mainPom.projects.push({'directory': moduleName});

            // generate the pom.xml that fetches the LabVIEW federate code and resources
            self.fileGenerators.push(function (artifact, callback) {
                artifact.addFile(moduleName + "/pom.xml", ejs.render(TEMPLATES['java/labview-pom.xml.ejs'], renderContext), function(err) {
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
