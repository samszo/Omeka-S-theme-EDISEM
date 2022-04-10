let semSelect = {},
    timeliner, currentScenario, mediaCards = {}, tracks = [],
    currentSource, currentMedia, videoIndex = [],
    mdWait, mdEditIndex, mdAjoutLayer, mdAddScenario,
    listeDetails = d3.select('#listeDetails'),
    htmlError = '<p>ERREUR !</p>'
    +'<p><i class="fa-solid fa-bug"></i><i class="fa-solid fa-bug"></i><i class="fa-solid fa-bug"></i></p>'
    +'<p>Merci de contacter le responsable</>';


function initVisios() {
    showListeScenario();
    //gestion des boutons
    d3.select('#btnAjoutScenario').on('click', function (e) {
        mdAddScenario.open();
    });
    d3.select('#btnIMajout').on('click', function (e) {
        saveIndex();
    });
    d3.select('#btnIMmodif').on('click', function (e) {
        saveIndex(true);
    });
    d3.select('#btnAjoutCategory').on('click', function (e) {
        addCategory();
    });
    d3.select('#btnSelectCategory').on('click', function (e) {        
        selectCategory();
    });
    d3.select('#btnSccreate').on('click', function (e) {
        createScenario(true);
    });    
    
    mdAjoutLayer = new jBox('Modal', {
        width: 200,
        height: 100,
        title: 'Ajouter une couche',
        width: 480,
        height: 260,
        theme: 'TooltipDark',
        overlay: false,
        content: $('#mdAjoutLayer'),
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
    mdAddScenario = new jBox('Modal', {
        width: 480,
        height: 384,
        theme: 'TooltipDark',
        overlay: false,
        title: "Add scenario",
        content: $('#mdAddScenario'),
        draggable: 'title',
        repositionOnOpen: false,
        repositionOnContent: false
    });

    mdWait = new jBox('Modal', {
        width: 200,
        height: 100,
        title: 'Patience...',
        content: '<div class="loading">' +
        '<p style="width:150px" >Merci de patienter...</p>' +
        '</div>'
    });
    mdEditIndex = new jBox('Modal', {
        width: 480,
        height: 384,
        theme: 'TooltipDark',
        overlay: false,
        title: "Edition de l'annotation",
        content: $('#mdEditIndex'),
        draggable: 'title',
        repositionOnOpen: false,
        repositionOnContent: false,
    });
}

function createScenario() {
    mdWait.open();
    //récupère les données saisies
    let dataScena = {
        'dcterms:title': document.getElementById('inputSctitre').value,
        'dcterms:description': document.getElementById('inputScdesc').value,
        'dcterms:creator': actant['o:id'],
        'item_id':[]
    }
    seminairesToScenario.forEach(s=>dataScena['item_id'].push(s['o:id']));
    //enregistre dans la base
    $.ajax({
            type: 'POST',
            dataType: 'json',
            url: urlSite + '/page/ajax?helper=Scenario&type=genereScenario&json=1&gen=global',
            data: dataScena
        }).done(function (data) {
            itemsScenario.push(data);
            showListeScenario();  
            chargeScenario(null, data);
        })
        .fail(function (e) {
            console.log(e);
        })
        .always(function () {
            mdWait.close();
        });
}


function selectCategory(){
    let idGroup = document.getElementById('ajoutLayerIdCat').value;
    let lblLayer = document.getElementById('ajoutLayerLblCat').value;
    idGroup += '_'+actant['o:id'];
    lblLayer += ' : '+actant['o:title'];
    timeliner.addLayer(lblLayer,idGroup);
    timeliner.repaintAll();
    mdAjoutLayer.close();
}
function addCategory(){
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
        timeliner.addLayer(data['o:title']+' : '+actant['o:title'],data['o:id']+'_'+actant['o:id']);
        timeliner.repaintAll();
    })
    .fail(function (e) {
        new jBox('Notice', {
            content: htmlError,
            color: 'black',
            position: {
                y: 'center',
                x: 'center'
            }
        });    
    console.log(e);
    })
    .always(function () {
        mdAjoutLayer.close();
    });
}

