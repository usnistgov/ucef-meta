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

    var CppImplFederateExporter  = function () {
        var self = this,
            implDirectoryPath;

        this.initCppImplFederate = function(){
            var self = this;

            if(self.cppImplFederateInitDone){
                return;
            }
            
            var baseDirectoryPath = 'cpp-federates/';
            var implDirectorySpec = {
                federation_name: self.projectName,
                artifact_name: "impl",
                language: "cpp"
            };
            implDirectoryPath = baseDirectoryPath + ejs.render(self.directoryNameTemplate, implDirectorySpec);

            self.cpp_federateImplPOM = new MavenPOM();
            self.cpp_federateImplPOM.groupId = self.mainPom.groupId.trim();
            self.cpp_federateImplPOM.artifactId = self.projectName + "-impl-cpp";
            self.cpp_federateImplPOM.version = self.project_version;
            self.cpp_federateImplPOM.packaging = "pom";
            self.cpp_federateImplPOM.addNarPlugin("executable");
            
            self.fileGenerators.push(function(artifact, callback) {
                if (!self.cppPOM || !self.cpp_basePOM) {
                    callback();
                    return;
                }
                
                self.cpp_federateImplPOM.setParentPom(self.cppPOM);
                self.cpp_federateImplPOM.dependencies.push(self.cpp_basePOM);
                
                var xmlPOM = self._jsonToXml.convertToString(self.cpp_federateImplPOM.toJSON());
                artifact.addFile(implDirectoryPath + "/pom.xml", xmlPOM, function(err) {
                    if (err) {
                        callback(err);
                        return;
                    } else {
                        callback();
                    }
                });
            });
            
            self.cppImplFederateInitDone = true;
        };

        this.visit_CppImplFederate = function(node, parent, context) {
            var self = this;

            return {context:context};
        };

        this.post_visit_CppImplFederate = function(node, context) {
            var self = this;

            var implPOM = new MavenPOM(self.cpp_federateImplPOM);
            implPOM.groupId = self.cpp_federateImplPOM.groupId;
            implPOM.artifactId = context['cppfedspec']['simname'] + "-" + context['cppfedspec']['classname'] + "-cpp";
            implPOM.version = self.cpp_federateImplPOM.version;
            implPOM.packaging = "nar";
            implPOM.directory = context['cppfedspec']['classname'];

            var fedDirectoryPath = implDirectoryPath + "/" + context['cppfedspec']['classname'];

            // set the SOM.xml outpit directory
            var feder = self.federateInfos[self.core.getPath(node)];
            if (feder) {
                feder.directory = fedDirectoryPath + "/conf/";
            }

            self.fileGenerators.push(function(artifact, callback) {
                var xmlPOM = self._jsonToXml.convertToString(implPOM.toJSON());
                artifact.addFile(fedDirectoryPath + "/pom.xml", xmlPOM, function(err) {
                    if (err) {
                        callback(err);
                        return;
                    } else {
                        callback();
                    }
                });
            });

            self.fileGenerators.push(function(artifact, callback) {
                var classname = context['cppfedspec']['classname'];
                artifact.addFile(fedDirectoryPath + "/src/main/include/" + classname + ".hpp", ejs.render(TEMPLATES['cpp/federateimpl.hpp.ejs'], context['cppfedspec']), function(err) {
                    if (err) {
                        callback(err);
                        return;
                    } else {
                        callback();
                    }
                });
            });

            self.fileGenerators.push(function(artifact, callback) {
                var classname = context['cppfedspec']['classname'];
                artifact.addFile(fedDirectoryPath + "/src/main/c++/" + classname + ".cpp", ejs.render(TEMPLATES['cpp/federateimpl.cpp.ejs'], context['cppfedspec']), function(err) {
                    if (err) {
                        callback(err);
                        return;
                    } else {
                        callback();
                    }
                });
            });

            return {context:context};
        };
    };

    return CppImplFederateExporter;
});

