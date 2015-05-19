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
var Halo          = require('ora-halo');

var ASSETS_PATH = Platform.isPlask ? '../assets' : 'assets';

var State = {
  color: 0
}

Window.create({
  settings: {
    width: 1280,
    height: 720,
    type: '3d',
    fullscreen: Platform.isBrowser ? true : false
  },
  init: function() {
    this.halo = new Halo({
      lineTexture: ASSETS_PATH + '/textures/dots.png',
      colorTexture: ASSETS_PATH + '/textures/halo-gradient-continuous.png'
    });

    this.gui = new GUI(this);
    this.gui.addParam('Global Color', State, 'color', {}, function(value) {
      this.halo.setGlobalParam('color', value);
    }.bind(this));

    this.camera = new Camera(60, this.width / this.height);
    this.arcball = new Arcball(this, this.camera);

    this.framerate(60);
  },
  draw: function() {
    Time.verbose = true
    glu.clearColorAndDepth(Color.Black);
    glu.enableDepthReadAndWrite(true);

    this.gl.lineWidth(4);
    this.halo.draw(this.camera);

    this.gui.draw();
  }
});
