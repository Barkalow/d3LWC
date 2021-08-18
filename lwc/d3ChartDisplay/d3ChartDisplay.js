import { LightningElement,api,wire,track } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { loadScript } from 'lightning/platformResourceLoader';
import D3 from '@salesforce/resourceUrl/d3';
import createData from '@salesforce/apex/d3Chart.createLWCChart';

export default class D3ChartDisplay extends LightningElement {
    @api chartId;
    @api chartType;
    d3Initialized = false;
    @track error;
    result;
    @track cData;
    @api svgHeight;
    @api svgWidth;
    @api colorTheme;
    @api colorCode;

    @wire(createData,{parentSchemaId: '$chartId', chartType: '$chartType'})
    crData({error, data}) {
        if (data) {
            //console.log(data);
            this.cData = JSON.parse(data);

            if(this.chartType == 'Treemap'){
                this.treemapChart();
            }else if(this.chartType == 'Bar Chart'){
                this.barChart();
            }else if(this.chartType == 'Indented Tree'){
                this.indentTree();
            }else if(this.chartType == 'Line Chart'){
                this.lineChart();
            }
        } else if (error) {
            console.log('cE: ',error);
            this.error = 'Unknown error';
            if (Array.isArray(error.body)) {
                this.error = error.body.map(e => e.message).join(', ');
            } else if (typeof error.body.message === 'string') {
                this.error = error.body.message;
            }
        }
    }

