var Platform      = require('pex-sys').Platform;
var Time          = require('pex-sys').Time;
var Window        = require('pex-sys').Window;
var Color         = require('pex-color').Color;
var Geometry      = require('pex-geom').Geometry;
var Vec3          = require('pex-geom').Vec3;
var Vec2          = require('pex-geom').Vec2;
var glu           = require('pex-glu');
var Mesh          = require('pex-glu').Mesh;
var Texture2D     = require('pex-glu').Texture2D;
var Camera        = require('pex-glu').PerspectiveCamera;
var Arcball       = require('pex-glu').Arcball;
var SolidColor    = require('pex-materials').SolidColor;
var Textured      = require('pex-materials').Textured;
var ShowTexCoords = require('pex-materials').ShowTexCoords;

var Halo          = require('ora-halo');

var ASSETS_PATH = Platform.isPlask ? '../assets' : 'assets';

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
      colorTexture: ASSETS_PATH + '/textures/calories-gradient.png'
    });

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
  }
});
