  

Hooks.on("ready", () => { 
   
    class TokenEffectSection extends Sequencer.BaseSection {
        constructor(inSequence) {
            super(inSequence);
            this._effect;
            this.sequence = new Sequence();
  
            this.tokenAnchor = {
                x: 0,
                y: 0,
                
                rotation: 0
            };

            //easy access to tokens
            this.targets = Array.from(game.user.targets);
            this.tiles = canvas.tiles.placeables;
            this.selecteds = canvas.tokens.controlled
            
            this.firstTemplate = canvas.templates.placeables[0];
            this.firstSelected = canvas.tokens.controlled[0];
            this.firstTile = canvas.tiles.placeables[0];
            this.firstTarget = this.targets[0];
            this.firstTargeted = this.targets[0];
            
            
            
            //tokens participating in sequence
            this.caster
            this.affected
            
            this._methodLog = [];
  
        }
  
        logMethodCall(methodName, args) {
            // Convert to array if args is array-like (arguments object), otherwise wrap as an array
            const argsArray = args instanceof Object && args.length !== undefined ? Array.from(args) : [args];
            this._methodLog.push({
                method: methodName,
                args: argsArray
            });
        }
  
        /* basic sequencer commands --------------------------------------------------------------------------*/
        tokenEffect() {
            this._methodLog = [];
            this._effect = this._effect ? this._effect : this.effect();
            this._effect = this.effect();
            return this;
        }

        affect({affected = this.affected | this.firstTarget}={}){
            if(affected!=0){ //if we passed in a affected
                this.affected = affected
            }
            if(this.affectLocation){
                return this.atLocation(this.affectLocation)
            }
            else{
               return this.tokenEffect()
               .atLocation(this.affected); 
            }
        }

        affectCone({affected = this.affected | this.firstTemplate}={}){
            if(affected!=0){ //if we passed in a affected
                this.affected = affected
            }
            const coneStart = { x: this.affected.data.x, y: this.affected.data.y };
            this.affectLocation = coneStart
            this.tokenEffect()
                .atLocation(coneStart)
                .stretchTo(this.affected)
            return this
            
        }

        affectLine({affected = this.affected | this.firstTemplate}={}){
            return this.affectCone({affected:affected})
        }

        affectBurst({affected = this.affected | this.firstTemplate}={}){
            return this.affect({affected:affected})
        }



        cast({caster = (this.caster || this.firstSelected), affected = (this.affected || this.firstTarget)}){
            if(caster!=0)
                this.caster = caster
            if(affected!=0)
            this.affected = affected;

            return this.tokenEffect()
                .atLocation(caster)
                .rotateTowards(affected)
        }

        project({caster = (this.caster || this.firstSelected), affected = (this.affected || this.firstTarget)}={}){
            this.cast({caster:caster, affected:affected})
            let stretchToLocation=affected;
            if(this.affectLocation){
                stretchToLocation = this.affectLocation
            }
            return this.stretchTo(stretchToLocation, {
               // attachTo: true
            }).spriteOffset({
                x: 30,
                y: 0
            })
        }

        projectToCone({caster = (this.caster || this.firstSelected), affected = (this.affected || this.firstTemplate)}={}){
            this.cast({caster:caster, affected:affected})
            const coneStart = { x: this.affected.data.x, y: this.affected.data.y };
            this.stretchTo(coneStart)
            this.affectLocation = coneStart
            return this;
        }

        targetFirstTemplate(){
            this.affected =this.firstTemplate
        }

        targetFirstTile(){
            this.affected =this.firstTile
        }

        targetFirstTargeted(){
            this.affected =this.firstTarget
        }

        
        onToken(token) {
            this.effected = token;
            this.atLocation(token);
            return this;
        }
  
        onSelected() {
            this.effected = this.selected;
            this.atLocation(this.selected);
            return this;
        }
  
        onTargeted() {
            this.effected = this.affected;
            this.atLocation(this.affected);
            return this;
  
        }
  
        onTemplate() {
            this.effected = this.affected;
            this.atLocation(this.affected);
          //  this.rotateTowards(this.template)
            return this;
        }

        onTile(tile = this.tile) {  
            this.effected = this.tile;
            this.atLocation(this.tile);
            return this;
        }
  
        rangedAttack(target=this.affected) {
            this.onSelected();
            this.rotateTowards(target)
            this.stretchTo(target, {
                attachTo: true
            }).spriteOffset({
                x: 30,
                y: 0
            })
            return this
        }
  
        templateAttack(template=this.affected) {
            this.onSelected();
            this.rotateTowards(template)
            this.stretchTo(template, {
                attachTo: true
            }).spriteOffset({
                x: 30,
                y: 0
            })
            return this
        }
  
        meleeAttack(target=this.affected) {
            this.onSelected();
        //    this.atLocation(this.selected);
            this.rotateTowards(target)
            return this;
        }
    
        towardTemplate(template=this.affected) {
            //this.onSelected();
            this.atLocation(this.selected);
            this.rotateTowards(template)
            return this;
        }
  
        towardTarget(target=this.affected) {
          //  this.onSelected();
            this.atLocation(this.selected);
            this.rotateTowards(target)
            return this;
        }
  
        towardTargeted(target=this.affected) {
            this.onSelected();
            this.atLocation(target);
            this.rotateTowards(target)
            return this;
        }
  
        repeatEffect() {
            this._effect = this._effect ? this._effect : this.effect();
            this._effect = this.effect();
            let cleanLog = [...this._methodLog];
            this._methodLog.forEach( ({method, args}) => {
                if (typeof this[method] === 'function') {
                    this[method](...args);
                    // args is guaranteed to be an array
                }
            }
            );
            this._methodLog = cleanLog;
            return this;
  
        }

        shake({target=this.effected, strength=100, rotation=false, duration, fadeOutDuration=0}={}) {
            this._effect = this._effect ? this._effect : this.effect();
            this._effect.animation().on(target).opacity(1).canvasPan().shake({
                duration: duration,
                strength: strength,
                rotation: rotation,
                fadeOutDuration: fadeOutDuration
            })
            return this;
        }

        pauseThenNextEffect(waiting) {
            this._effect = this._effect ? this._effect : this.effect();
            this._effect.wait(waiting)
            this.repeatEffect()
            return this;
        }
  
        pause(waiting) {
            this._effect = this._effect ? this._effect : this.effect();
            this._effect.wait(waiting)
            return this;
        }

        playSound(inSound,repeats = undefined) {
            this.logMethodCall('playSound', inSound);
            this._effect = this._effect ? this._effect : this.effect();
            if(!repeats)
                this._effect.sound(inSound);
            else 
                 this._effect.sound(inSound).repeats(repeats.repeats, repeats.duration);
            return this;
        }
  
     
        tokenAnimation(token= this.selected){
            this.effected = token;
            this._effect = this._effect ? this._effect : this.effect();
            this._effect.animation()//.on(token).opacity(0);
            return this;
        }
  
        hideToken(token = this.selected)
        {
            this._effect =  this._effect ? this._effect : this.effect();
            this._effect.animation().on(token).opacity(0)
            return this
        }
  
        showToken(token = this.selected)
        {
            this._effect = this._effect ? this._effect : this.effect();
            this._effect.animation().on(token).opacity(1)
            return this
        }
  
        /*movement helpers --------------------------------------------------------------------------*/
        startMovement(token=this.effected) {
            this.tokenAnchor = {
                x: this.effected.document.x,
                y: this.effected.document.y,
                rotation: this.effected.document.rotation
            }
            this.moving = true;
            this._effect = this._effect ? this._effect : this.effect();
            this._effect.effect().animation().on(token).opacity(0)
            return this;
        }
  
        endMovement() {
            this._effect = this._effect ? this._effect : this.effect();
            this._effect.thenDo( () => {
                this.effected.document.update({
                    rotation: this.effected.document.rotation + this.tokenAnchor.rotation
                });
            }
            )
  
            this._effect.effect().animation().on(this.effected).teleportTo({
                x: this.tokenAnchor.x,
                y: this.tokenAnchor.y
            }).opacity(1)
            return this;
        }
  
        turnLeft({token=this.effected, distance=0, duration=0, ease="easeInOutCubic"}={}) {
            return this.turnSprite("left", token, distance, duration, ease)
        }
  
        turnRight({token=this.effected, distance=0, duration= 0, ease="easeInOutCubic"}={}) {
            return this.turnSprite("right", token, distance, duration, ease)
        }
  
        turnSprite(direction, token, distance, duration, ease) {
            this._effect = this._effect ? this._effect : this.effect();
            if (direction == "left") {
                distance = distance * -1
            }
            let start = this.tokenAnchor.rotation
            this.tokenAnchor.rotation += distance;
            this._effect.effect().atLocation({
                x: this.tokenAnchor.x + (canvas.grid.size / 2),
                y: this.tokenAnchor.y + (canvas.grid.size / 2)
            }).from(token).animateProperty("sprite", "rotation", {
                from: start,
                to: this.tokenAnchor.rotation,
                duration: duration,
                ease: ease
            }).wait(duration * .8)
            return this;
        } 
  
        moveLeft({token=this.effected, distance, duration, speed=100, ease="easeInOutCubic"}={}) {
            return this.moveSprite(token, "left", distance, duration, ease, speed)
        }
  
        moveUp({token=this.effected, distance, duration, speed=100, ease="easeInOutCubic"}={}) {
            return this.moveSprite(token, "up", distance, duration, ease, speed, pause)
        }
  
        moveDown({token=this.effected, distance, duration, speed=100, ease="easeInOutCubic"}={}) {
            return this.moveSprite(token, "down", distance, duration, ease, speed)
        }
  
        moveRight({token=this.effected, distance, duration, speed=100, ease="easeInOutCubic"}={}) {
            return this.moveSprite(token, "right", distance, duration, ease, speed)
        }
  
        moveSprite(token, position, distance, duration, ease, speed) {
            this._effect = this._effect ? this._effect : this.effect();
  
            let moveEffect = this._effect.effect()
            moveEffect.from(token);
            moveEffect.atLocation({
                x: this.tokenAnchor.x + canvas.grid.size / 2,
                y: this.tokenAnchor.y + canvas.grid.size / 2
            })
  
            if (position == "left" | position == "right")
                this.tokenAnchor.x += distance;
            if (position == "up" | position == "down")
                this.tokenAnchor.y += distance;
            moveEffect.moveTowards({
                x: this.tokenAnchor.x + canvas.grid.size / 2,
                y:this.tokenAnchor.y + canvas.grid.size / 2,
                ease: ease,
                duration: duration,
            }, {
                rotate: false
            }).moveSpeed(speed)
  
            moveEffect.rotate(-this.tokenAnchor.rotation) 
            moveEffect.wait(duration * .9)
            return this
        }
  
        loopLeft({token=this.effected, distance, duration, speed=100, ease="easeInOutCubic", pause=true}={}) {
            return this.loopSprite(token, "left", distance, duration, ease, speed, pause)
        }
  
        loopRight({token=this.effected, distance, duration, speed=100, ease="easeInOutCubic", pause=true}={}) {
            return this.loopSprite(token, "right", distance, duration, ease, speed, pause)
        }
  
        loopUp({token=this.effected, distance, duration, speed=100, ease="easeInOutCubic", pause=true}={}) {
            return this.loopSprite(token, "up", distance, duration, ease, speed, pause)
        }
  
        loopDown({token=this.effected, distance, duration, speed=100, ease="easeInOutCubic", pingpong=true}={}) {
            return this.loopSprite(token, "down", distance, duration, ease, speed, pingpong)
        }
  
        loopScaleHeight({token=this.effected, from, to, duration, delay,  ease="easeInOutCubic", pingpong=true}={}) {
            return this.loopScale(token, "scale.y", from, to, duration, delay,ease, pingpong)
        }
  
        loopScaleWidth({token=this.effected, from, to, duration, delay,  ease="easeInOutCubic", pingpong=true}={}) {
            return this.loopScale(token, "scale.x", from, to, duration, delay, ease, pingpong)
        }
  
        loopScale(token, property, from, to, duration=0, delay=0, ease,  pingpong=true) {
            this._effect = this._effect ? this._effect : this.effect();
            this._effect.from(this.effected)
            this._effect.loopProperty("sprite", property, {
                from: from, 
                to: to,
                duration: duration,
            //    ease: ease,
                pingPong: pingpong,
                delay: delay
  
            })
  
           
            return this
        }
  
        loopSprite(token, position, distance, duration, ease, speed, pause=true) {
            let moveProperty
            if (position == "left" | position == "right") {
                moveProperty = "position.x"
                if (position == "left") {
                    distance = distance * -1
                }
            }
            if (position == "up" | position == "down") {
                moveProperty = "position.y"
                if (position == "up") {
                    distance = distance * -1
                }
            }
            this._effect = this._effect ? this._effect : this.effect();
  
            if(this.tokenAnchor.x==0 && this.tokenAnchor.y==0)
            {
                this.startMovement();
            }
            this._effect.effect().from(token).loopProperty("sprite", moveProperty, {
                values: [0, distance],
                duration: duration,
                ease: ease,
                pingPong: true
            })
                /*.atLocation({
                x: this.tokenAnchor.x + canvas.grid.size / 2,
                y: this.tokenAnchor.y + canvas.grid.size / 2
            })*/
  
            if (position == "left" | position == "right")
                this.tokenAnchor.x += distance;
            if (position == "up" | position == "down")
                this.tokenAnchor.y += distance;
            if (pause)
                this._effect.wait(duration * .9)
            return this
        }
  
        
  
        /*basic reusable effects --------------------------------------------------------------------------*/
        calculateFrontAndCenterPos(affected, distance = 0.25)
        {
            this.targetCenter = {
                x: affected.x+canvas.grid.size*affected.document.width/2,
                y: affected.y+canvas.grid.size*affected.document.width/2,
                };
                
            this.tokenCenter = {
            x: this.caster.x+canvas.grid.size*affected.document.width/2,
            y: this.caster.y+canvas.grid.size*affected.document.width/2,
            };
            
            this.middleposition = {
                x: (this.affected.x - this.caster.x)*distance,
                y: (this.affected.y - this.caster.y)* distance,
            };
        }

        lungeTowardTarget({affected = (this.affected||this.firstTarget), scale =1, distance =.25, duration= 100, repeats=1}={}){
            this.calculateFrontAndCenterPos(affected, distance)
            
            this._effect = this._effect ? this._effect : this.effect();   
            this._effect.animation()
                .on(this.caster)
                .opacity(0)
                // .wait(1)
                
        
                     
           this._effect.effect()
            .from(this.caster)
            .atLocation(this.caster)
            .mirrorX(this.caster.document.data.mirrorX)
            .animateProperty("sprite", "position.x", { from: 0, to: this.middleposition.x, duration: duration, ease:"easeOutExpo"})
            .animateProperty("sprite", "position.y", { from: 0, to: this.middleposition.y, duration: duration, ease:"easeOutExpo"})
            .animateProperty("sprite", "position.x", { from: 0, to: -this.middleposition.x, duration: duration, ease:"easeInOutQuad", fromEnd:true})
            .animateProperty("sprite", "position.y", { from: 0, to: -this.middleposition.y, duration: duration, ease:"easeInOutQuad", fromEnd:true})
            .scaleToObject(scale, {considerTokenScale: true})
            .duration(duration*4)  
            .repeats(repeats, duration*4)
          //  .wait(600)  
               
            .wait(duration*4*repeats) 
               
            .animation()
            .on(this.caster)
            .opacity(1)
            
            return this;
        }
  
        recoilAwayFromSelected({affected = this.affected, distance =.25, duration= 100, repeats=1}={}){
            this.calculateFrontAndCenterPos(affected,distance)
            
            this._effect = this._effect ? this._effect : this.effect();
  
            this._effect.animation()
                .on(affected)
                .opacity(0)
                
             .effect()
                .from(affected)
                .atLocation(affected)
                .mirrorX(affected.document.data.mirrorX)
                .animateProperty("sprite", "position.x", { from: 0, to: this.middleposition.x, duration: duration, ease:"easeOutExpo"})
                .animateProperty("sprite", "position.y", { from: 0, to: this.middleposition.y, duration: duration, ease:"easeOutExpo"})
                .animateProperty("sprite", "position.x", { from: 0, to: -this.middleposition.x, duration: duration, ease:"easeInOutQuad", fromEnd:true})
                .animateProperty("sprite", "position.y", { from: 0, to: -this.middleposition.y, duration: duration, ease:"easeInOutQuad", fromEnd:true})
                .scaleToObject(1, {considerTokenScale: true})
                .duration(duration*4)  
                .repeats(repeats, duration*4)
              
                .wait(duration*4*repeats) 
               
                
                .animation()
                .on(affected)
                .opacity(1)
            return this;
        }
  
        knockedHard(target = this.affected){          
            this.tokenEffect()
                .onToken(target)
                .file("jb2a.dizzy_stars.200px.yellow")
                //.scaleIn(0, 100, {ease: "easeOutCubic"}) 
                .scaleToObject(1)
                .opacity(1)
                .attachTo(target, {offset:{y:-0.5*target.document.width}, gridUnits:true})
            .effect()
                .from(target)
                .atLocation(target)
                .fadeIn(200)
                .fadeOut(500)
                .loopProperty("sprite", "position.x", { from: -0.05, to: 0.05, duration: 50, pingPong: true, gridUnits: true})
                .scaleToObject(target.document.texture.scaleX)
                .duration(1500)
                .opacity(0.25)
            return this
        } 
  
        impactingClap(){
            this.tokenEffect()
                .meleeAttack()
                .file("jb2a.melee_generic.slash.01.orange").spriteOffset({x:-20, y:-10})
                .scaleToObject(1.5)
                .zIndex(1)
                .filter("ColorMatrix", {
                    hue: 0, 
                    contrast: 1, 
                    saturate: 0, 
                    brightness: 3 
                })        
            .repeatEffect()
                .mirrorY()
                .pause(400)
            .tokenEffect()
                .file("jb2a.impact.001.orange")
                 .onSelected()
                .scaleToObject(2)
                .towardTarget()
                .filter("ColorMatrix", {
                    hue: 50,
                    contrast: 1,
                    saturate: 0,
                    brightness: 1
                })
            .playSound("modules/mm3e-animations/sounds/action/powers/Hit6.ogg")
            return this;
        }

        leapToPosition({token = this.effected, position=undefined, height=1.25}={}){
            this.hideToken(token)
            //.loopUp({distance:[50,0,50], duration:500, duration: 500, delay:0, pause:false})
            .loopProperty("sprite", "position.y", { values: [50, 0, 50], duration: 500})
            .loopScaleHeight({from:1,to:height, duration: 500, pingPong: true, delay:0})
            .loopScaleWidth({from:1,to:height, duration: 500, pingPong: true, delay:0})
            .moveTowards(position, {rotate:false})
            .anchor({ x: 0.5, y: 1.5 })
            .zIndex(2)

        .tokenEffect()
            .from(token)
            .opacity(0.5)
            .scale(0.9)
            .belowTokens()
            .duration(1000)
            .anchor({ x: 0.5, y: 0.5 })
            .filter("ColorMatrix", { brightness: -1 })
            .filter("Blur", { blurX: 5, blurY: 10 })
            .moveTowards(position, {rotate:false})
            .zIndex(2)
            .waitUntilFinished()

    .teleportTo(position)
        .snapToGrid()
        .waitUntilFinished()
        .showToken(token)
    return this
        }
       
        resistAndStruggle(target = this.affected){
            this.tokenEffect()
                this.onToken(target)
                .hideToken(target)
                .turnRight({token:target, distance:25, duration:300})
                .loopRight({token:target, distance:20,duration:300}) 
                .loopLeft({token:target, distance:10,duration:300})
                .turnLeft({token:target, distance:15, duration:300})
                .turnRight({token:target, distance:35,duration:300}) 
                .turnRight({token:target, distance:20,duration:300}) 
                .moveLeft({token:target, distance:20,duration:300}) 
                .showToken(target)  
            return this;
        }

        /* power decriptors --------------------------------------------------------------------------*/
        async affectConcealment({affected = (this.affected|this.firstSelected),filter= GameHelper.whiteColorFilter}= {}){
            
            this.affect({affected:affected})
                .scaleToObject(1.5)
                .file("jb2a.shimmer.01.blue")
                .filter(filter.filterType, filter.values)
                .thenDo(async ()=>{
                    this.affected.document.update({ "alpha": 0.1 });
                })
                this.playSound('modules/mm3e-animations/sounds/action/powers/invisible1.ogg')
            return this;
        }
        
        affectHeal({token = this.selected}={})
        {
            this.affect({affected:token})
                .file('jb2a.healing_generic.200px.yellow02')
                .playSound('modules/mm3e-animations/sounds/Spells/Buff/spell-buff-long-3.mp3')
            return this;
        }

        affectIllusion({affected = this.affected}={})
        {
            this.affect({affected:affected})
                .file('jb2a.markers.stun.dark_teal.02')
                .filter("ColorMatrix", { saturate: 0, brightness:.5 , hue: 200  })
                .scaleToObject(1)
                .spriteOffset({x:0, y:-25})
                .belowTokens(true)
                .persist(true)
                .playSound('modules/mm3e-animations/sounds/action/powers/Seers_AuraVoicesL_Loop.ogg')
            return this;
        }

        affectMindControl({affected = this.affected}={})
        {
            return this.affect({affected:affected})
            .file("jaamod.spells_effects.confusion")
            .scaleToObject(.5)
            .spriteOffset({x:0, y:-30})
            .belowTokens()
            .opacity(0.5) 
            .filter( "ColorMatrix",
                {
                    hue: 50, 
                    contrast: 1, 
                    saturate: 0, 
                    brightness: 3 
            })
            .persist()
            .playSound('modules/mm3e-animations/sounds/action/powers/Seers_SootheMind_Hit.ogg')
        }

        affectWeaken({affected = (this.affected|this.firstSelected)}={}){
            let tintColor = '#808080'
            let hue = 350
            if(affected!=0){
                this.affected =affected
            }

            this.calculateFrontAndCenterPos(this.affected, this.affected.document.width/2)
            this.affect({affected:this.affected})
                .from(this.affected)
                .attachTo(this.affected)
                .filter("ColorMatrix", { saturate:-1})
                .scaleToObject(1, {considerTokenScale: true})
                .persist()
                .fadeIn(3000)
              //  .fadeOut(1000)
              //  .duration(5000)

            
            .affect()
                .delay(150)
                .file("jb2a.impact.004.green")
                .rotateTowards(this.caster)
                .scaleToObject(1.45)
                .spriteScale({ x: 0.75, y: 1.0 })
                .filter("ColorMatrix", { saturate: 0, brightness:0.2 , hue: hue })
                .spriteOffset({ x: -0.15 }, { gridUnits: true })
                .zIndex(2)
            
            .affect()
                .file("jb2a.impact.ground_crack.02.white")
                .rotateTowards(this.caster)
                .spriteOffset({x:-0.4}, {gridUnits:true})
                .filter("ColorMatrix", { saturate:0, brightness:1.5 })
                .size(this.caster.document.width*1.5, {gridUnits:true})
                .tint(tintColor)
                .mask(this.affected)
                .zIndex(1)

            .affect()
                .file("jb2a.extras.tmfx.outflow.circle.01")
                .attachTo(this.affected)
                .filter("ColorMatrix", { brightness: 0, saturate:-1})
                .scaleToObject(1.45, {considerTokenScale: true})
                .fadeIn(3000)
                .fadeOut(1000)
                .belowTokens()
                .duration(5000)

            .affect()
                .file("jb2a.impact.ground_crack.still_frame.02")
                .atLocation(this.affected)
                .rotateTowards(this.caster)
                .spriteOffset({x:-0.4}, {gridUnits:true})
                .filter("ColorMatrix", { saturate:0, brightness:0 })
                .filter("Glow", { outerStrength: 6, distance:10, color: 0x000000 })
                .size(this.affected.document.width*1.5, {gridUnits:true})
                .fadeIn(2000)
                .fadeOut(1000)
                .duration(5000)
                .tint(tintColor)
                .mask(this.affected)
                .zIndex(0)
            .pause(1000)
            .playSound('modules/mm3e-animations/sounds/action/powers/Seers_RevealWeakness_Attack.ogg')
            return this;
        }


        /* insect decriptors --------------------------------------------------------------------------*/
  
        insectCast({caster = (this.caster || this.firstSelected), affected = (this.affected || this.firstTarget) , duration = 1}={}){ 
            this.cast({caster:caster, affected:affected})
                .file("jaamod.assets.flies")
                .scaleToObject( .6 )
                .repeats(30)
               
                .playSound("modules/mm3e-animations/sounds/action/powers/BM_CallSwarm_Attack_01.ogg")
                .pause(duration)
             .filter("ColorMatrix", 
                    {
                        hue: 520,  
                     brightness: 0,                      
                    contrast:0,
                     saturate:0
                } )  
  
             return this
        } 

        insectCastToTemplate({caster =(this.caster || this.firstSelected)}={}){
            return this.insectCast({caster:caster, affected:this.firstTemplate})
        }

        insectBurst({template=(this.affected || this.firstTemplate), caster = (this.caster || this.firstSelected)}={})
        {
            if(!template==0){
                this.affected = template
            }

            const templateWidth = this.affected.width;
            const templateHeight = this.affected.height;
            const numInstances =12; // Adjust to control the spread and density
  
            for (let i = 0; i < numInstances; i++) {
                this.effect()
                    .atLocation(this.affected)
                    .file("jaamod.spells_effects.swarm_spider")
                        .filter("ColorMatrix", 
                            {hue: 500,       
                            saturate: -1,  
                            brightness: .1, 
                            contrast: 1  
                        })
                    .scale(.65) 
                    .spriteOffset({
                        x: (Math.random() - 0.5) * templateWidth , 
                        y: (Math.random() - 0.5) * templateHeight 
                    }) 
                    .randomRotation() 
                    .persist()
            }
        
            this.playSound('modules/mm3e-animations/sounds/action/powers/BM_CallSwarm_Hit_01.ogg')
            .pause(1000)
            .playSound('modules/mm3e-animations/sounds/action/powers/BM_CallSwarm_Continuing_Loop.ogg')
            return this
        }

       insectLine({template=(this.affected || this.firstTemplate), caster = (this.caster || this.firstSelected)}={}) {
              if(!template==0){
                this.affected = template
            }

            this.affected = template;
            const templateWidth = this.affected.width;
            const templateHeight = this.affected.height;
            const numInstances = 12; // Adjust to control the density along the line
        
            // Calculate the start and end points of the ray
            const { x: startX, y: startY } = this.affected.ray.A;
            const { x: endX, y: endY } = this.affected.ray.B;
        
            // Determine step increments
            const stepX = (endX - startX) / numInstances;
            const stepY = (endY - startY) / numInstances;
        
            for (let i = 0; i < numInstances; i++) {
                const posX = startX + stepX * i;
                const posY = startY + stepY * i;
        
                this.effect()
                    .atLocation({ x: posX, y: posY })
                    .file("jaamod.spells_effects.swarm_spider")
                    .filter("ColorMatrix", {
                        hue: 500,
                        saturate: -1,
                        brightness: 0.1,
                        contrast: 1
                    })
                    .scale(0.65)
                    .randomRotation()
                    .persist();
            }

    // Play sounds sequentially
    this.playSound('modules/mm3e-animations/sounds/action/powers/BM_CallSwarm_Hit_01.ogg')
        .pause(1000)
        .playSound('modules/mm3e-animations/sounds/action/powers/BM_CallSwarm_Continuing_Loop.ogg');
    
    return this;
}


        insectCone({template = (this.affected || this.firstTemplate), caster = (this.caster || this.firstSelected)} = {}) {
            if(template!=0)
            {
                this.affected = template
            }
            if (!template) {
                console.warn("No template specified");
                return this;
            }
        
            this.affected = template;
            const { x: startX, y: startY } = this.affected.ray.A; // Starting point of the cone
            const { x: endX, y: endY } = this.affected.ray.B; // Endpoint of the cone
            const templateWidth = Math.hypot(endX - startX, endY - startY); // Calculate distance
            const templateAngle = this.affected.document.direction; // Direction angle of the cone
            const coneSpread = this.affected.document.angle; // Cone's angle of spread
            const numSpokes = 8; // Number of lines radiating within the cone
            const pointsPerSpoke = 4; // Number of points along each spoke
        
            // Angle increment between each spoke within the cone
            const angleStep = coneSpread / (numSpokes - 1);
        
            for (let spoke = 0; spoke < numSpokes; spoke++) {
                // Calculate the angle for this spoke within the cone
                const angle = templateAngle - coneSpread / 2 + spoke * angleStep;
                const rad = angle * (Math.PI / 180); // Convert to radians
        
                // Place points along each spoke
                for (let i = 1; i <= pointsPerSpoke; i++) {
                    const distance = (i / pointsPerSpoke) * templateWidth;
                    const posX = startX + distance * Math.cos(rad);
                    const posY = startY + distance * Math.sin(rad);
        
                    this.effect()
                        .atLocation({ x: posX, y: posY })
                        .file("jaamod.spells_effects.swarm_spider")
                        .filter("ColorMatrix", {
                            hue: 50,          // Adjust hue to desired value
                            saturate: -1,
                            brightness: 0.1,
                            contrast: 1
                        })
                        .scale(0.65)
                        .randomRotation()
                        .persist();
                }
            }
        
            // Play sounds sequentially
            this.playSound('modules/mm3e-animations/sounds/action/powers/BM_CallSwarm_Hit_01.ogg')
                .pause(1000)
                .playSound('modules/mm3e-animations/sounds/action/powers/BM_CallSwarm_Continuing_Loop.ogg');
        
            return this;
        }


        insectMeleeCast({caster = (this.caster || this.firstSelected), affected = (this.affected || this.firstTarget), repeats=1}={} ){
                    
            this.cast({affected:affected})
                .file("jb2a.melee_generic.piercing.one_handed")
                .spriteOffset({x:-0.7* this.caster.document.width},{gridUnits:true})  
                .scale(.3)
                 .randomizeMirrorY()
                .repeats (repeats,600)
                .playSound([
                    "modules/mm3e-animations/sounds/action/powers/Quills3.ogg",
                    "modules/mm3e-animations/sounds/action/powers/Quills2b.ogg",
                    "modules/mm3e-animations/sounds/action/powers/QuillsRipper.ogg"
                ], {repeats:repeats/4, duration:500})
                .lungeTowardTarget({affected:affected, distance : .5, duration:100, repeats:repeats})  
            return this
        }
        
        insectProject({caster = (this.caster || this.firstSelected), target = (this.affected || this.firstTarget) }={}){ 
            this.project({caster:caster,target:target})
            .file('jaamod.misc.bat_swarm')
            .scale({ x: 1, y: 0.1 })
          return this;
        }


    
        insectAffectAffliction({affected = this.affected || this.firstTarget }={})
        {
            this.affect({affected:affected})
                .file("jaamod.spells_effects.swarm_spider")
                .filter("ColorMatrix",  {hue: 500, saturate: -1, brightness: .1,contrast: 1  })
                .scaleToObject(1.4)
                .persist()

            .affect()
                .file("jaamod.assets.flies")
                .scaleToObject( 1 )
                .repeats(30,100)
                .filter("ColorMatrix",  {hue: 500, saturate: -1, brightness: .1,contrast: 1  })
                .persist()
                .playSound("moduecles/mm3e-animations/sounds/action/powers/Swarm2_loop.ogg")
                .scale(.8) 
                .persist( true)
            .zIndex(10)
            .pause(800)

            .resistAndStruggle(this.affected)
            .pause(900
                  
                  )
            .resistAndStruggle(this.affected)
            return this;
        }

        insectAffectAura({affected = (this.caster ||this.firstSelected), duration=1, persist=false, scaleToObject = 1, spriteOffest={x:0, y:0}}={}){
            this.affect({affected:affected})
                .file("jaamod.spells_effects.swarm_spider")
                .scaleToObject( scaleToObject )
                .repeats(1, 100)
                .filter("ColorMatrix", 
                    {hue: 500,       
                    saturate: -1,  
                    brightness: .1, 
                    contrast: 1  
                }).persist(persist)
                .spriteOffset(spriteOffest)
            this.affect()
                .file("jaamod.assets.flies")
                .scaleToObject( scaleToObject )
                .repeats(30,100)
                .filter("ColorMatrix", 
                    {hue: 500,       
                    saturate: -1,  
                    brightness: .1, 
                    contrast: 1  
            }).persist(persist)
            .spriteOffset(spriteOffest)
            this.affect()
                .playSound("modules/mm3e-animations/sounds/action/powers/BM_CallSwarm_Attack_01.ogg")
                .pause(duration)
            return this;
        }

        insectAffectConcealment({affected = this.affected}={})
        {
            this.insectAffectAura({affected:affected, persist:true})
                .pause(1000)
                .affectConcealment({affected:this.affected})
            return this;
        }
        
        insectAffectDamage({affected = this.affected, repeats=1}={} ){ 
            this.affect({affected: affected})
               .file("jaamod.sequencer_fx_master.contagion")      
               .scale(.2)
               .atLocation(affected)                
               .spriteOffset({ x: -15, y: 0 }) 
               .filter("ColorMatrix", {
                   hue: 50,       // Adjust the hue to shift the color towards brown
                   saturate: -1,  // Reduce saturation to bring it closer to brown
                   brightness: .5, // Keep the brightness neutral
                   contrast: 1    // Default contrast
               }) 
               .playSound('modules/mm3e-animations/sounds/action/powers/BM_CallSwarm_Hit_01.ogg')
           .affect()
               .file("jaamod.assets.flies")      
               .scale(.2)  
               .atLocation(affected)                 
               .rotate(10)
               .mirrorY()
               .repeats(8,200)
           .affect()
                .pause(1000)
              .recoilAwayFromSelected({affected:affected, distance : .2, duration:100, repeats:repeats})
            
           return this;
       }

        insectAffectHealing({affected = this.affected}={}){
            return this.insectAffectAura({affected:affected, persist:false})
                .pause(1000)
                .affectHeal(affected)
        }

        insectAffectIllusion({affected = this.affected}={})
        {
            this.insectAffectAura({affected:affected, persist:true})
                .pause(1000)
                .affectIllusion({affected:affected})

            return this;
        }

        insectAffectMindControl({affected = this.affected}={}){
             return this.insectAffectAura({affected, scaleToObject:.6 , spriteOffest:{x:0, y:-30} , persist:true})
            .pause(2000)
            .affectMindControl(affected)
         }

         insectAffectWeaken({affected = this.affected}={}){
             this.insectAffectAura({affected,  persist:true})
                .pause(1000)
                .affectWeaken(affected)
            return this
         }

        /* wrapper methods --------------------------------------------------------------------------*/ 
        repeats(repeat, iMin=0, iMax=0) {
            this.logMethodCall('repeats', [repeat, iMin, iMax]);
            this._effect = this._effect ? this._effect : this.effect();
            this._effect.repeats(repeat,iMin, iMax);
            return this;
        }
  
        rotation(rotation) {
            this.logMethodCall('rotation', rotation);
            this._effect = this._effect ? this._effect : this.effect();
            this._effect.rotation(rotation);
            return this;
        }
        
        rotate(rotation) {
            this.logMethodCall('rotate', rotation);
            this._effect = this._effect ? this._effect : this.effect();
            this._effect.rotate(rotation);
            return this;
        }
  
        filter(filterName, options) {
            this.logMethodCall('filter', filterName, options);
            this._effect = this._effect ? this._effect : this.effect();
            this._effect.filter(filterName, options);
            return this;
        }
  
        mirrorX(inBool=true) {
            this.logMethodCall('mirrorX', inBool);
            this._effect = this._effect ? this._effect : this.effect();
            this._effect.mirrorX(inBool);
            return this;
        }
  
        mirrorY(inBool=true) {
            this.logMethodCall('mirrorY', inBool);
            this._effect = this._effect ? this._effect : this.effect();
            this._effect.mirrorY(inBool);
            return this;
        }
  
        belowTokens(inBool=true) {
            this.logMethodCall('belowTokens', inBool);
            this._effect = this._effect ? this._effect : this.effect();
            this._effect.belowTokens(inBool);
            return this;
        }
  
        aboveLighting(inBool=true) {
            this.logMethodCall('aboveLighting', inBool);
            this._effect = this._effect ? this._effect : this.effect();
            this._effect.aboveLighting(inBool);
            return this;
        }
  
        aboveInterface(inBool=true) {
            this.logMethodCall('aboveInterface', inBool);
            this._effect = this._effect ? this._effect : this.effect();
            this._effect.aboveInterface(inBool);
            return this;
        }
  
        elevation(inElevation, inOptions) {
            this.logMethodCall('elevation', inElevation, inOptions);
            this._effect = this._effect ? this._effect : this.effect();
            this._effect.elevation(inElevation, inOptions);
            return this;
        }
  
        playbackRate(inNumber) {
            this.logMethodCall('playbackRate', inNumber);
            this._effect = this._effect ? this._effect : this.effect();
            this._effect.playbackRate(inNumber);
            return this;
        }
  
        persist(inBool=true, inOptions={}) {
            this.logMethodCall('persist', inBool, inOptions);
            this._effect = this._effect ? this._effect : this.effect();
            this._effect.persist(inBool, inOptions);
            return this;
        }
  
        file(filePath) {
            this.logMethodCall('file', filePath);
            this._effect = this._effect ? this._effect : this.effect();
            this._effect.file(filePath);
            return this;
        }
  
        scaleToObject(scale) {
            this.logMethodCall('scaleToObject', scale);
            this._effect = this._effect ? this._effect : this.effect();
            this._effect.scaleToObject(scale);
            return this;
        }
  
        scale(scale) {
            this.logMethodCall('scale', scale);
            this._effect = this._effect ? this._effect : this.effect();
            this._effect.scale(scale);
            return this;
        }
  
        waitUntilFinished(minDelay=0, maxDelay=0) {
            this.logMethodCall('waitUntilFinished', minDelay, maxDelay);
            this._effect = this._effect ? this._effect : this.effect();
            this._effect.waitUntilFinished(minDelay, maxDelay);
            return this;
        }
  
        async(inBool=true) {
            this.logMethodCall('async', inBool);
            this._effect = this._effect ? this._effect : this.effect();
            this._effect.async(inBool);
            return this;
        }
  
        playIf(inCondition) {
            this.logMethodCall('playIf', inCondition);
            this._effect = this._effect ? this._effect : this.effect();
            this._effect.playIf(inCondition);
            return this;
        }
  
        delay(inTime) {
            this.logMethodCall('delay', inTime);
            this._effect = this._effect ? this._effect : this.effect();
            this._effect.delay(inTime);
            return this;
        }
  
        volume(inVolume) {
            this.logMethodCall('volume', inVolume);
            this._effect = this._effect ? this._effect : this.effect();
            this._effect.volume(inVolume);
            return this;
        }
  
        fadeInAudio(inDuration) {
            this.logMethodCall('fadeInAudio', inDuration);
            this._effect = this._effect ? this._effect : this.effect();
            this._effect.fadeInAudio(inDuration);
            return this;
        }
  
        fadeOutAudio(inDuration) {
            this.logMethodCall('fadeOutAudio', inDuration);
            this._effect = this._effect ? this._effect : this.effect();
            this._effect.fadeOutAudio(inDuration);
            return this;
        }
  
        opacity(inOpacity) {
            this.logMethodCall('opacity', inOpacity);
            this._effect = this._effect ? this._effect : this.effect();
            this._effect.opacity(inOpacity);
            return this;
        }
  
        fadeIn(inDuration) {
            this.logMethodCall('fadeIn', inDuration);
            this._effect = this._effect ? this._effect : this.effect();
            this._effect.fadeIn(inDuration);
            return this;
        }
  
        fadeOut(inDuration) {
            this.logMethodCall('fadeOut', inDuration);
            this._effect = this._effect ? this._effect : this.effect();
            this._effect.fadeOut(inDuration);
            return this;
        }
  
        duration(inDuration) {
            this.logMethodCall('duration', inDuration);
            this._effect = this._effect ? this._effect : this.effect();
            this._effect.duration(inDuration);
            return this;
        }
  
        startTime(inTime) {
            this.logMethodCall('startTime', inTime);
            this._effect = this._effect ? this._effect : this.effect();
            this._effect.startTime(inTime);
            return this;
        }
  
        startTimePercentage(inPercentage) {
            this.logMethodCall('startTimePercentage', inPercentage);
            this._effect = this._effect ? this._effect : this.effect();
            this._effect.startTimePercentage(inPercentage);
            return this;
        }
  
        endTime(inTime) {
            this.logMethodCall('endTime', inTime);
            this._effect = this._effect ? this._effect : this.effect();
            this._effect.endTime(inTime);
            return this;
        }
  
        endTimePercentage(inPercentage) {
            this.logMethodCall('endTimePercentage', inPercentage);
            this._effect = this._effect ? this._effect : this.effect();
            this._effect.endTimePercentage(inPercentage);
            return this;
        }
  
        timeRange(inStartTime, inEndTime) {
            this.logMethodCall('timeRange', inStartTime, inEndTime);
            this._effect = this._effect ? this._effect : this.effect();
            this._effect.timeRange(inStartTime, inEndTime);
            return this;
        }
  
        locally(inBool=true) {
            this.logMethodCall('locally', inBool);
            this._effect = this._effect ? this._effect : this.effect();
            this._effect.locally(inBool);
            return this;
        }
  
        forUsers(inUsers) {
            this.logMethodCall('forUsers', inUsers);
            this._effect = this._effect ? this._effect : this.effect();
            this._effect.forUsers(inUsers);
            return this;
        }
  
        baseFolder(inFolder) {
            this.logMethodCall('baseFolder', inFolder);
            this._effect = this._effect ? this._effect : this.effect();
            this._effect.baseFolder(inFolder);
            return this;
        }
  
        from(inObject) {
            this.logMethodCall('from', inObject);
            this._effect = this._effect ? this._effect : this.effect();
            this._effect.from(inObject);
            return this;
        }
  
        atLocation(inLocation) {
            this.logMethodCall('atLocation', inLocation);
            this._effect = this._effect ? this._effect : this.effect();
            this._effect.atLocation(inLocation);
            return this;
        }
  
        attachTo(inObject, inOptions={}) {
            this.logMethodCall('attachTo', inObject, inOptions);
            this._effect = this._effect ? this._effect : this.effect();
            this._effect.attachTo(inObject, inOptions);
            return this;
        }
   
        rotateTowards(inLocation) {
            this.logMethodCall('rotateTowards', inLocation);
            this._effect = this._effect ? this._effect : this.effect();
            this._effect.rotateTowards(inLocation);
            return this;
        }
  
        stretchTo(inLocation, inOptions={}) {
            this.logMethodCall('stretchTo', inLocation, inOptions);
            this._effect = this._effect ? this._effect : this.effect();
            this._effect.stretchTo(inLocation, inOptions);
            return this;
        }
  
        moveTowards(inTarget, inOptions={}) {
            this.logMethodCall('moveTowards', inTarget, inOptions);
            this._effect = this._effect ? this._effect : this.effect();
            this._effect.moveTowards(inTarget, inOptions);
            return this;
        }
  
        moveSpeed(inSpeed) {
            this.logMethodCall('moveSpeed', inSpeed);
            this._effect = this._effect ? this._effect : this.effect();
            this._effect.moveSpeed(inSpeed);
            return this;
        }
  
        snapToGrid(inBool=true) {
            this.logMethodCall('snapToGrid', inBool);
            this._effect = this._effect ? this._effect : this.effect();
            this._effect.snapToGrid(inBool);
            return this;
        }
  
        spriteOffset(inOffset, inOptions={}) {
            this.logMethodCall('spriteOffset', inOffset, inOptions);
            this._effect = this._effect ? this._effect : this.effect();
            this._effect.spriteOffset(inOffset, inOptions);
            return this;
        }
  
        offset(inOffset, inOptions={}) {
            this.logMethodCall('offset', inOffset, inOptions);
            this._effect = this._effect ? this._effect : this.effect();
            this._effect.offset(inOffset, inOptions);
            return this;
        }
  
        randomSpriteRotation(inBool=true) {
            this.logMethodCall('randomSpriteRotation', inBool);
            this._effect = this._effect ? this._effect : this.effect();
            this._effect.randomSpriteRotation(inBool);
            return this;
        }
  
        zeroSpriteRotation(inBool=true) {
            this.logMethodCall('zeroSpriteRotation', inBool);
            this._effect = this._effect ? this._effect : this.effect();
            this._effect.zeroSpriteRotation(inBool);
            return this;
        }
  
        extraEndDuration(inExtraDuration) {
            this.logMethodCall('extraEndDuration', inExtraDuration);
            this._effect = this._effect ? this._effect : this.effect();
            this._effect.extraEndDuration(inExtraDuration);
            return this;
        }
  
        loopOptions(inOptions={}) {
            this.logMethodCall('loopOptions', inOptions);
            this._effect = this._effect ? this._effect : this.effect();
            this._effect.loopOptions(inOptions);
            return this;
        }
  
        origin(inObject) {
            this.logMethodCall('origin', inObject);
            this._effect = this._effect ? this._effect : this.effect();
            this._effect.origin(inObject);
            return this;
        }
  
        name(inName) {
            this.logMethodCall('name', inName);
            this._effect = this._effect ? this._effect : this.effect();
            this._effect.name(inName);
            return this;
        }
  
        private(inBool=true) {
            this.logMethodCall('private', inBool);
            this._effect = this._effect ? this._effect : this.effect();
            this._effect.private(inBool);
            return this;
        }
  
        missed(inBool=true) {
            this.logMethodCall('missed', inBool);
            this._effect = this._effect ? this._effect : this.effect();
            this._effect.missed(inBool);
            return this;
        }
  
        addOverride(inFunc) {
            this.logMethodCall('addOverride', inFunc);
            this._effect = this._effect ? this._effect : this.effect();
            this._effect.addOverride(inFunc);
            return this;
        }
  
        size(inSize) {
            this.logMethodCall('size', inSize);
            this._effect = this._effect ? this._effect : this.effect();
            this._effect.size(inSize);
            return this;
        }
        
  
        affected(inTemplate) {
            this.logMethodCall('template', inTemplate);
            this._effect = this._effect ? this._effect : this.effect();
            this._effect.template(inTemplate);
            return this;
        }
  
        scale(inScale) {
            this.logMethodCall('scale', inScale);
            this._effect = this._effect ? this._effect : this.effect();
            this._effect.scale(inScale);
            return this;
        }
  
        scaleIn(start, finish, options) {
            this.logMethodCall('scaleIn', [start, finish, options]);
            this._effect = this._effect ? this._effect : this.effect();
            this._effect.scaleIn(start, finish, options);
            return this;
        }
  
        scaleOut(inDuration) {
            this.logMethodCall('scaleOut', inDuration);
            this._effect = this._effect ? this._effect : this.effect();
            this._effect.scaleOut(inDuration);
            return this;
        }
  
        spriteScale(inScale) {
            this.logMethodCall('spriteScale', inScale);
            this._effect = this._effect ? this._effect : this.effect();
            this._effect.spriteScale(inScale);
            return this;
        }
  
        anchor(inAnchor) {
            this.logMethodCall('anchor', inAnchor);
            this._effect = this._effect ? this._effect : this.effect();
            this._effect.anchor(inAnchor);
            return this;
        }
  
        spriteAnchor(inAnchor) {
            this.logMethodCall('spriteAnchor', inAnchor);
            this._effect = this._effect ? this._effect : this.effect();
            this._effect.spriteAnchor(inAnchor);
            return this;
        }
  
        center() {
            this.logMethodCall('center');
            this._effect = this._effect ? this._effect : this.effect();
            this._effect.center();
            return this;
        }
  
        randomizeMirror(inBool=true) {
            this.logMethodCall('randomizeMirror', inBool);
            this._effect = this._effect ? this._effect : this.effect();
            this._effect.randomizeMirror(inBool);
            return this;
        }
  
        playbackRate(inRate) {
            this.logMethodCall('playbackRate', inRate);
            this._effect = this._effect ? this._effect : this.effect();
            this._effect.playbackRate(inRate);
            return this;
        }
  
        belowTiles(inBool=true) {
            this.logMethodCall('belowTiles', inBool);
            this._effect = this._effect ? this._effect : this.effect();
            this._effect.belowTiles(inBool);
            return this;
        }
  
        screenSpace(inBool=true) {
            this.logMethodCall('screenSpace', inBool);
            this._effect = this._effect ? this._effect : this.effect();
            this._effect.screenSpace(inBool);
            return this;
        }
  
        screenSpaceAboveUI(inBool=true) {
            this.logMethodCall('screenSpaceAboveUI', inBool);
            this._effect = this._effect ? this._effect : this.effect();
            this._effect.screenSpaceAboveUI(inBool);
            return this;
        }
  
        text(inText) {
            this.logMethodCall('text', inText);
            this._effect = this._effect ? this._effect : this.effect();
            this._effect.text(inText);
            return this;
        }
  
        shape(inShape, inOptions={}) {
            this.logMethodCall('shape', inShape, inOptions);
            this._effect = this._effect ? this._effect : this.effect();
            this._effect.shape(inShape, inOptions);
            return this;
        }
  
        xray(inBool=true) {
            this.logMethodCall('xray', inBool);
            this._effect = this._effect ? this._effect : this.effect();
            this._effect.xray(inBool);
            return this;
        }
  
        mask(inObject) {
            this.logMethodCall('mask', inObject);
            this._effect = this._effect ? this._effect : this.effect();
            this._effect.mask(inObject);
            return this;
        }
  
        tieToDocuments(inDocuments) {
            this.logMethodCall('tieToDocuments', inDocuments);
            this._effect = this._effect ? this._effect : this.effect();
            this._effect.tieToDocuments(inDocuments);
            return this;
        }
  
        syncGroup(inString) {
            this.logMethodCall('syncGroup', inString);
            this._effect = this._effect ? this._effect : this.effect();
            this._effect.syncGroup(inString);
            return this;
        }
  
        zIndex(inIndex) {
            this.logMethodCall('zIndex', inIndex);
            this._effect = this._effect ? this._effect : this.effect();
            this._effect.zIndex(inIndex);
            return this;
        }
  
        sortLayer(inLayer) {
            this.logMethodCall('sortLayer', inLayer);
            this._effect = this._effect ? this._effect : this.effect();
            this._effect.sortLayer(inLayer);
            return this;
        }
  
        tint(inColor) {
            this.logMethodCall('tint', inColor);
            this._effect = this._effect ? this._effect : this.effect();
            this._effect.tint(inColor);
            return this;
        }
  
        screenSpaceScale(inOptions) {
            this.logMethodCall('screenSpaceScale', inOptions);
            this._effect = this._effect ? this._effect : this.effect();
            this._effect.screenSpaceScale(inOptions);
            return this;
        }
  
        screenSpacePosition(inPosition) {
            this.logMethodCall('screenSpacePosition', inPosition);
            this._effect = this._effect ? this._effect : this.effect();
            this._effect.screenSpacePosition(inPosition);
            return this;
        }
  
        isometric(inOptions={}) {
            this.logMethodCall('isometric', inOptions);
            this._effect = this._effect ? this._effect : this.effect();
            this._effect.isometric(inOptions);
            return this;
        }
        
        randomRotation()
        {
            this._effect = this._effect ? this._effect : this.effect();
            this._effect.randomRotation();
            return this;
        }
   
        //wrap --> .loopProperty("sprite", "scale.y", {  from:1 ,to:1.5, duration: 500, pingPong: true, delay:0})
        loopProperty(property, key, options) {
            this._effect = this._effect ? this._effect : this.effect();
            this._effect.loopProperty(property, key, options);
            return this;
        }
  
        //wrap -->.teleportTo(position)
        teleportTo(position, token = this.effected) {
            this._effect = this._effect ? this._effect : this.effect();
            this._effect.animation().on(token).teleportTo(position).snapToGrid();
            return this;    
        }
  
        //wrap thenDO --> .thenDo( () => {console.log("hello")})
        tokenThenDo(func) {
            this._effect = this._effect ? this._effect : this.effect();
            this._effect.thenDo(func);
            return this;
        }

        randomizeMirrorY(inBool=true) {
            this.logMethodCall('randomizeMirrorY', inBool);
            this._effect = this._effect ? this._effect : this.effect();
            this._effect.randomizeMirrorY(inBool);
            return this;
        }

        randomizeMirrorX(inBool=true) {
            this.logMethodCall('randomizeMirrorX', inBool);
            this._effect = this._effect ? this._effect : this.effect();
            this._effect.randomizeMirrorX(inBool);
            return this;
        }

  
     }
 
    Sequencer.SectionManager.registerSection("myModule", "tokenEffect", TokenEffectSection)
     
  });
  class GameHelper{ 
  
    //make static getters for the selected token and the target token
    static get selected(){
        return canvas.tokens.controlled[0];
    }

    static get targeted(){
        return Array.from(game.user.targets)[0];
    }

   static get target(){
        return Array.from(game.user.targets)[0];
    }

    //make static getters for the all selected tokens and the all target tokens
    static get selectedTokens(){
        return canvas.tokens.controlled;
    }

    static get selecteds(){
        return canvas.tokens.controlled;
    }
    static get targetedTokens(){
        return Array.from(game.user.targets); 
    }

    static async targetWithCrossHair( {icon ='icons/skills/movement/feet-winged-boots-brown.webp', label ='target'}={}){

        let config = {
            size: 1,
            icon: icon,
            label: label,
            drawIcon: true,
            drawOutline: true,
            interval: 1 % 2 === 0 ? 1 : -1,
        }
        let position =   await warpgate.crosshairs.show(config);
        return position
    }


    static get targets(){
        return Array.from(game.user.targets);
    }

     static get template(){
          return canvas.templates.placeables[0];
     }

     static async  sleep (ms) {
        await new Promise(resolve => setTimeout(resolve, ms));
    
    
    
    } 

    static async placeCreationTile({power=power, animation=animation, tint=tint, width=150, height=150}={}){
        let position = await GameHelper.targetWithCrossHair({icon:'modules/mm3e-animations/power-icons/' +power +'.webp', label:power})
        const swingPointAnimation =Sequencer.Database.getEntry(animation).originalData
        const tileData = {
            img: swingPointAnimation, // Path to the tile image
            x: position.x-width/2,  
            y: position.y-height/2,
            width: width,
            height: height,
            flags: {
                tag: this.name // Assign the tag to the tile in the flags
            },
        };
        const [tile] = await canvas.scene.createEmbeddedDocuments("Tile", [tileData]);
        await tile.update({"texture.tint":tint})
        return tile
    }

    static get whiteColorFilter() {
        let f =  
        {
                filterType: "ColorMatrix",
                filterId: "whiteColorFilter",
                values: {
                    saturation: 0, // Desaturates the effect to grayscale
                    brightness: 1.5 // Increases brightness to make it appear white
                }
        };
        return f;
    }

    static get GreyTransparentFilter(){
        let f = [ 
        {
                filterType: "ColorMatrix",
                filterId: "GreyTransparentFilter",
                values: {
                    saturation: 0, // Desaturate completely to make it grey
                }
            },
            {
                filterType: "Alpha",
                alpha: 0.5 // Set transparency; 1.0 is fully opaque, 0 is fully transparent
            }
        ];
    }
}


