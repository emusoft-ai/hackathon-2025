/* ============================================
   ABOUT SECTION - INTERACTIVE ROTATION WHEEL
   --------------------------------------------
   - Continuous clockwise rotation
   - Drag / touch interaction with momentum
   - Works even if image path or markup changes
   ============================================ */

(function() {
    'use strict';

    var SELECTOR = '#section-about .plexus-structure-wrapper';
    var IMAGE_SELECTOR = 'img.about-3d-rotate-clockwise, img.plexus-img-processed, img';

    function ready(callback) {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', callback, { once: true });
        } else {
            callback();
        }
    }

    function clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    }

    function initWheel() {
        var wrapper = document.querySelector(SELECTOR);
        if (!wrapper) {
            console.warn('[about-wheel] Wrapper not found');
            return;
        }

        var image = wrapper.querySelector(IMAGE_SELECTOR);
        if (!image) {
            console.warn('[about-wheel] Image not found inside wrapper');
            return;
        }

        var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        // Otomatik dönüş hızı (derece / saniye)
        var baseSpeed = prefersReducedMotion ? 15 : 35; // deg / s
        var rotation = 0;
        var currentVelocity = baseSpeed;
        var dragging = false;
        var lastPointerX = 0;
        var lastPointerY = 0;
        var pointerId = null;
        var userControlActive = false;
        // Baz değerler (touch için daha yüksek hassasiyet, mouse için daha düşük)
        var dragSensitivityX = prefersReducedMotion ? 0.5 : 1.05;
        var dragSensitivityY = prefersReducedMotion ? -0.35 : -0.7;
        var maxVelocity = prefersReducedMotion ? 4 : 10;
        var isMouseDrag = false;
        var highEnergyThreshold = baseSpeed * 18;
        var friction = prefersReducedMotion ? 0.985 : 0.972;
        var reverseFriction = prefersReducedMotion ? 0.94 : 0.92;
        var settleEase = prefersReducedMotion ? 0.025 : 0.045;
        var minVelocitySnap = 0.0005;
        var lastTime = null;
        var centerX = 0;
        var centerY = 0;
        var lastDragAngle = null; // radians
        var lastDragTime = 0;
        var velocitySamples = [];

        function setRotation(value) {
            rotation = value;
            image.style.transform = 'rotate(' + rotation + 'deg)';
        }

        function setDirectionData() {
            wrapper.dataset.spinDirection = currentVelocity >= 0 ? 'cw' : 'ccw';
        }

        function applyEnergyGlow() {
            var highEnergy = userControlActive && Math.abs(currentVelocity) > highEnergyThreshold;
            if (highEnergy) {
                wrapper.classList.add('wheel-impulse');
                image.classList.add('wheel-spin-impulse');
            } else if (!dragging) {
                wrapper.classList.remove('wheel-impulse');
                image.classList.remove('wheel-spin-impulse');
            }
        }

        function animate(timestamp) {
            if (lastTime === null) {
                lastTime = timestamp;
                requestAnimationFrame(animate);
                return;
            }

            var deltaSeconds = (timestamp - lastTime) / 1000;
            if (deltaSeconds <= 0) {
                requestAnimationFrame(animate);
                return;
            }
            lastTime = timestamp;

            if (!dragging) {
                if (userControlActive) {
                    // İnertial rotation: kullanıcıdan kalan açısal hızla dön
                    rotation += currentVelocity * deltaSeconds;
                    setRotation(rotation);
                    setDirectionData();
                    applyEnergyGlow();

                    // Sürtünme ile yavaşlat
                    currentVelocity *= friction;
                    var absVel = Math.abs(currentVelocity);
                    var absBase = Math.abs(baseSpeed);

                    // Yeterince yavaşladığında otomatik hıza easing ile dön
                    if (absVel < absBase * 0.5) {
                        currentVelocity += (baseSpeed - currentVelocity) * settleEase;
                        if (Math.abs(currentVelocity - baseSpeed) < minVelocitySnap) {
                            currentVelocity = baseSpeed;
                            userControlActive = false;
                            wrapper.classList.remove('wheel-impulse');
                            image.classList.remove('wheel-spin-impulse');
                        }
                    }
                } else {
                    // Varsayılan sabit saat yönü dönüşü
                    rotation += baseSpeed * deltaSeconds;
                    setRotation(rotation);
                    setDirectionData();
                }
            }

            requestAnimationFrame(animate);
        }

        // Drag başlangıcı: otomatik dönüşü durdur ve açı tabanlı kontrolü başlat
        function startDrag(event) {
            if (dragging) return;

            dragging = true;
            pointerId = event.pointerId != null ? event.pointerId : null;
            wrapper.style.cursor = 'grabbing';
            image.style.transition = 'none';

            // Merkez noktasını hesapla (angle için)
            var rect = wrapper.getBoundingClientRect();
            centerX = rect.left + rect.width / 2;
            centerY = rect.top + rect.height / 2;

            // Başlangıç açısı ve zaman
            var startTime = event.timeStamp || performance.now();
            lastDragTime = startTime;
            lastDragAngle = Math.atan2(event.clientY - centerY, event.clientX - centerX);
            velocitySamples = [];

            // Otomatik dönüşü hemen durdur
            currentVelocity = 0;
            userControlActive = false;

            wrapper.classList.add('wheel-impulse');
            image.classList.add('wheel-spin-impulse');

            // Pointer Event yolunda hareket/bitirme olaylarını dinle
            if ('PointerEvent' in window) {
                try {
                    if (pointerId != null && wrapper.setPointerCapture) {
                        wrapper.setPointerCapture(pointerId);
                    }
                } catch (e) {}
                window.addEventListener('pointermove', onPointerMove);
                window.addEventListener('pointerup', endDrag);
                window.addEventListener('pointercancel', endDrag);
            }
        }

        // Drag sırasında açıya göre döndür ve açısal hız örnekleri topla
        function handleDragSample(clientX, clientY, timeStamp) {
            if (!dragging) return;

            var t = timeStamp || performance.now();
            var angle = Math.atan2(clientY - centerY, clientX - centerX);

            if (lastDragAngle === null) {
                lastDragAngle = angle;
                lastDragTime = t;
                return;
            }

            var deltaAngle = angle - lastDragAngle;
            // -PI .. PI aralığına normalize et
            if (deltaAngle > Math.PI) {
                deltaAngle -= Math.PI * 2;
            } else if (deltaAngle < -Math.PI) {
                deltaAngle += Math.PI * 2;
            }

            var deltaDeg = deltaAngle * (180 / Math.PI);
            rotation += deltaDeg;
            setRotation(rotation);
            setDirectionData();
            applyEnergyGlow();

            var dt = (t - lastDragTime) / 1000;
            if (dt > 0) {
                var instVelocity = deltaDeg / dt; // deg / s
                velocitySamples.push(instVelocity);
                if (velocitySamples.length > 6) {
                    velocitySamples.shift();
                }
            }

            lastDragAngle = angle;
            lastDragTime = t;
        }

        function onPointerMove(event) {
            if (!dragging) return;
            if (pointerId != null && event.pointerId !== pointerId) return;
            handleDragSample(event.clientX, event.clientY, event.timeStamp);
        }

        function endDrag(event) {
            if (!dragging) return;
            if (pointerId != null && event && event.pointerId !== pointerId) return;
            dragging = false;

            // Son örneklerden açısal hız tahmini (deg / s)
            if (velocitySamples.length > 0) {
                var sum = 0;
                for (var i = 0; i < velocitySamples.length; i++) {
                    sum += velocitySamples[i];
                }
                currentVelocity = clamp(sum / velocitySamples.length, -maxVelocity, maxVelocity);
                userControlActive = true;
            } else {
                currentVelocity = baseSpeed;
                userControlActive = false;
            }

            if (pointerId !== null) {
                try {
                    wrapper.releasePointerCapture(pointerId);
                } catch (err) {
                    // ignore
                }
            }
            pointerId = null;
            lastDragAngle = null;

            wrapper.style.cursor = 'grab';
            image.style.transition = 'transform 0.2s ease-out';

            if ('PointerEvent' in window) {
                window.removeEventListener('pointermove', onPointerMove);
                window.removeEventListener('pointerup', endDrag);
                window.removeEventListener('pointercancel', endDrag);
            }

            setDirectionData();
        }

        function onMouseMove(event) {
            if (!dragging) return;
            handleDragSample(event.clientX, event.clientY, event.timeStamp);
        }

        function onMouseUp() {
            if (!dragging) return;
            endDrag({});
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onMouseUp);
        }

        function onTouchMove(event) {
            if (!dragging || !event.touches || !event.touches.length) return;
            var touch = event.touches[0];
            handleDragSample(touch.clientX, touch.clientY, event.timeStamp);
        }

        function onTouchEnd() {
            if (!dragging) return;
            endDrag({});
            window.removeEventListener('touchmove', onTouchMove);
            window.removeEventListener('touchend', onTouchEnd);
            window.removeEventListener('touchcancel', onTouchEnd);
        }

        function bindEvents() {
            wrapper.classList.add('interactive-wheel');
            wrapper.style.cursor = 'grab';
            wrapper.style.userSelect = 'none';
            wrapper.style.webkitUserSelect = 'none';

            image.style.animation = 'none';
            image.style.transition = 'transform 0.2s ease-out';

            var supportsPointerEvents = 'PointerEvent' in window;

            if (supportsPointerEvents) {
                // Modern tarayıcılar için pointer event yolu
                wrapper.addEventListener('pointerdown', function(event) {
                    if (event.button !== undefined && event.button !== 0) return;
                    startDrag(event);
                });
            } else {
                // Eski desktop / mobil tarayıcılar için mouse + touch fallback
                wrapper.addEventListener('mousedown', function(event) {
                    if (event.button !== undefined && event.button !== 0) return;
                    // Mouse drag
                    event.pointerType = 'mouse';
                    isMouseDrag = true;
                    startDrag(event);
                    window.addEventListener('mousemove', onMouseMove);
                    window.addEventListener('mouseup', onMouseUp);
                });

                wrapper.addEventListener('touchstart', function(event) {
                    if (!event.touches || !event.touches.length) return;
                    var touch = event.touches[0];
                    // Touch drag
                    var normalizedEvent = {
                        clientX: touch.clientX,
                        clientY: touch.clientY,
                        pointerType: 'touch'
                    };
                    isMouseDrag = false;
                    startDrag(normalizedEvent);
                    window.addEventListener('touchmove', onTouchMove, { passive: false });
                    window.addEventListener('touchend', onTouchEnd);
                    window.addEventListener('touchcancel', onTouchEnd);
                }, { passive: false });
            }

            wrapper.addEventListener('contextmenu', function(event) {
                event.preventDefault();
            });
        }

        bindEvents();
        requestAnimationFrame(animate);

        console.info('[about-wheel] Interactive wheel initialized');
    }

    ready(initWheel);
})();

