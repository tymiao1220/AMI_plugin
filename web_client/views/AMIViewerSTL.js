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
import Stats from 'stats-js';
import dat from 'dat.gui';
import AmiTemplate from '../templates/amiTemplate.pug';
import '../stylesheets/ami.styl';

var ami = View.extend({
	events:{
		'dblclick #r0': 'onDoubleClick',
		'dblclick #r1': 'onDoubleClick',
		'dblclick #r2': 'onDoubleClick',
		'dblclick #r3': 'onDoubleClick',
		'click #r0': 'onClick',
		'scroll #r1': 'onScroll',
		'scroll #r2': 'onScroll',
		'scroll #r3': 'onScroll'
	},
	initialize(setting){
		this.files = setting.files;
		this.stats = new Stats();
  		this.ready = false;
  		this.readyToOverlay = false;
  		this.readyToRemove = false;

  		this.redContourHelper = null;
		this.redTextureTarget = null;
		this.redContourScene = null;

		this.yellowContourHelper = null;
		this.yellowTextureTarget = null;
		this.yellowContourScene = null;

		this.greenContourHelper = null;
		this.greenTextureTarget = null;
		this.greenContourScene = null;

		this.allAnnoation = {};
		this.operateOverlay = null;

		this.$el.html(AmiTemplate());
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
		};
		// 2d axial renderer
		this.r1 = {
			domId: 'r1',
			domElement: null,
			renderer: null,
			color: 0x121212,
			sliceOrientation: 'axial',
			sliceColor: 0xFF1744,
			targetID: 1,
			camera: null,
			controls: null,
			scene: null,
			light: null,
			stackHelper: null,
			localizerHelper: null,
			localizerScene: null,
		};

		// 2d sagittal renderer
		this.r2 = {
			domId: 'r2',
			domElement: null,
			renderer: null,
			color: 0x121212,
			sliceOrientation: 'sagittal',
			sliceColor: 0xFFEA00,
			targetID: 2,
			camera: null,
			controls: null,
			scene: null,
			light: null,
			stackHelper: null,
			localizerHelper: null,
			localizerScene: null,
		};


		// 2d coronal renderer
		this.r3 = {
			domId: 'r3',
			domElement: null,
			renderer: null,
			color: 0x121212,
			sliceOrientation: 'coronal',
			sliceColor: 0x76FF03,
			targetID: 3,
			camera: null,
			controls: null,
			scene: null,
			light: null,
			stackHelper: null,
			localizerHelper: null,
			localizerScene: null,
		};
	//	console.log(THREE);
		this.sceneClip = new THREE.Scene();
		this.clipPlane1 = new THREE.Plane(new THREE.Vector3(0, 0, 0), 0);
		this.clipPlane2 = new THREE.Plane(new THREE.Vector3(0, 0, 0), 0);
		this.clipPlane3 = new THREE.Plane(new THREE.Vector3(0, 0, 0), 0);
	//	this.render();
	},
	init:function(){
		

		// renderers
		this.initRenderer3D(this.r0);
		this.initRenderer2D(this.r1);
		this.initRenderer2D(this.r2);
		this.initRenderer2D(this.r3);

		// start rendering loop
		this.animate();
	},
	animate:function(){

			if (this.ready) {
			// render
				this.r0.controls.update();
				this.r1.controls.update();
				this.r2.controls.update();
				this.r3.controls.update();

			//	console.log(this.r1.scene);
			//	console.log(this.r1.scene);
				if(this.readyToRemove){
		      		
		    //  		console.log(this.operateOverlay.mesh);
		      		
					this.r0.scene.remove(this.operateOverlay.mesh);

					this.sceneClip.remove(this.operateOverlay.scene);
					this.operateOverlay.materialFront.dispose();
					this.operateOverlay.materialBack.dispose();
					this.operateOverlay.mesh.geometry.dispose();
					this.operateOverlay.mesh.material.dispose();

				}
	      		this.r0.light.position.copy(this.r0.camera.position);
	      		this.r0.renderer.render(this.r0.scene, this.r0.camera);

				// r1
				this.r1.renderer.clear();
				this.r1.renderer.render(this.r1.scene, this.r1.camera);
				// mesh
				this.r1.renderer.clearDepth();
			//	console.log("readyToRemove:"+this.readyToRemove);
			//	console.log("readyToOverlay:"+this.readyToOverlay);
				if(this.readyToOverlay){

					this.overlay.materialFront.clippingPlanes = [this.clipPlane1];
					this.overlay.materialBack.clippingPlanes = [this.clipPlane1];
			//		this.r1.renderer.render(this.overlay.scene, this.r1.camera, this.redTextureTarget, true);
			//		this.r1.renderer.clearDepth();
			//		this.redContourHelper.contourWidth = this.overlay.selected ? 3 : 1.5;
			//		this.redContourHelper.contourOpacity = this.overlay.selected ? 1 : 1;
			//		this.r1.renderer.render(this.redContourScene, this.r1.camera);
			//		this.r1.renderer.clearDepth();
		      	}

		      	this.r1.renderer.render(this.sceneClip, this.r1.camera);
			//	console.log(this.r0.scene);
				// localizer
				this.r1.renderer.clearDepth();
				this.r1.renderer.render(this.r1.localizerScene, this.r1.camera);

				// r2
				this.r2.renderer.clear();
				this.r2.renderer.render(this.r2.scene, this.r2.camera);
				// mesh
				this.r2.renderer.clearDepth();

				if(this.readyToOverlay){
					this.overlay.materialFront.clippingPlanes = [this.clipPlane2];
					this.overlay.materialBack.clippingPlanes = [this.clipPlane2];
			//		this.r2.renderer.render(this.overlay.scene, this.r2.camera, this.yellowTextureTarget, true);
			//		this.r2.renderer.clearDepth();
			//		this.yellowContourHelper.contourWidth = this.overlay.selected ? 6 : 3;
			//		this.yellowContourHelper.contourOpacity = this.overlay.selected ? 1 : .2;
			//		this.r2.renderer.render(this.yellowContourScene, this.r2.camera);
			//		this.r2.renderer.clearDepth();
			    }
			//    console.log(this.sceneClip);
				this.r2.renderer.render(this.sceneClip, this.r2.camera);
				// localizer
				this.r2.renderer.clearDepth();
				this.r2.renderer.render(this.r2.localizerScene, this.r2.camera);

				// r3
				this.r3.renderer.clear();
				this.r3.renderer.render(this.r3.scene, this.r3.camera);
				// mesh
				this.r3.renderer.clearDepth();

				if(this.readyToOverlay){
					this.overlay.materialFront.clippingPlanes = [this.clipPlane3];
					this.overlay.materialBack.clippingPlanes = [this.clipPlane3];
				}

				this.r3.renderer.render(this.sceneClip, this.r3.camera);
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
		renderObj.scene = new THREE.Scene();

		// light
		renderObj.light = new THREE.DirectionalLight(0xffffff, 1);
		renderObj.light.position.copy(renderObj.camera.position);
		renderObj.scene.add(renderObj.light);

		// stats
		renderObj.domElement.appendChild(this.stats.domElement);
	},
	initRenderer2D: function(rendererObj){
		// renderer
		rendererObj.domElement = document.getElementById(rendererObj.domId);
		if(rendererObj.domId=='r1')
		{
			rendererObj.renderer = new THREE.WebGLRenderer({
				antialias: true,
				});
		}
		if(rendererObj.domId=='r2')
		{
			rendererObj.renderer = new THREE.WebGLRenderer({
				antialias: false,
				});
		}
		if(rendererObj.domId=='r3')
		{
			rendererObj.renderer = new THREE.WebGLRenderer({
				antialias: false,
				});
		}
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

		// scene
		rendererObj.scene = new THREE.Scene();
	},
	render:function(){
		
		this.init();
		this.loader = new LoadersVolume();
		this.loader.load(this.files)
		.then(_.bind(function() {

			this.series = this.loader.data[0].mergeSeries(this.loader.data)[0];
			this.loader.free();
			this.loader = null;
			// get first stack from series
			this.stack = this.series.stack[0];
			this.stack.prepare();
		//	console.log(this.stack);
			// center 3d camera/control on the stack
			this.centerLPS = this.stack.worldCenter();
			this.r0.camera.lookAt(this.centerLPS.x, this.centerLPS.y, this.centerLPS.z);
			this.r0.camera.updateProjectionMatrix();
			this.r0.controls.target.set(this.centerLPS.x, this.centerLPS.y, this.centerLPS.z);

			// bouding box
			this.boxHelper = new HelpersBoundingBox(this.stack);
			this.r0.scene.add(this.boxHelper);

			// red slice
			this.initHelpersStack(this.r1, this.stack);
			this.r0.scene.add(this.r1.scene);

			this.redTextureTarget = new THREE.WebGLRenderTarget(
				this.r1.domElement.clientWidth,
				this.r1.domElement.clientHeight,
				{
					minFilter: THREE.LinearFilter,
					magFilter: THREE.NearestFilter,
					format: THREE.RGBAFormat,
				}
			);

			this.redContourHelper = new HelpersContour(this.stack, this.r1.stackHelper.slice.geometry);
			this.redContourHelper.canvasWidth = this.redTextureTarget.width;
			this.redContourHelper.canvasHeight = this.redTextureTarget.height;
			this.redContourHelper.textureToFilter = this.redTextureTarget.texture;
			this.redContourScene = new THREE.Scene();
			this.redContourScene.add(this.redContourHelper);

			// yellow slice
			this.initHelpersStack(this.r2, this.stack);
			this.r0.scene.add(this.r2.scene);

			this.yellowTextureTarget = new THREE.WebGLRenderTarget(
				this.r2.domElement.clientWidth,
				this.r2.domElement.clientHeight,
				{
					minFilter: THREE.LinearFilter,
					magFilter: THREE.NearestFilter,
					format: THREE.RGBAFormat,
				}
			);

			this.yellowContourHelper = new HelpersContour(this.stack, this.r2.stackHelper.slice.geometry);
			this.yellowContourHelper.canvasWidth = this.yellowTextureTarget.width;
			this.yellowContourHelper.canvasHeight = this.yellowTextureTarget.height;
			this.yellowContourHelper.textureToFilter = this.yellowTextureTarget.texture;
			this.yellowContourScene = new THREE.Scene();
			this.yellowContourScene.add(this.yellowContourHelper);






			// green slice
			this.initHelpersStack(this.r3, this.stack);
			this.r0.scene.add(this.r3.scene);

			this.greenTextureTarget = new THREE.WebGLRenderTarget(
				this.r3.domElement.clientWidth,
				this.r3.domElement.clientHeight,
				{
					minFilter: THREE.LinearFilter,
					magFilter: THREE.NearestFilter,
					format: THREE.RGBAFormat,
				}
			);

			this.greenContourHelper = new HelpersContour(this.stack, this.r3.stackHelper.slice.geometry);
			this.greenContourHelper.canvasWidth = this.greenTextureTarget.width;
			this.greenContourHelper.canvasHeight = this.greenTextureTarget.height;
			this.greenContourHelper.textureToFilter = this.greenTextureTarget.texture;
			this.greenContourScene = new THREE.Scene();
			this.greenContourScene.add(this.greenContourHelper);

			// create new mesh with Localizer shaders
			this.plane1 = this.r1.stackHelper.slice.cartesianEquation();
			this.plane2 = this.r2.stackHelper.slice.cartesianEquation();
			this.plane3 = this.r3.stackHelper.slice.cartesianEquation();

			console.log(this.r1);
			console.log(this.r2);
			console.log(this.r3);
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

			this.customContainer = document.getElementById('my-gui-container');
			this.customContainer.appendChild(this.gui.domElement);


			// Red
			this.stackFolder1 = this.gui.addFolder('Axial (Red)');
			this.redChanged = this.stackFolder1.add(
				this.r1.stackHelper,
				'index', 
				0, 
				this.r1.stackHelper.orientationMaxIndex).step(1).listen();

		/*	this.stackFolder1.add(
				this.r1.stackHelper.slice, 
				'interpolation', 
				0, 1).step(1).listen();
*/
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
				1, 
				this.stack.minMax[1] - this.stack.minMax[0]).step(1).listen();


			this.stackFolder1.add(this.r1.stackHelper.slice, 'intensityAuto');
			

			// Yellow
			this.stackFolder2 = this.gui.addFolder('Sagittal (yellow)');
			this.yellowChanged = this.stackFolder2.add(
				this.r2.stackHelper,
				'index', 
				0, 
				this.r2.stackHelper.orientationMaxIndex).step(1).listen();

		/*	this.stackFolder2.add(
				this.r2.stackHelper.slice, 
				'interpolation', 
				0, 1).step(1).listen();
*/
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

			this.stackFolder2.add(this.r2.stackHelper.slice, 'intensityAuto');

			// Green
			this.stackFolder3 = this.gui.addFolder('Coronal (green)');
			this.greenChanged = this.stackFolder3.add(
				this.r3.stackHelper,
				'index', 
				0, 
				this.r3.stackHelper.orientationMaxIndex).step(1).listen();

		/*	this.stackFolder3.add(
				this.r3.stackHelper.slice, 
				'interpolation', 
				0, 1).step(1).listen();
*/
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

			this.stackFolder3.add(this.r3.stackHelper.slice, 'intensityAuto');

			this.yellowChanged.onChange(_.bind(this.onYellowChanged,this));

			this.redChanged.onChange(_.bind(this.onRedChanged,this));

			this.greenChanged.onChange(_.bind(this.onGreenChanged,this));

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
	initHelpersStack:function(rendererObj, stack){
		rendererObj.stackHelper = new HelpersStack(stack);
		rendererObj.stackHelper.bbox.visible = false;
		rendererObj.stackHelper.borderColor = rendererObj.sliceColor;
		rendererObj.stackHelper.slice.canvasWidth =
			rendererObj.domElement.clientWidth;
		rendererObj.stackHelper.slice.canvasHeight =
			rendererObj.domElement.clientHeight;

		rendererObj.stackHelper.slice.intensityAuto =
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
		rendererObj.camera.orientation = rendererObj.sliceOrientation;
		rendererObj.camera.update();
		rendererObj.camera.fitBox(2, 1);

		rendererObj.stackHelper.orientation = rendererObj.camera.stackOrientation;
		rendererObj.stackHelper.index =
			Math.floor(rendererObj.stackHelper.orientationMaxIndex/2);
		rendererObj.scene.add(rendererObj.stackHelper);
	//	console.log(rendererObj.stackHelper);
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
	onYellowChanged: function() {
		
		this.updateLocalizer(this.r2, [this.r1.localizerHelper, this.r3.localizerHelper]);
		this.updateClipPlane(this.r2, this.clipPlane2);
	},
	onRedChanged: function() {
		this.updateLocalizer(this.r1, [this.r2.localizerHelper, this.r3.localizerHelper]);
		this.updateClipPlane(this.r1, this.clipPlane1);

		if (this.redContourHelper) {
			this.redContourHelper.geometry = this.r1.stackHelper.slice.geometry;
		}
	},
	onGreenChanged: function() {
		this.updateLocalizer(this.r3, [this.r1.localizerHelper, this.r2.localizerHelper]);
		this.updateClipPlane(this.r3, this.clipPlane3);
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
		this.r0.camera.aspect = this.r0.domElement.clientWidth / this.r0.domElement.clientHeight;
		this.r0.camera.updateProjectionMatrix();
		this.r0.renderer.setSize(
			this.r0.domElement.clientWidth, this.r0.domElement.clientHeight);

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
	onClick: function(event) {
		this.canvas = event.target.parentElement;
		this.id = event.target.id;
		this.mouse = {
			x: ((event.clientX - this.canvas.offsetLeft) / this.canvas.clientWidth) * 2 - 1,
			y: - ((event.clientY - this.canvas.offsetTop) / this.canvas.clientHeight) * 2 + 1,
		};
		//
		this.camera = null;
		this.stackHelper = null;
		this.scene = null;
		switch (this.id) {
			case '0':
			this.camera = this.r0.camera;
			this.stackHelper = this.r1.stackHelper;
			this.scene = this.r0.scene;
			break;

			case '1':
			this.camera = this.r1.camera;
			this.stackHelper = this.r1.stackHelper;
			this.scene = this.r1.scene;
			break;

			case '2':
			this.camera = this.r2.camera;
			this.stackHelper = this.r2.stackHelper;
			this.scene = this.r2.scene;
			break;

			case '3':
			this.camera = this.r3.camera;
			this.stackHelper = this.r3.stackHelper;
			this.scene = this.r3.scene;
			break;
		}
		this.raycaster = new THREE.Raycaster();
		this.raycaster.setFromCamera(this.mouse, this.camera);

		this.intersects = this.raycaster.intersectObjects(this.scene.children, true);
		if (this.intersects.length > 0) {
			if (this.intersects[0].object && this.intersects[0].object.objRef) {
				this.refObject = this.intersects[0].object.objRef;
				this.refObject.selected = !this.refObject.selected;

				this.color = this.refObject.color;
				if (this.refObject.selected) {
					this.color = 0xCCFF00;
				}

				// update materials colors
				this.refObject.material.color.setHex(this.color);
				this.refObject.materialFront.color.setHex(this.color);
				this.refObject.materialBack.color.setHex(this.color);
			}
		}
	},
	onDoubleClick: function(event) {

		this.canvas = event.target.parentElement;
		this.id = event.target.id;
		this.mouse = {
			x: ((event.clientX - this.canvas.offsetLeft) / this.canvas.clientWidth) * 2 - 1,
			y: - ((event.clientY - this.canvas.offsetTop - 52) / this.canvas.clientHeight) * 2 + 1,
		};
		//
		this.camera = null;
		this.stackHelper = null;
		this.scene = null;
		switch (this.id) {
			case '0':
			this.camera = this.r0.camera;
			this.stackHelper = this.r1.stackHelper;
			this.scene = this.r0.scene;
			break;

			case '1':
			this.camera = this.r1.camera;
			this.stackHelper = this.r1.stackHelper;
			this.scene = this.r1.scene;
			break;

			case '2':
			this.camera = this.r2.camera;
			this.stackHelper = this.r2.stackHelper;
			this.scene = this.r2.scene;
			break;

			case '3':
			this.camera = this.r3.camera;
			this.stackHelper = this.r3.stackHelper;
			this.scene = this.r3.scene;
			break;
		}
		this.raycaster = new THREE.Raycaster();
		this.raycaster.setFromCamera(this.mouse, this.camera);

		this.intersects = this.raycaster.intersectObjects(this.scene.children, true);
		
		if (this.intersects.length > 0) {
			this.ijk =
				CoreUtils.worldToData(this.stackHelper.stack.lps2IJK, this.intersects[0].point);

			this.r1.stackHelper.index =
				this.ijk.getComponent((this.r1.stackHelper.orientation + 2) % 3);
			this.r2.stackHelper.index =
				this.ijk.getComponent((this.r2.stackHelper.orientation + 2) % 3);
			this.r3.stackHelper.index =
				this.ijk.getComponent((this.r3.stackHelper.orientation + 2) % 3);

			this.onGreenChanged();
			this.onRedChanged();
			this.onYellowChanged();
		}
	},
	drawAnnotation:function(annotationUrl){
		//  console.log(this.allAnnoation[annotationUrl]);
		if(this.allAnnoation[annotationUrl]){
		//	console.log("duplicated");
		}
		else{
			const stlLoader = new THREE.STLLoader();
	        stlLoader.load(annotationUrl, (function(geometry) {
	        	var randomColor = parseInt ('0x'+Math.floor(Math.random()*16777215).toString(16),16);
	        	this.overlay={
	        		color: randomColor,
		        	opacity: 0.7
	        	};
	           this.overlay.material = new THREE.MeshLambertMaterial({
	            opacity: this.overlay.opacity,
	            color: this.overlay.color,
	            clippingPlanes: [],
	            transparent: true,
	          });
	          this.overlay.mesh = new THREE.Mesh(geometry, this.overlay.material);

	          this.overlay.mesh.objRef = this.overlay;
	         // object.mesh.scale.set(0.8, 0.8, 0.8);
	         // object.mesh.rotation.y = -1 * Math.PI; 
	         // object.mesh.rotation.x = -1 * Math.PI; 
	          const RASToLPS = new THREE.Matrix4();
	          RASToLPS.set(1, 0, 0, 0,
	                        0, 1, 0, 0,
	                        0, 0, -1, 0,
	                        0, 0, 0, -1);
	          this.overlay.mesh.position.set(-5,-10,10);
	          this.overlay.mesh.applyMatrix(RASToLPS);
	          this.r0.scene.add(this.overlay.mesh);
	          this.overlay.scene = new THREE.Scene();

	          // front
	          this.overlay.materialFront = new THREE.MeshBasicMaterial({
	                  color: this.overlay.color,
	                  side: THREE.FrontSide,
	                  depthWrite: true,
	                  opacity: 0,
	                  transparent: true,
	                  clippingPlanes: [],
	          });
	       //   object.materialFront.rotation.y = -1 * Math.PI; 
	       //   object.materialFront.rotation.x = -1 * Math.PI; 

	          this.overlay.meshFront = new THREE.Mesh(geometry, this.overlay.materialFront);

	          this.overlay.meshFront.applyMatrix(RASToLPS);
	          this.overlay.scene.add(this.overlay.meshFront);

	          // back
	          this.overlay.materialBack = new THREE.MeshBasicMaterial({
	                  color: this.overlay.color,
	                  side: THREE.BackSide,
	                  depthWrite: true,
	                  opacity: this.overlay.opacity,
	                  transparent: true,
	                  clippingPlanes: [],
	          });
	        //  object.materialBack.rotation.y = -1 * Math.PI; 
	        //  object.materialBack.rotation.x = -1 * Math.PI; 

	          this.overlay.meshBack = new THREE.Mesh(geometry, this.overlay.materialBack);
	          this.overlay.meshBack.applyMatrix(RASToLPS);
	          this.overlay.scene.add(this.overlay.meshBack);
	          this.sceneClip.add(this.overlay.scene);
	          
	          this.allAnnoation[annotationUrl] = this.overlay;
	        //  meshesLoaded++;

	          this.onGreenChanged();
	          this.onRedChanged();
	          this.onYellowChanged();

	          this.readyToOverlay = true;
	          this.readyToRemove = false;
	          console.log(this.allAnnoation);
	      }).bind(this));
	    }
	},
	removeAnnotation:function(annotationUrl){
		if(this.allAnnoation[annotationUrl]){
			this.operateOverlay = this.allAnnoation[annotationUrl];

			delete this.allAnnoation[annotationUrl];
			this.readyToOverlay = false;
			this.readyToRemove = true;
		}
		else{
			//	console.log("duplicated");
		}
	},

});

export default ami;