var Platform      = require('pex-sys').Platform;
var Time          = require('pex-sys').Time;
var Window        = require('pex-sys').Window;
var Color         = require('pex-color').Color;
var Vec3          = require('pex-geom').Vec3;
var Vec2          = require('pex-geom').Vec2;
var glu           = require('pex-glu');
var Camera        = require('pex-glu').PerspectiveCamera;
var Arcball       = require('pex-glu').Arcball;
var GUI           = require('pex-gui').GUI;
var fx            = require('pex-fx');
var Halo          = require('ora-halo');
var Texture2D     = require('pex-glu').Texture2D;

var ASSETS_PATH = Platform.isPlask ? '../assets' : 'assets';

var State = {
  halo: null,
  size: 0,
  color: 0,
  complexity: 0,
  brightness: 1,
  speed: 0.5,
  colorTextureIndex: 0,
}

function HaloSetMode(mode) {
  if (!State.halo) return;
  State.halo.setMode(name);
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

function HaloAddTimeStamp(params) {
  if (!State.halo) return;
  State.halo.addTimeStamp(params);
}

if (Platform.isBrowser) {
  window.HaloSetMode = HaloSetMode;
  window.HaloSetGlobalParam = HaloSetGlobalParam;
  window.HaloSetGlobalParams = HaloSetGlobalParams;
  window.HaloAddTimeStamp = HaloAddTimeStamp;
}

Window.create({
  settings: {
    width: 1280,
    height: 720,
    type: '3d',
    canvas: Platform.isBrowser ? document.getElementById('haloCanvas') : null
  },
  init: function() {
    State.halo = this.halo = new Halo({
      lineDotsTexture: ASSETS_PATH + '/textures/line-dots.png',
      lineSolidTexture: ASSETS_PATH + '/textures/line-solid.png',
      colorTexture: ASSETS_PATH + '/textures/calories-gradient.png'
    });

    this.initGUI();

    this.camera = new Camera(60, this.width / this.height);
    this.arcball = new Arcball(this, this.camera);
    this.arcball.setPosition(new Vec3(1,1,1))

    this.framerate(60);
  },
  initGUI: function() {
    this.gui = new GUI(this);
    if (Platform.isBrowser) this.gui.toggleEnabled();
    this.gui.addParam('Global size', State, 'size', {}, function(value) {
      this.halo.setGlobalParam('size', value);
    }.bind(this));
    this.gui.addParam('Global color', State, 'color', {}, function(value) {
      this.halo.setGlobalParam('color', value);
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
    }.bind(this));
  },
  drawScene: function() {
    this.gl.lineWidth(3);
    glu.clearColorAndDepth(Color.Black);
    this.halo.draw(this.camera);
    glu.enableBlending(false);
  },
  drawSceneGlow: function() {
    this.gl.lineWidth(4);
    glu.clearColorAndDepth(Color.Black);
    this.halo.drawSolid(this.camera);
    glu.enableBlending(false);
  },
  draw: function() {
    Time.verbose = true
    glu.clearColorAndDepth(Color.Black);
    glu.enableDepthReadAndWrite(true);

    this.halo.update();

    var color = fx().render({ drawFunc: this.drawScene.bind(this)});
    glow = color.render({ drawFunc: this.drawSceneGlow.bind(this)}).downsample4().downsample2().blur5().blur5();
    var final = color.add(glow, { scale: 0.75 });
    final.blit({ width: this.width, height: this.height });

    this.gui.draw();
  }
});
