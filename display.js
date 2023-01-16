/*
 * Holds information about an X3D scene that can be used for device-controlled display orientation
 * This is prototype software and may change at any time without warning
 * An effort will be made to maintain backward compatibility


LICENSE
The MIT License (MIT)

Copyright (c) 2016 DrX3D

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
 */

function DeviceDisplay (x3dId, transformCompass, transformTilt, transformSpin, name, active, rlt, rrt) {
	if (x3dId == '') {return null; }
	this.x3d			= x3dId;
	this.id				= new Object();
	this.objects		= new Array();
	this.activeObject	= -1;
	this.addObject = function (compass, tilt, spin, name, active) {
			if (compass == '') {return;}
			if (tilt == '') {return; }
			if (spin == '') {return; }
			this.objects[this.objects.length] = {'compass':compass, 'tilt':tilt, 'spin':spin, 'name':name};
			if (active) {this.activeObject = this.objects.length-1; }
	};
	this.addObject(transformCompass, transformTilt, transformSpin, name, active);
	
	this.mode = 'mono';
	if (arguments.length == 8) {
		this.id.renderLeft	= rlt;
		this.id.renderRight	= rrt;
		this.mode = 'stereo';
	}
	return this;
}

degreeToRadiansFactor = Math.PI / 180;
function deg2rad(deg){return deg * degreeToRadiansFactor;}

// --> There can be only one stereo display. This section defines the global object
var Stereo = {
		'name':'DeviceDisplay',
		'version':1,
		'type':'mobile',
		'x3d':null,
		'runtime':null, 
		'mode':'mono',
		'view':{'left':null,'right':null}, 
		'last':{'W':0,'H':0}, 
		'orientation':{
			'sensor':0,
			'device':{'alpha':0,'beta':0,'gamma':0},
			'screen':null,
			'transform':{'compass':null, 'tilt':null, 'spin':null}
		}
	};
window.orientation = 0;

if (window.DeviceOrientationEvent) {
	Stereo.orientation.sensor = 1;
	if (window.orientation == null) {window.orientation = 180;}
	window.addEventListener('deviceorientation', 
							function(eventData) {
								Stereo.orientation.device.alpha = 360-eventData.alpha;
								Stereo.orientation.device.beta  = -eventData.beta;
								Stereo.orientation.device.gamma = eventData.gamma + 90;
								if (eventData.gamma < 0) {
									Stereo.orientation.device.gamma	= -Stereo.orientation.device.gamma;
								}
								Stereo.orientation.device.gamma = -Stereo.orientation.device.gamma;
							}, 
							false);
// --> Orientation notes
//		0) This is for Chrome. Firefox does not follow the same conventions!
//		1) Computed rotations are about transformed object coordinates
 } else {
	alert ('No Device Motion Sensor');
}

// --> Loads a particular X3D scene for stereogrpahic display.
//		o must be a DeviceDisplay object
//		Stereo is the global object for the stereo display
function loadStereographic (o) {
	Stereo.element = document.getElementById(o.x3d);
	Stereo.runtime = Stereo.element.runtime;

	Stereo.orientation.transform.compass	= document.getElementById(o.objects[o.activeObject].compass);
	Stereo.orientation.transform.tilt		= document.getElementById(o.objects[o.activeObject].tilt);
	Stereo.orientation.transform.spin		= document.getElementById(o.objects[o.activeObject].spin);
	if (o.mode == 'stereo') {
		Stereo.view.left = document.getElementById(o.id.renderLeft);
		Stereo.view.right = document.getElementById(o.id.renderRight);
		Stereo.last.W = +Stereo.runtime.getWidth();
		Stereo.last.H = +Stereo.runtime.getHeight();
		hw = Math.round(Stereo.last.W / 2);
		Stereo.view.left.setAttribute('dimensions',  hw + ' ' + Stereo.last.H + ' 4');
		Stereo.view.right.setAttribute('dimensions', hw + ' ' + Stereo.last.H + ' 4');
		Stereo.mode = 'stereo';
	}

	Stereo.runtime.exitFrame = function () {
		if (! Stereo.orientation.sensor) return;

		if (Stereo.mode == 'stereo') {
			var w = +Stereo.runtime.getWidth();
			var h = +Stereo.runtime.getHeight();
			if (w != Stereo.last.W || h != Stereo.last.H)
			{
				var half = Math.round(w / 2);
				Stereo.view.left.setAttribute('dimensions',  half + ' ' + h + ' 4');
				Stereo.view.right.setAttribute('dimensions', half + ' ' + h + ' 4');
				Stereo.last.W = w;
				Stereo.last.H = h;
			}
		}

		newOrientation = '0 1 0 ' + deg2rad(Stereo.orientation.device.alpha);
		Stereo.orientation.transform.compass.setAttribute("rotation", newOrientation);

		newOrientation = '1 0 0 ' + deg2rad(Stereo.orientation.device.gamma);
		Stereo.orientation.transform.tilt.setAttribute("rotation", newOrientation);

		newOrientation = '0 0 1 ' + deg2rad(Stereo.orientation.device.beta);
		Stereo.orientation.transform.spin.setAttribute("rotation", newOrientation);
	}
};
function fullscreen(cb) {
	//lens center auf null setzten
	Stereo.view.left = document.getElementById(cb.id.renderLeft);
	Stereo.view.right = document.getElementById(cb.id.renderRight);
	Stereo.view.left._x3domNode.lensCenter = 0;
	Stereo.view.right._x3domNode.lensCenter = 0;

	//fullscreen aktivieren
	if (Stereo.element.requestFullscreen) {
		alert ('General fullscreen');
		Stereo.element.requestFullscreen();
	 } else if (Stereo.element.msRequestFullscreen) {
		alert ('Microsoft fullscreen');
		Stereo.element.msRequestFullscreen();
	 } else if (Stereo.element.mozRequestFullScreen) {
		alert ('Mozilla fullscreen');
		Stereo.element.mozRequestFullScreen();
	 } else if (Stereo.element.webkitRequestFullscreen) {
		alert ('Webkit fullscreen');
		Stereo.element.webkitRequestFullscreen();
	}
}