//fonction spécifiques à la page  
function saveIndex(modif) {
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
    mdWait.open();
    //récupère les données saisies
    let dataIndex = {
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
    }
    if (modif) dataIndex.idIndex = document.getElementById('idIndex').value;

    //enregistre dans la base
    $.ajax({
            type: 'POST',
            dataType: 'json',
            url: urlSite + '/page/ajax?helper=Scenario&type=saveIndex&json=1',
            data: dataIndex
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
                    document.getElementById('idIndex').value = data[0]['idIndex'];
                    document.getElementById('btnIMmodif').style.display = 'block';
                    document.getElementById('btnIMajout').style.display = 'none';
                    //récupère la clef du layer
                    layer = timeliner.getLayer('name',data[0]['category'])
                    if(!layer.length){
                        layer = timeliner.addLayer(data[0]['category'],data[0]['idGroup']);
                    }else layer = layer[0];
                    document.getElementById('idLayer').value = layer.idLayer;
                    //ajout de l'entrée dans le layer
                    document.getElementById('idEntry').value = timeliner.addTrack(layer, data[0]);
                    timeliner.addTrack(layer, data[1]);
                }else{
                    timeliner.updateTrack("layers:"+idLayer+":values:"+idEntry, data[0]);
                    timeliner.updateTrack("layers:"+idLayer+":values:"+(parseInt(idEntry, 10)+1), data[1]);
                }
                timeliner.repaintAll();
            }
        })
        .fail(function (e) {
            new jBox('Notice', {
                content: htmlError,
                color: 'black',
                position: {
                    y: 'center',
                    x: 'center'
                }
            });    
            console.log(e);
        })
        .always(function () {
            mdWait.close();
        });
}

function showListeScenario() {
    d3.select('#ddmListeScenario').selectAll('li').remove();
    d3.select('#ddmListeScenario').selectAll('li').data(itemsScenario).enter().append('li').append('a')
        .attr("class", "dropdown-item")
        .html((s, i) => {
            return s['o:title'];
        })
        .on('click', chargeScenario);
}

function chargeScenario(e, d) {
    //supprime les médias cards
    d3.select("#mediaCards").selectAll("div").remove();
    d3.select("#btnCurrentScenario").text('...');

    currentScenario = new scenario({
        'resource':d,
        'actant':actant,    
        'url': urlSite + '/page/ajax?helper=Scenario&type=genereScenario&json=1&gen=fromUti',
    })
}

function getActants(data) {
    let actants = [], dbl =[];
    layers.forEach(l=>{
        l.values.forEach(v=>{
            if(!dbl[v["dcterms:creator"][0]["o:id"]]){
                actants.push(v["dcterms:creator"][0]);
                dbl[v["dcterms:creator"][0]["o:id"]]=1;
            }
        });
    });
}



function initReseau(container, d){
    let data = getConceptGraphData(d);
    d.r = new reseau({'cont':container
        ,'width':400,'height':300
        ,'data':data});
}
function getConceptGraphData(data){
    //récupère le reseau de la branche du concept
    let conceptGraph = {'nodes':[],'links':[]}
    //ajoute le createur
    conceptGraph['nodes'].push({id: data["dcterms:creator"][0]["o:id"], size: 1
        , txtColor: 1
        , group: 'creator'
        , size: 5
        , fct: false
        , title: data["dcterms:creator"][0]["o:title"]}); 
    //ajoute le layer
    conceptGraph['nodes'].push({id: data.idCat, size: 1
        , txtColor: 10
        , group: 'category'
        , size: 5
        , fct: false
        , title: data.category.split(' : ')[0]}); 
    //ajoute le text
    conceptGraph['nodes'].push({id: data.idObj, size: 1
        , txtColor: 10
        , group: data.prop
        , size: 5
        , fct: false
        , title: data.text}); 
    //ajoute les liens 
    conceptGraph['links'].push({target: data.idCat
            , source: data["dcterms:creator"][0]["o:id"], value: 1
            , txtColor: 1
            , group: "branche"});  
    conceptGraph['links'].push({target: data.idObj
        , source: data.idCat, value: 1
        , txtColor: 1
        , group: "branche"});  
        return conceptGraph;
}
function updateConceptGraphData(r, data){
    //récupère le reseau de la branche du concept
    let conceptGraph = {'nodes':[],'links':[]}
    //ajoute le createur
    conceptGraph['nodes'].push({id: data["dcterms:creator"][0]["o:id"], size: 1
        , txtColor: 1
        , group: 'creator'
        , size: 5
        , fct: false
        , title: data["dcterms:creator"][0]["o:title"]}); 
    //ajoute le layer
    conceptGraph['nodes'].push({id: data.idCat, size: 1
        , txtColor: 10
        , group: 'category'
        , size: 5
        , fct: false
        , title: data.category.split(' : ')[0]}); 
    //ajoute le text
    conceptGraph['nodes'].push({id: data.idObj, size: 1
        , txtColor: 10
        , group: data.prop
        , size: 5
        , fct: false
        , title: data.text}); 
    //ajoute les liens 
    conceptGraph['links'].push({target: data.idCat
            , source: data["dcterms:creator"][0]["o:id"], value: 1
            , txtColor: 1
            , group: "branche"});  
    conceptGraph['links'].push({target: data.idObj
        , source: data.idCat, value: 1
        , txtColor: 1
        , group: "branche"});  
        return conceptGraph;    
}


