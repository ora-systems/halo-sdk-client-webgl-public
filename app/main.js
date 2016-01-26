var Window        = require('pex-sys/Window');
var Color         = require('pex-color');
var Vec3          = require('pex-math/Vec3');
var Vec2          = require('pex-math/Vec2');
var Camera        = require('pex-cam').PerspCamera;
var Camera2D      = require('pex-cam').OrthoCamera;
var Arcball       = require('pex-cam').Arcball;
var GUI           = require('pex-gui');
//var fx            = require('fx'); //TODO:fx
var Halo          = require('ora-halo');
var isBrowser     = require('is-browser');
var isiOS         = require('is-ios');

var ASSETS_PATH = isBrowser ? '/assets' : '../assets';

var State = {
  halo: null,
  camera: null,
  arcball: null,
  size: 0.6,
  color: 0.05,
  colorCenter: 0.0,
  colorCenterRatio: 0.0,
  complexity: 0.7,
  brightness: 1,
  speed: 0.5,
  colorTextureIndex: 0,
  wobble: 0,
  debug: true,
  growth: 0.01,
  background: [0,0,0,1],
  glow: 0.75,
  growth: 0.05
}

function HaloSetMode(mode) {
  if (!State.halo) return;
  State.halo.setMode(mode);
}

function HaloSetGlobalParam(name, value) {
  if (!State.halo) return;

  if (name == 'scale') {
      State.camera.setFov(value);
  }
  else {
      State.halo.setGlobalParam(name, value);
  }
}

function HaloSetGlobalParams(params) {
  if (!State.halo) return;
  Object.keys(params).forEach(function(paramName) {
    HaloSetGlobalParam(paramName, params[paramName]);
  });
}

function HaloResetCamera(mode) {
  if (!State.arcball) return;
  State.arcball.setPosition([1,1,1])
}

function HaloAddTimeStamp(params) {
  if (!State.halo) return;
  State.halo.addTimeStamp(params);
}

