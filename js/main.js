window.requestAnimFrame = (function () {
    return window.requestAnimationFrame ||
        window.webkitCancelAnimationFrame ||
        window.mozRequestAnimationFrame ||
        window.oRequestAnimationFrame ||
        window.msRequestAnimationFrame ||
        function (callback) {
            window.setTimeout(callback, 1000 / 60);
        };
})();

window.onload = function () {
    const WINDOW = {
        LEFT: -5,
        BOTTOM: -5,
        WIDTH: 10,
        HEIGHT: 10,
        CENTER: new Point(0, 0, 0),
        CAMERA: new Point(0, -20, -80)
    }

    let canPrint = {
        points: false,
        edges: false,
        polygons: true
    };

    const ZOOM_OUT = 1.1;
    const ZOOM_IN = 0.9;

    const sur = new Surfaces;
    const canvas = new Canvas({ width: 570, height: 570, WINDOW, callbacks: { wheel, mouseup, mousedown, mouseleave, mousemove } });
    const graph3D = new Graph3D({ WINDOW });
    const ui = new UI({ callbacks: { move, printPoints, printEdges, printPolygons } });

    // сцена
    const SCENE =  [
        sur.sphere(0.9, WINDOW.CENTER, '#FFE000'), // sun
        sur.sphere(0.1, new Point(0, 0, -1.2), '#808080', {rotateOy: WINDOW.CENTER, speed: 2}),//mercury
        sur.sphere(0.2, new Point(0, 0, -2), '#FF8000', {rotateOy: WINDOW.CENTER, speed: 1}),//venera
        sur.sphere(0.2, new Point(0, 0, -3.5), '#4241FF', {rotateOy: WINDOW.CENTER, speed: 0.5}),//earth
        sur.sphere(0.08, new Point(0, 0, -4.5), '#4241FF', {rotateOy: WINDOW.CENTER, rotateOz:(0, 0, -3.5),  speed: 0.1}),// luna
        sur.sphere(0.1, new Point(0, 0, -5.0), '#AA0000', {rotateOy: WINDOW.CENTER, speed: 0.2}),//mars
        sur.sphere(0.5, new Point(0, 0, -7), '#FF9000', {rotateOy: WINDOW.CENTER, speed: 0.1}),//upiter
        sur.sphere(0.35, new Point(0, 0, -9), '#FFA000', {rotateOy: WINDOW.CENTER, speed: 0.03}),//saturn
        sur.bublik(0.5, 0.6, 0.1, new Point(0, 0, -9), '#909090', xy = 2, {rotateOy: WINDOW.CENTER, speed: 0.03}),
        sur.sphere(0.24, new Point(0, 0, -11), '#4241FF', {rotateOy: WINDOW.CENTER, speed: 0.012}),//PREPARE URANUS
        sur.sphere(0.24, new Point(0, 0, -13), '#000088', {rotateOy: WINDOW.CENTER, speed: 0.0088}),//neptun
        //sur.bublik(3,4,1,new Point(), "#FF0000", xy = 2)
    ]; 
    SCENE.push(sur.sphere(0.05, new Point(0, -0.03, -3.8), '#808080', {rotateOy: WINDOW.CENTER, rotateOx: SCENE[3].points[SCENE[3].points.length - 1],speed: 1}));
    const LIGHT = new Light(0, -10, 0, 150);

    let canRotate = false;
    // каллбэки //
    function wheel(event) {
        const delta = (event.wheelDelta > 0) ? ZOOM_OUT : ZOOM_IN;
        SCENE.forEach(subject => {
            subject.points.forEach(point => graph3D.zoom(delta, point))
            if(subject.animation){
                for(let key in subject.animation){
                    if (key === 'rotateOx' || key === 'rotateOy' || key === 'rotateOz'){
                        graph3D.zoom(delta, subject.animation[key]);
                    }
                }
            }
        });
    }

    //checkbox

    function printPoints(value) {
        canPrint.points = value;
    }
    function printEdges(value) {
        canPrint.edges = value;
    }
    function printPolygons(value) {
        canPrint.polygons = value;
    }

    function printAllPolygons() {
        if (canPrint.polygons) {
            const polygons = []
            SCENE.forEach(subject => {
                //graph3D.calcGorner(subject, WINDOW.CAMERA);//отсечение невидимых граней
                graph3D.calcDistance(subject, WINDOW.CAMERA, 'distance');//расстояние до камеры
                graph3D.calcDistance(subject, LIGHT, 'lumen'); // освещённость
                for (let i = 0; i < subject.polygons.length; i++) {
                    if (subject.polygons[i].visible) {
                        const polygon = subject.polygons[i];
                        const point1 = { x: graph3D.xS(subject.points[polygon.points[0]]), y: graph3D.yS(subject.points[polygon.points[0]]) };
                        const point2 = { x: graph3D.xS(subject.points[polygon.points[1]]), y: graph3D.yS(subject.points[polygon.points[1]]) };
                        const point3 = { x: graph3D.xS(subject.points[polygon.points[2]]), y: graph3D.yS(subject.points[polygon.points[2]]) };
                        const point4 = { x: graph3D.xS(subject.points[polygon.points[3]]), y: graph3D.yS(subject.points[polygon.points[3]]) };
                        let { r, g, b } = polygon.color;
                        const lumen = graph3D.calcIllumination(polygon.lumen, LIGHT.lumen);
                        r = Math.round(r * lumen);
                        g = Math.round(g * lumen);
                        b = Math.round(b * lumen);
                        polygons.push({
                            points: [point1, point2, point3, point4],
                            color: polygon.rgbToHex(r, g, b),
                            distance: polygon.distance
                        });
                    }
                }                
            });
            // отрисовка ВСЕХ полигонов
            polygons.sort((a, b) => b.distance - a.distance);
            polygons.forEach(polygon => 
                canvas.polygon(polygon.points, polygon.color));
        }
    }

    //cb

    function mouseup() {
        canRotate = false;
    }
    function mouseleave() {
        mouseup();
    }
    function mousedown() {
        canRotate = true;
    }

    function mousemove(event) {
        if (canRotate) {
            if (event.movementX) {
                const alpha = canvas.sx(event.movementX) * 20 / WINDOW.CAMERA.z;
                SCENE.forEach(subject => {
                    subject.points.forEach(point => graph3D.rotateOy(alpha, point));
                    if(subject.animation){
                        for(let key in subject.animation){
                            if (key === 'rotateOx' || key === 'rotateOy' || key === 'rotateOz'){
                                graph3D.rotateOy(alpha, subject.animation[key]);
                            }
                        }
                    }
                });
            }
            if (event.movementY) {
                const alpha = canvas.sy(event.movementY) * 20 / -WINDOW.CAMERA.z;
                SCENE.forEach(subject => {
                    subject.points.forEach(point => graph3D.rotateOx(-alpha, point));
                    if(subject.animation){
                        for(let key in subject.animation){
                            if (key === 'rotateOx' || key === 'rotateOy' || key === 'rotateOz'){
                                graph3D.rotateOx(-alpha , subject.animation[key]);
                            }
                        }
                    }
                });
            }
        }
    }

    function move(direction) {
        if (direction === 'up' || direction === 'down') {
            const delta = (direction === 'up') ? -0.3 : 0.3;
            SCENE.forEach(subject => subject.points.forEach(point => graph3D.moveOy(delta, point)));
        }
        if (direction === 'left' || direction === 'right') {
            const delta = (direction === 'right') ? 0.3 : -0.3;
            SCENE.forEach(subject => subject.points.forEach(point => graph3D.moveOx(delta, point)));
        }
    }


    function clear() {
        canvas.clear();
    }

    function printSubject(subject) {
        if (canPrint.edges) {
            for (let i = 0; i < subject.edges.length; i++) {
                const edge = subject.edges[i];
                const point1 = subject.points[edge.p1];
                const point2 = subject.points[edge.p2];
                canvas.line(graph3D.xS(point1), graph3D.yS(point1), graph3D.xS(point2), graph3D.yS(point2));
            }
        }
        if (canPrint.points) {
            for (let i = 0; i < subject.points.length; i++) {
                const points = subject.points[i]
                canvas.point(graph3D.xS(points), graph3D.yS(points), '#f00', 2);
            }
        }
    }

    function render() {
        clear();
        printAllPolygons();
        SCENE.forEach(subject => {
            printSubject(subject);
            //console.log(subject.points[400]);
        });
        canvas.text(-4.5, -4, `FPS: ${FPSout}`);
    }

    const interval = setInterval (() => {
       
    }, 1000);

    function animation() {
        SCENE.forEach(subject => {
            if(subject.animation){
                for(let key in subject.animation){
                    //колдунство
                    if (key === 'rotateOx' || key === 'rotateOy' || key === 'rotateOz'){
                        const {x, y, z} = subject.animation[key];
                        const xn = WINDOW.CENTER.x - x;
                        const yn = WINDOW.CENTER.y - y;
                        const zn = WINDOW.CENTER.z - z;
                        subject.points.forEach(point => graph3D.move(xn, yn, zn, point));
                        //вращение объекта
                        const alpha = Math.PI/180 * subject.animation.speed * 3;
                        subject.points.forEach(point => graph3D[key](-alpha, point));
                        //обратное колднуство
                        subject.points.forEach(point => graph3D.move(-xn, -yn, -zn, point));
                    }
                }
            }
        });
    }

    setInterval(animation, 30);
    
    let FPS = 0;
    let FPSout = 0;
    let timestamp = (new Date()).getTime();
    (function animloop() {
        //считаем фпс 
        FPS++;
        const currentTimestamp = (new Date()).getTime();
        if (currentTimestamp - timestamp >= 1000) {
            timestamp = currentTimestamp;
            FPSout = FPS;
            FPS = 0;
        }
        //рисуем сцену
        render();
        requestAnimFrame(animloop);
    })()
}