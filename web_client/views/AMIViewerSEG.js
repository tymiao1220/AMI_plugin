import $ from 'jquery';
import _ from 'underscore';
import View from 'girder/views/View';
import events from '../events';
import CamerasOrthographic from 'ami/cameras/cameras.orthographic';
import ControlsOrthographic from 'ami/controls/controls.trackballortho';

import CoreUtils from 'ami/core/core.utils';

import HelpersBoundingBox from '../external_plugins/ami/helpers/helpers.boundingbox';
import HelpersLocalizer from '../external_plugins/ami/helpers/helpers.localizer';
import HelpersStack from '../external_plugins/ami/helpers/helpers.stack';

import LoadersVolume from '../external_plugins/ami/loaders/loaders.volume';

import ShadersDataUniforms from 'ami/shaders/shaders.data.uniform';
import ShadersDataFragment from 'ami/shaders/shaders.data.fragment';
import ShadersDataVertex from 'ami/shaders/shaders.data.vertex';
// Layer
import ShadersLayerUniforms from 'ami/shaders/shaders.layer.uniform';
import ShadersLayerFragment from 'ami/shaders/shaders.layer.fragment';
import ShadersLayerVertex from 'ami/shaders/shaders.layer.vertex';

import HelpersLut from '../external_plugins/ami/helpers/helpers.lut';
import Stats from 'stats-js';
import dat from 'dat.gui';
import AmiTemplate from '../templates/amiSEGTemplate.pug';
import '../stylesheets/amiSEG.styl';

import WidgetsRectangle from 'ami/widgets/widgets.rectangle';