    renderedCallback() {
        if (this.d3Initialized) {
            return;
        }
        this.d3Initialized = true;
        //this.svgHeight = 1500;
        //this.svgWidth = 1500;
        
        Promise.all([
            loadScript(this, D3 + '/d3.v5.min.js')
        ])
        .then(() => {    
                console.log('chartId: ',this.chartId);   
            })
            .catch((error) => {
                console.log('error: ' + error);
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Error loading D3',
                        message: error.message,
                        variant: 'error'
                    })
                );
            });
    }

    colorF(){
        var colorT = this.colorTheme;
        var c;
        if(colorT == 'Google'){
            c = ['#3366CC','#DC3912','#FF9900','#109618','#990099','#3B3EAC','#0099C6','#DD4477','#66AA00','#B82E2E','#316395','#994499','#22AA99','#AAAA11','#6633CC','#E67300','#8B0707','#329262','#5574A6','#3B3EAC'];
            return c;
        }else if(colorT == 'Pale'){
            c = d3.scaleOrdinal(d3.schemeSet2);
            return c;
        }else if(colorT == 'Pale 2'){                    
            c = d3.scaleOrdinal(d3.schemeSet3);
            return c;
        }else if(colorT == 'Dark'){                    
            c = d3.scaleOrdinal(d3.schemeDark2);
            return c;
        }else if(colorT == 'Accent'){                    
            c = d3.scaleOrdinal(d3.schemeAccent);
            return c;
        }else if(colorT == 'Tableau'){                    
            c = d3.scaleOrdinal(d3.schemeTableau10);
            return c;
        }else if(colorT == 'Pastel'){                    
            c = d3.scaleOrdinal(d3.schemePastel1);
            return c;
        }else if(colorT == 'Solid'){                    
            return this.colorCode;
        }

        c = d3.scaleOrdinal(d3.schemePastel1);
        return c;
    } 

    colorL(){
        var colorT = this.colorTheme;
        if(colorT == 'Google'){
            return this.colorF().length;
        }else if(colorT == 'Pale'){
            return d3.schemeSet2.length;
        }else if(colorT == 'Pale 2'){            
            return d3.schemeSet3.length;
        }else if(colorT == 'Dark'){                 
            return d3.schemeDark2.length;
        }else if(colorT == 'Accent'){               
            return d3.schemeAccent.length;
        }else if(colorT == 'Tableau'){                 
            return d3.schemeTableau10.length;
        }else if(colorT == 'Pastel'){                
            return d3.schemePastel1.length;
        }else if(colorT == 'Solid'){                
            return 1;
        }
    }

    colorA(){
        var colorT = this.colorTheme;
        if(colorT == 'Google'){
            return this.colorF().length;
        }else if(colorT == 'Pale'){
            return d3.schemeSet2;
        }else if(colorT == 'Pale 2'){            
            return d3.schemeSet3;
        }else if(colorT == 'Dark'){                 
            return d3.schemeDark2;
        }else if(colorT == 'Accent'){               
            return d3.schemeAccent;
        }else if(colorT == 'Tableau'){                 
            return d3.schemeTableau10;
        }else if(colorT == 'Pastel'){                
            return d3.schemePastel1;
        }else if(colorT == 'Solid'){   
            var a = [];
            a.push(this.colorCode);
            return a;
        }
    }

    treemapChart() {
        var height = this.svgHeight;
        var width = this.svgWidth;
        const svg = d3.select(this.template.querySelector('svg.d3'));
        var _self = this;

        console.log('height: ' + height);
        console.log('width: ' + width);

        function tile(node, x0, y0, x1, y1) {
            d3.treemapBinary(node, 0, 0, width, height);
            for (const child of node.children) {
                child.x0 = x0 + child.x0 / width * (x1 - x0);
                child.x1 = x0 + child.x1 / width * (x1 - x0);
                child.y0 = y0 + child.y0 / height * (y1 - y0);
                child.y1 = y0 + child.y1 / height * (y1 - y0);
            }
        }

        function treemap(data){
            return d3.treemap()
                    .tile(tile)
                (d3.hierarchy(data)
                    .sum(d => d.value)
                    .sort((a, b) => b.value - a.value))
        }

        const x = d3.scaleLinear().rangeRound([0, width]);
        const y = d3.scaleLinear().rangeRound([0, height]);

        svg.attr("viewBox", [0.5, -30.5, width - 30, height + 30])
            .style("font", "10px sans-serif");

        let group = svg.append("g").call(render, treemap(this.cData));

        function render(group, root) {
            function name(d){
                return d.ancestors().reverse().map(d => d.data.name).join(" - ")
            }

            var color = _self.colorF();

            const node = group
            .selectAll("g")
            .data(root.children.concat(root))
            .join("g");

            node.filter(d => d === root ? d.parent : d.children)
                .attr("cursor", "pointer")
                .on("click", (event, d) => d === root ? zoomout(root) : zoomin(d));

            node.append("title")
                .text(d => `${name(d)}\n${d3.format(",d")(d.value)}`);

            node.append("rect")
                .attr("id", d => (d.leafUid = d3.select("leaf")).id)    
                .attr("stroke", "#fff")
                .attr("fill", d => d === root ? "#fff" : d.children ? color(Math.random()) : color(Math.random()));

                /* limit color
                .style("fill", function (d) {
                    if (d.item.text == "InProgress") {
                        return "#2DD7EB"
                    } else if (d.item.text == "Signed Off") {
                        return "#3CEB2D"
                    } else if (d.item.text == "Pending") {
                        return "#F55431"
                    }  
                */

            node.append("clipPath")
                .attr("id", d => (d.clipUid = d3.select).id)
                .append("use")
                .attr("xlink:href", d => d.leafUid.href);

            function rootName(d){
                if(d === root){
                    return (d.data.name + " - " + d.value).split(/(.+)/g);
                }else{
                    return d.data.name.split(/(.+)/g).concat(d3.format(",d")(d.value));
                }
            }

            node.append("text")
                .attr("clip-path", d => d.clipUid)
                .attr("font-weight", d => d === root ? "bold" : null)
                //.attr("font-size", "1.5em")
                .selectAll("tspan")
                .data(d => rootName(d))
                .join("tspan")
                .attr("x", 3)
                .attr("y", (d, i, nodes) => `${(i === nodes.length - 1) * 0.3 + 1.1 + i * 0.9}em`)
                .attr("fill-opacity", (d, i, nodes) => i === nodes.length - 1 ? 0.7 : null)
                .attr("font-weight", (d, i, nodes) => i === nodes.length - 1 ? "normal" : null)
                .text(d => d)

            group.call(position, root);
        }

        function position(group, root) {
            group.selectAll("g")
                .attr("transform", d => d === root ? `translate(0,-30)` : `translate(${x(d.x0)},${y(d.y0)})`)
                .select("rect")
                .attr("width", d => d === root ? width : x(d.x1) - x(d.x0))
                .attr("height", d => d === root ? 30 : y(d.y1) - y(d.y0));
        }

        // When zooming in, draw the new nodes on top, and fade them in.
        function zoomin(d) {
            const group0 = group.attr("pointer-events", "none");
            const group1 = group = svg.append("g").call(render, d);

            x.domain([d.x0, d.x1]);
            y.domain([d.y0, d.y1]);

            svg.transition()
                .duration(750)
                .call(t => group0.transition(t).remove()
                .call(position, d.parent))
                .call(t => group1.transition(t)
                .attrTween("opacity", () => d3.interpolate(0, 1))
                .call(position, d));
        }

        // When zooming out, draw the old nodes on top, and fade them out.
        function zoomout(d) {
            const group0 = group.attr("pointer-events", "none");
            const group1 = group = svg.insert("g", "*").call(render, d.parent);

            x.domain([d.parent.x0, d.parent.x1]);
            y.domain([d.parent.y0, d.parent.y1]);

            svg.transition()
                .duration(750)
                .call(t => group0.transition(t).remove()
                .attrTween("opacity", () => d3.interpolate(1, 0))
                .call(position, d))
                .call(t => group1.transition(t)
                .call(position, d.parent));
        }

        return svg.node();
    }    

    barChart(){        
        var str = '[{"name": "Test 0","value": 84},{"name": "Test 1","value": 54},{"name": "Test 2","value": 13},{"name": "Test 3","value": 20},{"name": "Test 4","value": 83},{"name": "Test 5","value": 73},{"name": "Test 6","value": 87},{"name": "Test 7","value": 39},{"name": "Test 8","value": 75},{"name": "Test 9","value": 61},{"name": "Test 10","value": 1}]';
        var _self = this;
        var data = JSON.parse(str);
        var height = _self.svgHeight;
        var width = _self.svgWidth; 
        var margin = ({top: 20, right: 0, bottom: 30, left: 40});
                  
        var x = d3
            .scaleBand()
            .domain(data.map(d => d.name))
            .range([margin.left, width - margin.right])
            .padding(0.1);
        
        var y = d3
            .scaleLinear()
            .domain([0, d3.max(data, d => d.value)])
            .nice()
            .range([height - margin.bottom, margin.top]);

        var color = _self.colorA();
        
        function xAxis(g){
            g.attr("transform", `translate(0,${height - margin.bottom})`)
            .call(d3.axisBottom(x).tickSizeOuter(0));
        }

        function yAxis(g){
            g.attr("transform", `translate(${margin.left},0)`)
                .call(d3.axisLeft(y))
                .call(g => g.select(".domain").remove());
        }
        
        function zoom(svg) {
            const extent = [
            [margin.left, margin.top],
            [width - margin.right, height - margin.top]
            ];
        
            svg.call(
            d3
                .zoom()
                .scaleExtent([1, 8])
                .translateExtent(extent)
                .extent(extent)
                .on("zoom", zoomed)
            );
        
            function zoomed(event) {
                x.range(
                    [margin.left, width - margin.right].map(d => event.transform.applyX(d))
                );

                svg.selectAll(".bars rect")
                    .attr("x", d => x(d.name))
                    .attr("width", x.bandwidth());
                svg.selectAll(".x-axis").call(xAxis);
            }
        }
        
        const svg = d3.select(_self.template.querySelector('svg.d3'))
                    .attr("viewBox", [0, 0, width, height])
                    .call(zoom);
        
        svg.append("g")
            .attr("class", "bars")
            .selectAll("rect")
            .data(data)
            .join("rect")
            .attr("x", d => x(d.name))
            .attr("y", d => y(d.value))
            .attr("height", d => y(0) - y(d.value))
            .attr("width", x.bandwidth())
            .attr("fill", function(d, i) { return color[(i % _self.colorL())];});
        
        svg.append("g")
            .attr("class", "x-axis")
            .call(xAxis);
        
        svg.append("g")
            .attr("class", "y-axis")
            .call(yAxis);

        return svg.node();
    }

    indentTree(){
        var _self = this;
        var dataStr = '{ "name": "Accounts", "children": [ {"name" : "Test Account 3","children" : [ {"name" : "First3 Last3","children" : [ {"value" : "360000.00","name" : "00000102"} ]} ]}, {"name" : "Test Account 2","children" : [ {"name" : "First22 Last22","children" : [ {"value" : "180000.00","name" : "00000103"} ]}, {"name" : "First2 Last2"}, {"name" : "TestFirst2 TestLast2","children" : [ {"value" : "130000.00","name" : "00000101"},{"value" : "50000.00","name" : "00000999"},{"value" : "6000.00","name" : "45000101"} ]} ]}, {"name" : "Test Account","children" : [ {"name" : "First1 Last1","children" : [ {"value" : "125000.00","name" : "00000104"} ]}, {"name" : "TestFirst TestLast","children" : [ {"value" : "165000.00","name" : "00000100"} ]} ]} ]}';
        var data = JSON.parse(dataStr);
        var height = _self.svgHeight;
        var width = _self.svgWidth;
        var format = d3.format(",");

        var i = 0;
        var root = d3.hierarchy(data).eachBefore(d => (d.index = i++));
        console.log('Root');
        console.log(root);

        const nodes = root.descendants();
        console.log('Nodes');
        console.log(nodes);

        //Dynamic node size to fit chosen chart height
        const nodeSize = height / nodes.length;
        var color = _self.colorA();

        //(nodes.length + 1) * nodeSize
        const svg = d3.select(_self.template.querySelector('svg.d3'))
            .attr("viewBox", [
            0,
            0,
            width,
            height
            ])
            .attr("font-family", "sans-serif")
            .attr("font-size", 10)
            .style("overflow", "visible");
            /*
                .attr("viewBox", [
            -nodeSize / 2,
            (-nodeSize * 3) / 2,
            width,
            (nodes.length + 1) * nodeSize
            ])
            */

        const link = svg
            .append("g")
            .attr("fill", "none")
            .attr("stroke", "#999")
            .selectAll("path")
            .data(root.links())
            .join("path")
            .attr(
            "d",
            d => `
                M${d.source.depth * nodeSize},${d.source.index * nodeSize}
                V${d.target.index * nodeSize}
                h${nodeSize}
            `
            );

        const node = svg
            .append("g")
            .selectAll("g")
            .data(nodes)
            .join("g")
            .attr("transform", d => `translate(0,${d.index * nodeSize})`);

        node.append("circle")
            .attr("cx", d => d.depth * nodeSize)
            .attr("r", function(){ return nodeSize / 10; })
            .attr("fill", function(d, i) { 
                return color[i];
            });

        node.append("text")
            .attr("dy", "0.32em")
            .attr("x", d => d.depth * nodeSize + 6)
            .text(d => d.data.name);

        node.append("title").text(d =>d.ancestors()
                                        .reverse()
                                        .map(d => d.data.name)
                                        .join("/")
        );

        var columns = [
            {
            label: "Size",
            value: d => d.value,
            format,
            x: 280
            },
            {
            label: "Count",
            value: d => (d.children ? 0 : 1),
            format: (value, d) => (d.children ? format(value) : "-"),
            x: 340
            }
        ];

        for (const { label, value, format, x } of columns) {
            svg.append("text")
            .attr("dy", "0.32em")
            .attr("y", -nodeSize)
            .attr("x", x)
            .attr("text-anchor", "end")
            .attr("font-weight", "bold")
            .text(label);

            node.append("text")
            .attr("dy", "0.32em")
            .attr("x", x)
            .attr("text-anchor", "end")
            .attr("fill", function(d, i) { return color[i];})
            .data(
                root
                .copy()
                .sum(value)
                .descendants()
            )
            .text(d => format(d.value, d));
        }

        return svg.node();    
    }
