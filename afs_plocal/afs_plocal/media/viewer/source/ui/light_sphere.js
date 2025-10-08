define([], function() {

    const LEFT_MOUSE = 1;

    class LigthControllerSphere {
        constructor(canvas) {
            this.canvas = canvas;
            this.width = this.canvas.width;
            this.height = this.canvas.height;

            this.context = this.canvas.getContext("2d");
            this.setupGradient();
            this.drawLightCircle(this.width / 2, this.height / 2);
            this.setupEventListeners();
            this.isDuringDrag = false;
            this.onLightDirectionChanged = (x, y) => {};
        }

        setupGradient() {
            this.gradient = this.context.createRadialGradient(
                this.width / 2, this.height / 2, 0, 
                this.width / 2, this.height / 2, this.width / 2
            );
            
            this.gradient.addColorStop(0, '#F0F6FF');    
            this.gradient.addColorStop(0.05, '#E8F2FF');   
            this.gradient.addColorStop(0.12, '#D8EBFF');   
            this.gradient.addColorStop(0.25, '#C0DDFF');  
            this.gradient.addColorStop(0.45, '#5CACFF');   
            this.gradient.addColorStop(0.75, '#0059b3');   
            this.gradient.addColorStop(1, '#081421');    
        }

        setupEventListeners() {
            const rect = this.canvas.getBoundingClientRect();

            const positionInCanvas = (clickX, clickY) => {
                const clickPosX = clickX - rect.left;
                const clickPosY = clickY - rect.top;
                return [clickPosX, clickPosY];
            };

            const positionInSphere = (clickX, clickY) => {
                const [canvasX, canvasY] = positionInCanvas(clickX, clickY);
                const sphereX = canvasX - this.width / 2;
                const sphereY = canvasY - this.height / 2;
                return [sphereX, sphereY];
            };

            const positionBoundedToSphere = (clickX, clickY) => {
                const [sphereX, sphereY] = positionInSphere(clickX, clickY);
                const radius = Math.sqrt(sphereX * sphereX + sphereY * sphereY);
                let ratio = (this.width / 2) / radius;
                ratio = ratio < 1 ? ratio : 1;
                const boundedX = this.width / 2 + sphereX * ratio;
                const boundedY = this.height / 2 + sphereY * ratio;
                return [boundedX, boundedY];
            };

            const normalizeCoords = (clickX, clickY) => {
                const normalizedX = 2 * (clickX / this.width - 0.5);
                const normalizedY = 2 * (0.5 - clickY / this.height)
                return [normalizedX, normalizedY];
            };

            const handleInteraction = (x, y) => {
                const [circleX, circleY] =  positionBoundedToSphere(x, y);
                const [normalizedX, normalizedY] = normalizeCoords(circleX, circleY);
                this.drawLightCircle(circleX, circleY);
                this.onLightDirectionChanged(normalizedX, normalizedY);
            }

            const onMouseMove = (event) => {
                if (!this.isDuringDrag) {
                    return;
                }
                handleInteraction(event.clientX, event.clientY);
            };

            const onMouseUp = (event) => {
                this.isDuringDrag = false;
                document.removeEventListener('mousemove', onMouseMove);
                document.removeEventListener('mouseup', onMouseUp);
                handleInteraction(event.clientX, event.clientY);
            };
            
            this.canvas.addEventListener("mousedown", (event) => {
                const buttons = event.buttons;
                if (buttons !== LEFT_MOUSE) {
                    return;
                }
                this.isDuringDrag = true;
                document.addEventListener('mousemove', onMouseMove);
                document.addEventListener('mouseup', onMouseUp);
            });

            const onTouchMove = (event) => {
                if (!this.isDuringDrag) {
                    return;
                }
                event.preventDefault();
                const touch = event.touches[0];
                handleInteraction(touch.clientX, touch.clientY);
            };

            const onTouchEnd = (event) => {
                this.isDuringDrag = false;
                document.removeEventListener('touchmove', onTouchMove, { passive: false });
                document.removeEventListener('touchend', onTouchEnd, { passive: false });
                event.preventDefault();
                const touch = event.changedTouches[0];
                handleInteraction(touch.clientX, touch.clientY);
            };

            this.canvas.addEventListener('touchstart', (event) => {
                const touch = event.touches[0];
                this.isDuringDrag = true;
                document.addEventListener('touchmove', onTouchMove, { passive: false });
                document.addEventListener('touchend', onTouchEnd, { passive: false });
                event.preventDefault(); 
                handleInteraction(touch.clientX, touch.clientY);
            }, { passive: false });
        }

        drawSphere() {
            this.context.beginPath();
            this.context.arc(this.width / 2, this.height / 2, this.width / 2, 0, 2 * Math.PI);
            this.context.fillStyle = this.gradient;
            this.context.fill();

            this.context.fillStyle = this.highlight;
            this.context.fill();
        }

        drawHandle(x, y) {
            this.context.save();

            this.context.shadowColor = 'rgba(0, 0, 0, 0.5)';
            this.context.shadowBlur = 8;
            this.context.shadowOffsetX = 2; 
            this.context.shadowOffsetY = 2;

            this.context.beginPath();
            this.context.arc(x, y, this.width / 25, 0, 2 * Math.PI);
            this.context.fillStyle = 'rgba(255, 255, 255, 0.9)';
            this.context.fill();

            this.context.restore(); 
        }

        drawLightCircle(lightX, lightY) {
            this.context.clearRect(0, 0, this.width, this.height);
            this.drawSphere();
            this.drawHandle(lightX, lightY);
        }
    }

    function setupSphereGui(canvas) {
        return new LigthControllerSphere(canvas);
    }

    return {
        setupSphereGui: setupSphereGui
    };
});