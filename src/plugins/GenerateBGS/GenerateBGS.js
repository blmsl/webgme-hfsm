/*globals define*/
/*jshint node:true, browser:true*/

/**
 * Generated by PluginGenerator 1.7.0 from webgme on Fri Sep 09 2016 09:21:15 GMT-0500 (Central Daylight Time).
 * A plugin that inherits from the PluginBase. To see source code documentation about available
 * properties and methods visit %host%/docs/source/PluginBase.html.
 */

define([
    'plugin/PluginConfig',
    'text!./metadata.json',
    'plugin/PluginBase',
    'common/util/ejs', // for ejs templates
    'plugin/GenerateBGS/GenerateBGS/Templates/Templates',
    'hfsm/modelLoader',
    'q'
], function (
    PluginConfig,
    pluginMetadata,
    PluginBase,
    ejs,
    TEMPLATES,
    loader,
    Q) {
    'use strict';

    pluginMetadata = JSON.parse(pluginMetadata);

    /**
     * Initializes a new instance of GenerateBGS.
     * @class
     * @augments {PluginBase}
     * @classdesc This class represents the plugin GenerateBGS.
     * @constructor
     */
    var GenerateBGS = function () {
        // Call base class' constructor.
        PluginBase.call(this);
        this.pluginMetadata = pluginMetadata;
        this.FILES = {
            'script.bgs': 'script.bgs.ejs'
        };
    };

    /**
     * Metadata associated with the plugin. Contains id, name, version, description, icon, configStructue etc.
     * This is also available at the instance at this.pluginMetadata.
     * @type {object}
     */
    GenerateBGS.metadata = pluginMetadata;

    // Prototypical inheritance from PluginBase.
    GenerateBGS.prototype = Object.create(PluginBase.prototype);
    GenerateBGS.prototype.constructor = GenerateBGS;

    GenerateBGS.prototype.notify = function(level, msg) {
	var self = this;
	var prefix = self.projectId + '::' + self.projectName + '::' + level + '::';
	var max_msg_len = 100;
	if (level=='error')
	    self.logger.error(msg);
	else if (level=='debug')
	    self.logger.debug(msg);
	else if (level=='info')
	    self.logger.info(msg);
	else if (level=='warning')
	    self.logger.warn(msg);
	self.createMessage(self.activeNode, msg, level);
	self.sendNotification(prefix+msg);
    };

    /**
     * Main function for the plugin to execute. This will perform the execution.
     * Notes:
     * - Always log with the provided logger.[error,warning,info,debug].
     * - Do NOT put any user interaction logic UI, etc. inside this method.
     * - callback always has to be called even if error happened.
     *
     * @param {function(string, plugin.PluginResult)} callback - the result callback
     */
    GenerateBGS.prototype.main = function (callback) {
        // Use self to access core, project, result, logger etc from PluginBase.
        // These are all instantiated at this point.
        var self = this,
            nodeObject;

        // Default fails
        self.result.success = false;

	// the active node for this plugin is software -> project
	var projectNode = self.activeNode;
	self.projectName = self.core.getAttribute(projectNode, 'name');

	self.projectModel = {}; // will be filled out by loadProjectModel (and associated functions)
	self.artifacts = {}; // will be filled out and used by various parts of this plugin

	loader.logger = self.logger;

      	loader.loadModel(self.core, projectNode, false)
  	    .then(function (projectModel) {
		self.projectModel = projectModel.root;
		self.projectObjects = projectModel.objects;
        	return self.generateArtifacts();
  	    })
	    .then(function () {
        	self.result.setSuccess(true);
        	callback(null, self.result);
	    })
	    .catch(function (err) {
		self.notify('error', err);
        	self.result.setSuccess(false);
        	callback(err, self.result);
	    })
		.done();
    };

    GenerateBGS.prototype.generateStateFunctions = function () {
	/*
	  need to:
	    * get all guards on all transitions out of this state and its sub states
	    * store the timer periodicity for this state and its sub states

	  Looks like: 
	  
	    changeState = 0
	    if (state = "state 1")
	      if ( guard1 )
	        state = "next state"
		changeState = 1
	      end if
	      if ( guard2 )
	        state = "next state"
		changeState = 1
	      end if
	      if ( !changeState )
	        stateFunc()
		// sub states here
	      end if
	    end if 
	    if (state = "staet 2")
	    end if 
	 */
    };

    GenerateBGS.prototype.generateArtifacts = function () {
	var self = this;

	self.artifacts[self.projectModel.name + '.json'] = JSON.stringify(self.projectModel, null, 2);
        self.artifacts[self.projectModel.name + '_metadata.json'] = JSON.stringify({
    	    projectID: self.project.projectId,
            commitHash: self.commitHash,
            branchName: self.branchName,
            timeStamp: (new Date()).toISOString(),
            pluginVersion: self.getVersion()
        }, null, 2);

	var scriptTemplate = TEMPLATES[self.FILES['script.bgs']];
	self.artifacts['script.bgs'] = ejs.render(scriptTemplate, {
	    'model': self.projectModel,
	});

	self.artifacts['constants.bgs'] = self.projectModel.constants;
	self.artifacts['globals.bgs'] = self.projectModel.globals;

	if (self.projectModel.Library_list) {
	    self.projectModel.Library_list.map(function(library) {
		var libFileName = library.name + '.bgs';
		self.artifacts[libFileName] = library.code;
		if (library.Event_list) {
		    library.Event_list.map(function(event) {
			self.artifacts[libFileName] += event.function;
		    });
		}
	    });
	}

	var fileNames = Object.keys(self.artifacts);
	var tasks = fileNames.map(function(fileName) {
	    return self.blobClient.putFile(fileName, self.artifacts[fileName])
		.then(function(hash) {
		    self.result.addArtifact(hash);
		});
	});

	return Q.all(tasks)
	    .then(function() {
		var msg = 'Generated artifacts.';
		self.notify('info', msg);
	    });
    };

    return GenerateBGS;
});