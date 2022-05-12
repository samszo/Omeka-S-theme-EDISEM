class reseau {
    constructor(params) {
        var me = this;
        this.cont = params.cont ? params.cont : d3.select("#"+params.idCont);
        this.width = params.width ? params.width : 400;
        this.height = params.height ? params.height : 400;
        this.dataUrl = params.dataUrl ? params.dataUrl : false;
        this.addLegende = params.legende ? params.legende : false;
        this.kId = params.kId ? params.kId : 'id'; //identifiant omeka S
        this.kName = params.kName ? params.kName : 'title'; //title omeka S
        this.data = params.data ? params.data : 	{
            "nodes": [
                {
                "id": "Myriel",
                "group": 1
                },
                {
                "id": "Napoleon",
                "group": 1
                },
            ],
            "links": [
                {
                "source": "Napoleon",
                "target": "Myriel",
                "value": 1
                },
                {
                "source": "Mlle.Baptistine",
                "target": "Myriel",
                "value": 8
                },
            ]
        }; 
        this.fontSize = params.fontSize ? params.fontSize : 12;
        this.mdEditFiltre = new jBox('Modal', {
            width: 480,
            height: 384,
            theme: 'TooltipDark',
            overlay: false,
            title: "Editer le filtre",
            content: $('#mdEditFiltre'),//ATTENTION le formulaire doit être ajouter à la page HTML
            draggable: 'title',
            repositionOnOpen: false,
            repositionOnContent: false,
        });


        var svg, container, link, node, labelNode, color, label
        ,adjlist, labelLayout, graphLayout
        ,objEW, lgdSize, legende, sltGroup=[], colors=[];            


        this.init = function () {
            

            color = d3.scaleOrdinal(d3.schemeCategory10);
            svg = this.cont.append("svg").attr("width", me.width+'px').attr("height", me.height+'px');
            container = svg.append("g");

            initLabel();
            initForce();            
            initAdjList()                
            if(me.addLegende)initLegende();
            
            svg.call(
                d3.zoom()
                    .scaleExtent([.1, 4])
                    .on("zoom", function(event) { container.attr("transform", event.transform); })
            );                

            me.joinDataToGraph();

        }

        function initLegende(){
            lgdSize = {x: 0, y:0, width: me.width-15, height: me.fontSize*3};
            //ajoute la légende
            legende = svg.append('g').attr('id','reseauLegende')
            legende.append('rect')
                .attr("x", 0)
                .attr("y", 0)
                .attr("fill", 'black')
                .attr("height", lgdSize.height*2)
                .attr("width", lgdSize.width)

        }


        function initLabel(){
            label = {
                'nodes': [],
                'links': []
            };
        
            me.data.nodes.forEach(function(d, i) {
                label.nodes.push({node: d});
                label.nodes.push({node: d});
                label.links.push({
                    source: i * 2,
                    target: i * 2 + 1
                });
            });

        }

        function initForce(){
            labelLayout = d3.forceSimulation(label.nodes)
                .force("charge", d3.forceManyBody().strength(-10))
                .force("link", d3.forceLink(label.links).distance(0).strength(2));
        
            graphLayout = d3.forceSimulation(me.data.nodes)
                .force("charge", d3.forceManyBody().strength(-10000))
                .force("center", d3.forceCenter(me.width / 2, me.height / 2))
                .force("x", d3.forceX(me.width / 2).strength(1))
                .force("y", d3.forceY(me.height / 2).strength(1))
                .force("link", d3.forceLink(me.data.links).id(
                    d => d[me.kId]
                    ).distance(50).strength(1))
                .on("tick", ticked);
        }

        function initAdjList(){
            adjlist = [];
    
            me.data.links.forEach(function(d) {
                adjlist[d.source.index + "-" + d.target.index] = true;
                adjlist[d.target.index + "-" + d.source.index] = true;
            });    
        }

        function purgeGraph(){
            container.selectAll(".links").remove();
            container.selectAll(".nodes").remove();
            container.selectAll(".labelNodes").remove();            
        }

        this.joinDataToGraph = function(){
            link = container.append("g").attr("class", "links")
                .selectAll("line")
                .data(me.data.links)
                .enter()
                .append("line")
                .attr("id", l=>'l_'+l.id)
                .attr("stroke", "#aaa")
                .attr("stroke-width", d=>d.size ? d.size : 2);
            
            node = container.append("g").attr("class", "nodes")
                .selectAll("g")
                .data(me.data.nodes)
                .enter()
                .append("circle")
                .attr("id", n=>'n_'+n.id)
                .attr("r", function(d) { 
                    return d.size ? d.size : 5; 
                })
                .attr("fill", function(d) { 
                    return d.color ? d.color : color(d.group); 
                })
                .style('cursor',d=>d.fct ? 'pointer' : 'none');                
            /*problème avc le mousedown sur les noeuds    
            node.call(
                d3.drag()
                    .on("start", dragstarted)
                    .on("drag", dragged)
                    .on("end", dragended)
            );
            */
            
            labelNode = container.append("g").attr("class", "labelNodes")
                .selectAll("text")
                .data(label.nodes)
                .enter()
                .append("text")
                .text(function(d, i) { 
                    let txt = d.node[me.kName] ? d.node[me.kName] : d.node[me.kId];
                    return i % 2 == 0 ? "" : txt; 
                })
                .attr("fill", function(d) { 
                    return d.node.color ? d.node.color : color(d.node.txtColor ? d.node.txtColor : 1); 
                })
                .style("font-family", "Arial")
                .style("font-size", 12)
                .style("pointer-events", "none"); // to prevent mouseover/drag capture
            
            node.on("mouseover", focus).on("mouseout", unfocus);
            node.on("click", (e,d)=>{
                d.fct ? d.fct.click ? d.fct.click(e,d) : null : null
            });
            node.on("mousedown", (e,d)=>{
                d.fct ? d.fct.mousedown ? d.fct.mousedown(e,d) : null : null
            });
            node.on("mouseup", (e,d)=>{
                d.fct ? d.fct.mouseup ? d.fct.mouseup(e,d) : null : null
            });

            //ajoute la légende
            if(me.addLegende){
                addLegende('noeuds', me.data.nodes,{y:0});
                addLegende('liens', me.data.links,{y:lgdSize.height/2});    
            }

        }


        function addLegende(nom, data,ori){
            let types = Array.from(d3.group(data, d => d.group).keys()).map((k,i)=>{return {'n':k,'i':i,'t':nom, 'idFiltre':'filter'+nom+i};});

            types.unshift(nom+' : ');              
            let scaleLgdHori = d3
              .scaleBand()
              //.paddingInner(0.2)
              .domain(types.map(t=>t.n))
              .range([lgdSize.x, lgdSize.width]);            
            let itemsLgd = legende.selectAll('.ilgd'+nom).data(types).enter()
                .append('g').attr('class','ilgd'+nom)
                .style("cursor","pointer")
                .on('click',selectGroup);
            itemsLgd.append('rect')         
              .attr("x", d => scaleLgdHori(d.n))
              .attr("y", ori.y+lgdSize.height/4)
              .attr("fill", (d,i) => i==0 ? 'black' : getColor(d.n))
              .attr("height", lgdSize.height/2)
              .attr("width", scaleLgdHori.bandwidth());
            let t = itemsLgd.append('text')         
              .attr("x", (d,i) => i==0 ? scaleLgdHori(d.n) : scaleLgdHori(d.n)+scaleLgdHori.bandwidth()/2)
              .attr("y", ori.y+lgdSize.height/2 + me.fontSize/2)
              .attr("text-anchor", (d,i) => i==0 ? "start" : "middle")
              .attr("font-size", me.fontSize)
              .style("fill", "white")
              .text(d => d.n)
            //ajoute le bouton de filtre
            itemsLgd.append('svg').attr('viewBox','0 0 512 512')
                .attr("id", (d,i) => i==0 ? 'no' : d.idFiltre)
                .attr("x", d => scaleLgdHori(d.n))
                .attr("y", ori.y+lgdSize.height/4)
                .attr("height", lgdSize.height/2)
                .attr("width", lgdSize.height/2)
                .append('path')
                .attr('d',(d,i)=> i==0 ? '': 'M3.853 54.87C10.47 40.9 24.54 32 40 32H472C487.5 32 501.5 40.9 508.1 54.87C514.8 68.84 512.7 85.37 502.1 97.33L320 320.9V448C320 460.1 313.2 471.2 302.3 476.6C291.5 482 278.5 480.9 268.8 473.6L204.8 425.6C196.7 419.6 192 410.1 192 400V320.9L9.042 97.33C-.745 85.37-2.765 68.84 3.854 54.87L3.853 54.87z');
            itemsLgd.append('svg').attr('viewBox','0 0 576 512')
                .attr("id", d => 'afilter'+d.t+d.i)
                .attr("x", d => scaleLgdHori(d.n))
                .attr("y", ori.y+lgdSize.height/4)
                .attr("height", lgdSize.height/2)
                .attr("width", lgdSize.height/2)
                .attr("visibility", 'hidden')
                .append('path')
                .attr('d',(d,i)=> i==0 ? '': 'M3.853 22.87C10.47 8.904 24.54 0 40 0H472C487.5 0 501.5 8.904 508.1 22.87C514.8 36.84 512.7 53.37 502.1 65.33L396.4 195.6C316.2 212.1 255.1 283 255.1 368C255.1 395.4 262.3 421.4 273.5 444.5C271.8 443.7 270.3 442.7 268.8 441.6L204.8 393.6C196.7 387.6 192 378.1 192 368V288.9L9.042 65.33C-.745 53.37-2.765 36.84 3.854 22.87H3.853zM287.1 368C287.1 288.5 352.5 224 432 224C511.5 224 576 288.5 576 368C576 447.5 511.5 512 432 512C352.5 512 287.1 447.5 287.1 368zM491.3 331.3C497.6 325.1 497.6 314.9 491.3 308.7C485.1 302.4 474.9 302.4 468.7 308.7L432 345.4L395.3 308.7C389.1 302.4 378.9 302.4 372.7 308.7C366.4 314.9 366.4 325.1 372.7 331.3L409.4 368L372.7 404.7C366.4 410.9 366.4 421.1 372.7 427.3C378.9 433.6 389.1 433.6 395.3 427.3L432 390.6L468.7 427.3C474.9 433.6 485.1 433.6 491.3 427.3C497.6 421.1 497.6 410.9 491.3 404.7L454.6 368L491.3 331.3z')
        }

        function getColor(key){
            let c = "#aaa";            
            if(key){
                c = colors[key] ? colors[key] : color(key); 
            }
            return c;
        }


        function selectGroup(e,d){
            if(!sltGroup[d])sltGroup[d]='hidden';
            else sltGroup[d]= sltGroup[d]=='hidden' ? 'visible' : 'hidden';

            //gestion des boutons de filtre
            d3.select('#'+d.idFiltre).attr('visibility', sltGroup[d]);
            d3.select('#a'+d.idFiltre).attr('visibility', sltGroup[d]=='hidden' ? 'visible' : 'hidden');

            //on cache les noeuds, liens et textes
            link.each(l=>{
                if(l.group==d)d3.select(this).attr('visibility',sltGroup[d]);
            })
            node.each(n=>{
                if(n.group==d){
                    d3.select(this).attr('visibility',sltGroup[d]);
                    showHideNodeLine(n);
                }
            })
            labelNode.each(ln=>{
                if(ln.group==d)d3.select(this).attr('visibility',sltGroup[d]);
            })
            //d3.selectAll('.n_'+d.replace(':','-')).attr('visibility',sltGroup[d]).each(showHideNodeLine);
            //d3.selectAll('.l_'+d.replace(':','-')).attr('visibility',sltGroup[d]);
            //d3.selectAll('.t_'+d.replace(':','-')).attr('visibility',sltGroup[d]);
        }
        function showHideNodeLine(d){
            link.attr("visibility", o => o.source.index == d.index || o.target.index == d.index ? 'visible' : sltGroup[d.group]);
        }


        this.update = function(newdata){
            labelLayout.stop();
            graphLayout.stop();


            // Make a shallow copy to protect against mutation, while
            // recycling old nodes to preserve position and velocity.
            const oldNodes = new Map(me.data.nodes.map(d => [d.id, d]));
            me.data.nodes = newdata.nodes.map(d => Object.assign(oldNodes.get(d.id) || {}, d));

            const oldLinks = new Map(me.data.links.map(d => [d.id, d]));
            me.data.links = newdata.links.map(d => Object.assign(oldLinks.get(d.id) || {}, d));
        

            initLabel();
            initForce();                    
            initAdjList()


            purgeGraph();
            me.joinDataToGraph();

            labelLayout.restart();
            graphLayout.restart();
            
        }

        this.hide = function(){
          svg.attr('visibility',"hidden");
        }
        this.show = function(){
          svg.attr('visibility',"visible");
        }

        function neigh(a, b) {
            return a == b || adjlist[a + "-" + b];
        }
        
        function ticked() {
        
            node.call(updateNode);
            link.call(updateLink);
        
            labelLayout.alphaTarget(0.3).restart();
            labelNode.each(function(d, i) {
                if(i % 2 == 0) {
                    d.x = d.node.x;
                    d.y = d.node.y;
                } else {
                    var b = this.getBBox();
        
                    var diffX = d.x - d.node.x;
                    var diffY = d.y - d.node.y;
        
                    var dist = Math.sqrt(diffX * diffX + diffY * diffY);
        
                    var shiftX = b.width * (diffX - dist) / (dist * 2);
                    shiftX = Math.max(-b.width, Math.min(0, shiftX));
                    var shiftY = 16;
                    this.setAttribute("transform", "translate(" + shiftX + "," + shiftY + ")");
                }
            });
            labelNode.call(updateNode);
        
        }
        
        function fixna(x) {
            if (isFinite(x)) return x;
            return 0;
        }
        
        function focus(event, d) {
            if(d.fct && d.fct.mouseover) d.fct.mouseover(event,d);

            var index = d3.select(event.target).datum().index;
            node.style("opacity", function(o) {
                return neigh(index, o.index) ? 1 : 0.1;
            });
            labelNode.attr("display", function(o) {
                return neigh(index, o.node.index) ? "block": "none";
            });
            link.style("opacity", function(o) {
                return o.source.index == index || o.target.index == index ? 1 : 0.1;
            });
        }
        
        function unfocus(event, d) {
            if(d.fct && d.fct.mouseout) d.fct.mouseout(event,d);
            labelNode.attr("display", "block");
            node.style("opacity", 1);
            link.style("opacity", 1);
        }
        
        function updateLink(link) {
            link.attr("x1", function(d) { return fixna(d.source.x); })
                .attr("y1", function(d) { return fixna(d.source.y); })
                .attr("x2", function(d) { return fixna(d.target.x); })
                .attr("y2", function(d) { return fixna(d.target.y); });
        }
        
        function updateNode(node) {
            node.attr("transform", function(d) {
                return "translate(" + fixna(d.x) + "," + fixna(d.y) + ")";
            });
        }
        
        function dragstarted(event, d) {
            event.sourceEvent.stopPropagation();
            if (!event.active) graphLayout.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
        }
        
        function dragged(event, d) {
            d.fx = event.x;
            d.fy = event.y;
        }
        
        function dragended(event, d) {
            if (!event.active) graphLayout.alphaTarget(0);
            d.fx = null;
            d.fy = null;
        }              

        if(me.dataUrl){
            d3.json(me.dataUrl).then(function(graph) {
                me.data = graph;
                me.init();
            });    
        }else{
            me.init();
        }

    }
}

  


