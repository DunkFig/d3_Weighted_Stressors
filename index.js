let sheetData, length
let stressorsString = ''

//This is the array of colors that we will use in the wordcloud
var myColors = ['#011f4b', '#03396c', '#005b96', '#6497b1'];

// the stop words that we do nto need to include in the wordcloud, tweak to your liking. 
let stopwords = new Set("i,me,my,myself,we,us,our,ours,ourselves,you,your,yours,yourself,yourselves,he,him,his,himself,she,her,hers,herself,it,its,itself,they,them,their,theirs,themselves,what,which,who,whom,whose,this,that,these,those,am,is,are,was,were,be,been,being,have,has,had,having,do,does,did,doing,will,would,should,can,could,ought,i'm,you're,he's,she's,it's,we're,they're,i've,you've,we've,they've,i'd,you'd,he'd,she'd,we'd,they'd,i'll,you'll,he'll,she'll,we'll,they'll,isn't,aren't,wasn't,weren't,hasn't,haven't,hadn't,doesn't,don't,didn't,won't,wouldn't,shan't,shouldn't,can't,cannot,couldn't,mustn't,let's,that's,who's,what's,here's,there's,when's,where's,why's,how's,a,an,the,and,but,if,or,because,as,until,while,of,at,by,for,with,about,against,between,into,through,during,before,after,above,below,to,from,up,upon,down,in,out,on,off,over,under,again,further,then,once,here,there,when,where,why,how,all,any,both,each,few,more,most,other,some,such,no,nor,not,only,own,same,so,than,too,very,say,says,said,shall".split(","))



async function getData() {
    const response = await fetch(appURL);
    const initialdata = await response.json();
    length = initialdata.length

    // Go through the Google Sheet data and add all of the stressor entries to one large string. 
    for (let i = 0; i < length; i++) {
        stressorsString += ' '
        stressorsString += initialdata[i].Stressors
    }

    // clean the string
    let cleanedString = stressorsString.split(/[\s.]+/g)
        .map(w => w.replace(/^[“‘"\-—()\[\]{}]+/g, ""))
        .map(w => w.replace(/[;:.!?()\[\]{},"'’”\-—]+$/g, ""))
        .map(w => w.replace(/['’]s$/g, ""))
        .map(w => w.substring(0, 30))
        .map(w => w.toLowerCase())
        .filter(w => w && !stopwords.has(w))

    console.log(cleanedString);

    // take the cleaned string and use it to create the word cloud.
    WordCloud(cleanedString, {
        width: 1000,
        height: 600
    })
}

function WordCloud(text, {
    // Here are the parameters for the word cloud
    size = group => group.length,
    word = d => d,
    marginTop = 0,
    marginRight = 0,
    marginBottom = 0,
    marginLeft = 0,
    width = 640,
    height = 400,
    maxWords = 250,
    fontFamily = "sans-serif",
    fontScale = 15,
    fill = null,
    padding = 10,
    rotate = 0,
    invalidation
} = {}) {


    const words = typeof text === "string" ? text.split(/\W+/g) : Array.from(text);

    //This uses the color Scale.
    var colorScale = d3.scaleOrdinal(myColors); 

    // This is where we count up the amount of times a word is used and give it a weight and size based on that
    const data = d3.rollups(words, size, w => w)
        .sort(([, a], [, b]) => d3.descending(a, b))
        .slice(0, maxWords)
        .map(([key, size]) => ({ text: word(key), size }));

    //adding the svg to the div that will hold our wordcloud
    const svg = d3.select("#my_dataviz").append("svg")
        .attr("viewBox", [0, 0, width, height])
        .attr("width", width)
        .attr("height", height)
        .attr("font-family", fontFamily)
        .attr("text-anchor", "middle")
        .style("max-width", "100%")
        .style("height", "auto");
        

    // Changes the background of the D3 data cloud, I set this to be the same color as the Page.
    svg.append("rect")
        .attr("width", "100%")
        .attr("height", "100%")
        .attr("fill", "#98D1F2");

    
    const g = svg.append("g")
        .attr("transform", `translate(${width / 2},${height / 2})`);

// the actual addition of the word cloud. 
const cloud = d3.layout.cloud()
    .size([width, height])
    .words(data)
    .padding(padding)
    .rotate(rotate)
    .font(fontFamily)
    .fontSize(d => Math.sqrt(d.size) * fontScale)
    .on("end", words => {
        const textElements = g.selectAll("text")
            .data(words)
            .enter()
            .append("text")
            .style("font-size", d => `${d.size}px`)
            .style("fill", function (d, i) { return colorScale(i); })
            .attr("text-anchor", "middle")
            // Start with text elements slightly offset downwards (you can change the Y offset as you like).
            .attr("transform", d => `translate(${d.x}, ${d.y + 10})`)
            .text(d => d.text)
            .style("opacity", 0); // Initial opacity is set to 0 to create the fade-in effect.

        // Apply the transition for both opacity and transform attributes.
        textElements.transition()
            .duration(d => d.size * 100) // Duration based on size, adjust the multiplier as needed.
            .style("opacity", 1) // Transition to full opacity.
            .attr("transform", d => `translate(${d.x}, ${d.y})`); // End at the actual position.
    });

cloud.start();
invalidation && invalidation.then(() => cloud.stop());
}



