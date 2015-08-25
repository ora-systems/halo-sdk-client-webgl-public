var Platform      = require('pex-sys').Platform;
var Time          = require('pex-sys').Time;
var Window        = require('pex-sys').Window;
var Color         = require('pex-color').Color;
var Vec3          = require('pex-geom').Vec3;
var Vec2          = require('pex-geom').Vec2;
var glu           = require('pex-glu');
var Camera        = require('pex-glu').PerspectiveCamera;
var Camera2D      = require('pex-glu').OrthographicCamera;
var Arcball       = require('pex-glu').Arcball;
var GUI           = require('pex-gui').GUI;
var fx            = require('fx');
var Halo          = require('ora-halo');
var Texture2D     = require('pex-glu').Texture2D;

var ASSETS_PATH = Platform.isPlask ? '../assets' : '/assets';

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
  debug: true
}

function HaloSetMode(mode) {
  if (!State.halo) return;
  State.halo.setMode(mode);
}

function HaloSetGlobalParam(name, value) {
  if (!State.halo) return;
  State.halo.setGlobalParam(name, value);
}

function HaloSetGlobalParams(params) {
  if (!State.halo) return;
  Object.keys(params).forEach(function(paramName) {
    HaloSetGlobalParam(paramName, params[paramName]);
  });
}

function HaloResetCamera(mode) {
  if (!State.arcball) return;
  State.arcball.setPosition(new Vec3(1,1,1))
}

function HaloAddTimeStamp(params) {
  if (!State.halo) return;
  State.halo.addTimeStamp(params);
}

function HaloInitialize(opts) {
  opts = opts || { };
  if (opts.assetsPath) {
    ASSETS_PATH = opts.assetsPath;
  }
  Window.create({
    settings: {
      width: 1280,
      height: 720,
      type: '3d',
      canvas: Platform.isBrowser ? document.getElementById('haloCanvas') : null,
      fullscreen: opts.fullscreen,
      highdpi: Platform.isiOS ? 2 : 1
    },
    init: function() {
      State.halo = this.halo = new Halo({
        lineDotsTexture: ASSETS_PATH + '/textures/line-dots.png',
        lineSolidTexture: ASSETS_PATH + '/textures/line-solid.png',
        colorTexture: ASSETS_PATH + '/textures/calories-gradient.png',
        gridColorTexture: ASSETS_PATH + '/textures/line-solid.png',
      });

      this.halo.setGlobalParam('size', State.size);
      this.halo.setGlobalParam('color', State.color);
      this.halo.setGlobalParam('colorCenter', State.colorCenter);
      this.halo.setGlobalParam('colorCenterRatio', State.colorCenterRatio);
      this.halo.setGlobalParam('complexity', State.complexity);
      this.halo.setGlobalParam('speed', State.speed);
      this.halo.setGlobalParam('brightness', State.brightness);
      this.halo.setGlobalParam('wobble', State.wobble);

      this.initGUI();

      if (Platform.isiOS) {
        this.on('mouseDragged', function(e) {
          if (e.y > this.height * 0.8) {
            e.handled = true;
            this.halo.setGlobalParam('complexity', e.x / this.width);
            this.halo.setGlobalParam('color', e.x / this.width * 0.9);
            this.halo.setGlobalParam('size', e.x / this.width);
          }
        }.bind(this));
      }

      this.on('resize', function() {
        State.camera.setAspectRatio(this.width/this.height);
        this.gl.viewport(0, 0, this.width, this.height);
      }.bind(this))

      State.camera = new Camera(60, this.width / this.height);
      State.camera2D = new Camera2D(0, 0, this.width, this.height);
      State.arcball = new Arcball(this, State.camera);
      State.arcball.setPosition(new Vec3(0,3,0));

      this.framerate(60);
    },
    initGUI: function() {
      this.gui = new GUI(this);
      if (Platform.isBrowser && (opts.gui !== true)) this.gui.toggleEnabled();
      else if (Platform.isiOS) this.gui.toggleEnabled();
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
      this.colorTexturePaths = [
       ASSETS_PATH + '/textures/calories-gradient.png',
       ASSETS_PATH + '/textures/halo-gradient-continuous.png',
       ASSETS_PATH + '/textures/halo-gradient.png'
      ]
      this.colorTextures = this.colorTexturePaths.map(function(path) {
        return Texture2D.load(path);
      });

      this.gui.addTextureList('Color textures', State, 'colorTextureIndex', this.colorTextures.map(function(tex, index) {
        return { 'name': index, texture: tex, value: index }
      }), 3, function(index) {
        this.halo.setColorTexture(this.colorTexturePaths[index])
      }.bind(this))

      this.on('keyDown', function(e) {
        if (e.str == 'G') {
          this.gui.toggleEnabled();
        }
        if (e.str == 'd') {
          State.debug = true;
        }
      }.bind(this));
    },
    drawScene: function() {
      this.gl.lineWidth(2);
      glu.clearColorAndDepth(Color.Black);
      this.halo.draw(State.camera, State.camera2D, this.width, this.height);
      glu.enableBlending(false);
    },
    drawSceneGlow: function() {
      this.gl.lineWidth(3);
      glu.clearColorAndDepth(Color.Black);
      this.halo.drawSolid(State.camera, State.camera2D, this.width, this.height);
      glu.enableBlending(false);
    },
    draw: function() {
      Time.verbose = true
      glu.clearColorAndDepth(Color.Black);
      glu.enableDepthReadAndWrite(true);

      var W = this.width;
      var H = this.height;

      if (State.debug) { console.log('---') }

      if (State.debug) { this.gl.finish(); console.time('frame'); }

      if (State.debug) { this.gl.finish(); console.time('update'); }
      this.halo.update();
      if (State.debug) { this.gl.finish(); console.timeEnd('update'); }

      if (State.debug) { this.gl.finish(); console.time('halo'); }
      var color = fx()
        .render({ drawFunc: this.drawScene.bind(this), width: W, height: H});
      if (State.debug) { this.gl.finish(); console.timeEnd('halo'); }

      if (State.debug) { this.gl.finish(); console.time('fx'); }
      glow = color
        .render({ drawFunc: this.drawSceneGlow.bind(this)})
        .downsample4()
        .downsample2()
        .blur5()
        .blur5();
      var final = color
        .add(glow, { scale: 0.75});
      final.blit({ width: W, height: H });
      if (State.debug) { this.gl.finish(); console.timeEnd('fx'); }

      if (State.debug) { this.gl.finish(); console.time('gui'); }
      this.gui.draw();
      if (State.debug) { this.gl.finish(); console.timeEnd('gui'); }

      if (State.debug) { this.gl.finish(); console.timeEnd('frame'); }

      if (State.debug) { State.debug = false; }
    }
  });
}

if (Platform.isBrowser) {
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
    size: 0.6,
    color: 0.05,
    complexity: 0.6,
    speed: 0.5,
    brightness: 1,
    wobble: 0.1
  })
}

