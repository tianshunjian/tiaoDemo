
const Player = require('Player');
const Block = require('Block');
const OverPanle = require('OverPanel');

cc.Class({
    extends: cc.Component,

    properties: {
        scoreLabel:cc.Label,
        overPanel:OverPanle,

        player:Player,
        cameraNode:cc.Node,

        leftOrigin:cc.Vec2,
        rightOrigin:cc.Vec2,

        bg1:cc.Node,
        bg2:cc.Node,

        blockPrefab:{default:null,type:cc.Prefab},

        successClip:{default:null,url:cc.AudioClip},
        failClip:{default:null,url:cc.AudioClip},
    },

    update :function(dt) {
        /// 由于给小人加了刚体组件，受重力影响，线速度和位置会随着时间改变，
        /// 因此，在update里用fallingDown判断小人是否在摔倒，
        /// 如果在摔倒，则当y方向的偏移大于this.offset时，就停止其摔倒状态
        /// 如果不在摔倒，就需要每帧设置其线速度为0，位置设为其稳定位置
        if(this.fallingDown){
            // console.log('小人的position：'+JSON.stringify(this.player.node.position));
            if(this.playerStablePos.y>=this.player.node.position.y+this.offset){
                this.fallingDown = false;
                this.playerBody.linearVelocity = cc.v2(0,0);
                this.playerBody.angularVelocity = 0;
                this.playerStablePos = cc.p(this.player.node.position.x,this.player.node.position.y);
                this.overPanel.show(this.score,this.onRestart,this.onBack,this);
            }
        }else{
            this.playerBody.linearVelocity = cc.v2(0,0);
            if(!this.player.playerIsAnimated){
                //如果小人没有进行动效，则将小人的位置设为它的稳定位置
                this.player.node.position = this.playerStablePos;
            }
        }
       // this.checkBgReset();
    },

    // LIFE-CYCLE CALLBACKS:
    onLoad () {
        /// 可视的最大宽度，可视范围：-this.maxWidth ~ this.maxWidth
        let canvas = cc.find('Canvas');
        this.maxWidth = canvas.width;
        this.maxHeight = canvas.height;
        console.log('最大宽度：'+this.maxWidth);

        this.originPos = this.node.position;
        /// block的tag，用于删除block时用
        this.blockStartTag = 1000;
        this.blockEndTag = this.blockStartTag;
        this.reset();
        //初始情况下，设定背景图片的大小
        this.bg1.width = this.maxWidth * 2;
        this.bg1.height = this.bg1.width * 17 / 15.0;
        this.bg2.width = this.bg1.width;
        this.bg2.height = this.bg1.height;
        this.bg2.y = this.bg1.y+this.bg1.height;
        console.log("onload中bg1的宽度"+this.bg1.width);
        console.log("onload中bg1的高度"+this.bg1.height);
        console.log("onload中bg2的宽度"+this.bg2.width);

        if(cc.sys.platform === cc.sys.WECHAT_GAME){
            wx.showShareMenu({
                success:(res)=>{
                    console.log('成功');
                    console.log(res);
                },
                fail:(res)=>{
                    console.log('失败');
                    console.log(res);
                }
            });
        }
    },

    /**
     * 初始场景
     * reset 小人、相机、最初的两个block、以及得分
     */
    reset:function(){
        this.isFirstAdd = true;
        this.node.position = this.originPos;
        this.cameraNode.position = this.originPos;
        this.score = 0;
        this.scoreLabel.string = this.score;

        ///背景底部紧贴屏幕
        const y = (this.bg1.height - this.maxHeight)/2.0;

        this.bg1.setPosition(0,y);//重新开始后背景图片坐标重置,大小重置
        // this.bg1.width = this.maxWidth * 2;
        // this.bg1.height = this.maxHeight + 300;

        this.bg2.setPosition(0,y + this.bg1.height);
        // this.bg2.width = this.maxWidth * 2;
        // this.bg2.height = this.maxHeight + 300;

        this.originalZIndex = 999999;

        for(let i=this.blockStartTag;i<this.blockEndTag;++i){
            this.node.removeChildByTag(i);
        }
        /// block的tag，用于删除block时用
        this.blockStartTag = 1000;
        this.blockEndTag = this.blockStartTag;

        //添加第一个方块
        let blockNode = cc.instantiate(this.blockPrefab);
        blockNode.zIndex = this.originalZIndex;
        blockNode.tag = this.blockEndTag;
        this.blockEndTag += 1;
        this.originalZIndex -= 1;
        let block = blockNode.getComponent(Block);
        this.node.addChild(blockNode);

        //第一个方块的位置是固定的，在左下位置：leftOrigin
        blockNode.position = this.node.convertToNodeSpaceAR(this.leftOrigin);
        this.curBlock = block;
        this.nextBlock = block;

        //小人初始位置，在第一个block上平面的中心点
        let curPosition = this.curBlock.getCenterPosition();
        this.player.node.position = this.node.convertToNodeSpaceAR(this.curBlock.getCenterPosition());

        //初始化direction为1，即nextBlock在curBlock的右边
        this.player.direction = 1;
        //恢复小人的缩放、旋转、层级
        this.player.node.scale = 1;
        this.player.node.rotation = 0;
        this.player.node.zIndex = this.curBlock.node.zIndex+1;

        // curPosition = this.curBlock.getPMidForRightTopWorldPos();
        // curPosition = cc.p(curPosition.x,curPosition.y+10);
        // curPosition = cc.p(curPosition.x+20,curPosition.y-30);
        // this.player.node.position = this.node.convertToNodeSpaceAR(curPosition);
        // this.player.node.rotation = 60;
        // this.player.node.scale = 0.7;
        // this.player.node.zIndex = this.blockLayer.zIndex - 1;

        //记录camera和player之间y的差距，并在后续移动camera时，保持它俩之间y的差距不变
        this.deltaYBetweenPlayerCamera = this.cameraNode.position.y-this.player.node.position.y;

        //随机出nextBlock与curBlock之间的水平距离
        let distance = block.minDistance+Math.random()*(block.maxDistance-block.minDistance);
        this.cameraNode.position.x = this.curBlock.node.position.x+distance/2;
        //添加第二个方块
        this.addBlock(distance);

        // curPosition = this.nextBlock.getPMidForLeftTopWorldPos();
        // curPosition = cc.p(curPosition.x,curPosition.y-15);
        // curPosition = cc.p(curPosition.x-5,curPosition.y-10);
        // this.player.node.position = this.node.convertToNodeSpaceAR(curPosition);
        // this.player.node.rotation = -50;
        // this.player.node.scale = 0.7;
        // this.player.node.zIndex = this.blockLayer.zIndex - 1;

        //小人下落的动效
        this.player.playerIsAnimated = true;
        let finalPos = this.player.node.position;
        this.player.node.position = cc.p(finalPos.x,finalPos.y+250);
        let midPos = cc.p(finalPos.x,finalPos.y+50);
        let action1 = cc.moveTo(0.2,finalPos);
        let action2 = cc.moveTo(0.1,midPos).easing(cc.easeInOut(3));
        let action3 = cc.moveTo(0.1,finalPos).easing(cc.easeInOut(3));
        let finished = cc.callFunc(()=>{
            this.enableTouch();
            this.playerStablePos = this.player.node.position;
            this.player.playerIsAnimated = false;
        });
        this.player.node.runAction(cc.sequence(action1,action2,action3,finished));

        //启用物理引擎
        cc.director.getPhysicsManager().enabled = true;
        this.playerStablePos = this.player.node.position;
        this.playerBody = this.player.node.getComponent(cc.RigidBody);
        this.playerBody.gravityScale = 1;

    },

    /**
     * 添加下一个block
     * distance：nextBlock与curBlock之间的水平距离
     */
    addBlock:function(distance){
        let blockNode = cc.instantiate(this.blockPrefab);
        blockNode.zIndex = this.originalZIndex;
        blockNode.tag = this.blockEndTag;
        this.blockEndTag += 1;
        this.originalZIndex -= 1;
        let block = blockNode.getComponent(Block);
        this.node.addChild(blockNode);

        if (this.blockEndTag > this.blockStartTag+10){
            this.node.removeChildByTag(this.blockStartTag);
            this.blockStartTag++;
        }

        let scale = block.minScale+Math.random()*(block.maxScale-block.minScale);
        // let distance = block.minDistance+Math.random()*(block.maxDistance-block.minDistance);
        blockNode.scale = scale;
        if(this.player.direction>0){
            this.arrayRatio = block.getPMidKBForRight().k;
            blockNode.x = this.curBlock.node.x + distance;
            blockNode.y = this.curBlock.node.y + distance*this.arrayRatio;
        }else{
            this.arrayRatio = Math.abs(block.getPMidKBForLeft().k) ;
            blockNode.x = this.curBlock.node.x - distance;
            blockNode.y = this.curBlock.node.y+distance*this.arrayRatio;
        }
        this.curBlock = this.nextBlock;
        this.nextBlock = block;

        //从第二次添加开始，增加盒子下落的动效
        if(this.isFirstAdd){
            this.isFirstAdd = false;
            // this.enableTouch();
        }else{
            //盒子下落
            let finalPos = this.nextBlock.node.position;
            this.nextBlock.node.position = cc.p(finalPos.x,finalPos.y+300);
            let midPos = cc.p(finalPos.x,finalPos.y+50);
            let action1 = cc.moveTo(0.2,finalPos);
            let action2 = cc.moveTo(0.1,midPos).easing(cc.easeInOut(3));
            let action3 = cc.moveTo(0.1,finalPos).easing(cc.easeInOut(3));
            let finished = cc.callFunc(()=>{
                this.enableTouch();
            });
            this.nextBlock.node.runAction(cc.sequence(action1,action2,action3,finished));
        }
    },

    //手势监听
    enableTouch:function(){
        cc.find('Canvas').on(cc.Node.EventType.TOUCH_START,this.onReadyJump,this);
        cc.find('Canvas').on(cc.Node.EventType.TOUCH_MOVE,this.onTouchMove,this);
        cc.find('Canvas').on(cc.Node.EventType.TOUCH_END, this.onJump, this);
    },

    //取消手势监听
    disableTouch:function(){
        cc.find('Canvas').off(cc.Node.EventType.TOUCH_START,this.onReadyJump,this);
        cc.find('Canvas').off(cc.Node.EventType.TOUCH_MOVE,this.onTouchMove,this);
        cc.find('Canvas').off(cc.Node.EventType.TOUCH_END, this.onJump, this);
    },

    //开始触摸
    onReadyJump:function(event){
        this.preY = event.getLocationY();
        //开始蓄力，小人和block做相应的动效
        this.player.readyJump();
        this.curBlock.playerReadyJump();
        this.nextBlock.whiteNode.active = true;
    },

    //手指移动
    onTouchMove:function(event){
        // let curY = event.getLocationY();
        // if(curY <= this.preY){
        //     //蓄力
        //     this.player.isSubDistance = false;
        //     this.curBlock.isSubDistance = false;
        // }else{
        //     //减力
        //     this.player.isSubDistance = true;
        //     this.curBlock.isSubDistance = true;
        // }
        // this.preY = curY;
    },

    //触摸结束
    onJump:function(){

        this.disableTouch();
        this.player.isReadJump = false;
        //小人水平方向应该跳的距离
        let jumpDistance = this.player.jumpDistance;
        if(window.shJSBridge){
            window.shJSBridge.invokeNative('showMsg',{'text':'jumpDistance:' + jumpDistance});
        }
        let dir = this.player.direction;//跳的方向
        // 下一盒子上平面中线的k和b，用来计算y方向的增量用
        let rightKB = this.nextBlock.getPMidKBForRight();
        let leftKB = this.nextBlock.getPMidKBForLeft();
        this.arrayRatio = dir>0 ? rightKB.k : Math.abs(leftKB.k);
        //计算小人目标点，并转为世界坐标
        let targetPos = cc.p(this.player.node.x+jumpDistance*dir,this.player.node.y+jumpDistance*this.arrayRatio);
        let targetWorldPos = this.player.node.parent.convertToWorldSpaceAR(targetPos);
        //block执行小人跳走的动效
        this.curBlock.playerJumpTo();
        this.nextBlock.whiteNode.active = false;

        //将目标点转换到盒子上平面对应方向中线上的点
        let formatTargetWorldPos = this.formatTargetPosition(targetWorldPos);
        //跳到目标点
        this.jumpToTarget(formatTargetWorldPos);
    },

    //跳到目标点
    jumpToTarget:function(targetPos){
        ///TEST
        // targetPos = this.nextBlock.getCenterPosition();

        let dir = this.player.direction;
        let kb0,kb1,kb2;
        let mkb;
        if(dir>0){
            kb0 = this.curBlock.getKBForRightTop();
            kb1 = this.nextBlock.getKBForLeftDown();
            kb2 = this.nextBlock.getKBForRightTop();

            mkb = this.curBlock.getPMidKBForRight();
        }else{
            kb0 = this.curBlock.getKBForTopLeft();
            kb1 = this.nextBlock.getKBForDownRight();
            kb2 = this.nextBlock.getKBForTopLeft();

            mkb = this.curBlock.getPMidKBForLeft();
        }
        let tan = Math.abs(mkb.k);
        let angle = Math.atan(tan)*180/Math.PI;//角度值,0~90之间
        //失败时传入的参数
        let fallDownOptions = {
            isNeedFall:false, //是否需要倒下
            // rotation:0, //角度
            // scale:1, //缩放比例
            // moveToPos: cc.Vec2, //摔倒后移动到的位置
            finalLocation:0, //失败时，小人相对位置，0 在盒子之间，1 在next盒子之外

            linearVelocity:cc.v2(),//线速度
            angularVelocity:0,//角速度
            offset:0,//y方向下落距离
        };

        // 根据目标点和对应方向上的三条线的距离，判断小人跳到了哪里
        let offset1 = dir>0 ? 15 : 20;
        let offset2 = 13;
        let offset3 =dir>0 ? 40 : 50;
        let offset4 = 20;
        let offset5 = dir>0 ? 15 : 15;
        let offset6 = dir>0 ? 15 : 10;
        let y0 = kb0.k*targetPos.x+kb0.b;
        let y1 = kb1.k*targetPos.x+kb1.b;
        let y2 = kb2.k*targetPos.x+kb2.b;
        if(targetPos.y <= y0-offset1){
            //成功，落在当前盒子上
            console.log('成功，current');
            this.jumpToCurBlockSuccess(targetPos);
        }else if(targetPos.y <= y0+offset2){
            //失败，落在当前盒子边缘，需要倒下
            console.log('失败，current 边缘');
            // let curPosition;
            // if(dir>0){
            //     curPosition = this.curBlock.getPMidForRightTopWorldPos();
            //     curPosition = cc.p(curPosition.x+20,curPosition.y-20);
            // }else{
            //     curPosition = this.curBlock.getPMidForLeftTopWorldPos();
            //     curPosition = cc.p(curPosition.x,curPosition.y-17);
            // }
            // // fallDownOptions.rotation = dir>0 ? 60 : -40;
            // fallDownOptions.rotation = dir>0 ? (90-angle) : -(90-angle);
            // fallDownOptions.scale = 0.9;
            // fallDownOptions.moveToPos = cc.p(curPosition.x,curPosition.y);
            fallDownOptions.finalLocation = 0;
            fallDownOptions.isNeedFall = true;

            fallDownOptions.linearVelocity = dir>0 ? cc.v2(30,0) : cc.v2(-20,0);
            fallDownOptions.angularVelocity = dir>0 ? 60 : -60;
            fallDownOptions.offset = 100;
            this.jumpFail(targetPos,fallDownOptions);
        }else if(targetPos.y < y1-offset3){
            //失败，落在盒子之间
            console.log('失败，between');
            fallDownOptions.finalLocation = 0;
            this.jumpFail(targetPos,fallDownOptions);
        }else if(targetPos.y < y1-offset4){
            //失败，落在下一个盒子与当前盒子之间的边缘，需要倒下
            console.log('失败，next 近边');
            // let curPosition;
            // if(dir>0){
            //     curPosition = this.nextBlock.getPMidForLeftDownWorldPos();
            //     curPosition = cc.p(curPosition.x-10,curPosition.y-45);
            // }else{
            //     curPosition = this.nextBlock.getPMidForRightDownWorldPos();
            //     curPosition = cc.p(curPosition.x,curPosition.y-50);
            // }
            // // fallDownOptions.rotation = dir>0 ? -110 : 110;
            // fallDownOptions.rotation = dir>0 ? -(90+angle) : (90+angle);
            // fallDownOptions.scale = 0.9;
            // fallDownOptions.moveToPos = cc.p(curPosition.x,curPosition.y);
            fallDownOptions.finalLocation = 0;
            fallDownOptions.isNeedFall = true;

            fallDownOptions.linearVelocity = dir>0 ? cc.v2(-5,0) : cc.v2(5,0);
            fallDownOptions.angularVelocity = dir>0 ? -150 : 150;
            fallDownOptions.offset = 80;
            this.jumpFail(targetPos,fallDownOptions);
        }else if(targetPos.y <= y2-offset5){
            //成功，落在下一个盒子上
            console.log('成功，next');
            this.jumpToNextBlockSuccess(targetPos);
        }else if(targetPos.y < y2+offset6){
            //失败，落在下一个盒子远离当前盒子的边缘,需倒下
            console.log('失败，next 远边');
            // let curPosition;
            // if(dir>0){
            //     curPosition = this.nextBlock.getPMidForRightTopWorldPos();
            //     curPosition = cc.p(curPosition.x+35,curPosition.y-35);
            // }else{
            //     curPosition = this.nextBlock.getPMidForLeftTopWorldPos();
            //     curPosition = cc.p(curPosition.x-5,curPosition.y-25);
            // }
            // // fallDownOptions.rotation = dir>0 ? 45 : -50;
            // fallDownOptions.rotation = dir>0 ? (90-angle) : -(90-angle);
            // fallDownOptions.scale = 0.9;
            // fallDownOptions.moveToPos = cc.p(curPosition.x,curPosition.y);
            fallDownOptions.finalLocation = 1;
            fallDownOptions.isNeedFall = true;

            fallDownOptions.linearVelocity = dir>0 ? cc.v2(20,0) : cc.v2(-30,0);
            fallDownOptions.angularVelocity = dir>0 ? 70 : -60;
            fallDownOptions.offset = 100;
            this.jumpFail(targetPos,fallDownOptions);
        }else{
            //失败，落在下一个盒子之外
            console.log('out');
            fallDownOptions.finalLocation = 1;
            this.jumpFail(targetPos,fallDownOptions);
        }
    },

    //背景移动
    bgPut1:function () {
        //背景图片1放置位置及大小设定
        // var bgx = this.bg2.position.x;
        var bgy = this.bg2.position.y + this.bg2.height;
        // this.bg1.setPosition(bgx,bgy); //将图片1放置在图片2之上
        this.bg1.setPositionY(bgy);
        // this.bg1.width = this.maxWidth * 2;
       // this.bg1.height = this.maxHeight * 1.5;//设置图片1的大小为当前屏幕宽度的2被，长度的1.5倍
                                               //防止断层
        console.log("bg1的宽"+this.bg1.width);
       // console.log("bg1的高"+this.bg1.height);
    },
    bgPut2:function () {
        //背景图片2放置位置及大小设定
        // var bgx = this.bg1.position.x;
        var bgy = this.bg1.position.y + this.bg1.height;
        this.bg2.setPositionY(bgy); //将图片2放置在图片1之上
        // this.bg2.width = this.maxWidth * 2;
       // this.bg2.height = this.maxHeight * 1.5;//设置图片1的大小为当前屏幕宽度的2被，长度的1.5倍
                                               //防止断层
        console.log("bg2的宽"+this.bg2.width);
       // console.log("bg2的高"+this.bg2.height);
    },

    nextBGName:function () {
        if (!this.bgNameArr){
            // this.bgNameArr = ['bg1','bg2','bg3','bg4','bg5'];
            this.bgNameArr = ['bg1','bg2'];
            this.bgNameIdx = 1;//指向当前场景编辑器里使用的bg2，意味着下一个就是bg3
        }

        this.bgNameIdx ++;
        if(this.bgNameIdx >= this.bgNameArr.length){
            this.bgNameIdx = 0;
        }
        return this.bgNameArr[this.bgNameIdx];
    },

    checkBgReset:function () {
        const  borderY = this.cameraNode.y + 150;

        // cc.log("borderY:" + borderY);
        // cc.log("this.bg1.position.y:" + this.bg1.position.y);
        // cc.log("this.bg2.position.y:" + this.bg2.position.y);

        //背景移动监测函数，当当前的camera坐标即将超出背景图片的高度时，将下一张图片移动
        const bgY1 = this.bg1.position.y;
        const bgY2 = this.bg2.position.y;

        ///bg1在上面，bg2在下面
        if (bgY1 > bgY2){
            ///如果在上面的bg1将要超出边界了，那么就把bg2放上去
            if(borderY > bgY1){
                this.bgPut2();
                const bgName = this.nextBGName();
                // cc.loader.loadRes('images/'+bgName, cc.SpriteFrame, function (err, spriteFrame) {
                //     if (err) {
                //         cc.error(err.message || err);
                //         return;
                //     }else {
                //         const sprite = this.bg2.getComponent(cc.Sprite);
                //         sprite.spriteFrame = spriteFrame;
                //         cc.log("bg2背景换成：" + bgName + "position.y:" + this.bg2.position.y);
                //     }
                // }.bind(this));
            }
        }
        ///bg2在上面，bg1在下面
        else{
            ///如果在上面的bg2将要超出边界了，那么就把bg1放上去
            if(borderY > bgY2){
                this.bgPut1();
                const bgName = this.nextBGName();
                // cc.loader.loadRes('images/'+bgName, cc.SpriteFrame, function (err, spriteFrame) {
                //     if (err) {
                //         cc.error(err.message || err);
                //         return;
                //     }else {
                //         const sprite = this.bg1.getComponent(cc.Sprite);
                //         sprite.spriteFrame = spriteFrame;
                //         cc.log("bg1背景换成：" + bgName + "position.y:" + this.bg2.position.y);
                //     }
                // }.bind(this));
            }
        }
    },

    //成功跳到当前盒子上
    jumpToCurBlockSuccess:function(targetPos){
    	this.player.playerIsAnimated = true;
        this.player.jumpTo(targetPos,()=>{
        	this.playerStablePos = this.player.node.position;
            this.player.playerIsAnimated = false;
            this.enableTouch();
            this.successAudioId = cc.audioEngine.play(this.successClip,false,1);
        });
    },

    //成功跳到下一盒子上，调完之后，需要移动camera的位置
    jumpToNextBlockSuccess:function(targetPos){
    	this.player.playerIsAnimated = true;
        // let self = this;
        this.player.jumpTo(targetPos,()=>{
        	this.playerStablePos = this.player.node.position;
            this.player.playerIsAnimated = false;

            let preCurBlockX = this.curBlock.node.position.x;
            let preNextBlockX = this.nextBlock.node.position.x;

            this.curBlock = this.nextBlock;
            let centerCurPos = this.curBlock.getCenterPosition();
            let midPlayerPos = cc.p(targetPos.x,targetPos.y+15);
            if(cc.pDistance(centerCurPos,midPlayerPos)<=15){
                //如果落在block上平面中心附近，+2分
                this.curBlock.score = 2;
            }
            // this.curBlock.playScoreAnim();
            this.player.playAddScore(this.curBlock.score);
            this.score += this.curBlock.score;
            this.scoreLabel.string = this.score;
            this.successAudioId = cc.audioEngine.play(this.successClip,false,1);
            let self = this;
            //下一个block的方向和距离
            this.player.direction = Math.random()>0.5?1:-1;

            let distance = this.curBlock.minDistance+Math.random()*(this.curBlock.maxDistance-this.curBlock.minDistance);
            let blockWidth = this.curBlock.node.width;
            //判断当前camera的视野是否到了边界，
            //如果到了边界，就将direction变为反方向
            let halfWidth = this.maxWidth/2;
            if(this.cameraNode.x-halfWidth === -this.maxWidth){
                //到了最左端
                console.log('移动前 到了最左');
                this.player.direction = 1;
                let preDis = Math.abs(preNextBlockX-preCurBlockX);
                distance = preDis+Math.random()*(this.curBlock.maxDistance-preDis);
            }else if(this.cameraNode.x+halfWidth === this.maxWidth){
                //到了最右端
                console.log('移动前 到了最右');
                this.player.direction = -1;
                let preDis = Math.abs(preNextBlockX-preCurBlockX);
                distance = preDis+Math.random()*(this.curBlock.maxDistance-preDis);
            }else{
                //判断移动后的camera视野是否超出最左或最右
                let curBlockX = this.curBlock.node.x;
                if(this.player.direction>0){
                    //即将向右移动
                    console.log('即将 向右');
                    //camera的x应该在两个block的x的中间
                    let cameraX = curBlockX + distance/2;
                    if(cameraX+halfWidth >= this.maxWidth){
                        console.log('超出 最右');
                        cameraX = this.maxWidth-halfWidth;
                        if((cameraX-curBlockX)*2<this.curBlock.node.width+this.curBlock.minDistance){
                            this.player.direction = -1;
                            let preDis = Math.abs(preNextBlockX-preCurBlockX);
                            distance = preDis+Math.random()*(this.curBlock.maxDistance-preDis);
                        }else{
                            distance = (cameraX-curBlockX)*2;
                        }
                    }
                }else{
                    //即将向左移动
                    console.log('即将 向左');
                    let cameraX = curBlockX - distance/2;
                    if(cameraX-halfWidth <= -this.maxWidth){
                        console.log('超出 最左');
                        cameraX = -this.maxWidth+halfWidth;
                        if((curBlockX-cameraX)*2<this.curBlock.node.width+this.curBlock.minDistance){
                            this.player.direction = 1;
                            let preDis = Math.abs(preNextBlockX-preCurBlockX);
                            distance = preDis+Math.random()*(this.curBlock.maxDistance-preDis);
                        }else{
                            distance = (curBlockX-cameraX)*2;
                        }
                    }
                }

            }
            // 移动camera，之后添加block
            this.updateStage(distance,()=>{
                self.addBlock(distance);
            });
        });
    },

    /**
     * 小人失败，需要判断是否需要摔倒
     */
    jumpFail:function(targetPos, fallDownOptions){
    	this.player.playerIsAnimated = true;
        this.player.jumpTo(targetPos,()=>{
            this.failAudioId = cc.audioEngine.play(this.failClip,false,1);
            this.disableTouch();
            let self = this;
            if(fallDownOptions.isNeedFall){
                // 需要摔倒
            	//刚体 小人线速度和角速度设置
                this.fallingDown = true;
                this.playerStablePos = this.player.node.position;
                this.player.playerIsAnimated = false;
                this.playerBody.linearVelocity = fallDownOptions.linearVelocity;
                this.playerBody.angularVelocity = fallDownOptions.angularVelocity;
                this.offset = fallDownOptions.offset;

                // 根据相对位置调整小人和block的层级
                this.scheduleOnce(()=>{
                    if(fallDownOptions.finalLocation === 0){
                        self.player.node.zIndex = self.curBlock.node.zIndex - 1;
                        self.nextBlock.node.zIndex = self.player.node.zIndex - 1;
                    }else{
                        self.player.node.zIndex = self.nextBlock.node.zIndex - 1;
                    }
                },0.3);
                return;

                // let rotateAction = cc.rotateTo(0.2,fallDownOptions.rotation);
                // let scaleAction = cc.scaleTo(0.2,fallDownOptions.scale,fallDownOptions.scale);
                // let spawn = cc.spawn(rotateAction,scaleAction);

                // let midFinished = cc.callFunc(function(){
                //     if(fallDownOptions.finalLocation === 0){
                //         self.player.node.zIndex = self.curBlock.node.zIndex - 1;
                //         self.nextBlock.node.zIndex = self.player.node.zIndex - 1;
                //     }else{
                //         self.player.node.zIndex = self.nextBlock.node.zIndex - 1;
                //     }
                // });
                // let finalPos = this.player.node.parent.convertToNodeSpaceAR(fallDownOptions.moveToPos);
                // let moveAction = cc.moveTo(0.1,finalPos.x,finalPos.y);
                // let finished = cc.callFunc(()=>{
                //     self.overPanel.show(self.score,self.onRestart,self.onBack,self);
                // });

                // let sequenceAciton = cc.sequence(spawn,midFinished,moveAction,finished);;
                // this.player.node.runAction(sequenceAciton);
            }else{
                //不需要摔倒，需要根据相对位置调整小人和block的层级
                if(fallDownOptions.finalLocation === 0){
                    this.player.node.zIndex = this.curBlock.node.zIndex - 1;
                    this.nextBlock.node.zIndex = this.player.node.zIndex - 1;
                }else{
                    this.player.node.zIndex = this.nextBlock.node.zIndex - 1;
                }
                let dir = this.player.direction;
                let moveAction = cc.moveTo(0.2,this.player.node.x+dir*5,this.player.node.y-60);
                let finished = cc.callFunc(()=>{
                	this.playerStablePos = this.player.node.position;
                    this.player.playerIsAnimated = false;
                    self.overPanel.show(self.score,self.onRestart,self.onBack,self);
                });
                this.player.node.runAction(cc.sequence(moveAction,finished));

                // this.scheduleOnce(()=>{
                //     let dir = this.player.direction;
                //     let moveAction = cc.moveTo(0.2,this.player.node.x+dir*5,this.player.node.y-60);
                //     let finished = cc.callFunc(()=>{
                //         self.overPanel.show(self.score,self.onRestart,self.onBack,self);
                //     });
                //     this.player.node.runAction(cc.sequence(moveAction,finished));
                // },0.05);

            }
        });
    },

    //将目标点转换到盒子上平面对应方向中线上的点
    formatTargetPosition:function(targetPos){
        let x0 = targetPos.x;
        let y0 = targetPos.y;
        let dir = this.player.direction;
        //锐角的tan、cos、sin
        let curCenter = this.curBlock.getCenterPosition();
        let nextCenter = this.nextBlock.getCenterPosition();
        let block;
        if(cc.pDistance(targetPos,curCenter) < cc.pDistance(targetPos,nextCenter)){
            block = this.curBlock;
        }else{
            block = this.nextBlock;
        }
        let KB = dir>0 ? block.getPMidKBForRight() : block.getPMidKBForLeft();
        let tan = Math.abs(KB.k);
        let cos = Math.cos(Math.atan(tan));
        let sin = Math.sin(Math.atan(tan));
        //直线的 k 和 b
        let k = KB.k;
        let b = KB.b;
        let x1 = (y0-b)/k;
        let d = Math.abs(x0-x1);
        let h = d*cos*sin;
        let y2 = y0+h;
        if(y0 <= k*x0+b){
            y2 = y0+h;
        }else{
            y2 = y0-h;
        }
        let x2 = (y2-b)/k;
        return cc.p(x2,y2);
    },

    onBack:function(){
        cc.director.loadScene('Start');
    },

    onRestart:function(){
        this.overPanel.hide();
        this.reset();
    },

    // 移动camera
    updateStage(distance,cb,cbTarget) {
        let dir = this.player.direction;
        let blockPos = this.curBlock.node.position;
        let playerPos = this.player.node.position;
        let deltaY = this.deltaYBetweenPlayerCamera;
        let nodePos = cc.p(blockPos.x+dir*distance/2,playerPos.y+deltaY);
        let finished = cc.callFunc(cb, cbTarget);
        let action = cc.sequence(cc.moveTo(0.5,nodePos),finished);
        this.cameraNode.runAction(action);
        this.checkBgReset();

        // let moveVector;
        // let playerWorldPos = this.player.node.parent.convertToWorldSpaceAR(this.player.node.position);
        // if(this.player.direction > 0) {
        //     moveVector = cc.pSub(playerWorldPos,this.leftOrigin);
        // }else {
        //     moveVector = cc.pSub(playerWorldPos,this.rightOrigin);
        // }
        // let finished = cc.callFunc(cb, cbTarget);
        // let action = cc.sequence(cc.moveTo(0.5,cc.pSub(this.node.position,moveVector)),finished);
        // this.node.runAction(action);
    },

    // start () {},

    // update (dt) {},
});
