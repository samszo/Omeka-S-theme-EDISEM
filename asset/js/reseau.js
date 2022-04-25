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
            let types = Array.from(d3.group(data, d => d.group).keys());

            types.unshift(nom+' : ');              
            let scaleLgdHori = d3
              .scaleBand()
              //.paddingInner(0.2)
              .domain(types)
              .range([lgdSize.x, lgdSize.width]);            
            let itemsLgd = legende.selectAll('.ilgd'+nom).data(types).enter()
                .append('g').attr('class','ilgd'+nom)
                .style("cursor","pointer")
                .on('click',selectGroup);
            itemsLgd.append('rect')         
              .attr("x", d => scaleLgdHori(d))
              .attr("y", ori.y+lgdSize.height/4)
              .attr("fill", (d,i) => i==0 ? 'black' : getColor(d))
              .attr("height", lgdSize.height/2)
              .attr("width", scaleLgdHori.bandwidth());
            itemsLgd.append('text')         
              .attr("x", (d,i) => i==0 ? scaleLgdHori(d) : scaleLgdHori(d)+scaleLgdHori.bandwidth()/2)
              .attr("y", ori.y+lgdSize.height/2 + me.fontSize/2)
              .attr("text-anchor", (d,i) => i==0 ? "start" : "middle")
              .attr("font-size", me.fontSize)
              .style("fill", "white")
              .text(d => d);
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
            else
                sltGroup[d]=sltGroup[d]=='hidden' ? 'visible' : 'hidden';
            //on change le bouton
            d3.select(e.target.parentNode.firstChild).attr('fill', sltGroup[d]=='hidden' ? 'black' : color(d));
            //on cache les noeuds, liens et textes
            d3.selectAll('.n_'+d.replace(':','-')).attr('visibility',sltGroup[d]).each(showHideNodeLine);
            d3.selectAll('.l_'+d.replace(':','-')).attr('visibility',sltGroup[d]);
            d3.selectAll('.t_'+d.replace(':','-')).attr('visibility',sltGroup[d]);
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

  


