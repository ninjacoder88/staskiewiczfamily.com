$(document).ready(function(){
    function Calendar(){
        const self = this;
        const now = new Date();
        const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

        self.calendarMonth = ko.observable(now.getMonth());
        self.calendarYear = ko.observable(now.getFullYear());
        self.weeks = ko.observableArray([]);
        self.monthYear = ko.computed(function(){
            return `${monthNames[self.calendarMonth()]} ${self.calendarYear()}`;
        });

        function getDaysInMonth(month, year){
            switch(month){
                case 3://april
                case 5://june
                case 8://september
                case 10://november
                    return 30;
                case 1://february
                    if(year % 4 === 0){
                        if(year % 100 === 0){
                            if(year % 400 === 0){
                                return 29;
                            }
                            return 28;
                        }
                        return 29;
                    }
                    return 28;
                default:
                    return 31;
            }
        }

        function getWeeksInMonth(daysInMonth, startDay){
            switch(daysInMonth){
                case 28:
                    if(startDay === 0){
                        return 4;
                    }
                    return 5;
                case 29:
                    return 5;
                case 30:
                    if(startDay === 6){
                        return 6;
                    }
                    return 5;
                case 31:
                    if(startDay === 5 || startDay === 6){
                        return 6;
                    }
                    return 5;
            }
        }

        function updateWeeks(){
            const firstOfMonth = new Date(self.calendarYear(), self.calendarMonth(), 1);
            const firstDayOfMonth = firstOfMonth.getDay();
            const daysInMonth = getDaysInMonth(self.calendarMonth(), self.calendarYear());
            const weeksInMonth = getWeeksInMonth(daysInMonth, firstDayOfMonth);

            self.weeks([]);
            let day = 1;
            for(var w = 0; w < weeksInMonth; w++){
                const days = [];
                for(var d = 0; d < 7; d++){
                    if(w === 0 && d < firstDayOfMonth){
                        days.push({dayOfMonth: ""});
                    } else {
                        if(day > daysInMonth){
                            days.push({dayOfMonth: ""});
                        } else {
                            days.push({dayOfMonth: day++});
                        }
                    }
                }
                self.weeks.push({days: days});
            }
        }

        self.initialize = function(){
            updateWeeks();
        };

        self.nextMonth = function(){
            const current = self.calendarMonth();
            if(current === 11){
                self.calendarMonth(0); 
                self.calendarYear(self.calendarYear() + 1);
                updateWeeks();
                return;
            }
            self.calendarMonth(current + 1);
            updateWeeks();
        };

        self.previousMonth = function(){
            const current = self.calendarMonth();
            if(current === 0){
                self.calendarMonth(11); 
                self.calendarYear(self.calendarYear() - 1);
                updateWeeks();
                return;
            }
            self.calendarMonth(current - 1);
            updateWeeks();
        };

        self.initialize();
    }

    function FamilyTree(){
        const self = this;
        const data = {name: "sophie", children: [
            {name: "lou", children: []},
            {name: "rich (suzie)", children: [
                {name: "kenny (beth)", children: []},
                {name: "wendy", children: []}
            ]},
            {name: "thersea (tony)", children: [
                {name: "ray (joann)", children: [
                    {name: "justin ()", children: []},
                    {name: "alisha ()", children: []}
                ]},
                {name: "russ (lorie)", children: []},
                {name: "roger (wendy)", children: [
                    {name: "grant", children: []},
                    {name: "grace", children: []}
                ]},
                {name: "regina", children: []}
            ]},
            {name: "marge (tom)", children: [
                {name: "joann", children: []},
                {name: "chris (mickell)", children: [
                    {name: "virginia", children: []},
                    {name: "victoria", children: []}
                ]},
                {name: "tommy", children: []}
            ]},
            {name: "jim (lyn)", children: [
                {name: "jill", children: []},
                {name: "jenna", children: []}
            ]},
            {name: "frank (jean)", children: [
                {name: "frank", children: []},
                {name: "kim", children: []},
                {name: "greg", children: []}
            ]},
            {name: "joe (lucy)", children: []},
            {name: "ed (nancy)", children: []},
            {name: "dorthy", children: []},
            {name: "mary (ed)", children: []},
            {name: "rita", children: []},
            {name: "phyllis", children: []},
            {name: "barbara jean", children: []},
        ]};
        //{name: "", children: []}
        const width = 500;
        const dy = width / 6;
        const dx = 10;
        const margin = {top: 10, right: 120, bottom: 10, left: 40};
        const tree = d3.tree().nodeSize([dx, dy]);
        const diagonal = d3.linkHorizontal().x(d => d.y).y(d => d.x);

        const root = d3.hierarchy(data);
        root.x0 = dy / 2;
        root.y0 = 0;
        root.descendants().forEach((d, i) => {
            d.id = i;
            d._children = d.children;
            if(d.depth && d.data.name.length !== 7){
                d.children = null;
            }
        });

        const svg = d3.create("svg").attr("viewBox", [-margin.left, -margin.top, width, dx]).style("font", "10px sans-serif").style("user-select", "none");
        const gLink = svg.append("g").attr("fill", "none").attr("stroke", "#555").attr("stroke-opactity", 0.4).attr("style-width", 1.5);
        const gNode = svg.append("g").attr("cursor", "pointer").attr("pointer-events", "all");

        function update(source){
            const duration = d3.event && d3.event.altKey ? 2500 : 250;
            const nodes = root.descendants().reverse();
            const links = root.links();

            // Compute the new tree layout.
            tree(root);

            let left = root;
            let right = root;
            root.eachBefore(node => {
                if (node.x < left.x) left = node;
                if (node.x > right.x) right = node;
            });

            const height = right.x - left.x + margin.top + margin.bottom;

            const transition = svg.transition()
                .duration(duration)
                .attr("viewBox", [-margin.left, left.x - margin.top, width, height])
                .tween("resize", window.ResizeObserver ? null : () => () => svg.dispatch("toggle"));

            // Update the nodes…
            const node = gNode.selectAll("g").data(nodes, d => d.id);

            // Enter any new nodes at the parent's previous position.
            const nodeEnter = node.enter().append("g")
                .attr("transform", d => `translate(${source.y0},${source.x0})`)
                .attr("fill-opacity", 0)
                .attr("stroke-opacity", 0)
                .on("click", (event, d) => {
                    d.children = d.children ? null : d._children;
                    update(d);
                });

            nodeEnter.append("circle")
                .attr("r", 2.5)
                .attr("fill", d => d._children ? "#555" : "#999")
                .attr("stroke-width", 10);

            nodeEnter.append("text")
                .attr("dy", "0.31em")
                .attr("x", d => d._children ? -6 : 6)
                .attr("text-anchor", d => d._children ? "end" : "start")
                .text(d => d.data.name)
            .clone(true).lower()
                .attr("stroke-linejoin", "round")
                .attr("stroke-width", 3)
                .attr("stroke", "white");

            // Transition nodes to their new position.
            const nodeUpdate = node.merge(nodeEnter).transition(transition)
                .attr("transform", d => `translate(${d.y},${d.x})`)
                .attr("fill-opacity", 1)
                .attr("stroke-opacity", 1);

            // Transition exiting nodes to the parent's new position.
            const nodeExit = node.exit().transition(transition).remove()
                .attr("transform", d => `translate(${source.y},${source.x})`)
                .attr("fill-opacity", 0)
                .attr("stroke-opacity", 0);

            // Update the links…
            const link = gLink.selectAll("path")
            .data(links, d => d.target.id);

            // Enter any new links at the parent's previous position.
            const linkEnter = link.enter().append("path")
                .attr("d", d => {
                    const o = {x: source.x0, y: source.y0};
                    return diagonal({source: o, target: o});
                });

            // Transition links to their new position.
            link.merge(linkEnter).transition(transition)
                .attr("d", diagonal);

            // Transition exiting nodes to the parent's new position.
            link.exit().transition(transition).remove()
                .attr("d", d => {
                const o = {x: source.x, y: source.y};
                return diagonal({source: o, target: o});
                });

            // Stash the old positions for transition.
            root.eachBefore(d => {
                d.x0 = d.x;
                d.y0 = d.y;
            });
        }

        update(root);

        return svg.node();
    }

    function IndexViewModel(){
        const self = this;
        self.view = ko.observable("home");
        self.calendar = new Calendar();
        self.familyTree = new FamilyTree();

        self.homeVisible = ko.computed(function(){
            return self.view() === "home";
        });
        self.calendarVisible = ko.computed(function(){
            return self.view() === "calendar";
        });
        self.galleryVisible = ko.computed(function(){
            return self.view() === "gallery";
        });
        self.familyTreeVisible = ko.computed(function(){
            return self.view() === "familytree";
        });
        
        self.showHome = function(){
            self.view("home");
        };

        self.showCalendar = function(){
            self.view("calendar");
        };

        self.showGallery = function(){
            self.view("gallery");
        };

        self.showFamilyTree = function(){
            self.view("familytree");
            document.getElementById("familytree").appendChild(self.familyTree);
        };
    };

    ko.applyBindings(new IndexViewModel(), document.getElementById("application"));
});