###
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
###

class window.FiammaBellezza

    SCREEN_WIDTH = window.innerWidth
    SCREEN_HEIGHT = window.innerHeight

    # audio element
    audio = document.createElement("audio")
    audioSrc = "audio/Johann_Sebastian_Bach_-_partita_no._3_in_e_major,_bwv_1006_-_1._preludio.ogg"

    # canvas for FFT
    canvas = document.createElement("canvas")
    canvas.id = "fft"
    context = canvas.getContext("2d")
    spectrumDisplayEnabled = false
    unless spectrumDisplayEnabled
        canvas.style.visibility = "hidden"

    # wiki.mozilla.org/Audio_Data_API
    duration = null
    channels = null
    rate = null
    frameBufferLength = null
    samples = null
    fft = null

    # Three.js WebGL renderer
    scene = new THREE.Scene()
    camera = new THREE.PerspectiveCamera(35, SCREEN_WIDTH / SCREEN_HEIGHT, 1, 1024)
    renderer = null
    stats = new Stats()
    showStats = false

    # Three.js sparks
    threexSparks = []
    SPARK_COUNT = 64
    L = 256 # fft.spectrum.length
    l = 20 # three.js space

    constructor: ->
        if Detector.webgl
            renderer = new THREE.WebGLRenderer( { antialias: true, preserveDrawingBuffer: true } )
        else
            Detector.addGetWebGLMessage()
            return true

        container = document.getElementById( "container" )
        container.style.width = "#{SCREEN_WIDTH}px"
        container.style.height = "#{SCREEN_HEIGHT}px"
        document.body.appendChild( container )

        # fft display
        container.appendChild( canvas )

        # webgl view
        renderer.setSize( SCREEN_WIDTH, SCREEN_HEIGHT )
        container.appendChild( renderer.domElement )

        # audio player
        # - only ogg since moz* audio api demands Firefox anyway
        if Modernizr.audio.ogg
            audio.src = audioSrc
        if audio.src
            audio.controls = true
            audio.preload = "auto"
            audio.autobuffer = true
            document.body.appendChild( audio )
            audio.onended = showCredits

        camera.position.set 0, 0, 100
        camera.lookAt( scene.position )
        scene.add camera

        # Three.js FPS stats
        stats.domElement.style.position = 'absolute'
        stats.domElement.style.top = '2px'
        stats.domElement.style.left = '7px'
        stats.domElement.style.zIndex = 100
        container.appendChild( stats.domElement )
        unless showStats
            stats.domElement.style.visibility = "hidden"

        audio.addEventListener('MozAudioAvailable', audioAvailable, false)
        audio.addEventListener('loadedmetadata', loadedMetadata, false)

        # transparently support window resize
        THREEx.WindowResize.bind(renderer, camera)

        document.getElementById("inlineDoc").style.cssText = ""
        document.getElementById("inlineDoc").style.display = "visible"

        # if displaying in MDN iframe, fix offsets and hack fullscreen key
        if (window != window.top)
            offset = window.parent.document.getElementById("demobar").offsetHeight
            audio.style.bottom = "#{offset + 5}px"
            document.getElementById("inlineDoc").style.bottom = "#{offset}px"
            document.getElementById('debugKey').style.display = "none"
            # hack: bind the f in MDN main frame
            # (exit is buggy - esc keycode does not bubble here ..)
            window.parent.onkeydown = (event) ->
                switch event.keyCode
                    # f
                    when 70
                        toggleFrameFullscreen()

        else
            if THREEx.FullScreen.available()
                THREEx.FullScreen.bindKey()
            else
                document.getElementById('fullscreenKey').style.display = "none"

        # greets
        setTimeout ->
            document.getElementById('info').style.opacity = 0
            setTimeout nextGreet, 2000
        , 4000

        animate()

    # MDN iframe fullscreen hack
    toggleFrameFullscreen = ->
        if not window.parent.fullScreen
            # enter
            window.parent.document.getElementById("demoframe").mozRequestFullScreen()
        else
            # exit
            window.parent.document.mozCancelFullScreen()


    document.onkeydown = (event) ->
        switch event.keyCode
            # s -> show spectrum and fps stats
            when 83
                spectrumDisplayEnabled = !spectrumDisplayEnabled
                showStats = spectrumDisplayEnabled
                if spectrumDisplayEnabled
                    canvas.style.visibility = "visible"
                    stats.domElement.style.visibility = "visible"
                else
                    canvas.style.visibility = "hidden"
                    stats.domElement.style.visibility = "hidden"
            # f -> fullscreen in MDN iframe hack
            when 70
                toggleFrameFullscreen() if (window != window.top)


    loadedMetadata = ->
        # After loadedmetadata event, following media element attributes are known:
        duration = audio.duration
        channels = audio.mozChannels
        rate = audio.mozSampleRate
        frameBufferLength = audio.mozFrameBufferLength
        fft = new FFT(frameBufferLength / channels, rate)
        audio.play()
        initSparks()


    initSparks = ->
        N = 12
        dy = L/N
        offset_x = 0
        offset_y = -(l/2)-15
        sparkPositions = [1..N].map (n) ->
            if n <= N/2
                min = (dy*(n-1))*2*l/L + offset_y
                max = ((dy*n)-1)*2*l/L + offset_y
                vx = -8
            else
                __n = n - N/2
                min = (dy*(__n-1))*2*l/L + offset_y
                max = ((dy*__n)-1)*2*l/L + offset_y
                vx = 16
            center = (max + min)/2
            {min: min, max: max, center: center, vx: vx}

        colorsizeInitializer = new () ->
            initialize: ( emitter, particle ) ->
                particle.target.color().setHSV(0.12, 1.9, 0.9)
                particle.target.size(96)

        for position in sparkPositions
            sparks = new THREEx.Sparks
                maxParticles: 768,
                counter: new SPARKS.SteadyCounter(SPARK_COUNT)
            emitter = sparks.emitter()

            if position.center < 10
                velocity = new THREE.Vector3(0, 0, 0)
            else
                velocity = new THREE.Vector3(position.vx, Math.random()*2, 0)
            drift = new SPARKS.RandomDrift(128, 64, 0)
            acceleration = new SPARKS.Accelerate(Math.random(), 2, 0)

            emitter.addInitializer(colorsizeInitializer)
            emitter.addInitializer(new SPARKS.Position(new SPARKS.PointZone(new THREE.Vector3(offset_x, position.center, 0))))
            emitter.addInitializer(new SPARKS.Velocity(new SPARKS.PointZone(velocity)))
            emitter.addInitializer(new SPARKS.Lifetime(0,0))

            emitter.addAction(new SPARKS.Age())
            emitter.addAction(new SPARKS.Move())
            emitter.addAction(drift)
            emitter.addAction(acceleration)

            emitter.start()

            scene.add(sparks.container())
            threexSparks.push( sparks )


    animate = ->
        requestAnimationFrame( animate )
        render()
        stats.update() if showStats


    render = ->
        sparks.update() for sparks in threexSparks
        renderer.context.depthMask true
        renderer.render scene, camera


    audioAvailable = (event) ->
        return if frameBufferLength == null
        samples = event.frameBuffer # frameBuffer is Float32Array
        time = event.time
        signal = new Float32Array(samples.length / channels)
        for i in [0...frameBufferLength/2]
            # Assuming interlaced stereo channels,
            # need to split and merge into a stero-mix mono signal
            signal[i] = (samples[2*i] + samples[2*i+1]) / 2
        
        fft.forward( signal )

        if spectrumDisplayEnabled
            # Clear the canvas before drawing spectrum
            context.clearRect(0,0, canvas.width, canvas.height)

        sparkIndices = [] # map frequency to three.js space
        for i in [0...fft.spectrum.length]
            idx = Math.floor((i/L)*l)
            continue unless sparkIndices.indexOf(idx) is -1
            sparkIndices.push idx

            sparks = threexSparks[idx]
            continue unless sparks

            emitter = sparks.emitter()
            continue unless emitter._particles

            magnitude = fft.spectrum[i]

            if time < 40 and i > 20
                # "fade in" higher frequencies; 40/128 = 0.3125
                continue if time/i < 0.3125

            #
            # lifetime
            #
            lifetime = emitter._initializers[4] # HACK! depends on array index
            lifetime._max = flameLifetime(time,i,magnitude)

            #
            # position drift
            #
            pos = emitter._initializers[2].zone.pos
            _pos = flamePosition(time,i,magnitude,pos.x,pos.y)
            pos.x = _pos.x
            pos.y = _pos.y

            #
            # color drift
            #
            for particle in emitter._particles
                color = flameHSV(time,i,magnitude)
                particle.target.color().setHSV(color.hue, color.sat, color.value)

            if spectrumDisplayEnabled
                context.fillRect(i * 4, canvas.height, 3, -magnitude * 4000)


    flamePosition = (time,i,magnitude,xpos,ypos) ->
        return 0 if i == 0

        if 52 <= i and 88 < time < 120
            xpos = 0 unless -10 < xpos < 10
            ypos = -10 unless -10 < ypos < 20
            xpos -= (Math.sin(time / Math.random())*2) * magnitude*64*i
            ypos += (Math.cos(time/2) + 1) * magnitude*i*8 

        else if 42 <= i and 38 < time < 144
            ## scattered sparks
            unless -10 < xpos < 10
                xpos = 0
            if i > 52
                xpos -= Math.sin magnitude * i * 64
                unless -10 < ypos < 20
                    ypos = -10
                ypos += (Math.cos(time/2) + 1) * magnitude*i*8 
            else
                xpos += (magnitude * 512 * i) % 40 - 20
                unless -5 < ypos < 20
                    ypos = -5
                ypos += (Math.sin(time)) * magnitude*64*i

        else if 32 < i < 42 and 30 < time < 148
            ## reactive flame base 
            if -20 < xpos < 20
                xpos = 0
            xpos += magnitude * i * 64
            unless -20 < ypos < 10
                ypos = -20
            ypos += (Math.cos(time/4) + 1) * magnitude*i*10

        else if 27 < i and 149 < time
            ## dancing spiral
            xpos = Math.sin(time) * (Math.random()-0.5) * 18
            ypos = i*magnitude*99 - 12

        else if i > 22 and 137 < time < 227
            ## blue flame
            _magnitude = magnitude*64
            xpos = Math.sin(_magnitude)*12
            xpos += _magnitude * 15 % 15 - 7
            ypos = Math.sin(_magnitude)*i/16 - 20

        else
            ## flame base
            dd = Math.sin(70*time/duration)
            exp = Math.exp(magnitude*i) * (Math.round(Math.random())*-1)
            if i < 32
                exp = exp/4
            xmax = Math.exp(i/16)
            if -xmax < xpos < xmax
                xpos = 0
            if dd != 0
                xpos += i % dd - dd + exp

        return {x: xpos, y: ypos}


    flameHSV = (time,i,magnitude) ->
        if magnitude > 1
            hue = 0.4 + Math.random()/2
            sat = 10
            value = 1.1

        else if 22 < i < 27 and 137 < time < 227
            ## blue flame
            hue = 0.7 + (magnitude*i % Math.random())/8
            sat = 20
            value = 1.1

        else if (27 <= i < 32) and 141 < time < 227
            ## sparks
            hue = 0.2 + (magnitude * 56) % 0.4
            sat = 20
            value = 1.1

        else if i > 16 and time > 37
            ## dancing spiral
            dd = Math.sin(72*time/duration)
            hue = Math.exp(3*magnitude*i) % 1 * dd
            sat = i/64
            if time > 58
                value = Math.random()/2 + 0.7
            else
                value = 1.1

        else
            ## flame base
            hue = 0.12
            sat = 0.9
            value = 1.1

        return {hue: hue, sat: sat, value: value}


    flameLifetime = (time,i,magnitude) ->
        if (20 < i < 32) and 139 < time < 227
            ## blue flame
            return Math.exp(magnitude*i + Math.random())

        else if 42 <= i and 38 < time < 137
            ## scattered sparks
            return magnitude*32*i * Math.random()

        else if i > 22 and magnitude > 0.001
            return (Math.sin(3*time/duration))

        else
            return magnitude * 128


    greets = ["HTML5 WebGL & audio", "", "Music: Johann Sebastian Bach - partita no. 3 in E major BWV 1006 - preludio"]
    _currentGreet = 0

    nextGreet = ->
        greet = greets[_currentGreet]
        return if greet == undefined
        el = document.getElementById("info")
        el.textContent = greet
        el.style.opacity = 1
        setTimeout (-> 
            el.style.opacity = 0
            _currentGreet += 1
            setTimeout nextGreet, 1000
            ), 5000

    showCredits = ->
        credits = document.getElementById("credits")
        credits.style.display = "block"
        # wait for all the sparks to settle down
        setTimeout ->
            credits.style.opacity = 0.8
        , 1000
        document.getElementById("rewind").onclick = ->
            credits.style.opacity = 0
            setTimeout window.location.reload, 1000

