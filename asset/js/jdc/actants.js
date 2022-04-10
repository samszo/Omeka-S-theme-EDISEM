//récupère les clefs des actants
let actants, actantKey, actantColor, actantBand, actantWidth = 400;

function initActants(data, container){
    if(!data.length)return;
    actants = data
    //récupère les clefs des actants
    actantKey = actant.map(d => d.id);
    //attribution des couleurs
    actantColor = d3.scaleOrdinal(actantKey, d3.schemeCategory10);
    actants.forEach(d=>d.color = d.color ? d.color : ActantColor(d.id));

    actantBand = d3.scaleBand()
        .domain(actantKey)
        .paddingInner(0.5) // edit the inner padding value in [0,1]
        .paddingOuter(0.5) // edit the outer padding value in [0,1]                
        .range([0, actantWidth])
        .align(0.5)            
    let actantG = container.selectAll('.jdcActantG').data(actants).enter()
            .append('g').attr('id',d=>'jdcActant_'+d.id).attr('class','jdcActantG')
        .attr("transform", d => `translate(${actantBand(d.id)+actantBand.bandwidth()/2},${dimsBand('Actant')+dimsBand.bandwidth()/2})`)
        .on('click',console.log)
    , hexbin = d3.hexbin()
        .radius(actantWidth/4);
    //ajoute les hexagones
    actantG.append("path")
        .attr('id',d=>'ActantPath_'+d.id)
        .attr('class','ActantPath')
        .attr("d", hexbin.hexagon())
        .attr("fill", d=>d.color);
    //ajoute les titres
    actantG.append("clipPath")
        .attr("id", d => d.clipUid = "clip"+d.id)
        .append("use")
        .attr("xlink:href", d => '#ActantPath_'+d.id);
    
    actantG.append("text")
        .attr('id',d=>'ActantText_'+d.id)
        .attr('class','ActantText')
        .attr("clip-path", d => d.clipUid)
        .selectAll("tspan")
        .data(d => d['o:title'].split(/(?=[A-Z][a-z])|\s+/g))
        .join("tspan")
        .attr("x", 0)
        .attr("y", (d, i, nodes) => `${i - nodes.length / 2 + 0.8}em`)
        .attr('text-anchor','middle')
        .text(d=>d);
}