/*
    tidyTree(){
        var s = '{ "name": "Accounts", "children": [ {"name" : "Test Account 3","children" : [ {"name" : "First3 Last3","children" : [ {"value" : "360000.00","name" : "00000102"} ]} ]}, {"name" : "Test Account 2","children" : [ {"name" : "First22 Last22","children" : [ {"value" : "180000.00","name" : "00000103"} ]}, {"name" : "First2 Last2"}, {"name" : "TestFirst2 TestLast2","children" : [ {"value" : "130000.00","name" : "00000101"},{"value" : "50000.00","name" : "00000999"},{"value" : "6000.00","name" : "45000101"} ]} ]}, {"name" : "Test Account","children" : [ {"name" : "First1 Last1","children" : [ {"value" : "125000.00","name" : "00000104"} ]}, {"name" : "TestFirst TestLast","children" : [ {"value" : "165000.00","name" : "00000100"} ]} ]} ]}';
        var data = d3.jsonParse(s);
        var height = this.svgHeight;
        var width = this.svgWidth;

        tree = data => {
            const root = d3.hierarchy(data);
            root.dx = 10;
            root.dy = width / (root.height + 1);
            return d3.tree().nodeSize([root.dx, root.dy])(root);
        };

        const root = tree(data);

        let x0 = Infinity;
        let x1 = -x0;
        root.each(d => {
            if (d.x > x1) x1 = d.x;
            if (d.x < x0) x0 = d.x;
        });

        const svg = d3.select(this.template.querySelector('svg.d3'))
            .attr('width', width)
            .attr('height', height)
            .attr('viewBox', [0, 0, width, x1 - x0 + root.dx * 2]);

        const g = svg.append('g')
            .attr('font-family', 'sans-serif')
            .attr('font-size', 10)
            .attr('transform', `translate(${root.dy / 3},${root.dx - x0})`);

        const link = g
            .append('g')
            .attr('fill', 'none')
            .attr('stroke', '#555')
            .attr('stroke-opacity', 0.4)
            .attr('stroke-width', 1.5)
            .selectAll('path')
            .data(root.links())
            .join('path')
            .attr(
            'd',
            d3
                .linkHorizontal()
                .x(d => d.y)
                .y(d => d.x)
            );

        const node = g
            .append('g')
            .attr('stroke-linejoin', 'round')
            .attr('stroke-width', 3)
            .selectAll('g')
            .data(root.descendants())
            .join('g')
            .attr('transform', d => `translate(${d.y},${d.x})`);

        node
            .append('circle')
            .attr('fill', d => (d.children ? '#555' : '#999'))
            .attr('r', 2.5);

        node
            .append('text')
            .attr('dy', '0.31em')
            .attr('x', d => (d.children ? -6 : 6))
            .attr('text-anchor', d => (d.children ? 'end' : 'start'))
            .text(d => d.data.name)
            .clone(true)
            .lower()
            .attr('stroke', 'white');

        return svg.node();
    }
*/

    lineChart(){
        var _self = this;
        var height = _self.svgHeight;
        var width = _self.svgWidth;
        var margin = ({top: 20, right: 30, bottom: 30, left: 40});

        //Generate dummy data
        var str = [];
        str.push('[');
        for(var z = 0; z< 12; z++){
            for(var i = 0; i < 30; i++){
                str.push('{"date": "');
                var q = i + 1;
                var g = z + 1;
                str.push(g.toString());
                str.push('/');
                str.push(q.toString());
                str.push('/2021",');
                str.push('"value":"');
                var n = Math.round(((Math.random() * 100) + Number.EPSILON) * 100) / 100;
                str.push(n.toString());
                if(i == 29 && z == 11){
                    str.push('"}]');
                }else{
                    str.push('"},');
                }
            }
        }
        str = str.join('');

        var data = JSON.parse(str);
        var parseTime = d3.timeParse("%m/%d/%Y");

        var line = d3.line()
                .defined(d => !isNaN(d.value))
                .x(d => x(parseTime(d.date)))
                .y(d => y(d.value));

        var x = d3.scaleUtc()
                .domain(d3.extent(data, function(d) { return parseTime(d.date); }))
                .range([margin.left, width - margin.right]);

        var y = d3.scaleLinear()
                .domain([0, d3.max(data, d => d.value)]).nice()
                .range([height - margin.bottom, margin.top]);
        
        function xAxis(g){
            g.attr("transform", `translate(0,${height - margin.bottom})`).call(d3.axisBottom(x).ticks(width / 80).tickSizeOuter(0));
        }

        function yAxis(g){
            g.attr("transform", `translate(${margin.left},0)`)
            .call(d3.axisLeft(y))
            .call(g => g.select(".domain").remove())
            .call(g => g.select(".tick:last-of-type text").clone()
                .attr("x", 3)
                .attr("text-anchor", "start")
                .attr("font-weight", "bold")
                .text(data.y));
        }
        
        var svg = d3.select(_self.template.querySelector('svg.d3'))
                    .attr("viewBox", [0, 0, width, height]);

        svg.append("g")
            .call(xAxis);
      
        svg.append("g")
            .call(yAxis);

            
        const max = d3.max(data, function(d) { return +d.value; });
        var gradient = function(){
            var a = [];
            console.log('max:', max);
            console.log('length:', _self.colorL());
            var l = _self.colorL();
            var ca = _self.colorA();
            var step = max / l;
            for(var i = 0; i < l; i++){
                var per = (i + 1) * step;
                a.push({offset: per.toString() + '%', color: ca[i]});
            }
            console.log('gradient:', a);
            return a;
        }
        
        svg.append("linearGradient")
            .attr("id", "line-gradient")
            .attr("gradientUnits", "userSpaceOnUse")
            .attr("x1", 0)
            .attr("y1", y(0))
            .attr("x2", 0)
            .attr("y2", y(max))
            .selectAll("stop")
              .data(gradient())
            .enter().append("stop")
              .attr("offset", function(d) { return d.offset; })
              .attr("stop-color", function(d) { return d.color; });
      
        svg.append("path")
            .datum(data)
            .attr("fill", "none")
            .attr("stroke", "url(#line-gradient)")
            .attr("stroke-width", function() { return height * 0.003;})
            .attr("stroke-linejoin", "round")
            .attr("stroke-linecap", "round")
            .attr("d", line);

        svg.append("rect")
            .attr("class", "overlay")            
            .attr("fill", "none")
            .attr("width", width)
            .attr("height", height)
            .on("mouseover", function() {
                focus.style("display", null);
            })
            .on("mouseout", function() {
                focus.style("display", "none");
            })
            .on("mousemove", mousemove);
    
        function mousemove() {
            var x0 = x.invert(d3.mouse(this)[0]),
                i = bisectDate(data, x0, 1),
                d0 = data[i - 1],
                d1 = data[i],
                d = x0 - d0.date > d1.date - x0 ? d1 : d0;
            focus.attr("transform", "translate(" + x(d.date) + "," + y(d.value) + ")");
            focus.select("text").text(d.value).append("tspan").attr("x", 10).attr("dy", "1.5em").text(d3.timeFormat("%Y-%b-%d")(d.date));
            var bbox = focus.select("text").node().getBBox();
            rect.attr("width", bbox.width + 4).attr("height", bbox.height + 4);
        }
      
        return svg.node();
    }
}
