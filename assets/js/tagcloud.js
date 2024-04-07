function refreshTagCloud() {

    let ss = $(window).width();
    
    let w = document.getElementById('skills_icon_holder_parent').offsetWidth;
    let h = document.getElementById('skills_icon_holder_parent').offsetHeight;
    
    let wd = 500;
    let ht = 450;
    let fs = "0.8em";

    if (ss>966) {
        wd = w*0.9;
        ht = h*1.2;

    }
    else {
        wd = w*0.8;
        ht = w*0.8;

        if (ss < 481){
            fs = "0.8em";
        } 

        else {
            fs = "1em";
        }
    }

    //let w = document.getElementById('about_me_skills').offsetWidth;
        // variable definition: skills canvas
        var entries = [ 
            {label : 'HTML', url:'https://html.spec.whatwg.org/multipage/'},
            {label : 'CSS', url: 'https://developer.mozilla.org/en-US/docs/Web/CSS'},
            {label : 'JavaScript', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Language_Resources'},
            {label : 'Node.js', url: 'https://nodejs.org/en/docs/'},
            {label : 'Java', url: 'https://docs.oracle.com/en/java/'},
            {label : 'C++', url: 'https://en.cppreference.com/w/'},
            {label : 'C', url: 'https://fresh2refresh.com/c-programming/'},
            {label : 'Python', url: 'https://www.python.org/doc/'},
            {label : 'Express.js', url: 'https://expressjs.com/'},
            {label : 'React.js', url: 'https://reactjs.org/'},
            {label : 'Redux', url: 'https://redux.js.org/'},
            {label : 'PHP', url:'https://www.php.net/'},
            {label : 'SQL', url: 'https://docs.microsoft.com/en-us/sql/?view=sql-server-ver15'},
            {label : 'MongoDB', url: 'https://www.mongodb.com/'},
            {label : 'JSON', url: 'https://www.json.org/json-en.html'},
            {label : 'JQuery', url: 'https://jquery.com/'},
            {label : 'C#', url: 'https://docs.microsoft.com/en-us/dotnet/csharp/'},
            {label : 'Unity', url: 'https://unity.com/'},
            {label : 'Jupyter', url: 'https://jupyter.org/'},
            {label : 'Visual Studio', url: 'https://visualstudio.microsoft.com/'},
            {label : 'Git', url: 'https://git-scm.com/doc'},
            {label : 'Eclipse', url: 'https://www.eclipse.org/'}
        ];
    
        var icon_entries = [
            { image: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/javascript/javascript-plain.svg', width: '50', height: '50', target: '_top' },
            { image: './img/Umbrella.png', width: '50', height: '50', url: 'http://niklasknaack.de/', target: '_top' },
            { image: './img/Umbrella.png', width: '50', height: '50', url: 'http://niklasknaack.de/', target: '_top' },
            { image: './img/Umbrella.png', width: '50', height: '50', url: 'http://niklasknaack.de/', target: '_top' },
            { image: './img/Umbrella.png', width: '50', height: '50', url: 'http://niklasknaack.de/', target: '_top' },
            { image: './img/Umbrella.png', width: '50', height: '50', url: 'http://niklasknaack.de/', target: '_top' },
            { image: './img/Umbrella.png', width: '50', height: '50', url: 'http://niklasknaack.de/', target: '_top' },
            { image: './img/Umbrella.png', width: '50', height: '50', url: 'http://niklasknaack.de/', target: '_top' },
            { image: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/express/express-original.svg', width: '50', height: '50', url: '#', target: '_top', tooltip: 'Express.js' },
    
        ];
    
        var settings = {
            entries: entries,
            width: wd,
            height: ht,
            radius: '80%',
            radiusMin: 60,
            bgDraw: true,
            bgColor: '#0D1830',
            opacityOver: 1.00,
            opacityOut: 0.2,
            opacitySpeed: 6,
            fov: 600,
            speed:0.2,
            fontFamily: 'Optima, Courier, serif',
            fontSize: fs,
            fontColor: 'rgba(255, 31, 165, 1)',
            fontWeight: 'bold',
            fontStyle: 'normal',
            fontStretch: 'ultra-condensed',
            fontToUpperCase: false
        };

       
        //svg3DTagCloud = new SVG3DTagCloud( document.getElementById( 'skills_icon_holder2'  ), settings );
        $('#skills_icon_holder2').svg3DTagCloud(settings);
};

$(document).ready(refreshTagCloud);