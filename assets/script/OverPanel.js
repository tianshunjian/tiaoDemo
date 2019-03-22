
cc.Class({
    extends: cc.Component,

    properties: {
        scoreLabel:{default:null,type:cc.Label},
        restartBtn:{default:null,type:cc.Node},
        backBtn:{default:null,type:cc.Node},
    },

    show:function(score,cb,backCb,target){
        this.node.active = true;
        this.scoreLabel.string = ''+score;
        this.restartBtn.once('click',cb,target);
        this.backBtn.once('click',backCb,target);

    },

    hide:function(){
        this.node.active = false;
    },

    // LIFE-CYCLE CALLBACKS:

    // onLoad () {},

    // start () {},

    // update (dt) {},
});