// import nrrd from 'nrrd-js';
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
		this.labelStackReference={};
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
		this.isEditing = false;
		this.isDrawing = false;
		this.readyToRemove = false;
		this.layerMix = {
			opacity1: 0.5,
		}

		this.params = {
			color: "#1861b3" 
		}
		this.widgetsAvailable = [
		  'Handle',
		  'VoxelProbe',
		  'Ruler',
		  'BiRuler',
		  'CrossRuler',
		  'Angle',
		  'Rectangle',
		  'Ellipse',
		  'Polygon',
		  'Freehand',
		  'Annotation',
		];
		this.guiObjects = {
		  type: ' ',
		};
		this.allAnnoation = {};
		this.operateOverlay = null;

		this.stack;
		this.stack2;
		this.referenceChanged;
		this.greenChanged;
		this.yellowChanged;
		this.redChanged;

		this.stackFolder1;
		this.stackFolder2;
		this.stackFolder3;
		this.stackFolder4;
		
		//console.log($('#r1'))
		//3D rendering
		this.overlay = {};
		this.r0 = {
			domId: 'r0',
			renderer: null,
			targetID: 0,
			domElement: null,
			camera: null,
			controls: null,
			light: null,
			localizerHelper: null,
			localizerScene: null,
			widgets:[]
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
			localizerScene: null,
			widgets:[]
		};

		this.cursor = {
			value: 0,
			size: 10,
	    shape: 'round',
	    segment: 'erase'
		}
		this.cursorOptions = ['erase','draw'];
		this.cursorOptionsDict = {
        erase: {
          color: '#ffffff',
          value: 0
        },
        draw: {
        	color: '#1861b3',
          value: 1
        }
    };
		// 2d axial renderer editor
		this.r0Editor = {
			domId: 'r0Editor',
			canvas: null,
			context: null,
			cursor: {
			    color: '#ffffff',
			    value: this.cursor.value,
			    size: this.cursor.size,
			    shape: this.cursor.shape,
			    segment: this.cursor.segment
			},
			cursorOptions: this.cursorOptions,
			cursorOptionsDict: this.cursorOptionsDict,
			lastPoint: null,
			currentPoint: null
		};
		// 2d coronal renderer editor
		this.r3Editor = {
			domId: 'r3Editor',
			canvas: null,
			context: null,
			cursor: {
			    color: '#ffffff',
			    value: this.cursor.value,
			    size: this.cursor.size,
			    shape: this.cursor.shape,
			    segment: this.cursor.segment
			},
			cursorOptions: this.cursorOptions,
			cursorOptionsDict: this.cursorOptionsDict,
			lastPoint: null,
			currentPoint: null
		};
	//	console.log(THREE);
		this.sceneClip = new THREE.Scene();
		this.clipPlane1 = new THREE.Plane(new THREE.Vector3(0, 0, 0), 0);
		this.clipPlane2 = new THREE.Plane(new THREE.Vector3(0, 0, 0), 0);
		this.clipPlane3 = new THREE.Plane(new THREE.Vector3(0, 0, 0), 0);

		this.initRenderer2D(this.r0);
		this.initRenderer2D(this.r1);
		this.initRenderer2D(this.r2);
		this.initRenderer2D(this.r3);
		this.initRenderer2DEditor(this.r0Editor);
		this.initRenderer2DEditor(this.r3Editor);

	//	this.render();
	//	cancelAnimationFrame(reqanimationreference)
	},
	animate:function(){
			if (this.ready) {

			// render
				this.r0.controls.update();
	//			this.r1.controls.update();
	//			this.r2.controls.update();
				this.r3.controls.update();

	      	//	this.r0.light.position.copy(this.r0.camera.position);

	      	//	if(!this.readyTo){
					this.r0.renderer.clear();
					this.r0.renderer.render(this.r0.sceneLayer0, this.r0.camera);
			// 	}
			/*	if(this.readyTo){
					this.r0.renderer.clear();
					for(let key in this.labelStackReference){
				//		this.labelStack[key][3].renderer.clear();
			
						if(key==Object.keys(this.labelStackReference)[0]){
					
							this.labelStackReference[key][0].renderer.clear();
							this.labelStackReference[key][0].renderer.render(this.commonSceneLayer0R0, this.labelStackReference[key][0].camera, this.labelStackReference[key][0].sceneLayer0TextureTarget, true);
					
						}
						// render second layer offscreen
						this.labelStackReference[key][0].renderer.render(this.labelStackReference[key][0].sceneLayer1, this.labelStackReference[key][0].camera, this.labelStackReference[key][0].sceneLayer1TextureTarget, true);
						// mix the layers and render it ON screen!
						this.labelStackReference[key][0].renderer.render(this.labelStackReference[key][0].sceneLayerMix, this.labelStackReference[key][0].camera);

						this.labelStackReference[key][0].materialLayer1.clippingPlanes = [this.clipPlane3];
						this.labelStackReference[key][0].materialLayerMix.clippingPlanes = [this.clipPlane3];
					}
				}
			*/
				// localizer
				this.r0.renderer.clearDepth();
				this.r0.renderer.render(this.r0.localizerScene, this.r0.camera);
				// r1
/*				if(!this.readyTo){
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
				}

				// localizer
				this.r2.renderer.clearDepth();
				this.r2.renderer.render(this.r2.localizerScene, this.r2.camera);
*/
				// r3
				if(!this.readyTo){
					this.r3.renderer.clear();
					this.r3.renderer.render(this.r3.sceneLayer0, this.r3.camera);
				}
				if(this.readyTo){
					this.r3.renderer.clear();
					// console.log(this.labelStack);
					for(let key in this.labelStack){
				//		this.labelStack[key][3].renderer.clear();
				//		console.log(this.labelStack[key][3].stackHelper.children)
						if(key==Object.keys(this.labelStack)[0]&&this.labelStack[key][3].stackHelper.children.length===3){
				//			console.log(this.labelStack[key][3])
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

		rendererObj.renderer.setClearColor(0xffffff, 1);
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
	//	rendererObj.controls.dispose()
		rendererObj.controls.staticMoving = true;
		rendererObj.controls.noRotate = true;
		rendererObj.camera.controls = rendererObj.controls;
		rendererObj.controls.addEventListener('OnScroll', _.bind(this.onScroll,this));
		// scene
	//	rendererObj.sceneLayer0 = new THREE.Scene();
	//	rendererObj.sceneLayer1 = new THREE.Scene();
	//	rendererObj.sceneLayerMix = new THREE.Scene();
	},
	initRenderer2DEditor: function(rendererObj){
		rendererObj.domElement = document.getElementById(rendererObj.domId);
    rendererObj.canvas = document.createElement('canvas');
    rendererObj.canvas.setAttribute('width', rendererObj.domElement.clientWidth);
    rendererObj.canvas.setAttribute('height', rendererObj.domElement.clientHeight);
    rendererObj.canvas.setAttribute('id', rendererObj.domId+'_canvas');
    rendererObj.domElement.appendChild(rendererObj.canvas);
    rendererObj.context = rendererObj.canvas.getContext('2d');

    rendererObj.domElement.addEventListener('mouseup', _.bind(this.stopDraw,this));
		rendererObj.domElement.addEventListener('mousedown', _.bind(this.startDraw,this));
		rendererObj.domElement.addEventListener('mousemove', _.bind(this.drawing,this));
	},
	render:function(e,urls){
		$('#Loading').css('display','block');
		console.log(this.r0.stackHelper)
		if(this.r0.stackHelper){
			this.ready = false;
			this.r0.stackHelper.dispose()
			this.r0.stackHelper._stack=null
			this.r0.stackHelper.children[0] = null
			this.r0.stackHelper.children[1] = null
			this.r0.localizerHelper.dispose()
			// this.r0.controls.dispose()
			//this.r0.domElement=null
			this.r1.stackHelper.dispose()
			this.r1.stackHelper._stack=null
			this.r1.stackHelper.children[0] = null
			this.r1.stackHelper.children[1] = null
			this.r1.localizerHelper.dispose()
			// this.r1.controls.dispose()
			//this.r1.domElement=null
			this.r2.stackHelper.dispose()
			this.r2.stackHelper._stack=null
			this.r2.stackHelper.children[0] = null
			this.r2.stackHelper.children[1] = null
			this.r2.localizerHelper.dispose()
			// this.r2.controls.dispose()
			//this.r2.domElement=null
			this.r3.stackHelper.dispose()
			this.r3.stackHelper._stack=null
			this.r3.stackHelper.children[0] = null
			this.r3.stackHelper.children[1] = null
			this.r3.localizerHelper.dispose()
			// this.r3.controls.dispose()
			//this.r3.domElement=null
		}
		console.log(this.r0.stackHelper)
		if(e){
			this.animate();
		}
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
			let outerR0;
		//	console.log(urls);
			this.series=null;
			this.series = this.loader.data[0].mergeSeries(this.loader.data)[0];

//			console.log(this.series);
			this.loader.free();

			this.stack=null;
			//console.log(this.stack);
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
			//this.boxHelper = new HelpersBoundingBox(this.stack);
			//this.r0.sceneLayer0.add(this.boxHelper);
			// red slice
			outerR1=this.initHelpersStack(this.r1, this.stack);
			// yellow slice
			outerR2=this.initHelpersStack(this.r2, this.stack);
			// green slice
			outerR3=this.initHelpersStack(this.r3, this.stack);
			// reference slice
			outerR0=this.initHelpersStack(this.r0, this.stack);

			this.r1=_.extendOwn({}, this.r1, outerR1);
			this.r2=_.extendOwn({}, this.r2, outerR2);
			this.r3=_.extendOwn({}, this.r3, outerR3);
			this.r0=_.extendOwn({}, this.r0, outerR0);
	//		console.log(this.r0.stackHelper);
			//this.r0.sceneLayer0.add(this.r1.sceneLayer0);
			//this.r0.sceneLayer0.add(this.r2.sceneLayer0);
			//this.r0.sceneLayer0.add(this.r3.sceneLayer0);
			console.log(this.r3.stackHelper)
			// create new mesh with Localizer shaders
			this.plane1 = this.r1.stackHelper.slice.cartesianEquation();
			this.plane2 = this.r2.stackHelper.slice.cartesianEquation();
			this.plane3 = this.r3.stackHelper.slice.cartesianEquation();

			this.r0.camera = this.r3.camera
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
					color: new THREE.Color('red'),
				},
				{
					plane: this.plane2,
					color: new THREE.Color('red'),
				},
			]);
			
			// localizer reference slice
			this.initHelpersLocalizer(this.r0, this.stack, this.plane3, [
			{
					plane: this.plane1,
					color: new THREE.Color(0xff0000),
				},
				{
					plane: this.plane2,
					color: new THREE.Color(0xff0000),
				},
			]);
			this.gui = new dat.GUI({
				autoPlace: false,
				width:200
			});

			$('#my-gui-container').empty();
			this.customContainer = document.getElementById('my-gui-container');
			
			this.customContainer.appendChild(this.gui.domElement);

			// Reference
			this.stackFolder0 = this.gui.addFolder('Reference');


			this.stackFolder0.add(
				this.r0.stackHelper.slice,
				'windowWidth', 
				1, 
				this.stack.minMax[1] - this.stack.minMax[0]).step(1).listen().onChange(_.bind(function(e) {
					this.r3.stackHelper.slice.windowWidth = e;
					this.onReferenceChanged();
					this.onGreenChanged();
				},this));

			this.stackFolder0.add(
				this.r0.stackHelper.slice,
				'windowCenter', 
				1, 
				this.stack.minMax[1] - this.stack.minMax[0]).step(1).listen().onChange(_.bind(function(e) {
					this.r3.stackHelper.slice.windowCenter = e;
					this.onReferenceChanged();
					this.onGreenChanged();
				},this));

			this.stackFolder0.add(
				this.r0.stackHelper.slice,
				'upperThreshold', 
				1, 
				this.stack.minMax[1] - this.stack.minMax[0]).step(1).listen().onChange(_.bind(function(e) {
					this.r3.stackHelper.slice.upperThreshold = e;
					this.onReferenceChanged();
					this.onGreenChanged();
				},this));
			
			this.stackFolder0.add(
				this.r0.stackHelper.slice,
				'lowerThreshold', 
				this.stack.minMax[0], 
				this.stack.minMax[1] - this.stack.minMax[0]).step(1).listen().onChange(_.bind(function(e) {
					this.r3.stackHelper.slice.lowerThreshold = e;
					this.onReferenceChanged();
					this.onGreenChanged();
				},this));

			this.stackFolder0.add(this.r0.stackHelper.slice, 'intensityAuto');

			this.referenceChanged = this.stackFolder0.add(
				this.r0.stackHelper,
				'index', 
				0, 
				this.r0.stackHelper.orientationMaxIndex).step(1).listen().onChange(_.bind(function(e) {
					console.log(this.r3.stackHelper)
					this.r3.stackHelper.index = e;
					this.onReferenceChanged();
					this.onGreenChanged();
				},this));
			this.stackFolder0.open()
			// Red
		/*	this.stackFolder1 = this.gui.addFolder('Axial (Red)');

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
*/
			// Green
			this.stackFolder3 = this.gui.addFolder('Coronal (green)');


			this.stackFolder3.add(
				this.r3.stackHelper.slice,
				'windowWidth', 
				1, 
				this.stack.minMax[1] - this.stack.minMax[0]).step(1).listen().onChange(_.bind(function(e) {
					this.r0.stackHelper.slice.windowWidth = e;
					this.onReferenceChanged();
					this.onGreenChanged();
				},this));

			this.stackFolder3.add(
				this.r3.stackHelper.slice,
				'windowCenter', 
				1, 
				this.stack.minMax[1] - this.stack.minMax[0]).step(1).listen().onChange(_.bind(function(e) {
					this.r0.stackHelper.slice.windowCenter = e;
					this.onReferenceChanged();
					this.onGreenChanged();
				},this));

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
				this.r3.stackHelper.orientationMaxIndex).step(1).listen().onChange(_.bind(function(e) {
					this.r0.stackHelper.index = e;
					this.onReferenceChanged();
					this.onGreenChanged();
				},this));

			this.stackFolder3.open();
			// this.stackFolder4 = this.gui.addFolder('Label Color');

			// this.stackFolder4.add(
			// 	this.layerMix, 'opacity1', 0, 1).step(0.01).onChange(_.bind(function(value) {
			// //		this.r1.uniformsLayerMix.uOpacity1.value = value;
			// //		this.r2.uniformsLayerMix.uOpacity1.value = value;
			// 		this.r3.uniformsLayerMix.uOpacity1.value = value;
			// 	},this));

   //  		this.stackFolder4.addColor(this.params,'color').onChange(_.bind(function(){
   //  			let colorObj = new THREE.Color( this.params.color );
			// 	let lutLayer1 = new HelpersLut(
			// 		'my-lut-canvases-l1',
			// 		'default',
			// 		'linear',
			// 		[[0, 0, 0, 0], [1, colorObj.r, colorObj.g, colorObj.b]],
			// 		[[0, 0], [1, 1]],
			// 		false);
			// //	this.r1.uniformsLayer1.uTextureLUT.value = lutLayer1.texture;
			// //	this.r2.uniformsLayer1.uTextureLUT.value = lutLayer1.texture;
			// 	this.r3.uniformsLayer1.uTextureLUT.value = lutLayer1.texture;
   //  		},this));
   //  		this.widgetFolder = this.gui.addFolder('Widget');
		 //    this.widgetFolder.add(this.guiObjects, 'type', this.widgetsAvailable);
		 //    this.stackFolder4.open();
		    //$(window).on('mouseup', _.bind(this.stopDraw,this));
		    //$(window).on('mousedown', _.bind(this.startDraw,this));
		    //$(window).on('mousemove', _.bind(this.drawing,this));
			$(window).on('resize', _.bind(this.onWindowResize,this));
		//	$(window).on('onscroll', _.bind(this.onScroll,this));
			
			this.ready = true;
      $('#Loading').css('display','none');
		//	console.log('trigger g:imageRendered');
			this.trigger('g:imageRendered', this);

		},this)).catch(function(error) {
		//	this.trigger('g:imageRendered', this);
			window.console.log('oops... something went wrong...');
			window.console.log(error);
			window.error=error
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
		if(rendererObj.domId=='r0'){
			var inner = {
				color: 0xffffff,
				sliceOrientation: 'coronal',
				sliceColor: 0xffffff,
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

		if(stack2!=null){
			inner.sceneLayer1 = new THREE.Scene();
			inner.sceneLayerMix = new THREE.Scene();
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

    
			this.textures2 = [];
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
				this.textures2.push(tex);
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
			inner.uniformsLayer1.uTextureContainer.value = this.textures2;
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
      		inner.uniformsLayer1.uLowerUpperThreshold.value = [...stack2.minMax];
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

	updateLayer1Reference:function() {
	// update layer1 geometry...
	//	console.log(this.labelStack)
		for(let key in this.labelStackReference){
			if (this.labelStackReference[key][0].meshLayer1) {
	//			console.log(this.labelStack[key][3].stackHelper)
				// dispose geometry first
				this.labelStackReference[key][0].meshLayer1.geometry.dispose();
				this.labelStackReference[key][0].meshLayer1.geometry = this.labelStackReference[key][0].stackHelper.slice.geometry;
				this.labelStackReference[key][0].meshLayer1.geometry.verticesNeedUpdate = true;
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
	updateLayerMixReference:function() {
	// update layer1 geometry...

		for(let key in this.labelStackReference){
			if (this.labelStackReference[key][0].meshLayerMix) {
				this.labelStackReference[key][0].sceneLayerMix.remove(this.labelStackReference[key][0].meshLayerMix);
				this.labelStackReference[key][0].meshLayerMix.material.dispose();
				//meshLayerMix.material = null;//3:50pm 01-08
				this.labelStackReference[key][0].meshLayerMix.geometry.dispose();
				//meshLayerMix.geometry = null;//3:50pm 01-08

				// add mesh in this scene with right shaders...
				this.labelStackReference[key][0].meshLayerMix = 
				new THREE.Mesh(this.labelStackReference[key][0].stackHelper.slice.geometry, this.labelStackReference[key][0].materialLayerMix);
				// go the LPS space
				this.labelStackReference[key][0].meshLayerMix.applyMatrix(this.labelStackReference[key][0].stackHelper.stack._ijk2LPS);

				this.labelStackReference[key][0].sceneLayerMix.add(this.labelStackReference[key][0].meshLayerMix);
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

	onReferenceChanged: function() {
		this.updateLocalizer(this.r0, [this.r1.localizerHelper, this.r2.localizerHelper]);
		this.updateClipPlane(this.r0, this.clipPlane3);
		if(this.readyTo){
			this.updateLayer1Reference();
			this.updateLayerMixReference();
		}
	},

	onYellowChanged: function() {
		this.updateLocalizer(this.r2, [this.r1.localizerHelper, this.r0.localizerHelper]);
		this.updateLocalizer(this.r2, [this.r1.localizerHelper, this.r3.localizerHelper]);
		this.updateClipPlane(this.r2, this.clipPlane2);
		if(this.readyTo){
			this.updateLayer1Yellow();
			this.updateLayerMixYellow();
		}
	},
	onRedChanged: function() {
		this.updateLocalizer(this.r1, [this.r2.localizerHelper, this.r3.localizerHelper]);
		this.updateLocalizer(this.r1, [this.r2.localizerHelper, this.r0.localizerHelper]);
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
		this.windowResize2D(this.r0);
		this.windowResize2D(this.r1);
		this.windowResize2D(this.r2);
		this.windowResize2D(this.r3);
	},
	onScroll: function(event) {
//		console.log(event);
		const id = event.target.domElement.id;

		let stackHelper = null;
		switch (id) {
			case 'r0':
			stackHelper = this.r0.stackHelper;
			break;
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
			// console.log(stackHelper.index)
			if (stackHelper.index >= stackHelper.orientationMaxIndex) {
				return false;
			}
			// this.r0.stackHelper.index = stackHelper.index;
			// this.r3.stackHelper.index = stackHelper.index;
			stackHelper.index += 1;
		} else {
			if (stackHelper.index <= 0) {
				return false;
			}
			// this.r0.stackHelper.index = stackHelper.index;
			// this.r3.stackHelper.index = stackHelper.index;
			stackHelper.index -= 1;
		}

		this.r0.stackHelper.index = stackHelper.index;
		this.r3.stackHelper.index = stackHelper.index;
		this.onReferenceChanged();
		this.onGreenChanged();
		// To make sure editor working
		this.updateIJKBBox();		
	//	this.onGreenChanged();
	//	this.onRedChanged();
	//	this.onYellowChanged();
	},
	onDoubleClick: function(event) {
		let canvas = event.target.parentElement;
		let id = event.target.id;
		let mouse = {
			x: ((event.clientX - canvas.offsetLeft) / canvas.clientWidth) * 2 - 1,
			y: - ((event.clientY - canvas.offsetTop) / canvas.clientHeight) * 2 + 1,
		};

//		console.log(mouse)
		//
		let camera = null;
		let stackHelper = null;
		let sceneLayer0 = null;
		switch (id) {
			case '0':
			camera = this.r0.camera;
			stackHelper = this.r0.stackHelper;
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

			_.each(this.parentView.parentView.controlPanel.models(), (model) => {
            //	console.log(model);
            	if (model.get('type') === 'number-vector') {
                    model.set('value', ijk, {trigger: true});
                }
            });
//			console.log(ijk)

			this.onReferenceChanged();
			this.onGreenChanged();
			this.onRedChanged();
			this.onYellowChanged();
		}
	},
	/*
		fromMatch: true only display current label
	*/
	drawAnnotation:function(annotationUrl, fromMatch=false, forReference=false, key){
		if(this.r0.stackHelper){
			this.readyTo = false;
			//this.r0.stackHelper.dispose()
			// this.r0.stackHelper._stack=null
			// this.r0.stackHelper.children[0] = null
			// this.r0.stackHelper.children[1] = null
			// this.r0.localizerHelper.dispose()
			// this.r0.controls.dispose()
			//this.r0.domElement=null
			// this.r1.stackHelper.dispose()
			// this.r1.stackHelper._stack=null
			// this.r1.stackHelper.children[0] = null
			// this.r1.stackHelper.children[1] = null
			// this.r1.localizerHelper.dispose()
			// this.r1.controls.dispose()
			// //this.r1.domElement=null
			// this.r2.stackHelper.dispose()
			// this.r2.stackHelper._stack=null
			// this.r2.stackHelper.children[0] = null
			// this.r2.stackHelper.children[1] = null
			// this.r2.localizerHelper.dispose()
			// this.r2.controls.dispose()
			//this.r2.domElement=null
			//this.r3.stackHelper.dispose()
			// this.r3.stackHelper._stack=null
			// this.r3.stackHelper.children[0] = null
			// this.r3.stackHelper.children[1] = null
			// this.r3.localizerHelper.dispose()
			// this.r3.controls.dispose()
			//this.r3.domElement=null
		}
		if(this.labelStack[key]){
			// will cause stack2 not update when refresh page with same item
		//	console.log("duplicated");
		}
		else{
			$('#Loading').css('display','block');
			this.annotationNeedsUpdate = false;
			let label={};
			let referencelabel = {};
			let outerR1;
			let outerR2;
			let outerR3;
			let outerR0;
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
				if(this.r3.sceneLayerMix){
					if(this.r3.sceneLayerMix.children.length){
						this.readyTo = false;
						this.r3.sceneLayerMix.children[0].dispose()
					}
				}
				*/
				console.log('reconstructNrrdHeader');
				// console.log(loader._volumeParser._reconstructNrrdHeader);
				this.reconstructNrrdHeader = loader._volumeParser._reconstructNrrdHeader;
				window.loader = loader;
				let labelSeries = loader.data[0].mergeSeries(loader.data)[0];

				loader.free();
				loader = null;
				// get first stack from series

				let stack2 = labelSeries.stack[0];

				stack2.prepare();
				// pixels packing for the fragment shaders now happens there
				stack2.pack();
				this.stack2=null;
				this.stack2 = stack2;
				window.stack2 = this.stack2;
				window.stack2frame21pixelData = this.stack2.frame[21].pixelData;
				window.rawData = this.stack2.rawData[0];
				// window.camera3 = this.r3.camera;
				outerR0=this.initHelpersStack(this.r0, this.stack, stack2, this.r0.stackHelper);
				outerR1=this.initHelpersStack(this.r1, this.stack, stack2, this.r1.stackHelper);
				outerR2=this.initHelpersStack(this.r2, this.stack, stack2, this.r2.stackHelper);
				outerR3=this.initHelpersStack(this.r3, this.stack, stack2, this.r3.stackHelper);

		//		this.r1=_.extendOwn({}, this.r1, outerR1);
		//		this.r2=_.extendOwn({}, this.r2, outerR2);
				this.r3=_.extendOwn({}, this.r3, outerR3);
				this.r0=_.extendOwn({}, this.r0, outerR0);
				console.log(this.r3)
			//	this.r0.sceneLayer1.add(this.r1.sceneLayer1);
			//	this.r0.sceneLayerMix.add(this.r1.sceneLayerMix);
			//	this.r0.sceneLayer1.add(this.r2.sceneLayer1);
			//	this.r0.sceneLayerMix.add(this.r2.sceneLayerMix);
			//	this.r0.sceneLayer1.add(this.r3.sceneLayer1);
			//	this.r0.sceneLayerMix.add(this.r3.sceneLayerMix);


				referencelabel[0]=this.r0;
				label[1]=this.r1;
				label[2]=this.r2;
				label[3]=this.r3;

				this.commonSceneLayer0R0=referencelabel[0].sceneLayer0;
				this.commonSceneLayer0R1=label[1].sceneLayer0;
				this.commonSceneLayer0R2=label[2].sceneLayer0;
				this.commonSceneLayer0R3=label[3].sceneLayer0;
				if(forReference){
					this.labelStackReference={};
					this.labelStackReference[key] = referencelabel;
				}
				this.labelStack[key] = label;

				if(fromMatch){
					this.labelStack={};
					this.labelStack[key] = label;
				}
				window.labelStack = this.labelStack;
				this.onReferenceChanged();
				this.onGreenChanged();
				this.onRedChanged();
				this.onYellowChanged();
				this.updateIJKBBox();

				this.readyTo = true;
				if(this.referenceChanged){
					this.stackFolder0.remove(this.referenceChanged);
				}
				this.referenceChanged = this.stackFolder0.add(
					this.r0.stackHelper,
					'index', 0, this.r0.stackHelper.orientationMaxIndex).step(1).listen().onChange(_.bind(function(e) {
					this.r3.stackHelper.index = e;
					this.onReferenceChanged();
					this.onGreenChanged();
					this.updateIJKBBox();
					},this));

				if(this.greenChanged){
					this.stackFolder3.remove(this.greenChanged);
				}
				this.greenChanged = this.stackFolder3.add(
					this.r3.stackHelper,
					'index', 0, this.r3.stackHelper.orientationMaxIndex).step(1).listen().onChange(_.bind(function(e) {
					this.r0.stackHelper.index = e;
					this.onReferenceChanged();
					this.onGreenChanged();
					this.updateIJKBBox();
					},this));
					$('#Loading').css('display','none');
				window.addEventListener('keydown', _.bind(this.onKeyDown,this), false);
    		window.addEventListener('keyup', _.bind(this.onKeyUp,this), false);
			},this)).catch(function(error) {
				window.console.log('oops... something went wrong...');
				window.console.log(error);
			});
    }
	},
	removeAnnotation:function(annotationUrl, key){
		if(this.labelStack[key]){

			this.operateOverlay = this.labelStack[key];
		//	this.operateOverlay[0].sceneLayer0.remove(this.operateOverlay[0].sceneLayer0);
		//	this.operateOverlay[1].sceneLayer0.remove(this.operateOverlay[1].sceneLayer0);
		//	this.operateOverlay[2].sceneLayer0.remove(this.operateOverlay[2].sceneLayer0);
			this.operateOverlay[3].sceneLayer0.remove(this.operateOverlay[3].sceneLayer0);

		//	this.operateOverlay[0].sceneLayer1.remove(this.operateOverlay[0].sceneLayer1);
		//	this.operateOverlay[1].sceneLayer1.remove(this.operateOverlay[1].sceneLayer1);
		//	this.operateOverlay[2].sceneLayer1.remove(this.operateOverlay[2].sceneLayer1);
			this.operateOverlay[3].sceneLayer1.remove(this.operateOverlay[3].sceneLayer1);

			delete this.labelStack[key];
			if(Object.keys(this.labelStack).length==0){
				this.readyTo = false;
			}
		//	console.log(this.labelStack);

		//	this.readyTo = false;
		//	this.readyToRemove = true;
		}
		else{
			//	console.log("duplicated");
		}
	},
	annotationSelector(annotations){
		console.log('annotations:');
		console.log(annotations);
		this.showAnnotation = [];
		this.annotation = [];
		for(let a = 0; a < annotations.length; a++){
			this.showAnnotation[a] = {
				display: false,
				edit: false,
				id:annotations[a]._id
			}
			if(a == annotations.length - 1){
				this.showAnnotation[a].display = true
			}
		}
		this.edit = false;
		this.stackFolder4 = this.gui.addFolder('Labels');
		for(let a = 0; a < annotations.length; a++){
			this.annotation[a] = this.stackFolder4.addFolder("Label" + a +":" + annotations[a].name);
			this.annotation[a].add(this.showAnnotation[a], 'display').listen()
						.onChange( _.bind(function(){
							this.edit = false;
							for(let b = 0; b < annotations.length; b++){
								this.showAnnotation[b].edit = false;
							}
							if (this.showAnnotation[a].display == false){
								// this.showAnnotation[a].display = true;
								events.trigger('ami:removeSelectedAnnotation',this.showAnnotation[a].id, {trigger:true})
							}else{
								// this.showAnnotation[a].display = false
								events.trigger('ami:overlaySelectedAnnotation',this.showAnnotation[a].id, {trigger:true})
							};
							// console.log(this.showAnnotation[a].id)
			    			// id=this.showAnnotation[a].id;
						},this));
			// window.test = this.annotation[a].add(this.showAnnotation[a], 'edit');
			this.annotation[a].add(this.showAnnotation[a], 'edit').listen().onChange(_.bind(function(e){
				this.currentAnnotationItemId = this.showAnnotation[a].id;
				if(this.annotationNeedsUpdate){
					events.trigger('ds:saveAnnotationAlert',this.showAnnotation[a].id, {trigger:true});
					// this.annotationNeedsUpdate = false;
				}
				if(e){
					this.edit = true;
					for(let b = 0; b < annotations.length; b++){
						this.showAnnotation[b].edit = false;
						this.showAnnotation[b].display = false;
						events.trigger('ami:removeSelectedAnnotation',this.showAnnotation[b].id, {trigger:true})
					}
					this.showAnnotation[a].edit = true;
					this.showAnnotation[a].display = true;
					events.trigger('ami:overlaySelectedAnnotation',this.showAnnotation[a].id, {trigger:true})
				}else{
					this.edit = false;
				}
			},this))
			this.annotation[a].add(
				this.layerMix, 'opacity1', 0, 1).step(0.01).onChange(_.bind(function(value) {
			//		this.r1.uniformsLayerMix.uOpacity1.value = value;
			//		this.r2.uniformsLayerMix.uOpacity1.value = value;
					// console.log(this.labelStack[Object.keys(this.labelStack)[a]][3])
					this.labelStack[annotations[a]._id][3].uniformsLayerMix.uOpacity1.value = value;
				},this));

			this.annotation[a].addColor(this.params,'color').onChange(_.bind(function(){
				let colorObj = new THREE.Color( this.params.color );
				let lutLayer1 = new HelpersLut(
					'my-lut-canvases-l1',
					'default',
					'linear',
					[[0, 0, 0, 0], [1, colorObj.r, colorObj.g, colorObj.b]],
					[[0, 0], [1, 1]],
					false);
			//	this.r1.uniformsLayer1.uTextureLUT.value = lutLayer1.texture;
			//	this.r2.uniformsLayer1.uTextureLUT.value = lutLayer1.texture;
				this.cursorOptionsDict['draw'].color = this.params.color;
				this.r0Editor.cursorOptionsDict['draw'].color = this.params.color;
				this.r3Editor.cursorOptionsDict['draw'].color = this.params.color;
				// not erase
				if(this.r3Editor.cursor.value){
					this.r0Editor.cursor.color = this.params.color;
					this.r3Editor.cursor.color = this.params.color;
				}
				console.log(this.r0Editor.cursorOptionsDict['draw'].color)
				this.labelStack[annotations[a]._id][3].uniformsLayer1.uTextureLUT.value = lutLayer1.texture;
	  		},this));
		}
		this.stackFolder5 = this.gui.addFolder('Editor');
    this.stackFolder5.add(this.cursor, 'size', 0, 50).step(1).listen()
	    .onChange(_.bind(function(e){
	    	this.r0Editor.cursor.size = e;
	    	this.r3Editor.cursor.size = e;
	    },this));
    this.brush = this.stackFolder5.add(this.cursor, 'segment', this.cursorOptions);
    this.brush.onChange(_.bind(function(value) {
        // update color and value
        this.r0Editor.cursor.value = this.r0Editor.cursorOptionsDict[value].value;
        this.r0Editor.cursor.color = this.r0Editor.cursorOptionsDict[value].color;
        this.r3Editor.cursor.value = this.r3Editor.cursorOptionsDict[value].value;
        this.r3Editor.cursor.color = this.r3Editor.cursorOptionsDict[value].color;
    },this));
		// this.stackFolder4.add(
		// 	this.layerMix, 'opacity', 0, 1).step(0.01).onChange(_.bind(function(value) {
		// //		this.r1.uniformsLayerMix.uOpacity1.value = value;
		// //		this.r2.uniformsLayerMix.uOpacity1.value = value;
		// 		this.r3.uniformsLayerMix.uOpacity1.value = value;
		// 	},this));

		// this.stackFolder4.addColor(this.params,'color').onChange(_.bind(function(){
		// 	let colorObj = new THREE.Color( this.params.color );
		// 	let lutLayer1 = new HelpersLut(
		// 		'my-lut-canvases-l1',
		// 		'default',
		// 		'linear',
		// 		[[0, 0, 0, 0], [1, colorObj.r, colorObj.g, colorObj.b]],
		// 		[[0, 0], [1, 1]],
		// 		false);
		// //	this.r1.uniformsLayer1.uTextureLUT.value = lutLayer1.texture;
		// //	this.r2.uniformsLayer1.uTextureLUT.value = lutLayer1.texture;
		// 	this.r3.uniformsLayer1.uTextureLUT.value = lutLayer1.texture;
  // 		},this));


		// this.widgetFolder = this.gui.addFolder('Widget');
  //   this.widgetFolder.add(this.guiObjects, 'type', this.widgetsAvailable);
    this.stackFolder4.open();
	},
	startDraw:function(event){
			if (!this.isEditing) return;
			// console.log('startDraw');
			// window.test=event
			// let canvas = event.target.parentElement;
			let id = event.target.id;
			// let mouse = {
			// 	x: ((event.clientX - canvas.offsetLeft) / canvas.clientWidth) * 2 - 1,
			// 	y: - ((event.clientY - canvas.offsetTop) / canvas.clientHeight) * 2 + 1,
			// };
			// let raycaster;
			// let intersects;
			// console.log(id);
			switch (id) {
				case 'r0Editor_canvas':
					// for (let widget of this.r0.widgets) {
					// 	if (widget.hovered) {
					// 		widget.onStart(event);
							
					// 	}
					// }
					// console.log(mouse)
					// this.r0.domElement.style.cursor = 'default';
					// raycaster = new THREE.Raycaster();
					// raycaster.setFromCamera(mouse, this.r0.camera);
					// intersects = raycaster.intersectObject(this.r0.stackHelper.slice.mesh);
					// console.log(intersects);

					// this.r0.widget = new WidgetsRectangle(this.r0.stackHelper.slice.mesh, this.r0.controls, this.stack);
			
					// this.r0.widget.worldPosition = intersects[0].point;
					// this.r0.widgets.push(this.r0.widget);
					// this.r0.sceneLayerMix.add(this.r0.widget)
					break;

				case 'r3Editor_canvas':
					console.log('r3 start to draw');
					this.isDrawing = true;
          this.r3Editor.lastPoint = {
              x: event.pageX - this.r3Editor.domElement.getBoundingClientRect().left,
              y: event.pageY - this.r3Editor.domElement.offsetTop - this.r3Editor.domElement.getBoundingClientRect().top
          };
          this.r3Editor.boundingbox={};
          this.r3Editor.ijk={};
          console.log(this.r3Editor.lastPoint);
					// for (let widget of this.r3.widgets) {
					// 	if (widget.hovered) {
					// 		widget.onStart(event);
					// 	}
					// }
					// this.r3.domElement.style.cursor = 'default';
					// raycaster = new THREE.Raycaster();
					// console.log(mouse)
					// raycaster.setFromCamera(mouse, this.r3.camera);
					// intersects = raycaster.intersectObject(this.r3.stackHelper.slice.mesh);
					// console.log(intersects);
					// console.log(this.r3)
					// this.r3.widget = new WidgetsRectangle(this.r3.stackHelper.slice.mesh, this.r3.controls, this.stack);
					// this.r3.widget.worldPosition = intersects[0].point;
					// this.r3.widgets.push(this.r3.widget);
					// this.r3.sceneLayerMix.add(this.r3.widget)
					break;
				
			}
	},
	drawing:function(event){
		if (!this.isEditing) return;
		// console.log('drawing');

		// let cursor;
		// let canvas = event.target.parentElement;
		let id = event.target.id;
		// let mouse = {
		// 	x: ((event.clientX - canvas.offsetLeft) / canvas.clientWidth) * 2 - 1,
		// 	y: - ((event.clientY - canvas.offsetTop) / canvas.clientHeight) * 2 + 1,
		// };
		// console.log(id)
		switch (id) {
			case 'r0Editor_canvas':
				this.r0Editor.cursor;
				this.r0Editor.currentPoint = {
            x: event.pageX - this.r0Editor.domElement.getBoundingClientRect().left,
            y: event.pageY - this.r0Editor.domElement.offsetTop - this.r0Editor.domElement.getBoundingClientRect().top
        };
        this.r0Editor.context.strokeStyle = this.r0Editor.cursor.color;
        this.r0Editor.context.globalCompositeOperation = 'xor';
        this.r0Editor.context.globalAlpha = 0.5;
        this.r0Editor.context.fillStyle = this.r0Editor.cursor.color;
        if (this.isDrawing) {
            let dist = this.distanceBetween(this.r0Editor.lastPoint, this.r0Editor.currentPoint);
            let angle = this.angleBetween(this.r0Editor.lastPoint, this.r0Editor.currentPoint);

            for (let i = 0; i < dist; i += 5) {
                let x = this.r0Editor.lastPoint.x + Math.sin(angle) * i;
                let y = this.r0Editor.lastPoint.y + Math.cos(angle) * i;
                this.drawCircle(this.r0Editor, x, y);
            }

            this.r0Editor.lastPoint = this.r0Editor.currentPoint;
        } else {
            this.clearAllCanvas();
        }

        // draw under the cursor
        this.r0Editor.context.globalCompositeOperation = 'source-over';
        this.r0Editor.context.globalAlpha = 1;
        this.r0Editor.context.fillStyle = 'rgba(0, 0, 0, 0)';
        // console.log(this.r0Editor.currentPoint.x, this.r0Editor.currentPoint.y)
        this.drawCircle(this.r0Editor, this.r0Editor.currentPoint.x, this.r0Editor.currentPoint.y);

        break;
			case 'r3Editor_canvas':
				this.r3Editor.cursor;
				this.r3Editor.currentPoint = {
            x: event.pageX - this.r3Editor.domElement.getBoundingClientRect().left,
            y: event.pageY - this.r3Editor.domElement.offsetTop - this.r3Editor.domElement.getBoundingClientRect().top
        };
        this.r3Editor.context.strokeStyle = this.r3Editor.cursor.color;
        this.r3Editor.context.globalCompositeOperation = 'xor';
        this.r3Editor.context.globalAlpha = 0.5;
        this.r3Editor.context.fillStyle = this.r3Editor.cursor.color;
        // console.log(this.isDrawing);
        if (this.isDrawing) {
            let dist = this.distanceBetween(this.r3Editor.lastPoint, this.r3Editor.currentPoint);
            let angle = this.angleBetween(this.r3Editor.lastPoint, this.r3Editor.currentPoint);

            for (let i = 0; i < dist; i += 5) {
                let x = this.r3Editor.lastPoint.x + Math.sin(angle) * i;
                let y = this.r3Editor.lastPoint.y + Math.cos(angle) * i;
                this.drawCircle(this.r3Editor, x, y);
            }

            this.r3Editor.lastPoint = this.r3Editor.currentPoint;
            if(this.r3Editor.boundingbox.left != undefined){
            	if(this.r3Editor.lastPoint.x - this.r3Editor.cursor.size < this.r3Editor.boundingbox.left)
	            {
	            	this.r3Editor.boundingbox.left = Math.round(this.r3Editor.lastPoint.x - this.r3Editor.cursor.size);
	            }
	            if(this.r3Editor.lastPoint.x + this.r3Editor.cursor.size > this.r3Editor.boundingbox.right)
	            {
	            	this.r3Editor.boundingbox.right = Math.round(this.r3Editor.lastPoint.x + this.r3Editor.cursor.size);
	            }
	            if(this.r3Editor.lastPoint.y - this.r3Editor.cursor.size < this.r3Editor.boundingbox.top)
	            {
	            	this.r3Editor.boundingbox.top = Math.round(this.r3Editor.lastPoint.y - this.r3Editor.cursor.size);
	            }
	            if(this.r3Editor.lastPoint.y + this.r3Editor.cursor.size > this.r3Editor.boundingbox.bottom)
	            {
	            	this.r3Editor.boundingbox.bottom = Math.round(this.r3Editor.lastPoint.y + this.r3Editor.cursor.size);
	            }

	            let mouse_topLeft = {x: (this.r3Editor.boundingbox.left /  this.r3Editor.context.canvas.clientWidth) * 2 - 1,
           							y: -(this.r3Editor.boundingbox.top /  this.r3Editor.context.canvas.clientHeight) * 2 + 1};

		          let raycaster_topLeft = new THREE.Raycaster();
		          raycaster_topLeft.setFromCamera(mouse_topLeft, this.r3.camera);
		          let intersects_topLeft = raycaster_topLeft.intersectObjects(this.r3.sceneLayer0.children, true);
		          this.r3Editor.ijk.topLeft =
								CoreUtils.worldToData(this.stackHelper._stack.lps2IJK, intersects_topLeft[0].point);

							let mouse_bottomRight = {x: (this.r3Editor.boundingbox.right /  this.r3Editor.context.canvas.clientWidth) * 2 - 1,
           							y: -(this.r3Editor.boundingbox.bottom /  this.r3Editor.context.canvas.clientHeight) * 2 + 1};
		          let raycaster_bottomRight = new THREE.Raycaster();
		          raycaster_bottomRight.setFromCamera(mouse_bottomRight, this.r3.camera);
		          let intersects_bottomRight = raycaster_bottomRight.intersectObjects(this.r3.sceneLayer0.children, true);
		          this.r3Editor.ijk.bottomRight =
								CoreUtils.worldToData(this.stackHelper._stack.lps2IJK, intersects_bottomRight[0].point);
							// console.log('this.r3Editor.boundingbox.left, this.r3Editor.boundingbox.right, this.r3Editor.boundingbox.top, this.r3Editor.boundingbox.bottom');
		     //    	console.log(this.r3Editor.boundingbox.left, this.r3Editor.boundingbox.right, this.r3Editor.boundingbox.top, this.r3Editor.boundingbox.bottom);
		     //    	console.log(this.r3Editor.ijk.topLeft.x, this.r3Editor.ijk.bottomRight.x, this.r3Editor.ijk.topLeft.y, this.r3Editor.ijk.bottomRight.y);
		        }
          	else{
          		this.r3Editor.boundingbox = {
		            left: Math.round(this.r3Editor.lastPoint.x - this.r3Editor.cursor.size),
		            right: Math.round(this.r3Editor.lastPoint.x + this.r3Editor.cursor.size),
		            top: Math.round(this.r3Editor.lastPoint.y - this.r3Editor.cursor.size),
		            bottom: Math.round(this.r3Editor.lastPoint.y + this.r3Editor.cursor.size)
		        	};

		        	let mouse_topLeft = {x: (this.r3Editor.boundingbox.left /  this.r3Editor.context.canvas.clientWidth) * 2 - 1,
           							y: -(this.r3Editor.boundingbox.top /  this.r3Editor.context.canvas.clientHeight) * 2 + 1};
		          let raycaster_topLeft = new THREE.Raycaster();
		          raycaster_topLeft.setFromCamera(mouse_topLeft, this.r3.camera);
		          let intersects_topLeft = raycaster_topLeft.intersectObjects(this.r3.sceneLayer0.children, true);
		          this.r3Editor.ijk.topLeft =
								CoreUtils.worldToData(this.stackHelper._stack.lps2IJK, intersects_topLeft[0].point);


							let mouse_bottomRight = {x: (this.r3Editor.boundingbox.right /  this.r3Editor.context.canvas.clientWidth) * 2 - 1,
           							y: -(this.r3Editor.boundingbox.bottom /  this.r3Editor.context.canvas.clientHeight) * 2 + 1};
		          let raycaster_bottomRight = new THREE.Raycaster();
		          raycaster_bottomRight.setFromCamera(mouse_bottomRight, this.r3.camera);
		          let intersects_bottomRight = raycaster_bottomRight.intersectObjects(this.r3.sceneLayer0.children, true);
		          this.r3Editor.ijk.bottomRight =
								CoreUtils.worldToData(this.stackHelper._stack.lps2IJK, intersects_bottomRight[0].point);

		        	// console.log('boundingbox is {}');
		        	// console.log(this.r3Editor.boundingbox.left, this.r3Editor.boundingbox.right, this.r3Editor.boundingbox.top, this.r3Editor.boundingbox.bottom);
		        	// console.log(this.r3Editor.ijk.topLeft.x, this.r3Editor.ijk.bottomRight.x, this.r3Editor.ijk.topLeft.y, this.r3Editor.ijk.bottomRight.y);
          	}
        } else {
            this.clearAllCanvas();
        }

        // draw under the cursor
        this.r3Editor.context.globalCompositeOperation = 'source-over';
        this.r3Editor.context.globalAlpha = 1;
        this.r3Editor.context.fillStyle = 'rgba(0, 0, 0, 0)';
        // console.log(this.r3Editor.currentPoint.x, this.r3Editor.currentPoint.y)
        this.drawCircle(this.r3Editor, this.r3Editor.currentPoint.x, this.r3Editor.currentPoint.y);
				// cursor = 'default';
				// for (let widget of this.r3.widgets) {
				// 	widget.onMove(event);
				// 	if (widget.hovered) {
				// 		cursor = 'pointer';
				// 	}
				// }
				// this.r3.domElement.style.cursor = cursor
				// console.log(this.r3Editor)
				break;
		}
	},
	stopDraw:function(event){

		if (!this.isEditing) return;
		this.isDrawing = false;

		let id = event.target.id;
		switch (id) {
			case 'r0Editor_canvas':
			// for (let widget of this.r0.widgets) {
			// 	if (widget.active){
			// 		widget.onEnd(event);
			// 		return
			// 	}
			// }
			this.mapCanvasToData(this.r0Editor);
			break;
			case 'r3Editor_canvas':

			// console.log(this.r3Editor.boundingbox)
			this.mapCanvasToData(this.r3Editor);
			// for (let widget of this.r3.widgets) {
			// 	if (widget.active){
			// 		widget.onEnd(event);
			// 		return
			// 	}
			// }
			break;
		}
		this.clearAllCanvas();
	},
  /**
   *
   */
  onKeyDown: function(e) {
  	// E on keyboard 
    if (e.keyCode === 69 && this.edit) {	
      this.isEditing = true;
      // this.isDrawing = false;
      this.updateDOM();
      // this.r3.controls.dispose()
    }
    // console.log(this.isDrawing);
  },
  /**
   *
   */
  onKeyUp: function(e) {
    if (e.keyCode === 69) {
      this.isEditing = false;
      this.isDrawing = false;
      // this.r3.controls.reset()
      this.clearAllCanvas();
      this.updateDOM();
    }
    // console.log(this.isDrawing);
  },

  updateDOM: function() {
    // lets events go through or not for scrolling, padding, zooming, etc.
    if (this.	isEditing) {
    	this.r0Editor.domElement.className = 'domEditing col-md-6';
      this.r3Editor.domElement.className = 'domEditing col-md-6';
    } else {
    	this.r0Editor.domElement.className = 'domExploring col-md-6';
      this.r3Editor.domElement.className = 'domExploring col-md-6';
    }
  },

  distanceBetween: function(point1, point2) {
      return Math.sqrt(Math.pow(point2.x - point1.x, 2) + Math.pow(point2.y - point1.y, 2));
  },
  angleBetween: function(point1, point2) {
      return Math.atan2(point2.x - point1.x, point2.y - point1.y);
  },

  drawCircle: function(editor, x, y) {
      editor.context.beginPath();
      editor.context.arc(x, y, editor.cursor.size, false, Math.PI * 2, false);
      editor.context.closePath();
      editor.context.fill();
      editor.context.stroke();
  },
  clearAllCanvas: function() {
  	this.r3Editor.context.clearRect(0, 0, this.r3Editor.context.canvas.width, this.r3Editor.context.canvas.height);
    this.r0Editor.context.clearRect(0, 0, this.r0Editor.context.canvas.width, this.r0Editor.context.canvas.height);
  },
  mapCanvasToData: function(editor){
  	// console.log(editor.boundingbox);
  	// for (let i = this.ijkBBox[0]; i < this.ijkBBox[1] + 1; i++) {
   //    for (let j = this.ijkBBox[2]; j < this.ijkBBox[3] + 1; j++) {
    // for (let i = editor.boundingbox.left; i < editor.boundingbox.right; i++) {
    //   for (let j = editor.boundingbox.top; j < editor.boundingbox.bottom ; j++) {
    //     for (let k = this.ijkBBox[4]; k < this.ijkBBox[5] + 1; k++) {
    	

    	console.log(editor.ijk)	//top should be more high(depends on camera relative postion)


      for (let i = editor.ijk.topLeft.x; i < editor.ijk.bottomRight.x; i++) {
        for (let j = editor.ijk.topLeft.y; j < editor.ijk.bottomRight.y; j++) {
          for (let k = this.ijkBBox[4]; k < this.ijkBBox[5] + 1; k++) {
	          // ijk to world
	          // console.log(i, j, k);
	          // center of voxel
	          let worldCoordinate = new THREE.Vector3(i, j, k).applyMatrix4(this.stackHelper._stack.ijk2LPS);
	          // console.log(worldCoordinate);
	          // world to screen coordinate

	          let screenCoordinates = worldCoordinate.clone();
	          screenCoordinates.project(this.r3.camera);
	          // console.log(screenCoordinates);

	          screenCoordinates.x = Math.round((screenCoordinates.x + 1) * editor.canvas.offsetWidth / 2);
	          screenCoordinates.y = Math.round((-screenCoordinates.y + 1) * editor.canvas.offsetHeight / 2);
	          screenCoordinates.z = 0;

	          let pixel = editor.context.getImageData(screenCoordinates.x, screenCoordinates.y, 1, 1).data;
	          // console.log(pixel)
	          if (pixel[3] > 0 && i >= 0 && j >= 0 && k >= 0) {
	              // find index and texture
	              // console.log(i, j, k)
	              // console.log(screenCoordinates)
	              let voxelIndex = i + j * this.stack2._columns + k * this.stack2._rows * this.stack2._columns;
	              // console.log(voxelIndex)
	              let textureSize = 4096;
	              let textureDimension = 4 * textureSize * textureSize;

	              let rawDataIndex = ~~(voxelIndex / textureDimension);
	              let inRawDataIndex = ((voxelIndex % textureDimension)) * this.stack2.packedPerPixel;	//16 bit rawdata;

	              // console.log('inRawDataIndex:')
	              // console.log(inRawDataIndex)
	              // update value...
	              let oldValue = this.stack2.rawData[rawDataIndex][inRawDataIndex];
	              let newValue = editor.cursor.value;
	              // console.log(oldValue)
	              if (oldValue != newValue) {
	                  // update raw data
	                  this.stack2.rawData[rawDataIndex][inRawDataIndex] = newValue;

	                  // update texture that is passed to shader
	                  this.textures2[rawDataIndex].image.data = this.stack2.rawData[rawDataIndex]; // tex;
	                  this.textures2[rawDataIndex].needsUpdate = true;
	                  this.annotationNeedsUpdate = true;
	              }
	          }
	        }
	      }
	  	}
  },
  updateIJKBBox: function() {
        this.ijkBBox = [this.stack2._columns, 0, this.stack2._rows, 0, this.stack2.frame.length, 0];

        // IJK BBox of the plane
        let slice = this.r3.stackHelper._slice;
        let vertices = slice._geometry.vertices;
        // to LPS
        for (let i = 0; i < vertices.length; i++) {
            let wc = new THREE.Vector3(vertices[i].x, vertices[i].y, vertices[i].z).applyMatrix4(
                this.stackHelper._stack.ijk2LPS
            );
            let dc = wc.applyMatrix4(this.stackHelper._stack.lps2IJK);
            dc.x = Math.round(dc.x * 10) / 10;
            dc.y = Math.round(dc.y * 10) / 10;
            dc.z = Math.round(dc.z * 10) / 10;

            if (dc.x < this.ijkBBox[0]) {
                this.ijkBBox[0] = dc.x;
            }
            if (dc.x > this.ijkBBox[1]) {
                this.ijkBBox[1] = dc.x;
            }

            // Y
            if (dc.y < this.ijkBBox[2]) {
                this.ijkBBox[2] = dc.y;
            }
            if (dc.y > this.ijkBBox[3]) {
                this.ijkBBox[3] = dc.y;
            }

            // Z
            if (dc.z < this.ijkBBox[4]) {
                this.ijkBBox[4] = dc.z;
            }
            if (dc.z > this.ijkBBox[5]) {
                this.ijkBBox[5] = dc.z;
            }
        }

        // round min up and max down
        this.ijkBBox[0] = Math.ceil(this.ijkBBox[0]);
        this.ijkBBox[2] = Math.ceil(this.ijkBBox[2]);
        this.ijkBBox[4] = Math.ceil(this.ijkBBox[4]);
        this.ijkBBox[1] = Math.floor(this.ijkBBox[1]);
        this.ijkBBox[3] = Math.floor(this.ijkBBox[3]);
        this.ijkBBox[5] = Math.floor(this.ijkBBox[5]);

        // console.log(this.ijkBBox)
    }
});

export default ami;