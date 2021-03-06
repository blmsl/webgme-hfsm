/*globals define, _, WebGMEGlobal*/
/*jshint browser: true*/
/**
 * Generated by VisualizerGenerator 1.7.0 from webgme on Thu May 11 2017 10:42:38 GMT-0700 (PDT).
 */

define([
    'js/PanelBase/PanelBaseWithHeader',
    'js/PanelManager/IActivePanel',
    'widgets/HFSMViz/HFSMVizWidget',
    './HFSMVizControl'
], function (
    PanelBaseWithHeader,
    IActivePanel,
    HFSMVizWidget,
    HFSMVizControl
) {
    'use strict';

    var HFSMVizPanel;

    HFSMVizPanel = function (layoutManager, params) {
        var options = {};
        //set properties from options
        options[PanelBaseWithHeader.OPTIONS.LOGGER_INSTANCE_NAME] = 'HFSMVizPanel';
        options[PanelBaseWithHeader.OPTIONS.FLOATING_TITLE] = true;

        //call parent's constructor
        PanelBaseWithHeader.apply(this, [options, layoutManager]);

        this._client = params.client;

        //initialize UI
        this._initialize();

        this.logger.debug('ctor finished');
    };

    //inherit from PanelBaseWithHeader
    _.extend(HFSMVizPanel.prototype, PanelBaseWithHeader.prototype);
    _.extend(HFSMVizPanel.prototype, IActivePanel.prototype);

    HFSMVizPanel.prototype._initialize = function () {
        var self = this;

        //set Widget title
        this.setTitle('');

        this.widget = new HFSMVizWidget(this.logger, this.$el, this._client);

        this.widget.setTitle = function (title) {
            self.setTitle(title);
        };

        this.control = new HFSMVizControl({
            logger: this.logger,
            client: this._client,
            widget: this.widget
        });

        this.onActivate();
    };

    /* OVERRIDE FROM WIDGET-WITH-HEADER */
    /* METHOD CALLED WHEN THE WIDGET'S READ-ONLY PROPERTY CHANGES */
    HFSMVizPanel.prototype.onReadOnlyChanged = function (isReadOnly) {
        //apply parent's onReadOnlyChanged
        PanelBaseWithHeader.prototype.onReadOnlyChanged.call(this, isReadOnly);

    };

    HFSMVizPanel.prototype.onResize = function (width, height) {
        this.logger.debug('onResize --> width: ' + width + ', height: ' + height);
        this.widget.onWidgetContainerResize(width, height);
    };

    /* * * * * * * * Tells part browser what to show * * * * * * * */
    HFSMVizPanel.prototype.getValidTypesInfo = function( nodeId ) {
	var node = this._client.getNode( nodeId );
	if (node) {
	    var detailedTypes = {};
	    /*
	    detailedTypes = node.getValidChildrenTypesDetailed( );
	    Object.keys(detailedTypes).map(function(k) {
		detailedTypes[k] = true;
	    });
	    */
	    // is there a way to not have to hard-code this?
	    detailedTypes[ '/615025579/x' ] = true; // internal transition
	    detailedTypes['/615025579/1242097160'] = true; // initial state
	    detailedTypes['/615025579/A'] = true; // end state
	    detailedTypes['/615025579/R'] = true; // choice pseudostate
	    detailedTypes['/615025579/e'] = true; // deep history pseudostate
	    detailedTypes['/615025579/K'] = true; // shallow history pseudostate
	    detailedTypes['/615025579/1416392928'] = true; // state
	    return detailedTypes;
	}
	else {
	    return {};
	}
    };
    
    /* * * * * * * * Toolbar related Functions       * * * * * * * */

    HFSMVizPanel.prototype.getSplitPanelToolbarEl = function() {
        this._splitPanelToolbarEl = IActivePanel.prototype.getSplitPanelToolbarEl.call(this);
        // Set the size bigger than 40 x 40 and add some padding for the scroll-bar.
        this._splitPanelToolbarEl.css({
            'padding-right': '10px'
        });
        this.widget._addSplitPanelToolbarBtns(this._splitPanelToolbarEl);
        return this._splitPanelToolbarEl;
    };

    /* * * * * * * * Visualizer life cycle callbacks * * * * * * * */
    HFSMVizPanel.prototype.destroy = function () {
        this.control.destroy();
        this.widget.destroy();

        PanelBaseWithHeader.prototype.destroy.call(this);
        WebGMEGlobal.KeyboardManager.setListener(undefined);
    };

    HFSMVizPanel.prototype.onActivate = function () {
        this.widget.onActivate();
        this.control.onActivate();
        WebGMEGlobal.KeyboardManager.setListener(this.widget);
    };

    HFSMVizPanel.prototype.onDeactivate = function () {
        this.widget.onDeactivate();
        this.control.onDeactivate();
        WebGMEGlobal.KeyboardManager.setListener(undefined);
    };

    return HFSMVizPanel;
});
