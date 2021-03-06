class JoyDivision{
    constructor(props){
        this.state = {
            lineColor: props && props.lineColor ? props.lineColor : '#ffffff',
            linesCount: props && props.linesCount ? props.linesCount : 50,
            lineWidth: props && props.lineWidth ? props.lineWidth : 1.5,
            background: props && props.background ? props.background : '#000000',            
            pointsCount: props && props.pointsCount ? props.pointsCount : 200,
            renderTime: props && props.renderTime ? props.renderTime : 1000,
            frames: props && props.frames ? props.frames : 60,
            smooth: props && props.smooth ? props.smooth : 0,
            canvas: (props && props.selector && document.querySelector(props.selector)) ? 
                    document.querySelector(props.selector) : 
                    false,
            offset: {
                top: (props && props.offset && props.offset.top) ? props.offset.top : 130,
                left: (props && props.offset && props.offset.left) ? props.offset.left : 0,
                right: (props && props.offset && props.offset.right) ? props.offset.right : 0,
                bottom: (props && props.offset && props.offset.bottom) ? props.offset.bottom : 0,
            },
            size: {
                width: (props && props.size && props.size.width) ? props.size.width : 470,
                height: (props && props.size && props.size.height) ? props.size.height : 570,
            },            
            noiseСoefficient: {
                low: (props && props.noiseСoefficient && props.noiseСoefficient.low) ? props.noiseСoefficient.low : 8,
                middle: (props && props.noiseСoefficient && props.noiseСoefficient.middle) ? props.noiseСoefficient.middle : 50
            },
            points: []
        }
        this.intervals = {};
        this.init();
    }   

    renderBackground(){
        let {background, context, canvas} = this.state;
        canvas.width = canvas.clientWidth;
        canvas.height = canvas.clientHeight;
        context.fillStyle = background;
        context.fillRect(0, 0, canvas.width, canvas.height)
    }

    calcRect(){
        let {
                canvas, 
                offset, 
                size
            } = this.state,
            xStart = (canvas.clientWidth <= size.width) ? 10 : (canvas.clientWidth - size.width) / 2,
            yStart = (canvas.clientHeight <= size.height) ? 10 : (canvas.clientHeight - size.height) / 2;
        this.setState({
            rect: {
                x: {
                    start: xStart + offset.left,
                    end: canvas.clientWidth - xStart + offset.right
                },
                y: {
                    start: yStart + offset.top,
                    end: canvas.clientHeight - yStart + offset.bottom
                }
            }
        })
    }

    renderPoints(){
        let {
            context,
            points,
            background,
            lineColor,
            lineWidth
        } = this.state;
        context.fillStyle = background;
        context.strokeStyle = lineColor;
        context.lineWidth = lineWidth;
        
        for (let  i = 0; i < points.length; i++) {
            context.beginPath();
            let row = points[i];
            context.moveTo(row[0].x, row[0].y);
            for (let  j = 0; j < row.length; j++) {
                let col = row[j];
                context.lineTo(col.x, col.y);
            }
            context.fill();
            context.stroke();
        }
    }

    smoothPoints(points, smooth){
        return new Promise((resolve, reject) => {
            for(let k = 0; k <= smooth; k++){
                for (let i = 0; i < points.length; i++) {
                    let row = points[i];
                    for (let  j = 0; j < row.length; j++) {
                        let current = row[j],
                            prev = row[j - 1],
                            next = row[j + 1];
                        points[i][j].y = (prev && next) ?
                            this.smoothPoint(
                                prev.y, 
                                current.y, 
                                next.y)
                            :   
                            points[i][j].y;
                        if(
                                k === smooth && 
                                i === points.length-1 && 
                                j === row.length - 1
                            ){
                            resolve(points);
                        }
                    }
                }
            }
        });
    }

    smoothPoint(prev, current, next){
        return (prev +current+next) / 3;
    }

    generateData(){
        return new Promise((resolve, reject) => {
            this.calcRect();
            let {
                linesCount, 
                pointsCount, 
                rect
            } = this.state,
            points = [],
            pointPeriod = (rect.x.end - rect.x.start) / pointsCount,
            linePeriod = (rect.y.end - rect.y.start) / linesCount,
            x = rect.x.start,
            y = rect.y.start;
            for (let  i = 0; i < linesCount; i++) {
                let row = []
                for (let j = 0; j < pointsCount; j++) {
                    let noiseddY = y - this.calcNoise(j, pointsCount);
                    row.push({
                        x:x,
                        y:noiseddY
                    });
                    x = x + pointPeriod;
                }
                x = rect.x.start;
                y = y + linePeriod;
                points.push(row);
            }
            resolve(points);
        });
    }

    calcNoise(x, points){
        let {noiseСoefficient} = this.state,
            y = Math.random() * noiseСoefficient.low,
            activePointStart = Math.floor(points / 3.5),
            activePointEnd = activePointStart * 2.5;
        if(x > activePointStart && x < activePointEnd){
            let random = Math.random();
            random = random > 0.995 ? random * 8 : 1;
            y = (Math.random()) * noiseСoefficient.middle * random;
        }      
        return y;
    }

    setState(props, callback){
        for(let item in props){
            this.state[item] = props[item];
        }
        callback && callback();
    }

    initContext(){
        let {canvas} = this.state;
        this.setState({
            context: canvas.getContext('2d')
        });
    }

    clearCanvas() {
        let {context, canvas} = this.state,
            width = canvas.width;
        context.clearRect(0, 0, canvas.width, canvas.height);
        canvas.width = 1;
        canvas.width = width;
    }

    init(){
        let {canvas} = this.state;
        if(!canvas){
            throw Error('Canvas not found');
        }
        window.addEventListener('resize', this.resize.bind(this));
        this.initContext();
        this.build();       
    }

    resize(){
        this.reBuild();
    }

    reBuild(){
        this.build();
    }

    doItTimes(func, times = 1){
        return new Promise((resolve, reject) => {
            for(let i = 0; i < times; i++){
                func && func();
                if(i >= times) resolve();                
            }
        })
    }

    firstSmooth(){
        let {smooth, points} = this.state;
        return this.smoothPoints(points, smooth).then((points) => {
            this.setState({
                points: points
            })
        })
    }

    build(){
        for(let interval in this.intervals){
            clearInterval(this.intervals[interval]);
        }
        this.generateData().then((points) => {
            this.setState({
                points: points
            });
            this.firstSmooth().then(() => {
                this.render();
                this.tick();
            });
        });
    }

    runPolymorph(){
        let self = this;
        let {
                renderTime, 
                frames
            } = this.state,
            keyframeTime = renderTime / frames,
            renderedTime = 0,
            timeStamp = +new Date();
            this.intervals[timeStamp] = setInterval(() => {
                renderedTime += keyframeTime;
                this.runPolymorphTick(keyframeTime);
                if(renderTime <= renderedTime){
                    this.tick();
                    clearInterval(this.intervals[timeStamp]);
                }
            }, keyframeTime);
    }

    runPolymorphTick(keyframeTime){
        let {
            futurePoints,
            oldPoints,
            points
        } = this.state;
        for(let i = 0; i < points.length; i++) {
            for (let  j = 0; j < points[i].length; j++) {
                let current = points[i][j].y,
                    old = oldPoints[i][j].y,
                    future = futurePoints[i][j].y;
                points[i][j].y += (future - old) / keyframeTime;
                if(
                        i === points.length-1 && 
                        j === points[i].length - 1
                    ){
                    this.setState({
                        points: points
                    }, () => {
                        this.render();
                    });
                }
            }
        }
    }

    tick(){
        let {smooth} = this.state;
        this.generateData().then((points) => {
            this.smoothPoints(points, smooth).then((points) => {
                this.setState({
                    futurePoints: points,
                    oldPoints: this.state.points
                }, () => {
                    this.runPolymorph();
                });
            })         
        });
    }

    render(){
        this.clearCanvas();
        this.renderBackground();        
        this.renderPoints();
    }
}

export default JoyDivision;