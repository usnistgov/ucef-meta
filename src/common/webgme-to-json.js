
define(['q'], function(Q) {
	'use strict';
	return {
		loadModel: function(core, rootNode, modelNode, doResolve, keepWebGMENodes, loadFromOutsideTree) {
			var self = this;
			if (doResolve === undefined) {
				doResolve = false;
			}
			if (keepWebGMENodes === undefined) {
				keepWebGMENodes = false;
			}
			if (loadFromOutsideTree === undefined) {
				loadFromOutsideTree = false;
			}

			var pathList = [];
			var model = {
				'objects': {
				},
				'root': ''
			};

			var newObj = self.loadNode(core, modelNode, pathList, keepWebGMENodes);
			model.objects[newObj.path] = newObj;
			model.root = newObj.path;

			return core.loadSubTree(modelNode)
				.then(function(nodes) {
					nodes.map(function(node) {
						newObj = self.loadNode(core, node, pathList, keepWebGMENodes);
						model.objects[newObj.path] = newObj;
					});

					if (doResolve) {
						self.resolvePointers(model.objects);
					}

					if (loadFromOutsideTree) {
						var loadedPaths = Object.keys(model.objects);
						pathList = pathList.filter(function(path) { return loadedPaths.indexOf(path) == -1; });
						self.continueLoading(core, rootNode, model, pathList, keepWebGMENodes);
					}

					model.root = model.objects[model.root]

					return model;
				});
		},
		loadNode: function(core, node, pathList, keepWebGMENodes) {
			var self = this;
			var nodeName = core.getAttribute(node, 'name'),
				nodePath = core.getPath(node),
				nodeType = core.getBaseType(node) ? core.getAttribute(core.getBaseType(node), 'name') : null,
				parentPath = core.getParent(node) ? core.getPath(core.getParent(node)) : null,
				attributes = core.getAttributeNames(node),
				childPaths = core.getChildrenPaths(node),
				pointers = core.getPointerNames(node),
				sets = core.getSetNames(node);
			var newObj = {
				name: nodeName,
				path: nodePath,
				type: nodeType,
				parentPath: parentPath,
				childPaths: childPaths,
				attributes: {},
				pointers: {},
				sets: {}
			};
			if (childPaths.length)
				pathList = pathList.concat(childPaths);
			if (keepWebGMENodes)
				newObj.node = node;
			attributes.map(function(attribute) {
				var val = core.getAttribute(node, attribute);
				newObj.attributes[attribute] = val;
				newObj[attribute] = val;
			});
			pointers.map(function(pointer) {
				newObj.pointers[pointer] = core.getPointerPath(node, pointer);
				if (newObj.pointers[pointer])
					pathList.push(newObj.pointers[pointer]);
			});
			sets.map(function(set) {
				newObj.sets[set] = core.getMemberPaths(node, set);
				if (newObj.sets[set].length)
					pathList = pathList.concat(newObj.sets[set]);
			});
			return newObj;
		},
		resolvePointers: function(objects) {
			var self = this;
			var objPaths = Object.keys(objects);
			objPaths.map(function(objPath) {
				var obj = objects[objPath];
				// Can't follow parent path: would lead to circular data structure (not stringifiable)
				// follow children paths, these will always have been loaded
				obj.childPaths.map(function(childPath) {
					var dst = objects[childPath];
					if (dst) {
						var key = dst.type + '_list';
						if (!obj[key]) {
							obj[key] = [];
						}
						obj[key].push(dst);
					}
				});
				// follow pointer paths, these may not always be loaded!
				for (var pointer in obj.pointers) {
					var path = obj.pointers[pointer];
					var dst = objects[path];
					if (dst)
						obj[pointer] = dst;
					else if (pointer != 'base' && path != null)
						self.notify('error',
							'Cannot save pointer to object outside tree: ' +
							pointer + ', ' + path);
				}
				// follow set paths, these may not always be loaded!
				for (var set in obj.sets) {
					var paths = obj.sets[set];
					var dsts = [];
					paths.map(function(path) {
						var dst = objects[path];
						if (dst)
							dsts.push(dst);
						else if (path != null)
							self.notify('error',
								'Cannot save set member not in tree: ' +
								set + ', ' + path);
					});
					obj[set] = dsts;
				}
			});
		},
		continueLoading: function(core, rootNode, model, pathList, keepWebGMENodes) {
			var self = this;
			var tasks = pathList.map(function(path) {
				return core.loadByPath(rootNode, path)
					.then(function(node) {
						if (!core.isMetaNode(node)) {
							var newObj = self.loadNode(core, node, pathList, keepWebGMENodes);
							if (newObj)
								model.objects[newObj.path] = newObj;
						}
						else {
							pathList = pathList.filter(function(p) { return p != path; });
						}
					});
			});
			return Q.all(tasks)
				.then(function() {
					var loadedPaths = Object.keys(model.objects);
					pathList = pathList.filter(function(path) { return loadedPaths.indexOf(path) == -1; });
					if (pathList.length)
						return self.continueLoading(core, rootNode, model, pathList, keepWebGMENodes);
				});
		},
		loadFromOutsideTree: function(ptrPath) {
			var self = this;
		},
	}
});
