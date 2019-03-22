
cc.Class({
    extends: cc.Component,

    properties: {
        player:{default:null,type:cc.Node},
        startBtn:{default:null,type:cc.Node},
    },

    // LIFE-CYCLE CALLBACKS:

    onLoad () {
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
        cc.loader.loadResDir('block', cc.SpriteFrame, function (err, assets) {
            if(!err){
                cc.allBlockPics = assets;
                for(let i=0;i<cc.allBlockPics.length;++i){
                    console.log(cc.allBlockPics[i].name);
                }
            }
        });
        this.startBtn.on('click',this.onStartBtn,this);
    },

    onStartBtn:function(){
        cc.director.loadScene('Game');
    },

    // start () {},

    // update (dt) {},
});
