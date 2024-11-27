Hooks.on("ready", () => { 
        
    class BaseEffectSection extends Sequencer.BaseSection {
    constructor(inSequence) {
        super(inSequence)
        //online  made a change   
        this._effect;
        this.sequence = new Sequence();

        this.tokenAnchor = {
            x: 0, 
            y: 0,
            YdistanceTravelled:0,
            XdistanceTravelled:0,
            
            rotation: 0
        };

        //easy access to tokens
        //comment
        this.targets = Array.from(game.user.targets);
        this.tiles = canvas.tiles.placeables;
        this.selecteds = canvas.tokens.controlled
        
        this.firstTemplate = canvas.templates.placeables[0];
        this.firstSelected = canvas.tokens.controlled[0];
        this.firstTile = canvas.tiles.placeables[0];
        this.firstTarget = this.targets[0];
        this.firstTargeted = this.targets[0];
        
        //tokens participating in sequence
        this.caster = this.firstSelected
        this.affected = undefined //this.firstTargeted || this.caster
        
        this._methodLog = [];

    }

    initalizeRandomNumbers(){
        this.num = Math.floor(Math.random() * 2);
        this.mirrorX;
        this.mirrorY;
        if (Math.random() >= 0.5) {
        this.mirrorX = true;
        } else {
        this.mirrorX = false;
        }
        const minYOffset = -10; // Minimum offset
        const maxYOffset = 10; // Maximum offset
        this.randomYOffset = Math.random() * (maxYOffset - minYOffset) + minYOffset;
    }
    initializeTemplateVariables(){
        
        this.initalizeRandomNumbers()
        const startOffsetDistance = -0.5; // Adjust this value as needed
        this.center = {x:this.affected.center.x , y:this.affected.center.y}
        if(this.affected.ray)
        {
            this.center = {x: (this.affected.ray.A.x + this.affected.ray.B.x)/2, y: (this.affected.ray.A.y + this.affected.ray.B.y)/2}
        }
        
        const dx = this.affected.center.x - this.caster.center.x;
        const dy = this.affected.center.y - this.caster.center.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        const offsetStartX = (dx / distance) * startOffsetDistance;
        const offsetStartY = (dy / distance) * startOffsetDistance;

        this.start = {x: this.caster.center.x + offsetStartX, y:this.caster.center.y + offsetStartY};
        this.end={ x: this.affected.x + this.affected.width, y: this.affected.y + this.affected.height };
        this.templateStart = { x: this.affected.x, y: this.affected.y };
    }
    
    /* static accessors for foundry objects---------------------------------------------- */ 
    static get targets() {
        return Array.from(game.user.targets);
    }

    getTokenCenter(token)
    {
        return {
            x: token.x + ( token.width ) / 2,
            y: token.y + (token.height ) / 2
        }
    }

    getNearestTokenSide(start, token){
        let tokenCenter = this.getTokenCenter(token)
        let x = tokenCenter.x - start.x;
        let y = tokenCenter.y - start.y;
        let angle = Math.atan2(y, x) * 180 / Math.PI;
        let side = Math.round((angle + 180) / 90) % 4;
        //return a {x,y} object with the center of the side
        switch (side) {
            case 0:
                return { x: tokenCenter.x, y: token.y };
            case 1:
                return { x: token.x + token.width, y: tokenCenter.y };
            case 2:
                return { x: tokenCenter.x, y: token.y + token.height };
            case 3:
                return { x: token.x, y: tokenCenter.y };
        }
    }
    static get Tiles() {
        return canvas.tiles.placeables;
    }
    static get Selecteds() {
        return canvas.tokens.controlled;
    }
    static get FirstTemplate() {
        return canvas.templates.placeables[0];
    }
    static get FirstSelected() {
        return canvas.tokens.controlled[0];
    }
    static get FirstTile() {
        return canvas.tiles.placeables[0];
    }
    static get FirstTarget() {
        return this.targets[0];
    }

    logMethodCall(methodName, args) {
        // Convert to array if args is array-like (arguments object), otherwise wrap as an array
        const argsArray = args instanceof Object && args.length !== undefined ? Array.from(args) : [args];
        this._methodLog.push({
            method: methodName,
            args: argsArray
        });
    }
   
    mm3eEffect() {
        this._methodLog = [];
        this._effect = this._effect ? this._effect : this.effect();
        this._effect = this.effect();
        return this;
    }

    /* commands that are  overridden for each power if an animation is desired*/
    animateProperty(property, sub,{from, to, duration, ease, fromEnd}={}) {
        this.logMethodCall('animateProperty', [property, sub,{from, to, duration, ease, fromEnd}]);
        this._effect = this._effect ? this._effect : this.effect();
        this._effect.animateProperty(property, sub, {from, to, duration, ease, fromEnd});
        return this;
    }
    affect({caster, affected}={}){
        return this.affectCommon({caster:caster, affected:affected})
    }  
    affectCommon({caster = this.caster || this.firstSelected, affected = this.affected | this.firstTarget}={}){
        if(affected!=0){ //if we passed in a affected
            this.affected = affected
        }
        if(caster!=0){
            this.caster = caster
        }
        
        if(this.affectLocation){
            return this.mm3eEffect().atLocation(this.affectLocation)
        }
        else{
             if(this.affected){
             //   this.atLocation(this.affected)
            }
            
        return this.mm3eEffect()
        .atLocation(this.affected).attachTo(this.affected); 
        }
    }

    cone({caster, affected}={}){
        return this.coneCommon({affected:affected})
    }
    coneCommon({caster = this.caster, affected =  this.firstTemplate}={}){   
        if(affected!=0){ //if we passed in a affected
            this.affected = affected
        }
        this.initializeTemplateVariables()
        this.affectLocation = this.templateStart
        this.mm3eEffect()
            .atLocation( this.templateStart)
        return this 
    }

    line({affected}={}){
        return this.lineCommon({affected:affected})
    }
    lineCommon({affected =  this.firstTemplate}={}){
        return this.coneCommon({affected:affected})
    }

    burst({affected}={}){
        return this.burstCommon({affected:affected})
    }
    burstCommon({affected = this.firstTemplate}={}){
        
        if(!affected==0){
            this.affected = affected
        }
        return this.affectCommon({affected:affected})
    }

    cast({caster , affected}={}){
        return this.castCommon({caster:caster, affected:affected})
    }
    castCommon({caster = (this.caster || this.firstSelected), affected = (this.affected || this.firstTarget), rotation = true}={}){
        if(caster!=0)
            this.caster = caster
         //   this.atLocation(this.caster)
        if(affected && affected!=0)
            this.affected = affected;
        if(!this.affected) 
        {
            this.affected = this.caster
        }
        this.mm3eEffect()
             this.atLocation(this.caster)
            if(this.affected && this.affected!=this.caster && rotation)
                this.rotateTowards(this.affected)
        return this
    }
    castToTemplate({caster =(this.caster)}={}){
        return this.cast({caster:caster, affected:this.firstTemplate})
    }
    meleeCast({caster , affected}={}){
        return this.meleeCastCommon({caster:caster, affected:affected})
    }
    meleeCastCommon({caster = (this.caster || this.firstSelected), affected = (this.affected || this.firstTarget)}={}){
        return this.castCommon({caster:caster, affected:affected, rotation:false})
    }

    project({caster , affected}={}){
        return this.projectCommon({caster:caster, affected:affected})
    }
    projectCommon({caster = (this.caster || this.firstSelected), affected = (this.affected || this.firstTarget)}={}){
        this.castCommon({caster:caster, affected:affected,rotation:false})
        let stretchToLocation=affected;
        if(this.affected.constructor.name=="MeasuredTemplate" && this.affected.document.t=='cone' || this.affected.document.t=='ray'){
            this.initializeTemplateVariables()
            stretchToLocation = this.templateStart
        }
        if(this.affectLocation){
            stretchToLocation = this.affectLocation
        }
        
         this.stretchTo(stretchToLocation, {
         attachTo: true
        }).spriteOffset({
            x: 30,
            y: 0
        })

        return this; 
    }
    projectToConeCommon({caster = (this.caster || this.firstSelected), affected = ( this.firstTemplate || this.affected)}={}){
        
        this.castCommon({caster:caster, affected:affected,rotation:false})
        this.initializeTemplateVariables()
        this.atLocation(this.caster)
        this.stretchTo(this.templateStart)
        this.affectLocation = this.templateStart
        return this;
    } 
    projectToCone({caster , affected}={}){
        return this.projectToConeCommon({caster:caster, affected:affected})
    }
    projectToLine({caster , affected}={}){
        return this.projectToConeCommon({caster:caster, affected:affected})
    }
    
    knockDown({affected:affected}){
        this.startMovement(affected)
        .turnLeft({affected:affected, distance:90,  duration:400})  //simpler move api
        .endMovement()
        return this
        
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

    shake({target=this.affected, strength=100, rotation=false, duration, fadeOutDuration=0}={}) {
        this._effect = this._effect ? this._effect : this.effect();
        this._effect.animation().on(this.affected).opacity(1).canvasPan().shake({
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
        this.atLocation(this.caster)
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
    calculateFrontAndCenterPos(distance = 0.25)
    {
        this.affectedCenter = {
            x: this.affected.x+canvas.grid.size*this.affected.document.width/2,
            y: this.affected.y+canvas.grid.size*this.affected.document.width/2,
            };
            
        this.casterCenter = {
        x: this.caster.x+canvas.grid.size*this.affected.document.width/2,
        y: this.caster.y+canvas.grid.size*this.affected.document.width/2,
        };
        
        this.middleposition = {
            x: (this.affected.x - this.caster.x)*distance,
            y: (this.affected.y - this.caster.y)* distance,
        };
        
    }

    lungeTowardTarget({ scale =1, distance =.25, duration= 100, repeats=1}={}){
        this.calculateFrontAndCenterPos(distance)
        
        this._effect = this._effect ? this._effect : this.effect();   
        this._effect.animation()
            .on(this.caster)
            .opacity(0)
            // .wait(1)
            

                
    this._effect.effect()
        .from(this.caster)
        .atLocation(this.caster)
        .mirrorX(this.caster.document.mirrorX)
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
            .mirrorX(affected.document.mirrorX)
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

    resistAndStruggle(target = this.affected){
        this.mm3eEffect()
            this.affectCommon(target)
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

    /*movement helpers --------------------------------------------------------------------------*/
    startMovement(token=this.affected) {
        this.tokenAnchor = {
            x: token.document.x,
            y: token.document.y,
            YdistanceTravelled:0,
            XdistanceTravelled:0,
            rotation: token.document.rotation
        }
        this.moving = true;
        this._effect = this._effect ? this._effect : this.effect();
        this._effect.effect().animation().on(token).opacity(0)
        return this;
    }
    endMovement(token=this.affected) {
        this._effect = this._effect ? this._effect : this.effect();
        this._effect.thenDo( () => {
            token.document.update({
                rotation: token.document.rotation + this.tokenAnchor.rotation
            });
        }
        )

        this._effect.effect().animation().on(token).teleportTo({
            x: this.tokenAnchor.x,
            y: this.tokenAnchor.y
        }).opacity(1)
        return this;
    }

    turnLeft({token=this.affected, distance=0, duration=0, ease="easeInOutCubic"}={}) {
        return this.turnSprite("left", token, distance, duration, ease)
    }
    turnRight({token=this.affected, distance=0, duration= 0, ease="easeInOutCubic"}={}) {
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

    loopLeft({token=this.affected, distance, duration, speed=100, ease="easeInOutCubic", pause=true}={}) {
        return this.loopSprite(token, "left", distance, duration, ease, speed, pause)
    }

    loopRight({token=this.affected, distance, duration, speed=100, ease="easeInOutCubic", pause=true}={}) {
        return this.loopSprite(token, "right", distance, duration, ease, speed, pause)
    } 

    loopUp({token=this.affected, distance, duration, speed=100, ease="easeInOutCubic", pause=true}={}) {
        return this.loopSprite(token, "up", distance, duration, ease, speed, pause)
    }

    loopDown({token=this.affected, distance, duration, speed=100, ease="easeInOutCubic", pingpong=true}={}) {
        return this.loopSprite(token, "down", distance, duration, ease, speed, pingpong)
    }

    loopScaleHeight({token=this.affected, from, to, duration, delay,  ease="easeInOutCubic", pingpong=true}={}) {
        return this.loopScale(token, "scale.y", from, to, duration, delay,ease, pingpong)
    }

    loopScaleWidth({token=this.affected, from, to, duration, delay,  ease="easeInOutCubic", pingpong=true}={}) {
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

    loopSprite(token=this.affected, position, distance, duration, ease, speed, pause=true) {
        let moveProperty
        let start 
        if (position == "left" | position == "right") {
            moveProperty = "position.x"
            start = this.tokenAnchor.XdistanceTravelled
            if (position == "left") {
                
                distance = distance * -1
            }
        }
        if (position == "up" | position == "down") {
            moveProperty = "position.y"
            start = this.tokenAnchor.YdistanceTravelled
            if (position == "up") {
                distance = distance * -1
            }
        }
        this._effect = this._effect ? this._effect : this.effect();

        if(this.tokenAnchor.x==0 && this.tokenAnchor.y==0)
        {
            this.startMovement(token);
        }
        this._effect.effect().from(token).loopProperty("sprite", moveProperty, {
            values: [start, distance],
            duration: duration,
            ease: ease,
            pingPong: true
        })
            /*.atLocation({
            x: this.tokenAnchor.x + canvas.grid.size / 2,
            y: this.tokenAnchor.y + canvas.grid.size / 2
        })*/

        if (position == "left" | position == "right"){
            this.tokenAnchor.x += distance;
            this.tokenAnchor.XdistanceTravelled +=distance
        }
        if (position == "up" | position == "down"){
            this.tokenAnchor.y += distance;
            this.tokenAnchor.YdistanceTravelled +=distance
        }
        if (pause) {
            this._effect.wait(duration * .9)
        }
        return this
    }


    /*effect wrapper methods --------------------------------------------------------------------------*/

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

    rotateIn(rotation, duration, options) {
        this.logMethodCall('rotateIn', rotation, duration, options);
        this._effect = this._effect ? this._effect : this.effect();
        this._effect.rotateIn(rotation, duration, options);
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

    noLoop(inBool=true) {
        this.logMethodCall('noLoop', inBool);
        this._effect = this._effect ? this._effect : this.effect();
        this._effect.noLoop(inBool);
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
    spriteRotation(spriteRotation) {
        this.logMethodCall('spriteRotation', spriteRotation);
        this._effect = this._effect ? this._effect : this.effect();
        this._effect.spriteRotation(spriteRotation);
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

    scaleOut(start, finish, options) {
        this.logMethodCall('scaleOut', [start, finish, options]);
        this._effect = this._effect ? this._effect : this.effect();
        this._effect.scaleOut(start, finish, options);
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

    class PowerEffectSection extends BaseEffectSection {
        constructor(inSequence) {
            super(inSequence);
        }
        static async placeCreationTile({animation='animated-spell-effects-cartoon.energy.01', tint="#745002"}={}){
            let creationTile = await GameHelper.placeCreationTile({power: this.getClass().getName(), animation:animation, tint:tint, height:300, width:300}) 
        }
         affectConcealment({affected = (this.affected|this.firstSelected),filter= GameHelper.whiteColorFilter}= {}){
                
            return this.affectCommon({affected:affected})
                .scaleToObject(1.5)
                .file("jb2a.shimmer.01.blue")
                .filter(filter.filterType, filter.values)
                .playSound('modules/mm3e-animations/sounds/action/powers/invisible1.ogg')
                .thenDo( ()=>{
                    this.affected.document.update({ "alpha": 0.1 });
                })   
            
        }

        affectAffliction({affected = this.affected}={}){
            return this.affectCommon({affected:affected})
            .affliction()
        }
        affliction(){
            return this.file('jb2a.condition.curse')
            .scaleToObject(2)
            .persist(true)
            .playSound('modules/mm3e-animations/sounds/Spells/Debuff/spell-*.mp3')
        }

        affectDamage({affected = this.affected}={}){
            this.affectCommon({affected:affected})
            return this.damage()
        }
        damage(){
            return this.file('animated-spell-effects-cartoon.energy.flash')
            .scaleToObject(1)
            .playSound('modules/mm3e-animations/sounds/Combat/Melee%20Natural/melee-hit-1.mp3')
        }

        affectHealing({affected = this.firstSelected}={}){

            this.affectCommon({affected:affected})
            .healing()
            return this;
        }
        healing(){
            this.file('jb2a.healing_generic.200px.yellow02')
            .playSound('modules/mm3e-animations/sounds/Spells/Buff/spell-buff-long-3.mp3')
            return this;
        }

        affectIllusion({affected = this.affected}={})
        {
            this. affectCommon({affected:affected})
            .illusion()
            return this;
        }
        illusion(){
            return this .file('jb2a.markers.stun.dark_teal.02')
            .filter("ColorMatrix", { saturate: 0, brightness:.5 , hue: 200  })
            .scaleToObject(1)
            .spriteOffset({x:0, y:-25})
            .belowTokens(true)
            .persist(true)
            .playSound('modules/mm3e-animations/sounds/action/powers/Seers_AuraVoicesL_Loop.ogg')
            return this
        }

        affectMindControl({affected = this.affected}={})
        { 
            return this.affectCommon({affected:affected})
            .mindControl()
        }
        mindControl(){
            this.file("jaamod.spells_effects.confusion")
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
            return this;
        }

        affectNullify({affected = this.affected}={})
        {
            return this.affectCommon({affected:affected})
            .nullify()
           
        }
        nullify(){
            return this.file("jb2a.condition.curse.01.012")
            .playSound('modules/mm3e-animations/sounds/Spells/Debuff/spell-decrescendo-short-1.mp3')
        }

        affectProtection({affected = this.affected}={})
        {
            return this.affectCommon({affected:affected})
            .protection()
        }
        protection(){
            this.file("jb2a.shield")
            .persist( true)
            .playSound('modules/mm3e-animations/sounds/action/powers/ForcefieldOn.ogg')
            .pause(1000)
            .playSound('modules/mm3e-animations/sounds/action/powers/ForceField*_loop.ogg')
        }

        static async placeSummonedActor({actor }={}){
            let creationTile = await GameHelper.placeSummonedActor({actor}) 
        }

        /* unecessary
        affectSummon({affected = this.affected}={})
        {
            return this.affectCommon({affected:affected})
        }*/

        affectTransform({affected = this.affected, image=this.getClass().getName()+'.webm'}={})
        {
             this.affectCommon({affected:affected})
             //update the token image
             this.affected.document.update({ "img": image });
             return this;
        }

        affectWeaken({affected = (this.affected|this.firstSelected)}={}){
            this.affectCommon({affected:affected})
            return this.weaken(affected)
        }
        weaken(affected){
            let tintColor = '#808080'
            let hue = 350

            this.calculateFrontAndCenterPos(this.affected, this.affected.document.width/2)
            this.affectCommon({affected:this.affected})
                .from(this.affected)
                .attachTo(this.affected)
                .filter("ColorMatrix", { saturate:-1})
                .scaleToObject(1, {considerTokenScale: true})
                .persist()
                .fadeIn(3000)       
            .affectCommon()
                .delay(150)
                .file("jb2a.impact.004.green")
                .rotateTowards(this.caster)
                .scaleToObject(1.45)
                .spriteScale({ x: 0.75, y: 1.0 })
                .filter("ColorMatrix", { saturate: 0, brightness:0.2 , hue: hue })
                .spriteOffset({ x: -0.15 }, { gridUnits: true })
                .zIndex(2)
            
            .affectCommon()
                .file("jb2a.impact.ground_crack.02.white")
                .rotateTowards(this.caster)
                .spriteOffset({x:-0.4}, {gridUnits:true})
                .filter("ColorMatrix", { saturate:0, brightness:1.5 })
                .size(this.caster.document.width*1.5, {gridUnits:true})
                .tint(tintColor)
                .mask(this.affected)
                .zIndex(1)

            .affectCommon()
                .file("jb2a.extras.tmfx.outflow.circle.01")
                .attachTo(this.affected)
                .filter("ColorMatrix", { brightness: 0, saturate:-1})
                .scaleToObject(1.45, {considerTokenScale: true})
                .fadeIn(3000)
                .fadeOut(1000)
                .belowTokens()
                .duration(5000)

            .affectCommon()
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

        startFly({caster}={}){
            this.castCommon({caster:caster, affected:caster})
                .loopUp({distance:75, duration:1000, speed:200, ease:"easeInCirc", pause: false})
                .file("animated-spell-effects-cartoon.energy.16")
                .rotate(90)
                .scaleToObject(1)
                .filter("ColorMatrix" , {
                     hue: 500, 
                     contrast: 0, 
                     saturate: 0,
                     brightness: 1
                 })
                .repeatEffect()    //inherit last effect with any modifications we want below
                    .spriteOffset({x:0, y: 25})
                    .playSound("modules/mm3e-animations/sounds/action/powers/whoosh9.ogg")
                .repeatEffect()   //inherit last effect with any modifications we want below
                    .spriteOffset({x:0, y: -25})
                    .pause(900)
                return this
        }
        endFly({caster:caster}={}){
             this.castCommon({caster:caster, affected:caster})
                .loopDown({distance:75, duration:1000, speed:200, ease:"easeInCirc", pause: false})
 
                .castCommon()
                .file("animated-spell-effects-cartoon.energy.16")
                .rotate(270)
                .scaleToObject(1)
                .filter("ColorMatrix" , {
                     hue: 500, 
                     contrast: 0, 
                     saturate: 0,
                     brightness: 1
                 })
            .repeatEffect()   //inherit last effect with any modifications we want below
                .spriteOffset({x:0, y: 25})
            .repeatEffect()   //inherit last effect with any modifications we want below
                .playSound("modules/mm3e-animations/sounds/action/powers/Whoosh2.ogg")
                .spriteOffset({x:0, y: -25})
                .pause(300)
            .endMovement()
            return this;
        }

        leap({token = this.affected, position, height=1.25}={}){
            if(!position){
                throw new Error("Position is required for leap")
            }
            this.hideToken(token)
            //.loopUp({distance:[50,0,50], duration:500, duration: 500, delay:0, pause:false})
            .loopProperty("sprite", "position.y", { values: [50, 0, 50], duration: 500})
            .loopScaleHeight({from:1,to:height, duration: 500, pingPong: true, delay:0})
            .loopScaleWidth({from:1,to:height, duration: 500, pingPong: true, delay:0})
            .moveTowards(position, {rotate:false})
            .anchor({ x: 0.5, y: 1.5 })
            .zIndex(2)
    
        .mm3eEffect()
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

        speed({caster, position}={}){
            if(!position){
                throw new Error("Position is required for speed")
            }
            this.castCommon({caster:caster, affected:caster})
            .animation()
                .on(this.caster)
                .fadeOut(0)
                .waitUntilFinished()
            .effect()
                .file(this.caster.document.texture.src) 
                .scale(this.caster.document.texture.scaleX) 
                .opacity(1) 
                .from(this.caster)
                .atLocation(this.caster)
                .moveSpeed(1000)
                .moveTowards(position, { ease: "easeInOutCubic", rotate: true })
                .duration(300) 
                .wait(100)
            
            this.descriptorSpeed(position)

            .animation()
                .on(this.caster)
                .teleportTo(position)
                .snapToGrid()
                .offset({ x: -1, y: -1 })
                .waitUntilFinished(-1800) 
        
            .animation()
                .on(this.caster)
              //  .fadeIn(100)
                .opacity(1)
                .waitUntilFinished(-1800)

            return this

        }
        descriptorSpeed(){
            return this
        }

        burrow({caster, position}={}){
           if(!position){
                throw new Error("Position is required for burrow")
            }

            super.castCommon({caster:caster, affected:caster})
                .delay(500)
                .file("jb2a.extras.tmfx.outpulse.circle.03.fast")
                
                .scaleToObject(2)
                .belowTokens()
                .opacity(0.5)
                .duration(2000)
            
                .pause(800)
            
            super.castCommon()
                .file("jb2a.explosion.04.orange")

                .fadeOut(5000)
                .anchor({x:0.2})
                .scaleToObject(2)
                .duration(1000)
                .rotateTowards(position, { cacheLocation: true })
                .loopProperty("sprite", "rotation", { from: 0, to: 360, duration: 3000})
                .scaleOut(0.175, 5000, {ease: "easeOutQuint", delay: -3000})
                .zIndex(3)
            
            this.castCommon()
                .file("jb2a.impact.ground_crack.white.03")
                .anchor({x: 0.1})
                .atLocation(this.caster, {cacheLocation: true})
                .rotateTowards(position, {cacheLocation: true})
                .scaleToObject(2)
                .belowTokens()
                .opacity(1)
            
            this.castCommon()
                .file("-Assets/Images/Effects/CrackedEarthWEBP.webp")
                .belowTokens()
                .anchor({x: -0.2})
                .size(2, { gridUnits: true })
                .atLocation(token, { cacheLocation: true })
                .rotateTowards(position, { cacheLocation: true })
                .delay(300)
                .duration(8000)
                .fadeOut(2000)
                .opacity(1)
                .zIndex(1)
            
                .canvasPan()
                .delay(200)
                .shake({ duration: 800, strength: 5, rotation: false })
            
                .canvasPan()
                .delay(1000)
                .shake({ duration: 5000, strength: 2, rotation: false, fadeOutDuration: 1000 })
            
            this.castCommon()
                .file("blfx.spell.template.line.crack1")
                .stretchTo(position)
                .delay(200)
                .zIndex(5)
            
                .pause(500)
            
            this.castCommon()
                .file("jb2a.burrow.out.01.brown.1")
                .atLocation(this.caster, {offset: {y: -0}, gridUnits: true})
                .scaleToObject(4)
                .fadeOut(1000, {ease: "easeInExpo"})
                .zIndex(5)
            
                .pause(100)
            
            this.castCommon()
                .delay(100)
                .file("animated-spell-effects-cartoon.smoke.11")
                .playbackRate(0.65)
                .fadeIn(250)
                .fadeOut(1500)
                .scaleToObject(4)
                .randomRotation()
                .opacity(0.5)
                .filter("ColorMatrix", { brightness: 0.8 })
                .zIndex(4)
            
            this.castCommon()
                .file("jb2a.particles.outward.orange.01.03")
                .fadeIn(250, {ease: "easeOutQuint"})
                .scaleIn(0, 200, {ease: "easeOutCubic"})
                .fadeOut(5000, {ease: "easeOutQuint"})
                .opacity(1)
                .filter("ColorMatrix", { saturate: 0.75, brightness: 0.85 })
                .randomRotation()
                .scaleToObject(4)
                .duration(10000)
            
            .animation()
                .on(this.caster)
                .teleportTo(position)
                .delay(1000)
                .snapToGrid()
                .fadeOut(50)
                .fadeIn(50)
                .offset({ x: -1, y: -1 })
                .waitUntilFinished(100)
                
                .pause(1000)
            
            
            this.castCommon()
                .file("jb2a.burrow.out.01.brown.1")
                .atLocation(this.caster, {offset: {y: -0}, gridUnits: true})
                .scaleToObject(4)
                .fadeOut(1000, {ease: "easeInExpo"})
                .zIndex(5)
                
                .pause(100)
            
            this.castCommon()
                .delay(100)
                .file("animated-spell-effects-cartoon.smoke.11")
                .playbackRate(0.65)
                .fadeIn(250)
                .fadeOut(1500)
                .scaleToObject(4)
                .randomRotation()
                .opacity(0.5)
                .filter("ColorMatrix", { brightness: 0.8 })
                .zIndex(4)
            
            .animation()
                .delay(1000)
                .on(this.caster)
                .fadeIn(200)
                .pause(500)
            
            this.castCommon()
                .file("jb2a.burrow.out.01.still_frame.0")
                .atLocation(position)
                .scaleIn(0, 200, {ease: "easeOutCubic"})
                .belowTokens()
                .scaleToObject(5)
                .duration(1200)
                .fadeIn(200, {ease: "easeOutCirc", delay: 200})
                .fadeOut(300, {ease: "linear"})
                .filter("ColorMatrix", { saturate: -1, brightness: 2 })
                .filter("Blur", { blurX: 5, blurY: 10 })
                .zIndex(0.1)
            
            this.castCommon()
                .file("jb2a.burrow.out.01.still_frame.0")
                .atLocation(position)
                .filter("ColorMatrix", { saturate: 0.8, brightness: 0.85 })
                .scaleIn(0, 200, {ease: "easeOutCubic"})
                .belowTokens()
                .scaleToObject(5)
                .fadeOut(5000, {ease: "easeOutQuint"})
                .duration(10000)
            return this
        }

        swing({caster:caste,positin}={}){
            if(!caster){
                throw new Error("Caster is required for swing")
            }
        }

        teleport({caster:caster, position}={}){
            if(!position){
                throw new Error("Position is required for teleport")
            }
            super.castCommon({caster:caster, affected:caster})
                .file("jb2a.misty_step.01.orange")
                .scaleToObject(1.5)
            .filter("ColorMatrix", { hue: hue })
            .opacity(0.8)

            .animation()
                .on(this.caster)
                .teleportTo(position)
                .snapToGrid()
                .fadeOut(50)
                .fadeIn(50)
                .offset({ x: -1, y: -1 })
                .waitUntilFinished(100)

            super.castCommon()
                .file(`jb2a.swirling_leaves.complete.02.${leaves}`)
                .scaleToObject(2.25)
                .fadeOut(300)
                .filter("ColorMatrix", { saturate: saturate })
                .animateProperty("sprite", "width", { from: token.document.width*2.25, to: 0, duration: 1500, ease: "easeInQuint", gridUnits:true, delay: 500})
                .animateProperty("sprite", "height", { from: token.document.width*2.25, to: 0, duration: 1500, ease: "easeInQuint", gridUnits:true, delay: 500})
                .animateProperty("sprite", "width", { from: 0, to: token.document.width*2.25, duration: 500, ease: "easeOutCubic", gridUnits:true, delay: 2500})
                .animateProperty("sprite", "height", { from: 0, to: token.document.width*2.25, duration: 500, ease: "easeOutCubic", gridUnits:true, delay: 2500})
                .playbackRate(2)
                .belowTokens()
                .tint(tint)

            .pause(1000)

            super.castCommon()
                .file("jb2a.misty_step.02.orange")
                .atLocation(token)
                .filter("ColorMatrix", { hue: hue })
                .opacity(0.8)
                .scaleToObject(1.5)

            .animation()
                .delay(1400)
                .on(token)
                .fadeIn(200)
                .waitUntilFinished(-750)

            super.castCommon()
                .file("jb2a.ground_cracks.orange.01")
                .atLocation(token)
                .opacity(0.9)
                .scaleToObject(3)
                .duration(3000)
                .fadeIn(100)
                .fadeOut(1000)
                .belowTokens()

            super.castCommon()
                .file("jb2a.impact.ground_crack.still_frame.01")
                .atLocation(token)
                .opacity(0.9)
                .scaleToObject(3)
                .duration(4000)
                .fadeIn(100)
                .fadeOut(1000)
                .belowTokens()
        }
    }
    class TemplatedDescriptorEffect extends PowerEffectSection{
        constructor(inSequence) {
            super(inSequence);
        }
        cast({caster, affected,rotation=false}={}){
            super.castCommon({caster:caster, affected:affected, rotation:false})
            this.descriptorCast()
            return this
        }
        descriptorCast(){
            return this
        }

        meleeCast({caster, affected}={}){
            super.castCommon({caster:caster, affected:affected, rotation:false})
            this.descriptorMeleeCast()
            return this
        }

        project({caster, target}={}){
            super.projectCommon({caster:caster, target:target})
            this.descriptorProject()
            return this
        }
        projectToCone({caster, affected}={}){
            super.projectToConeCommon()
            this.descriptorProjectToCone()
            return this
        }  

        projectToLine({caster, affected}={}){
            super.projectToConeCommon()
            this.descriptorProjectToLine()
            return this
        }

         projectToBurst({caster, affected}={}){
            super.projectCommon()
            this.descriptorProjectToBurst()
            return this
        }

        burst({affected}={}){
            super.burstCommon({affected:affected})
            this.descriptorBurst()
            return this
        }

        line({affected}={}){
            super.lineCommon({affected:affected})
            this.descriptorLine()
            return this
        }

        cone({affected}={}){
            super.coneCommon({affected:affected})
            this.descriptorCone()
            return this
        }

        affect({affected}={}){
            super.affectCommon({affected:affected})
            this.descriptorAffect()
            return this;
        }

        affectAura({affected = this.affected|| this.firstSelected, persist}={}){
            super.affectCommon({affected:affected})
            .pause(1000)
            this.descriptorAura()
            return this
        }

        descriptorAffect(){ // override for common affect logic in descriptior
            return this
        }

        descriptorAura(){  
            return this;
        }

        affectAffliction({affected}={}){
            super.affectCommon({affected:affected})
            .descriptorAffect()
            .descriptorAffliction()
            return this
        }
        descriptorAffliction(){ //optionally override for custom sequence effect 
            super.affliction({affected:this.affected})
            return this
        }

        affectCreate({affected}={}){
           super.affectCommon({affected:affected})
           this.descriptorAffect()
           this.descriptorCreate()
           return this
        }
        descriptorCreate(){ //optionally override for custom sequence effect
            super.affectCreate({affected:this.affected})
            return this
        }

        affectConcealment({affected}={})
        {
            super.affectCommon({affected:affected})
            super.affectConcealment({affected:this.affected})
            this.affectAura({affected:affected, persist:true})
            return this;
        }
        descriptorConcealment(){
            super.concealment({affected:this.affected})
            return this;
        }

        affectDamage({affected}={}){
            super.affectCommon({affected:affected})
            this.descriptorAffect()
            this.descriptorDamage()
            return this
        }
        descriptorDamage(){
            super.damage({affected:this.affected})
            return this
        }

        affectHealing({affected}={}){
           super.affectCommon({affected:affected})
           this.descriptorHealing()
           this.affectAura({affected:affected})
           return this
        }
        descriptorHealing(){
            super.healing({affected:this.affected})
            return this
        }
        
        affectIllusion({affected}={}){
            super.affectCommon({affected:affected})
            this.descriptorIllusion()
            this.affectAura({affected:affected, persist:true})
            return this
        }
        descriptorIllusion(){
            super.illusion({affected:this.affected})
            return this
        }

        affectMindControl({affected}={}){
            super.affectCommon({affected:affected})
            this.descriptorMindControl()
            this.affectAura({affected:affected, persist:true})
            return this
        }
        descriptorMindControl(){
            super.mindControl({affected:this.affected})
            return this
        }

        affectMoveObject({affected}={}){
            super.affect({affected:affected})
            super.affectMoveObject({affected:this.affected})
            return this
        }
       
        affectNullify({affected}={}){
            super.affectCommon({affected:affected})
            this.descriptorNullify()
            this.affectAura({affected:affected})
            return this
        }
        descriptorNullify(){
            super.nullify({affected:this.affected})
            return this
        }

        affectProtection({affected}={}){
            super.affectCommon({affected:affected})
            this.descriptorProtection()
            this.affectAura({affected:affected, persist:true})
            return this
        }
        descriptorProtection(){
            super.protection({affected:this.affected})
            return this
        }

        affectSummon({affected}={}){
            super.affectCommon({affected:affected})
            this.descriptorSummon()
            this.affectAura({affected:affected, persist:true})
            return this
        }
        descriptorSummon(){
            super.summon({affected:this.affected})
            return this
        }

        affectTransform({affected}={}){
            super.affectCommon({affected:affected})
            this.descriptorTransform()
            this.affectAura({affected:affected, persist:true})
            return this
        }
        descriptorTransform(){
            super.transform({affected:this.affected})
            return this
        }

        affectWeaken({affected}={}){
            super.affectCommon({affected:affected})
            this.descriptorWeaken()
            this.affectAura({affected:affected, persist:true})
            return this
        }
        descriptorWeaken(){
            super.weaken({affected:this.affected})
            return this
        }

     

        startFly({caster}={}){
            this.cast({caster:caster})
            super.startFly({caster:this.caster})
            
            return this
        }
        
        endFly({caster}={}){
            this.cast({caster:caster})
            super.endFly({caster:this.caster})
            return this;
        }

        leaping({caster, position, height}={}){
            this.cast({caster:caster})
            super.leap({caster:this.caster, position:position, height:height})
            this.affect({affected:this.caster})
            return this
        }

        speed({caster,position}={}){
            this.cast({caster:caster})
            super.speed({caster:this.caste,position:position})
            return this
        }

        burrowing({caster}={}){
            this.cast({caster:caster})
            super.burrow({caster:this.caster})
            this.affectAura({affected:this.caster})
            
            return this
        }

        swinging({caster}={}){
            this.cast({caster:caster})
            super.swing({caster:this.caster})
            this.affectAura({affected:this.caster})
            return this
        }

        teleport({caster}={}){
            this.cast({caster:caster})
            super.teleport({caster:this.caster})
            this.affectAura({affected:this.caster})
            return this
        }
        
        // descriptor-personal-swimming
        // descriptor-personal-leaping
        // descriptor-personal-flight
        // descriptor-personal-swinging
        // descriptor-personal-flight
        // descriptor-personal-speed
        // descriptor-personal-teleport

        // descriptor-personal-concealment
        // descriptor-personal-deflect
        // descriptor-personal-growth
        // descriptor-personal-regeneration
        // descriptor-personal-Insubstantiality
        // descriptor-personal-morph
        // descriptor-personal-protection
        // descriptor-personal-quickness
        // descriptor-personal-sense
        // descriptor-personal-remote senses
        // descriptor-personal-shrinking

        
    }
    class ExampleEffectSection extends TemplatedDescriptorEffect {
        constructor(inSequence) {
            super(inSequence);
        }
       /* castCone({affected, caster}={}){
            return this
        }*/
    
        descriptorCast(){
             return this
        }
        descriptorMeleeCast(){
            return this
        }

        descriptorProject() {
            return this;
        }
        descriptorProjectToLine() {
            return this.descriptorProject()
        }
        descriptorProjectToCone() {
            return this.descriptorProject()
        }   

        descriptorBurst() {
            return this;
        }
        descriptorLine() {
            return this
        }
        descriptorCone() {
            return this;
        }
        descriptorAffliction() {
             
            return this;
        }
        descriptorAura(){
            return this
        }
        descriptorDamage(){
            return this;
        }
        descriptorHealing(){
           
            return this
        }

        /*
       
        descriptorAura(){
            return this
        }

        descriptorConcealment()
        {
            return this;
        }

        descriptorIllusion(){
            return this
        }
        descriptorInsubstantial(){
            return this
        }

        descriptorMindControl(){
            return this
        }

        descriptorMindControl(){
            return this
        }

        descriptorNullify(){
            return this
        }

        descriptorProtection(){
            return this
        }

        descriptorTransform(){
            return this
        }

        descriptorWeaken(){
            return this
        }*/
    
    }
    
    class NoDescriptorEffectSection extends TemplatedDescriptorEffect {
            constructor(inSequence) {
               super(inSequence);
           }
           descriptorCast(){
               return this
           }
   
           descriptorMeleeCast(){
               return this
           }
   
           descriptorProject(){
               return this
           }
   
           descriptorProjectToCone(){
               return this
           }
   
           descriptorProjectToLine(){
               return this
           }
   
           descriptorBurst(){
               return this
           }
   
           descriptorLine(){
               return this
           }   
   
           descriptorCone(){
               return this
           }
   
           descriptorAffect(){
               return this
           }
   
           descriptorAffectAura(){
               return this
           }
    }
   
    class AirEffectSection extends TemplatedDescriptorEffect {
        constructor(inSequence) {
            super(inSequence);
        }
       /* castCone({affected, caster}={}){
            return this
        }*/
    
        descriptorCast(){
             return this
        }
        descriptorMeleeCast(){
            return this
        }

        descriptorProject() {
            return this;
        }
        descriptorProjectToLine() {
            return this.descriptorProject()
        }
        descriptorProjectToCone() {
            return this.descriptorProject()
        }   

        descriptorBurst() {
            return this;
        }
        descriptorLine() {
            return this
        }
        descriptorCone() {
            return this;
        }
        descriptorAffliction() {
             
            return this;
        }
        descriptorAura(){
            return this
        }
        descriptorDamage(){
            return this;
        }
        descriptorHealing(){
           
            return this
        }

        /*
       
        descriptorAura(){
            return this
        }

        descriptorConcealment()
        {
            return this;
        }

        descriptorIllusion(){
            return this
        }
        descriptorInsubstantial(){
            return this
        }

        descriptorMindControl(){
            return this
        }

        descriptorMindControl(){
            return this
        }

        descriptorNullify(){
            return this
        }

        descriptorProtection(){
            return this
        }

        descriptorTransform(){
            return this
        }

        descriptorWeaken(){
            return this
        }*/
    
    }
    class ColorEffectSection extends TemplatedDescriptorEffect {
        constructor(inSequence) {
            super(inSequence);
        }
       /* castCone({affected, caster}={}){
            return this
        }*/
    
        descriptorCast(){
             return this
        }
        descriptorMeleeCast(){
            return this
        }

        descriptorProject() {
            return this;
        }
        descriptorProjectToLine() {
            return this.descriptorProject()
        }
        descriptorProjectToCone() {
            return this.descriptorProject()
        }   

        descriptorBurst() {
            return this;
        }
        descriptorLine() {
            return this
        }
        descriptorCone() {
            return this;
        }
        descriptorAffliction() {
             
            return this;
        }
        descriptorAura(){
            return this
        }
        descriptorDamage(){
            return this;
        }
        descriptorHealing(){
           
            return this
        }

        /*
       
        descriptorAura(){
            return this
        }

        descriptorConcealment()
        {
            return this;
        }

        descriptorIllusion(){
            return this
        }
        descriptorInsubstantial(){
            return this
        }

        descriptorMindControl(){
            return this
        }

        descriptorMindControl(){
            return this
        }

        descriptorNullify(){
            return this
        }

        descriptorProtection(){
            return this
        }

        descriptorTransform(){
            return this
        }

        descriptorWeaken(){
            return this
        }*/
    
    }
    class CosmicEffectSection extends TemplatedDescriptorEffect {
        constructor(inSequence) {
            super(inSequence);
        }
       /* castCone({affected, caster}={}){
            return this
        }*/
    
        descriptorCast(){
             return this
        }
        descriptorMeleeCast(){
            return this
        }

        descriptorProject() {
            return this;
        }
        descriptorProjectToLine() {
            return this.descriptorProject()
        }
        descriptorProjectToCone() {
            return this.descriptorProject()
        }   

        descriptorBurst() {
            return this;
        }
        descriptorLine() {
            return this
        }
        descriptorCone() {
            return this;
        }
        descriptorAffliction() {
             
            return this;
        }
        descriptorAura(){
            return this
        }
        descriptorDamage(){
            return this;
        }
        descriptorHealing(){
           
            return this
        }

        /*
       
        descriptorAura(){
            return this
        }

        descriptorConcealment()
        {
            return this;
        }

        descriptorIllusion(){
            return this
        }
        descriptorInsubstantial(){
            return this
        }

        descriptorMindControl(){
            return this
        }

        descriptorMindControl(){
            return this
        }

        descriptorNullify(){
            return this
        }

        descriptorProtection(){
            return this
        }

        descriptorTransform(){
            return this
        }

        descriptorWeaken(){
            return this
        }*/
    
    }

    class CurseEffectSection extends TemplatedDescriptorEffect {
        constructor(inSequence) {
            super(inSequence);
        }
       /* castCone({affected, caster}={}){
            return this
        }*/
    
        descriptorCast(){
             return this
        }
        descriptorMeleeCast(){
            return this
        }

        descriptorProject() {
            return this;
        }
        descriptorProjectToLine() {
            return this.descriptorProject()
        }
        descriptorProjectToCone() {
            return this.descriptorProject()
        }   

        descriptorBurst() {
            return this;
        }
        descriptorLine() {
            return this
        }
        descriptorCone() {
            return this;
        }
        descriptorAffliction() {
             
            return this;
        }
        descriptorAura(){
            return this
        }
        descriptorDamage(){
            return this;
        }
        descriptorHealing(){
           
            return this
        }

        /*
       
        descriptorAura(){
            return this
        }

        descriptorConcealment()
        {
            return this;
        }

        descriptorIllusion(){
            return this
        }
        descriptorInsubstantial(){
            return this
        }

        descriptorMindControl(){
            return this
        }

        descriptorMindControl(){
            return this
        }

        descriptorNullify(){
            return this
        }

        descriptorProtection(){
            return this
        }

        descriptorTransform(){
            return this
        }

        descriptorWeaken(){
            return this
        }*/
    
    }
    class DarknessEffectSection extends TemplatedDescriptorEffect {
        constructor(inSequence) {
            super(inSequence);
        }
       /* castCone({affected, caster}={}){
            return this
        }*/
    
        descriptorCast(){
             return this
        }
        descriptorMeleeCast(){
            return this
        }

        descriptorProject() {
            return this;
        }
        descriptorProjectToLine() {
            return this.descriptorProject()
        }
        descriptorProjectToCone() {
            return this.descriptorProject()
        }   

        descriptorBurst() {
            return this;
        }
        descriptorLine() {
            return this
        }
        descriptorCone() {
            return this;
        }
        descriptorAffliction() {
             
            return this;
        }
        descriptorAura(){
            return this
        }
        descriptorDamage(){
            return this;
        }
        descriptorHealing(){
           
            return this
        }

        /*
       
        descriptorAura(){
            return this
        }

        descriptorConcealment()
        {
            return this;
        }

        descriptorIllusion(){
            return this
        }
        descriptorInsubstantial(){
            return this
        }

        descriptorMindControl(){
            return this
        }

        descriptorMindControl(){
            return this
        }

        descriptorNullify(){
            return this
        }

        descriptorProtection(){
            return this
        }

        descriptorTransform(){
            return this
        }

        descriptorWeaken(){
            return this
        }*/
    
    }
    class EarthEffectSection extends TemplatedDescriptorEffect {

        /* castCone({affected, caster}={}){
             return this
         }*/
        castCrack({affected:affected, caster:caster}={}){
            super.castCommon({affected:affected, caster:caster})
              .file("jb2a.extras.tmfx.outpulse.circle.03.fast")
              .belowTokens()
              .scaleToObject(2)
              .opacity(0.5)
              .duration(2000)
              .delay(500)
              .pause(800)

            super.castCommon({rotation:true})
              .file("jb2a.explosion.04.orange")
              .fadeOut(5000)
              .anchor({x:0.2})
              .scaleToObject(2)
              .loopProperty("sprite", "rotation", { from: 0, to: 360, duration: 3000})
              .scaleOut(0.175, 5000, {ease: "easeOutQuint", delay: -3000})
              .duration(1000)
              .zIndex(3)
            
            super.castCommon({rotation:true})
              .file("jb2a.impact.ground_crack.white.03")
              .belowTokens()
              .anchor({x: 0.1})
              .scaleToObject(2)
             
              .opacity(1)
             return this
         }
        castSpark({affected, caster}={}){
            this.castCrack({affected:affected, caster:caster})
            super.castCommon({rotation:true})
              .file("modules/animated-spell-effects/spell-effects/earth/earth-cracks_SQUARE_01.webm")
              .belowTokens()
              .anchor({x: -0.2})
              .size(2, { gridUnits: true })
              .fadeOut(2000)
              .opacity(1)
              .zIndex(1)
              .delay(300)
              .duration(8000)
            
              .canvasPan()
              .delay(200)
              .shake({ duration: 800, strength: 5, rotation: false })
            
              .canvasPan()
              .delay(1000)
              .shake({ duration: 5000, strength: 2, rotation: false, fadeOutDuration: 1000 })
             .delay(500)
         super.castCommon({rotation:true})
             .file("jb2a.extras.tmfx.outpulse.circle.03.fast")
             .scaleToObject(2)
             .belowTokens()
             .opacity(0.1)
             return this
         }
        castMud({affected, caster}={}){
              super.castCommon({affected:affected, caster:caster})
                  .delay(500)
                  .file("jb2a.extras.tmfx.outpulse.circle.03.fast")
                  .scaleToObject(2)
                  .belowTokens()
                  .opacity(0.5)
                  .duration(2000)
                
                  .wait(800)

              super.castCommon()
                  .file("jb2a.explosion.04.orange")
                  .fadeOut(5000)
                  .scaleToObject(2)
                  .duration(1000)
                  .loopProperty("sprite", "rotation", { from: 0, to: 360, duration: 3000})
                  .scaleOut(0.175, 5000, {ease: "easeOutQuint", delay: -3000})
                  .belowTokens()
                  .zIndex(3)

              super.castCommon()
                  .file("jb2a.impact.ground_crack.white.03")
                  .scaleToObject(3)
                  .belowTokens()
                  .opacity(1)
                  .canvasPan()
                  .delay(1000)
                  .shake({ duration: 3000, strength: 2, rotation: false, fadeOutDuration: 1000 })
                  .wait(800)

              super.castCommon()
                .file("jb2a.liquid.splash.brown")
                .scaleToObject(3)
                .zIndex(5)
               return super.castCommon({affected:affected, caster:caster})
               .file("jb2a.liquid.splash.brown")
               .scaleToObject(3)
               .zIndex(5)
            return this
         }

        
        descriptorCast(){ 
                this.rotateTowards(this.affected)
                    
                .file("jb2a.impact.ground_crack.white.03")
                .anchor({x: 0.1})
                .scaleToObject(2)
                .belowTokens()
                .opacity(1)
                
                .canvasPan()
                .delay(200)
                .shake({duration: 800, strength: 5, rotation: false })
                
                .canvasPan()    
                .delay(1000)
                .shake({duration: 5000, strength: 2, rotation: false, fadeOutDuration: 1000 })
              return this
         }
            
        descriptorMeleeCast(){
             return this
        }

        earthBuff(){
            this.delay(500)
              .file("jb2a.extras.tmfx.outpulse.circle.03.fast")
              .scaleToObject(2)
              .belowTokens()
              .opacity(0.5)
              .duration(2000)
              .pause(800)
            super.affectCommon()
              .file("jb2a.explosion.04.orange")
              .fadeOut(5000)
              .scaleToObject(4)
              .duration(1000)
              .loopProperty("sprite", "rotation", { from: 0, to: 360, duration: 3000})
              .scaleOut(0.175, 5000, {ease: "easeOutQuint", delay: -3000})
              .belowTokens()
              .zIndex(3)
           super.affectCommon()
              .file("jb2a.impact.ground_crack.white.03")
              .scaleToObject(3)
              .belowTokens()
              .opacity(1)
              .pause(800)
            super.affectCommon()
              .file("jb2a.impact.earth.01.browngreen")
              .scaleToObject(2)
              .fadeOut(1000, {ease: "easeInExpo"})
              .zIndex(5)
            
            super.affectCommon()
              .file("jb2a.burrow.out.01.brown.1")
              .scaleToObject(2.5)
              .fadeOut(1000, {ease: "easeInExpo"})
              .zIndex(5)
              .pause(100)
            super.affectCommon()
              .delay(100)
              .file("animated-spell-effects-cartoon.smoke.11")
              .playbackRate(0.65)
              .fadeIn(250)
              .fadeOut(1500)
              .scaleToObject(3)
              .randomRotation()
              .opacity(0.5)
              .filter("ColorMatrix", { brightness: 0.8 })
              .zIndex(4)    
            super.affectCommon()
              .file("jb2a.particles.outward.orange.01.03")
              .fadeIn(250, {ease: "easeOutQuint"})
              .scaleIn(0, 200, {ease: "easeOutCubic"})
              .fadeOut(5000, {ease: "easeOutQuint"})
              .opacity(1)
              .filter("ColorMatrix", { saturate: 0.75, brightness: 0.85 })
              .randomRotation()
              .scaleToObject(3)
              .duration(10000)
              .pause(500)
            super.affectCommon()
              .file("jb2a.burrow.out.01.still_frame.0")
              .scaleIn(0, 200, {ease: "easeOutCubic"})
              .belowTokens()
              .scaleToObject(3)
              .duration(1200)
              .fadeIn(200, {ease: "easeOutCirc", delay: 200})
              .fadeOut(300, {ease: "linear"})
              .filter("ColorMatrix", { saturate: -1, brightness: 2 })
              .filter("Blur", { blurX: 5, blurY: 10 })
              .zIndex(0.1) 
           super.affectCommon()
              .file("jb2a.burrow.out.01.still_frame.0")
              .filter("ColorMatrix", { saturate: 0.8, brightness: 0.85 })
              .scaleIn(0, 200, {ease: "easeOutCubic"})
              .belowTokens()
              .scaleToObject(3)
              .fadeOut(5000, {ease: "easeOutQuint"})
              .duration(10000)
             return this
        }

        projectEarthBolt({caster, affected}={})
        {
            super.projectCommon({caster, affected})
            return this.file("jb2a.spell_projectile.earth.01.browngreen")
                .opacity(1)
                .delay(800)
                .waitUntilFinished(-5000)
            .pause(800)
         }
        descriptorProject() {
             this.file("jb2a.boulder.siege.01")
                .atLocation({ x: this.caster.x, y: this.caster.y }) 
                .stretchTo({
                  x: this.affected.center.x,
                  y: this.affected.center.y 
                })
                .opacity(1)
                .delay(400)
                .waitUntilFinished(-2000)
             return this;
         }
        projectCrackedEarth({caster, affected}={}){
            return super.projectCommon({caster:caster, affected: affected}) 
             .file("blfx.spell.template.line.crack1")
                  .delay(200)
                  .zIndex(5)
                  .pause(800)
            return this
        }  
      
        descriptorBurst() {
            return this.delay(1800)
                  .file(`jaamod.spells_effects.earth_tremor`)
             //     .atLocation(this.affected)
                  .scaleToObject(1)
                  .scaleIn(0, 800, {ease: "easeOutCubic"})
                  .fadeOut(1000, {ease: "linear"})
                  .belowTokens()
                  .duration(9000)
                  .zIndex(0.01)
                  .opacity(0.6)
                  .mask()
         }
        descriptorLine() {
            this.file("blfx.spell.template.line.crack1")
                .atLocation(this.templateStart)
                  .delay(200)
                  .zIndex(5)
                  .pause(800)
                .rotateTowards(this.end)
            super.lineCommon()
                .file("jb2a.liquid.splash.brown")
                .scaleToObject(3)
                .pause(800)
           super.lineCommon()
                .file("jb2a.liquid.splash.brown")
                .atLocation(this.center)
                .scaleToObject(3)
                .pause(800)
            super.lineCommon()
                .file("jb2a.liquid.splash.brown")
                .atLocation(this.affected.ray.B)
                .scaleToObject(3)
             return this
         }
        descriptorCone() {
            this
                .delay(800)
                .file(`jaamod.spells_effects.earth_tremor`)
                .scaleToObject(2.3)
                .scaleIn(0, 100, {ease: "easeOutCubic"})
                .fadeOut(1000, {ease: "linear"})
                .belowTokens()
                .duration(9000)
                .zIndex(0.01)
                .opacity(0.8)
                .mask()
                .atLocation(this.affected)
            
            super.coneCommon()
                .file("jb2a.impact.white.0")
                .atLocation(this.templateStart)
                .scaleIn(0, 500, { ease: "easeOutCubic" })
                .belowTokens()
                .scaleToObject(1.8)
                .opacity(0.5)
            this.coneDamage()
            
             return this;
         }
        coneDamage({caster, affected}={}){
            this.coneCommon({caster:caster, affected:affected})
                .file("jb2a.impact.white.0")
                .atLocation(this.templateStart)
                .scaleIn(0, 500, { ease: "easeOutCubic" })
                .belowTokens()
                .scaleToObject(1.8)
                .opacity(0.5)
            this.coneCommon()
                .file("jb2a.impact.ground_crack.white.03")
                .atLocation(this.templateStart)
                .scaleIn(0, 500, { ease: "easeOutCubic" })
                .belowTokens()
                .scaleToObject(1.8)
                .opacity(0.5)
            this.coneCommon()
                .file("jb2a.impact.boulder.01")
                .atLocation(this.templateStart)
                .belowTokens()
                .scaleToObject(2.5)
                .opacity(1)
            this.coneCommon()
                .file("jb2a.impact.earth.01.browngreen")
                .scaleToObject(1)
                .fadeOut(1000, {ease: "easeInExpo"})
                .zIndex(5)
            this.coneCommon()
              .file("jb2a.burrow.out.01.brown.1")
              .scaleToObject(1.2)
              .fadeOut(1000, {ease: "easeInExpo"})
              .zIndex(5)
            this.coneCommon()
              .file("https://assets.forge-vtt.com/bazaar/modules/animated-spell-effects-cartoon/assets/spell-effects/cartoon/earth/debris_02_800x80.webm")
              .atLocation(this.templateStart)
              .spriteRotation(90)
              .rotateTowards(this.affected)
              .scale(1.8)
              .playbackRate(1)
              .pause(100)
             this.coneCommon()
              .file("animated-spell-effects-cartoon.smoke.11")
              .atLocation(this.templateStart)
              .playbackRate(0.65)
              .fadeIn(250)
              .fadeOut(1500)
              .scaleToObject(3.5)
              .randomRotation()
              .opacity(0.5)
              .filter("ColorMatrix", { brightness: 0.8 })
              .zIndex(4)
            /* this.coneCommon()
                .file("blfx.spell.template.line.crack1")
            .atLocation(this.start) 
            .stretchTo(this.templateStart)
            .opacity(1)
            .waitUntilFinished(-5000)
            .pause(800)*/
            return this
        }
        coneHealing({caster, affected}={}){
            super.coneCommon({caster:caster, affected: affected})
              .file(`jb2a.plant_growth.03.round.4x4.complete.greenyellow`)
              .scaleToObject(2)
              .fadeOut(1000, {ease: "linear"})
              .belowTokens()
              .duration(9000)
              .zIndex(0.01)
              .opacity(1)
              .mask(this.affected)
            super.coneCommon()
              .file(`jb2a.plant_growth.03.round.4x4.complete.greenyellow`)
              .atLocation(this.affected)
              .scaleToObject(2)
              .fadeOut(1000, {ease: "linear"})
              .belowTokens()
              .duration(9000)
              .zIndex(0.01)
              .opacity(1)
              .anchor({ x: 0.7, y: 0.3 })
              .mask(this.affected)
            
               super.coneCommon()
              .file(`jb2a.plant_growth.03.round.4x4.complete.greenyellow`)
              .scaleToObject(2)
              .fadeOut(1000, {ease: "linear"})
              .belowTokens()
              .duration(9000)
              .zIndex(0.01)
              .opacity(1)
              .anchor({ x: 0.7, y: 0.3 })
             
            super.coneCommon()
              .file(`jb2a.plant_growth.03.round.4x4.complete.greenyellow`)
              .scaleToObject(2)
              .fadeOut(1000, {ease: "linear"})
              .belowTokens()
              .duration(9000)
              .zIndex(0.01)
              .opacity(1)
              .anchor({ x: 0.7, y: 0.3 })
              .mirrorY()
              .mask(this.affected)
            super.coneCommon()
                .file("jb2a.impact.white.0")
                .atLocation(this.templateStart)
                .scaleIn(0, 500, { ease: "easeOutCubic" })
                .belowTokens()
                .scaleToObject(1.8)
                .opacity(0.5)
            super.coneCommon()
                .file("jb2a.impact.ground_crack.white.03")
                .atLocation(this.templateStart)
                .scaleIn(0, 500, { ease: "easeOutCubic" })
                .belowTokens()
                .scaleToObject(1.8)
                .opacity(0.5)
            super.coneCommon()
                .file("jb2a.impact.boulder.01")
                .atLocation(this.templateStart)
                .belowTokens()
                .scaleToObject(2.5)
                .opacity(1)
            super.coneCommon()
              .file("jb2a.impact.earth.01.browngreen")
              .scaleToObject(1)
              .fadeOut(1000, {ease: "easeInExpo"})
              .zIndex(5)
            super.coneCommon()
              .file("jb2a.burrow.out.01.brown.1")
              .scaleToObject(1.2)
              .fadeOut(1000, {ease: "easeInExpo"})
              .zIndex(5)
            super.coneCommon()
                .file("https://assets.forge-vtt.com/bazaar/modules/animated-spell-effects-cartoon/assets/spell-effects/cartoon/earth/debris_02_800x80.webm")
                .atLocation(this.templateStart)
                .spriteRotation(90)
                .rotateTowards(this.templateStart)
                .delay(10)
                .scale(0.8)
                .playbackRate(1)      
            super.coneCommon()
                .delay(100)
                .file("animated-spell-effects-cartoon.smoke.11")
                .atLocation(this.templateStart)
                .playbackRate(0.65)
                .fadeIn(250)
                .fadeOut(1500)
                .scaleToObject(3.5)
                .randomRotation()
                .opacity(0.5)
                .filter("ColorMatrix", { brightness: 0.8 })
                .zIndex(4)
            return this
        }

        burstAffliction({caster, affected}={}){
            super.burstCommon({caster:caster, affected:afflicted})
            .file("jb2a.impact.earth.01.browngreen")
                .scaleToObject(1)
                .fadeOut(1000, {ease: "easeInExpo"})
                .zIndex(5)
            this.burstCommon()
              .file("jb2a.burrow.out.01.brown.1")
              .scaleToObject(1.2)
              .fadeOut(1000, {ease: "easeInExpo"})
              .zIndex(5)
              .pause(100)
            this.burstCommon()
              .delay(100)
              .file("animated-spell-effects-cartoon.smoke.11")
              .playbackRate(0.65)
              .fadeIn(250)
              .fadeOut(1500)
              .scaleToObject(2)
              .randomRotation()
              .opacity(0.5)
              .filter("ColorMatrix", { brightness: 0.8 })
              .zIndex(4)
            this.burstCommon()
              .file("jb2a.particles.outward.orange.01.03")
              .fadeIn(250, {ease: "easeOutQuint"})
              .scaleIn(0, 200, {ease: "easeOutCubic"})
              .fadeOut(5000, {ease: "easeOutQuint"})
              .opacity(1)
              .filter("ColorMatrix", { saturate: 0.75, brightness: 0.85 })
              .randomRotation()
              .scaleToObject(1.2)
              .duration(8000)
            this.burstCommon()
              .file("jb2a.burrow.out.01.still_frame.0")
              .scaleIn(0, 200, {ease: "easeOutCubic"})
              .belowTokens()
              .scaleToObject(2)
              .duration(1200)
              .fadeIn(200, {ease: "easeOutCirc", delay: 200})
              .fadeOut(300, {ease: "linear"})
              .filter("ColorMatrix", { saturate: -1, brightness: 2 })
              .filter("Blur", { blurX: 5, blurY: 10 })
              .zIndex(0.1)     
            this.burstCommon()
              .filter("ColorMatrix", { saturate: 0.8, brightness: 0.85 })
              .scaleIn(0, 200, {ease: "easeOutCubic"})
              .belowTokens()
              .scaleToObject(2)
              .fadeOut(5000, {ease: "easeOutQuint"})
              .duration(10000)

            return this;
        }
        descriptorAura(){
         
            return this
        }
        descriptorAffliction() {
            this.initalizeRandomNumbers()
             
            this.delay(500)
                .file("jb2a.extras.tmfx.outpulse.circle.03.fast")
                .scaleToObject(2)
                .belowTokens()
                .opacity(0.1)
                .duration(2000)
                .waitUntilFinished()
            super.affectCommon()
                .delay(500)
                .file(`jb2a.falling_rocks.top.1x1.sandstone.${num}`)
              
                .scaleToObject(3.2)
                .mirrorX(this.mirrorX)
                .mirrorY(this.mirrorY) 
                .fadeOut(500)
                .waitUntilFinished(-4000)
            super.affectCommon()
                 .file("jb2a.impact.white.0")
               
                .scaleIn(0, 500, {ease: "easeOutCubic"})
                .belowTokens()
                .scaleToObject(1.8)
                .opacity(0.5)
            super.affectCommon()
                .delay(100)
                .file("animated-spell-effects-cartoon.smoke.11")
             
                .playbackRate(0.65)
                .fadeIn(250)
                .fadeOut(1500)
                .scaleToObject(3.5)
                .randomRotation()
                .opacity(0.5)
                .filter("ColorMatrix", { brightness:0.8 })
                .zIndex(4)
            .animation()
                .on(this.affected)
                .opacity(0)
            super.affectCommon()
                .name(`${this.affected.document.name} Buried`)
                .from(this.affected)
                .attachTo(this.affected,{bindAlpha: false})
                .scaleToObject(1,{considerTokenScale:true})
                .persist()
                .private()
                .belowTokens()
                
             super.affectCommon()
                .delay(3500)
                .name(`${this.affected.document.name} Buried`)
                .file(`jb2a.falling_rocks.endframe.top.1x1.sandstone.${num}`)
                .attachTo(this.affected,{bindAlpha: false})
                .scaleToObject(3.2)
                .mirrorX(this.mirrorX)
                .mirrorY(this.mirrorY) 
                .persist()
                .belowTokens()
                .zIndex(0.1)
                .waitUntilFinished()
                
                .thenDo(function(){
                Sequencer.EffectManager.endEffects({ name: `${this.affected.document.name} Buried`, object: this.afflicted });
                })
                
                .animation()
                .on(this.affected)
                .opacity(1)
                             
            return this;
        }
        descriptorDamage(){
              this.file("jb2a.ground_cracks.dark_red.01")
                .belowTokens()
                .anchor({x: -0.2})
                .size(2, { gridUnits: true })
             
                .rotateTowards(this.affected, { cacheLocation: true })
                .delay(300)
                .duration(3000)
                .fadeOut(2000)
                .opacity(1)
                .zIndex(1)
                
            .canvasPan()
                .delay(200)
                .shake({ duration: 800, strength: 5, rotation: false })
                
            .canvasPan()
                .delay(200)
                .shake({ duration: 5000, strength: 2, rotation: false, fadeOutDuration: 1000 })
                
            super.affectCommon() 
                .delay(500)
                .file("jb2a.extras.tmfx.outpulse.circle.03.fast")
                .scaleToObject(2)
                .belowTokens()
                .opacity(0.1)
                .duration(600)
            
            super.affectCommon()
                .file("jb2a.impact.white.0")
                .scaleIn(0, 500, { ease: "easeOutCubic" })
                .belowTokens()
                .scaleToObject(1.8)
                .opacity(0.5)
            
            super.affectCommon()
                .file("jb2a.impact.boulder.01")
                .belowTokens()
                .scaleToObject(2.5)
                .opacity(1)
            
            super.affectCommon()
                .file("animated-spell-effects-cartoon.smoke.11")
                .playbackRate(0.65)
                .fadeIn(250)
                .fadeOut(1500)
                .scaleToObject(3.5)
                .randomRotation()
                .opacity(0.5)
                .filter("ColorMatrix", { brightness: 0.8 })
                .zIndex(4)
            super.affectCommon()
              .from(this.affected)
              .fadeIn(200)
              .fadeOut(500)
              .loopProperty("sprite", "position.x", { from: -0.05, to: 0.05, duration: 50, pingPong: true, gridUnits: true})
              .scaleToObject(this.affected.document.texture.scaleX)
              .duration(6000)
              .opacity(0.25)
            return this;
        }
        descriptorHealing(){
            this.initalizeRandomNumbers()
            super.affectCommon()
            .delay(500)
            .file("jb2a.extras.tmfx.outpulse.circle.03.fast")
    
            .scaleToObject(2)
            .belowTokens()
            .opacity(0.1)
            .duration(800)
            .waitUntilFinished()
            
             super.affectCommon()
            .delay(500)
            .file(`jb2a.burrow.out.01.brown.1`)

            .scaleToObject(5)
            //.mirrorX(this.mirrorX)
           // .mirrorY(this.mirrorY) 
            .fadeOut(500)
            .waitUntilFinished(-4000)
            
            .delay(100)
            
            super.affectCommon()
            .file('jb2a.plant_growth.03.ring.4x4.complete.greenyellow')
            .zIndex(1)
            .size(1.5, {gridUnits: true})

            super.affectCommon()
            .delay(100)
            .file('jb2a.healing_generic.burst.greenorange')
            .size(1.5, {gridUnits: true})
            .filter("ColorMatrix", { brightness: 0.8 })
            .zIndex(3)
            .scaleToObject(3)
          //  .mirrorX(this.mirrorX)
          //  .mirrorY(this.mirrorY) 
            .fadeOut(500)
            .waitUntilFinished(-4000)
            
            super.affectCommon()
            .file("jb2a.impact.white.0")
          
            .scaleIn(0, 500, {ease: "easeOutCubic"})
            .belowTokens()
            .scaleToObject(1.8)
            .opacity(0.5)

         super.affectCommon()
            .file("jb2a.particles.outward.orange.01.03")
  .fadeIn(250, {ease: "easeOutQuint"})
  .scaleIn(0, 200, {ease: "easeOutCubic"})
  .fadeOut(5000, {ease: "easeOutQuint"})
  .opacity(1)
  .filter("ColorMatrix", { saturate: 0.75, brightness: 0.85 })
  .randomRotation()
  .scaleToObject(3)
  .duration(10000)

  .wait(500)

  super.affectCommon()
  .file("jb2a.burrow.out.01.still_frame.0")

  .scaleIn(0, 200, {ease: "easeOutCubic"})
  .belowTokens()
  .scaleToObject(3)
  .duration(1200)
  .fadeIn(200, {ease: "easeOutCirc", delay: 200})
  .fadeOut(300, {ease: "linear"})
  .filter("ColorMatrix", { saturate: -1, brightness: 2 })
  .filter("Blur", { blurX: 5, blurY: 10 })
  .zIndex(0.1)

 super.affectCommon()
  .file("jb2a.burrow.out.01.still_frame.0")
 
  .filter("ColorMatrix", { saturate: 0.8, brightness: 0.85 })
  .scaleIn(0, 200, {ease: "easeOutCubic"})
  .belowTokens()
  .scaleToObject(3)
  .fadeOut(5000, {ease: "easeOutQuint"})
  .duration(10000)
            return this
        }
        descriptorWeaken(){
             this.file("animated-spell-effects-cartoon.water.ball")
                .playbackRate(1)
                .scaleToObject()
                .scale(1.2)
                .fadeIn(500)
                .fadeOut(500)
                .tint("#43270F")
                .filter("ColorMatrix", { hue: 0, contrast: 0, saturate: 0 , brightness: 1 })
                .rotateIn(180, 600, {ease: "easeOutCubic"})
                .scaleIn(0, 600, {ease: "easeOutCubic"})
                .persist()
                 return this
         }
        descriptorProtection(){
              this.earthBuff()
                .file("jb2a.shield_themed.above.molten_earth.01.orange")
                .playbackRate(1)
                .scaleToObject()
                .scale(1.8)
                .fadeIn(500)
                .rotateIn(180, 600, {ease: "easeOutCubic"})
                .scaleIn(0, 600, {ease: "easeOutCubic"})
                .loopProperty("sprite", "rotation", { from: 0, to: -360, duration: 10000})
                .persist()
            super.affectCommon()
                .file("jb2a.shield_themed.above.molten_earth.03.orange")
                .playbackRate(1)
                .scaleToObject()
                .scale(1.8)
                .fadeIn(500)
                .rotateIn(180, 600, {ease: "easeOutCubic"})
                .scaleIn(0, 600, {ease: "easeOutCubic"})
                .persist()
            return this
         }
         /*
        
 
         descriptorConcealment()
         {
             return this;
         }
       

 
         descriptorIllusion(){
             return this
         }
         descriptorInsubstantial(){
             return this
         }
 
         descriptorMindControl(){
             return this
         }
 
         descriptorMindControl(){
             return this
         }
 
         descriptorNullify(){
             return this
         }
 

 
         descriptorTransform(){
             return this
         }
 
*/
    }

    class ElectricityEffectSection extends TemplatedDescriptorEffect {
        constructor(inSequence) {
            super(inSequence);
        }
       /* castCone({affected, caster}={}){
            return this
        }*/
    
        descriptorCast(){
             return this
        }
        descriptorMeleeCast(){
            return this
        }

        descriptorProject() {
            return this;
        }
        descriptorProjectToLine() {
            return this.descriptorProject()
        }
        descriptorProjectToCone() {
            return this.descriptorProject()
        }   

        descriptorBurst() {
            return this;
        }
        descriptorLine() {
            return this
        }
        descriptorCone() {
            return this;
        }
        descriptorAffliction() {
             
            return this;
        }
        descriptorAura(){
            return this
        }
        descriptorDamage(){
            return this;
        }
        descriptorHealing(){
           
            return this
        }

        /*
       
        descriptorAura(){
            return this
        }

        descriptorConcealment()
        {
            return this;
        }

        descriptorIllusion(){
            return this
        }
        descriptorInsubstantial(){
            return this
        }

        descriptorMindControl(){
            return this
        }

        descriptorMindControl(){
            return this
        }

        descriptorNullify(){
            return this
        }

        descriptorProtection(){
            return this
        }

        descriptorTransform(){
            return this
        }

        descriptorWeaken(){
            return this
        }*/
    
    }
    class EnergyEffectSection extends TemplatedDescriptorEffect {
        constructor(inSequence) {
            super(inSequence);
        }
       /* castCone({affected, caster}={}){
            return this
        }*/
    
        descriptorCast(){
             return this
        }
        descriptorMeleeCast(){
            return this
        }

        descriptorProject() {
            return this;
        }
        descriptorProjectToLine() {
            return this.descriptorProject()
        }
        descriptorProjectToCone() {
            return this.descriptorProject()
        }   

        descriptorBurst() {
            return this;
        }
        descriptorLine() {
            return this
        }
        descriptorCone() {
            return this;
        }
        descriptorAffliction() {
             
            return this;
        }
        descriptorAura(){
            return this
        }
        descriptorDamage(){
            return this;
        }
        descriptorHealing(){
           
            return this
        }

        /*
       
        descriptorAura(){
            return this
        }

        descriptorConcealment()
        {
            return this;
        }

        descriptorIllusion(){
            return this
        }
        descriptorInsubstantial(){
            return this
        }

        descriptorMindControl(){
            return this
        }

        descriptorMindControl(){
            return this
        }

        descriptorNullify(){
            return this
        }

        descriptorProtection(){
            return this
        }

        descriptorTransform(){
            return this
        }

        descriptorWeaken(){
            return this
        }*/
    
    }
    class EntropyEffectSection extends TemplatedDescriptorEffect {
        constructor(inSequence) {
            super(inSequence);
        }
       /* castCone({affected, caster}={}){
            return this
        }*/
    
        descriptorCast(){
             return this
        }
        descriptorMeleeCast(){
            return this
        }

        descriptorProject() {
            return this;
        }
        descriptorProjectToLine() {
            return this.descriptorProject()
        }
        descriptorProjectToCone() {
            return this.descriptorProject()
        }   

        descriptorBurst() {
            return this;
        }
        descriptorLine() {
            return this
        }
        descriptorCone() {
            return this;
        }
        descriptorAffliction() {
             
            return this;
        }
        descriptorAura(){
            return this
        }
        descriptorDamage(){
            return this;
        }
        descriptorHealing(){
           
            return this
        }

        /*
       
        descriptorAura(){
            return this
        }

        descriptorConcealment()
        {
            return this;
        }

        descriptorIllusion(){
            return this
        }
        descriptorInsubstantial(){
            return this
        }

        descriptorMindControl(){
            return this
        }

        descriptorMindControl(){
            return this
        }

        descriptorNullify(){
            return this
        }

        descriptorProtection(){
            return this
        }

        descriptorTransform(){
            return this
        }

        descriptorWeaken(){
            return this
        }*/
    
    }
    class ExoskeletonEffectSection extends TemplatedDescriptorEffect {
        constructor(inSequence) {
            super(inSequence);
        }
       /* castCone({affected, caster}={}){
            return this
        }*/
    
        descriptorCast(){
             let targetCenter = {
                x: this.affected.x+canvas.grid.size*this.affected.document.width/2,
                y: this.affected.y+canvas.grid.size*this.affected.document.width/2,
                };
                
                const tokenCenter = {
                x: this.caster.x+canvas.grid.size*this.caster.document.width/2,
                y: this.caster.y+canvas.grid.size*this.caster.document.width/2,
                };
                
                const middleposition = {
                  x: (targetCenter.x - tokenCenter.x)* 0.25,
                  y: (targetCenter.y - tokenCenter.y)* 0.25,
                };
                
                super.castCommon()
                    .file("jb2a.unarmed_strike.no_hit.01.blue")
                    .atLocation(this.caster, { edge: "outer" })
                    .stretchTo(this.affected)
                    .filter("Glow", { color: "#0d0d0c", distance: 1, outerStrength: 5, innerStrength: 0 })
                    .scale(3)
                    .playbackRate(0.5)
                    .fadeOut(100)
                    .zIndex(2)
                
                    .sound("https://assets.forge-vtt.com/bazaar/modules/lancer-weapon-fx/assets/soundfx/DD288Ready.ogg")
                        .delay(0)
                    
                super.castCommon()
                    .file("jb2a.token_border.circle.static.blue.012")
                    .opacity(0.75)
                    .scaleToObject(2)
                    .filter("ColorMatrix", {saturate: 0})
                    .fadeIn(500)
                    .duration(1500)
                    .belowTokens()
                    .fadeOut(250)
                
                super.castCommon()
                    .file("jb2a.particles.inward.blue.01.01")
                    .opacity(0.35)
                    .scaleToObject(1.5)
                    .filter("ColorMatrix", {saturate: 1})
                    .fadeIn(500)
                    .duration(1500)
                    .mask(this.caster)
                    .fadeOut(250)
                
                super.castCommon()
                    .file("animated-spell-effects-cartoon.cantrips.mending.yellow")
                    .scaleToObject(3)
                    .opacity(0.75)
                    .filter("ColorMatrix", { saturate: -1, brightness: 2, hue: -185 })
                    .zIndex(1)
                    .waitUntilFinished(-1000)
                    
                    .wait(750)
                    
                    .canvasPan()
                    .delay(250)
                    .shake({duration: 250, strength: 2, rotation: false })
                
                super.castCommon()
                    .file("jb2a.swirling_leaves.outburst.01.pink")
                    .scaleIn(0, 500, {ease: "easeOutCubic"}) 
                    .filter("ColorMatrix", { saturate: 1, hue: -105 })
                    .scaleToObject(0.75)
                    .fadeOut(2000)
                    .zIndex(1)
                
                .animation()
                    .on(this.caster)
                    .opacity(0)
                
                super.castCommon()
                    .from(this.caster)
                    .atLocation(this.caster)
                    .mirrorX(this.caster.document.mirrorX)
                    .animateProperty("sprite", "position.x", { from: 0, to: middleposition.x, duration: 100, ease:"easeOutExpo"})
                    .animateProperty("sprite", "position.y", { from: 0, to: middleposition.y, duration: 100, ease:"easeOutExpo"})
                    .animateProperty("sprite", "position.x", { from: 0, to: -middleposition.x, duration: 350, ease:"easeInOutQuad", fromEnd:true})
                    .animateProperty("sprite", "position.y", { from: 0, to: -middleposition.y, duration: 350, ease:"easeInOutQuad", fromEnd:true})
                    .scaleToObject(1, {considerultramarineTokenScale: true})
                    .duration(600)
                
                .animation()
                    .on(this.caster)
                    .opacity(1)
                    .delay(600)
        }
        descriptorMeleeCast(){
            return this
        }

        descriptorProject() {
            return this.file("jb2a.impact.010.blue")
            .scaleIn(0, 100, {ease: "easeOutCubic"}) 
            .scaleToObject(2.5)
            .atLocation(target)
            .randomRotation()
            .playSound("https://assets.forge-vtt.com/bazaar/modules/lancer-weapon-fx/assets/soundfx/HeavyImpact.ogg")
	        .delay(1000)
        }
        descriptorProjectToLine() {
            return this.descriptorProject()
        }
        descriptorProjectToCone() {
            return this.descriptorProject()
        }   

        descriptorBurst() {
            return this;
        }
        descriptorLine() {
            return this
        }
        descriptorCone() {
            return this;
        }
        descriptorAffliction() {
             
            return this;
        }
        descriptorAura(){
            return this
        }
        descriptorDamage(){
             this.file("jb2a.impact.ground_crack.blue.02")
            .scaleIn(0, 100, {ease: "easeOutCubic"}) 
            .scaleToObject(2.5)    
            .randomRotation()
            .belowTokens()        
            .effect()
            .delay(200)
            .file("jb2a.extras.tmfx.border.circle.outpulse.01.fast")
            .scaleIn(0, 100, {ease: "easeOutCubic"}) 
            .scaleToObject(1.75)
            .opacity(0.5)
     
            .belowTokens()
            
            super.affectCommon()
            .delay(200)
            .file("jb2a.extras.tmfx.border.circle.outpulse.01.fast")
            .scaleIn(0, 100, {ease: "easeOutCubic"}) 
            .scaleToObject(2.5)
            .opacity(0.5)
       
            .belowTokens()
            
            super.affectCommon()
            .from(target)
            .fadeIn(200)
            .fadeOut(500)
            .loopProperty("sprite", "position.x", { from: -0.05, to: 0.05, duration: 50, pingPong: true, gridUnits: true})
            .scaleToObject(target.document.texture.scaleX)
            .duration(1500)
            .opacity(0.25);
            
            return this;
        }
        descriptorHealing(){
            return this
        }

        /*
       
        descriptorAura(){
            return this
        }

        descriptorConcealment()
        {
            return this;
        }

        descriptorIllusion(){
            return this
        }
        descriptorInsubstantial(){
            return this
        }

        descriptorMindControl(){
            return this
        }

        descriptorMindControl(){
            return this
        }

        descriptorNullify(){
            return this
        }

        descriptorProtection(){
            return this
        }

        descriptorTransform(){
            return this
        }

        descriptorWeaken(){
            return this
        }*/
    
    }
    
    class GasEffectSection extends TemplatedDescriptorEffect {
        constructor(inSequence) {
            super(inSequence);
        }
       /* castCone({affected, caster}={}){
            return this
        }*/
    
        descriptorCast(){
             return this
        }
        descriptorMeleeCast(){
            return this
        }

        descriptorProject() {
            return this;
        }
        descriptorProjectToLine() {
            return this.descriptorProject()
        }
        descriptorProjectToCone() {
            return this.descriptorProject()
        }   

        descriptorBurst() {
            return this;
        }
        descriptorLine() {
            return this
        }
        descriptorCone() {
            return this;
        }
        descriptorAffliction() {
             
            return this;
        }
        descriptorAura(){
            return this
        }
        descriptorDamage(){
            return this;
        }
        descriptorHealing(){
           
            return this
        }

        /*
       
        descriptorAura(){
            return this
        }

        descriptorConcealment()
        {
            return this;
        }

        descriptorIllusion(){
            return this
        }
        descriptorInsubstantial(){
            return this
        }

        descriptorMindControl(){
            return this
        }

        descriptorMindControl(){
            return this
        }

        descriptorNullify(){
            return this
        }

        descriptorProtection(){
            return this
        }

        descriptorTransform(){
            return this
        }

        descriptorWeaken(){
            return this
        }*/
    
    }


    class HolyEffectSection extends TemplatedDescriptorEffect {
        constructor(inSequence) {
            super(inSequence);
        }
       /* castCone({affected, caster}={}){
            return this
        }*/
    
        descriptorCast(){
             return this
        }
        descriptorMeleeCast(){
            return this
        }

        descriptorProject() {
            return this;
        }
        descriptorProjectToLine() {
            return this.descriptorProject()
        }
        descriptorProjectToCone() {
            return this.descriptorProject()
        }   

        descriptorBurst() {
            return this;
        }
        descriptorLine() {
            return this
        }
        descriptorCone() {
            return this;
        }
        descriptorAffliction() {
             
            return this;
        }
        descriptorAura(){
            return this
        }
        descriptorDamage(){
            return this;
        }
        descriptorHealing(){
           
            return this
        }

        /*
       
        descriptorAura(){
            return this
        }

        descriptorConcealment()
        {
            return this;
        }

        descriptorIllusion(){
            return this
        }
        descriptorInsubstantial(){
            return this
        }

        descriptorMindControl(){
            return this
        }

        descriptorMindControl(){
            return this
        }

        descriptorNullify(){
            return this
        }

        descriptorProtection(){
            return this
        }

        descriptorTransform(){
            return this
        }

        descriptorWeaken(){
            return this
        }*/
    
    }

    class ImpactEffectSection extends TemplatedDescriptorEffect {
        constructor(inSequence) {
            super(inSequence);
        }
       /* castCone({affected, caster}={}){
            return this
        }*/
    
        descriptorCast(){
             return this
        }
        descriptorMeleeCast(){
            return this
        }

        descriptorProject() {
            return this;
        }
        descriptorProjectToLine() {
            return this.descriptorProject()
        }
        descriptorProjectToCone() {
            return this.descriptorProject()
        }   

        descriptorBurst() {
            return this;
        }
        descriptorLine() {
            return this
        }
        descriptorCone() {
            return this;
        }
        descriptorAffliction() {
             
            return this;
        }
        descriptorAura(){
            return this
        }
        descriptorDamage(){
            return this;
        }
        descriptorHealing(){
           
            return this
        }

        /*
       
        descriptorAura(){
            return this
        }

        descriptorConcealment()
        {
            return this;
        }

        descriptorIllusion(){
            return this
        }
        descriptorInsubstantial(){
            return this
        }

        descriptorMindControl(){
            return this
        }

        descriptorMindControl(){
            return this
        }

        descriptorNullify(){
            return this
        }

        descriptorProtection(){
            return this
        }

        descriptorTransform(){
            return this
        }

        descriptorWeaken(){
            return this
        }*/
    
    }

    class InvincibleEffectSection extends TemplatedDescriptorEffect {
        constructor(inSequence) {
            super(inSequence);
        }
       /* castCone({affected, caster}={}){
            return this
        }*/
    
        descriptorCast(){
             return this
        }
        descriptorMeleeCast(){
            return this
        }

        descriptorProject() {
            return this;
        }
        descriptorProjectToLine() {
            return this.descriptorProject()
        }
        descriptorProjectToCone() {
            return this.descriptorProject()
        }   

        descriptorBurst() {
            return this;
        }
        descriptorLine() {
            return this
        }
        descriptorCone() {
            return this;
        }
        descriptorAffliction() {
             
            return this;
        }
        descriptorAura(){
            return this
        }
        descriptorDamage(){
            return this;
        }
        descriptorHealing(){
           
            return this
        }

        /*
       
        descriptorAura(){
            return this
        }

        descriptorConcealment()
        {
            return this;
        }

        descriptorIllusion(){
            return this
        }
        descriptorInsubstantial(){
            return this
        }

        descriptorMindControl(){
            return this
        }

        descriptorMindControl(){
            return this
        }

        descriptorNullify(){
            return this
        }

        descriptorProtection(){
            return this
        }

        descriptorTransform(){
            return this
        }

        descriptorWeaken(){
            return this
        }*/
    
    }
    class KineticEffectSection extends TemplatedDescriptorEffect {
        constructor(inSequence) {
            super(inSequence);
        }
       /* castCone({affected, caster}={}){
            return this
        }*/
    
        descriptorCast(){
             return this
        }
        descriptorMeleeCast(){
            return this
        }

        descriptorProject() {
            return this;
        }
        descriptorProjectToLine() {
            return this.descriptorProject()
        }
        descriptorProjectToCone() {
            return this.descriptorProject()
        }   

        descriptorBurst() {
            return this;
        }
        descriptorLine() {
            return this
        }
        descriptorCone() {
            return this;
        }
        descriptorAffliction() {
             
            return this;
        }
        descriptorAura(){
            return this
        }
        descriptorDamage(){
            return this;
        }
        descriptorHealing(){
           
            return this
        }

        /*
       
        descriptorAura(){
            return this
        }

        descriptorConcealment()
        {
            return this;
        }

        descriptorIllusion(){
            return this
        }
        descriptorInsubstantial(){
            return this
        }

        descriptorMindControl(){
            return this
        }

        descriptorMindControl(){
            return this
        }

        descriptorNullify(){
            return this
        }

        descriptorProtection(){
            return this
        }

        descriptorTransform(){
            return this
        }

        descriptorWeaken(){
            return this
        }*/
    
    }
    class LightEffectSection extends TemplatedDescriptorEffect {
        constructor(inSequence) {
            super(inSequence);
        }
       /* castCone({affected, caster}={}){
            return this
        }*/
    
        descriptorCast(){
             return this
        }
        descriptorMeleeCast(){
            return this
        }

        descriptorProject() {
            return this;
        }
        descriptorProjectToLine() {
            return this.descriptorProject()
        }
        descriptorProjectToCone() {
            return this.descriptorProject()
        }   

        descriptorBurst() {
            return this;
        }
        descriptorLine() {
            return this
        }
        descriptorCone() {
            return this;
        }
        descriptorAffliction() {
             
            return this;
        }
        descriptorAura(){
            return this
        }
        descriptorDamage(){
            return this;
        }
        descriptorHealing(){
           
            return this
        }

        /*
       
        descriptorAura(){
            return this
        }

        descriptorConcealment()
        {
            return this;
        }

        descriptorIllusion(){
            return this
        }
        descriptorInsubstantial(){
            return this
        }

        descriptorMindControl(){
            return this
        }

        descriptorMindControl(){
            return this
        }

        descriptorNullify(){
            return this
        }

        descriptorProtection(){
            return this
        }

        descriptorTransform(){
            return this
        }

        descriptorWeaken(){
            return this
        }*/
    
    }
    class LightningEffectSection extends TemplatedDescriptorEffect {
        constructor(inSequence) {
            super(inSequence);
        }
       /* castCone({affected, caster}={}){
            return this
        }*/
    
        descriptorCast(){
             return this
        }
        descriptorMeleeCast(){
            return this
        }

        descriptorProject() {
            return this;
        }
        descriptorProjectToLine() {
            return this.descriptorProject()
        }
        descriptorProjectToCone() {
            return this.descriptorProject()
        }   

        descriptorBurst() {
            return this;
        }
        descriptorLine() {
            return this
        }
        descriptorCone() {
            return this;
        }
        descriptorAffliction() {
             
            return this;
        }
        descriptorAura(){
            return this
        }
        descriptorDamage(){
            return this;
        }
        descriptorHealing(){
           
            return this
        }

        /*
       
        descriptorAura(){
            return this
        }

        descriptorConcealment()
        {
            return this;
        }

        descriptorIllusion(){
            return this
        }
        descriptorInsubstantial(){
            return this
        }

        descriptorMindControl(){
            return this
        }

        descriptorMindControl(){
            return this
        }

        descriptorNullify(){
            return this
        }

        descriptorProtection(){
            return this
        }

        descriptorTransform(){
            return this
        }

        descriptorWeaken(){
            return this
        }*/
    
    }

    class MagnetismEffectSection extends TemplatedDescriptorEffect {
        constructor(inSequence) {
            super(inSequence);
        }
       /* castCone({affected, caster}={}){
            return this
        }*/
    
        descriptorCast(){
             return this
        }
        descriptorMeleeCast(){
            return this
        }

        descriptorProject() {
            return this;
        }
        descriptorProjectToLine() {
            return this.descriptorProject()
        }
        descriptorProjectToCone() {
            return this.descriptorProject()
        }   

        descriptorBurst() {
            return this;
        }
        descriptorLine() {
            return this
        }
        descriptorCone() {
            return this;
        }
        descriptorAffliction() {
             
            return this;
        }
        descriptorAura(){
            return this
        }
        descriptorDamage(){
            return this;
        }
        descriptorHealing(){
           
            return this
        }

        /*
       
        descriptorAura(){
            return this
        }

        descriptorConcealment()
        {
            return this;
        }

        descriptorIllusion(){
            return this
        }
        descriptorInsubstantial(){
            return this
        }

        descriptorMindControl(){
            return this
        }

        descriptorMindControl(){
            return this
        }

        descriptorNullify(){
            return this
        }

        descriptorProtection(){
            return this
        }

        descriptorTransform(){
            return this
        }

        descriptorWeaken(){
            return this
        }*/
    
    }

    class MagicEffectSection extends TemplatedDescriptorEffect {
        constructor(inSequence) {
            super(inSequence);
        }
       /* castCone({affected, caster}={}){
            return this
        }*/
    
        descriptorCast(){
             return this
        }
        descriptorMeleeCast(){
            return this
        }

        descriptorProject() {
            return this;
        }
        descriptorProjectToLine() {
            return this.descriptorProject()
        }
        descriptorProjectToCone() {
            return this.descriptorProject()
        }   

        descriptorBurst() {
            return this;
        }
        descriptorLine() {
            return this
        }
        descriptorCone() {
            return this;
        }
        descriptorAffliction() {
             
            return this;
        }
        descriptorAura(){
            return this
        }
        descriptorDamage(){
            return this;
        }
        descriptorHealing(){
           
            return this
        }

        /*
       
        descriptorAura(){
            return this
        }

        descriptorConcealment()
        {
            return this;
        }

        descriptorIllusion(){
            return this
        }
        descriptorInsubstantial(){
            return this
        }

        descriptorMindControl(){
            return this
        }

        descriptorMindControl(){
            return this
        }

        descriptorNullify(){
            return this
        }

        descriptorProtection(){
            return this
        }

        descriptorTransform(){
            return this
        }

        descriptorWeaken(){
            return this
        }*/
    
    }

    class FireEffectSection extends TemplatedDescriptorEffect {
        constructor(inSequence) {
            super(inSequence);
        }
        castDamage({affected,caster}={}) {
           return super.castCommon({affected:affected, caster:caster, rotation:false})
                .file("animated-spell-effects-cartoon.fire.03") // Fire casting animation
                .spriteOffset({ x: 15, y: 0 })
                .scale(0.3)
                .waitUntilFinished(-1000)
            .file("modules/animated-spell-effects-cartoon/assets/spell-effects/cartoon/fire/fire_55_800x800.webm") // Fireball projectile
                .scale(0.08)
                .zeroSpriteRotation(true)
                .fadeIn(100)
                .fadeOut(50)
        }

        descriptorCast(){
            return this.file("animated-spell-effects-cartoon.fire.19")
                .playbackRate(1)
                .scale(0.3)
                .waitUntilFinished(-800)
        }

        projectDamage(){
            return super.projectCommon({affected:this.affected, caster:this.caster})
                .file("jb2a.scorching_ray.01.orange")
                .playbackRate(1)
                .scale(1.5)
                .waitUntilFinished(-1000)
        }

        projectBolt({affected,caster}={}){
            return super.projectCommon({affected:affected, caster:caster})
                .file("jb2a.fire_bolt.orange")
                .playbackRate(1)
                .waitUntilFinished(-100)
                .duration(400)
                .scale(1)
        }
        
    
        descriptorProject() {
          
          return this.file("animated-spell-effects-cartoon.fire.29")
            .spriteOffset({ x: 20, y: 0 })
            .playbackRate(1)
            .waitUntilFinished(-2000)
        }
    
        descriptorDamage() {
            this.file("animated-spell-effects-cartoon.mix.fire earth explosion.06") // Explosion effect
                .scale(0.8)
                .fadeIn(300)
                .fadeOut(300)
            super.affectCommon()
                .file(`jb2a.ground_cracks.orange.01`)
                .scaleToObject(2)
                .fadeIn(600)
                .opacity(1)
                .belowTokens()
                .scaleIn(0, 600, {ease: "easeOutCubic"})
                .filter("ColorMatrix", { hue: 0 })
                .fadeOut(500)
                .duration(8000)
                
            super.affectCommon()
                .file("jb2a.impact.ground_crack.still_frame.01")
                .scaleToObject(2)
                .fadeIn(600)
                .opacity(1)
                .belowTokens()
                .scaleIn(0, 600, {ease: "easeOutCubic"})
                .filter("ColorMatrix", { hue: 0 })
                .fadeOut(500)
                .duration(12000)
                
                .canvasPan()
                .shake({duration: 800, strength: 1, rotation: false })
    
            return this;
        }
        descriptorMeleeCast(){
             this.file("animated-spell-effects-cartoon.fire.19")
                .playbackRate(1)
                .scale(0.4)
                
            this.castCommon({rotation:false})
                .file("animated-spell-effects-cartoon.fire.19")
                .playbackRate(1)
                .scale(0.4)
                .delay(800)
                .waitUntilFinished(-1200)
                
            this.castCommon({rotation:false})
                .file("jb2a.flurry_of_blows.no_hit.yellow")
                .stretchTo(this.affected)
                .playbackRate(1)
                .pause(800)
            return this;
         }
 
        descriptorProjectToLine() {
            return this.file("animated-spell-effects-cartoon.fire.29")
                .fadeIn(100)
                .fadeOut(100)
                .pause(600)
        }
        descriptorProjectToCone() {
             
             return this.descriptorProjectToLine()
         }   
      
        descriptorAura(){
            return this.file("animated-spell-effects-cartoon.fire.01")
                .anchor({x:0.5 , y:0.7, gridUnits:true})
                .delay(400)
                .scale(0.4)
        }
        descriptorBurst() {
            return this
                .file("jb2a.impact.fire.01.orange.0")
                .atLocation(this.affected)
                .playbackRate(1)
                .scaleToObject(2.5)
                .waitUntilFinished(-2000)
         }
        descriptorLine() {
            let position = canvas.templates.placeables[canvas.templates.placeables.length - 1];
            const lineTemplate = canvas.templates.placeables.at(-1).document;

            const start = { x: lineTemplate.x, y: lineTemplate.y };
            
            this.file("jb2a.impact.fire.01.orange.0")
                .atLocation(start)
                .scaleToObject(2)
                .fadeIn(100)
                .fadeOut(100)
                .waitUntilFinished(-5000)
        
                .effect()
                .file("jb2a.template_line.lava.01.orange")
                .atLocation(start)
                .spriteScale(0.5)
                .stretchTo(position)
                .playbackRate(0.6)
                .belowTokens()
                .fadeIn(50)
                .fadeOut(50)
            return this
         }
        descriptorCone() {
             this.file("jb2a.impact.fire.01.orange.0")
                .fadeIn(100)
                .fadeOut(100)
                .waitUntilFinished(-5000) 
          super.affectCommon()
                .file("jb2a.particles.outward.orange.01.04")
                .fadeIn(500)
                .fadeOut(500)
                .anchor({x:0.5})
                .scaleToObject(2)
                .duration(5000)
                .rotateTowards(this.affected, {cacheLocation: true})
                .loopProperty("sprite", "rotation", { from: -360, to: 360, duration: 3000})
                .scaleOut(0, 4000, {ease: "easeOutQuint", delay: -3000})
                .zIndex(1)
        
             super.affectCommon()
                .file("jb2a.particles.outward.orange.01.04")
                .fadeIn(500)
                .fadeOut(500)
                .anchor({x:0.5})
                .scaleToObject(2)
                .duration(5000)
                .rotateTowards(this.affected, {cacheLocation: true})
                .loopProperty("sprite", "rotation", { from: 360, to: -360, duration: 3000})
                .scaleOut(0, 4000, {ease: "easeOutQuint", delay: -3000})
                .zIndex(1)  
             return this;
         }

        descriptorAffliction() {
             this.file("animated-spell-effects-cartoon.fire.spiral")
                .playbackRate(1)
                .scale(0.5)
                .waitUntilFinished(-2500)
                
            
            super.affectCommon()
                .file("jb2a.shield_themed.below.fire.01.orange")
                .attachTo(this.affected)
                .playbackRate(1)
                .scaleToObject()
                .scale(1.8)
                .fadeIn(500)
                .rotateIn(180, 600, {ease: "easeOutCubic"})
                .scaleIn(0, 600, {ease: "easeOutCubic"})
                .loopProperty("sprite", "rotation", { from: 0, to: -360, duration: 10000})
                .persist()
            
            super.affectCommon()
                .file("jb2a.shield_themed.above.fire.03.orange")
                .attachTo(this.affected)
                .playbackRate(1)
                .scaleToObject()
                .scale(1.8)
                .fadeIn(500)
                .rotateIn(180, 600, {ease: "easeOutCubic"})
                .scaleIn(0, 600, {ease: "easeOutCubic"})
                .persist()
            return this;
        }
        descriptorHealing(){
           this.file("jb2a.healing_generic.400px.yellow02")
                .atLocation(target)
                .playbackRate(1)
                .scaleToObject()
                .tint("#dc7118")
                .scale(1.8)
                .fadeIn(500)
                .filter("Glow", {distance: 0.5})
            return this
        }
        
        descriptorInsubstantial(){
            let currentAlpha = this.affected.document.alpha;
            if (currentAlpha != 1) {
                setTimeout(async () => {
                    await this.affected.document.update({ alpha: 1 });
                }, 1000); 
            } else {
                setTimeout(async () => {
                    await this.affected.document.update({ alpha: 0.5 });
                }, 1000); 
            }
            
            this.file("animated-spell-effects-cartoon.fire.01")
            .anchor({x:0.5 , y:0.7, gridUnits:true})
            .delay(400)
            .scale(0.4)
    
            super.affectCommon()
                .file("jb2a.impact.fire.01.orange.0")
                .delay(800)
                .scale(0.8)
    
            super.affectCommon()
                .file("animated-spell-effects-cartoon.fire.13")
                .anchor({x:0.5 , y:0.7, gridUnits:true})
                .delay(1000)
                .scale(0.3)

                .play();
                 return this
        }
        descriptorProtection(){
             return this.effect()
                .file("blfx.misc.fire1.loop.orange")
                .atLocation(this.affected)
                .persist( true)
                 .scaleToObject(2)
                .sound('modules/mm3e-animations/sounds/action/powers/firering.ogg')
                .wait(1000)
                .sound('modules/mm3e-animations/sounds/action/powers/Fireball_Loop.ogg')
         }
         /*
        
 
         descriptorConcealment()
         {
             return this;
         }
       

 
         descriptorIllusion(){
             return this
         }
        
 
         descriptorMindControl(){
             return this
         }
 
         descriptorMindControl(){
             return this
         }
 
         descriptorNullify(){
             return this
         }
 
   
 
         descriptorTransform(){
             return this
         }
 
         descriptorWeaken(){
             return this
         }*/
    }

    class IceEffectSection extends TemplatedDescriptorEffect {
        constructor(inSequence) {
            super(inSequence);
        }

        descriptorCast(){
             return this
        }

        descriptorInsubstantial(){
            let currentAlpha = this.affected.document.alpha;
            if (currentAlpha != 1) {
                setTimeout(async () => {
                    await this.affected.document.update({ alpha: 1 });
                }, 1000); // Delay of 1000 milliseconds (1 second)
            } else {
                setTimeout(async () => {
                    await this.affected.document.update({ alpha: 0.5 });
                }, 1000); // Delay of 1000 milliseconds (1 second)
            }
            this.descriptorAura();
            return this
        }

        descriptorProtection(){
            this.descriptorAura()
            .file("jb2a.shield_themed.above.ice.01.blue")
            .playbackRate(1)
            .scaleToObject()
            .scale(1.8)
            .fadeIn(500)
            .rotateIn(180, 600, {ease: "easeOutCubic"})
            .scaleIn(0, 600, {ease: "easeOutCubic"})
            .loopProperty("sprite", "rotation", { from: 0, to: -360, duration: 10000})
            .filter("Glow", {distance: 5})
            .persist()
            .delay(1000)
        }

        descriptorAura(){
            this.file("jb2a.impact_themed.ice_shard.01.blue")

            .scaleToObject(4)
            return this
        }

        descriptorMeleeCast(){
            this.file("jb2a.unarmed_strike.no_hit.01.blue")
            .stretchTo(this.affected)
            .playbackRate(1)
            .filter("Glow", {distance: 1})
            .pause(800)
            return this
        }
        
        castCone({affected, caster}={}){
            super.castCommon(affected, caster)
            this.file("jb2a.cast_generic.ice.01.blue.0")
            	.scaleToObject(4)
                    .fadeIn(100)
                    .fadeOut(100)
                //    .spriteOffset({x:-100})
            	.playbackRate(1.5)
            return this
        }
    
        descriptorProjectToCone() {
            this.descriptorProject()
            return this;
        }

        descriptorDamage(){
            this.file('jb2a.impact_themed.ice_shard.blue')
            .scaleToObject(2.5)
            super.affectCommon()
                .file("jb2a.impact.ground_crack.frost.01.white")
                .belowTokens()
                .scaleToObject(3)
            return this;
        }

        descriptorProject() {
            this.file("jb2a.ray_of_frost")
                .scale(1.5)
                .filter("Glow", { distance: 2 })
                .pause(800)
            return this;
        }

        descriptorProjectToLine() {
             this.descriptorProject()
        }
    
        descriptorBurst() {
           this.file("jb2a.impact.frost.blue.01")
                .belowTokens()
                .scaleToObject(1.5)
                .delay(800);
            super.affectCommon()
                .file("jb2a.ice_spikes.radial.burst.white")
                .scaleToObject(1.5)
                .filter("Glow", { distance: 5 })
                .delay(900);
    
            return this;
        }

        descriptorLine() {
            const center = 
            {x: (this.affected.document.object.ray.A.x 
                 + this.affected.document.object.ray.B.x)/2,
             y: (this.affected.document.object.ray.A.y 
                + this.affected.document.object.ray.B.y)/2}
           
            this.file("jb2a.impact_themed.ice_shard.01.blue")
               
                .delay(1000)

            super.affectCommon()
                .file("jb2a.healing_generic.burst.bluewhite")
                .scale(0.8)
                .delay(1300)
                
                
            super.affectCommon()
                .file("jb2a.impact_themed.ice_shard.01.blue")
                .atLocation(center)
                .delay(1800)
            
            super.affectCommon()
                .file("jb2a.healing_generic.burst.bluewhite")
                .scale(0.8)
                .delay(2300)
                
                super.affectCommon()
                .file("jb2a.template_line.ice.01.blue.60ft")
                .stretchTo(this.affected)
                .fadeIn(50)
                .fadeOut(50)
                .playbackRate(1)
                .delay(800)
        }
  
        descriptorCone(){
            this.file("jb2a.breath_weapons.cold.cone.blue")
            .fadeIn(100)
            .fadeOut(100)
        	.delay(1650)
        	.playbackRate(1.5)
            return this;
        }

        burstHealing(){
            this.burstCommon()
            .file("jb2a.impact_themed.ice_shard.01.blue")
            .atLocation(this.affected)
            .scaleToObject(1.5)
            .delay(1000)
            return this
            
        }

        descriptorAffliction() {
            this.file("jb2a.shield_themed.above.ice.01.blue")
                .playbackRate(1)
                .scaleToObject()
                .scale(1.8)
                .fadeIn(500)
                .rotateIn(180, 600, { ease: "easeOutCubic" })
                .scaleIn(0, 600, { ease: "easeOutCubic" })
                .loopProperty("sprite", "rotation", { from: 0, to: -360, duration: 10000 })
                .filter("Glow", { distance: 5 })
                .persist();
              return this;
        }  
        descriptorHealing(){
            this.file("jb2a.healing_generic.burst.bluewhite")
                .scaleToObject(4)
                .delay(1100)
            return this
        }

    }

    class SuperSpeedEffectSection extends TemplatedDescriptorEffect {
         constructor(inSequence) {
            super(inSequence);
        }
        meleeDamageCast({caster, affected}) {
            super.castCommon({caster, affected})
            .file('jb2a.flurry_of_blows.physical.orange')
            .filter("ColorMatrix", { hue: 100,saturation: 0, brightness:1.3})
            .from(this.caster)
            .scale(2.5)
            .spriteOffset({x:-50, y: 0})
            .atLocation(this.caster)
            .repeats(6,500)
        .castCommon() 
             .playSound('modules/mm3e-animations/sounds/action/powers/flurryhits.ogg')  
            .pause(2000)
        .castCommon()
            .file('animated-spell-effects-cartoon.simple.63')
            .scale(.5)

            return this;
        }
        
        descriptorCast(){
             this.vibrate(1000)
        }
        descriptorMeleeCast(){
           this.vibrate(1000)
           super.castCommon()  
                .file('jb2a.flurry_of_blows.no_hit.yellow')
                .filter("ColorMatrix", { hue: 100,saturation: 0, brightness:1.3})
                .from(this.caster)
                .scale(2.5)
                .spriteOffset({x:-50, y: 0})
                .repeats(9,500)
            .castCommon() 
                 .playSound('modules/mm3e-animations/sounds/action/powers/Flurry.ogg')  
                .pause(2500)
            .castCommon()
                .file('animated-spell-effects-cartoon.simple.63')
                .scale(.5)
            return this
        }
        descriptorBurst(){
            let points = this.getCircularTemplatePoints(this.affected)
            this.vibrate()
            this.runThroughTemplate(points)
            return this
        }
        descriptorLine(){
            const points = this.getLineTemplatePoints(this.affected);
            this.vibrate();
            this.runThroughTemplate(points);
            return this;
        }   
        descriptorCone(){
            const points = this.getConeTemplatePoints(this.affected);
            this.vibrate();
            this.runThroughTemplate(points);
            return this;
        }
        getCircularTemplatePoints(template) {
            const points = [];
            const stepCount = 4; // Number of pairs across the circle
            const angleStep = (2 * Math.PI) / stepCount; // Angle between each pair in radians

            for (let i = 0; i < stepCount; i++) {
                // Calculate the angle for this step
                const angle = i * angleStep;

                // Calculate the point on one side of the circle
                const x1 = template.x + Math.cos(angle) * template.shape.radius;
                const y1 = template.y + Math.sin(angle) * template.shape.radius;

                // Calculate the opposite point directly across the circle
                const x2 = template.x + Math.cos(angle + Math.PI) * template.shape.radius;
                const y2 = template.y + Math.sin(angle + Math.PI) * template.shape.radius;

                // Add both points
                points.push({ x: x1, y: y1 });
                points.push({ x: x2, y: y2 });
            }

            return points;
        }
        getConeTemplatePoints(template) {
            const points = [];
            const gridSize = canvas.grid.size; // Size of one grid square in pixels
            const length = template.document.distance * gridSize *2/3; // Convert distance to pixels
            const halfAngle = (template.document.angle / 2) * (Math.PI / 180); // Half of the cone's angle in radians
            const direction = template.document.direction * (Math.PI / 180); // Central direction in radians
        
            // Start with the cone's origin (in grid units)
            const origin = { x: template.x, y: template.y };
            points.push(origin);
        
            // Calculate the leftmost edge point
            const leftX = template.x + Math.cos(direction - halfAngle) * length;
            const leftY = template.y + Math.sin(direction - halfAngle) * length;
            const leftPoint = { x: leftX, y: leftY };
            points.push(leftPoint);
        
            // Calculate the rightmost edge point
            const rightX = template.x + Math.cos(direction + halfAngle) * length;
            const rightY = template.y + Math.sin(direction + halfAngle) * length;
            const rightPoint = { x: rightX, y: rightY };
            points.push(rightPoint);
        
            // Calculate the midpoint of the triangle (average of left and right points)
            const midPoint = {
                x: (leftX + rightX) / 2,
                y: (leftY + rightY) / 2,
            };
            points.push(midPoint);
        
            // Calculate the opposite side point (reflect midpoint across origin and scale properly)
            const oppositeX = template.x - (midPoint.x - template.x) * (length / (length + 1));
            const oppositeY = template.y - (midPoint.y - template.y) * (length / (length + 1));
            const oppositePoint = { x: oppositeX, y: oppositeY };
            points.push(oppositePoint);
        
            // Add the final point back to the origin
            points.push(origin);
        
            return points;
        }
        getLineTemplatePoints(template) {
            const points = [];
            const gridSize = canvas.grid.size; // Size of one grid square in pixels
            const length = template.document.distance * gridSize *2/3; // Line length in pixels
            const direction = template.document.direction * (Math.PI / 180); // Line direction in radians
        
            // Start with the line's origin
            const origin = { x: template.x, y: template.y };
            points.push(origin);
        
            // Calculate the endpoint of the line
            const endX = template.x + Math.cos(direction) * length;
            const endY = template.y + Math.sin(direction) * length;
            const endPoint = { x: endX, y: endY };
            points.push(endPoint);
        
            // Add the return point (back to origin)
            points.push(origin);
        
            return points;
        }
        runThroughTemplate( points) { 
        
            const token = this.caster; 
        
            const tokenPosition = { x: token.x, y: token.y };
            let farthestPoint = points[0];
            let maxDistance = 0;
        
            points.forEach((point) => {
                const distance = Math.sqrt(
                    Math.pow(point.x - tokenPosition.x, 2) +
                    Math.pow(point.y - tokenPosition.y, 2)
                );
                if (distance > maxDistance) {
                    maxDistance = distance;
                    farthestPoint = point;
                }
            });

            const reorganizedPoints = [tokenPosition, farthestPoint, ...points, tokenPosition];
            
            super.mm3eEffect()
                .animation()
                .opacity(0)
                .on(token)
                .duration(0);
                
            for (let i = 0; i < reorganizedPoints.length-1; i++) {
                super.mm3eEffect()
                    .file(token.document.texture.src) 
                    .scale(token.document.texture.scaleX) 
                    .opacity(1) 
                    .from(token)
                    .atLocation(reorganizedPoints[i])
                    .moveTowards(reorganizedPoints[i+1], { ease: "easeInOutCubic", rotate: true })
                    .duration(500) 
                    .pause(200)
                    
                super.mm3eEffect()
                    .file("animated-spell-effects-cartoon.energy.16") // Trail animation
                    .scale(4)
                    .atLocation(reorganizedPoints[i])
                    .stretchTo(reorganizedPoints[i+1], { gridUnits: true, proportional: true })
                    .belowTokens()
                    .opacity(0.75)
                    .spriteOffset({ x: -5 }, { gridUnits: true })
                    .filter("ColorMatrix", { brightness: 1.2 })
                    .filter("ColorMatrix", { hue: 330 })
                    .randomizeMirrorY()
                    .fadeOut(200)
                    .zIndex(0.2)
                super.mm3eEffect()
                    .file("animated-spell-effects-cartoon.simple.23")
                    .filter("ColorMatrix", { hue: 180 })
                    .playbackRate(0.9)
                    .atLocation(reorganizedPoints[i])
                    .stretchTo(reorganizedPoints[i+1], {onlyX:true, offest:{x:-3,y:0} })
                        .scale(.6)
                    .belowTokens()
                    .opacity(0.5)
                    .zIndex(0.3)
                    .fadeOut(300)
                super.mm3eEffect()
                    .file("animated-spell-effects-cartoon.simple.29")
                    .atLocation(reorganizedPoints[i])
                    .rotateTowards(reorganizedPoints[i+1])
                    .scale(0.5 * token.document.texture.scaleX)
                    .belowTokens()
                    .opacity(0.85)
                    .scaleIn(0, 300, { ease: "easeOutExpo" })
                    .spriteRotation(-90)
                    .spriteOffset({ x: -3, y: -0.1 }, { gridUnits: true })
                super.mm3eEffect()
                    .delay(100)
                    .file("animated-spell-effects-cartoon.simple.05")
                    .filter("Glow", { color: 0x29c9ff })
                    .spriteOffset({x: 0.5, y: 0.5}, {gridUnits:true})
                    .randomRotation()
                    .scale(.3)
                    .atLocation(reorganizedPoints[i])   
               .sound('modules/mm3e-animations/sounds/power/super%20speed/move%20quick.ogg')
            }
            
            this.mm3eEffect()
                .animation()
                .opacity(0)
                .on(token)
                .duration(0)
            this.mm3eEffect()
                .animation()
                .opacity(1)
                .on(token)
                .duration(0);
        }
        vibrate(duration=3000)
         {
             this.playSound('modules/mm3e-animations/sounds/power/super%20speed/wiff.ogg')
             .castCommon({rotation:false})
                 .file('animated-spell-effects-cartoon.simple.117')
                 .scale(.5)
            .castCommon({rotation:false})
               .from(this.caster)
               .fadeIn(200)
               .fadeOut(500)
               .loopProperty("sprite", "position.x", { from: -0.10, to: 0.10, duration: 50, pingPong: true, gridUnits: true})
               .scaleToObject(this.caster.document.texture.scaleX)
               .duration(3000)
               .opacity(0.25)
            return this;
        }

        descriptorProject(){
           let origin = this.getTokenCenter(this.caster);
            let destination =this.getNearestTokenSide(origin, this.affected)
            this.speed({caster:this.caster, position:destination})
            function timerPromise(delay) {return new Promise((resolve) => setTimeout(resolve, delay));}  
            //give the attack sequence time to run
            timerPromise(1500).then(() => 
            new Sequence().superSpeedEffect().cast(this.caster).speed({caster:this.caster, position:origin}).play()
        )

        }
        descriptorProjectToCone(){
            return this
        }
        descriptorProjectToLine(){
            return this
        }

        descriptorAffect(){
            this.descriptorAffectAura()
        }
        descriptorAffectAura(persist){
            let duration
            if(!persist)
            {
                duration = 3000
            }
           this.playSound('modules/mm3e-animations/sounds/power/super%20speed/wiff.ogg')
            .fluctuate(duration)
           
            return this;
        }
        descriptorAffliction({affected}={}){
            this.playSound('modules/mm3e-animations/sounds/action/powers/phase2.ogg')
            .fluctuate()
            super.affectCommon()
            .file('animated-spell-effects-cartoon.cantrips.mending.blue')
            .scale(.4)
            .filter("ColorMatrix" , { hue:500,contrast: 0, saturate: 0,brightness: 1})
            .persist()
            return this
        }
        fluctuate(duration){
             this.thenDo(async ()=>{
                let filter = "fluctuating" + Math.random().toString()
                let params =
                [{
                    filterType: "images",
                    filterId: filter,
                    time: 0,
                    nbImage:4,
                    alphaImg: 1.0,
                    alphaChr: 0.0,
                    blend: 4,
                    ampX: 0.2,
                    ampY: 0.2,
                    padding: 10,
                    zOrder: 20,
                    animated :
                    {
                      time: 
                      { 
                        active: true, 
                        speed: 0.1110, 
                        animType: "move" 
                      },
                      ampX:
                      {
                        active: true,
                        val1: 0.00,
                        val2: 0.0030,
                        chaosFactor: 0.03,
                        animType: "syncChaoticOscillation",
                        loopDuration: 2000
                      },
                      ampY:
                      {
                        active: true,
                        val1: 0.00,
                        val2: 0.030,
                        chaosFactor: 0.04,
                        animType: "syncChaoticOscillation",
                        loopDuration: 1650
                      },
                      alphaChr:        
                      { 
                        active: true, 
                        animType: "randomNumberPerLoop", 
                        val1: 0.0, 
                        val2: 1,
                        loopDuration: 250
                      },
                      alphaImg:        
                      { 
                        active: true, 
                        animType: "randomNumberPerLoop", 
                        val1: 0.8, 
                        val2: 0.1,
                        loopDuration: 250
                      },
                      nbImage:
                      {
                        active: true,
                        val1: 1,
                        val2: 4,
                        animType: "syncSinOscillation",
                        loopDuration: 1400
                      }
                    }
                }];
                
                 this.affected.TMFXaddFilters(params);
                 if(duration){
                     function timerPromise(delay) {return new Promise((resolve) => setTimeout(resolve, delay));}  //give the rest of the sequence time to run
                     
                     timerPromise(duration).then(() => 
                         TokenMagic.deleteFilters(this.affected,filter));
                 }
             })
        }

        descriptorSpeed(position){
            this.castCommon()
            .file("animated-spell-effects-cartoon.smoke.01")
            .rotateTowards(position)
            .scaleToObject(1.75)
            .belowTokens()
            .opacity(0.65)
            .scaleIn(0, 300, {ease: "easeOutExpo"})
            .filter("ColorMatrix", { saturate: 0, brightness: 1 })
            .spriteRotation(-90)
            .spriteOffset({x:-1}, {gridUnits :true})

            this.castCommon()
                .file("jb2a.smoke.puff.side.dark_black.4")
                .scaleToObject(2)
                .rotateTowards(position)
                .fadeOut(200)
                .opacity(1)
                .filter("ColorMatrix", { saturate: 0, brightness: 1 })
                .moveTowards(position,{rotate:false, ease:"easeOutCirc"})
                .spriteRotation(180)
                .spriteOffset({x:-1.75}, {gridUnits :true})
                .moveSpeed(1500)
                .zIndex(0.3)
    
            this.castCommon()
                .file("jb2a.energy_strands.range.standard.grey")
                .stretchTo(position)
                .belowTokens()
                .opacity(0.5)
                .repeats(3,50,50)
                .spriteOffset({x:0}, {gridUnits :true})
                .filter("ColorMatrix", { saturate: 0, brightness: 2 })
                .randomizeMirrorY() 
                .fadeOut(200)
                .zIndex(0.2)

            .effect()
                .file("animated-spell-effects-cartoon.magic.mind sliver")
                .delay(50)
                .atLocation(this.caster)
                .stretchTo(position)
                .belowTokens()
                .opacity(1)
                .spriteOffset({x:0}, {gridUnits :true})
                .filter("ColorMatrix", { saturate: 0, brightness: 1,contrast:0 })
                .randomizeMirrorY()
                .fadeOut(200)
                .zIndex(0.21)
    
            this.castCommon()
                .file("animated-spell-effects-cartoon.smoke.99")
                .filter("ColorMatrix", {brightness: 1, contrast: 1.5, saturate:0})
                .spriteOffset({ x: -3, y: -1 }, { gridUnits: true })
                .atLocation(position)
                .rotateTowards(this.caster)
                .rotate(90)
                .scaleToObject(5, {considerTokenScale: true})

        return this;
       
        }

    }
    class SuperStrengthSection extends PowerEffectSection {  
         constructor(inSequence) {
            super(inSequence);
        }
        castSlam({caster}={}){  
                
                super.castCommon({caster:caster, affected:caster}) 
                let fs = new FlightEffect(this);
                fs.start({caster:this.caster})
                fs.end({caster:this.caster})
            return this
        }

        meleeCast({caster, affected, repeats=1}={} ){
            super.meleeCastCommon({caster:caster, affected:affected})
            .file("jb2a.melee_attack.02.trail") 
            .scale(this.caster.document.width*.26, {gridUnits:true})
            .spriteOffset({x:-0.7*this.caster.document.width},{gridUnits:true})
            .filter("ColorMatrix", {
                hue: 500, // Keep hue neutral for grey
                contrast: 0, 
                saturate: 0, // Set saturation to 0 to remove color
                brightness: 1
            })
            .lungeTowardTarget({scale:1})
            return this;
        }

        cast({caster, affected}={}){
            this.castCommon({caster:caster, affected:affected})
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
         //       .mirrorY()
         //       .pause(400)
            .castCommon()
           //     .file("jb2a.impact.001.orange")
                .scaleToObject(2)
                .filter("ColorMatrix", {
                    hue: 50,
                    contrast: 1,
                    saturate: 0,
                    brightness: 1
                })
          //  .playSound("modules/mm3e-animations/sounds/action/powers/Hit6.ogg")
            return this;
        }

        burst({caster, affected}={}){
            super.burstCommon({caster:caster, affected:affected})
                .file(`animated-spell-effects-cartoon.simple.47`)
                .scaleToObject(3)
            return this
        }

        burstSlam({caster,affected}={}){
            super.shake({strength:150, duration:1500, rotation:false, fadeOutDuration:1000})
            super.burstCommon({caster:caster, affected:affected})
                .file("jb2a.impact.ground_crack.02.white")
            return this
        }

        burstDazzle({caster,affected}={}){
            super.burstCommon({caster:caster, affected:affected})
                .file("animated-spell-effects-cartoon.energy.pulse.blue") 
                .filter("ColorMatrix", {
                    hue: 50,         
                    contrast: 0,     
                    saturate: 0,    
                    brightness: 5   
                })  
                .duration(600)
                .playSound('modules/mm3e-animations/sounds/action/powers/Shadowpunch4.ogg')
                .pause(600)
            .repeatEffect().playSound('')
                    .filter("ColorMatrix", {
                        hue: 50,         
                        contrast: 0,     
                        saturate: 0,    
                        brightness: 5   
                    }) 
            super.shake({strength:150, duration:1500, rotation:false, fadeOutDuration:1000})
            return this
        }

        projectToCone({caster, affected}={}){
            super.projectToConeCommon()
          //  affected = canvas.templates.placeables[0]
            const coneStart = { x: this.affected.x, y: this.affected.y };
            this.mm3eEffect() 
                .atLocation(this.caster)
                .aboveLighting()
                .stretchTo(coneStart)
                //super.projectToConeCommon({caster:caster, affected:affected})
                .file('animated-spell-effects-cartoon.air.bolt.square')
                .playSound('modules/mm3e-animations/sounds/action/powers/whoosh8.ogg')

            return this
        }   

        cone({caster, affected}={}){
            super.coneCommon({caster:caster, affected:affected})
                .file("animated-spell-effects-cartoon.energy.blast.03") 
                .aboveLighting()
                .filter("ColorMatrix", {
                    hue: 0,
                    contrast: 1,
                    saturate: 0,
                    brightness: 1
                })
            return this
        }

        line({caster, affected}={}){
            super.lineCommon({caster:caster, affected:affected})
                .file("jb2a.wind_stream") 
                .aboveLighting()
                .filter("ColorMatrix", {
                    hue: 0,
                    contrast: 1,
                    saturate: 0,
                    brightness: 3
                })
                .filter("ColorMatrix",{            
                 saturation: 0, 
                    brightness: 1.5 
                })
                .scale({ x: 1, y: 0.1 })
            return this
        }

        affectAffliction({affected}={}){
            //super.affectCommon({affected:affected})
            this.affectDamage({affected:affected,persistent:true})
                
            return this
        }

        affectDamage({affected = this.affected, persistent=false}){          
            this.affect({affected:affected})
            this.file("jb2a.dizzy_stars.200px.yellow")
                //.scaleIn(0, 100, {ease: "easeOutCubic"}) 
                .scaleToObject(1)
                .opacity(1)
                .attachTo(affected, {offset:{y:-0.5*affected.document.width}, gridUnits:true})
                .persist(persistent)
            .affect()
                .file("animated-spell-effects-cartoon.misc.spark") 
                .scale(affected.document.width*.65, {gridUnits:true})
                .playSound("modules/mm3e-animations/sounds/action/powers/PunchHit*.ogg")
            .recoilAwayFromSelected({affected:affected})
            .pause(1000)
            .affect()
                .from(affected)
                .fadeIn(200)
                .fadeOut(500)
                .loopProperty("sprite", "position.x", { from: -0.05, to: 0.05, duration: 50, pingPong: true, gridUnits: true})
                .scaleToObject(affected.document.texture.scaleX)
                .duration(1500)
                .opacity(0.25)
            return this
        } 

        start({caster}={}){
            this.originalEffectSection.castCommon({caster:caster, affected:caster})
                .loopUp({distance:75, duration:1000, speed:200, ease:"easeInCirc", pause: false})
                .file("animated-spell-effects-cartoon.energy.16")
                .rotate(90)
                .scaleToObject(1)
                .filter("ColorMatrix" , {
                     hue: 500, 
                     contrast: 0, 
                     saturate: 0,
                     brightness: 1
                 })
                .repeatEffect()    //inherit last effect with any modifications we want below
                    .spriteOffset({x:0, y: 25})
                    .playSound("modules/mm3e-animations/sounds/action/powers/whoosh9.ogg")
                .repeatEffect()   //inherit last effect with any modifications we want below
                    .spriteOffset({x:0, y: -25})
                    .pause(900)
                return this.originalEffectSection;
            }
        
        end({caster}={}){
             this.originalEffectSection.castCommon({caster:caster, affected:caster})
                .loopDown({distance:75, duration:1000, speed:200, ease:"easeInCirc", pause: false})
 
                .castCommon()
                .file("animated-spell-effects-cartoon.energy.16")
                .rotate(270)
                .scaleToObject(1)
                .filter("ColorMatrix" , {
                     hue: 500, 
                     contrast: 0, 
                     saturate: 0,
                     brightness: 1
                 })
            .repeatEffect()   //inherit last effect with any modifications we want below
                .spriteOffset({x:0, y: 25})
            .repeatEffect()   //inherit last effect with any modifications we want below
                .playSound("modules/mm3e-animations/sounds/action/powers/Whoosh2.ogg")
                .spriteOffset({x:0, y: -25})
                .pause(300)
            .endMovement()
            return this.originalEffectSection;
        }
    }

    class FlightEffect  {
        constructor(originalEffectSection){
            this.originalEffectSection = originalEffectSection
        }

        start({caster}={}){
            this.originalEffectSection.castCommon({caster:caster, affected:caster})
                .loopUp({distance:75, duration:1000, speed:200, ease:"easeInCirc", pause: false})
                .file("animated-spell-effects-cartoon.energy.16")
                .rotate(90)
                .scaleToObject(1)
                .filter("ColorMatrix" , {
                     hue: 500, 
                     contrast: 0, 
                     saturate: 0,
                     brightness: 1
                 })
                .repeatEffect()    //inherit last effect with any modifications we want below
                    .spriteOffset({x:0, y: 25})
                    .playSound("modules/mm3e-animations/sounds/action/powers/whoosh9.ogg")
                .repeatEffect()   //inherit last effect with any modifications we want below
                    .spriteOffset({x:0, y: -25})
                    .pause(900)
                return this.originalEffectSection;
            }
        
        end({caster}={}){
             this.originalEffectSection.castCommon({caster:caster, affected:caster})
                .loopDown({distance:75, duration:1000, speed:200, ease:"easeInCirc", pause: false})
 
                .castCommon()
                .file("animated-spell-effects-cartoon.energy.16")
                .rotate(270)
                .scaleToObject(1)
                .filter("ColorMatrix" , {
                     hue: 500, 
                     contrast: 0, 
                     saturate: 0,
                     brightness: 1
                 })
            .repeatEffect()   //inherit last effect with any modifications we want below
                .spriteOffset({x:0, y: 25})
            .repeatEffect()   //inherit last effect with any modifications we want below
                .playSound("modules/mm3e-animations/sounds/action/powers/Whoosh2.ogg")
                .spriteOffset({x:0, y: -25})
                .pause(300)
            .endMovement()
            return this.originalEffectSection;
        }
    }

    class InsectEffectSection extends PowerEffectSection {
         constructor(inSequence) {
            super(inSequence);
        }
        cast({caster, affected , duration = 1}={}){ 
            super.castCommon({caster:caster, affected:affected})
                .file("jaamod.assets.flies")
                .scaleToObject( .6 )
                .repeats(30)
                .filter("ColorMatrix", {hue: 520,brightness: 0,contrast:0, saturate:0} )  
                .playSound("modules/mm3e-animations/sounds/action/powers/BM_CallSwarm_Attack_01.ogg")
                .pause(duration)
             
             return this
        } 

   
       burst({affected,persist=true}={})
       {
            super.burstCommon({affected:affected})
            

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
                    .persist(persist)
            }
        
            this.playSound('modules/mm3e-animations/sounds/action/powers/BM_CallSwarm_Hit_01.ogg')
            .pause(1000)
            .playSound('modules/mm3e-animations/sounds/action/powers/BM_CallSwarm_Continuing_Loop.ogg')
            return this
        }
       line({affected}={}) {
            super.lineCommon({affected:affected})

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
       cone({affected} = {}) {
            super.coneCommon({affected:affected})
    
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


        meleeCast({caster, affected, repeats=1}={} ){
            super.meleeCastCommon({caster:caster, affected:affected}) 
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
                .lungeTowardTarget({ distance : .5, duration:100, repeats:repeats})  
            return this
        }
        
        project({caster, target }={}){ 
            super.projectCommon({caster:caster,target:target})
            this.file('jaamod.misc.bat_swarm')
            .scale({ x: 1, y: 0.1 })
          return this;
        }
    
        affectAffliction({affected}={})
        {
            super.affectCommon({affected:affected})
                this.file("jaamod.spells_effects.swarm_spider")
                .filter("ColorMatrix",  {hue: 500, saturate: -1, brightness: .1,contrast: 1  })
                .scaleToObject(1.4)
                .persist()
            .affectCommon()
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

        affectAura({affected, duration=1, persist=false, scaleToObject = 1, spriteOffest={x:0, y:0}}={}){
            super.affectCommon({affected:affected})
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
            super.affectCommon()
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
            this.affectCommon()
                .playSound("modules/mm3e-animations/sounds/action/powers/BM_CallSwarm_Attack_01.ogg")
                .pause(duration)
            return this;
        }

        affectConcealment({affected}={})
        {
            this.affectAura({affected:affected, persist:true})
                .pause(1000)
                super.affectConcealment({affected:this.affected})
            return this;
        }
        
        affectDamage({affected = this.affected, repeats=1}={} ){ 
            this.affectCommon({affected: affected})
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
           .affectCommon()
               .file("jaamod.assets.flies")      
               .scale(.2)  
               .atLocation(affected)                 
               .rotate(10)
               .mirrorY()
               .repeats(8,200)
           .affectCommon()
                .pause(1000)
              .recoilAwayFromSelected({affected:affected, distance : .2, duration:100, repeats:repeats})
            
           return this;
       }

        affectHealing({affected = this.affected|| this.firstSelected}={}){
             this.affectAura({affected:affected, persist:false})
                .pause(1000)
                super.affectHealing({affected:affected})
            return this;
        }

        affectIllusion({affected = this.affected}={})
        {
            this.affectAura({affected:affected, persist:true})
                .pause(1000)
                super.affectIllusion({affected:affected})

            return this;
        }

        affectMindControl({affected = this.affected}={}){
             this.affectAura({affected, scaleToObject:.6 , spriteOffest:{x:0, y:-30} , persist:true})
            .pause(2000)
            super.affectMindControl(affected)
            return this
         }

         affectWeaken({affected = this.affected}={}){
             this.affectAura({affected,  persist:true})
                .pause(1000)
                super.affectWeaken(affected)
            return this
         }
    }  
    class PlantEffectSection  extends TemplatedDescriptorEffect {
        constructor(inSequence) {
            super(inSequence);
        }
       /* castCone({affected, caster}={}){
            return this
        }*/
    
        descriptorCast(){
             return this
        }
        descriptorMeleeCast(){
            return this
        }

        descriptorProject() {
            return this;
        }
        descriptorProjectToLine() {
            return this.descriptorProject()
        }
        descriptorProjectToCone() {
            return this.descriptorProject()
        }   

        descriptorBurst() {
            return this;
        }
        descriptorLine() {
            return this
        }
        descriptorCone() {
            return this;
        }
        descriptorAffliction() {
             
            return this;
        }
        descriptorAura(){
            return this
        }
        descriptorDamage(){
            return this;
        }
        descriptorHealing(){
           
            return this
        }

        /*
       
        descriptorAura(){
            return this
        }

        descriptorConcealment()
        {
            return this;
        }

        descriptorIllusion(){
            return this
        }
        descriptorInsubstantial(){
            return this
        }

        descriptorMindControl(){
            return this
        }

        descriptorMindControl(){
            return this
        }

        descriptorNullify(){
            return this
        }

        descriptorProtection(){
            return this
        }

        descriptorTransform(){
            return this
        }

        descriptorWeaken(){
            return this
        }*/
    
    }
    class PoisonEffectSection extends TemplatedDescriptorEffect {
        constructor(inSequence) {
            super(inSequence);
        }
       /* castCone({affected, caster}={}){
            return this
        }*/
    
        descriptorCast(){
             return this
        }
        descriptorMeleeCast(){
            return this
        }

        descriptorProject() {
            return this;
        }
        descriptorProjectToLine() {
            return this.descriptorProject()
        }
        descriptorProjectToCone() {
            return this.descriptorProject()
        }   

        descriptorBurst() {
            return this;
        }
        descriptorLine() {
            return this
        }
        descriptorCone() {
            return this;
        }
        descriptorAffliction() {
             
            return this;
        }
        descriptorAura(){
            return this
        }
        descriptorDamage(){
            return this;
        }
        descriptorHealing(){
           
            return this
        }

        /*
       
        descriptorAura(){
            return this
        }

        descriptorConcealment()
        {
            return this;
        }

        descriptorIllusion(){
            return this
        }
        descriptorInsubstantial(){
            return this
        }

        descriptorMindControl(){
            return this
        }

        descriptorMindControl(){
            return this
        }

        descriptorNullify(){
            return this
        }

        descriptorProtection(){
            return this
        }

        descriptorTransform(){
            return this
        }

        descriptorWeaken(){
            return this
        }*/
    
    }

    class PsychicEffectSection extends TemplatedDescriptorEffect {
        constructor(inSequence) {
            super(inSequence);
        }
       /* castCone({affected, caster}={}){
            return this
        }*/
    
        descriptorCast(){
             return this
        }
        descriptorMeleeCast(){
            return this
        }

        descriptorProject() {
            return this;
        }
        descriptorProjectToLine() {
            return this.descriptorProject()
        }
        descriptorProjectToCone() {
            return this.descriptorProject()
        }   

        descriptorBurst() {
            return this;
        }
        descriptorLine() {
            return this
        }
        descriptorCone() {
            return this;
        }
        descriptorAffliction() {
             
            return this;
        }
        descriptorAura(){
            return this
        }
        descriptorDamage(){
            return this;
        }
        descriptorHealing(){
           
            return this
        }

        /*
       
        descriptorAura(){
            return this
        }

        descriptorConcealment()
        {
            return this;
        }

        descriptorIllusion(){
            return this
        }
        descriptorInsubstantial(){
            return this
        }

        descriptorMindControl(){
            return this
        }

        descriptorMindControl(){
            return this
        }

        descriptorNullify(){
            return this
        }

        descriptorProtection(){
            return this
        }

        descriptorTransform(){
            return this
        }

        descriptorWeaken(){
            return this
        }*/
    
    }
    class RadiationEffectSection extends TemplatedDescriptorEffect {
        constructor(inSequence) {
            super(inSequence);
        }
       /* castCone({affected, caster}={}){
            return this
        }*/
    
        descriptorCast(){
             return this
        }
        descriptorMeleeCast(){
            return this
        }

        descriptorProject() {
            return this

        }
        descriptorProjectToLine() {
            return this.descriptorProject()
        }
        descriptorProjectToCone() {
            return this.descriptorProject()
        }   

        descriptorBurst() {
            return this;
        }
        descriptorLine() {
            return this
        }
        descriptorCone() {
            return this;
        }
        descriptorAffliction() {
             
            return this;
        }
        descriptorAura(){
            return this
        }
        descriptorDamage(){
            return this;
        }
        descriptorHealing(){
           
            return this
        }

        /*
       
        descriptorAura(){
            return this
        }

        descriptorConcealment()
        {
            return this;
        }

        descriptorIllusion(){
            return this
        }
        descriptorInsubstantial(){
            return this
        }

        descriptorMindControl(){
            return this
        }

        descriptorMindControl(){
            return this
        }

        descriptorNullify(){
            return this
        }

        descriptorProtection(){
            return this
        }

        descriptorTransform(){
            return this
        }

        descriptorWeaken(){
            return this
        }*/
    
    }

    class WaterEffectSection extends TemplatedDescriptorEffect {
        constructor(inSequence) {
            super(inSequence);

        }
       /* castCone({affected, caster}={}){
            return this
        }*/
    
        descriptorCast(){
             super.castCommon({rotation:false})
                .file("jb2a.particles.outward.blue.01.04")
                .fadeIn(500)
                .fadeOut(500)
                .scaleToObject(6)
                .duration(5000)
                .loopProperty("sprite", "rotation", { from: 0, to: 360, duration: 3000})
                .scaleOut(0, 5000, {ease: "easeOutQuint", delay: -3000})
                .zIndex(1)
            super.castCommon()
                .file("jb2a.particles.outward.blue.01.03")
                .anchor({x:0.4})
                .scaleToObject(1.75)
                .animateProperty("sprite", "position.x", { from: 0, to: -1000, duration: 15000})
                .rotateTowards(this.affected, {cacheLocation: true})
                .scaleIn(0, 500, {ease: "easeOutQuint"})
                .duration(6000)
                .playbackRate(2)
                .fadeOut(2000)
                .delay(4000)
                .zIndex(2)
            .sound().file("modules/dnd5e-animations/assets/sounds/Spells/Elemental/spell-water-jet-1.mp3")
            .delay(10)
            super.castCommon({rotation:false})
                .file("animated-spell-effects-cartoon.mix.water.01")
                .playbackRate(1.3)
                .delay(2000)
                .scaleToObject(2)
                .waitUntilFinished(-2000)
            return this;
        }
        descriptorMeleeCast(){
            this.file("jb2a.cast_generic.water.02.blue")
             .playbackRate(1.3)
                .scale(1)
                .belowTokens()
                .waitUntilFinished(-1500)
            .meleeCastCommon({rotation:false}) 
              .file("animated-spell-effects-cartoon.water.79")
              .attachTo(this.caster, { align: "center", edge: "outer", offset: { x: 0, y: 0 }, gridUnits: true, local:true })
              .scale(0.3)
              .delay(500)
            .meleeCastCommon({rotation:false})
                .file("jb2a.unarmed_strike.physical.02.blue")
                .atLocation(this.caster, { edge: "outer" })
                .stretchTo(this.affected)
                .filter("ColorMatrix", { hue: 0, brightness: 1, contrast: 0, saturate: 0 })
                .scale(3)
                .delay(100)
                .playbackRate(1.25)
                .fadeOut(100)
                .zIndex(2)
            .pause(750) 
            .meleeCastCommon({rotation:false})
                .file("jb2a.swirling_leaves.outburst.01.pink")
            .scaleIn(0, 500, {ease: "easeOutCubic"}) 
            .filter("ColorMatrix", { saturate: 1, hue: -105 })
            .scaleToObject(0.75)
            .fadeOut(2000)
            .zIndex(1)
        .meleeCastCommon()   
            .lungeTowardTarget()
            .duration(600)
            .scaleToObject(1, {considerTokenScale: true})
            .delay(600)      
         .canvasPan()
                .delay(250)
                .shake({duration: 250, strength: 2, rotation: false })

            return this
        }
        castPersonal({caster,affected}={}){
            super.castCommon({caster:caster,affected:affected}={})
                .file("animated-spell-effects-cartoon.water.create.01")
                .scale(0.4)
                .aboveLighting()
            super.castCommon()
                .file("jb2a.impact.water.02.blue.0")
                .playbackRate(1)
                .scale(0.8)
                .delay(400)
            .sound()
                .file("modules/dnd5e-animations/assets/sounds/Spells/Elemental/spell-water-jet-1.mp3")
                .delay(10)
            return this
        }
        castLine({caster, affected=this.firstTemplate}={}){
            super.castCommon({caster:caster, affected:affected,rotation:false})
            .file("jb2a.cast_generic.water.02.blue")
            .playbackRate(1)
            .scale(1)
            .belowTokens()       
        
            super.castCommon()
                .file("jb2a.liquid.splash_side.blue")
                .attachTo(this.caster, { align: "center", edge: "on", offset: { x: -0.5, y: 0 }, gridUnits: true, local:true })
                .rotateTowards(this.affected)
                .delay(2000)
        
                super.castCommon()
                .file("animated-spell-effects-cartoon.water.79")
                .attachTo(this.caster, { align: "center", edge: "outer", offset: { x: 0, y: 0 }, gridUnits: true, local:true })
                .rotateTowards({
                    x:  this.affected.center.x,
                    y:  this.affected.center.y + this.randomYOffset
                    })
                .scale(0.5)
                .delay(2000)
                return this
        }
        descriptorProject() {
            return this.file("jb2a.template_line_piercing.water.01.blue")
                .delay(500)
                .waitUntilFinished(-3000)
                
                .sound()
                .file("modules/dnd5e-animations/assets/sounds/Spells/Ray/spell-ray-2.mp3")
                .volume(1);;
        }
        descriptorProjectToLine() {
            return this.descriptorProject()
        }
        descriptorProjectToCone() {
            return this.descriptorProject()
        }   
        descriptorBurst() {
            return this.waterExplosion();
        }

        burstCreate({caster,affected}={}){
             super.burstCommon({caster:caster,affected:affected}).file("animated-spell-effects-cartoon.mix.water.01")
                .attachTo(this.affected)
                .playbackRate(1.3)
                .delay(0)
                .opacity(0.8)
                .scaleToObject(1)
            super.burstCommon()
                .file("animated-spell-effects-cartoon.water.create.01")
                .attachTo(this.affected)
                .playbackRate(0.8)
                .delay(0)
                .scaleToObject(1)
            return this.waterExplosion();
        }
        burstTransform({affected, caster}={})
        {
            return this.burstCreate({affected:affected, caster:caster})
                .file(`jb2a.impact.water.02.blue.0`)
                .name("splash")
                .scaleToObject(3)
                .endTime(2600)
                .randomRotation()
                .noLoop()
                .persist()
                .belowTokens()
                .fadeOut(1000)
                .scaleIn(0, 600, {ease: "easeOutCubic"})
         }
        
        burstDamage({caster,affected}={}){
            let sound = 'modules/dnd5e-animations/assets/sounds/Spells/Create-or-Destroy-Water.mp3'
            super.burstCommon({caster:caster, affected:affected})
            this.waterExplosion({caster, affected, sound})
            return this
            
        }
        waterExplosion({affected,caster, sound="modules/dnd5e-animations/assets/sounds/Damage/Acid/acid-bubbling-2.mp3"}={}){
            this.file("animated-spell-effects-cartoon.water.water splash.01")
                .scaleToObject (1.7)
                .scaleIn(0, 500, {ease: "easeOutQuint"})
                .zIndex(2)
                .sound()
                .file(sound)
                .delay(0)
            super.affectCommon()
                .file(`jb2a.impact.water.02.blue.0`)
                .name("splash")
                .scaleToObject(3)
                .endTime(2600)
                .noLoop()
                .persist()
                .belowTokens()
                .fadeOut(1000)
                .scaleIn(0, 600, {ease: "easeOutCubic"})
            
                let delayDuration = 10000;
                let  splashFilters = {
                  name: "splash"
            };

            function endEffectsWithDelay(filters, delay) {
              setTimeout(() => {
                Sequencer.EffectManager.endEffects(filters);
              }, delay);
            }
            endEffectsWithDelay(splashFilters, delayDuration);
            return this;
        }
        
        burstHealing({caster,affected}={}){
            super.burstCommon()
                .file("animated-spell-effects-cartoon.water.water splash.01")
                .scaleToObject (1.7)
                .scaleIn(0, 500, {ease: "easeOutQuint"})
                .zIndex(2)
            .sound()
                .file("modules/dnd5e-animations/assets/sounds/Spells/Buff/spell-buff-short-5.mp3")
                .delay(1000)
             super.burstCommon()
                .file(" animated-spell-effects-cartoon.water.29")
                .anchor({ x: 0.8, y: 0.45 })
                .rotate(-35)
                .playbackRate(1)
                .scale(0.5)
             super.burstCommon()
                .file(" animated-spell-effects-cartoon.water.29")
                .anchor({ x: 0.2, y: 0.45 })
                .rotate(35)
                .playbackRate(1)
                .scale(0.5)
                .mirrorX()
             super.burstCommon()
                .file(" animated-spell-effects-cartoon.water.29")
                .anchor({ x: 0.8, y: 0.45 })
                .rotate(90)
                .playbackRate(1)
                .scale(0.5)   
             super.burstCommon()
                .file(`jb2a.impact.water.02.blue.0`)
                .name("splash")
                  .scaleToObject(3)
                  .endTime(2200)
                  .noLoop()
                  .persist()
                  .belowTokens()
                  .fadeOut(1000)
                  .scaleIn(0, 600, {ease: "easeOutCubic"})
            super.burstCommon()
                  .file("jb2a.healing_generic.burst.bluewhite")        
                  .opacity(1)
                  .scaleToObject(1)
            return this
        }
        waterSwirls(){
            super.affectCommon()
                .file("animated-spell-effects-cartoon.water.water splash.01")
                .scaleToObject (1.7)
                .scaleIn(0, 500, {ease: "easeOutQuint"})
                .zIndex(2)
            .sound()
                .file("modules/dnd5e-animations/assets/sounds/Spells/Buff/spell-buff-short-5.mp3")
                .delay(1000)
             super.affectCommon()
                .file(" animated-spell-effects-cartoon.water.29")
                .anchor({ x: 0.8, y: 0.45 })
                .rotate(-35)
                .playbackRate(1)
                .scale(0.5)
             super.affectCommon()
                .file(" animated-spell-effects-cartoon.water.29")
                .anchor({ x: 0.2, y: 0.45 })
                .rotate(35)
                .playbackRate(1)
                .scale(0.5)
                .mirrorX()
             super.affectCommon()
                .file(" animated-spell-effects-cartoon.water.29")
                .anchor({ x: 0.8, y: 0.45 })
                .rotate(90)
                .playbackRate(1)
                .scale(0.5)   
             super.affectCommon()
                .file(`jb2a.impact.water.02.blue.0`)
                .name("splash")
                  .scaleToObject(3)
                  .endTime(2200)
                  .noLoop()
                  .persist()
                  .belowTokens()
                  .fadeOut(1000)
                  .scaleIn(0, 600, {ease: "easeOutCubic"})
            super.affectCommon()
                  .file("jb2a.healing_generic.burst.bluewhite")        
                  .opacity(1)
                  .scaleToObject(1)
        }
        descriptorLine() {
                 this.file("jb2a.impact.water.02.blue.0")
                .atLocation(this.templateStart)
                .scaleToObject(2)
                .delay(2000)
                .fadeIn(100)
                .fadeOut(100)

            this.atLocation(this.templateStart)
            super.lineCommon()
                this.file("jb2a.breath_weapons.acid.line.green")
                .atLocation(this.templateStart)
                .spriteScale(2)
                .stretchTo(this.affected)
                .aboveLighting()
                .delay(-4000)
                .filter("ColorMatrix", {hue:50, contrast: 0.7, saturate: -0.2,brightness: 0.4,})
                .playbackRate(1)
                .fadeIn(50)
                .fadeOut(50)
            return this
 
        }

        lineCreate(){
            super.lineCommon()
                .descriptor
                .file("jb2a.impact.water.02.blue.0")
                .atLocation(this.templateStart)
                .scaleToObject(2)
                .delay(2000)
                .fadeIn(100)
                .fadeOut(100)
            super.affectCommon()
                .file("jb2a.impact.water.02.blue.0")
                .atLocation(this.center)
                .scaleToObject(5)
                .delay(2000)
                .fadeIn(100)
                .fadeOut(100)
            return this
        }
        descriptorCone() {
            return this;
        }

        waterImpact()
        {
            super.affectCommon()
                .file("animated-spell-effects-cartoon.water.85")
                .scaleIn(0, 100, {ease: "easeOutCubic"}) 
                .scaleToObject(2.8)
                .filter("ColorMatrix", {hue: 5, brightness: 1, contrast: 0, saturate: -0.8})
                .randomRotation()
                .sound()
                .file("modules/lancer-weapon-fx/soundfx/Axe_Hit.ogg")
                .fadeInAudio(500)
                .fadeOutAudio(500)
                .sound()
                .file("modules/lancer-weapon-fx/soundfx/Axe_swing.ogg")
                .fadeInAudio(500)
                .fadeOutAudio(500)
            super.affectCommon()
                .file("animated-spell-effects-cartoon.water.water splash.01")
                .scaleIn(0, 100, {ease: "easeOutCubic"}) 
                .scaleToObject(2.5)              
                .randomRotation()
                .belowTokens()
            super.affectCommon()
                .file("jb2a.impact.water.02.blue.0")
                .scaleIn(0, 100, {ease: "easeOutCubic"}) 
                .scaleToObject(4)
                .randomRotation()
                .belowTokens()
            return this
        }
        waterPulse()
        {
            super.affectCommon()
                .delay(200)
                .file("jb2a.extras.tmfx.border.circle.outpulse.01.fast")
                .scaleIn(0, 100, {ease: "easeOutCubic"}) 
                .scaleToObject(1.75)
                .opacity(0.5)
                
                .belowTokens()
            super.affectCommon()
                .delay(200)
                .file("jb2a.extras.tmfx.border.circle.outpulse.01.fast")
                .scaleIn(0, 100, {ease: "easeOutCubic"}) 
                .scaleToObject(2.5)
                .opacity(0.5)
                .belowTokens()
            return this
        }
        waterBall(){
             return super.affectCommon()
                .file("animated-spell-effects-cartoon.water.ball")   
                .attachTo(this.affected)
                .playbackRate(1)
                .scaleToObject()
                .scale(1.2)
                .fadeIn(500)
                .fadeOut(500)
                .rotateIn(180, 600, {ease: "easeOutCubic"})
                .scaleIn(0, 600, {ease: "easeOutCubic"})
                .persist()
        }
        descriptorAffliction() { 
            this.waterExplosion()
                .waterImpact()
                .waterBall()
            this.waterPulse()
            super.affectCommon()
            .from(this.affected)
                .fadeIn(200)
                .fadeOut(500)
                .delay(2000)
                .loopProperty("sprite", "position.x", { from: -0.1, to: 0.1, duration: 50, pingPong: true, gridUnits: true})
                .scaleToObject(this.affected.document.texture.scaleX)
                .duration(3000)
                .opacity(0.25)
            return this;
        }
        descriptorAura(){
            return this
        }
        descriptorDamage(){
            this.waterImpact()
            this.from(this.affected)
                .fadeIn(200)
                .fadeOut(500)
                .delay(3000)
                .loopProperty("sprite", "position.x", { from: -0.1, to: 0.1, duration: 50, pingPong: true, gridUnits: true})
                .scaleToObject(this.affected.document.texture.scaleX)
                .duration(3000)
                .opacity(0.25)
            return this.waterPulse()
        }
        descriptorHealing(){ 
            this.waterSwirls()
            this.file("jb2a.impact.water.02.blue.0")
                .scaleToObject(2)
                .delay(1000)
            super.affectCommon()
                .file("jb2a.healing_generic.400px.blue")
                .scaleToObject(2.5)
                .delay(1200)
            return this
        }

        descriptorCreate(){
            return this.waterImpact()
        }
        descriptorAura(){
            return this.file("animated-spell-effects-cartoon.water.create.01")
            .scale(0.4)
            .aboveLighting()
            super.affectCommon()
                .file("jb2a.impact.water.02.blue.0")
                .playbackRate(1)
                .scale(0.8)
                .delay(400)
            .sound()
                .file("modules/dnd5e-animations/assets/sounds/Spells/Elemental/spell-water-jet-1.mp3")
                .delay(10)
        }
        descriptorProtection(){
            return this.affectAura()
                .waterBall()
        }
/*
        descriptorConcealment()
        {
            return this;
        }

        descriptorIllusion(){
            return this
        }
        descriptorInsubstantial(){
            return this
        }

        descriptorMindControl(){
            return this
        }

        descriptorMindControl(){
            return this
        }

        descriptorNullify(){
            return this
        }



        descriptorTransform(){
            return this
        }

        descriptorWeaken(){
            return this
        }*/
    
    }


    
    Sequencer.SectionManager.registerSection("myModule", "mm3eEffect", BaseEffectSection)
    Sequencer.SectionManager.registerSection("myModule", "powerEffect", PowerEffectSection) 
    Sequencer.SectionManager.registerSection("myModule", "noDescriptorEffect", NoDescriptorEffectSection)

    Sequencer.SectionManager.registerSection("myModule", "airEffect",AirEffectSection)
    Sequencer.SectionManager.registerSection("myModule", "colorEffect",ColorEffectSection)
    Sequencer.SectionManager.registerSection("myModule", "cosmicEffect",CosmicEffectSection)
    Sequencer.SectionManager.registerSection("myModule", "curseEffect",CurseEffectSection)
    Sequencer.SectionManager.registerSection("myModule", "darknessEffect",DarknessEffectSection)
    Sequencer.SectionManager.registerSection("myModule", "earthEffect",EarthEffectSection)
    Sequencer.SectionManager.registerSection("myModule", "electricityEffect",ElectricityEffectSection)
    Sequencer.SectionManager.registerSection("myModule", "energyEffect",EnergyEffectSection)
    Sequencer.SectionManager.registerSection("myModule", "entropyEffect",EntropyEffectSection)
    Sequencer.SectionManager.registerSection("myModule", "exoskeletonEffect",ExoskeletonEffectSection)
    Sequencer.SectionManager.registerSection("myModule", "fireEffect",FireEffectSection)
    Sequencer.SectionManager.registerSection("myModule", "gasEffect",GasEffectSection)
    Sequencer.SectionManager.registerSection("myModule", "iceEffect",IceEffectSection)
    Sequencer.SectionManager.registerSection("myModule", "holyEffect",HolyEffectSection)
    Sequencer.SectionManager.registerSection("myModule", "impactEffect",ImpactEffectSection)
    Sequencer.SectionManager.registerSection("myModule", "insectEffect",InsectEffectSection)
    Sequencer.SectionManager.registerSection("myModule", "invincibleEffect",InvincibleEffectSection)
    Sequencer.SectionManager.registerSection("myModule", "kineticEffect",KineticEffectSection)
    Sequencer.SectionManager.registerSection("myModule", "lightEffect",LightEffectSection)
    Sequencer.SectionManager.registerSection("myModule", "lightningEffect",LightningEffectSection)
    Sequencer.SectionManager.registerSection("myModule", "magnetismEffect",MagnetismEffectSection)
    Sequencer.SectionManager.registerSection("myModule", "magicEffect",MagicEffectSection)
    Sequencer.SectionManager.registerSection("myModule", "plantEffect",PlantEffectSection)
    Sequencer.SectionManager.registerSection("myModule", "poisonEffect",PoisonEffectSection)
    Sequencer.SectionManager.registerSection("myModule", "psychicEffect",PsychicEffectSection)
    Sequencer.SectionManager.registerSection("myModule", "radiationEffect",RadiationEffectSection)
    Sequencer.SectionManager.registerSection("myModule", "superSpeedEffect",SuperSpeedEffectSection)
    Sequencer.SectionManager.registerSection("myModule", "superStrengthEffect",SuperStrengthSection)
    Sequencer.SectionManager.registerSection("myModule", "waterEffect",WaterEffectSection)

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

    static async placeSummonedActor({actor}={}){
        let position = await GameHelper.targetWithCrossHair({icon:actor.data.token.img, label:actor.name})
        let summmon
        if(actor){
            summon = await actor.sheet.actor.createEmbeddedDocuments("Token", [{x:position.x, y:position.y}])
        }
        else{ 
            actor = await Actor.create({ name: "Summoned", type: "personnage" });
        }
        const tokenData = actor.getTokenData();
        tokenData.update({
            x: position.x,
            y: position.y,
            vision: true, 
            scale: 1,
            disposition: CONST.TOKEN_DISPOSITIONS.FRIENDLY
        });
        const scene = game.scenes.active;
        await TokenDocument.create(tokenData, { parent: scene });
    }

    static async placeEffectTargeter (){
        let position = await GameHelper.targetWithCrossHair({icon:'modules/mm3e-animations/power-icons/' + power +'.webp', label:power})
        return position;
    }


    static async placeCreationTile({power, animation, tint, width=150, height=150}={}){
        let position = await GameHelper.targetWithCrossHair({icon:'modules/mm3e-animations/power-icons/' + power +'.webp', label:power})
        const swingPointAnimation =Sequencer.Database.getEntry(animation).originalData
        const tileData = {
            img: swingPointAnimation, 
            x: position.x-width/2,  
            y: position.y-height/2,
            width: width,
            height: height,
            flags: {
                tag: this.name 
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
                    saturation: 0, 
                    brightness: 1.5 
                }
        };
        return f;
    }

    static get GreyTransparentFilter(){
        let f = 
        {
                filterType: "ColorMatrix",
                filterId: "GreyTransparentFilter",
                values: {
                    saturation: 0, // Desaturate completely to make it grey
                }
        }
        return f;
    }

    static effects = {
        "darkness":"Darkness",
        "earthEffect": "Earth",
        "electricityEffect": "Electricity",
        "energyEffect": "Energy",
        "entropyEffect": "Entropy",
        "exoskeletonEffect": "Exoskeleton",
        "fireEffect": "Fire",
        "gasEffect": "Gas",
        "holyEffect": "Holy",
        "iceEffect": "Ice",
        "impactEffect": "Impact",
        "insectEffect": "Insect",
        "invincibleEffect": "Invincible",
        "kineticEffect": "Kinetic",
        "lightEffect": "Light",
        "lightningEffect": "Lightning",
        "magnetismEffect": "Magnetism",
        "loveEffect": "Love",
        "magicEffect": "Magic",
        "plantEffect": "Plant",
        "poisonEffect": "Poison",
        "psychicEffect": "Psychic",
        "radiationEffect": "Radiation",
        "noDescriptorEffect": "No Descriptor",
        "superSpeedEffect": "Super Speed",
        "superStrengthEffect": "Super Strength",
        "waterEffect": "Water"
    };

    static SequenceRunnerHelper() {
        

        function getAllMethodsFromClass(classInstance) {
            return Object.getOwnPropertyNames(classInstance.prototype).filter(name =>
                typeof classInstance.prototype[name] === "function"
            );
        }

        function getCastMethodsFromClass(classInstance) {
            const allMethods = getAllMethodsFromClass(classInstance);
            let castMethods = allMethods.filter(method => method.toLowerCase().includes("cast"));
            if (!castMethods.includes("cast")) {
                castMethods.unshift("cast");
            }
            castMethods = castMethods.filter((method, index, self) =>
                self.findIndex(m => m.toLowerCase() === method.toLowerCase()) === index
            );
            const index = castMethods.indexOf("descriptorCast");
            if(index!=-1){
                castMethods.splice(index, 1);
            }


            castMethods= castMethods.map(method => ({
                original: method.replace(/descriptor/i, ""),
                display: method.replace(/descriptor/i, "") 
            }));
            castMethods = castMethods.map(method => ({
                original: method.original.charAt(0).toLowerCase() + method.original.slice(1),
                display: method.display.charAt(0).toLowerCase() + method.display.slice(1)
            }));
            
            return castMethods;
        }
        // Initialize the Affect Types system
        async function initializeAffectTypes(html) {
            const affectTable = document.querySelector("#affect-types-table");
            const addRowButton = document.querySelector("#add-affect-row");
        
            if (!affectTable || !addRowButton) {
                console.error("Affect Types table or add-row button not found.");
                return;
            }
        
            // Fetch the PowerEffect class dynamically
            const powerEffectClass = Sequencer.SectionManager.externalSections["powerEffect"];
            if (!powerEffectClass) {
                console.warn(`PowerEffect class not found in SectionManager.externalSections.`);
                const row = affectTable.querySelector("tbody").insertRow();
                row.innerHTML = `<td colspan="2">PowerEffect class not found</td>`;
                return;
            }
        
            // Retrieve affect methods dynamically
            const affectMethods = getAffectMethodsFromClass(powerEffectClass);
            if (affectMethods.length === 0) {
                const row = affectTable.querySelector("tbody").insertRow();
                row.innerHTML = `<td colspan="2">No affect methods available</td>`;
                return;
            }
        
            // Add event listener for the "Add Selection" button
            addRowButton.addEventListener("click", () => addAffectRow(affectTable, affectMethods, html));
        }
        function addAffectRow(affectTable, affectMethods, html) {
            const tbody = affectTable.querySelector("tbody");
            const row = tbody.insertRow();
        
            // Dropdown for selecting affect method
            const selectCell = row.insertCell();
            const select = document.createElement("select");
            select.name = "affect-method";
            select.style.width = "100%";
            affectMethods.forEach(({ original, display }) => {
                const option = document.createElement("option");
                option.value = original;
                option.textContent = display;
                select.appendChild(option);
            });
            selectCell.appendChild(select);
            select.addEventListener("change", () => {
                generateScript(html);
            });
        
            // Remove button
            const removeCell = row.insertCell();
            const removeButton = document.createElement("button");
            removeButton.textContent = "− Remove";
            removeButton.type = "button";
            removeButton.style.color = "red";
            removeButton.style.marginLeft = "10px";
            removeButton.addEventListener("click", () => {
                row.remove();
                    generateScript(html); // Re-trigger script generation when a row is removed
                });
                removeCell.appendChild(removeButton);
                generateScript(html);
            }
        function getAffectMethodsFromClass(effectClass) {
            // Get all methods from the class prototype
            const methodNames = Object.getOwnPropertyNames(effectClass.prototype)
                .filter((methodName) => 
                    // Only include methods that start with 'affect' and are functions
                    methodName.startsWith("affect") && 
                    typeof effectClass.prototype[methodName] === "function"
                );
        
            // Transform method names into user-friendly labels by stripping "affect"
            return methodNames.map((methodName) => ({
                original: methodName, // Original method name
                display: methodName.replace(/^affect/, "").replace(/([A-Z])/g, " $1").trim() // Strip "affect" and format
            }));
        }
        function getProjectMethodsFromClass(classInstance) {
            const allMethods = getAllMethodsFromClass(classInstance);

            let p = allMethods
                .filter(method => method.toLowerCase().includes("project")) 
                .map(method => {
                    const transformedMethod = method
                        .replace(/descriptor/gi, "")
                        .replace(/Project/g, "project"); 

                    return {
                        original: transformedMethod, 
                        display: transformedMethod 
                    };
                });

            return p;
        }
        function getAreatMethodsFromClass(classInstance) {
            const allMethods = getAllMethodsFromClass(classInstance);

            let p = allMethods
                .filter(method => method.toLowerCase().includes("burst") || method.toLowerCase().includes("cone") || method.toLowerCase().includes("line"))
                .map(method => {
                    const transformedMethod = method
                        .replace(/descriptor/gi, "")
                        .replace(/Burst/g, "burst")
                        .replace(/Line/g, "line")
                        .replace(/Cone/g, "cone")
                    
                    return {
                        original: transformedMethod, 
                        display: transformedMethod 
                    };
                });
            //remove all project methods
            p = p.filter(method => !method.original.toLowerCase().includes("project"));
            p =p.filter(method => !method.original.toLowerCase().includes("get"))
            return p;
        }

        

        async function updateMethods(effectKey, html) {
            const castMethodsContainer = document.querySelector("#cast-methods");
            const areaMethodsContainer = document.querySelector("#area-methods");
            const projectMethodsContainer = document.querySelector("#project-methods");
            castMethodsContainer.innerHTML = "Choose a sequencer effect that animates on the caster's token"; 
            areaMethodsContainer.innerHTML="Choose a sequencer effect that animates on a template";
            projectMethodsContainer.innerHTML = "Choose a sequencer effect that animates from the caster's otken to a template or targeted Token"; 
            

            const effectClass = Sequencer.SectionManager.externalSections[effectKey];
            if (!effectClass) {
                console.warn(`Effect class "${effectKey}" not found in SectionManager.externalSections.`);
                castMethodsContainer.innerHTML = `<p>No class found for the selected effect.</p>`;
                projectMethodsContainer.innerHTML = `<p>No class found for the selected effect.</p>`;
                return;
            }

            const castMethods = getCastMethodsFromClass(effectClass);
            if (castMethods.length > 0) {
                castMethods.forEach(({ original, display }) => {
                    castMethodsContainer.innerHTML += `
                        <div>
                            <input type="radio" id="cast-${original}" name="castMethod" value="${original}">
                            <label for="cast-${original}">${display}</label>
                        </div>
                    `;
                });
                
                html.find("input[type='radio'][name='castMethod']").on("change", async () => await generateScript(html));
            
            } else {
                castMethodsContainer.innerHTML = `
                    <p>No methods containing "cast" found for this effect.</p>
                `;
            }

            const areaMethods = getAreatMethodsFromClass(effectClass);
            if (areaMethods.length > 0) {
                areaMethods.forEach(({ original, display }) => {
                    areaMethodsContainer.innerHTML += `
                        <div>
                            <input type="radio" id="area-${original}" name="areaMethod" value="${original}">
                            <label for="area-${original}">${display}</label>
                        </div>
                    `;
                });
               
                 areaMethodsContainer.innerHTML += `
                    <div>
                        <input type="radio" id="area-none" name="areaMethod" value="none" checked>
                        <label for="area-none">None</label>
                    </div>
                `;
                 html.find("input[type='radio'][name='areaMethod']").on("change", async () => await generateScript(html));

            } else {
                castMethodsContainer.innerHTML = `
                    <p>No methods containing "area" found for this effect.</p>
                `;
            }
            
            const projectMethods = getProjectMethodsFromClass(effectClass);
            if (projectMethods.length > 0) {
                projectMethods.forEach(({ original, display }) => {
                    projectMethodsContainer.innerHTML += `
                        <div>
                            <input type="radio" id="project-${original}" name="projectMethod" value="${original}">
                            <label for="project-${original}">${display}</label>
                        </div>
                    `;
                });
        
                projectMethodsContainer.innerHTML += `
                    <div>
                        <input type="radio" id="project-none" name="projectMethod" value="none" checked>
                        <label for="project-none">None</label>
                    </div>
                `;
                html.find("input[type='radio'][name='projectMethod']").on("change", async () => await generateScript(html));
            } else {
                projectMethodsContainer.innerHTML = `
                    <p>No methods containing "project" found for this effect.</p>
                `;
            }
        }

        async function generateScript(html) {
            const effect = html.find('[name="effect"]').val();
            const castMethod = html.find('[name="castMethod"]:checked').val();
            let projectMethod="";
            html.find('[name="projectMethod"]').each((index, element) => {
            if ($(element).is(':checked')) {
                projectMethod = $(element).val();
            }}); 
                    
            const areaMethod = html.find('[name="areaMethod"]:checked').val();
            const affectedType = html.find('[name="affectedType"]:checked').val();
            const affectTypes = [];
            const effectRows = html.find("#affect-types-table tbody tr");
            effectRows.each((index, row) => {
                const affectType = $(row).find('select[name="affect-method"]').val();
                if (affectType) affectTypes.push(affectType); // Collect valid affect methods
            });

            const range = projectMethod && projectMethod !== "none" 
                ? "Range" 
                : affectedType === "selected" 
                    ? "Personal" 
                    : "Melee";

            const area = areaMethod && areaMethod !== "none"
                ? ["Cone", "Line", "Burst"].find(keyword => areaMethod.toLowerCase().includes(keyword.toLowerCase())) || ""
                : "";

            const effects = affectTypes.length > 0 
                ? affectTypes.map(effect => effect.replace(/^affect/, "")).join("_") 
                : "None";

            const macroName = `${GameHelper.effects[effect]}-${range}${area ? `-${area}` : ""}-${effects}`;
            html.find("#macro-name").val(macroName);

            
            let script = `
const selectedTargets = Array.from(game.user.targets);
const selected = GameHelper.selected;
`;

            if ((areaMethod === "none" || areaMethod === undefined)  && affectedType === "target") {
                script += `
for (let target of selectedTargets) {
    new Sequence()
        .${effect}()
        .${castMethod?castMethod:"cast"}({affected: target})`
                script += projectMethod !== "none" && projectMethod !=="" ? 
`       
        .${projectMethod}()` : "";
            affectTypes.forEach((affectType) => {
                script += 
`       
        .${affectType}({affected: target})
`;
            });
            script +=
`
        .play(); 
    }
    `;
            } else {
                script += `
let template = GameHelper.template
let target = Array.from(game.user.targets)[0];
new Sequence()
    .${effect}()
    .${castMethod?castMethod:"cast"}({affected: template})`
               script += projectMethod !== "none" && projectMethod !=="" ? 
`   
    .${projectMethod}()
` : "";
            script += 
`   
    .${areaMethod !== "none" ?`${areaMethod}()` : ""}
    .play()

await new Promise(resolve => setTimeout(resolve, 2000));
for (let target of selectedTargets) {
    new Sequence()
    .${effect}()`
         affectTypes.forEach((affectType) => {
                script += 
`
    .${affectType}({affected: target})
`;
            });
        script += 
`   .play();
}
    `;
    }

        // Update the script in the output area
        const outputArea = html.find("#script-output");
        outputArea.val(script);
        try{
            const asyncWrapper = new Function(`return (async () => { ${script} })();`);
            await asyncWrapper();
        }
        catch (error) {
            outputArea.val(outputArea.val() + `\n\n---------------------------Error executing script---------------------------:
            ${error.message}
            ${error.stack}`);
            console.error("Script Execution Error:", error);
        }
        }

        let dialogContent = `
        <form>
        <div>
            <label for="effect">Select Effect:</label>
            <select id="effect" name="effect">
                <option value="" disabled selected>Choose an effect</option>
                ${Object.keys(GameHelper.effects).map(effect => `<option value="${effect}">${Object(GameHelper.effects)[effect]}</option>`).join("")}
            </select>
        </div>
        <fieldset>
            <legend>Cast Methods</legend>
            <div id="cast-methods" style="border: 1px solid #ccc; padding: 10px; margin: 10px;">
                <p>Select an effect to see available methods containing "cast"</p>
            </div>
        </fieldset>
        <fieldset>
            <legend>Project Methods</legend>
            <div id="project-methods" style="border: 1px solid #ccc; padding: 10px; margin: 10px;">
                <p>Select an effect to see available methods containing "project"</p>
            </div>
        </fieldset>
        <fieldset style="border: 1px solid #ccc; padding: 10px; margin: 10px;">
            <legend>Area Methods</legend>
            <div id="area-methods" style="border: 1px solid #ccc; padding: 10px; margin: 10px;">
                <p>Select an effect to see available methods containing "project"</p>
            </div>
        </fieldset>
        <fieldset style="border: 1px solid #ccc; padding: 10px; margin: 10px;">
            <legend>Choose who the affected target will be, the selected ( caster) or targeted token Affected</legend>
            <div>
                <input type="radio" id="affected-target" name="affectedType" value="target" checked>
                <label for="affected-target">Target</label>
            </div>
            <div>
                <input type="radio" id="affected-selected" name="affectedType" value="selected">
                <label for="affected-selected">Selected</label>
            </div>
        </fieldset>
         <fieldset style="border: 1px solid #ccc; padding: 10px; margin: 10px;">
             <legend>Power Effects</legend>
            <div id="affect-types-container">
                
                <table id="affect-types-table" style="width: 100%; border-collapse: collapse;">
                    <tbody>
                        <!-- Rows will be dynamically added here -->
                    </tbody>
                </table>
                <button id="add-affect-row" type="button" style="margin-top: 10px;">+ Add Selection</button>
            </div>
        </fieldset>
        <fieldset style="border: 1px solid #ccc; padding: 10px; margin: 10px;">
            <legend>Output</legend>
            <input id="macro-name" type="text" style="width: 100%; margin-bottom: 10px;">
            <textarea id="script-output" style="width: 100%; height: 300px;"></textarea>
            <button id="run-macro" type="button" style="margin-top: 10px;">Run Macro</button>
        </fieldset>
    </form>
        `;

        new Dialog({
            title: "Select Effect, Cast, and Project Methods",
            content: dialogContent,
            buttons: {
                save: {
                    label: "Save",
                    callback: async (html) => {
                      
                        const outputArea = html.find("#script-output").val(); // Get the generated script
                        const effect = html.find('[name="effect"]').val(); // Descriptor
                        const projectMethod = html.find('[name="projectMethod"]:checked').val(); // Check if there's a project method
                        const areaMethod = html.find('[name="areaMethod"]:checked').val(); // Area type (Burst, Line, Cone, or None)
                        const affectedType = html.find('[name="affectedType"]:checked').val(); // Affected type (target or selected)
                        const affectTypes = [];
                        const effectRows = html.find("#affect-types-table tbody tr");

                        // Collect selected affect types
                        effectRows.each((index, row) => {
                            const affectType = $(row).find('select[name="affect-method"]').val();
                            if (affectType) affectTypes.push(affectType);
                        });

                        // Determine naming components
                        const range = projectMethod && projectMethod !== "none" 
                            ? "Range" 
                            : affectedType === "selected" 
                                ? "Personal" 
                                : "Melee";
                       const area = areaMethod && areaMethod !== "none"
                           ? ["Cone", "Line", "Burst"].find(keyword => areaMethod.toLowerCase().includes(keyword.toLowerCase())) || ""
                           : "";
                         
                        const effects = affectTypes.length > 0 
                            ? affectTypes.map(effect => effect.replace(/^affect/, "")).join("_") 
                            : "None";

                        // Construct macro name
                        const macroName = `${GameHelper.effects[effect]}-${range}${area ? `-${area}` : ""}-${effects}`;

                        // Save the macro
                        try {
                            let macro = game.macros.find(m => m.name === macroName);
                            if (!macro) {
                                macro = await Macro.create({
                                    name: macroName,
                                    type: "script",
                                    scope: "global",
                                    command: outputArea,
                                });
                                ui.notifications.info(`Macro "${macroName}" has been created.`);
                            } else {
                                // Update the existing macro
                                await macro.update({ command: outputArea });
                                ui.notifications.info(`Macro "${macroName}" has been updated.`);
                            }
                        } catch (error) {
                            ui.notifications.error(`Error saving macro: ${error.message}`);
                            console.error("Macro Save Error:", error);
                        }

                        return false;
                    }
                },
                cancel: {
                    label: "Cancel"
                }
            }
            ,
            render: (html) => { 
                // Attach onchange listeners to update the script dynamically
                html.find("#effect").on("change", async (event) => {
                    const effectKey = event.target.value;
                    await updateMethods(effectKey,html);
                    await initializeAffectTypes(html);
                    await generateScript(html);
                });
                html.find("#run-macro").on("click", async () => {
                    const script = html.find("#script-output").val(); // Use the modified script
                    try {
                        const asyncWrapper = new Function(`return (async () => { ${script} })();`);
                        await asyncWrapper();
                    } catch (error) {
                        console.error("Error executing macro:", error);
                        ui.notifications.error(`Error running macro: ${error.message}`);
                    }
                });
                const canvasWidth = canvas.screenDimensions[0]; // Get canvas width
                const dialogWidth = 800; // Match the width defined for the dialog
                const dialogHeight = 600; // Match the height defined for the dialog
                html.closest(".dialog").css({
                    position: "absolute",
                    left: `${canvasWidth - dialogWidth - 10}px`, // Position 10px from the right edge
                    top: `10px`, // Position 10px from the top
                    width: `${dialogWidth}px`,
                    height: `${dialogHeight}px`
                });
                html.find("input[type='radio'], select").on("change", async() => await generateScript(html));
            }}, {
                    width: 800,
                    height: 1200, 
                    resizable: true
        }).render(true);
    }
}
