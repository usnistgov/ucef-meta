//jshint ignore: start
/* Generated file based on ejs templates */
define([], function() {
    return {
    "dockerFileTemplate.ejs": "--- \nservices: \n  fedManager:\n    build: .\n    image: \"ydbarve/c2wtcore_v002:160816\"\n    command: \"xvfb-run -a mvn package exec:exec -P FedManager\"\n    volumes:\n      - <%- inputPrefix %>:/root/Projects/c2wt/input\n      - <%- outputPrefix %>:/root/Projects/c2wt/logs\n<%\nfedInfos.map(function(fedInfo) {\n-%>\n  <%- fedInfo.type %>_<%- fedInfo.name %>:\n    build: .\n    image: \"<%- dockerInfoMap[fedInfo.type].name %>:<%- dockerInfoMap[fedInfo.type].tag %>\"\n    command: \"mvn package exec:exec -P <%- fedInfo.type %>,<%- fedInfo.name %>\" \n    volumes:\n      - <%- inputPrefix %>:/root/Projects/c2wt/input\n      - <%- outputPrefix %>:/root/Projects/c2wt/logs\n<%\n})\n-%>\nversion: \"2\"\n"
}});
