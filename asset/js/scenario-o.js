class scenario {
    constructor(params) {
        var me = this;
        this.conteneur = params.conteneur ? params.conteneur : d3.select("#"+params.idConteneur);
        this.mediaCards = [];
        this.tracks = [];
        this.details = [];
        this.timeliner = params.timeliner ? params.timeliner : false;
        this.resource = params.resource ? params.resource : false;
        this.actant = params.actant ? params.actant : false;
        this.url = params.url ? params.url : false;
        this.mdWait = new jBox('Modal', {
            width: 200,
            height: 100,
            title: 'Patience...',
            content: '<div class="loading">' +
            '<p style="width:150px" >Merci de patienter...</p>' +
            '</div>'
        });
        this.scenarioException = function(value) {
            this.value = value;
            this.message = "Scenario : Error";
            this.toString = function() {
               return this.message + this.value;
            };
        }    
        this.init = function () {
            if(!me.conteneur || !me.actant || !me.resource || !me.url)throw new me.scenarioException("Paramètres d'initialisation abscents.");

            //initialisation du timeliner
            timelinerInit();

            //supprime les médias cards
            me.conteneur.selectAll("div").remove();
            me.mediaCards=[]; 
            me.tracks=[];

            //récupère les données du scenario
            me.mdWait.open();
            $.ajax({
                    type: 'POST',
                    dataType: 'json',
                    url: me.url,
                    data:{'idScenario':me.resource["o:id"],'idActant':me.actant["o:id"]}
                }).done(function (sc) {
                    $.ajax({
                        type: 'GET',
                        dataType: 'json',
                        url: sc.json
                    }).done(function (data) {
                        me.details = data;
                        me.timeliner.load(me.details);    
                        timelinerShow();
                    })
                    .fail(function (e) {
                        throw new me.scenarioException(e);
                    })
                    .always(function () {
                        me.mdWait.close();
                    });
                })
                .fail(function (e) {
                    throw new me.scenarioException(e);
                });            
        }
       
        function timelinerInit(){
            me.timeliner = new Timeliner({});    
            me.timeliner.hide();
            me.timeliner.fctKeyframe = me.addKeyframe;
            me.timeliner.fctKeyframeMove = me.changeKeyframe;
            me.timeliner.fctAddLayer = me.addLayer;
            me.timeliner.fctTargetNotify = me.targetNotify;
            me.timeliner.fctPause = me.timelinerPause;
            me.timeliner.fctPlay = me.timelinerPlay;
        }
        function timelinerShow(){
            me.timeliner.show('dock-bottom-sam');            
        }

        this.addKeyframe = function(nodes, links){
        }
        this.changeKeyframe = function(nodes, links){
        }
        this.addLayer = function(nodes, links){
        }
        this.targetNotify = function(layer){
            showTimelinerTarget();
            layer.value.forEach(v=>{
                if(v.idObj){
                    let idTarget = v.entry["oa:hasTarget"][0]["o:id"];
                    if (!mediaCards[idTarget]) createMediaCard(v.entry);
                    mediaCards[idTarget].entries.push(v.entry);
                    //filtre les actions
                    let data = mediaCards[idTarget].index.filter(i=>i.a=='c' || i.a=='u');
                    //modifie le tagcloud
                    //mediaCards[idTarget].tc.update(data.map(t=>t.p.text));  
                    //modifie le réseau
                    //mediaCards[idTarget].r.update(data.map(t=>t.p));            
                }
            });

        }


        function showTimelinerTarget() {

            let objects = timeliner.getObjetActions();
            videoIndex.forEach(v => v.a = 'd');
            for (const o in objects) {
                let oa = objects[o];
                for (const a in oa.actions) {
                    let p = oa.actions[a];
                    switch (p.prop) {
                        case 'Choice':
                        case 'omk_videoIndex':
                            joinVideoIndex(o, p);
                            break;
                    }
                }
            }
            if (videoIndex.length) showVideoIndex(timeliner.currentTimeStore.value);
        }
        

        this.timelinerPause = function(nodes, links){
        }
        this.timelinerPlay = function(nodes, links){
        }

        me.init();

    }
}

  


