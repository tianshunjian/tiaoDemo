
cc.Class({
    extends: cc.Component,

    properties: {
        maxScale:0,
        minScale:0,
        minDistance:0,
        maxDistance:0,
        anchorOffset:0,
        score:0,

        isReadJump:false,
        isSubDistance:false,

        scoreNode:{default:null,type:cc.Node},
        spriteNode:{default:null,type:cc.Node},

        // 上平面中点的白点
        whiteNode:{default:null,type:cc.Node},

        // 三张图
        blockLeft:{default:null,type:cc.Sprite},
        blockRight:{default:null,type:cc.Sprite},
        blockUp:{default:null,type:cc.Sprite},

        // 上平面四个顶点
        pLeft:{default:null,type:cc.Node},
        pRight:{default:null,type:cc.Node},
        pDown:{default:null,type:cc.Node},
        pTop:{default:null,type:cc.Node},

    },

    update (dt) {
        // if(this.isReadJump){
        //     if(this.isSubDistance){
        //         this.spriteNode.scaleY += dt*0.5/2;
        //         if(this.spriteNode.scaleY >= 1.0){
        //             this.spriteNode.scaleY = 1.0;
        //         }
        //     }else{
        //         this.spriteNode.scaleY -= dt*0.5/2;
        //         if(this.spriteNode.scaleY <=0.5){
        //             this.spriteNode.scaleY = 0.5;
        //         }
        //     }
        // }
    },

    /**
     * 小人蓄力时，block的动效
     */
    playerReadyJump:function(){
        this.isReadJump = true;
        this.spriteNode.runAction(cc.scaleTo(1.5,1,0.5));
    },

    /**
     * 小人调走时，block的颤抖动效
     */
    playerJumpTo:function(){
        this.isReadJump = false;
        this.spriteNode.stopAllActions();
        let action1 = cc.scaleTo(0.2,1,1).easing(cc.easeInOut(3));
        let action2 = cc.scaleTo(0.05,1,0.95).easing(cc.easeInOut(3));
        let action3 = cc.scaleTo(0.05,1,1).easing(cc.easeInOut(3));
        // let action4 = cc.scaleTo(0.05,1,0.95).easing(cc.easeInOut(3));
        // let action5 = cc.scaleTo(0.05,1,1).easing(cc.easeInOut(3));
        let sequence = cc.sequence(action1,action2,action3); 
        this.spriteNode.runAction(sequence);
    },

    /**
     * 获取block上平面中点的世界坐标
     */
    getCenterPosition:function(){
        let p1 = this.getPMidForLeftTopWorldPos();
        let p2 = this.getPMidForRightDownWorldPos();
        return cc.p((p1.x+p2.x)/2,(p1.y+p2.y)/2);
    },

    /**
     * 获取上平面四个顶点的世界坐标
     */
    getPLeftNodeWorldPos:function(){
        return this.pLeft.parent.convertToWorldSpaceAR(this.pLeft.position);
    },

    getPRightNodeWorldPos:function(){
        return this.pRight.parent.convertToWorldSpaceAR(this.pRight.position);
    },

    getPTopNodeWorldPos:function(){
        return this.pTop.parent.convertToWorldSpaceAR(this.pTop.position);
    },

    getPDownNodeWorldPos:function(){
        return this.pDown.parent.convertToWorldSpaceAR(this.pDown.position);
    },
    /**
     * 获取上平面四条边线的k和b
     */
    getKBForLeftDown:function(){
        let p1 = this.getPLeftNodeWorldPos();
        let p2 = this.getPDownNodeWorldPos();
        let k = (p2.y-p1.y)/(p2.x-p1.x);
        let b = (p2.x*p1.y-p1.x*p2.y)/(p2.x-p1.x);
        return {k:k,b:b};
    },
    getKBForDownRight:function(){
        let p1 = this.getPRightNodeWorldPos();
        let p2 = this.getPDownNodeWorldPos();
        let k = (p2.y-p1.y)/(p2.x-p1.x);
        let b = (p2.x*p1.y-p1.x*p2.y)/(p2.x-p1.x);
        return {k:k,b:b};
    },
    getKBForRightTop:function(){
        let p1 = this.getPRightNodeWorldPos();
        let p2 = this.getPTopNodeWorldPos();
        let k = (p2.y-p1.y)/(p2.x-p1.x);
        let b = (p2.x*p1.y-p1.x*p2.y)/(p2.x-p1.x);
        return {k:k,b:b};
    },
    getKBForTopLeft:function(){
        let p1 = this.getPLeftNodeWorldPos();
        let p2 = this.getPTopNodeWorldPos();
        let k = (p2.y-p1.y)/(p2.x-p1.x);
        let b = (p2.x*p1.y-p1.x*p2.y)/(p2.x-p1.x);
        return {k:k,b:b};
    },
    /**
     * 获取上平面四条边的中点的世界坐标
     */
    getPMidForLeftTopWorldPos:function(){
        let left = this.getPLeftNodeWorldPos();
        let top = this.getPTopNodeWorldPos();
        return cc.p((left.x+top.x)/2, (left.y+top.y)/2);
    },
    getPMidForLeftDownWorldPos:function(){
        let left = this.getPLeftNodeWorldPos();
        let down = this.getPDownNodeWorldPos();
        return cc.p((left.x+down.x)/2, (left.y+down.y)/2);
    },
    getPMidForRightDownWorldPos:function(){
        let right = this.getPRightNodeWorldPos();
        let down = this.getPDownNodeWorldPos();
        return cc.p((right.x+down.x)/2, (right.y+down.y)/2);
    },
    getPMidForRightTopWorldPos:function(){
        let top = this.getPTopNodeWorldPos();
        let right = this.getPRightNodeWorldPos();
        return cc.p((right.x+top.x)/2, (right.y+top.y)/2);
    },
    /**
     * 获取上平面两条中线的 k 和 b
     */
    getPMidKBForRight:function(){
        let p1 = this.getPMidForRightTopWorldPos();
        let p2 = this.getPMidForLeftDownWorldPos();
        let k = (p2.y-p1.y)/(p2.x-p1.x);
        let b = (p2.x*p1.y-p1.x*p2.y)/(p2.x-p1.x);
        return {k:k,b:b};
    },
    getPMidKBForLeft:function(){
        let p1 = this.getPMidForLeftTopWorldPos();
        let p2 = this.getPMidForRightDownWorldPos();
        let k = (p2.y-p1.y)/(p2.x-p1.x);
        let b = (p2.x*p1.y-p1.x*p2.y)/(p2.x-p1.x);
        return {k:k,b:b};
    },

    /**
     * 旧的+1动效，已弃用
     */
    playScoreAnim:function(){
        this.scoreNode.active = true;
        this.scoreNode.getComponent(cc.Label).string = '+'+this.score;
        this.scoreNode.getComponent(cc.Animation).play();
    },

    /**
     * 加载相应的图片
     */
    loadPic:function(target,url){
        if(!target || !url){
            return;
        }

        if(cc.allBlockPics){
            let isLoaded = false;
            for(let i=0;i<cc.allBlockPics.length;++i){
                // console.log(cc.allBlockPics[i].name);
                if(url.indexOf(cc.allBlockPics[i].name) !== -1){
                    isLoaded = true;
                    target.spriteFrame = cc.allBlockPics[i];
                    return;
                }
            }
            if(!isLoaded){
                cc.loader.loadRes(url,cc.SpriteFrame,function(err,spriteFrame){
                    if(!err){
                        target.spriteFrame = spriteFrame;
                    }else{
                    }
                });
            }
        }else{
            cc.loader.loadRes(url,cc.SpriteFrame,function(err,spriteFrame){
                if(!err){
                    target.spriteFrame = spriteFrame;
                }else{
                }
            });
        }
    },

    loadThreePic:function(){
        let self = this;
        let allPicNum = 18;
        let num = Math.floor(Math.random() * allPicNum);
        if(num !== allPicNum){
            num += 1;
        }

        let leftPic = 'block/block'+num+'left';
        let rightPic = 'block/block'+num+'right';
        let upPic = 'block/block'+num+'up';
        this.loadPic(this.blockLeft,leftPic);
        this.loadPic(this.blockRight,rightPic);
        this.loadPic(this.blockUp,upPic);
    },

    // LIFE-CYCLE CALLBACKS:

    onLoad () {
        this.loadThreePic();
    },

    // start () {},

    // update (dt) {},
});
