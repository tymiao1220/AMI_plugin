import $ from 'jquery';
import _ from 'underscore';
import View from 'girder/views/View';
import events from '../events';
import CamerasOrthographic from '../external_plugins/ami/cameras/cameras.orthographic';
import ControlsOrthographic from '../external_plugins/ami/controls/controls.trackballortho';
import ControlsTrackball from '../external_plugins/ami/controls/controls.trackball';
import CoreUtils from '../external_plugins/ami/core/core.utils';

import HelpersBoundingBox from '../external_plugins/ami/helpers/helpers.boundingbox';
import HelpersContour from '../external_plugins/ami/helpers/helpers.contour';
import HelpersLocalizer from '../external_plugins/ami/helpers/helpers.localizer';
import HelpersStack from '../external_plugins/ami/helpers/helpers.stack';

import LoadersVolume from '../external_plugins/ami/loaders/loaders.volume';

import ShadersDataUniforms from '../external_plugins/ami/shaders/shaders.data.uniform';
import ShadersDataFragment from '../external_plugins/ami/shaders/shaders.data.fragment';
import ShadersDataVertex from '../external_plugins/ami/shaders/shaders.data.vertex';
// Layer
import ShadersLayerUniforms from '../external_plugins/ami/shaders/shaders.layer.uniform';
import ShadersLayerFragment from '../external_plugins/ami/shaders/shaders.layer.fragment';
import ShadersLayerVertex from '../external_plugins/ami/shaders/shaders.layer.vertex';

import HelpersLut from '../external_plugins/ami/helpers/helpers.lut';
import Stats from 'stats-js';
import dat from 'dat.gui';
import AmiTemplate from '../templates/amiTemplate.pug';
import '../stylesheets/3dami.styl';

