/*globals define, WebGMEGlobal*/
/*jshint browser: true*/

/**
 * Generated by VisualizerGenerator 1.7.0 from webgme on Thu May 11 2017 10:42:38 GMT-0700 (PDT).
 */

define([
    'cytoscape/cytoscape',
    'cytoscape-cose-bilkent/cytoscape-cose-bilkent',
    'text!./style2.css',
    'handlebars/dist/handlebars',
    'q',
    'css!./styles/HFSMVizWidget.css'], function (
	cytoscape,
	regCose,
	styleText,
	Handlebars,
	Q) {
	'use strict';

	regCose( cytoscape );
	
	var HFSMVizWidget,
            WIDGET_CLASS = 'h-f-s-m-viz';

	HFSMVizWidget = function (logger, container) {
            this._logger = logger.fork('Widget');

            this._el = container;

            // set widget class
            this._el.addClass(WIDGET_CLASS);

	    this._el.append('<div id="cy"></div>');
	    this._cy_container = this._el.find('#cy');

	    // add reset and filter buttons
	    this._el.append('<button id="reset" class="btn btn-default"><i class="fa fa-arrows-h"></i></button>');
	    this._el.append('<button id="filter" class="btn btn-default" data-hasqtip="0"><i class="fa fa-filter"></i></button>');
	    this._el.append('<button id="re_layout" class="btn btn-default"><i class="fa fa-align-justify"></i></button>');

            this._initialize();

            this._logger.debug('ctor finished');
	};

	HFSMVizWidget.prototype._initialize = function () {
            var width = this._el.width(),
		height = this._el.height(),
		self = this;
	    
            this.nodes = {};
	    this.dependencies = {
		'nodes': {},
		'edges': {}
	    };
	    this.waitingNodes = {};

	    this._cytoscape_options = {
		container: this._cy_container,
		style: styleText,
		// interaction options:
		minZoom: 1e-50,
		maxZoom: 1e50,
		zoomingEnabled: true,
		userZoomingEnabled: true,
		panningEnabled: true,
		userPanningEnabled: true,
		boxSelectionEnabled: false,
		selectionType: 'single',
		touchTapThreshold: 8,
		desktopTapThreshold: 4,
		autolock: false,
		autoungrabify: false,
		autounselectify: false,

		// rendering options:
		headless: false,
		styleEnabled: true,
		hideEdgesOnViewport: false,
		hideLabelsOnViewport: false,
		textureOnViewport: false,
		motionBlur: false,
		motionBlurOpacity: 0.2,
		wheelSensitivity: 1,
		pixelRatio: 'auto'	    
	    };

	    var self = this;

	    this._layout_options = {
		'name': 'cose-bilkent',
		// Called on `layoutready`
		ready: function () {
		    self._cy.nodes().forEach(function(node) {
			var p = node.position();
			node.data('orgPos',{
			    x: p.x,
			    y: p.y
			});
		    });
		},
		// Called on `layoutstop`
		stop: function () {
		    self._cy.nodes().forEach(function(node) {
			var p = node.position();
			node.data('orgPos',{
			    x: p.x,
			    y: p.y
			});
		    });
		},
		// Whether to fit the network view after when done
		fit: true,
		// Padding on fit
		padding: 10,
		// Whether to enable incremental mode
		randomize: true,
		// Node repulsion (non overlapping) multiplier
		nodeRepulsion: 5500, // 4500
		// Ideal edge (non nested) length
		idealEdgeLength: 100,   // 50
		// Divisor to compute edge forces
		edgeElasticity: 0.45,
		// Nesting factor (multiplier) to compute ideal edge length for nested edges
		nestingFactor: 0.1,
		// Gravity force (constant)
		gravity: 0.1,  // 0.25
		// Maximum number of iterations to perform
		numIter: 2500,
		// For enabling tiling
		tile: false,   // true
		// Type of layout animation. The option set is {'during', 'end', false}
		animate: 'end',
		// Represents the amount of the vertical space to put between the zero degree members during the tiling operation(can also be a function)
		tilingPaddingVertical: 10,
		// Represents the amount of the horizontal space to put between the zero degree members during the tiling operation(can also be a function)
		tilingPaddingHorizontal: 10,
		// Gravity range (constant) for compounds
		gravityRangeCompound: 1.5,
		// Gravity force (constant) for compounds
		gravityCompound: 1.0,
		// Gravity range (constant)
		gravityRange: 3.8
	    };
	    this._cytoscape_options.layout = self._layout_options;
	    this._cy = cytoscape(self._cytoscape_options);

	    // copied from the wine and cheese demo
	    var infoTemplate = Handlebars.compile([
		'<p class="ac-name">{{name}}</p>',
		'<p class="ac-node-type"><i class="fa fa-info-circle"></i> {{NodeTypeFormatted}} {{#if Type}}({{Type}}){{/if}}</p>',
		'{{#if Milk}}<p class="ac-milk"><i class="fa fa-angle-double-right"></i> {{Milk}}</p>{{/if}}',
		'{{#if Country}}<p class="ac-country"><i class="fa fa-map-marker"></i> {{Country}}</p>{{/if}}',
		'<p class="ac-more"><i class="fa fa-external-link"></i> <a target="_blank" href="https://duckduckgo.com/?q={{name}}">More information</a></p>'
	    ].join(''));
	    
	    var layoutPadding = 50;
	    var layoutDuration = 500;

	    function highlight( node ){
		var nhood = node.closedNeighborhood();

		self._cy.batch(function(){
		    self._cy.elements("edge").not( nhood ).removeClass('highlighted').addClass('faded');
		    self._cy.elements('[NodeType="State"]').not( nhood ).removeClass('highlighted').addClass('faded');
		    self._cy.elements('[NodeType="Initial"]').not( nhood ).removeClass('highlighted').addClass('faded');
		    nhood.removeClass('faded').addClass('highlighted');
		    
		    var npos = node.position();
		    var w = window.innerWidth;
		    var h = window.innerHeight;

		    self._cy.stop().animate({
			fit: {
			    eles: self._cy.elements(),
			    padding: layoutPadding
			}
		    }, {
			duration: layoutDuration
		    }).delay( layoutDuration, function(){
			nhood.layout({
			    name: 'concentric',
			    padding: layoutPadding,
			    animate: true,
			    animationDuration: layoutDuration,
			    boundingBox: {
				x1: npos.x - w/2,
				x2: npos.x + w/2,
				y1: npos.y - w/2,
				y2: npos.y + w/2
			    },
			    fit: true,
			    concentric: function( n ){
				if( node.id() === n.id() ){
				    return 2;
				} else {
				    return 1;
				}
			    },
			    levelWidth: function(){
				return 1;
			    }
			});
		    } );
		    
		});
	    }

	    function clear(){
		self._cy.batch(function(){
		    self._cy.$('.highlighted').forEach(function(n){
			n.animate({
			    position: n.data('orgPos')
			});
		    });
		    
		    self._cy.elements().removeClass('highlighted').removeClass('faded');
		});
	    }

	    function showNodeInfo( node ){
		$('#info').html( infoTemplate( node.data() ) ).show();
	    }
	    
	    function hideNodeInfo(){
		$('#info').hide();
	    }

	    
	    self._cy.on('free', 'node', function( e ){
		self._logger.error(e);
		var n = e.cyTarget;
		var p = n.position();
		
		n.data('orgPos', {
		    x: p.x,
		    y: p.y
		});
	    });

	    self._cy.on('add', _.debounce(self.reLayout.bind(self), 250));
	    
	    self._cy.on('tap', function(){
		$('#search').blur();
	    });

	    self._cy.on('select', 'node', function(e){
		var node = this;
		if (node.id()) {
		    WebGMEGlobal.State.registerActiveSelection([node.id()]);
		}
		highlight( node );
		showNodeInfo( node );
	    });

	    self._cy.on('unselect', 'node', function(e){
		var node = this;

		clear();
		hideNodeInfo();
	    });

	    self._el.find('#re_layout').on('click', function(){
		self.reLayout();
	    });
	    
	    self._el.find('#reset').on('click', function(){
		self._cy.animate({
		    fit: {
			eles: self._cy.elements(),
			padding: layoutPadding
		    },
		    duration: layoutDuration
		});
	    });
	    
	    self._el.find('#filters').on('click', 'input', function(){
	    });
	};

	HFSMVizWidget.prototype.onWidgetContainerResize = function (width, height) {
	    this._cy.resize();
	};

	HFSMVizWidget.prototype.checkDependencies = function(desc) {
	    var self = this;
	    // dependencies will always be either parentId (nodes & edges) or connection (edges)
	    var deps = [];
	    if (desc.parentId && !self.nodes[desc.parentId]) {
		deps.push(desc.parentId);
	    }
	    if (desc.isConnection) {
		if (!self.nodes[desc.src])
		    deps.push(desc.src);
		if (!self.nodes[desc.dst])
		    deps.push(desc.dst);
	    }
	    var depsMet = (deps.length == 0);
	    if (!depsMet) {
		if (desc.isConnection)
		    self.dependencies.edges[desc.id] = deps;
		else
		    self.dependencies.nodes[desc.id] = deps;
	    }
	    return depsMet;
	};

	HFSMVizWidget.prototype.updateDependencies = function() {
	    var self = this;
	    var nodePaths = Object.keys(self.dependencies.nodes);
	    var edgePaths = Object.keys(self.dependencies.edges);
	    // create any nodes whose depenencies are fulfilled now
	    nodePaths.map(function(nodePath) {
		var depPaths = self.dependencies.nodes[nodePath];
		if (depPaths && depPaths.length > 0) {
		    depPaths = depPaths.filter(function(objPath) { return self.nodes[objPath] == undefined; });
		    if (!depPaths.length) {
			var desc = self.waitingNodes[nodePath];
			self.waitingNodes[nodePath] = undefined;
			self.dependencies.nodes[nodePath] = undefined;
			self.createNode(desc);
		    }
		    else {
			self.dependencies.nodes[nodePath] = depPaths;
		    }
		}
		else {
		    self.dependencies.nodes[nodePath] = undefined;
		}
	    });
	    // Create any edges whose dependencies are fulfilled now
	    edgePaths.map(function(edgePath) {
		var depPaths = self.dependencies.edges[edgePath];
		if (depPaths && depPaths.length > 0) {
		    depPaths = depPaths.filter(function(objPath) { return self.nodes[objPath] == undefined; });
		    if (!depPaths.length) {
			var connDesc = self.waitingNodes[edgePath];
			self.waitingNodes[edgePath] = undefined;
			self.dependencies.edges[edgePath] = undefined;
			self.createEdge(connDesc);
		    }
		    else {
			self.dependencies.edges[edgePath] = depPaths;
		    }
		}
		else {
		    self.dependencies.edges[edgePath] = undefined;
		}
	    });
	};

        HFSMVizWidget.prototype.reLayout = function() {
            var self = this;
            self._cy.layout(self._layout_options);
        };

	HFSMVizWidget.prototype.createEdge = function(desc) {
	    var self = this;
	    var type = desc.type;
	    var from = self.nodes[desc.src];
	    var to   = self.nodes[desc.dst];
	    if (from && to) {
		self._cy.add({
		    group: 'edges',
		    data: {
			id: from.id + to.id,
			type: type,
			interaction: type,
			source: from.id,
			target: to.id,
			name: desc.name,
			label: desc.text
		    }
		});
		self.nodes[desc.id] = desc;
		self.updateDependencies();
	    }
	};

	HFSMVizWidget.prototype.createNode = function(desc) {
	    var self = this;
	    var node = {
		group: 'nodes',
		data: {
		    id: desc.id,
		    parent: desc.parentId,
		    type: desc.type,
		    NodeType: desc.type,
		    name: desc.name,
		    label: desc.name,
		    orgPos: null
		}
	    };
	    self._cy.add(node);
	    self.nodes[desc.id] = desc;
	    self.updateDependencies();
	};
	
	// Adding/Removing/Updating items
	HFSMVizWidget.prototype.addNode = function (desc) {
	    var self = this;
            if (desc) {
		var depsMet = self.checkDependencies(desc);
		// Add node to a table of nodes
		if (desc.isConnection) {  // if this is an edge
		    if (depsMet) { // ready to make edge
			self.createEdge(desc);
		    }
		    else { // missing some dependencies (either parentId or connection)
			self.waitingNodes[desc.id] = desc;
		    }
		}
		else {
		    if (depsMet) { // ready to make node
			self.createNode(desc);
		    }
		    else {
			self.waitingNodes[desc.id] = desc;
		    }
		}
	    }
	};

	HFSMVizWidget.prototype.removeNode = function (gmeId) {
            var desc = this.nodes[gmeId];
	    var idTag = gmeId.replace(/\//gm, "\\/");
	    this._cy.remove("#" + idTag);
	    // TODO: need to update the dependencies if this was a
	    // node so that all edges coming into or out of this node
	    // are added back to the dependencies list
            delete this.nodes[gmeId];
	};

	HFSMVizWidget.prototype.updateNode = function (desc) {
            if (desc) {
		this._logger.debug('Updating node:', desc);
            }
	};

	/* * * * * * * * Visualizer event handlers * * * * * * * */

	HFSMVizWidget.prototype.onNodeClick = function (/*id*/) {
            // This currently changes the active node to the given id and
            // this is overridden in the controller.
	};

	HFSMVizWidget.prototype.onBackgroundDblClick = function () {
	};

	/* * * * * * * * Visualizer life cycle callbacks * * * * * * * */
	HFSMVizWidget.prototype.destroy = function () {
	};

	HFSMVizWidget.prototype.onActivate = function () {
	};

	HFSMVizWidget.prototype.onDeactivate = function () {
	};

	return HFSMVizWidget;
    });
