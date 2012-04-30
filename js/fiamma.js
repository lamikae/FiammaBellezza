(function() {
  /*
  Fiamma Bellezza - HTML5 audio & WebGL showcase.
  Copyright (C) 2012  lamikae
  
  This program is free software: you can redistribute it and/or modify
  it under the terms of the GNU General Public License as published by
  the Free Software Foundation, either version 3 of the License, or
  (at your option) any later version.
  
  This program is distributed in the hope that it will be useful,
  but WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
  GNU General Public License for more details.
  
  You should have received a copy of the GNU General Public License
  along with this program.  If not, see <http://www.gnu.org/licenses/>.
  */  window.FiammaBellezza = (function() {
    var L, SCREEN_HEIGHT, SCREEN_WIDTH, SPARK_COUNT, animate, audio, audioAvailable, audioSrc, camera, canvas, channels, context, duration, fft, flameHSV, flameLifetime, flamePosition, frameBufferLength, greets, initSparks, l, loadedMetadata, nextGreet, rate, render, renderer, samples, scene, showCredits, showStats, spectrumDisplayEnabled, stats, threexSparks, toggleFrameFullscreen, _currentGreet;
    SCREEN_WIDTH = window.innerWidth;
    SCREEN_HEIGHT = window.innerHeight;
    audio = document.createElement("audio");
    audioSrc = "audio/Johann_Sebastian_Bach_-_partita_no._3_in_e_major,_bwv_1006_-_1._preludio.ogg";
    canvas = document.createElement("canvas");
    canvas.id = "fft";
    context = canvas.getContext("2d");
    spectrumDisplayEnabled = false;
    if (!spectrumDisplayEnabled) {
      canvas.style.visibility = "hidden";
    }
    duration = null;
    channels = null;
    rate = null;
    frameBufferLength = null;
    samples = null;
    fft = null;
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(35, SCREEN_WIDTH / SCREEN_HEIGHT, 1, 1024);
    renderer = null;
    stats = new Stats();
    showStats = false;
    threexSparks = [];
    SPARK_COUNT = 64;
    L = 256;
    l = 20;
    function FiammaBellezza() {
      var container, offset;
      if (Detector.webgl) {
        renderer = new THREE.WebGLRenderer({
          antialias: true,
          preserveDrawingBuffer: true
        });
      } else {
        Detector.addGetWebGLMessage();
        return true;
      }
      container = document.getElementById("container");
      container.style.width = "" + SCREEN_WIDTH + "px";
      container.style.height = "" + SCREEN_HEIGHT + "px";
      document.body.appendChild(container);
      container.appendChild(canvas);
      renderer.setSize(SCREEN_WIDTH, SCREEN_HEIGHT);
      container.appendChild(renderer.domElement);
      if (Modernizr.audio.ogg) {
        audio.src = audioSrc;
      }
      if (audio.src) {
        audio.controls = true;
        audio.preload = "auto";
        audio.autobuffer = true;
        document.body.appendChild(audio);
        audio.onended = showCredits;
      }
      camera.position.set(0, 0, 100);
      camera.lookAt(scene.position);
      scene.add(camera);
      stats.domElement.style.position = 'absolute';
      stats.domElement.style.top = '2px';
      stats.domElement.style.left = '7px';
      stats.domElement.style.zIndex = 100;
      container.appendChild(stats.domElement);
      if (!showStats) {
        stats.domElement.style.visibility = "hidden";
      }
      audio.addEventListener('MozAudioAvailable', audioAvailable, false);
      audio.addEventListener('loadedmetadata', loadedMetadata, false);
      THREEx.WindowResize.bind(renderer, camera);
      document.getElementById("inlineDoc").style.cssText = "";
      document.getElementById("inlineDoc").style.display = "visible";
      if (window !== window.top) {
        offset = window.parent.document.getElementById("demobar").offsetHeight;
        audio.style.bottom = "" + (offset + 5) + "px";
        document.getElementById("inlineDoc").style.bottom = "" + offset + "px";
        document.getElementById('debugKey').style.display = "none";
        window.parent.onkeydown = function(event) {
          switch (event.keyCode) {
            case 70:
              return toggleFrameFullscreen();
          }
        };
      } else {
        if (THREEx.FullScreen.available()) {
          THREEx.FullScreen.bindKey();
        } else {
          document.getElementById('fullscreenKey').style.display = "none";
        }
      }
      setTimeout(function() {
        document.getElementById('info').style.opacity = 0;
        return setTimeout(nextGreet, 2000);
      }, 4000);
      animate();
    }
    toggleFrameFullscreen = function() {
      if (!window.parent.fullScreen) {
        return window.parent.document.getElementById("demoframe").mozRequestFullScreen();
      } else {
        return window.parent.document.mozCancelFullScreen();
      }
    };
    document.onkeydown = function(event) {
      switch (event.keyCode) {
        case 83:
          spectrumDisplayEnabled = !spectrumDisplayEnabled;
          showStats = spectrumDisplayEnabled;
          if (spectrumDisplayEnabled) {
            canvas.style.visibility = "visible";
            return stats.domElement.style.visibility = "visible";
          } else {
            canvas.style.visibility = "hidden";
            return stats.domElement.style.visibility = "hidden";
          }
          break;
        case 70:
          if (window !== window.top) {
            return toggleFrameFullscreen();
          }
      }
    };
    loadedMetadata = function() {
      duration = audio.duration;
      channels = audio.mozChannels;
      rate = audio.mozSampleRate;
      frameBufferLength = audio.mozFrameBufferLength;
      fft = new FFT(frameBufferLength / channels, rate);
      audio.play();
      return initSparks();
    };
    initSparks = function() {
      var N, acceleration, colorsizeInitializer, drift, dy, emitter, offset_x, offset_y, position, sparkPositions, sparks, velocity, _i, _j, _len, _results, _results2;
      N = 12;
      dy = L / N;
      offset_x = 0;
      offset_y = -(l / 2) - 15;
      sparkPositions = (function() {
        _results = [];
        for (var _i = 1; 1 <= N ? _i <= N : _i >= N; 1 <= N ? _i++ : _i--){ _results.push(_i); }
        return _results;
      }).apply(this).map(function(n) {
        var center, max, min, vx, __n;
        if (n <= N / 2) {
          min = (dy * (n - 1)) * 2 * l / L + offset_y;
          max = ((dy * n) - 1) * 2 * l / L + offset_y;
          vx = -8;
        } else {
          __n = n - N / 2;
          min = (dy * (__n - 1)) * 2 * l / L + offset_y;
          max = ((dy * __n) - 1) * 2 * l / L + offset_y;
          vx = 16;
        }
        center = (max + min) / 2;
        return {
          min: min,
          max: max,
          center: center,
          vx: vx
        };
      });
      colorsizeInitializer = new function() {
        return {
          initialize: function(emitter, particle) {
            particle.target.color().setHSV(0.12, 1.9, 0.9);
            return particle.target.size(96);
          }
        };
      };
      _results2 = [];
      for (_j = 0, _len = sparkPositions.length; _j < _len; _j++) {
        position = sparkPositions[_j];
        sparks = new THREEx.Sparks({
          maxParticles: 768,
          counter: new SPARKS.SteadyCounter(SPARK_COUNT)
        });
        emitter = sparks.emitter();
        if (position.center < 10) {
          velocity = new THREE.Vector3(0, 0, 0);
        } else {
          velocity = new THREE.Vector3(position.vx, Math.random() * 2, 0);
        }
        drift = new SPARKS.RandomDrift(128, 64, 0);
        acceleration = new SPARKS.Accelerate(Math.random(), 2, 0);
        emitter.addInitializer(colorsizeInitializer);
        emitter.addInitializer(new SPARKS.Position(new SPARKS.PointZone(new THREE.Vector3(offset_x, position.center, 0))));
        emitter.addInitializer(new SPARKS.Velocity(new SPARKS.PointZone(velocity)));
        emitter.addInitializer(new SPARKS.Lifetime(0, 0));
        emitter.addAction(new SPARKS.Age());
        emitter.addAction(new SPARKS.Move());
        emitter.addAction(drift);
        emitter.addAction(acceleration);
        emitter.start();
        scene.add(sparks.container());
        _results2.push(threexSparks.push(sparks));
      }
      return _results2;
    };
    animate = function() {
      requestAnimationFrame(animate);
      render();
      if (showStats) {
        return stats.update();
      }
    };
    render = function() {
      var sparks, _i, _len;
      for (_i = 0, _len = threexSparks.length; _i < _len; _i++) {
        sparks = threexSparks[_i];
        sparks.update();
      }
      renderer.context.depthMask(true);
      return renderer.render(scene, camera);
    };
    audioAvailable = function(event) {
      var color, emitter, i, idx, lifetime, magnitude, particle, pos, signal, sparkIndices, sparks, time, _i, _len, _pos, _ref, _ref2, _ref3, _results;
      if (frameBufferLength === null) {
        return;
      }
      samples = event.frameBuffer;
      time = event.time;
      signal = new Float32Array(samples.length / channels);
      for (i = 0, _ref = frameBufferLength / 2; 0 <= _ref ? i < _ref : i > _ref; 0 <= _ref ? i++ : i--) {
        signal[i] = (samples[2 * i] + samples[2 * i + 1]) / 2;
      }
      fft.forward(signal);
      if (spectrumDisplayEnabled) {
        context.clearRect(0, 0, canvas.width, canvas.height);
      }
      sparkIndices = [];
      _results = [];
      for (i = 0, _ref2 = fft.spectrum.length; 0 <= _ref2 ? i < _ref2 : i > _ref2; 0 <= _ref2 ? i++ : i--) {
        idx = Math.floor((i / L) * l);
        if (sparkIndices.indexOf(idx) !== -1) {
          continue;
        }
        sparkIndices.push(idx);
        sparks = threexSparks[idx];
        if (!sparks) {
          continue;
        }
        emitter = sparks.emitter();
        if (!emitter._particles) {
          continue;
        }
        magnitude = fft.spectrum[i];
        if (time < 40 && i > 20) {
          if (time / i < 0.3125) {
            continue;
          }
        }
        lifetime = emitter._initializers[4];
        lifetime._max = flameLifetime(time, i, magnitude);
        pos = emitter._initializers[2].zone.pos;
        _pos = flamePosition(time, i, magnitude, pos.x, pos.y);
        pos.x = _pos.x;
        pos.y = _pos.y;
        _ref3 = emitter._particles;
        for (_i = 0, _len = _ref3.length; _i < _len; _i++) {
          particle = _ref3[_i];
          color = flameHSV(time, i, magnitude);
          particle.target.color().setHSV(color.hue, color.sat, color.value);
        }
        _results.push(spectrumDisplayEnabled ? context.fillRect(i * 4, canvas.height, 3, -magnitude * 4000) : void 0);
      }
      return _results;
    };
    flamePosition = function(time, i, magnitude, xpos, ypos) {
      var dd, exp, xmax, _magnitude;
      if (i === 0) {
        return 0;
      }
      if (52 <= i && (88 < time && time < 120)) {
        if (!((-10 < xpos && xpos < 10))) {
          xpos = 0;
        }
        if (!((-10 < ypos && ypos < 20))) {
          ypos = -10;
        }
        xpos -= (Math.sin(time / Math.random()) * 2) * magnitude * 64 * i;
        ypos += (Math.cos(time / 2) + 1) * magnitude * i * 8;
      } else if (42 <= i && (38 < time && time < 144)) {
        if (!((-10 < xpos && xpos < 10))) {
          xpos = 0;
        }
        if (i > 52) {
          xpos -= Math.sin(magnitude * i * 64);
          if (!((-10 < ypos && ypos < 20))) {
            ypos = -10;
          }
          ypos += (Math.cos(time / 2) + 1) * magnitude * i * 8;
        } else {
          xpos += (magnitude * 512 * i) % 40 - 20;
          if (!((-5 < ypos && ypos < 20))) {
            ypos = -5;
          }
          ypos += (Math.sin(time)) * magnitude * 64 * i;
        }
      } else if ((32 < i && i < 42) && (38 < time && time < 139)) {
        if ((-20 < xpos && xpos < 20)) {
          xpos = 0;
        }
        xpos += magnitude * i * 64;
        if (!((-20 < ypos && ypos < 10))) {
          ypos = -20;
        }
        ypos += (Math.cos(time / 4) + 1) * magnitude * i * 10;
      } else if (27 < i && 149 < time) {
        xpos = Math.sin(time) * (Math.random() - 0.5) * 18;
        ypos = i * magnitude * 107 - 12;
      } else if (i > 22 && (137 < time && time < 227)) {
        _magnitude = magnitude * 64;
        xpos = Math.sin(_magnitude) * 12;
        xpos += _magnitude * 15 % 15 - 7;
        ypos = Math.sin(_magnitude) * i / 16 - 20;
      } else {
        dd = Math.sin(70 * time / duration);
        exp = Math.exp(magnitude * i) * (Math.round(Math.random()) * -1);
        if (i < 32) {
          exp = exp / 4;
        }
        xmax = Math.exp(i / 16);
        if ((-xmax < xpos && xpos < xmax)) {
          xpos = 0;
        }
        if (dd !== 0) {
          xpos += i % dd - dd + exp;
        }
      }
      return {
        x: xpos,
        y: ypos
      };
    };
    flameHSV = function(time, i, magnitude) {
      var dd, hue, sat, value;
      if (magnitude > 1) {
        hue = 0.4 + Math.random() / 2;
        sat = 10;
        value = 1.1;
      } else if ((22 < i && i < 27) && (137 < time && time < 227)) {
        hue = 0.7 + (magnitude * i % Math.random()) / 8;
        sat = 20;
        value = 1.1;
      } else if (((27 <= i && i < 32)) && (141 < time && time < 227)) {
        hue = 0.2 + (magnitude * 56) % 0.4;
        sat = 20;
        value = 1.1;
      } else if (i > 16 && time > 37) {
        dd = Math.sin(72 * time / duration);
        hue = Math.exp(3 * magnitude * i) % 1 * dd;
        sat = i / 64;
        if (time > 58) {
          value = Math.random() / 2 + 0.7;
        } else {
          value = 1.1;
        }
      } else {
        hue = 0.12;
        sat = 0.9;
        value = 1.1;
      }
      return {
        hue: hue,
        sat: sat,
        value: value
      };
    };
    flameLifetime = function(time, i, magnitude) {
      if (((20 < i && i < 32)) && (139 < time && time < 227)) {
        return Math.exp(magnitude * i + Math.random());
      } else if (42 <= i && (38 < time && time < 137)) {
        return magnitude * 32 * i * Math.random();
      } else if (i > 22 && magnitude > 0.001) {
        return Math.sin(3 * time / duration);
      } else {
        return magnitude * 128;
      }
    };
    greets = ["HTML5 WebGL & audio", "", "Music: Johann Sebastian Bach - partita no. 3 in E major BWV 1006 - preludio"];
    _currentGreet = 0;
    nextGreet = function() {
      var el, greet;
      greet = greets[_currentGreet];
      if (greet === void 0) {
        return;
      }
      el = document.getElementById("info");
      el.textContent = greet;
      el.style.opacity = 1;
      return setTimeout((function() {
        el.style.opacity = 0;
        _currentGreet += 1;
        return setTimeout(nextGreet, 1000);
      }), 5000);
    };
    showCredits = function() {
      var credits;
      credits = document.getElementById("credits");
      credits.style.display = "block";
      setTimeout(function() {
        return credits.style.opacity = 0.8;
      }, 1000);
      return document.getElementById("rewind").onclick = function() {
        credits.style.opacity = 0;
        return setTimeout(window.location.reload, 1000);
      };
    };
    return FiammaBellezza;
  })();
}).call(this);
