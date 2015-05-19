var sys = require('pex-sys');
var glu = require('pex-glu');
var materials = require('pex-materials');
var color = require('pex-color');
var gen = require('pex-gen');

var Mesh = glu.Mesh;
var PerspectiveCamera = glu.PerspectiveCamera;
var Arcball = glu.Arcball;
var Color = color.Color;
var Platform = sys.Platform;

var Geometry   = require('pex-geom').Geometry;
var Vec3       = require('pex-geom').Vec3;
var Vec2       = require('pex-geom').Vec2;
var Mesh       = require('pex-glu').Mesh;
var Texture2D  = require('pex-glu').Texture2D;
var SolidColor = require('pex-materials').SolidColor;
var Textured   = require('pex-materials').Textured;
var ShowTexCoords = require('pex-materials').ShowTexCoords;
var makeCircle = require('make-circle');

var ASSETS_PATH = Platform.isPlask ? '../assets' : 'assets';

sys.Window.create({
  settings: {
    width: 1280,
    height: 720,
    type: '3d',
    fullscreen: Platform.isBrowser ? true : false
  },
  init: function() {
    var circlePoints = makeCircle(1, 64, 'x', 'z', true);
    var circleEdges = circlePoints.map(function(v, i) { return [ i, (i+1) % circlePoints.length ]});
    circleEdges.pop(); //drop last edge
    var circleTexCoords = circlePoints.map(function(v, i) { return new Vec2(i/circlePoints.length, 0)});

    var g = new Geometry({ vertices: circlePoints, edges: circleEdges, texCoords: circleTexCoords });
    var mat = new Textured({ scale: new Vec2(100, 1), texture: Texture2D.load(ASSETS_PATH + '/textures/Dots2.png', { repeat: true })} );
    this.mesh = new Mesh(g, mat, { lines: true });

    this.camera = new PerspectiveCamera(60, this.width / this.height);
    this.arcball = new Arcball(this, this.camera);
  },
  draw: function() {
    glu.clearColorAndDepth(Color.Black);
    glu.enableDepthReadAndWrite(true);

    this.gl.lineWidth(4);
    this.mesh.draw(this.camera);
  }
});