function joinVideoIndex(id, p) {
    if (videoIndex[id]){
        videoIndex[id].p = p;
        videoIndex[id].a = 'u';
    } else {
        videoIndex[id]={'p':p,'a':'c'};
        //vérifie s'il faut créer le média
        //let idTarget = videoIndex[id].p.value.entry.idTarget;
        let idTarget = videoIndex[id].p.value.entry["oa:hasTarget"][0]["o:id"];
        if (!mediaCards[idTarget]) createMediaCard(videoIndex[id]);
        mediaCards[idTarget].index.push(videoIndex[id]);
    }
}


function showVideoIndex(s) {
    for (const mc in mediaCards) {
        let d = mediaCards[mc];
        if (d.ready) {
            if(timeliner.isPlaying()){
                if (d.videoIsPaused){
                    d.video.play();
                    d.videoIsPaused = false;
                    //synchronise le timeliner et la vidéo avec une tolérance pour éviter les coupures
                    if (Math.trunc(d.video.currentTime()) != Math.trunc(s)) d.video.currentTime(s);
                }
            }else{
                d.video.pause();
                d.videoIsPaused = true;                
                //synchronise le timeliner et la vidéo avec une tolérance pour éviter les coupures
                if (Math.trunc(d.video.currentTime()) != Math.trunc(s)) d.video.currentTime(s);
            }
        }
        //affiche les details
        showDetails(d);
    }
}
function timelinerPause(){
    for (const mc in mediaCards) {
        if(mediaCards[mc].ready){
            mediaCards[mc].video.pause();
            mediaCards[mc].videoIsPaused = true;
        };
    }
};
function timelinerPlay(){
    for (const mc in mediaCards) {
        if(mediaCards[mc].ready){
            mediaCards[mc].video.currentTime(timeliner.currentTimeStore.value);            
            mediaCards[mc].video.play();
            mediaCards[mc].videoIsPaused = false;
        };
    }
};


function createMediaCard(entry) {


    let m = {};
    m.card = d3.select("#mediaCards").append("div")
        .attr('id', 'cardVideo' + entry["oa:hasTarget"][0]["o:id"])
        .attr("class", "card text-white bg-dark");

    //carte annotation droite vidéo gauche
    let rowCard = m.card.append('div').attr('class', 'row g-0');
    let colAnno = rowCard.append('div').attr('class', 'col-md-6');
    m.idBody = "cardBody"+entry["oa:hasTarget"][0]["o:id"];
    m.body = colAnno.append('div')
        .attr("id", m.idBody)
        .attr("class", "card-body");
    let colVideo = rowCard.append('div').attr('class', 'col-md-6');
    colVideo.append('h5').html(entry['nameTarget']);
    appendVideoToMediaCard(m, entry, colVideo.append('video'));

    /*construction du body = liste des annotations
    m.body.append('h5')
        .attr("class", "card-title").html("Annotations");
    m.idListeDetails = "listeDetails" + d["oa:hasTarget"][0]["o:id"];
    m.listeDetails = m.body.append('ul')
        .attr("class", "list-group listeDetails")
        .attr("id", d.idListeDetails);
    */

    //construction du body = réseau de lien
    initReseau(m.body,entry);
    
    //construction du tag cloud
    //m.tc = TagCloud('#'+m.idBody, [d.text]);

    m.entries = [];
    mediaCards[d["oa:hasTarget"][0]["o:id"]] = m;

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
        controls:false
    })
    m.video.src({
        type: d["oa:hasTarget"][0]["o:media_type"],
        src: d["oa:hasTarget"][0]["o:original_url"]
    });
    m.video.ready(function () {
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

function getChildrenIds(s) {
    let ids = [];
    if (s.hasChildNodes()) {
        s.childNodes.forEach(c => ids.push(c.id));
    }
    return ids;
}

function notContainedCard(arr) {
    return function arrNotContains(e) {
        return arr.indexOf('cardVideo' + e[0]) === -1;
    };
}

function hideDetails(ids) {
    listeDetails.select('#detailIndex_' + d.idObj).style('display', 'none');
}

function showDetails(d) {
    if(d.listeDetails=== undefined)return;
    let dataIndex = d.index.filter(i => i.a == 'c' || i.a == 'u');
    //d.listeDetails.selectAll("li").remove();
    d.listeDetails.selectAll("li").data(dataIndex)
        .join(
            enter => {
                let aSem = enter.append('li').attr('class', 'list-group-item')
                    .attr("id", d => 'detailIndex_' + d.p.value.entry.idObj)
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
                        .on('click', editDetail)
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
                    return 'detailIndex_' + d.p.value.entry.idObj
                });
                if(actant){
                    update.select('.btnEdit').on('click', editDetail);
                }
                update.select('h6').style('color', d => d.p.value.entry._color).html(d => d.p.value.entry.category);
                update.select('p').html(d => d.p.value.entry.text);
            },
            exit => exit.remove()
        );
}