var ami = View.extend({
	events:{
		'dblclick #r0': 'onDoubleClick',
		'dblclick #r1': 'onDoubleClick',
		'dblclick #r2': 'onDoubleClick',
		'dblclick #r3': 'onDoubleClick',
		'scroll #r1': 'onScroll',
		'scroll #r2': 'onScroll',
		'scroll #r3': 'onScroll'
	},
	initialize(setting){
		this.$el.html(AmiTemplate());
		this.labelStack={};
		this.commonSceneLayer0R1;
		this.commonSceneLayer0R2;
		this.commonSceneLayer0R3;
		this.parentView = setting.parentView;
		this.files = setting.files;
		this.stats = new Stats();
  		this.ready = false;
  		this.readyTo = false;
  		this.flagR1=false;
		this.flagR2=false;
		this.flagR3=false;

  		this.readyToRemove = false;
  		this.layerMix = {
			opacity1: 0.5,
		}

		this.params = {
			color: "#1861b3" 
		}
		this.allAnnoation = {};
		this.operateOverlay = null;

		this.stack;

		this.greenChanged;
		this.yellowChanged;
		this.redChanged;

		this.stackFolder1;
		this.stackFolder2;
		this.stackFolder3;
		this.stackFolder4;
		
		console.log($('#r1'))
		//3D rendering
		this.overlay = {};
		this.r0 = {
			domId: 'r0',
			domElement: null,
			renderer: null,
			color: 0x212121,
			targetID: 0,
			camera: null,
			controls: null,
			scene: null,
			light: null,
			sceneLayer0:null,
			sceneLayer1:null,
			sceneLayerMix:null,
			sceneLayer0TextureTarget:null,
			sceneLayer1TextureTarget:null,
			uniformsLayer1:null
		};
		// 2d axial renderer
		this.r1 = {
			domId: 'r1',
			renderer: null,
			targetID: 1,
			domElement: null,
			camera: null,
			controls: null,
			light: null,
			localizerHelper: null,
			localizerScene: null
		};

		// 2d sagittal renderer
		this.r2 = {
			domId: 'r2',
			domElement: null,
			targetID: 2,
			renderer: null,
			camera: null,
			controls: null,
			light: null,
			localizerHelper: null,
			localizerScene: null
		};


		// 2d coronal renderer
		this.r3 = {
			domId: 'r3',
			domElement: null,
			targetID: 3,
			renderer: null,
			camera: null,
			controls: null,
			light: null,
			localizerHelper: null,
			localizerScene: null
		};
	//	console.log(THREE);
		this.sceneClip = new THREE.Scene();
		this.clipPlane1 = new THREE.Plane(new THREE.Vector3(0, 0, 0), 0);
		this.clipPlane2 = new THREE.Plane(new THREE.Vector3(0, 0, 0), 0);
		this.clipPlane3 = new THREE.Plane(new THREE.Vector3(0, 0, 0), 0);

	//	this.initRenderer3D(this.r0);
		this.initRenderer2D(this.r1);
		this.initRenderer2D(this.r2);
		this.initRenderer2D(this.r3);
	//	this.render();
	//	cancelAnimationFrame(reqanimationreference)
	},
	animate:function(){
			this.onceAnimation=1;
			if (this.ready) {
			//	console.log(this.r1.sceneLayer0);
			// render
			//	this.r0.controls.update();
				this.r1.controls.update();
				this.r2.controls.update();
				this.r3.controls.update();

	      	//	this.r0.light.position.copy(this.r0.camera.position);

	      		if(!this.readyTo){
			//		this.r0.renderer.clear();
			//		this.r0.renderer.render(this.r0.sceneLayer0, this.r0.camera);
				}
				if(this.readyTo){
			//		for(let key in this.labelStack){
			//			this.labelStack[key][0].renderer.clear();
			//			this.labelStack[key][0].renderer.render(this.labelStack[key][0].sceneLayer0, this.labelStack[key][0].camera);
			//			this.labelStack[key][0].renderer.render(this.labelStack[key][0].sceneLayer1, this.labelStack[key][0].camera);
			
			//		}
				//	this.r0.renderer.clear();
					/*   //  console.log(r0.sceneLayer0);
					r0.renderer.render(r0.sceneLayer0.children[0], r0.camera, r0.sceneLayer0TextureTarget, true);
					r0.renderer.render(r0.sceneLayer0.children[1], r0.camera, r0.sceneLayer0TextureTarget, true);
					r0.renderer.render(r0.sceneLayer0.children[2], r0.camera, r0.sceneLayer0TextureTarget, true);
					r0.renderer.render(r0.sceneLayer1.children[0], r0.camera, r0.sceneLayer1TextureTarget, true);
					r0.renderer.render(r0.sceneLayer1.children[1], r0.camera, r0.sceneLayer1TextureTarget, true);
					r0.renderer.render(r0.sceneLayer1.children[2], r0.camera, r0.sceneLayer1TextureTarget, true);
					r0.renderer.render(r0.sceneLayerMix.children[2], r0.camera);
					*/
				}
				// r1
				if(!this.readyTo){
				//	console.log(this.r1.sceneLayer0);
				//	console.log(this.r1.camera);
					this.r1.renderer.clear();
					this.r1.renderer.render(this.r1.sceneLayer0, this.r1.camera);
				}
				if(this.readyTo){
					this.r1.renderer.clear();
					for(let key in this.labelStack){
					//	this.labelStack[key][1].renderer.clear();
						if(key==Object.keys(this.labelStack)[0]){
							this.labelStack[key][1].renderer.clear();
						//	console.log(this.commonSceneLayer0R1);
						//	console.log(this.labelStack[key][1].camera);
						//	console.log(this.labelStack[key][1].sceneLayer0TextureTarget);
							this.labelStack[key][1].renderer.render(this.commonSceneLayer0R1, this.labelStack[key][1].camera, this.labelStack[key][1].sceneLayer0TextureTarget, true);
						}

						// render second layer offscreen
						this.labelStack[key][1].renderer.render(this.labelStack[key][1].sceneLayer1, this.labelStack[key][1].camera, this.labelStack[key][1].sceneLayer1TextureTarget, true);
						// mix the layers and render it ON screen!
						this.labelStack[key][1].renderer.render(this.labelStack[key][1].sceneLayerMix, this.labelStack[key][1].camera);

						this.labelStack[key][1].materialLayer1.clippingPlanes = [this.clipPlane1];
						this.labelStack[key][1].materialLayerMix.clippingPlanes = [this.clipPlane1];
					}
				/*
					this.r1.renderer.clear();
					this.r1.renderer.render(this.r1.sceneLayer0, this.r1.camera, this.r1.sceneLayer0TextureTarget, true);
					// render second layer offscreen
					this.r1.renderer.render(this.r1.sceneLayer1, this.r1.camera, this.r1.sceneLayer1TextureTarget, true);
					// mix the layers and render it ON screen!
					this.r1.renderer.render(this.r1.sceneLayerMix, this.r1.camera);

					this.r1.materialLayer1.clippingPlanes = [this.clipPlane1];
					this.r1.materialLayerMix.clippingPlanes = [this.clipPlane1];
				*/
				}

				// localizer
				this.r1.renderer.clearDepth();
				this.r1.renderer.render(this.r1.localizerScene, this.r1.camera);
				

				// r2
				if(!this.readyTo){
					this.r2.renderer.clear();
					this.r2.renderer.render(this.r2.sceneLayer0, this.r2.camera);
				}
				if(this.readyTo){
					this.r2.renderer.clear();
				//	this.labelStack['http://fr-s-ivg-ssr-d1:8090/api/v1/file/5a9878f7e57f637f9e2a5a7b/download?contentDisposition=attachment&contentType=application%2Fnrrd'][2].renderer.render(this.labelStack['http://fr-s-ivg-ssr-d1:8090/api/v1/file/5a9878f7e57f637f9e2a5a7b/download?contentDisposition=attachment&contentType=application%2Fnrrd'][2].sceneLayer0, this.labelStack['http://fr-s-ivg-ssr-d1:8090/api/v1/file/5a9878f7e57f637f9e2a5a7b/download?contentDisposition=attachment&contentType=application%2Fnrrd'][2].camera, this.labelStack['http://fr-s-ivg-ssr-d1:8090/api/v1/file/5a9878f7e57f637f9e2a5a7b/download?contentDisposition=attachment&contentType=application%2Fnrrd'][2].sceneLayer0TextureTarget, true);
					for(let key in this.labelStack){
				//		this.labelStack[key][2].renderer.clear();
						
						if(key==Object.keys(this.labelStack)[0]){
							this.labelStack[key][2].renderer.clear();
							this.labelStack[key][2].renderer.render(this.commonSceneLayer0R2, this.labelStack[key][2].camera, this.labelStack[key][2].sceneLayer0TextureTarget, true);
						}
						// render second layer offscreen
						
						this.labelStack[key][2].renderer.render(this.labelStack[key][2].sceneLayer1, this.labelStack[key][2].camera, this.labelStack[key][2].sceneLayer1TextureTarget, true);
						// mix the layers and render it ON screen!
						this.labelStack[key][2].renderer.render(this.labelStack[key][2].sceneLayerMix, this.labelStack[key][2].camera);

						this.labelStack[key][2].materialLayer1.clippingPlanes = [this.clipPlane2];
						this.labelStack[key][2].materialLayerMix.clippingPlanes = [this.clipPlane2];
					}
				/*	
					this.r2.renderer.clear();
					this.r2.renderer.render(this.r2.sceneLayer0, this.r2.camera, this.r2.sceneLayer0TextureTarget, true);
					// render second layer offscreen
					this.r2.renderer.render(this.r2.sceneLayer1, this.r2.camera, this.r2.sceneLayer1TextureTarget, true);
					// mix the layers and render it ON screen!
					this.r2.renderer.render(this.r2.sceneLayerMix, this.r2.camera);

					this.r2.materialLayer1.clippingPlanes = [this.clipPlane2];
					this.r2.materialLayerMix.clippingPlanes = [this.clipPlane2];
				*/
				}

				// localizer
				this.r2.renderer.clearDepth();
				this.r2.renderer.render(this.r2.localizerScene, this.r2.camera);

				// r3
				if(!this.readyTo){
					this.r3.renderer.clear();
					this.r3.renderer.render(this.r3.sceneLayer0, this.r3.camera);
				}
				if(this.readyTo){
					this.r3.renderer.clear();
					for(let key in this.labelStack){
				//		this.labelStack[key][3].renderer.clear();
			
						if(key==Object.keys(this.labelStack)[0]){
					
							this.labelStack[key][3].renderer.clear();
							this.labelStack[key][3].renderer.render(this.commonSceneLayer0R3, this.labelStack[key][3].camera, this.labelStack[key][3].sceneLayer0TextureTarget, true);
					
						}
						// render second layer offscreen
						this.labelStack[key][3].renderer.render(this.labelStack[key][3].sceneLayer1, this.labelStack[key][3].camera, this.labelStack[key][3].sceneLayer1TextureTarget, true);
						// mix the layers and render it ON screen!
						this.labelStack[key][3].renderer.render(this.labelStack[key][3].sceneLayerMix, this.labelStack[key][3].camera);

						this.labelStack[key][3].materialLayer1.clippingPlanes = [this.clipPlane3];
						this.labelStack[key][3].materialLayerMix.clippingPlanes = [this.clipPlane3];
					}
				/*	
					this.r3.renderer.clear();
					this.r3.renderer.render(this.r3.sceneLayer0, this.r3.camera, this.r3.sceneLayer0TextureTarget, true);
					// render second layer offscreen
					this.r3.renderer.render(this.r3.sceneLayer1, this.r3.camera, this.r3.sceneLayer1TextureTarget, true);
					// mix the layers and render it ON screen!
					this.r3.renderer.render(this.r3.sceneLayerMix, this.r3.camera);

					this.r3.materialLayer1.clippingPlanes = [this.clipPlane3];
					this.r3.materialLayerMix.clippingPlanes = [this.clipPlane3];
				*/
				}
				// localizer
				this.r3.renderer.clearDepth();
				this.r3.renderer.render(this.r3.localizerScene, this.r3.camera);
	    	}

			this.stats.update();

			// request new frame
			requestAnimationFrame(_.bind(function() {
				this.animate();
			},this));
	},
	initRenderer3D: function(renderObj){
		renderObj.domElement = document.getElementById(renderObj.domId);

		renderObj.sceneLayer0TextureTarget = new THREE.WebGLRenderTarget(
			renderObj.domElement.clientWidth,
			renderObj.domElement.clientHeight,
			{minFilter: THREE.LinearFilter,
			magFilter: THREE.NearestFilter,
			format: THREE.RGBAFormat,
		});

		renderObj.sceneLayer1TextureTarget = new THREE.WebGLRenderTarget(
			renderObj.domElement.clientWidth,
			renderObj.domElement.clientHeight,
			{minFilter: THREE.LinearFilter,
			magFilter: THREE.NearestFilter,
			format: THREE.RGBAFormat,
		});
		renderObj.renderer = new THREE.WebGLRenderer({
		    antialias: true,
		});
		renderObj.renderer.setSize(
		renderObj.domElement.clientWidth, renderObj.domElement.clientHeight);

		renderObj.renderer.setClearColor(renderObj.color, 1);
		renderObj.renderer.domElement.id = renderObj.targetID;
		renderObj.domElement.appendChild(renderObj.renderer.domElement);

		// camera
		renderObj.camera = new THREE.PerspectiveCamera(
		45, renderObj.domElement.clientWidth / renderObj.domElement.clientHeight,
		0.1, 100000);

		renderObj.camera.position.x = 250;
		renderObj.camera.position.y = 250;
		renderObj.camera.position.z = 250;

		// controls
		renderObj.controls = new ControlsTrackball(
			renderObj.camera, renderObj.domElement);

		renderObj.controls.rotateSpeed = 5.5;
		renderObj.controls.zoomSpeed = 1.2;
		renderObj.controls.panSpeed = 0.8;
		renderObj.controls.staticMoving = true;
		renderObj.controls.dynamicDampingFactor = 0.3;

		// scene

		renderObj.sceneLayer0 = new THREE.Scene();
		renderObj.sceneLayer1 = new THREE.Scene();
		renderObj.sceneLayerMix = new THREE.Scene();

		// light
		renderObj.light = new THREE.DirectionalLight(0xffffff, 1);
		renderObj.light.position.copy(renderObj.camera.position);
		renderObj.sceneLayer0.add(renderObj.light);

		// stats
		renderObj.domElement.appendChild(this.stats.domElement);
	},
	initRenderer2D: function(rendererObj){
		// renderer
		rendererObj.domElement = document.getElementById(rendererObj.domId);
	//	console.log(rendererObj.domElement)
		rendererObj.renderer = new THREE.WebGLRenderer({
			antialias: true,
		});
		rendererObj.renderer.autoClear = false;
		rendererObj.renderer.localClippingEnabled = true;
		rendererObj.renderer.setSize(
			rendererObj.domElement.clientWidth, rendererObj.domElement.clientHeight);

		rendererObj.renderer.setClearColor(0x121212, 1);
		rendererObj.renderer.domElement.id = rendererObj.targetID;
		rendererObj.domElement.appendChild(rendererObj.renderer.domElement);

		// camera
		rendererObj.camera = new CamerasOrthographic(
			rendererObj.domElement.clientWidth / -2,
			rendererObj.domElement.clientWidth / 2,
			rendererObj.domElement.clientHeight / 2,
			rendererObj.domElement.clientHeight / -2,
			1, 1000);

		// controls
		rendererObj.controls = new ControlsOrthographic(
			rendererObj.camera, rendererObj.domElement);

		rendererObj.controls.staticMoving = true;
		rendererObj.controls.noRotate = true;
		rendererObj.camera.controls = rendererObj.controls;
		rendererObj.controls.addEventListener('OnScroll', _.bind(this.onScroll,this));
		// scene
	//	rendererObj.sceneLayer0 = new THREE.Scene();
	//	rendererObj.sceneLayer1 = new THREE.Scene();
	//	rendererObj.sceneLayerMix = new THREE.Scene();
	},
	render:function(e,urls){
		if(e){
			this.animate();
		}
		console.log(this.r1.sceneLayer0);
		// Release stackHelper Geometry and materials memory
		//if(this.r1.sceneLayer0!==undefined){this.ready = false;this.r1.sceneLayer0.children[0].dispose()}
		//if(this.r2.sceneLayer0!==undefined){this.ready = false;this.r2.sceneLayer0.children[0].dispose()}
		//if(this.r3.sceneLayer0!==undefined){this.ready = false;this.r3.sceneLayer0.children[0].dispose()}
		this.loader = new LoadersVolume();
		this.loader.load(urls)
		.then(_.bind(function() {
			let outerR1;
			let outerR2;
			let outerR3;
		//	console.log(urls);
			this.series = this.loader.data[0].mergeSeries(this.loader.data)[0];
			//console.log(this.series);
			this.loader.free();
			//console.log(this.r1);
			this.loader = null;
			// get first stack from series
			this.stack = this.series.stack[0];
			this.stack.prepare();
			//console.log(this.r1);
			// center 3d camera/control on the stack
			//this.centerLPS = this.stack.worldCenter();
			//this.r0.camera.lookAt(this.centerLPS.x, this.centerLPS.y, this.centerLPS.z);
			//this.r0.camera.updateProjectionMatrix();
			//this.r0.controls.target.set(this.centerLPS.x, this.centerLPS.y, this.centerLPS.z);
			//console.log(this.r1);
			// bouding box
			this.boxHelper = new HelpersBoundingBox(this.stack);
			//this.r0.sceneLayer0.add(this.boxHelper);
			// red slice
			outerR1=this.initHelpersStack(this.r1, this.stack);
			// yellow slice
			outerR2=this.initHelpersStack(this.r2, this.stack);
			// green slice
			outerR3=this.initHelpersStack(this.r3, this.stack);

			this.r1=_.extendOwn({}, this.r1, outerR1);
			this.r2=_.extendOwn({}, this.r2, outerR2);
			this.r3=_.extendOwn({}, this.r3, outerR3);
		//	console.log(this.r1);
			//this.r0.sceneLayer0.add(this.r1.sceneLayer0);
			//this.r0.sceneLayer0.add(this.r2.sceneLayer0);
			//this.r0.sceneLayer0.add(this.r3.sceneLayer0);

			// create new mesh with Localizer shaders
			this.plane1 = this.r1.stackHelper.slice.cartesianEquation();
			this.plane2 = this.r2.stackHelper.slice.cartesianEquation();
			this.plane3 = this.r3.stackHelper.slice.cartesianEquation();

			
			// localizer red slice
			this.initHelpersLocalizer(this.r1, this.stack, this.plane1, [
				{
					plane: this.plane2,
					color: new THREE.Color(this.r2.stackHelper.borderColor),
				},
				{
					plane: this.plane3,
					color: new THREE.Color(this.r3.stackHelper.borderColor),
				},
			]);

			// localizer yellow slice
			this.initHelpersLocalizer(this.r2, this.stack, this.plane2, [
				{
					plane: this.plane1,
					color: new THREE.Color(this.r1.stackHelper.borderColor),
				},
				{
					plane: this.plane3,
					color: new THREE.Color(this.r3.stackHelper.borderColor),
				},
			]);

			// localizer green slice
			this.initHelpersLocalizer(this.r3, this.stack, this.plane3, [
				{
					plane: this.plane1,
					color: new THREE.Color(this.r1.stackHelper.borderColor),
				},
				{
					plane: this.plane2,
					color: new THREE.Color(this.r2.stackHelper.borderColor),
				},
			]);
			
			this.gui = new dat.GUI({
				autoPlace: false,
			});

			$('#my-gui-container').empty();
			this.customContainer = document.getElementById('my-gui-container');
			
			this.customContainer.appendChild(this.gui.domElement);

			// Red
			this.stackFolder1 = this.gui.addFolder('Axial (Red)');

			this.stackFolder1.add(
				this.r1.stackHelper.slice,
				'windowWidth', 
				1, 
				this.stack.minMax[1] - this.stack.minMax[0]).step(1).listen();

			this.stackFolder1.add(
				this.r1.stackHelper.slice,
				'windowCenter', 
				1, 
				this.stack.minMax[1] - this.stack.minMax[0]).step(1).listen();

			this.stackFolder1.add(
				this.r1.stackHelper.slice,
				'upperThreshold', 
				1, 
				this.stack.minMax[1] - this.stack.minMax[0]).step(1).listen();
			
			this.stackFolder1.add(
				this.r1.stackHelper.slice,
				'lowerThreshold', 
				this.stack.minMax[0], 
				this.stack.minMax[1] - this.stack.minMax[0]).step(1).listen();


			this.stackFolder1.add(this.r1.stackHelper.slice, 'intensityAuto');
		
			this.redChanged = this.stackFolder1.add(
				this.r1.stackHelper,
				'index', 
				0, 
				this.r1.stackHelper.orientationMaxIndex).step(1).listen().onChange(_.bind(function() {
					this.onRedChanged();
				},this));

			// Yellow
			this.stackFolder2 = this.gui.addFolder('Sagittal (yellow)');

			this.stackFolder2.add(
				this.r2.stackHelper.slice,
				'windowWidth', 
				1, 
				this.stack.minMax[1] - this.stack.minMax[0]).step(1).listen();

			this.stackFolder2.add(
				this.r2.stackHelper.slice,
				'windowCenter', 
				1, 
				this.stack.minMax[1] - this.stack.minMax[0]).step(1).listen();

			this.stackFolder2.add(
				this.r2.stackHelper.slice,
				'upperThreshold', 
				1, 
				this.stack.minMax[1] - this.stack.minMax[0]).step(1).listen();
			
			this.stackFolder2.add(
				this.r2.stackHelper.slice,
				'lowerThreshold', 
				this.stack.minMax[0], 
				this.stack.minMax[1] - this.stack.minMax[0]).step(1).listen();

			this.stackFolder2.add(this.r2.stackHelper.slice, 'intensityAuto');

			this.yellowChanged = this.stackFolder2.add(
				this.r2.stackHelper,
				'index', 
				0, 
				this.r2.stackHelper.orientationMaxIndex).step(1).listen().onChange(_.bind(function() {
					this.onYellowChanged();
				},this));

			// Green
			this.stackFolder3 = this.gui.addFolder('Coronal (green)');


			this.stackFolder3.add(
				this.r3.stackHelper.slice,
				'windowWidth', 
				1, 
				this.stack.minMax[1] - this.stack.minMax[0]).step(1).listen();

			this.stackFolder3.add(
				this.r3.stackHelper.slice,
				'windowCenter', 
				1, 
				this.stack.minMax[1] - this.stack.minMax[0]).step(1).listen();

			this.stackFolder3.add(
				this.r3.stackHelper.slice,
				'upperThreshold', 
				1, 
				this.stack.minMax[1] - this.stack.minMax[0]).step(1).listen();
			
			this.stackFolder3.add(
				this.r3.stackHelper.slice,
				'lowerThreshold', 
				this.stack.minMax[0], 
				this.stack.minMax[1] - this.stack.minMax[0]).step(1).listen();

			this.stackFolder3.add(this.r3.stackHelper.slice, 'intensityAuto');

			this.greenChanged = this.stackFolder3.add(
				this.r3.stackHelper,
				'index', 
				0, 
				this.r3.stackHelper.orientationMaxIndex).step(1).listen().onChange(_.bind(function() {
					this.onGreenChanged();
				},this));

			this.stackFolder4 = this.gui.addFolder('Label Color');

			this.stackFolder4.add(
				this.layerMix, 'opacity1', 0, 1).step(0.01).onChange(_.bind(function(value) {
					this.r1.uniformsLayerMix.uOpacity1.value = value;
					this.r2.uniformsLayerMix.uOpacity1.value = value;
					this.r3.uniformsLayerMix.uOpacity1.value = value;
				},this));

    		this.stackFolder4.addColor(this.params,'color').onChange(_.bind(function(){
    			let colorObj = new THREE.Color( this.params.color );
				let lutLayer1 = new HelpersLut(
					'my-lut-canvases-l1',
					'default',
					'linear',
					[[0, 0, 0, 0], [1, colorObj.r, colorObj.g, colorObj.b]],
					[[0, 0], [1, 1]],
					false);
				this.r1.uniformsLayer1.uTextureLUT.value = lutLayer1.texture;
				this.r2.uniformsLayer1.uTextureLUT.value = lutLayer1.texture;
				this.r3.uniformsLayer1.uTextureLUT.value = lutLayer1.texture;
    		},this));

			$(window).on('resize', _.bind(this.onWindowResize,this));
			this.ready = true;
			this.trigger('g:imageRendered', this);

		},this)).catch(function(error) {
		//	this.trigger('g:imageRendered', this);
			window.console.log('oops... something went wrong...');
			window.console.log(error);
		});
		//this.drawAnnotation('http://fr-s-ivg-ssr-d1:8090/api/v1/file/5a81c723e57f633b647044d4/download?contentDisposition=attachment');
		return this;
	},
	initHelpersLocalizer:function(rendererObj, stack, referencePlane, localizers){
		rendererObj.localizerHelper = new HelpersLocalizer(
			stack, rendererObj.stackHelper.slice.geometry, referencePlane);

		for (let i = 0; i < localizers.length; i++) {
			rendererObj.localizerHelper['plane' + (i + 1)] = localizers[i].plane;
			rendererObj.localizerHelper['color' + (i + 1)] = localizers[i].color;
		}

		rendererObj.localizerHelper.canvasWidth =
			rendererObj.domElement.clientWidth;
		rendererObj.localizerHelper.canvasHeight =
			rendererObj.domElement.clientHeight;

		rendererObj.localizerScene = new THREE.Scene();
		rendererObj.localizerScene.add(rendererObj.localizerHelper);

	},
	initHelpersStack:function(rendererObj,stack, stack2=null, refStackHelper=null){
		if(rendererObj.domId=='r1'){
			var inner = {
				color: 0x121212,
				sliceOrientation: 'axial',
				sliceColor: 0xFF1744,
				stackHelper: refStackHelper,
				sceneLayer0:null,
				sceneLayer1:null,
				sceneLayerMix:null,
				sceneLayer0TextureTarget:null,
				sceneLayer1TextureTarget:null,
				meshLayer1:null,
				meshLayerMix:null,
				uniformsLayerMix:null,
				materialLayer1:null,
				uniformsLayer1:null
			}
		}
		if(rendererObj.domId=='r2'){
			var inner = {
				color: 0x121212,
				sliceOrientation: 'sagittal',
				sliceColor: 0xFFEA00,
				stackHelper: refStackHelper,
				sceneLayer0:null,
				sceneLayer1:null,
				sceneLayerMix:null,
				sceneLayer0TextureTarget:null,
				sceneLayer1TextureTarget:null,
				meshLayer1:null,
				meshLayerMix:null,
				uniformsLayerMix:null,
				materialLayer1:null,
				uniformsLayer1:null
			}
		}
		if(rendererObj.domId=='r3'){
			var inner = {
				color: 0x121212,
				sliceOrientation: 'coronal',
				sliceColor: 0x76FF03,
				stackHelper: refStackHelper,
				sceneLayer0:null,
				sceneLayer1:null,
				sceneLayerMix:null,
				sceneLayer0TextureTarget:null,
				sceneLayer1TextureTarget:null,
				meshLayer1:null,
				meshLayerMix:null,
				uniformsLayerMix:null,
				materialLayer1:null,
				uniformsLayer1:null
			}
		}

		//console.log('in initHelpersStack')
		// scene
		inner.sceneLayer0 = new THREE.Scene();
		inner.sceneLayer1 = new THREE.Scene();
		inner.sceneLayerMix = new THREE.Scene();

		if(stack2!=null){
			inner.sceneLayer0TextureTarget = new THREE.WebGLRenderTarget(
				rendererObj.domElement.clientWidth,
				rendererObj.domElement.clientHeight,
				{minFilter: THREE.LinearFilter,
				magFilter: THREE.NearestFilter,
				format: THREE.RGBAFormat,
			});

			inner.sceneLayer1TextureTarget = new THREE.WebGLRenderTarget(
				rendererObj.domElement.clientWidth,
				rendererObj.domElement.clientHeight,
				{minFilter: THREE.LinearFilter,
				magFilter: THREE.NearestFilter,
				format: THREE.RGBAFormat,
			});

    
			var textures2 = [];
			for (var m = 0; m < stack2._rawData.length; m++) {
				var tex = new THREE.DataTexture(
					stack2.rawData[m],
					stack2.textureSize,   //4096
					stack2.textureSize,
					stack2.textureType,   //1023
					THREE.UnsignedByteType,
					THREE.UVMapping,
					THREE.ClampToEdgeWrapping,
					THREE.ClampToEdgeWrapping,
					THREE.NearestFilter,
					THREE.NearestFilter
				);
				tex.needsUpdate = true;
				tex.flipY = true;
				textures2.push(tex);
			}
    		
    		let lutLayer1 = new HelpersLut(
				'my-lut-canvases-l1',
				'default',
				'linear',
				[[0, 0, 0, 0], [1, 0, 0, 1]],
				[[0, 0], [1, 1]],
				false);

			
			inner.uniformsLayer1 = ShadersDataUniforms.uniforms();
			inner.uniformsLayer1.uTextureSize.value = stack2.textureSize;
			inner.uniformsLayer1.uTextureContainer.value = textures2;
			inner.uniformsLayer1.uWorldToData.value = stack2.lps2IJK;
			inner.uniformsLayer1.uNumberOfChannels.value = stack2.numberOfChannels;
			inner.uniformsLayer1.uPixelType.value = stack2.pixelType;//3:50pm 01-08
			inner.uniformsLayer1.uBitsAllocated.value = stack2.bitsAllocated;
			inner.uniformsLayer1.uPackedPerPixel.value = stack2.packedPerPixel;//3:50pm 01-08
			inner.uniformsLayer1.uWindowCenterWidth.value =
			[stack2.windowCenter, stack2.windowWidth];
			inner.uniformsLayer1.uRescaleSlopeIntercept.value =
			[stack2.rescaleSlope, stack2.rescaleIntercept];
			inner.uniformsLayer1.uDataDimensions.value = [stack2.dimensionsIJK.x,
													stack2.dimensionsIJK.y,
													stack2.dimensionsIJK.z];
			inner.uniformsLayer1.uInterpolation.value = 0;//3:50pm 01-08

			inner.uniformsLayer1.uLut.value = 1;

      		inner.uniformsLayer1.uTextureLUT.value = lutLayer1.texture;

			// generate shaders on-demand!
			var fs = new ShadersDataFragment(inner.uniformsLayer1);
			var vs = new ShadersDataVertex();
			inner.materialLayer1 = new THREE.ShaderMaterial({
				side: THREE.DoubleSide,
				uniforms: inner.uniformsLayer1,
				vertexShader: vs.compute(),
				fragmentShader: fs.compute(),
				clippingPlanes: [],
			});
		}

		if(inner.stackHelper==null){
			inner.stackHelper = new HelpersStack(stack);
			inner.stackHelper.bbox.visible = false;
			inner.stackHelper.borderColor = inner.sliceColor;
			inner.stackHelper.slice.canvasWidth =
				rendererObj.domElement.clientWidth;
			inner.stackHelper.slice.canvasHeight =
				rendererObj.domElement.clientHeight;

			inner.stackHelper.slice.intensityAuto =
				false
			// set camera
			let worldbb = stack.worldBoundingBox();
			let lpsDims = new THREE.Vector3(
				(worldbb[1] - worldbb[0])/2,
				(worldbb[3] - worldbb[2])/2,
				(worldbb[5] - worldbb[4])/2
			);
			// box: {halfDimensions, center}
			let box = {
				center: stack.worldCenter().clone(),
				halfDimensions:
				new THREE.Vector3(lpsDims.x + 10, lpsDims.y + 10, lpsDims.z + 10),
			};
			// init and zoom
			let canvas = {
				width: rendererObj.domElement.clientWidth,
				height: rendererObj.domElement.clientHeight,
			};

			rendererObj.camera.directions =
				[stack.xCosine, stack.yCosine, stack.zCosine];
			rendererObj.camera.box = box;
			rendererObj.camera.canvas = canvas;
			rendererObj.camera.orientation = inner.sliceOrientation;
			rendererObj.camera.update();
			rendererObj.camera.fitBox(2, 1);

			inner.stackHelper.orientation = rendererObj.camera.stackOrientation;
			inner.stackHelper.index =
				Math.floor(inner.stackHelper.orientationMaxIndex/2);
		}
		if(inner.sceneLayer0.children.length==0){
			inner.sceneLayer0.add(inner.stackHelper);
		}else{
			inner.sceneLayer0.children=[];
			inner.sceneLayer0.add(inner.stackHelper);
		}

		if(stack2!=null){


			inner.meshLayer1 = new THREE.Mesh(inner.stackHelper.slice.geometry, inner.materialLayer1);
			// go the LPS space
			inner.meshLayer1.applyMatrix(stack2._ijk2LPS);
		//	if(inner.sceneLayer1.children.length==0){
				inner.sceneLayer1.add(inner.meshLayer1);
		//	}else{
		//		inner.sceneLayer1.children=[];
		//		inner.sceneLayer1.add(inner.meshLayer1);
		//	}

			inner.uniformsLayerMix = ShadersLayerUniforms.uniforms();
			inner.uniformsLayerMix.uOpacity1.value = 0.5;
			inner.uniformsLayerMix.uTextureBackTest0.value = inner.sceneLayer0TextureTarget.texture;
			inner.uniformsLayerMix.uTextureBackTest1.value = inner.sceneLayer1TextureTarget.texture;

			let fls = new ShadersLayerFragment(inner.uniformsLayerMix);
			let vls = new ShadersLayerVertex();

			inner.materialLayerMix = new THREE.ShaderMaterial({
				side: THREE.DoubleSide,
				uniforms: inner.uniformsLayerMix,
				vertexShader: vls.compute(),
				fragmentShader: fls.compute(),
				transparent: true,
				clippingPlanes: [],
			});

			// add mesh in this scene with right shaders...
			inner.meshLayerMix = new THREE.Mesh(inner.stackHelper.slice.geometry, inner.materialLayerMix);
			// go the LPS space
			inner.meshLayerMix.applyMatrix(stack2._ijk2LPS);
		//	if(inner.sceneLayerMix.children.length==0){
				inner.sceneLayerMix.add(inner.meshLayerMix);
		//	}else{
		//		inner.sceneLayerMix.children=[];
		//		inner.sceneLayerMix.add(inner.meshLayerMix);
		//	}
		}

		return inner;
	},

	/**
	* Update Layer Mix
	*/

	updateLocalizer:function(refObj, targetLocalizersHelpers) {
		this.refHelper = refObj.stackHelper;
		this.localizerHelper = refObj.localizerHelper;
		this.plane = this.refHelper.slice.cartesianEquation();
		this.localizerHelper.referencePlane = this.plane;

		// bit of a hack... works fine for this application
		for (let i = 0; i < targetLocalizersHelpers.length; i++) {
			for (let j = 0; j < 3; j++) {
			this.targetPlane = targetLocalizersHelpers[i]['plane' + (j + 1)];
			if (this.targetPlane &&
				this.plane.x.toFixed(6) === this.targetPlane.x.toFixed(6) &&
				this.plane.y.toFixed(6) === this.targetPlane.y.toFixed(6) &&
				this.plane.z.toFixed(6) === this.targetPlane.z.toFixed(6)) {
					targetLocalizersHelpers[i]['plane' + (j + 1)] = this.plane;
				}
			}
		}
		// update the geometry will create a new mesh
		this.localizerHelper.geometry = this.refHelper.slice.geometry;
	},
	updateClipPlane: function(refObj, clipPlane) {
		this.stackHelper = refObj.stackHelper;
		this.camera = refObj.camera;
		this.vertices = this.stackHelper.slice.geometry.vertices;
		this.p1 = new THREE.Vector3(this.vertices[0].x, this.vertices[0].y, this.vertices[0].z)
		.applyMatrix4(this.stackHelper._stack.ijk2LPS);
		this.p2 = new THREE.Vector3(this.vertices[1].x, this.vertices[1].y, this.vertices[1].z)
		.applyMatrix4(this.stackHelper._stack.ijk2LPS);
		this.p3 = new THREE.Vector3(this.vertices[2].x, this.vertices[2].y, this.vertices[2].z)
		.applyMatrix4(this.stackHelper._stack.ijk2LPS);

		clipPlane.setFromCoplanarPoints(this.p1, this.p2, this.p3);

		this.cameraDirection = new THREE.Vector3(1, 1, 1);
		this.cameraDirection.applyQuaternion(this.camera.quaternion);

		if (this.cameraDirection.dot(clipPlane.normal) > 0) {
			clipPlane.negate();
		}
	},

	updateLayer1Green:function() {
	// update layer1 geometry...
	//	console.log(this.labelStack)
		for(let key in this.labelStack){
			if (this.labelStack[key][3].meshLayer1) {
	//			console.log(this.labelStack[key][3].stackHelper)
				// dispose geometry first
				this.labelStack[key][3].meshLayer1.geometry.dispose();
				this.labelStack[key][3].meshLayer1.geometry = this.labelStack[key][3].stackHelper.slice.geometry;
				this.labelStack[key][3].meshLayer1.geometry.verticesNeedUpdate = true;
			}
		}
		/*
		if (this.r3.meshLayer1) {
			// dispose geometry first
			this.r3.meshLayer1.geometry.dispose();
			this.r3.meshLayer1.geometry = this.r3.stackHelper.slice.geometry;
			this.r3.meshLayer1.geometry.verticesNeedUpdate = true;
		}
		*/

	},
	updateLayer1Yellow:function() {
	// update layer1 geometry...
		for(let key in this.labelStack){

			if (this.labelStack[key][2].meshLayer1) {
				// dispose geometry first
				this.labelStack[key][2].meshLayer1.geometry.dispose();
				this.labelStack[key][2].meshLayer1.geometry = this.labelStack[key][2].stackHelper.slice.geometry;
				this.labelStack[key][2].meshLayer1.geometry.verticesNeedUpdate = true;
			}
		}
		/*
		if (this.r2.meshLayer1) {
			// dispose geometry first
			this.r2.meshLayer1.geometry.dispose();
			this.r2.meshLayer1.geometry = this.r2.stackHelper.slice.geometry;
			this.r2.meshLayer1.geometry.verticesNeedUpdate = true;
		}
		*/
	},
	updateLayer1Red:function() {
	// update layer1 geometry...
		for(let key in this.labelStack){

			if (this.labelStack[key][1].meshLayer1) {
				// dispose geometry first
				this.labelStack[key][1].meshLayer1.geometry.dispose();
				this.labelStack[key][1].meshLayer1.geometry = this.labelStack[key][1].stackHelper.slice.geometry;
				this.labelStack[key][1].meshLayer1.geometry.verticesNeedUpdate = true;
			}
		}
		/*
		if (this.r1.meshLayer1) {
			// dispose geometry first

			this.r1.meshLayer1.geometry.dispose();
			this.r1.meshLayer1.geometry = this.r1.stackHelper.slice.geometry;
			this.r1.meshLayer1.geometry.verticesNeedUpdate = true;
		}
		*/
	},
	/**
	* Update layer mix
	*/
	updateLayerMixGreen:function() {
	// update layer1 geometry...

		for(let key in this.labelStack){
			if (this.labelStack[key][3].meshLayerMix) {
				this.labelStack[key][3].sceneLayerMix.remove(this.labelStack[key][3].meshLayerMix);
				this.labelStack[key][3].meshLayerMix.material.dispose();
				//meshLayerMix.material = null;//3:50pm 01-08
				this.labelStack[key][3].meshLayerMix.geometry.dispose();
				//meshLayerMix.geometry = null;//3:50pm 01-08

				// add mesh in this scene with right shaders...
				this.labelStack[key][3].meshLayerMix = 
				new THREE.Mesh(this.labelStack[key][3].stackHelper.slice.geometry, this.labelStack[key][3].materialLayerMix);
				// go the LPS space
				this.labelStack[key][3].meshLayerMix.applyMatrix(this.labelStack[key][3].stackHelper.stack._ijk2LPS);

				this.labelStack[key][3].sceneLayerMix.add(this.labelStack[key][3].meshLayerMix);
			}
		}
		/*
		if (this.r3.meshLayerMix) {
			this.r3.sceneLayerMix.remove(this.r3.meshLayerMix);
			this.r3.meshLayerMix.material.dispose();
			//meshLayerMix.material = null;//3:50pm 01-08
			this.r3.meshLayerMix.geometry.dispose();
			//meshLayerMix.geometry = null;//3:50pm 01-08

			// add mesh in this scene with right shaders...
			this.r3.meshLayerMix = 
			new THREE.Mesh(this.r3.stackHelper.slice.geometry, this.r3.materialLayerMix);
			// go the LPS space
			this.r3.meshLayerMix.applyMatrix(this.r3.stackHelper.stack._ijk2LPS);

			this.r3.sceneLayerMix.add(this.r3.meshLayerMix);
		}
		*/
	},

	updateLayerMixYellow:function() {
	// update layer1 geometry...
		for(let key in this.labelStack){
			if (this.labelStack[key][2].meshLayerMix) {
				this.labelStack[key][2].sceneLayerMix.remove(this.labelStack[key][2].meshLayerMix);
				this.labelStack[key][2].meshLayerMix.material.dispose();
				//meshLayerMix.material = null;//3:50pm 01-08
				this.labelStack[key][2].meshLayerMix.geometry.dispose();
				//meshLayerMix.geometry = null;//3:50pm 01-08

				// add mesh in this scene with right shaders...
				this.labelStack[key][2].meshLayerMix = 
				new THREE.Mesh(this.labelStack[key][2].stackHelper.slice.geometry, this.labelStack[key][2].materialLayerMix);
				// go the LPS space
				this.labelStack[key][2].meshLayerMix.applyMatrix(this.labelStack[key][2].stackHelper.stack._ijk2LPS);

				this.labelStack[key][2].sceneLayerMix.add(this.labelStack[key][2].meshLayerMix);
			}
		}
		/*
		if (this.r2.meshLayerMix) {
			this.r2.sceneLayerMix.remove(this.r2.meshLayerMix);
			this.r2.meshLayerMix.material.dispose();
			//meshLayerMix.material = null;//3:50pm 01-08
			this.r2.meshLayerMix.geometry.dispose();
			//meshLayerMix.geometry = null;//3:50pm 01-08

			// add mesh in this scene with right shaders...
			this.r2.meshLayerMix = 
			new THREE.Mesh(this.r2.stackHelper.slice.geometry, this.r2.materialLayerMix);
			// go the LPS space
			this.r2.meshLayerMix.applyMatrix(this.r2.stackHelper.stack._ijk2LPS);

			this.r2.sceneLayerMix.add(this.r2.meshLayerMix);
		}
		*/
	},
	updateLayerMixRed:function() {
	// update layer1 geometry...
		for(let key in this.labelStack){
			if (this.labelStack[key][1].meshLayerMix) {
				this.labelStack[key][1].sceneLayerMix.remove(this.labelStack[key][1].meshLayerMix);
				this.labelStack[key][1].meshLayerMix.material.dispose();
				//meshLayerMix.material = null;//3:50pm 01-08
				this.labelStack[key][1].meshLayerMix.geometry.dispose();
				//meshLayerMix.geometry = null;//3:50pm 01-08

				// add mesh in this scene with right shaders...
				this.labelStack[key][1].meshLayerMix = 
				new THREE.Mesh(this.labelStack[key][1].stackHelper.slice.geometry, this.labelStack[key][1].materialLayerMix);
				// go the LPS space
				this.labelStack[key][1].meshLayerMix.applyMatrix(this.labelStack[key][1].stackHelper.stack._ijk2LPS);

				this.labelStack[key][1].sceneLayerMix.add(this.labelStack[key][1].meshLayerMix);
			}
		}
		/*
		if (this.r1.meshLayerMix) {
			this.r1.sceneLayerMix.remove(this.r1.meshLayerMix);
			this.r1.meshLayerMix.material.dispose();
			//meshLayerMix.material = null;//3:50pm 01-08
			this.r1.meshLayerMix.geometry.dispose();
			//meshLayerMix.geometry = null;//3:50pm 01-08

			// add mesh in this scene with right shaders...
			this.r1.meshLayerMix = 
			new THREE.Mesh(this.r1.stackHelper.slice.geometry, this.r1.materialLayerMix);
			// go the LPS space
			this.r1.meshLayerMix.applyMatrix(this.r1.stackHelper.stack._ijk2LPS);

			this.r1.sceneLayerMix.add(this.r1.meshLayerMix);
		}
		*/
	},



	onYellowChanged: function() {
		
		this.updateLocalizer(this.r2, [this.r1.localizerHelper, this.r3.localizerHelper]);
		this.updateClipPlane(this.r2, this.clipPlane2);
		if(this.readyTo){
			this.updateLayer1Yellow();
			this.updateLayerMixYellow();
		}
	},
	onRedChanged: function() {
		this.updateLocalizer(this.r1, [this.r2.localizerHelper, this.r3.localizerHelper]);
		this.updateClipPlane(this.r1, this.clipPlane1);

		if(this.readyTo){
			this.updateLayer1Red();
			this.updateLayerMixRed();
		}
	},
	onGreenChanged: function() {
		this.updateLocalizer(this.r3, [this.r1.localizerHelper, this.r2.localizerHelper]);
		this.updateClipPlane(this.r3, this.clipPlane3);
		if(this.readyTo){
			this.updateLayer1Green();
			this.updateLayerMixGreen();
		}
	},
	windowResize2D: function(rendererObj) {

		rendererObj.camera.canvas = {
			width: rendererObj.domElement.clientWidth,
			height: rendererObj.domElement.clientHeight,
		};
		rendererObj.camera.fitBox(2, 1);
		rendererObj.renderer.setSize(
		rendererObj.domElement.clientWidth,
		rendererObj.domElement.clientHeight);

		// update info to draw borders properly
		rendererObj.stackHelper.slice.canvasWidth =
			rendererObj.domElement.clientWidth;
		rendererObj.stackHelper.slice.canvasHeight =
			rendererObj.domElement.clientHeight;
		rendererObj.localizerHelper.canvasWidth =
			rendererObj.domElement.clientWidth;
		rendererObj.localizerHelper.canvasHeight =
			rendererObj.domElement.clientHeight;
	},
	onWindowResize: function() {
		// update 3D
		//this.r0.camera.aspect = this.r0.domElement.clientWidth / this.r0.domElement.clientHeight;
		//this.r0.camera.updateProjectionMatrix();
		//this.r0.renderer.setSize(
		//	this.r0.domElement.clientWidth, this.r0.domElement.clientHeight);

		// update 2d
		this.windowResize2D(this.r1);
		this.windowResize2D(this.r2);
		this.windowResize2D(this.r3);
	},
	onScroll: function(event) {
		console.log(event);
		const id = event.target.domElement.id;
		let stackHelper = null;
		switch (id) {
			case 'r1':
			stackHelper = this.r1.stackHelper;
			break;

			case 'r2':
			stackHelper = this.r2.stackHelper;
			break;

			case 'r3':
			stackHelper = this.r3.stackHelper;
			break;
		}

		if (event.delta > 0) {
			if (stackHelper.index >= stackHelper.orientationMaxIndex - 1) {
				return false;
			}
			stackHelper.index += 1;
		} else {
			if (stackHelper.index <= 0) {
				return false;
			}
			stackHelper.index -= 1;
		}

		this.onGreenChanged();
		this.onRedChanged();
		this.onYellowChanged();
	},
	onDoubleClick: function(event) {
		let canvas = event.target.parentElement;
		let id = event.target.id;
		let mouse = {
			x: ((event.clientX - canvas.offsetLeft) / canvas.clientWidth) * 2 - 1,
			y: - ((event.clientY - canvas.offsetTop) / canvas.clientHeight) * 2 + 1,
		};

		console.log(mouse)
		//
		let camera = null;
		let stackHelper = null;
		let sceneLayer0 = null;
		switch (id) {
			case '0':
			camera = this.r0.camera;
			stackHelper = this.r1.stackHelper;
			sceneLayer0 = this.r0.sceneLayer0;
			break;

			case '1':
			camera = this.r1.camera;
			stackHelper = this.r1.stackHelper;
			sceneLayer0 = this.r1.sceneLayer0;
			break;

			case '2':
			camera = this.r2.camera;
			stackHelper = this.r2.stackHelper;
			sceneLayer0 = this.r2.sceneLayer0;
			break;

			case '3':
			camera = this.r3.camera;
			stackHelper = this.r3.stackHelper;
			sceneLayer0 = this.r3.sceneLayer0;
			break;
		}
		const raycaster = new THREE.Raycaster();
		raycaster.setFromCamera(mouse, camera);

		const intersects = raycaster.intersectObjects(sceneLayer0.children, true);

		if (intersects.length > 0) {
			let ijk =
				CoreUtils.worldToData(stackHelper.stack.lps2IJK, intersects[0].point);

			this.r1.stackHelper.index =
				ijk.getComponent((this.r1.stackHelper.orientation + 2) % 3);
			this.r2.stackHelper.index =
				ijk.getComponent((this.r2.stackHelper.orientation + 2) % 3);
			this.r3.stackHelper.index =
				ijk.getComponent((this.r3.stackHelper.orientation + 2) % 3);

			_.each(this.parentView.controlPanel.models(), (model) => {
            	console.log(model);
            	if (model.get('type') === 'number-vector') {
                    model.set('value', ijk, {trigger: true});
                }
            });
			console.log(ijk)

			this.onGreenChanged();
			this.onRedChanged();
			this.onYellowChanged();
		}
	},

	drawAnnotation:function(annotationUrl,fromMatch=false){
		//  console.log(this.allAnnoation[annotationUrl]);
		if(this.labelStack[annotationUrl]){
		//	console.log("duplicated");
		}
		else{
			let label={};
			let outerR1;
			let outerR2;
			let outerR3;
			let loader = new LoadersVolume();
			loader.load(annotationUrl)
			.then(_.bind(function() {
				// Release stackHelper Geometry and materials memory
			//	console.log(annotationUrl);
			/*	if(this.r1.sceneLayer1!==undefined){
					if(this.r1.sceneLayer1.children.length){
						this.readyTo = false;this.r1.sceneLayer1.children[0].dispose()
					}
				}
				if(this.r2.sceneLayer1!==undefined){
					if(this.r2.sceneLayer1.children.length){
						this.readyTo = false;this.r2.sceneLayer1.children[0].dispose()
					}
				}
				if(this.r3.sceneLayer1!==undefined){
					if(this.r3.sceneLayer1.children.length){
						this.readyTo = false;this.r3.sceneLayer1.children[0].dispose()
					}
				}
				if(this.r1.sceneLayerMix!==undefined){
					if(this.r1.sceneLayerMix.children.length){
						this.readyTo = false;this.r1.sceneLayerMix.children[0].dispose()
					}
				}
				if(this.r2.sceneLayerMix!==undefined){
					if(this.r2.sceneLayerMix.children.length){
						this.readyTo = false;this.r2.sceneLayerMix.children[0].dispose()
					}
				}
				if(this.r3.sceneLayerMix!==undefined){
					if(this.r3.sceneLayerMix.children.length){
						this.readyTo = false;this.r3.sceneLayerMix.children[0].dispose()
					}
				}
				*/
				let labelSeries = loader.data[0].mergeSeries(loader.data)[0];
				loader.free();
				loader = null;
				// get first stack from series
				let stack2 = labelSeries.stack[0];

				stack2.prepare();
				// pixels packing for the fragment shaders now happens there
				stack2.pack();
				outerR1=this.initHelpersStack(this.r1, this.stack, stack2, this.r1.stackHelper);
				outerR2=this.initHelpersStack(this.r2, this.stack, stack2, this.r2.stackHelper);
				outerR3=this.initHelpersStack(this.r3, this.stack, stack2, this.r3.stackHelper);

				this.r1=_.extendOwn({}, this.r1, outerR1);
				this.r2=_.extendOwn({}, this.r2, outerR2);
				this.r3=_.extendOwn({}, this.r3, outerR3);

			//	this.r0.sceneLayer1.add(this.r1.sceneLayer1);
			//	this.r0.sceneLayerMix.add(this.r1.sceneLayerMix);
			//	this.r0.sceneLayer1.add(this.r2.sceneLayer1);
			//	this.r0.sceneLayerMix.add(this.r2.sceneLayerMix);
			//	this.r0.sceneLayer1.add(this.r3.sceneLayer1);
			//	this.r0.sceneLayerMix.add(this.r3.sceneLayerMix);


			//	label[0]=this.r0;
				label[1]=this.r1;
				label[2]=this.r2;
				label[3]=this.r3;

				this.commonSceneLayer0R1=label[1].sceneLayer0;
				this.commonSceneLayer0R2=label[2].sceneLayer0;
				this.commonSceneLayer0R3=label[3].sceneLayer0;

				this.labelStack[annotationUrl] = label;

				this.readyTo = true;
				if(fromMatch){
					this.labelStack={};
					this.labelStack[annotationUrl] = label;
					console.log(this.labelStack)
				}
				this.onGreenChanged();
				this.onRedChanged();
				this.onYellowChanged();

				if(this.redChanged){
					this.stackFolder1.remove(this.redChanged);
				}

				this.redChanged = this.stackFolder1.add(
					this.r1.stackHelper,
					'index', 0, this.r1.stackHelper.orientationMaxIndex).step(1).listen().onChange(_.bind(function() {
						this.onRedChanged();
					},this));

				if(this.yellowChanged){
					this.stackFolder2.remove(this.yellowChanged);
				}
				this.yellowChanged = this.stackFolder2.add(
					this.r2.stackHelper,
					'index', 0, this.r2.stackHelper.orientationMaxIndex).step(1).listen().onChange(_.bind(function() {
					this.onYellowChanged();
					},this));

				if(this.greenChanged){
					this.stackFolder3.remove(this.greenChanged);
				}
				this.greenChanged = this.stackFolder3.add(
					this.r3.stackHelper,
					'index', 0, this.r3.stackHelper.orientationMaxIndex).step(1).listen().onChange(_.bind(function() {
					this.onGreenChanged();
					},this));

			},this)).catch(function(error) {
				window.console.log('oops... something went wrong...');
				window.console.log(error);
			});
	    }
	},
	removeAnnotation:function(annotationUrl){
		if(this.labelStack[annotationUrl]){

			this.operateOverlay = this.labelStack[annotationUrl];
		//	this.operateOverlay[0].sceneLayer0.remove(this.operateOverlay[0].sceneLayer0);
			this.operateOverlay[1].sceneLayer0.remove(this.operateOverlay[1].sceneLayer0);
			this.operateOverlay[2].sceneLayer0.remove(this.operateOverlay[2].sceneLayer0);
			this.operateOverlay[3].sceneLayer0.remove(this.operateOverlay[3].sceneLayer0);

		//	this.operateOverlay[0].sceneLayer1.remove(this.operateOverlay[0].sceneLayer1);
			this.operateOverlay[1].sceneLayer1.remove(this.operateOverlay[1].sceneLayer1);
			this.operateOverlay[2].sceneLayer1.remove(this.operateOverlay[2].sceneLayer1);
			this.operateOverlay[3].sceneLayer1.remove(this.operateOverlay[3].sceneLayer1);

			delete this.labelStack[annotationUrl];
			if(Object.keys(this.labelStack).length==0){
				this.readyTo = false;
			}
			console.log(this.labelStack);

		//	this.readyTo = false;
		//	this.readyToRemove = true;
		}
		else{
			//	console.log("duplicated");
		}
	}
});

export default ami;