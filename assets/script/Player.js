
cc.Class({
    extends: cc.Component,

    properties: {
        sprite:{default:null,type:cc.Node},
        rotateAnchor:{default:null,type:cc.Node},
        addScoreLabel:{default:null,type:cc.Label},

        jumpDistance:0,
        maxJumpDistance:0,
        power:0,
        initSpeed:0,
        speed:0,
        maxSpeed:0,
        isReadJump:false,
        isSubDistance:false,
        direction:1,
        readyJumpClip:{default:null,url:cc.AudioClip},
        jumpAudio:{default:null,url:cc.AudioClip},
        readyLoopClip:{default:null,url:cc.AudioClip},
    },

    // LIFE-CYCLE CALLBACKS:

    onLoad () {
        this.readyJumpAudioId = -1;
        this.jumpAudioId = -1;
        this.readyLoopAudioId = -1;
    },

    // start () {},

    update (dt) {
        //小人蓄力时，增加的是水平方向的距离
        if(this.isReadJump){
            if(this.isSubDistance){
                // this.speed -= dt*this.power;
                // if(this.speed<=0){
                //     this.speed = 0;
                // }else{
                //     this.jumpDistance -= this.speed*dt;
                //     if(this.jumpDistance <= 0){
                //         this.jumpDistance = 0;
                //     }
                // }
                this.jumpDistance -= dt*this.maxJumpDistance/1.5;
                if(this.jumpDistance <= 0){
                    this.jumpDistance = 0;
                }
                // this.sprite.scaleY += dt*0.5/2;
                // if(this.sprite.scaleY >= 1.0){
                //     this.sprite.scaleY = 1.0;
                //     console.log('距离：'+this.jumpDistance);
                // }else{
                //     // cc.audioEngine.stop(this.readyJumpAudioId);
                //     // cc.audioEngine.stop(this.readyLoopAudioId);
                //     this.readyJumpAudioId = cc.audioEngine.play(this.readyJumpClip,false,1);
                // }
            }else{
                // this.speed += dt*this.power;
                // if(this.speed >= this.maxSpeed){
                //     this.speed = this.maxSpeed;
                // }else{
                //     this.jumpDistance += this.speed*dt;
                //     if(this.jumpDistance >= this.maxJumpDistance){
                //         this.jumpDistance = this.maxJumpDistance;
                //     }
                // }
                this.jumpDistance += dt*this.maxJumpDistance/1.5;
                if(this.jumpDistance >= this.maxJumpDistance){
                    this.jumpDistance = this.maxJumpDistance;
                }
                // cc.audioEngine.stop(this.readyJumpAudioId);
                // cc.audioEngine.stop(this.readyLoopAudioId);
                // this.sprite.scaleY -= dt*0.5/2;
                // if(this.sprite.scaleY <=0.5){
                //     this.sprite.scaleY = 0.5;
                //     this.readyLoopAudioId = cc.audioEngine.play(this.readyLoopClip,true,1);
                // }else{
                //     this.readyJumpAudioId = cc.audioEngine.play(this.readyJumpClip,false,1);
                // }
            }
        }
    },

    /**
     * 小人跳到block上，+1的动效
     */
    playAddScore:function(score){
        this.addScoreLabel.string = '+'+score;
        this.addScoreLabel.node.active = true;
        this.addScoreLabel.node.position = cc.p(0,this.node.height/2);
        let pos = cc.p(0,this.node.height*3/2);
        let action = cc.moveTo(0.5,pos);
        let finished = cc.callFunc(()=>{
            this.addScoreLabel.node.active = false;
        });
        this.addScoreLabel.node.runAction(cc.sequence(action,finished));
    },

    /**
     * 小人蓄力压缩动效
     */
    readyJump:function(){
        let self = this;
        this.readyJumpAudioId = cc.audioEngine.play(this.readyJumpClip,false,1);
        this.originalY = this.sprite.y;
        let scaleAction = cc.scaleTo(1.5,1.1,0.5);
        let moveAction = cc.moveTo(1.5,this.sprite.x,this.sprite.y-60);
        let finished = cc.callFunc(function(){
            self.readyLoopAudioId = cc.audioEngine.play(self.readyLoopClip,true,1);
        },this);
        let spawnAciton = cc.spawn(moveAction,scaleAction);
        this.sprite.runAction(cc.sequence(spawnAciton,finished));
        this.speed = this.initSpeed;
        this.isReadJump = true;
    },

    /**
     * 小人跳到对应位置
     * @param {x} worldPos 应该跳到位置的世界坐标
     * @param {*} cb 调完之后的回调
     * @param {*} cbTarget 回调的调用者
     */
    jumpTo(worldPos,cb,cbTarget){
        cc.audioEngine.stop(this.readyJumpAudioId);
        cc.audioEngine.stop(this.readyLoopAudioId);
        this.jumpAudioId = cc.audioEngine.play(this.jumpAudio,false,1);
        this.sprite.stopAllActions();
        let targetPos = this.node.parent.convertToNodeSpaceAR(worldPos);
        this.node.color = cc.Color.WHITE;
        this.isReadJump = false;
        let resetAction = cc.scaleTo(0.2,1,1);
        let jumpAction = cc.jumpTo(0.35,targetPos,200,1);
        let rotateAction = cc.rotateBy(0.35,this.direction*360);
        let finished = cc.callFunc(()=>{
            // this.direction = Math.random()>0.5?1:-1;
            this.isSubDistance = false;
            this.speed = 0;
            this.jumpDistance = 0;
            cb();
        },cbTarget);
        let moveAction = cc.moveTo(0.2,this.sprite.x,this.originalY);
        this.sprite.runAction(cc.spawn(moveAction,resetAction));
        this.rotateAnchor.runAction(rotateAction);
        this.node.runAction(cc.sequence(jumpAction,finished))
    },
});
