class scenario {
    constructor(params) {
        var me = this;
        this.conteneur = params.conteneur ? params.conteneur : d3.select("#"+params.idConteneur);
        this.mediaCards = [];
        this.tracks = [];
        this.details = [];
        this.timeliner = params.timeliner ? params.timeliner : false;
        this.dataTime = -1;
        this.resource = params.resource ? params.resource : false;
        this.actant = params.actant ? params.actant : false;
        this.creators = [];
        this.urls = params.urls ? params.urls : false;
        this.mdWait = new jBox('Modal', {
            width: 200,
            height: 100,
            title: 'Patience...',
            content: '<div class="loading">' +
            '<p style="width:150px" >Merci de patienter...</p>' +
            '</div>'
        });
        this.mdEditTrack = new jBox('Modal', {
            width: 480,
            height: 384,
            theme: 'TooltipDark',
            overlay: false,
            title: "Editer l'annotation",
            content: $('#mdEditTrack'),//ATTENTION le formulaire doit être ajouter à la page HTML
            draggable: 'title',
            repositionOnOpen: false,
            repositionOnContent: false,
        });
        this.mdAjoutLayer = new jBox('Modal', {
            width: 200,
            height: 100,
            title: 'Ajouter une couche',
            width: 480,
            height: 260,
            theme: 'TooltipDark',
            overlay: false,
            content: $('#mdAjoutLayer'),//ATTENTION le formulaire doit être ajouter à la page HTML
            draggable: 'title',
            repositionOnOpen: false,
            repositionOnContent: false,
            onOpen: function() {
                document.getElementById('ajoutLayerIdCat').value="";
                document.getElementById('ajoutLayerLblCat').value="";
                $('#choixCategory .typeahead').val("");
                document.getElementById('ajoutLayerDescCategory').value="";            
            },        
        });
        this.mdAddScenario = new jBox('Modal', {
            width: 480,
            height: 384,
            theme: 'TooltipDark',
            overlay: false,
            title: "Add scenario",
            content: $('#mdAddScenario'),//ATTENTION le formulaire doit être ajouter à la page HTML
            draggable: 'title',
            repositionOnOpen: false,
            repositionOnContent: false
        });
    
        this.htmlError = '<p>ERREUR !</p>'
        +'<p><i class="fa-solid fa-bug"></i><i class="fa-solid fa-bug"></i><i class="fa-solid fa-bug"></i></p>'
        +'<p>Merci de contacter le responsable</>';
        //liste des propriétés de la tracks qui seront suggérées
        this.sgtProps = params.sgtProps ? params.sgtProps : [];
        this.fonctions = params.fonctions ? params.fonctions : [];
        this.scenarios = params.scenarios ? params.scenarios : [];
        this.modeVisuScenario = 'edit';
        this.graphAll = false;
        this.heightEdit = false;
        this.height = false;
        this.width = false;
        this.magicDureeBefore = params.magicDureeBefore ? params.magicDureeBefore : 3;
        this.magicDureeAfter = params.magicDureeAfter ? params.magicDureeAfter : 3;
        this.magicTrackLabel = params.magicTrackLabel ? params.magicTrackLabel : "Magic tracks";
    
        this.scenarioException = function(value) {
            this.value = value;
            this.message = "Scenario : Error";
            this.toString = function() {
               return this.message + this.value;
            };
        }    
        this.init = function () {
            if(!me.actant || !me.urls)throw new me.scenarioException("Paramètres d'initialisation abscents.");        

            if(!me.conteneur.size() && !me.resource){
                me.mdAddScenario.open();
                d3.select('#btnSccreate').on('click',saveScenario)
                return;        
            }
            getData();
        }

        function getData(){

            //récupère les données du scenario
            me.mdWait.open();
            $.ajax({
                    type: 'POST',
                    dataType: 'json',
                    url: me.urls.gen,
                    data:{'idScenario':me.resource["o:id"],'idActant':me.actant["o:id"]}
            }).done(function (sc) {
                $.ajax({
                    type: 'GET',
                    dataType: 'json',
                    url: sc.json
                }).done(function (data) {
                    me.details = data;
                    initIHM();
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
        
        function initIHM(){
            //initialisation du timeliner
            timelinerInit();

            //supprime les données d'un scénario précédent
            let medias = Array.prototype.slice.apply(document.querySelectorAll('audio,video'));
            medias.forEach(m => {
                videojs(m.playerId).dispose();
            });
            me.conteneur.selectAll("div").remove();
            me.mediaCards=[]; 
            me.tracks=[];
            d3.select('#graphScenario').selectAll('svg').remove();
            me.graphAll = false;

            //dimensionne les block
            let main = d3.select('#mainContainer'), mainPosi = main.node().getBoundingClientRect()
            me.heightEdit = window.innerHeight - mainPosi.top - (window.innerHeight / 3);
            me.height = window.innerHeight - mainPosi.top + (window.innerHeight / 3);
            me.width = mainPosi.width;
            main.style('height',me.height+'px');
            //d3.select('#mediaCards').style('height',me.heightEdit+'px');
            //d3.select('#visuScenario').style('height',me.height+'px');          
            //d3.select('#graphScenario').style('height',me.height+'px');          


            //affiche le titre du scénario courant
            d3.select("#btnCurrentScenario").text(me.resource["o:title"]);

            //ajoute les écouteurs d'événement
            d3.select('#btnIMajout').on('click', function (e) {
                me.saveTrack();
            });
            d3.select('#btnIMmodif').on('click', function (e) {
                me.saveTrack(true);
            });
            d3.select('#btnIMdelete').on('click', function (e) {
                let confirm = new jBox('Confirm', {
                    theme: 'TooltipDark',
                    confirmButton: 'Do it!',
                    cancelButton: 'Nope',
                    content:"Do you really want to delete this track ?",
                    confirm:deleteTrack
                });
                confirm.open();
            });
            
            d3.select('#btnAjoutCategory').on('click', function (e) {
                me.addCategory();
            });
            d3.select('#btnSelectCategory').on('click', function (e) {        
                me.selectCategory();
            });
            d3.select('#btnModeVisuScenarioEdit').on('click', function (e) {        
                me.modeVisuScenario = 'edit';
                d3.select('#mediaCards').style('display','block');
                d3.select('#visuScenario').style('display','none');
                d3.select('#graphScenario').style('display','none');
                timelinerShow();
            });
            d3.select('#btnModeVisuScenarioPlay').on('click', function (e) {        
                me.modeVisuScenario = 'play';
                d3.select('#mediaCards').style('display','none');
                d3.select('#visuScenario').style('display','block');
                d3.select('#graphScenario').style('display','none');
                me.timeliner.hide();
            });
            d3.select('#btnModeVisuScenarioGraph').on('click', function (e) {        
                me.modeVisuScenario = 'edit';
                d3.select('#mediaCards').style('display','none');
                d3.select('#visuScenario').style('display','none');
                d3.select('#graphScenario').style('display','flex');
                initGraphAll();
                me.timeliner.hide();
            });
            //gestion des boutons
            d3.select('#btnDeleteScenario')
                .style('visibility','visible')
                .on('click', function (e) {      
                    let confirm = new jBox('Confirm', {
                        theme: 'TooltipDark',
                        confirmButton: 'Do it!',
                        cancelButton: 'Nope',
                        content:"Do you really want to delete this scenario and all associated tracks ?",
                        confirm:deleteScenario
                    });
                    confirm.open();
                });
            d3.select('#gbModeVisuScenario')
                .style('visibility','visible');
            d3.select('#btnScenarioTxtToObj')
                .style('visibility','visible')
                .on('click', function (e) {      
                    let confirm = new jBox('Confirm', {
                        theme: 'TooltipDark',
                        confirmButton: 'Do it!',
                        cancelButton: 'Nope',
                        content:"Do you really want to transform text to object ?",
                        confirm:scenarioTextToObject
                    });
                    confirm.open();
                });
                
                            

            me.timeliner.load(me.details);    
            timelinerShow();

            getCreators();
            addMagicLayer();


        }        

        function addMagicLayer(){
            //vérifie si le layer existe
            let layer = me.timeliner.getLayer('name',me.magicTrackLabel+' : '+me.actant['o:title'])
            if(!layer.length){
                document.getElementById('ajoutLayerLblCat').value=me.magicTrackLabel;
                me.addCategory();
             }
        }

        function initGraphAll(){
            //constructions des datas;
            let dt = getDataReseau(me.timeliner.getAllEntry().filter(e=>e.timeEnd),false,false,true);
            if(!me.graphAll){
                me.graphAll = new reseau({'cont':d3.select('#graphScenario')
                    ,'width':me.width,'height':me.height
                    ,'legende':true
                    ,'data':dt
                });
            }me.graphAll.update(dt);
        }

        function getCreators() {
            let dbl =[];
            me.creators = []
            me.details.layers.forEach(l=>{
                l.values.forEach(v=>{
                    if(v["dcterms:creator"] && dbl[v["dcterms:creator"][0]["o:id"]] === undefined){
                        me.creators.push(v["dcterms:creator"][0]);
                        dbl[v["dcterms:creator"][0]["o:id"]]=1;
                    }
                });
            });
        }
        
        //ajoute les suggestions possible dans la fenêtre d'édition des tracks
        function initSuggestions(){

            let sgtRela = d3.select("#sgtRelations");
            if(!sgtRela.size()){
                console.log("PAS DE SUGGESTIONS");
                return;
            }

            sgtRela.selectAll('div').remove();
            let mainDiv = sgtRela.selectAll('div').data(me.sgtProps).enter().append('div').attr('class',"col-12");
            let nav = mainDiv.append('nav').attr('class',"navbar")
                .append('div').attr('class',"container mb-1").style('padding',0);
            nav.append('span').html(p=>p.p['o:label']);
            let dl = nav.append('div').attr('class','d-flex');
            dl.append('div').attr('id',p=>'choix'+p.p['o:local_name'])
                .append('input').attr('class',"typeahead").attr('type','text').attr('placeholder',p=>'Choisir / ajouter...');
            dl.append('button').attr('id',p=>'btnChoix'+p.p['o:local_name'])
                .attr('class',"btn btn-sm btn-danger ml-1")
                .style('display','none')
                .html('+');
            mainDiv.append('ul').attr('id',p=>'choose'+p.p['o:local_name'])
                .attr("class","list-group");  
        
            me.sgtProps.forEach((p,ip)=>{
                let className =p.p['o:local_name'];
                p.relations = [];
                p.sgt = new Bloodhound({
                    datumTokenizer: Bloodhound.tokenizers.obj.whitespace('o:title'),
                    queryTokenizer: Bloodhound.tokenizers.whitespace,
                    identify: function(obj) { 
                        return obj['o:id']; 
                      },
                    //local: getSuggestionsData(p),
                    remote: {
                        url: p.url,
                        wildcard: '%QUERY'
                      },                    
                    //initialize: false,
                  });
                var promise = p.sgt.initialize();
                promise
                  .done(function() { 
                      console.log('ready to go!'); })
                  .fail(function() { 
                      console.log('err, something went wrong :('); });
        
                $('#choix'+className+' .typeahead').typeahead(null, {
                name: 'omk-'+className,
                display: 'o:title',
                source: p.sgt,
                templates: {
                    empty: function(context){
                        d3.select('#btnChoix'+p.p['o:local_name']).style('display','block');
                        return [
                            '<div class="empty-message">',
                                'no '+className+' found',
                            '</div>'
                            ].join('\n')
                    },
                    suggestion: Handlebars.compile('<div><strong>{{o:title}}</strong> – {{o:id}}</div>')
                }  
                });
                $('#choix'+className+' .typeahead').bind('typeahead:select', function(ev, d) {        
                    d3.select('#btnChoix'+p.p['o:local_name']).style('display','none');
                    p.relations.push(d);
                    createRelationToTrack(p);
                })        
            })      
        }


        function saveScenario() {
            me.mdAddScenario.close();
            me.mdWait.open();
            //récupère les données saisies
            let dataScena = {
                'dcterms:title': document.getElementById('inputSctitre').value,
                'dcterms:description': document.getElementById('inputScdesc').value,
                'dcterms:creator': actant['o:id'],
                'item_id':[]
            }
            //récupère la source de génération
            //seminairesToScenario.forEach(s=>dataScena['item_id'].push(s['o:id']));
            //enregistre dans la base
            $.ajax({
                    type: 'POST',
                    dataType: 'json',
                    url: me.urls.crea,
                    data: dataScena
                }).done(function (data) {
                    me.scenarios.push(data);
                    if(me.fonctions.showListeScenario)me.fonctions.showListeScenario();  
                    if(me.fonctions.chargeScenario)me.fonctions.chargeScenario(null, data);
                })
                .fail(function (e) {
                    console.log(e);
                })
                .always(function () {
                    me.mdWait.close();
                });
        }
        function deleteScenario(e) {
            me.mdWait.open();
            $.ajax({
                type: 'GET',
                dataType: 'json',
                url: me.urls.del + me.details['idScenario'],
            }).done(function (data) {
                if(!data['error']){
                    me.timeliner.hide();
                    //suprime le scenario
                    let i = me.scenarios.map(s => s['o:id']).indexOf(me.details['idScenario']);
                    me.scenarios.splice(i, 1);
                    if(me.fonctions.showListeScenario)me.fonctions.showListeScenario();  
                    d3.select("#btnCurrentScenario").text('...');
                    d3.select("#gbManipScenario").selectAll('button').style('visibility','hidden');
                    d3.select("#gbModeVisuScenario").style('visibility','hidden');        
                }else{
                    me.mdWait.close();
                    throw new me.scenarioException("Suppression du scénario impossible.",data['error']);
                } 
                new jBox('Notice', {
                    content: data['message'],
                    color: 'black',
                    position: {
                        y: 'center',
                        x: 'center'
                    }
                });        
            })
            .fail(function (e) {
                me.mdWait.close();
                throw new me.scenarioException("Suppression du scénario impossible.",e);
            })
            .always(function () {
                me.mdWait.close();
            });
        }        
        function scenarioTextToObject(e) {
            me.mdWait.open();
            $.ajax({
                type: 'POST',
                dataType: 'json',
                url: me.urls.txtToObj,
                data:{'idScenario':me.resource["o:id"],'idActant':me.actant["o:id"]}
            }).done(function (data) {
                if(!data['error']){
                    getData()
                }else{
                    me.mdWait.close();
                    throw new me.scenarioException("Modification du scénario impossible.",data['error']);
                } 
                new jBox('Notice', {
                    content: data['message'],
                    color: 'black',
                    position: {
                        y: 'center',
                        x: 'center'
                    }
                });        
            })
            .fail(function (e) {
                me.mdWait.close();
                throw new me.scenarioException("Modification du scénario impossible.",e);
            })
            .always(function () {
                me.mdWait.close();
            });
        }        

        function createRelationToTrack(p){        
            let className = p.p['o:local_name'];
            d3.select('#choose'+className).selectAll('li').remove();
            let lis = d3.select('#choose'+className).selectAll('li').data(p.relations).enter()
                .append('li').attr('class',"list-group-item").attr('id',r=>className+'_'+r['o:id'])
                .html(r=>r['o:title']);
            lis.append('button').attr('class',"btn btn-danger btn-sm mx-2")
                    .html('X')
                    .on('click',(e,d)=>{
                        let i = p.relations.map(r => r['o:id']).indexOf(d['o:id']);
                        p.relations.splice(i, 1);
                        createRelationToTrack(p);
                    });
            lis.each(function(r, i) {
                if(r["@type"][1]=="genstory:evenement" && r["genstory:hasFonction"]) createFunctionParam(p, r, d)
            });
                
        }

        function getDataReseau(dataTracks, catAsLink=false, showCreator=true, showRela=false){
            //récupère le reseau de la branche du concept
            let dataReseau = {'nodes':[],'links':[]}, dbl = {};
            dataTracks.forEach(dt=>{
                if(dt.a != 'd'){
                    let e = dt.p ? dt.p.value.entry : dt;
                    let cat = e.category.split(' : ')[0];
                    if(e.idLayer===undefined)e.idLayer = dt.p ? dt.p.value.idLayer : 'no';
                    if(e.idEntry===undefined)e.idEntry = dt.p ? dt.p.value.idEntry : 'no';
                    if(showCreator && dbl[e["dcterms:creator"][0]["o:id"]]===undefined){
                        //ajoute le createur
                        dataReseau['nodes'].push({id: e["dcterms:creator"][0]["o:id"], size: 1
                            , txtColor: 1
                            , group: 'creator'
                            , size: 5
                            , fct: false
                            , title: e["dcterms:creator"][0]["o:title"]
                        }); 
                        dbl[e["dcterms:creator"][0]["o:id"]]={'nb':1,'i':dataReseau['nodes'].length-1};
                    }
                    //prendre uniquement les ressource liées
                    if(showRela){
                        sgtProps.forEach(p=>{
                            if(e[p.p["o:term"]] && p.p["o:term"]!="dcterms:creator"){
                                e[p.p["o:term"]].forEach(v=>{
                                    if(dbl[v['o:id']]===undefined){
                                        //ajoute le layer
                                        let group = Array.isArray(v["@type"]) ? v["@type"][v["@type"].length-1] : v["@type"];
                                        group = v['o:id'] == e.idCat ? p.p["o:term"] : group;
                                        dataReseau['nodes'].push({id: v['o:id'], size: 1
                                            , txtColor: e._color
                                            , group: group
                                            , size: 5
                                            , fct: {'click':me.showChoix}
                                            , title: v['o:title']
                                        }); 
                                        dbl[v['o:id']]={'nb':1,'i':dataReseau['nodes'].length-1};
                                    }else dbl[v['o:id']].nb++;
                                    //ajoute les liens vers la category
                                    if(v['o:id'] != e.idCat){
                                        if(dbl[v['o:id']+'_'+e.idCat]===undefined){
                                            dataReseau['links'].push({target: v['o:id']
                                            , source: e.idCat, value: 1
                                            , txtColor: e._color
                                            , size: 5
                                            , id : v['o:id']+'_'+e.idCat
                                            , group: p.p["o:label"]});  
                                            dbl[v['o:id']+'_'+e.idCat]={'nb':1,'i':dataReseau['links'].length-1};
                                        }else dbl[v['o:id']+'_'+e.idCat].nb++;
                                    }
                                })    
                            }
                        }) 
                        //met à jour la taille des noeud et des liens
                        for (const i in dbl) {
                            if(i.includes('_')){
                                dataReseau['links'][dbl[i].i].size=5*dbl[i].nb;
                            }else{
                                dataReseau['nodes'][dbl[i].i].size=5*dbl[i].nb;
                            }
                        }   
                    }else{
                        //prendre toutes les choix
                        if(!catAsLink && dbl[e.idCat]===undefined){
                            //ajoute le layer
                            dataReseau['nodes'].push({id: e.idCat, size: 1
                                , txtColor: 10
                                , group: 'category'
                                , size: 5
                                , fct: false
                                , title: cat
                            }); 
                            dbl[e.idCat]=1;
                        }else dbl[e.idCat]++;
                        if(dbl[e.idObj]===undefined){
                            //ajoute le text
                            dataReseau['nodes'].push({id: e.idObj, size: 1
                                , group: cat
                                , size: 5
                                , entry: e
                                , color:e._color
                                , fct: {'click':me.editTrack}
                                , title: e.text
                            }); 
                            dbl[e.idObj]=1;
                        }else dbl[e.idObj]++;
                        //ajoute les liens 
                        if(showCreator && dbl[e.idObj+'_'+e["dcterms:creator"][0]["o:id"]]===undefined){
                            dataReseau['links'].push({target: e.idObj
                            , source: e["dcterms:creator"][0]["o:id"], value: 1
                            , txtColor: 1
                            , id : e.idObj+'_'+e["dcterms:creator"][0]["o:id"]
                            , group: "a comme "+e.category.split(' : ')[0]});  
                            dbl[e.idObj+'_'+e["dcterms:creator"][0]["o:id"]]=1;
                        }
                        if(!catAsLink && dbl[e.idObj+'_'+e.idCat]===undefined){
                            dataReseau['links'].push({target: e.idObj
                            , source: e.idCat, value: 1
                            , txtColor: 1
                            , id : e.idObj+'_'+e.idCat
                            , group: "branche"});  
                            dbl[e.idObj+'_'+e.idCat]=1;
                        } 

                    }
                }
            });
            return dataReseau;
        }

        function timelinerInit(){
            if(!me.timeliner){
                me.timeliner = new Timeliner({});    
                me.timeliner.hide();
                me.timeliner.fctKeyframe = me.addKeyframe;
                me.timeliner.fctKeyframeMove = me.changeKeyframe;
                me.timeliner.fctAddLayer = me.addLayer;
                me.timeliner.fctTargetNotify = me.targetNotify;
                me.timeliner.fctPause = me.timelinerPause;
                me.timeliner.fctPlay = me.timelinerPlay;    
            }
        }
        function timelinerShow(){
            me.timeliner.show('dock-bottom-sam');            
        }        
        this.addKeyframe = function(l, v, o) {
            let idCat = l.id.split('_')[0];
            me.editTrack(null,null, {
                'idCat': idCat,
                'idEntry': v,
                'idCreator':actant["o:id"],
                'category': l.name,
                'idGroup': l.id,
                'idLayer':l.idLayer,    
                'text': "--",
                'desc': '--',
                'time': o.time,
                'timeEnd': o.time + 5,
                '_color': o._color,
                'tween': 'linear' //par defaut le tween est linear pour automatiquement mettre une plage de couleur
            })
        }
        this.changeKeyframe = function(l,v){   
            let entry = v.object;
            if(!entry.idObj){
                let te = entry.time;
                entry = l.values[v.index-1];
                entry.idEntry=v.index-1;
                entry.idLayer=v.object.idLayer;
                entry.timeEnd = te;
            }
            me.editTrack(null, null, entry);
        }
        this.addLayer = function(cb){
            if(!me.actant){
                new jBox('Notice', {
                    content: "Vous n'avez pas le droit de créer une couche",
                    color: 'black',
                    position: {
                        y: 'center',
                        x: 'center'
                    }
                });
            }else me.mdAjoutLayer.open();
        }


        this.selectCategory=function(){
            let idGroup = document.getElementById('ajoutLayerIdCat').value;
            let lblLayer = document.getElementById('ajoutLayerLblCat').value;
            idGroup += '_'+actant['o:id'];
            lblLayer += ' : '+actant['o:title'];
            me.timeliner.addLayer(lblLayer,idGroup);
            me.timeliner.repaintAll();
            me.mdAjoutLayer.close();
        }
        this.addCategory = function(){
            let layerTitle = document.getElementById('ajoutLayerLblCat').value;
            let layerDesc = document.getElementById('ajoutLayerDescCategory').value;
            //enregistre dans la base
            $.ajax({
                type: 'POST',
                dataType: 'json',
                url: urlSite + '/page/ajax?helper=Scenario&type=addCategory&json=1',
                data: {'dcterms:title':layerTitle,
                'dcterms:description':layerDesc,
                'rt':'Catégorie indexation vidéo'}
            }).done(function (data) {
                me.timeliner.addLayer(data['o:title']+' : '+me.actant['o:title'],data['o:id']+'_'+me.actant['o:id']);
                me.timeliner.repaintAll();
            })
            .fail(function (e) {
                new jBox('Notice', {
                    content: me.htmlError,
                    color: 'black',
                    position: {
                        y: 'center',
                        x: 'center'
                    }
                });
                throw new me.scenarioException("Erreur ajout category.",e);

            })
            .always(function () {
                me.mdAjoutLayer.close();
            });
        }

        this.targetNotify = function(layer){

            layer.value.forEach(v=>{
                let entries = [];
                //met à jour les infos une par seconde et par média
                if(v.idObj && v.entry["oa:hasTarget"] && me.timeliner.currentTimeStore.value != me.dataTime){
                    getMediaTracks();
                    let idTarget = v.entry["oa:hasTarget"][0]["o:id"];
                    showMedias(me.mediaCards[idTarget]);
                    //modifie le tagcloud
                    //mediaCards[idTarget].tc.update(data.map(t=>t.p.text));  
                    //modifie la liste des tracks            
                    showListeTracks(me.mediaCards[idTarget])
                    //modifie le réseau                    
                    me.mediaCards[idTarget].r.update(getDataReseau(me.mediaCards[idTarget].tracks, false, true, false));
                    me.dataTime = me.timeliner.currentTimeStore.value;
                }
            });

        }


        function getMediaTracks() {

            let objects = me.timeliner.getObjetActions();
            me.tracks.forEach(v => v.a = 'd');
            for (const o in objects) {
                let oa = objects[o];
                for (const a in oa.actions) {
                    let p = oa.actions[a];
                    switch (p.prop) {
                        case 'Choice':
                        case 'omk_videoIndex':
                            joinMediaTrack(o, p);
                            break;
                    }
                }
            }
        }
        
        function joinMediaTrack(id, p) {
            if (me.tracks[id]){
                me.tracks[id].p = p;
                me.tracks[id].a = 'u';
            } else {
                me.tracks[id]={'p':p,'a':'c'};
                //vérifie s'il faut créer le média
                //let idTarget = videoIndex[id].p.value.entry.idTarget;
                let idTarget = p.value.entry["oa:hasTarget"][0]["o:id"];
                if (!me.mediaCards[idTarget]) createMediaCard(me.tracks[id]);
                me.mediaCards[idTarget].tracks.push(me.tracks[id]);
            }
        }
        

        function createMediaCard(track) {

            let m = {}, d = track.p.value.entry;
            m.card = d3.select("#mediaCards").append("div")
                .attr('id', 'cardVideo' + d["oa:hasTarget"][0]["o:id"])
                .attr("class", "card text-white bg-dark");
        
            //carte = tracks à gauche + vidéo à droite
            let rowCard = m.card.append('div').attr('class', 'row g-0');
            let colAnno = rowCard.append('div').attr('class', 'col-md-6');
            m.idSource = d["oa:hasSource"][0]["o:id"];
            m.idTarget = d["oa:hasTarget"][0]["o:id"];
            m.idBody = "cardBody"+d["oa:hasTarget"][0]["o:id"];
            m.body = colAnno.append('div')
                .attr("id", m.idBody)
                .attr("class", "card-body");
            let colVideo = rowCard.append('div').attr('class', 'col-md-6');
            colVideo.append('h5').html(d["oa:hasTarget"][0]["o:title"]+' - '+d["oa:hasTarget"][0]["o:id"]);
            
            appendVideoToMediaCard(m, d, colVideo.append('video'));

            //ajoute les boutons de gestion du media
            appendButtonForMedia(m, d, colVideo);

            /*construction du body = liste des annotations
            m.body.append('h5')
                .attr("class", "card-title").html("Annotations");
            m.idlisteTracks = "listeTracks" + d["oa:hasTarget"][0]["o:id"];
            m.listeTracks = m.body.append('ul')
                .attr("class", "list-group listeTracks")
                .attr("id", d.idListeTracks);
            */
        
            //construction du body = réseau de lien
            m.r = new reseau({'cont':m.body
                ,'width':400,'height':300
                ,'data':{'nodes':[],'links':[]}
            });
            
            //construction du tag cloud
            //m.tc = TagCloud('#'+m.idBody, [d.text]);
        
            m.tracks = [];
            me.mediaCards[d["oa:hasTarget"][0]["o:id"]] = m;
        
        }
        function appendButtonForMedia(m, d, c) {
            if(!d["oa:hasTarget"]) return;

            let btnBlock = c
                .append('div').attr('class',"btn-toolbar mb-3").attr('role','toolbar');
            btnBlock.append('div').attr('class',"btn-group me-2").attr('role','group')
                .append('button').attr('class',"btn btn-danger btn-sm").html('<i class="fa-solid fa-hand-sparkles"></i>')
                .on('click',function(){addMagicTrack(m);});
            let inpB =  btnBlock.append('div').attr('class',"input-group");
            inpB.append('div').attr('class',"input-group-text").html('s. avant')
            inpB.append('input').attr('class',"form-control form-control-sm").attr('max','3600').attr('min','3')
                .attr('type',"number")
                .attr('value',me.magicDureeBefore).attr('id','secondeBefore'+m.idBody);
            let inpA =  btnBlock.append('div').attr('class',"input-group");
            inpA.append('div').attr('class',"input-group-text").html('s. après')
            inpA.append('input').attr('class',"form-control form-control-sm").attr('max','3600').attr('min','3')
                .attr('type',"number")
                .attr('value',me.magicDureeAfter).attr('id','secondeAfter'+m.idBody);
        }
        function addMagicTrack(m){   
            if(!m.video)return;
            let layer = me.timeliner.getLayer('name',me.magicTrackLabel+' : '+me.actant['o:title'])[0],
            start = parseInt(document.getElementById('secondeBefore'+m.idBody).value),
            end = parseInt(document.getElementById('secondeAfter'+m.idBody).value), 
            ct = parseInt(m.video.currentTime()),
            dataTrack = {
                'dcterms:title': "MT "+m.idSource+'-'+m.idTarget+' : '+ct+' -'+start+' +'+end,
                'schema:category': layer.id.split('_')[0],
                'oa:start': ct-start,
                'oa:end': ct+end,
                'schema:color': 'red',
                'oa:hasSource': m.idSource,
                'oa:hasTarget': m.idTarget,
                'idGroup': layer.id,
                'category': me.magicTrackLabel+' : '+me.actant['o:title'],
                'dcterms:creator': actant['o:id'],
                'idScenario': me.details.idScenario,
                "action":"addMagicTrack",
                'getItem':1
            }

            $.ajax({
                type: 'POST',
                dataType: 'json',
                url: urlSite + '/page/ajax?helper=MagicTrack&json=1&type=createTrack',
                data: dataTrack
            }).done(function (data) {
                //ajout de l'entrée dans le layer
                me.timeliner.addTrack(layer, data[0]);
                me.timeliner.addTrack(layer, data[1]);
                me.timeliner.repaintAll();
            })
            .fail(function (e) {
                new jBox('Notice', {
                    content: me.htmlError,
                    color: 'black',
                    position: {
                        y: 'center',
                        x: 'center'
                    }
                });
                throw new me.scenarioException("Erreur ajout MagicTrack.",e);
            });

        }
        
        function appendVideoToMediaCard(m, d, v) {
            m.idVideo = "visiosVideo" + d["oa:hasTarget"][0]["o:id"];
            v.attr("id", m.idVideo)
                .attr("class", "video-js vjs-fluid card-img-top")
                .attr("controls", "true")
                .attr("preload", "auto")
                .attr("width", "400")
                .attr("height", "300")
                .attr("poster", urlPosterVideo);
            m.ready = false;
            m.videoIsPaused = true;
            m.video = videojs(m.idVideo,{
                controls:true,
                autoplay: true
            })
            m.video.src({
                type: d["oa:hasTarget"][0]["o:media_type"],
                src: d["oa:hasTarget"][0]["o:original_url"]
            });
            m.video.ready(function () {
                m.ready = true;
                let playPromise = m.video.play();
                if (playPromise !== undefined) {
                    playPromise.then(_ => {
                            m.video.pause()
                            d.videoIsPaused = false;
                            m.ready = true;
                            /*met à jour les extrémité du slider
                            sliderIndexStartEnd.noUiSlider.updateOptions({
                                range: {
                                    'min': 0,
                                    'max': m.video.duration()
                                }
                            });        
                            */
                        })
                        .catch(error => {
                            console.log(error)
                        });
                }
            });
            m.video.on('timeupdate', (e, d) => {
                /*met à jour les poignées du slider
                let stopDeb = d3.select('#inputIMdebPlay').style('display')
                  , stopFin = d3.select('#inputIMfinPlay').style('display');
                if(stopDeb=='none' && stopFin=='none')return;
                let ct = m.video.currentTime()
                  , posis = sliderIndexStartEnd.noUiSlider.get();
                if(stopDeb!='none')posis[0]=ct;
                if(stopFin!='none')posis[1]=ct;
                sliderIndexStartEnd.noUiSlider.updateOptions({
                      start: posis,        
                  });        
                */
            });
        }        

        function showMedias(d){
            let t = me.timeliner.currentTimeStore.value;
            if (d.ready) {
                if(me.timeliner.isPlaying()){
                    if (d.videoIsPaused){
                        d.video.play();
                        d.videoIsPaused = false;
                        //synchronise le timeliner et la vidéo avec une tolérance pour éviter les coupures
                        if (Math.trunc(d.video.currentTime()) != Math.trunc(t)) d.video.currentTime(t);
                    }
                }else{
                    d.video.pause();
                    d.videoIsPaused = true;                
                    //synchronise le timeliner et la vidéo avec une tolérance pour éviter les coupures
                    if (Math.trunc(d.video.currentTime()) != Math.trunc(t)) d.video.currentTime(t);
                }
            }
        }


        function showListeTracks(d) {
            if(d.listeTracks=== undefined)return;
            let dataTracks = d.tracks.filter(i => i.a == 'c' || i.a == 'u');
            //d.listeTracks.selectAll("li").remove();
            d.listeTracks.selectAll("li").data(dataTracks)
                .join(
                    enter => {
                        let aSem = enter.append('li').attr('class', 'list-group-item')
                            .attr("id", d => 'detailTrack_' + d.p.value.entry.idObj)
                            .attr("aria-current", "true");
                        let aSemBody = aSem.append('div').attr('class', 'd-flex w-100 justify-content-between');
                        let tools = aSemBody.append('div');
                        if(actant){
                            tools.append('span').attr('class', 'btnDel px-2')
                                .style('cursor', 'pointer')
                                .on('click', deleteDetail)
                                .append('i').attr('class', 'fa-solid fa-trash-can');
                            tools.append('span').attr('class', 'btnEdit px-2')
                                .style('cursor', 'pointer')
                                .on('click', me.editTrack)
                                .append('i').attr('class', 'fa-solid fa-pen-to-square');
                        }
                        aSemBody.append('h6').attr('class', 'mb-1')
                            .style('color', d => d.p.value.entry._color)
                            .html(d => d.p.value.entry.category);
                        //aSemBody.append('small').html(d=>d.creator);
                        aSem.append('p').html(d => d.p.value.entry.text);
                    },
                    update => {
                        update.attr("id", d => {
                            return 'detailTrack_' + d.p.value.entry.idObj
                        });
                        if(actant){
                            update.select('.btnEdit').on('click', me.editTrack);
                        }
                        update.select('h6').style('color', d => d.p.value.entry._color).html(d => d.p.value.entry.category);
                        update.select('p').html(d => d.p.value.entry.text);
                    },
                    exit => exit.remove()
                );
        }
        
        this.showChoix = function(e, d) {
            if(!d)return;
            me.mdWait.open();
            $.ajax({
                    type: 'POST',
                    dataType: 'json',
                    url: me.urls.showChoix,
                    data:{'qs':[d]}
            }).done(function (choix) {
                console.log(choix);
            })
            .always(function () {
                me.mdWait.close();
            })
            .fail(function (e) {
                throw new me.scenarioException(e);
            });      
        }


        this.editTrack = function(e, data, entry) {
            //initialisation des suggestions
            initSuggestions();

            let d = data ? data.entry : entry;
            me.mdEditTrack.setTitle(d.category + ' : ' + d.idObj);
            document.getElementById('inputIMtitre').value = d.text;
            document.getElementById('inputIMdesc').value = d.desc ? d.desc : "";
            document.getElementById('inputIMdeb').value = d.time;
            document.getElementById('inputIMdebHelp').innerHTML = me.secondsToHms(d.time);
            document.getElementById('inputIMfin').value = d.timeEnd;
            document.getElementById('inputIMfinHelp').innerHTML = me.secondsToHms(d.timeEnd);
            document.getElementById('inputIMcolor').value = d3.color(d._color).formatHex();
            document.getElementById('inputIMcolorHelp').innerHTML = d._color;
            document.getElementById('idCat').value = d.idCat;
            document.getElementById('idObj').value = d.idObj;
            document.getElementById('category').value = d.category;
            document.getElementById('idGroup').value = d.idGroup;
            document.getElementById('idSource').value = d["oa:hasSource"] ? d["oa:hasSource"][0]["o:id"] : "";
            d.idTarget = document.getElementById('idTarget').value = d["oa:hasTarget"] ? d["oa:hasTarget"][0]["o:id"] : "";
            document.getElementById('idLayer').value =d.idLayer;
            document.getElementById('idEntry').value = d.idEntry;
            if (d.idTarget) {
                //masque le sélectionneur de média
                document.getElementById('choixMedia').style.display = 'none';
                document.getElementById('btnIMajout').style.display = 'none';
                document.getElementById('btnIMmodif').style.display = 'block';
                document.getElementById('btnIMdelete').style.display = 'block';
            } else {
                //affiche le sélectionneur de média
                document.getElementById('choixMedia').style.display = 'block';
                document.getElementById('btnIMajout').style.display = 'block';
                document.getElementById('btnIMmodif').style.display = 'none';
                document.getElementById('btnIMdelete').style.display = 'none';
            }
            //ajoute les propriétés sélectionnées
            me.sgtProps.forEach(p=>{
                p.relations = [];
                if(d[p.p['o:term']]){
                    p.relations = d[p.p['o:term']];                    
                    createRelationToTrack(p);            
                }
                //ajoute automatiquement la catégorie à la création d'une track
                if(!data && p.p['o:term']=='schema:category'){
                    getItem(d.idCat, oCat=>{
                        if(oCat){
                            p.relations.push(oCat);                    
                            createRelationToTrack(p);                
                        }    
                    });
                }                
            })

            //vérifie si l'utilisateur à le droit de modifier
            if(d["dcterms:creator"] && d["dcterms:creator"][0]["o:id"] != actant["o:id"]){
                let html = '<div class="alert alert-danger" role="alert">'
                    +'<i class="fa-solid fa-triangle-exclamation"></i>'
                    +"<div>Interdit de modifier une entrée d'un autre utilisateur.</div>"
                    +"<div>Une nouvelle entrée sera créée.</div>"
                    +"</div>"
                , n = new jBox('Notice', {
                    content: html,
                    color: 'black',
                    position: {
                        y: 'center',
                        x: 'center'
                    }
                });        
                document.getElementById('btnIMajout').style.display = 'block';
                document.getElementById('btnIMmodif').style.display = 'none';
                document.getElementById('idGroup').value = 0;
        
            }
            me.mdEditTrack.open();        
        }

        this.saveTrack = function(modif) {
            if (!document.getElementById('inputIMtitre').value) {
                let n = new jBox('Notice', {
                    content: 'Veuillez saisir un titre',
                    color: 'black',
                    position: {
                        y: 'center',
                        x: 'center'
                    }
                });
                return;
            }
            me.mdWait.open();
            //récupère les données saisies
            let dataTrack = {
                'dcterms:title': document.getElementById('inputIMtitre').value,
                'dcterms:description': document.getElementById('inputIMdesc').value,
                'schema:category': document.getElementById('idCat').value,
                'oa:start': document.getElementById('inputIMdeb').value,
                'oa:end': document.getElementById('inputIMfin').value,
                'schema:color': document.getElementById('inputIMcolorHelp').innerHTML,
                'oa:hasSource': document.getElementById('idSource').value,
                'oa:hasTarget': document.getElementById('idTarget').value,
                'idGroup': document.getElementById('idGroup').value,
                'category': document.getElementById('category').value,
                'dcterms:creator': actant['o:id'],
                'idScenario': me.details.idScenario,
            }
            if (modif) dataTrack.idObj = document.getElementById('idObj').value;

            //récupère les relations    
            sgtProps.forEach(p=>{
                dataTrack[p.p['o:term']]=p.relations.map(r=>{ 
                    //vérifie si la référence est crée ou s'il faut le faire
                    return {'id':r['o:id']}; 
                });
                //vérifie si on récupère une fonction et ses paramètres
                if(p.p['o:term']=="genstory:hasEvenement"){
                    dataTrack[p['o:term']].forEach(r=>{
                        let li = d3.select('#'+p['o:local_name'].substr(3)+'_'+r.id);
                        dataTrack['genstory:hasFonction']=li.select('p').text();
                        li.selectAll('div input').each(function(ipt,i){
                            dataTrack['genstory:hasParam'].push(ipt['o:id'] ? {'id':ipt['o:id']} : ipt.value);                
                        })
                    })
                }            

            })

            //enregistre dans la base
            $.ajax({
                    type: 'POST',
                    dataType: 'json',
                    url: me.urls.creaTrack,
                    data: dataTrack
                }).done(function (data) {
                    if(data.error){
                        new jBox('Notice', {
                            content: data.message,
                            color: 'black',
                            position: {
                                y: 'center',
                                x: 'center'
                            }
                        });    
                    }else{
                        let idLayer = document.getElementById('idLayer').value,
                            idEntry = document.getElementById('idEntry').value;
                        if (!modif) {
                            document.getElementById('idObj').value = data[0]['idObj'];
                            document.getElementById('btnIMmodif').style.display = 'block';
                            document.getElementById('btnIMajout').style.display = 'none';
                            //récupère la clef du layer
                            let layer = me.timeliner.getLayer('name',data[0]['category'])
                            if(!layer.length){
                                layer = me.timeliner.addLayer(data[0]['category'],data[0]['idGroup']);
                            }else layer = layer[0];
                            document.getElementById('idLayer').value = layer.idLayer;
                            //ajout de l'entrée dans le layer
                            document.getElementById('idEntry').value = me.timeliner.addTrack(layer, data[0]);
                            me.timeliner.addTrack(layer, data[1]);
                        }else{
                            me.timeliner.updateTrack("layers:"+idLayer+":values:"+idEntry, data[0]);
                            me.timeliner.updateTrack("layers:"+idLayer+":values:"+(parseInt(idEntry, 10)+1), data[1]);
                        }
                        me.timeliner.repaintAll();
                    }
                })
                .fail(function (e) {
                    new jBox('Notice', {
                        content: me.htmlError,
                        color: 'black',
                        position: {
                            y: 'center',
                            x: 'center'
                        }
                    });    
                    console.log(e);
                })
                .always(function () {
                    me.mdWait.close();
                });
        }

        function getItem(id, cb){
            me.mdWait.open();
            //enregistre dans la base
            $.ajax({
                type: 'GET',
                dataType: 'json',
                url: me.urls.getItem+id
            }).done(function (data) {
                cb(data);
            })
            .fail(function (e) {
                new jBox('Notice', {
                    content: me.htmlError,
                    color: 'black',
                    position: {
                        y: 'center',
                        x: 'center'
                    }
                });    
                console.log(e);                
            })
            .always(function () {
                me.mdWait.close();
            });
        }
        
        function deleteTrack(e) {
            let id = document.getElementById('idObj').value;

            //enregistre dans la base
            $.ajax({
                type: 'POST',
                dataType: 'json',
                url: me.urls.delTrack,
                data: {'id':id}
            }).done(function (data) {
                if(data.error){
                    new jBox('Notice', {
                        content: data.message,
                        color: 'black',
                        position: {
                            y: 'center',
                            x: 'center'
                        }
                    });    
                }else{
                    let idLayer = document.getElementById('idLayer').value,
                        idEntry = document.getElementById('idEntry').value;
                    me.timeliner.deleteTrack(idLayer, idEntry);
                }
            })
            .fail(function (e) {
                new jBox('Notice', {
                    content: me.htmlError,
                    color: 'black',
                    position: {
                        y: 'center',
                        x: 'center'
                    }
                });    
                console.log(e);
            })
            .always(function () {
                me.mdWait.close();
                me.mdEditTrack.close();
            });
        }

        this.secondsToHms = function(seconds) {
            seconds = Number(seconds);
            var h = Math.floor(seconds % (3600 * 24) / 3600);
            var m = Math.floor(seconds % 3600 / 60);
            var s = Math.floor(seconds % 60);
            var mili = (seconds-Math.floor(seconds)).toFixed(2).split('.')[1];
        
            var hDisplay = h > 0 ? (h >= 10 ? h + ":" : "0" + h + ":") : "00:";
            var mDisplay = m > 0 ? (m >= 10 ? m + ":" : "0" + m + ":") : "00:";
            var sDisplay = s > 0 ? (s >= 10 ? s + ":" : "0" + s + ":") : "00:";
            return hDisplay + mDisplay + sDisplay + mili;
        }
                
        this.timelinerPause = function(nodes, links){
            for (const mc in me.mediaCards) {
                if(me.mediaCards[mc].ready){
                    me.mediaCards[mc].video.pause();
                    me.mediaCards[mc].videoIsPaused = true;
                };
            }
        }
        this.timelinerPlay = function(nodes, links){
            for (const mc in me.mediaCards) {
                if(me.mediaCards[mc].ready){
                    me.mediaCards[mc].video.currentTime(me.timeliner.currentTimeStore.value);            
                    me.mediaCards[mc].video.play();
                    me.mediaCards[mc].videoIsPaused = false;
                };
            }
        }

        me.init();

    }
}

  


