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
var fx            = require('fx');
var Halo          = require('ora-halo');
var Texture2D     = require('pex-glu').Texture2D;
var R             = require('ramda');

var ASSETS_PATH = Platform.isPlask ? '../assets' : '/assets';

var State = {
  halo: null,
  camera: null,
  arcball: null,
  size: 0.6,
  color: 0.05,
  complexity: 0.7,
  brightness: 1,
  speed: 0.5,
  colorTextureIndex: 0,
  wobble: 0,
  debug: true,

  //stratified halo
  compactness: 1,
  maxNumRings: 12,
  centerHeight: 0,
  minCycles: 5,
  maxCycles: 10,
  stratifiedAmplitude: 0.5,
  minRingWidth: 0.02,
  maxRingWidth: 0.1,
  timelineTransparency: false,

  //ring
  ringIndex: -1,
  ringSpeed: 0,
  ringColor: 0,
  ringComplexity: 0
}

function HaloSetMode(mode) {
  if (!State.halo) return;
  State.halo.setMode(mode);
}

function HaloSetGlobalParam(name, value) {
  if (!State.halo) return;
  State.halo.setGlobalParam(name, value);
}

function HaloSetRingParam(ringIndex, name, value) {
  if (!State.halo) return;
  State.halo.setRingParam(ringIndex, name, value);
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
        colorTexture: ASSETS_PATH + '/textures/calories-gradient.png'
      });

      this.halo.setGlobalParam('size', State.size);
      this.halo.setGlobalParam('color', State.color);
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
      State.arcball = new Arcball(this, State.camera);
      State.arcball.setPosition(new Vec3(5,5,5));

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

      this.gui.addSeparator();
      this.gui.addHeader('Stratified / "timeline"')
      this.gui.addParam('Num rings', State, 'maxNumRings', { min: 0, max: 60, step: 1 }, function(value) {
        HaloSetMode('timeline');
        this.halo.setGlobalParam('maxNumRings', value);
        for(var i=0; i<value; i++) {
          HaloAddTimeStamp({
            color: 0.2 + 0.8 * Math.random(),
            complexity: 0, //0.2 + 0.8 * Math.random(),
            speed: 0.2 + 0.8 * Math.random()
          })
        }
      }.bind(this));
      this.gui.addParam('Transparency', State, 'timelineTransparency', {}, function(value) {
        this.halo.setGlobalParam('timelineTransparency', value);
      }.bind(this));
      this.gui.addParam('Stratified amplitude', State, 'stratifiedAmplitude', { min: 0, max: 2 }, function(value) {
        this.halo.setGlobalParam('stratifiedAmplitude', value);
      }.bind(this));
      this.gui.addParam('Compactness', State, 'compactness', { min: 1, max: 3 }, function(value) {
        this.halo.setGlobalParam('compactness', value);
      }.bind(this));
      this.gui.addParam('Center height', State, 'centerHeight', { min: 0, max: 2 }, function(value) {
        this.halo.setGlobalParam('centerHeight', value);
      }.bind(this));
      this.gui.addParam('Min cycles', State, 'minCycles', { min: 0, max: 40 }, function(value) {
        this.halo.setGlobalParam('minCycles', value);
      }.bind(this));
      this.gui.addParam('Max cycles', State, 'maxCycles', { min: 0, max: 40 }, function(value) {
        this.halo.setGlobalParam('maxCycles', value);
      }.bind(this));
      this.gui.addParam('Min ring width', State, 'minRingWidth', { min: 0, max: 0.2 }, function(value) {
        this.halo.setGlobalParam('minRingWidth', value);
      }.bind(this));
      this.gui.addParam('Max ring width', State, 'maxRingWidth', { min: 0, max: 0.5 }, function(value) {
        this.halo.setGlobalParam('maxRingWidth', value);
      }.bind(this));

      this.gui.addHeader('Ring').setPosition(this.width - 180, 10)

      this.gui.addParam('Ring color', State, 'ringColor', { min: 0, max: 1 }, function(value) {
        this.halo.setRingParam(State.ringIndex, 'color', value);
      }.bind(this));
      this.gui.addParam('Ring complexity', State, 'ringComplexity', { min: 0, max: 1 }, function(value) {
        this.halo.setRingParam(State.ringIndex, 'complexity', value);
      }.bind(this));
      this.gui.addParam('Ring speed', State, 'ringSpeed', { min: 0, max: 1 }, function(value) {
        this.halo.setRingParam(State.ringIndex, 'speed', value);
      }.bind(this));
      var ringIndexList = R.range(0, 24).map(function(i) {
        return { name: '' + i, value: i };
      });
      ringIndexList.unshift({ name: 'All', value: -1 })
      this.gui.addRadioList('Ring', State, 'ringIndex', ringIndexList, function(value) {
        var inst = this.halo.ringInstances[value];
        if(inst) {
          State.ringColor = inst.uniforms.color;
          State.ringComplexity = inst.uniforms.complexity;
          State.ringSpeed = inst.uniforms.speed;
        }
      }.bind(this));

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
      this.halo.draw(State.camera);
      glu.enableBlending(false);
    },
    drawSceneGlow: function() {
      this.gl.lineWidth(3);
      glu.clearColorAndDepth(Color.Black);
      this.halo.drawSolid(State.camera);
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
        .render({ drawFunc: this.drawScene.bind(this), width: W, height: H, depth: true});
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
  HaloSetMode('timeline')
  HaloSetGlobalParam('maxNumRings', 12); //e.g. every 2h
  HaloSetGlobalParam('maxRingRadius', 3);

  for(var i=0; i<12; i++) {
    HaloAddTimeStamp({
      color: 0.2 + 0.8 * Math.random(),
      complexity: i/12,
      speed: 0.2 + 0.8 * Math.random()
    })
  }
}