function editDetail(e, data, entry) {
    let d = data ? data.p.value.entry : entry;
    mdEditIndex.setTitle(d.category + ' : ' + d.idObj);
    document.getElementById('inputIMtitre').value = d.text;
    document.getElementById('inputIMdesc').value = d.desc ? d.desc : "";
    document.getElementById('inputIMdeb').value = d.time;
    document.getElementById('inputIMdebHelp').innerHTML = secondsToHms(d.time);
    document.getElementById('inputIMfin').value = d.timeEnd;
    document.getElementById('inputIMfinHelp').innerHTML = secondsToHms(d.timeEnd);
    document.getElementById('inputIMcolor').value = d3.color(d._color).formatHex();
    document.getElementById('inputIMcolorHelp').innerHTML = d._color;
    document.getElementById('idCat').value = d.idCat;
    document.getElementById('idIndex').value = d.idObj;
    document.getElementById('category').value = d.category;
    document.getElementById('idGroup').value = d.idGroup;
    document.getElementById('idSource').value = d["oa:hasSource"] ? d["oa:hasSource"][0]["o:id"] : "";
    document.getElementById('idTarget').value = d["oa:hasTarget"] ? d["oa:hasTarget"][0]["o:id"] : "";
    document.getElementById('idLayer').value = data ? data.p.idLayer : entry.idLayer;
    document.getElementById('idEntry').value = data ? d.value.idEntry : entry.idEntry;
    if (d.idTarget) {
        //masque le sélectionneur de média
        document.getElementById('choixMedia').style.display = 'none';
        document.getElementById('btnIMajout').style.display = 'none';
        document.getElementById('btnIMmodif').style.display = 'block';
    } else {
        //affiche le sélectionneur de média
        document.getElementById('choixMedia').style.display = 'block';
        document.getElementById('btnIMajout').style.display = 'block';
        document.getElementById('btnIMmodif').style.display = 'none';
    }
    //vérifie si l'utilisateur à le droit de modifier
    if(d["dcterms:creator"][0]["o:id"] != actant["o:id"]){
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
    mdEditIndex.open();

}
function addLayer(cb){
    if(!actant){
        new jBox('Notice', {
            content: "Vous n'avez pas le droit de créer une couche",
            color: 'black',
            position: {
                y: 'center',
                x: 'center'
            }
        });
    }else mdAjoutLayer.open();
}

function addKeyframe(l, v, o) {
    //console.log(l);
    let idCat = l.id.split('_')[0];
    editDetail(null,null, {
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

function changeKeyframe(l,v){   
    let entry = v.object;
    if(!entry.idObj){
        let te = entry.time;
        entry = l.values[v.index-1];
        entry.idEntry=v.index-1;
        entry.idLayer=v.object.idLayer;
        entry.timeEnd = te;
    }
    editDetail(null, null, entry);
}

function secondsToHms(seconds) {
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

function deleteDetail(e, d) {
    console.log(d);
}