function HaloInitialize(userOpts) {
  console.log('HaloInitialize', userOpts)
  opts = {
    width: 1280,
    height: 720,
    scale: 60
  };
  for (var p in userOpts) {
    if (userOpts.hasOwnProperty(p)) {
      opts[p] = userOpts[p];
    }
  }

  if (opts.assetsPath) {
    ASSETS_PATH = opts.assetsPath;
  }
  Window.create({
    settings: {
      width: opts.width,
      height: opts.height,
      type: '3d',
      canvas: isBrowser ? document.getElementById('haloCanvas') : null,
      fullscreen: opts.fullscreen,
      highdpi: isiOS ? 2 : 1
    },
    init: function() {
      var ctx = this.getContext();
      var width = this.getWidth();
      var height = this.getHeight();

      State.halo = this.halo = new Halo(ctx, this, {
        lineDotsTexture: isBrowser ? require('../assets/textures/line-dots.png') : ASSETS_PATH + '/textures/line-dots.png',
        lineSolidTexture: isBrowser ? require('../assets/textures/line-solid.png') : ASSETS_PATH + '/textures/line-solid.png',
        colorTexture: isBrowser ? require('../assets/textures/calories-gradient.png') : ASSETS_PATH + '/textures/calories-gradient.png',
        gridColorTexture: isBrowser ? require('../assets/textures/line-solid.png') : ASSETS_PATH + '/textures/line-solid.png',
      });

      this.halo.setGlobalParam('size', State.size);
      this.halo.setGlobalParam('color', State.color);
      this.halo.setGlobalParam('colorCenter', State.colorCenter);
      this.halo.setGlobalParam('colorCenterRatio', State.colorCenterRatio);
      this.halo.setGlobalParam('complexity', State.complexity);
      this.halo.setGlobalParam('speed', State.speed);
      this.halo.setGlobalParam('brightness', State.brightness);
      this.halo.setGlobalParam('wobble', State.wobble);
      this.halo.setGlobalParam('background', State.background);
      this.halo.setGlobalParam('growth', State.growth);
      this.halo.setGlobalParam('glow', State.glow);

      this.initGUI();

      //TODO: if (isiOS) {
      //  this.on('mouseDragged', function(e) {
      //    if (e.y > this.getHeight() * 0.8) {
      //      e.handled = true;
      //      this.halo.setGlobalParam('complexity', e.x / this.getWidth());
      //      this.halo.setGlobalParam('color', e.x / this.getWidth() * 0.9);
      //      this.halo.setGlobalParam('size', e.x / this.getWidth());
      //    }
      //  }.bind(this));
      //}

      var fov = opts.scale;

      State.camera = new Camera(fov, width / height);
      State.camera.setPosition([0,3,0]); //TODO: State.arcball.setPosition([0,3,0]);
      State.camera.setUp([0,0,1]); //TODO: State.arcball.setPosition([0,3,0]);
      State.camera2D = new Camera2D(0, 0, width, height);
      State.arcball = new Arcball(State.camera, width, height);

      ctx.setProjectionMatrix(State.camera.getProjectionMatrix());
      ctx.setViewMatrix(State.camera.getViewMatrix())
      this.addEventListener(State.arcball);
    },
    onWindowResize: function() {
        State.camera.setAspectRatio(this.getWidth()/this.getHeight());
        this.ctx.viewport(0, 0, this.getWidth(), this.getHeight());
    },
    initGUI: function() {
      this.gui = new GUI(this.getContext(), this.getWidth(), this.getHeight());
      if (isBrowser && (opts.gui !== true)) this.gui.toggleEnabled();
      else if (isiOS) this.gui.toggleEnabled();
      this.gui.addParam('Global size', State, 'size', {}, function(value) {
        this.halo.setGlobalParam('size', value);
      }.bind(this));
      this.gui.addParam('Global color', State, 'color', {}, function(value) {
        this.halo.setGlobalParam('color', value);
      }.bind(this));
      this.gui.addParam('Global color center', State, 'colorCenter', {}, function(value) {
        this.halo.setGlobalParam('colorCenter', value);
      }.bind(this));
      this.gui.addParam('Global color center ratio', State, 'colorCenterRatio', {}, function(value) {
        this.halo.setGlobalParam('colorCenterRatio', value);
      }.bind(this));
      this.gui.addParam('Global complexity', State, 'complexity', {}, function(value) {
        this.halo.setGlobalParam('complexity', value);
      }.bind(this));
      this.gui.addParam('Global speed', State, 'speed', {}, function(value) {
        this.halo.setGlobalParam('speed', value);
      }.bind(this));
      this.gui.addParam('Global brightness', State, 'brightness', {}, function(value) {
        this.halo.setGlobalParam('brightness', value);
      }.bind(this));
      this.gui.addParam('Global wobble', State, 'wobble', {}, function(value) {
        this.halo.setGlobalParam('wobble', value);
      }.bind(this));
      this.gui.addParam('Global background', State, 'background', {}, function(value) {
        this.halo.setGlobalParam('background', value);
      }.bind(this));
      this.gui.addParam('Global glow', State, 'glow', {}, function(value) {
        this.halo.setGlobalParam('glow', value);
      }.bind(this));
      this.gui.addParam('Global growth', State, 'growth', {}, function(value) {
        this.halo.setGlobalParam('growth', value);
      }.bind(this));

      //TODO: this.gui.addTexture2D('Color texture', this.halo.colorTexture);
      //TODO: this.gui.addTexture2D('Color spectrum (overrides texture)', this.halo.colorSpectrumTexture);
    },
    onKeyDown: function(e) {
        if (e.str == 'G') {
          //TODO: this.gui.toggleEnabled();
        }
        if (e.str == 'd') {
          State.debug = true;
        }
    },
    drawScene: function() {
      var ctx = this.getContext();
      ctx.pushViewMatrix();
      ctx.setViewMatrix(State.camera.getViewMatrix())
      ctx.setLineWidth(2);
      ctx.setClearColor(this.halo.background[0], this.halo.background[1], this.halo.background[2], this.halo.background[3])
      ctx.clear(ctx.COLOR_BIT | ctx.DEPTH_BIT);
      this.halo.draw(State.camera, State.camera2D, this.getWidth(), this.getHeight());
      ctx.setBlend(false);
      ctx.popViewMatrix();
    },
    drawSceneGlow: function() {
      var ctx = this.getContext();
      ctx.pushViewMatrix();
      ctx.setViewMatrix(State.camera.getViewMatrix())
      ctx.setLineWidth(3);
      ctx.setClearColor(this.halo.background[0], this.halo.background[1], this.halo.background[2], this.halo.background[3])
      ctx.clear(ctx.COLOR_BIT | ctx.DEPTH_BIT);
      this.halo.drawSolid(State.camera, State.camera2D, this.getWidth(), this.getHeight());
      ctx.setBlend(false);
      ctx.popViewMatrix();
    },
    draw: function() {
      var ctx = this.getContext();
      //TODO: glu.clearColorAndDepth(this.halo.background[0], this.halo.background[1], this.halo.background[2], 1.0);
      //TODO: glu.enableDepthReadAndWrite(true);

      var W = this.getWidth();
      var H = this.getHeight();

      if (State.debug) { console.log('---') }

      State.arcball.apply()

      this.halo.update();

      this.drawScene(); //TODO: var color = fx().render({ drawFunc: this.drawScene.bind(this), width: W, height: H});
      //TODO: glu.enableAlphaBlending(false);
      //glow = color
        //.render({ drawFunc: this.drawSceneGlow.bind(this)})
        //.downsample4()
        //.downsample2()
        //.blur5()
        //.blur5();
      //var final = color
        //.add(glow, { scale: this.halo.glow});

      var blackBackground = ((this.halo.background[0] + this.halo.background[1] + this.halo.background[2]) == 0);

      ctx.setClearColor(this.halo.background[0], this.halo.background[1], this.halo.background[2], 1)
      //TODO: if (!blackBackground) {
        //TODO: glu.enableAlphaBlending(true);
      //}
      //TODO: final.blit({ width: W, height: H });
      //

      this.gui.draw();
    }
  });
}

if (isBrowser) {
  window.HaloSetMode = HaloSetMode;
  window.HaloSetGlobalParam = HaloSetGlobalParam;
  window.HaloSetGlobalParams = HaloSetGlobalParams;
  window.HaloAddTimeStamp = HaloAddTimeStamp;
  window.HaloInitialize = HaloInitialize;
  window.HaloResetCamera = HaloResetCamera;
}
else {
  HaloInitialize();
  HaloSetMode('present')
  HaloSetGlobalParams({
    size: 1,
    color: 0.67,
    complexity: 0.7,
    speed: 0.5,
    brightness: 1,
    wobble: 0.1,
    background: '000000',
    growth: 0.05,
    scale: 120
    //spectrum: ['FF0000', '00FF00', '0000FF']
  })
}
