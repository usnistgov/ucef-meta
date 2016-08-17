//jshint ignore: start
/* Generated file based on ejs templates */
define([], function() {
    return {
    "dockerFileTemplate.ejs": "--- \nservices: \n<%\nfedInfos.map(function(fedInfo) {\n-%>\n  <%- fedInfo.type %>_<%- fedInfo.name %>:\n    build: .\n    image: \"<%- dockerInstanceName %>:<%- tag %>\"\n    command: \"mvn package exec:exec -P <%- fedInfo.type %>,<%- fedInfo.name %>\" \n    volumes:\n      - ./input:/root/Projects/c2wt/input\n      - ./output:/root/Projects/c2wt/output\n<%\n})\n-%>\nversion: \"2\"\n"
}});